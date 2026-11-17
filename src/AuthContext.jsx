import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { validReceipt } from "./domain.js";

const AuthContext = createContext(null);
const TABLE = "requests";
const COLUMNS = "id,user_id,number,trip_id,name,cargo,created_at";
let sharedClient = null;
let sharedConfig = "";
const cloudMessage =
  "Bulutdagi ma’lumotlar bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring; mahalliy nusxangiz saqlanadi.";
async function timeout(task, ms = 18000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function fromRow(row) {
  return {
    id: row.id,
    number: row.number,
    tripId: row.trip_id,
    name: row.name,
    cargo: row.cargo,
    createdAt: row.created_at,
  };
}
function toRow(receipt, userId) {
  return {
    id: receipt.id,
    user_id: userId,
    number: receipt.number,
    trip_id: receipt.tripId,
    name: receipt.name.trim(),
    cargo: receipt.cargo.trim(),
    created_at: receipt.createdAt,
  };
}
const sortReceipts = (items) =>
  [...items]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 100);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [configError, setConfigError] = useState("");
  const [cloudSnapshot, setCloudSnapshot] = useState({
    owner: null,
    items: [],
  });
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const sessionRef = useRef(null);
  const mountedRef = useRef(true);
  const cloudRequestRef = useRef(0);
  const user = session?.user || null;
  const cloudReceipts =
    user && cloudSnapshot.owner === user.id ? cloudSnapshot.items : [];

  useEffect(() => {
    mountedRef.current = true;
    let active = true,
      subscription;
    const controller = new AbortController();
    const configTimer = setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const response = await fetch("/api/config", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("config");
        const value = await response.json();
        const config = value?.supabase;
        if (!active) return;
        if (
          !config?.configured ||
          typeof config.url !== "string" ||
          typeof config.anonKey !== "string" ||
          !config.anonKey
        ) {
          setConfigured(false);
          setLoading(false);
          return;
        }
        const url = new URL(config.url);
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error("config");
        const key = `${config.url}|${config.anonKey}`;
        if (!sharedClient || sharedConfig !== key) {
          sharedClient = createClient(config.url, config.anonKey, {
            auth: {
              flowType: "pkce",
              detectSessionInUrl: true,
              persistSession: true,
              autoRefreshToken: true,
            },
          });
          sharedConfig = key;
        }
        const supabase = sharedClient;
        setClient(supabase);
        setConfigured(true);
        let changeCount = 0;
        const { data } = supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            // Keep this callback synchronous. Queries run in a separate React effect.
            if (!active) return;
            changeCount += 1;
            sessionRef.current = nextSession;
            setSession(nextSession);
            setLoading(false);
            if (!nextSession) {
              cloudRequestRef.current += 1;
              setCloudSnapshot({ owner: null, items: [] });
              setCloudLoading(false);
              setCloudError("");
            }
          },
        );
        subscription = data.subscription;
        const before = changeCount;
        const result = await timeout(supabase.auth.getSession());
        if (!active) return;
        if (result.error) throw result.error;
        if (changeCount === before) {
          sessionRef.current = result.data.session;
          setSession(result.data.session);
        }
        setLoading(false);
      } catch {
        if (active) {
          setConfigError(
            "Hisobga ulanishni tekshirib bo‘lmadi. Sahifani qayta ochib urinib ko‘ring.",
          );
          setLoading(false);
        }
      } finally {
        clearTimeout(configTimer);
      }
    })();
    return () => {
      active = false;
      mountedRef.current = false;
      controller.abort();
      clearTimeout(configTimer);
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const request = ++cloudRequestRef.current;
    if (!client || !user?.id) {
      setCloudSnapshot({ owner: null, items: [] });
      setCloudLoading(false);
      setCloudError("");
      return;
    }
    const userId = user.id;
    setCloudLoading(true);
    setCloudError("");
    (async () => {
      try {
        const { data, error } = await timeout(
          client
            .from(TABLE)
            .select(COLUMNS)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(100),
        );
        if (error) throw error;
        const items = (data || []).map(fromRow);
        if (!items.every(validReceipt)) throw new Error("invalid");
        if (
          mountedRef.current &&
          request === cloudRequestRef.current &&
          sessionRef.current?.user.id === userId
        ) {
          setCloudSnapshot({ owner: userId, items });
          setCloudError("");
        }
      } catch {
        if (mountedRef.current && request === cloudRequestRef.current) {
          setCloudSnapshot((previous) =>
            previous.owner === userId ? previous : { owner: userId, items: [] },
          );
          setCloudError(cloudMessage);
        }
      } finally {
        if (mountedRef.current && request === cloudRequestRef.current)
          setCloudLoading(false);
      }
    })();
  }, [client, user?.id, refresh]);

  const retryCloud = useCallback(() => setRefresh((value) => value + 1), []);
  const signInWithGoogle = useCallback(async () => {
    if (!client || !configured)
      return {
        ok: false,
        error:
          "Google orqali kirish hozircha sozlanmagan. Qatnovlardan mehmon sifatida foydalanishingiz mumkin.",
      };
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Google sahifasini ochib bo‘lmadi. Qayta urinib ko‘ring.",
      };
    }
  }, [client, configured]);
  const signOut = useCallback(async () => {
    if (!client) return { ok: false, error: "Hisobga ulanish mavjud emas." };
    try {
      const { error } = await timeout(client.auth.signOut({ scope: "local" }));
      if (error) throw error;
      sessionRef.current = null;
      setSession(null);
      cloudRequestRef.current += 1;
      setCloudSnapshot({ owner: null, items: [] });
      setCloudError("");
      setCloudLoading(false);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          "Hisobdan chiqib bo‘lmadi. Internet aloqasini tekshirib qayta urinib ko‘ring.",
      };
    }
  }, [client]);

  const saveReceipt = useCallback(
    async (receipt) => {
      const userId = sessionRef.current?.user.id;
      if (!client || !userId)
        return {
          ok: false,
          error: "Bulutga saqlash uchun avval hisobingizga kiring.",
        };
      if (!validReceipt(receipt))
        return {
          ok: false,
          error:
            "So‘rov ma’lumotlari to‘liq emas. Ism, yuk va qatnovni tekshiring.",
        };
      try {
        const countResult = await timeout(
          client
            .from(TABLE)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        );
        if (countResult.error) throw countResult.error;
        if (countResult.count >= 100) {
          const existing = await timeout(
            client
              .from(TABLE)
              .select(COLUMNS)
              .eq("user_id", userId)
              .eq("id", receipt.id)
              .maybeSingle(),
          );
          if (existing.error) throw existing.error;
          if (!existing.data)
            return {
              ok: false,
              error:
                "Hisobda 100 ta so‘rov saqlangan. Yangi so‘rovning mahalliy nusxasini saqlang.",
            };
        }
        let { data, error } = await timeout(
          client
            .from(TABLE)
            .insert(toRow(receipt, userId))
            .select(COLUMNS)
            .single(),
        );
        if (error?.code === "23505") {
          const existing = await timeout(
            client
              .from(TABLE)
              .select(COLUMNS)
              .eq("user_id", userId)
              .eq("id", receipt.id)
              .maybeSingle(),
          );
          if (existing.error || !existing.data)
            throw existing.error || new Error("duplicate");
          const stored = fromRow(existing.data);
          if (
            stored.tripId !== receipt.tripId ||
            stored.name !== receipt.name.trim() ||
            stored.cargo !== receipt.cargo.trim() ||
            stored.number !== receipt.number
          )
            return {
              ok: false,
              error:
                "Shu raqam bilan boshqa so‘rov saqlangan. Asl nusxa o‘zgartirilmadi.",
            };
          data = existing.data;
          error = null;
        }
        if (error || !data) throw error || new Error("empty");
        const saved = fromRow(data);
        if (!validReceipt(saved)) throw new Error("invalid");
        if (sessionRef.current?.user.id !== userId)
          return {
            ok: false,
            error: "Hisob almashdi. So‘rovning mahalliy nusxasi saqlanadi.",
          };
        cloudRequestRef.current += 1;
        setCloudLoading(false);
        setCloudSnapshot((previous) => ({
          owner: userId,
          items: sortReceipts([
            saved,
            ...(previous.owner === userId ? previous.items : []).filter(
              (item) => item.id !== saved.id,
            ),
          ]),
        }));
        setCloudError("");
        return { ok: true, receipt: saved };
      } catch {
        if (mountedRef.current && sessionRef.current?.user.id === userId)
          setCloudError(cloudMessage);
        return {
          ok: false,
          error:
            "So‘rov bulutga saqlanmadi. Mahalliy nusxasini oling va qayta urinib ko‘ring.",
        };
      }
    },
    [client],
  );

  const importReceipts = useCallback(
    async (items) => {
      const userId = sessionRef.current?.user.id;
      if (!client || !userId)
        return {
          ok: false,
          error: "Nusxani hisobga saqlash uchun Google orqali kiring.",
        };
      if (
        !Array.isArray(items) ||
        !items.length ||
        items.length > 100 ||
        !items.every(validReceipt) ||
        new Set(items.map((item) => item.id)).size !== items.length
      )
        return {
          ok: false,
          error:
            "Nusxa formati to‘g‘ri emas. Mavjud so‘rovlar o‘zgartirilmadi.",
        };
      try {
        const existing = await timeout(
          client.from(TABLE).select(COLUMNS).eq("user_id", userId).limit(101),
        );
        if (existing.error) throw existing.error;
        const originals = (existing.data || []).map(fromRow);
        if (!originals.every(validReceipt)) throw new Error("invalid");
        const originalIds = new Set(originals.map((item) => item.id));
        const missing = items.filter((item) => !originalIds.has(item.id));
        if (originals.length + missing.length > 100)
          return {
            ok: false,
            error:
              "Nusxa qo‘shilganda 100 ta so‘rov chegarasidan oshadi. Mavjud so‘rovlar o‘zgartirilmadi.",
          };
        let inserted = [];
        if (missing.length) {
          const { data, error } = await timeout(
            client
              .from(TABLE)
              .insert(missing.map((item) => toRow(item, userId)))
              .select(COLUMNS),
          );
          if (error || !data || data.length !== missing.length)
            throw error || new Error("incomplete");
          inserted = data.map(fromRow);
          if (!inserted.every(validReceipt)) throw new Error("invalid");
        }
        if (sessionRef.current?.user.id !== userId)
          return {
            ok: false,
            error: "Hisob almashdi. Nusxa joriy oynaga qo‘shilmadi.",
          };
        const saved = sortReceipts([...originals, ...inserted]);
        cloudRequestRef.current += 1;
        setCloudLoading(false);
        setCloudSnapshot({ owner: userId, items: saved });
        setCloudError("");
        return { ok: true, receipts: saved, items: saved };
      } catch {
        if (mountedRef.current && sessionRef.current?.user.id === userId)
          setCloudError(cloudMessage);
        return {
          ok: false,
          error:
            "Nusxa bulutga saqlanmadi. Mavjud so‘rovlar o‘zgartirilmadi; qayta urinib ko‘ring.",
        };
      }
    },
    [client],
  );

  return (
    <AuthContext.Provider
      value={{
        client,
        user,
        session,
        loading,
        configured,
        configError,
        signInWithGoogle,
        signOut,
        cloudReceipts,
        cloudLoading: Boolean(
          user && (cloudSnapshot.owner !== user.id || cloudLoading),
        ),
        cloudError: user && cloudSnapshot.owner === user.id ? cloudError : "",
        saveReceipt,
        importReceipts,
        retryCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
