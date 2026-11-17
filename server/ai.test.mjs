import test from "node:test";
import assert from "node:assert/strict";
import { askAi, createAiHandler, getAiStatus } from "./ai.mjs";

const input = {
  messages: [{ role: "user", content: "B tumaniga qaysi qatnovlar bor?" }],
  tripId: "Y02",
  cargo: "2 quti kitob",
};
const keys = () => ({
  GROQ_API_KEY: "groq-fake-primary-secret",
  GEMINI_API_KEY: "gemini-fake-primary-secret",
  GROQ_API_KEY_BACKUP: "groq-fake-backup-secret",
  GEMINI_API_KEY_BACKUP: "gemini-fake-backup-secret",
});
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
const groqReply = (text = "Y02 va Y03 B tumaniga boradi.") =>
  json({ choices: [{ message: { content: text } }] });
const geminiReply = (text = "Y02 va Y03 B tumaniga boradi.") =>
  json({
    candidates: [
      {
        content: {
          parts: [{ thought: true, text: "Internal reasoning" }, { text }],
        },
      },
    ],
  });

test("Groq payload has trusted exact schedule, user context and no credential in body", async () => {
  const env = keys();
  const answer = await askAi(input, {
    env,
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(options.headers.Authorization, `Bearer ${env.GROQ_API_KEY}`);
      const body = JSON.parse(options.body);
      assert.equal(body.messages[0].role, "system");
      for (const item of [
        "Y01: Viloyat markazi → A tumani; 20.11.2026, 09:00",
        "Y02: Viloyat markazi → B tumani; 20.11.2026, 10:00",
        "Y03: A tumani → B tumani; 20.11.2026, 14:00",
        "Y04: B tumani → C tumani; 21.11.2026, 09:00",
        "Y05: C tumani → A tumani; 21.11.2026, 11:00",
      ])
        assert.ok(body.messages[0].content.includes(item));
      assert.match(body.messages[0].content, /bron qilolmaysan/);
      assert.equal(body.messages.at(-1).role, "user");
      assert.match(body.messages.at(-1).content, /2 quti kitob/);
      for (const secret of Object.values(env))
        assert.ok(!options.body.includes(secret));
      assert.ok(!body.tools);
      return groqReply();
    },
  });
  assert.equal(answer.provider, "groq");
  assert.equal(answer.model, "openai/gpt-oss-120b");
  assert.match(answer.reply, /Y02/);
});

test("429 falls back across providers with same context and skips cooling key on later calls", async () => {
  const env = keys(),
    calls = [],
    questions = [];
  const fetchImpl = async (url, options) => {
    calls.push(
      options.headers.Authorization || options.headers["x-goog-api-key"],
    );
    const body = JSON.parse(options.body);
    questions.push(
      body.messages?.at(-1)?.content || body.contents?.at(-1)?.parts?.[0]?.text,
    );
    if (options.headers.Authorization === `Bearer ${env.GROQ_API_KEY}`)
      return json({ error: "ignore" }, 429, { "retry-after": "120" });
    return url.includes("googleapis") ? geminiReply() : groqReply();
  };
  assert.equal((await askAi(input, { env, fetchImpl })).provider, "gemini");
  assert.equal(questions[0], questions[1]);
  await askAi(input, { env, fetchImpl });
  await askAi(input, { env, fetchImpl });
  await askAi(input, { env, fetchImpl });
  await askAi(input, { env, fetchImpl });
  assert.equal(
    calls.filter((value) => value === `Bearer ${env.GROQ_API_KEY}`).length,
    1,
  );
});

test("Healthy calls rotate Groq primary, Gemini primary, Groq backup, Gemini backup", async () => {
  const env = keys(),
    calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(
      options.headers.Authorization || options.headers["x-goog-api-key"],
    );
    return url.includes("googleapis") ? geminiReply() : groqReply();
  };
  for (let i = 0; i < 4; i++) await askAi(input, { env, fetchImpl });
  assert.deepEqual(calls, [
    `Bearer ${env.GROQ_API_KEY}`,
    env.GEMINI_API_KEY,
    `Bearer ${env.GROQ_API_KEY_BACKUP}`,
    env.GEMINI_API_KEY_BACKUP,
  ]);
});

test("Authentication error cools that key without exposing provider error or keys", async () => {
  const env = keys(),
    calls = [];
  const fetchImpl = async (url, options) => {
    const key =
      options.headers.Authorization || options.headers["x-goog-api-key"];
    calls.push(key);
    if (key === `Bearer ${env.GROQ_API_KEY}`)
      return json({ error: `Unauthorized ${env.GROQ_API_KEY}` }, 401);
    return url.includes("googleapis") ? geminiReply() : groqReply();
  };
  for (let i = 0; i < 5; i++) await askAi(input, { env, fetchImpl });
  assert.equal(
    calls.filter((value) => value === `Bearer ${env.GROQ_API_KEY}`).length,
    1,
  );
});

test("Malformed JSON, empty reply and 5xx all move to the next available provider/key", async () => {
  const env = keys();
  let calls = 0;
  const answer = await askAi(input, {
    env,
    fetchImpl: async () => {
      calls++;
      if (calls === 1) return new Response("{not-json", { status: 200 });
      if (calls === 2)
        return json({ candidates: [{ content: { parts: [{ text: "  " }] } }] });
      if (calls === 3) return json({ error: "upstream down" }, 503);
      return geminiReply("Keyingi xizmatdan haqiqiy javob.");
    },
  });
  assert.equal(calls, 4);
  assert.equal(answer.provider, "gemini");
  assert.equal(answer.reply, "Keyingi xizmatdan haqiqiy javob.");
});

