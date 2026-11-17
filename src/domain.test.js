import test from "node:test";
import assert from "node:assert/strict";
import { TRIPS } from "./content.js";
import {
  filterTrips,
  validateRequest,
  receiptText,
  loadReceipts,
  storeReceipt,
  STORAGE_KEY,
  mergeReceiptBackup,
  validReceipt,
  sortTrips,
  dateLabel,
} from "./domain.js";
const example = {
  id: "ticket-006-test",
  number: "YL-TEST06",
  tripId: "Y02",
  name: "Sinovchi 01",
  cargo: "2 quti kitob",
  createdAt: "2026-11-17T07:00:00.000Z",
};
test("Bilet 006 dagi barcha qatnov, manzil va vaqtlar aynan saqlangan", () => {
  assert.deepEqual(
    TRIPS.map(({ id, from, to, date, time }) => [id, from, to, date, time]),
    [
      ["Y01", "Viloyat markazi", "A tumani", "20.11.2026", "09:00"],
      ["Y02", "Viloyat markazi", "B tumani", "20.11.2026", "10:00"],
      ["Y03", "A tumani", "B tumani", "20.11.2026", "14:00"],
      ["Y04", "B tumani", "C tumani", "21.11.2026", "09:00"],
      ["Y05", "C tumani", "A tumani", "21.11.2026", "11:00"],
    ],
  );
});
test("Yetib borish filtri jo‘nash hududi bilan aralashmaydi", () => {
  assert.deepEqual(
    filterTrips("B tumani").map((t) => t.id),
    ["Y02", "Y03"],
  );
  assert.deepEqual(
    filterTrips("A tumani").map((t) => t.id),
    ["Y01", "Y05"],
  );
  assert.deepEqual(
    filterTrips("C tumani").map((t) => t.id),
    ["Y04"],
  );
  assert.equal(filterTrips().length, 5);
});
test("Bo‘sh/whitespace ism yoki tavsif rad etiladi; to‘g‘ri ma’lumot qabul qilinadi", () => {
  assert.ok(validateRequest("Sinovchi 01", "   ").cargo);
  assert.ok(validateRequest("\t\n", "2 quti kitob").name);
  assert.ok(validateRequest("a".repeat(81), "kitob").name);
  assert.ok(validateRequest("Sinovchi", "x".repeat(501)).cargo);
  assert.deepEqual(validateRequest("Sinovchi 01", "2 quti kitob"), {});
});
test("Tasdiq yuborilgan Y02, ism va yukni o‘z ichiga oladi", () => {
  const text = receiptText(example);
  for (const expected of [
    "Y02",
    "Viloyat markazi → B tumani",
    "20.11.2026, 10:00",
    "Sinovchi 01",
    "2 quti kitob",
  ])
    assert.ok(text.includes(expected));
  assert.ok(!text.includes("A tumani"));
});
test("Qidiruv filtr bilan birga ishlaydi; natija yo‘qligi rost ko‘rsatiladi", () => {
  assert.deepEqual(
    filterTrips("B tumani", "Y02").map((t) => t.id),
    ["Y02"],
  );
  assert.deepEqual(filterTrips("A tumani", "Y02"), []);
});
test("Saqlash yangi ishga tushishda o‘qiladi va boshqa kalitga tegmaydi", () => {
  const data = new Map([["other.app", "keep"]]),
    storage = {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
    };
  assert.equal(storeReceipt(storage, example).saved, true);
  assert.deepEqual(loadReceipts(storage).items, [example]);
  assert.equal(data.get("other.app"), "keep");
  storeReceipt(storage, example);
  assert.equal(loadReceipts(storage).items.length, 1);
});
test("Buzilgan asl storage ustidan yozilmaydi; xotira bloklansa yolg‘on saqlandi yo‘q", () => {
  const data = new Map([[STORAGE_KEY, "{broken"]]),
    storage = {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
    };
  assert.equal(storeReceipt(storage, example).saved, false);
  assert.equal(data.get(STORAGE_KEY), "{broken");
  const blocked = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(loadReceipts(blocked).available, false);
  assert.equal(storeReceipt(blocked, example).saved, false);
});

function memoryStorage(initial = []) {
  let writes = 0;
  const values = new Map([
    [STORAGE_KEY, JSON.stringify(initial)],
    ["other.app", "keep"],
  ]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes++;
      values.set(key, value);
    },
    get writes() {
      return writes;
    },
  };
}
const another = (id, extra = {}) => ({
  ...example,
  id,
  number: `YL-${id}`,
  ...extra,
});

