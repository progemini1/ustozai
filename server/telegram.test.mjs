import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sendReceiptToTelegram, getTelegramStatus } from "./telegram.mjs";
const env = {
  TELEGRAM_BOT_TOKEN: "test-token-private",
  TELEGRAM_CHAT_ID: "1234",
};
const receipt = () => ({
  id: randomUUID(),
  number: "YL-TEST01",
  tripId: "Y02",
  name: "Sinovchi 01",
  cargo: "2 quti kitob",
  createdAt: "2026-11-17T07:00:00.000Z",
});
test("Telegram sends exact receipt as plain text, with no fake transport booking", async () => {
  let body;
  const result = await sendReceiptToTelegram(receipt(), {
    env,
    fetchImpl: async (url, options) => {
      assert.ok(url.startsWith("https://api.telegram.org/bot"));
      body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.equal(result.sent, true);
  assert.equal(body.chat_id, "1234");
  assert.match(body.text, /Viloyat markazi → B tumani/);
  assert.match(body.text, /20.11.2026, 10:00/);
  assert.match(body.text, /Sinovchi 01/);
  assert.match(body.text, /2 quti kitob/);
  assert.ok(!body.parse_mode);
  assert.ok(!body.text.includes(env.TELEGRAM_BOT_TOKEN));
});
test("Telegram deduplicates concurrent clicks and confirmed sends", async () => {
  const r = receipt();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await Promise.all([
    sendReceiptToTelegram(r, { env, fetchImpl }),
    sendReceiptToTelegram(r, { env, fetchImpl }),
  ]);
  assert.equal(calls, 1);
  assert.equal(
    (await sendReceiptToTelegram(r, { env, fetchImpl })).alreadySent,
    true,
  );
  assert.equal(calls, 1);
});
test("Failed Telegram delivery can be retried and never pretends success", async () => {
  const r = receipt();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return calls === 1
      ? {
          ok: false,
          status: 429,
          json: async () => ({ ok: false, error_code: 429 }),
        }
      : { ok: true, json: async () => ({ ok: true }) };
  };
  await assert.rejects(
    sendReceiptToTelegram(r, { env, fetchImpl }),
    (e) => e.status === 429 && !e.message.includes(env.TELEGRAM_BOT_TOKEN),
  );
  assert.equal((await sendReceiptToTelegram(r, { env, fetchImpl })).sent, true);
  assert.equal(calls, 2);
});
test("Invalid/unconfigured Telegram requests make no outbound call", async () => {
  let calls = 0;
  const fetchImpl = () => {
    calls++;
  };
  await assert.rejects(
    sendReceiptToTelegram({}, { env, fetchImpl }),
    (e) => e.status === 400,
  );
  await assert.rejects(
    sendReceiptToTelegram(receipt(), { env: {}, fetchImpl }),
    (e) => e.status === 503,
  );
  assert.equal(calls, 0);
  assert.deepEqual(getTelegramStatus({}), { configured: false });
});
test("Telegram timeout is sanitized and does not leak the token", async () => {
  const fetchImpl = (_url, { signal }) =>
    new Promise((resolve, reject) =>
      signal.addEventListener("abort", () =>
        reject(new Error(env.TELEGRAM_BOT_TOKEN)),
      ),
    );
  await assert.rejects(
    sendReceiptToTelegram(receipt(), { env, fetchImpl, timeoutMs: 15 }),
    (e) => e.status === 504 && !e.message.includes(env.TELEGRAM_BOT_TOKEN),
  );
});