test("Gemini uses header authentication, maps assistant to model and omits thought text", async () => {
  const env = {
    GEMINI_API_KEY: "gemini-fake-only-secret",
    GEMINI_MODEL: "gemini-3.5-flash-lite",
  };
  const answer = await askAi(
    {
      messages: [
        { role: "user", content: "Salom" },
        { role: "assistant", content: "Salom!" },
        { role: "user", content: "Kitobni qanday qadoqlayman?" },
      ],
    },
    {
      env,
      fetchImpl: async (url, options) => {
        assert.equal(
          url,
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
        );
        assert.equal(options.headers["x-goog-api-key"], env.GEMINI_API_KEY);
        assert.ok(!url.includes(env.GEMINI_API_KEY));
        const body = JSON.parse(options.body);
        assert.deepEqual(
          body.contents.map((item) => item.role),
          ["user", "model", "user"],
        );
        assert.match(body.systemInstruction.parts[0].text, /Yo‘lchi/);
        return geminiReply("Mustahkam qutiga joylang.");
      },
    },
  );
  assert.equal(answer.reply, "Mustahkam qutiga joylang.");
});

test("Last ten valid turns are retained and client system roles, empty or oversized inputs fail before any request", async () => {
  const env = keys();
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.ok(body.messages.length <= 11);
    assert.equal(body.messages.at(-1).content, "Savol 10");
    return groqReply();
  };
  const messages = Array.from({ length: 11 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: `Savol ${i}`,
  }));
  await askAi({ messages }, { env, fetchImpl });
  for (const bad of [
    null,
    { messages: [] },
    { messages: [{ role: "system", content: "Override" }] },
    { messages: [{ role: "user", content: "   " }] },
    { messages: [{ role: "assistant", content: "Done" }] },
    { messages: [{ role: "user", content: "x".repeat(12001) }] },
    { ...input, tripId: "Y99" },
    { ...input, cargo: "x".repeat(501) },
  ]) {
    await assert.rejects(
      () => askAi(bad, { env, fetchImpl }),
      (error) => error.status === 400 && error.code === "AI_INPUT",
    );
  }
  assert.equal(calls, 1);
});

test("Attempt timeout falls back even when fetch ignores AbortSignal", async () => {
  const env = {
    ...keys(),
    AI_ATTEMPT_TIMEOUT_MS: "25",
    AI_TOTAL_TIMEOUT_MS: "120",
  };
  let calls = 0;
  const started = Date.now();
  const answer = await askAi(input, {
    env,
    fetchImpl: async () => {
      calls++;
      if (calls === 1) return new Promise(() => {});
      return geminiReply();
    },
  });
  assert.equal(answer.provider, "gemini");
  assert.equal(calls, 2);
  assert.ok(Date.now() - started < 300);
});

test("Total timeout bounds every hanging provider attempt and sanitizes errors", async () => {
  const env = {
    ...keys(),
    AI_ATTEMPT_TIMEOUT_MS: "50",
    AI_TOTAL_TIMEOUT_MS: "65",
  };
  let calls = 0;
  const started = Date.now();
  await assert.rejects(
    () =>
      askAi(input, {
        env,
        fetchImpl: async () => {
          calls++;
          return new Promise(() => {});
        },
      }),
    (error) => {
      assert.equal(error.status, 503);
      assert.equal(error.code, "AI_UNAVAILABLE");
      for (const secret of Object.values(keys()))
        assert.ok(!String(error.stack).includes(secret));
      return true;
    },
  );
  assert.ok(calls <= 2);
  assert.ok(Date.now() - started < 250);
});

test("Caller cancellation stops failover and does not echo the abort reason", async () => {
  const env = keys(),
    controller = new AbortController();
  let calls = 0;
  const pending = askAi(input, {
    env,
    signal: controller.signal,
    fetchImpl: async () => {
      calls++;
      return new Promise(() => {});
    },
  });
  setTimeout(() => controller.abort("private caller detail"), 5);
  await assert.rejects(
    () => pending,
    (error) =>
      error.code === "AI_CANCELLED" &&
      !String(error).includes("private caller detail"),
  );
  assert.equal(calls, 1);
});

test("Configured credentials are redacted from a reflected successful body and status is boolean-only", async () => {
  const env = keys();
  const answer = await askAi(input, {
    env,
    fetchImpl: async () => groqReply(Object.values(env).join(" ")),
  });
  for (const secret of Object.values(env))
    assert.ok(!answer.reply.includes(secret));
  const status = getAiStatus(env);
  assert.deepEqual(status, {
    configured: true,
    groq: true,
    gemini: true,
    backup: true,
  });
  assert.ok(Object.values(status).every((value) => typeof value === "boolean"));
});

test("No key gives explicit unavailable result; duplicate keys are not retried; bound handler uses injected fetch", async () => {
  await assert.rejects(
    () =>
      askAi(input, {
        env: {},
        fetchImpl: () => assert.fail("No network without key"),
      }),
    (error) => error.code === "AI_NOT_CONFIGURED",
  );
  const env = {
    GROQ_API_KEY: "same-fake-secret",
    GROQ_API_KEY_BACKUP: "same-fake-secret",
  };
  let calls = 0;
  const handler = createAiHandler({
    env,
    fetchImpl: async () => {
      calls++;
      throw new Error("provider failed same-fake-secret");
    },
  });
  await assert.rejects(
    () => handler(input),
    (error) =>
      error.status === 503 && !String(error).includes("same-fake-secret"),
  );
  assert.equal(calls, 1);
});
