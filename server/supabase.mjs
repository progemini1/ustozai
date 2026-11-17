import { validReceipt } from "../src/domain.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export class SupabaseError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
    this.code = code;
  }
}
function publicKey(value) {
  if (typeof value !== "string") return "";
  const key = value.trim();
  if (
    key.length < 8 ||
    key.length > 8192 ||
    /\s/.test(key) ||
    key.startsWith("sb_secret_")
  )
    return "";
  if (JWT.test(key)) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
      );
      if (payload.role !== "anon") return "";
    } catch {
      return "";
    }
  }
  return key;
}
/** Public client configuration only; service-role and secret keys are rejected. */
export function getSupabaseConfig(env = process.env) {
  // Public browser configuration, protected by Auth + RLS. Runtime env overrides it.
  if(env===process.env)env={SUPABASE_URL:'https://nyfulxqqclkkiccnpyeo.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_jHkCuSxOiYuo1M5L8u65Mg_NMqNL8EX',...env};
  let url = "";
  try {
    const parsed = new URL(env.SUPABASE_URL || "");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
      (parsed.protocol === "https:" ||
        (local && parsed.protocol === "http:")) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      /^\/?$/.test(parsed.pathname)
    )
      url = parsed.origin;
  } catch {}
  const anonKey =
    publicKey(env.SUPABASE_ANON_KEY) || publicKey(env.SUPABASE_PUBLISHABLE_KEY);
  const configured = !!url && !!anonKey;
  return {
    url: configured ? url : "",
    anonKey: configured ? anonKey : "",
    configured,
  };
}
function tokenHeaders(token, env) {
  if (typeof token !== "string" || token.length > 8192 || !JWT.test(token))
    throw new SupabaseError(
      "Avval akkauntingizga kiring.",
      401,
      "AUTH_REQUIRED",
    );
  const config = getSupabaseConfig(env);
  if (!config.configured)
    throw new SupabaseError(
      "Akkaunt va bulut xotirasi hali ulanmagan.",
      503,
      "AUTH_NOT_CONFIGURED",
    );
  return {
    config,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
}
function safeText(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
function avatar(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
async function getJson(
  url,
  headers,
  { env = process.env, fetchImpl = globalThis.fetch, signal } = {},
) {
  const controller = new AbortController();
  let timer, abort;
  const requested = Number(env.SUPABASE_TIMEOUT_MS);
  const timeout =
    Number.isFinite(requested) && requested >= 20
      ? Math.min(requested, 8000)
      : 5000;
  const interrupted = new Promise((_, reject) => {
    abort = () => {
      controller.abort();
      reject(new SupabaseError("So‘rov bekor qilindi.", 499, "AUTH_CANCELLED"));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new SupabaseError(
          "Bulut xizmatidan javob kechikdi. Qayta urinib ko‘ring.",
          503,
          "AUTH_UNAVAILABLE",
        ),
      );
    }, timeout);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          try {
            await response.body?.cancel?.();
          } catch {}
          if (response.status === 401)
            throw new SupabaseError(
              "Sessiya eskirgan. Qayta kiring.",
              401,
              "AUTH_REQUIRED",
            );
          if (response.status === 403)
            throw new SupabaseError(
              "Bu ma’lumotga kirish huquqi yo‘q.",
              403,
              "AUTH_FORBIDDEN",
            );
          if (response.status === 404)
            throw new SupabaseError(
              "So‘rov topilmadi.",
              404,
              "RECEIPT_NOT_FOUND",
            );
          throw new SupabaseError(
            "Bulut xizmatiga hozir ulanib bo‘lmadi.",
            503,
            "AUTH_UNAVAILABLE",
          );
        }
        try {
          return await response.json();
        } catch {
          throw new SupabaseError(
            "Bulut javobini o‘qib bo‘lmadi.",
            503,
            "AUTH_UNAVAILABLE",
          );
        }
      })(),
      interrupted,
    ]);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError(
      "Bulut xizmatiga hozir ulanib bo‘lmadi.",
      503,
      "AUTH_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/** Verifies the JWT through Supabase Auth; decoded client claims are never trusted. */
export async function verifyUser(accessToken, options = {}) {
  const env = options.env || process.env;
  const { config, headers } = tokenHeaders(accessToken, env);
  if (options.signal?.aborted)
    throw new SupabaseError("So‘rov bekor qilindi.", 499, "AUTH_CANCELLED");
  const user = await getJson(config.url + "/auth/v1/user", headers, {
    ...options,
    env,
  });
  if (!user || !UUID.test(user.id))
    throw new SupabaseError(
      "Sessiyani tekshirib bo‘lmadi. Qayta kiring.",
      401,
      "AUTH_REQUIRED",
    );
  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};
  return {
    id: user.id,
    email: safeText(user.email, 320),
    displayName: safeText(metadata.full_name || metadata.name, 120),
    avatarUrl: avatar(metadata.avatar_url || metadata.picture),
  };
}

/** Uses the user's JWT and RLS, then checks the authenticated owner again. */
export async function getOwnedReceipt(id, accessToken, options = {}) {
  if (typeof id !== "string" || !UUID.test(id))
    throw new SupabaseError("So‘rov raqami noto‘g‘ri.", 400, "RECEIPT_INPUT");
  const env = options.env || process.env;
  const user = await verifyUser(accessToken, { ...options, env });
  const { config, headers } = tokenHeaders(accessToken, env);
  const url = new URL(config.url + "/rest/v1/requests");
  url.searchParams.set("id", "eq." + id);
  url.searchParams.set("user_id", "eq." + user.id);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");
  const rows = await getJson(url.href, headers, { ...options, env });
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || row.id !== id || row.user_id !== user.id)
    throw new SupabaseError(
      "So‘rov topilmadi yoki sizga tegishli emas.",
      404,
      "RECEIPT_NOT_FOUND",
    );
  const receipt = {
    id: row.id,
    userId: row.user_id,
    number: row.number,
    tripId: row.trip_id,
    name: row.name,
    cargo: row.cargo,
    createdAt: row.created_at,
  };
  if (!validReceipt(receipt))
    throw new SupabaseError(
      "Saqlangan so‘rov ma’lumoti to‘liq emas.",
      503,
      "RECEIPT_INVALID",
    );
  return receipt;
}
