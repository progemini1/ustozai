import { TRIPS } from "./content.js";
export const tripById = (id) => TRIPS.find((t) => t.id === id);
export function filterTrips(destination = "Barchasi", query = "") {
  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[‘’ʻʼ`]/g, "'")
      .trim();
  const q = normalize(query);
  return TRIPS.filter(
    (t) =>
      (destination === "Barchasi" || t.to === destination) &&
      (!q ||
        normalize(`${t.id} ${t.from} ${t.to} ${t.date} ${t.time}`).includes(q)),
  );
}
export function validateRequest(name, cargo) {
  const errors = {};
  if (!String(name || "").trim()) errors.name = "Ismingizni kiriting.";
  else if (String(name).trim().length > 80)
    errors.name = "Ism 80 belgidan oshmasin.";
  if (!String(cargo || "").trim())
    errors.cargo = "Yukning qisqa tavsifini yozing.";
  else if (String(cargo).trim().length > 500)
    errors.cargo = "Tavsif 500 belgidan oshmasin.";
  return errors;
}
export const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
export const dateLabel = (date) => {
  const [day, month, year] = date.split(".");
  return `${Number(day)}-${MONTHS[Number(month) - 1]} ${year}`;
};
export function sortTrips(trips, direction = "early") {
  const key = (t) => t.date.split(".").reverse().join("") + t.time;
  return [...trips].sort(
    (a, b) => key(a).localeCompare(key(b)) * (direction === "late" ? -1 : 1),
  );
}
// Access to the property itself can throw in privacy-restricted browsers.
export function browserStorage(kind = "localStorage") {
  try {
    return window[kind];
  } catch {
    return undefined;
  }
}
export const draftKey = (tripId, userId) =>
  `yolchi.draft.${userId || "guest"}.${tripId}`;
export function loadDraft(tripId, userId) {
  try {
    const value = JSON.parse(
      browserStorage("sessionStorage")?.getItem(draftKey(tripId, userId)) ||
        "null",
    );
    return {
      name: typeof value?.name === "string" ? value.name.slice(0, 80) : "",
      cargo: typeof value?.cargo === "string" ? value.cargo.slice(0, 500) : "",
    };
  } catch {
    return { name: "", cargo: "" };
  }
}
export function receiptText(receipt) {
  const trip = tripById(receipt.tripId);
  if (!trip) return "";
  return `Yo‘lchi — so‘rov tasdig‘i\n${receipt.number}\nQatnov: ${trip.id}\n${trip.from} → ${trip.to}\nJo‘nash: ${trip.date}, ${trip.time}\nIsm: ${receipt.name}\nYuk: ${receipt.cargo}\n\nSinov so‘rovi. Haqiqiy bron yoki xabar yuborish amalga oshirilmaydi.`;
}
export function validReceipt(value) {
  return Boolean(
    value &&
      typeof value.id === "string" &&
      /^[a-zA-Z0-9-]{1,80}$/.test(value.id) &&
      typeof value.number === "string" &&
      value.number.length > 0 &&
      value.number.length <= 40 &&
      tripById(value.tripId) &&
      typeof value.name === "string" &&
      typeof value.cargo === "string" &&
      typeof value.createdAt === "string" &&
      Number.isFinite(Date.parse(value.createdAt)) &&
      Object.keys(validateRequest(value.name, value.cargo)).length === 0,
  );
}
export const STORAGE_KEY = "yolchi.requests.v1";
export function scopedReceiptStorage(storage, userId) {
  const scopedKey = userId ? `${STORAGE_KEY}.user.${userId}` : STORAGE_KEY;
  return {
    getItem: (key) => {
      if (!storage) throw new Error("Storage unavailable");
      return storage.getItem(key === STORAGE_KEY ? scopedKey : key);
    },
    setItem: (key, value) => {
      if (!storage) throw new Error("Storage unavailable");
      storage.setItem(key === STORAGE_KEY ? scopedKey : key, value);
    },
  };
}
export function mergeReceiptBackup(storage, incoming, sessionItems = []) {
  if (
    !Array.isArray(incoming) ||
    incoming.length > 100 ||
    !incoming.every(validReceipt)
  )
    return {
      ok: false,
      error: "Nusxa formati to‘g‘ri emas. Asl so‘rovlar o‘zgartirilmadi.",
    };
  const current = loadReceipts(storage);
  if (!current.available) return { ok: false, error: current.reason };
  // Existing receipts win when a file contains the same ID. One write prevents partial imports.
  const unique = new Map();
  for (const r of [...current.items, ...sessionItems, ...incoming])
    if (!unique.has(r.id)) unique.set(r.id, r);
  const merged = [...unique.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  if (merged.length > 100)
    return {
      ok: false,
      error:
        "Jami 100 tadan ko‘p so‘rov. Nusxa yuklanmadi, asl so‘rovlar saqlandi.",
    };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { ok: true, items: merged };
  } catch {
    return {
      ok: false,
      error:
        "Nusxa saqlanmadi. Brauzer xotirasi cheklangan, asl so‘rovlar o‘zgarmadi.",
    };
  }
}
export function loadReceipts(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], available: true };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validReceipt))
      return {
        items: [],
        available: false,
        reason:
          "Saqlangan ma’lumotni o‘qib bo‘lmadi. Asl nusxa o‘zgartirilmadi.",
      };
    return { items: parsed, available: true };
  } catch {
    return {
      items: [],
      available: false,
      reason:
        "Brauzer xotirasiga kirish cheklangan. So‘rov joriy oynada qoladi.",
    };
  }
}
export function storeReceipt(storage, receipt, sessionItems = []) {
  const current = loadReceipts(storage);
  if (!current.available) return { ...current, saved: false };
  try {
    const unique = new Map();
    for (const item of [receipt, ...current.items, ...sessionItems])
      if (!unique.has(item.id)) unique.set(item.id, item);
    const items = [...unique.values()];
    if (items.length > 100)
      return {
        items: current.items,
        saved: false,
        available: true,
        reason:
          "Brauzerda 100 ta so‘rov saqlangan. Yangi tasdiq joriy oynada qoladi; uning nusxasini yuklab oling.",
      };
    storage.setItem(STORAGE_KEY, JSON.stringify(items));
    return { items, saved: true, available: true };
  } catch {
    return {
      items: current.items,
      saved: false,
      available: false,
      reason: "So‘rov brauzer xotirasiga saqlanmadi. Tasdiq nusxasini oling.",
    };
  }
}
