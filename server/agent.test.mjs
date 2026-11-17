import test from "node:test";
import assert from "node:assert/strict";
import { runAgent } from "./agent.mjs";

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
const call = (name, args, id = "call1") => ({
  id,
  type: "function",
  function: {
    name,
    arguments: typeof args === "string" ? args : JSON.stringify(args),
  },
});
const groq = (text = "", calls = []) =>
  json({
    choices: [
      { message: { role: "assistant", content: text, tool_calls: calls } },
    ],
  });
const gemini = (parts) =>
  json({ candidates: [{ content: { role: "model", parts } }] });
const envGroq = () => ({ GROQ_API_KEY: "fake-groq-agent-secret" });
const prompt = (content) => ({ messages: [{ role: "user", content }] });

test("Groq native tool loop executes real destination search and rejects hallucinated Y04 in final text", async () => {
  let round = 0;
  const result = await runAgent(prompt("B tumaniga qaysi qatnov bor?"), {
    env: envGroq(),
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body);
      round++;
      assert.equal(body.model, "openai/gpt-oss-120b");
      assert.ok(body.tools.some((t) => t.function.name === "search_trips"));
      if (round === 1)
        return groq("", [call("search_trips", { destination: "B tumani" })]);
      assert.equal(
        body.messages.at(-2).tool_calls[0].function.name,
        "search_trips",
      );
      assert.equal(body.messages.at(-1).role, "tool");
      assert.equal(body.messages.at(-1).tool_call_id, "call1");
      assert.deepEqual(
        JSON.parse(body.messages.at(-1).content).trips.map((t) => t.id),
        ["Y02", "Y03"],
      );
      return groq("B tumaniga Y02, Y03 va Y04 bor.");
    },
  });
  assert.equal(round, 2);
  assert.deepEqual(
    result.trips.map((t) => t.id),
    ["Y02", "Y03"],
  );
  assert.deepEqual(result.actions, []);
  assert.match(result.reply, /Y02/);
  assert.match(result.reply, /Y03/);
  assert.ok(!result.reply.includes("Y04"));
  assert.deepEqual(result.tools, [
    { name: "search_trips", summary: "2 ta haqiqiy qatnov topildi." },
  ]);
});

test("Native get, open, set cargo, prepare and Telegram produce only validated proposals", async () => {
  let round = 0;
  const result = await runAgent(
    prompt("Y02 uchun Sinovchi 01 va 2 quti kitob so‘rovini tayyorla."),
    {
      env: envGroq(),
      fetchImpl: async () => {
        round++;
        if (round === 1)
          return groq("", [
            call("get_trip", { tripId: "Y02" }, "read"),
            call("open_request", { tripId: "Y02" }, "open"),
            call(
              "set_cargo",
              { tripId: "Y02", cargo: "2 quti kitob" },
              "cargo",
            ),
            call(
              "prepare_request",
              { tripId: "Y02", name: "Sinovchi 01", cargo: "2 quti kitob" },
              "prepare",
            ),
            call("request_telegram", { tripId: "Y02" }, "telegram"),
          ]);
        return groq("Y02 qoralamasi tayyor. Davom etish uchun tasdiqlang.");
      },
    },
  );
  assert.deepEqual(result.actions, [
    { type: "open_request", tripId: "Y02" },
    { type: "set_cargo", tripId: "Y02", cargo: "2 quti kitob" },
    {
      type: "prepare_request",
      tripId: "Y02",
      name: "Sinovchi 01",
      cargo: "2 quti kitob",
      requiresConfirmation: true,
    },
    { type: "send_telegram", tripId: "Y02", requiresConfirmation: true },
  ]);
  assert.equal(result.tools.length, 5);
  assert.deepEqual(
    result.trips.map((t) => t.id),
    ["Y02"],
  );
});

