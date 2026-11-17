import { createHash } from "node:crypto";
import { validReceipt, receiptText } from "../src/domain.js";

const deliveries = new Map();
const inFlight = new Map();
function failure(message, status = 502, code = "TELEGRAM_UNAVAILABLE") {
  return Object.assign(new Error(message), { status, code });
}
export function getTelegramStatus(env = process.env) {
  return {
    configured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  };
}
export async function sendReceiptToTelegram(
  receipt,
  { env = process.env, fetchImpl = fetch, signal, timeoutMs = 8000 } = {},
) {
  if (!validReceipt(receipt))
    throw failure("Tasdiq ma’lumotlari to‘liq emas.", 400, "INVALID_RECEIPT");
  if (!getTelegramStatus(env).configured)
    throw failure("Telegram ulanishi hali sozlanmagan.", 503, "NOT_CONFIGURED");
  const key = createHash("sha256")
    .update(
      [
        env.TELEGRAM_CHAT_ID,
        receipt.id,
        receipt.tripId,
        receipt.name,
        receipt.cargo,
      ].join("\0"),
    )
    .digest("hex");
  const now = Date.now();
  for (const [id, time] of deliveries)
    if (now - time > 86400000) deliveries.delete(id);
  if (deliveries.has(key)) return { sent: true, alreadySent: true };
  if (inFlight.has(key)) return inFlight.get(key);
  const task = (async () => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetchImpl(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: receiptText(receipt),
            disable_web_page_preview: true,
            protect_content: true,
          }),
          signal: controller.signal,
        },
      );
      let data;
      try {
        data = await response.json();
      } catch {
        throw failure(
          "Telegram javobini o‘qib bo‘lmadi. Qayta urinib ko‘ring.",
        );
      }
      if (!response.ok || !data.ok) {
        if (response.status === 429 || data.error_code === 429)
          throw failure(
            "Telegram biroz kutishni so‘radi. Keyinroq qayta urinib ko‘ring.",
            429,
            "RATE_LIMITED",
          );
        if (
          [400, 401, 403].includes(response.status) ||
          [400, 401, 403].includes(data.error_code)
        )
          throw failure(
            "Telegramga ulanishni tekshirish kerak. So‘rov tasdig‘i brauzerda saqlangan.",
            503,
            "TELEGRAM_CONFIGURATION",
          );
        throw failure(
          "Telegramga yuborilmadi. Qayta urinib ko‘rishingiz mumkin.",
        );
      }
      deliveries.set(key, Date.now());
      if (deliveries.size > 500)
        deliveries.delete(deliveries.keys().next().value);
      return { sent: true, alreadySent: false };
    } catch (error) {
      if (
        error.code?.startsWith("TELEGRAM") ||
        ["INVALID_RECEIPT", "NOT_CONFIGURED", "RATE_LIMITED"].includes(
          error.code,
        )
      )
        throw error;
      if (controller.signal.aborted)
        throw failure(
          "Telegram javobi kechikdi. Birozdan keyin qayta urinib ko‘ring.",
          504,
          "TELEGRAM_TIMEOUT",
        );
      throw failure(
        "Telegram bilan aloqa uzildi. So‘rovingiz brauzerda saqlangan.",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  })();
  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}
