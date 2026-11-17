import { getAiStatus } from "./ai.mjs";
import { runAgent } from "./agent.mjs";
import { getTelegramStatus, sendReceiptToTelegram } from "./telegram.mjs";
import { getSupabaseConfig, getOwnedReceipt } from "./supabase.mjs";

const buckets = new Map();
let activeAi = 0,
  activeTelegram = 0;
function reply(res, status, data, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  });
  res.end(JSON.stringify(data));
}
function take(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 2000)
    for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const entry = buckets.get(key);
  if (!entry || entry.until <= now) {
    buckets.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
async function readJson(req) {
  if (
    !(req.headers["content-type"] || "")
      .toLowerCase()
      .startsWith("application/json")
  )
    throw Object.assign(new Error("JSON so‘rov yuboring."), { status: 415 });
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 64000)
      throw Object.assign(new Error("So‘rov juda uzun."), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("So‘rov formati noto‘g‘ri."), {
      status: 400,
    });
  }
}
export async function handleApi(req, res, path) {
  if (path === "/api/config") {
    if (req.method !== "GET") {
      reply(res, 405, { error: "Bu usul qo‘llanmaydi." }, { Allow: "GET" });
      return;
    }
    reply(res, 200, { supabase: getSupabaseConfig() });
    return;
  }
  if (path === "/api/status") {
    if (req.method !== "GET") {
      reply(res, 405, { error: "Bu usul qo‘llanmaydi." }, { Allow: "GET" });
      return;
    }
    reply(res, 200, { ai: getAiStatus(), telegram: getTelegramStatus() });
    return;
  }
  if (!["/api/ai", "/api/telegram/receipt"].includes(path)) {
    reply(res, 404, { error: "Bu xizmat topilmadi." });
    return;
  }
  if (req.method !== "POST") {
    reply(res, 405, { error: "POST so‘rov yuboring." }, { Allow: "POST" });
    return;
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const localDev =
        !process.env.RENDER &&
        ["127.0.0.1:5173", "localhost:5173"].includes(originHost) &&
        ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          req.socket.remoteAddress,
        );
      if (originHost !== req.headers.host && !localDev) {
        reply(res, 403, { error: "Bu manbadan so‘rov qabul qilinmaydi." });
        return;
      }
    } catch {
      reply(res, 403, { error: "So‘rov manbasi noto‘g‘ri." });
      return;
    }
  }
  const forwarded =
    process.env.RENDER === "true"
      ? String(req.headers["x-forwarded-for"] || "")
          .split(",")
          .at(-1)
          ?.trim()
      : null;
  const ip = forwarded || req.socket.remoteAddress || "unknown";
  const ai = path === "/api/ai";
  if (
    !take(`${ai ? "ai" : "telegram"}:${ip}`, ai ? 12 : 4, 60000) ||
    !take(`global:${ai ? "ai" : "telegram"}`, ai ? 180 : 30, 3600000)
  ) {
    reply(
      res,
      429,
      { error: "Bir oz kuting, keyin qayta urinib ko‘ring." },
      { "Retry-After": "60" },
    );
    return;
  }
  if (ai ? activeAi >= 6 : activeTelegram >= 3) {
    reply(
      res,
      429,
      { error: "Xizmat band. Bir ozdan keyin qayta urinib ko‘ring." },
      { "Retry-After": "5" },
    );
    return;
  }
  const controller = new AbortController();
  const disconnect = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on("close", disconnect);
  try {
    const body = await readJson(req);
    if (!body || Array.isArray(body) || typeof body !== "object") {
      reply(res, 400, { error: "So‘rov formati noto‘g‘ri." });
      return;
    }
    if (ai) {
      activeAi++;
      try {
        reply(res, 200, await runAgent(body, { signal: controller.signal }));
      } finally {
        activeAi--;
      }
    } else {
      activeTelegram++;
      try {
        const token = String(req.headers.authorization || "").replace(
          /^Bearer\s+/i,
          "",
        );
        if (!getSupabaseConfig().configured) {
          reply(res, 503, {
            error:
              "Telegram yuborish uchun Google hisob va baza ulanishi kerak.",
          });
          return;
        }
        if (!token) {
          reply(res, 401, {
            error: "Telegramga yuborishdan oldin Google orqali kiring.",
          });
          return;
        }
        const receipt = await getOwnedReceipt(body.receipt?.id, token, {
          signal: controller.signal,
        });
        reply(
          res,
          200,
          await sendReceiptToTelegram(receipt, {
            signal: controller.signal,
          }),
        );
      } finally {
        activeTelegram--;
      }
    }
  } catch (error) {
    if (controller.signal.aborted) return;
    const status = [400, 401, 403, 404, 413, 415, 429, 502, 503, 504].includes(
      error.status,
    )
      ? error.status
      : 502;
    reply(res, status, {
      error: error.status
        ? error.message
        : "Xizmat bilan ulanishda xato. Qayta urinib ko‘ring.",
      code: error.code || "REQUEST_FAILED",
    });
  } finally {
    res.off("close", disconnect);
  }
}