test("Gemini functionCall/functionResponse preserves opaque thoughtSignature and call ID", async () => {
  const env = { GEMINI_API_KEY: "fake-gemini-agent-secret" };
  let round = 0;
  const firstPart = {
    functionCall: {
      name: "get_trip",
      args: { tripId: "Y02" },
      id: "gemini-call-7",
    },
    thoughtSignature: "opaque-signature-do-not-change",
  };
  const result = await runAgent(prompt("Y02 ni tekshir"), {
    env,
    fetchImpl: async (url, options) => {
      round++;
      const body = JSON.parse(options.body);
      assert.ok(
        body.tools[0].functionDeclarations.some((t) => t.name === "get_trip"),
      );
      assert.equal(options.headers["x-goog-api-key"], env.GEMINI_API_KEY);
      if (round === 1) return gemini([firstPart]);
      assert.deepEqual(body.contents.at(-2), {
        role: "model",
        parts: [firstPart],
      });
      const part = body.contents.at(-1).parts[0].functionResponse;
      assert.equal(part.id, "gemini-call-7");
      assert.equal(part.name, "get_trip");
      assert.equal(part.response.trip.id, "Y02");
      return gemini([
        { text: "Y02: Viloyat markazi → B tumani, 20.11.2026 10:00." },
      ]);
    },
  });
  assert.equal(result.provider, "gemini");
  assert.equal(result.trips[0].id, "Y02");
  assert.equal(round, 2);
});

test("Unknown tool, malformed arguments, invalid IDs and extra parameters cannot create actions", async () => {
  let round = 0;
  const result = await runAgent(prompt("So‘rov tayyorla"), {
    env: envGroq(),
    fetchImpl: async () => {
      if (++round === 1)
        return groq("", [
          call("execute_shell", { command: "anything" }, "badtool"),
          call("open_request", { tripId: "Y99" }, "badid"),
          call("prepare_request", "{broken", "badjson"),
          call("set_cargo", { tripId: "Y02", cargo: "   " }, "blank"),
          call(
            "prepare_request",
            { tripId: "Y02", name: "x".repeat(81) },
            "long",
          ),
          call("open_request", { tripId: "Y02", send: true }, "extra"),
        ]);
      return groq("Qatnov va yuk ma’lumotlarini aniqlashtiring.");
    },
  });
  assert.deepEqual(result.actions, []);
  assert.deepEqual(result.trips, []);
  assert.equal(result.tools.length, 6);
  assert.ok(
    result.tools.every((tool) => tool.summary.includes("hech qanday amal")),
  );
});

test("Four-round and eight-tool limits stop repeated calls; duplicate actions stay deduplicated", async () => {
  let rounds = 0;
  const result = await runAgent(prompt("Y02 shaklini och"), {
    env: envGroq(),
    fetchImpl: async () => {
      rounds++;
      return groq("", [
        call("open_request", { tripId: "Y02" }, `loop-${rounds}`),
      ]);
    },
  });
  assert.equal(rounds, 4);
  assert.equal(result.tools.length, 4);
  assert.equal(result.actions.length, 1);
  let batchRounds = 0;
  const limited = await runAgent(prompt("Qatnovlarni tekshir"), {
    env: envGroq(),
    fetchImpl: async () => {
      batchRounds++;
      return groq(
        "",
        Array.from({ length: 12 }, (_, i) =>
          call("get_trip", { tripId: "Y02" }, `batch-${i}`),
        ),
      );
    },
  });
  assert.equal(batchRounds, 1);
  assert.equal(limited.tools.length, 8);
});