test("JSON tiklash mavjud yozuvni saqlaydi, ID takrorini qo‘shmaydi va sessiyadagi so‘rovni tiklaydi", () => {
  const original = another("original", { cargo: "Asl yuk" });
  const session = another("session", { createdAt: "2026-11-18T07:00:00.000Z" });
  const imported = another("imported", {
    createdAt: "2026-11-19T07:00:00.000Z",
  });
  const storage = memoryStorage([original]);
  const result = mergeReceiptBackup(
    storage,
    [{ ...original, cargo: "Almashtirilgan" }, imported],
    [session],
  );
  assert.equal(result.ok, true);
  assert.equal(result.items.length, 3);
  assert.equal(result.items.find((r) => r.id === "original").cargo, "Asl yuk");
  assert.deepEqual(
    result.items.map((r) => r.id),
    ["imported", "session", "original"],
  );
  assert.deepEqual(loadReceipts(storage).items, result.items);
  assert.equal(storage.writes, 1);
  assert.equal(storage.getItem("other.app"), "keep");
});

test("JSON tiklash jami 100 dan oshsa yoki bitta yozuv xato bo‘lsa hech narsani yozmaydi", () => {
  const originals = Array.from({ length: 100 }, (_, i) => another(`old-${i}`));
  const storage = memoryStorage(originals);
  const before = storage.getItem(STORAGE_KEY);
  assert.equal(mergeReceiptBackup(storage, [another("new")]).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(
    mergeReceiptBackup(storage, [
      another("valid"),
      another("bad", { createdAt: "not-a-date" }),
    ]).ok,
    false,
  );
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(storage.writes, 0);
  assert.equal(mergeReceiptBackup(storage, originals).ok, true);
  assert.equal(loadReceipts(storage).items.length, 100);
});

test("Tiklash noto‘g‘ri fayl, buzilgan xotira va yozish xatosida asl nusxani saqlaydi", () => {
  const storage = memoryStorage([example]),
    before = storage.getItem(STORAGE_KEY);
  for (const invalid of [
    null,
    {},
    "text",
    [another("bad", { number: "" })],
    [another("bad", { name: "   " })],
  ]) {
    assert.equal(mergeReceiptBackup(storage, invalid).ok, false);
  }
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(storage.writes, 0);
  const corrupted = {
    getItem: () => "{broken",
    setItem: () => assert.fail("Corrupt storage must not be overwritten"),
  };
  assert.equal(mergeReceiptBackup(corrupted, [example]).ok, false);
  const quota = {
    getItem: storage.getItem,
    setItem: () => {
      throw new Error("Quota exceeded");
    },
  };
  assert.equal(mergeReceiptBackup(quota, [another("new")]).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(
    validReceipt(another("bad", { createdAt: "not-a-date" })),
    false,
  );
});

test("Qatnovlar yil, oy, kun va vaqt bo‘yicha saralanadi; asl jadval tartibi buzilmaydi", () => {
  const input = [
    { id: "next-year", date: "01.01.2027", time: "08:00" },
    { id: "late-hour", date: "20.11.2026", time: "14:00" },
    { id: "early-hour", date: "20.11.2026", time: "09:00" },
    { id: "previous-month", date: "31.10.2026", time: "22:00" },
  ];
  assert.deepEqual(
    sortTrips(input).map((t) => t.id),
    ["previous-month", "early-hour", "late-hour", "next-year"],
  );
  assert.deepEqual(
    sortTrips(input, "late").map((t) => t.id),
    ["next-year", "late-hour", "early-hour", "previous-month"],
  );
  assert.equal(input[0].id, "next-year");
  assert.equal(dateLabel("05.03.2027"), "5-mart 2027");
  assert.equal(dateLabel("20.11.2026"), "20-noyabr 2026");
});

test("Xotira tiklangach yangi so‘rov avvalgi faqat sessiyada qolgan so‘rovni ham saqlaydi", () => {
  const first = another("session-first"),
    second = another("after-recovery");
  let blocked = true;
  const values = new Map();
  const storage = {
    getItem(key) {
      if (blocked) throw new Error("Storage blocked");
      return values.get(key) || null;
    },
    setItem(key, value) {
      if (blocked) throw new Error("Storage blocked");
      values.set(key, value);
    },
  };
  assert.equal(storeReceipt(storage, first).saved, false);
  assert.equal(values.size, 0);
  blocked = false;
  const result = storeReceipt(storage, second, [first]);
  assert.equal(result.saved, true);
  assert.deepEqual(
    loadReceipts(storage).items.map((r) => r.id),
    ["after-recovery", "session-first"],
  );
});

test("101-so‘rov eski tarixni qisqartirmaydi: asl 100 ta saqlanadi va yangi tasdiq faqat oynada qoladi", () => {
  const originals = Array.from({ length: 100 }, (_, i) =>
    another(`saved-${i}`),
  );
  const storage = memoryStorage(originals),
    before = storage.getItem(STORAGE_KEY);
  const receipt = another("over-limit");
  const result = storeReceipt(storage, receipt, originals);
  assert.equal(result.saved, false);
  assert.equal(result.available, true);
  assert.match(result.reason, /100/);
  assert.deepEqual(result.items, originals);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(storage.writes, 0);
  assert.ok(!loadReceipts(storage).items.some((r) => r.id === receipt.id));
});