test("Fallback after a tool keeps verified results as context when switching Groq to Gemini", async () => {
  const env = { ...envGroq(), GEMINI_API_KEY: "fake-gemini-agent-secret" };
  let groqCalls = 0,
    geminiCalls = 0;
  const result = await runAgent(prompt("B tumaniga top"), {
    env,
    fetchImpl: async (url, options) => {
      if (url.includes("groq")) {
        if (++groqCalls === 1)
          return groq("", [call("search_trips", { destination: "B tumani" })]);
        return json({ error: "upstream denied fake-groq-agent-secret" }, 503);
      }
      geminiCalls++;
      const body = JSON.parse(options.body);
      const verified = body.contents.at(-1).parts[0].text;
      assert.match(verified, /Server tekshirgan/);
      assert.match(verified, /Y02/);
      assert.ok(!options.body.includes(env.GROQ_API_KEY));
      assert.ok(!options.body.includes(env.GEMINI_API_KEY));
      return gemini([{ text: "Y02 va Y03 mos keladi." }]);
    },
  });
  assert.equal(result.provider, "gemini");
  assert.equal(groqCalls, 2);
  assert.equal(geminiCalls, 1);
  assert.deepEqual(
    result.trips.map((t) => t.id),
    ["Y02", "Y03"],
  );
});

test("Caller cancellation stops the agent before new function rounds", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = runAgent(prompt("Qatnov top"), {
    env: envGroq(),
    signal: controller.signal,
    fetchImpl: async () => {
      calls++;
      return new Promise(() => {});
    },
  });
  setTimeout(() => controller.abort("private reason"), 5);
  await assert.rejects(
    () => pending,
    (error) =>
      error.code === "AI_CANCELLED" &&
      !String(error).includes("private reason"),
  );
  assert.equal(calls, 1);
});

test("One total deadline covers tool rounds and failure after verified tools returns honest result", async () => {
  let calls = 0;
  const started = Date.now();
  const result = await runAgent(prompt("B tumaniga top"), {
    env: {
      ...envGroq(),
      AI_TOTAL_TIMEOUT_MS: "50",
      AI_ATTEMPT_TIMEOUT_MS: "40",
    },
    fetchImpl: async () => {
      if (++calls === 1)
        return groq("", [call("search_trips", { destination: "B tumani" })]);
      return new Promise(() => {});
    },
  });
  assert.equal(calls, 2);
  assert.ok(Date.now() - started < 250);
  assert.deepEqual(
    result.trips.map((t) => t.id),
    ["Y02", "Y03"],
  );
  assert.match(result.reply, /Jadval bo‘yicha/);
});

test("Final text cannot claim a proposed request or Telegram message was already sent", async () => {
  let calls = 0;
  const result = await runAgent(prompt("Y02 ni Telegramga yubor"), {
    env: envGroq(),
    fetchImpl: async () => {
      if (++calls === 1)
        return groq("", [call("request_telegram", { tripId: "Y02" })]);
      return groq("Xabar yuborildi va bron qilindi.");
    },
  });
  assert.match(result.reply, /hali yuborilmadi/);
  assert.ok(!result.reply.includes("bron qilindi"));
  assert.equal(result.actions[0].requiresConfirmation, true);
});

test("Text-only response cannot claim to have sent anything without an actual tool proposal", async () => {
  const result = await runAgent(prompt("Telegramga yubor"), {
    env: envGroq(),
    fetchImpl: async () => groq("Xabar yuborildi."),
  });
  assert.ok(!result.reply.includes("Xabar yuborildi"));
  assert.deepEqual(result.actions, []);
});

test("Provider secrets are removed from tool arguments, output text and all client structures", async () => {
  const env = envGroq();
  let calls = 0;
  const result = await runAgent(prompt("Y02 tavsifini yoz"), {
    env,
    fetchImpl: async () => {
      if (++calls === 1)
        return groq("", [
          call("set_cargo", {
            tripId: "Y02",
            cargo: `Kitob ${env.GROQ_API_KEY}`,
          }),
        ]);
      return groq(`Tavsif tayyor ${env.GROQ_API_KEY}`);
    },
  });
  assert.ok(!JSON.stringify(result).includes(env.GROQ_API_KEY));
  assert.equal(result.actions[0].cargo, "Kitob [maxfiy kalit]");
});
