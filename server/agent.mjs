import { TRIPS, DESTINATIONS } from "../src/content.js";
import { filterTrips, sortTrips, tripById } from "../src/domain.js";
import {
  AiError,
  prepareAiConversation,
  createAiTransport,
  fetchAiJson,
} from "./ai.mjs";

const MAX_ROUNDS = 4,
  MAX_TOOL_CALLS = 8;
const str = (description, maxLength) => ({
  type: "string",
  description,
  ...(maxLength ? { maxLength } : {}),
});
const tripParameter = {
  type: "string",
  enum: TRIPS.map((t) => t.id),
  description: "Jadvaldagi mavjud qatnov ID.",
};
const schema = (properties, required = []) => ({
  type: "object",
  properties,
  required,
});
const FUNCTIONS = [
  {
    name: "search_trips",
    description:
      "Haqiqiy qatnovlarni yetib borish hududi, matn yoki jo‘nash sanasi bo‘yicha topish. Qatnov tavsiya qilishdan avval ishlat.",
    parameters: schema({
      destination: { type: "string", enum: DESTINATIONS },
      query: str("ID yoki manzil bo‘yicha qidiruv.", 200),
      date: str("Jo‘nash sanasi, KK.OO.YYYY, masalan 20.11.2026.", 10),
    }),
  },
  {
    name: "get_trip",
    description:
      "Bitta haqiqiy qatnovning yo‘nalishi, jo‘nash sanasi va vaqtini tekshirish.",
    parameters: schema({ tripId: tripParameter }, ["tripId"]),
  },
  {
    name: "open_request",
    description:
      "Tanlangan haqiqiy qatnov so‘rov shaklini ochishni taklif qilish. So‘rovni yubormaydi.",
    parameters: schema({ tripId: tripParameter }, ["tripId"]),
  },
  {
    name: "prepare_request",
    description:
      "Foydalanuvchi yozgan ism va yuk tavsifi bilan so‘rov qoralamasini tayyorlash. Faqat foydalanuvchi tasdiqlagach shakl saqlanadi, bu funksiya hech narsa yubormaydi.",
    parameters: schema(
      {
        tripId: tripParameter,
        name: str(
          "Faqat foydalanuvchi aytgan ism. Noma’lum bo‘lsa bo‘sh qoldir.",
          80,
        ),
        cargo: str("Buyum turi va miqdori, 500 belgigacha.", 500),
      },
      ["tripId"],
    ),
  },
  {
    name: "set_cargo",
    description:
      "Qatnov shaklidagi yuk tavsifini yozish yoki yaxshilash uchun tasdiqlangan qoralama o‘zgarishini taklif qilish. Haqiqiy yuborish bajarilmaydi.",
    parameters: schema(
      {
        tripId: tripParameter,
        cargo: str("Aniq yuk tavsifi, bo‘sh bo‘lmasin.", 500),
      },
      ["tripId", "cargo"],
    ),
  },
  {
    name: "request_telegram",
    description:
      "Joriy qatnovning tasdig‘ini Telegramga yuborish uchun foydalanuvchi tasdig‘i kerakligini bildirish. Bu funksiya Telegramga xabar YUBORMAYDI.",
    parameters: schema({ tripId: tripParameter }, ["tripId"]),
  },
];
const KNOWN = new Set(FUNCTIONS.map((tool) => tool.name));

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
function parseArgs(value) {
  try {
    if (typeof value === "string") {
      if (value.length > 6000) return null;
      value = JSON.parse(value);
    }
    return object(value) ? value : null;
  } catch {
    return null;
  }
}
function safeId(value, fallback) {
  return typeof value === "string" && /^[\w-]{1,128}$/.test(value)
    ? value
    : fallback;
}
function nativeTurn(json, provider, round) {
  let content = "",
    calls = [],
    native;
  if (provider === "groq") {
    const message = json?.choices?.[0]?.message;
    if (!message) throw new Error("Malformed agent response");
    content = typeof message.content === "string" ? message.content : "";
    if (Array.isArray(message.tool_calls))
      calls = message.tool_calls.map((call, i) => ({
        id: safeId(call.id, `call_${round}_${i}`),
        name: call.function?.name,
        args: parseArgs(call.function?.arguments),
      }));
  } else {
    const modelContent = json?.candidates?.[0]?.content;
    if (!Array.isArray(modelContent?.parts))
      throw new Error("Malformed agent response");
    // Preserve opaque Gemini thought signatures and every model part for the next native round.
    native = { role: "model", parts: modelContent.parts };
    content = modelContent.parts
      .filter((p) => p.thought !== true && typeof p.text === "string")
      .map((p) => p.text)
      .join("\n");
    calls = modelContent.parts
      .filter((p) => p.functionCall)
      .map((p, i) => ({
        id: safeId(p.functionCall.id, `call_${round}_${i}`),
        nativeId: p.functionCall.id,
        name: p.functionCall.name,
        args: parseArgs(p.functionCall.args),
      }));
  }
  if (!content.trim() && !calls.length) throw new Error("Empty agent response");
  return {
    role: "assistant",
    content: content.trim().slice(0, 8000),
    calls,
    provider,
    native,
  };
}

function groqMessages(system, history, turns) {
  const messages = [{ role: "system", content: system }, ...history];
  for (const turn of turns) {
    if (turn.role === "assistant")
      messages.push({
        role: "assistant",
        content: turn.content || null,
        ...(turn.calls.length
          ? {
              tool_calls: turn.calls.map((call) => ({
                id: call.id,
                type: "function",
                function: {
                  name:
                    typeof call.name === "string" ? call.name : "invalid_tool",
                  arguments: JSON.stringify(call.args || {}),
                },
              })),
            }
          : {}),
      });
    else
      messages.push({
        role: "tool",
        tool_call_id: turn.id,
        name: typeof turn.name === "string" ? turn.name : "invalid_tool",
        content: JSON.stringify(turn.result),
      });
  }
  return messages;
}
function geminiContents(history, turns) {
  const contents = [];
  const add = (role, parts) => {
    if (contents.at(-1)?.role === role) contents.at(-1).parts.push(...parts);
    else contents.push({ role, parts: [...parts] });
  };
  for (const message of history)
    add(message.role === "assistant" ? "model" : "user", [
      { text: message.content },
    ]);
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (
      turn.role === "assistant" &&
      turn.provider === "gemini" &&
      turn.native
    ) {
      // Do not reconstruct signed functionCall parts: Google validates these opaque signatures.
      contents.push(turn.native);
      const results = [];
      while (turns[i + 1]?.role === "tool") {
        const result = turns[++i];
        const original = turn.calls.find((call) => call.id === result.id);
        results.push({
          functionResponse: {
            name: result.name,
            response: result.result,
            ...(original?.nativeId ? { id: original.nativeId } : {}),
          },
        });
      }
      if (results.length) contents.push({ role: "user", parts: results });
    } else if (turn.role === "assistant") {
      // A switched provider cannot manufacture a Gemini signature. Preserve the same verified
      // calls/results as text context, then let Gemini issue its own new native calls if needed.
      add("model", [
        {
          text:
            turn.content ||
            "Qatnov vositasi chaqirildi: " +
              JSON.stringify(
                turn.calls.map((c) => ({ name: c.name, args: c.args })),
              ),
        },
      ]);
    } else
      add("user", [
        {
          text:
            "Server tekshirgan vosita natijasi: " +
            JSON.stringify({ name: turn.name, result: turn.result }),
        },
      ]);
  }
  return contents;
}
async function modelRound(candidate, data, turns, round, fetchImpl, signal) {
  let url, headers, body;
  if (candidate.provider === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${candidate.key}`,
    };
    body = {
      model: candidate.model,
      messages: groqMessages(data.system, data.history, turns),
      tools: FUNCTIONS.map((fn) => ({ type: "function", function: fn })),
      tool_choice: "auto",
      parallel_tool_calls: false,
      max_completion_tokens: 2400,
      temperature: 0.2,
      stream: false,
    };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate.model)}:generateContent`;
    headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": candidate.key,
    };
    body = {
      systemInstruction: { parts: [{ text: data.system }] },
      contents: geminiContents(data.history, turns),
      tools: [{ functionDeclarations: FUNCTIONS }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: { maxOutputTokens: 2600 },
    };
  }
  return nativeTurn(
    await fetchAiJson(
      url,
      { method: "POST", headers, body: JSON.stringify(body), signal },
      fetchImpl,
    ),
    candidate.provider,
    round,
  );
}

function validText(value, max, allowEmpty = false) {
  return (
    typeof value === "string" &&
    value.length <= max &&
    (allowEmpty || !!value.trim())
  );
}
function execute(call, context) {
  const args = call.args;
  if (!KNOWN.has(call.name) || !object(args))
    return { ok: false, error: "Vosita yoki parametrlar formati noto‘g‘ri." };
  const definition = FUNCTIONS.find((fn) => fn.name === call.name);
  if (
    Object.keys(args).some(
      (key) => !Object.hasOwn(definition.parameters.properties, key),
    )
  )
    return { ok: false, error: "Kutilmagan parametr qabul qilinmadi." };
  if (call.name === "search_trips") {
    const destination = args.destination ?? "Barchasi";
    if (
      !DESTINATIONS.includes(destination) ||
      (args.query !== undefined && !validText(args.query, 200, true)) ||
      (args.date !== undefined &&
        (!validText(args.date, 10) || !/^\d{2}\.\d{2}\.\d{4}$/.test(args.date)))
    )
      return { ok: false, error: "Hudud, qidiruv yoki sana noto‘g‘ri." };
    const trips = sortTrips(
      filterTrips(destination, args.query || "").filter(
        (t) => !args.date || t.date === args.date,
      ),
    );
    context.lastSearch = trips;
    return { ok: true, trips, count: trips.length };
  }
  const trip = tripById(args.tripId);
  if (!trip)
    return {
      ok: false,
      error: "Qatnov ID topilmadi. Faqat jadvaldagi ID ni tanlang.",
    };
  if (call.name === "get_trip") {
    context.readTrips.set(trip.id, trip);
    return { ok: true, trip };
  }
  let action;
  if (call.name === "open_request")
    action = { type: "open_request", tripId: trip.id };
  if (call.name === "prepare_request") {
    if (
      (args.name !== undefined && !validText(args.name, 80, true)) ||
      (args.cargo !== undefined && !validText(args.cargo, 500, true))
    )
      return { ok: false, error: "Ism yoki yuk tavsifi noto‘g‘ri." };
    action = {
      type: "prepare_request",
      tripId: trip.id,
      name: (args.name || "").trim(),
      cargo: (args.cargo ?? context.cargo ?? "").trim(),
      requiresConfirmation: true,
    };
  }
  if (call.name === "set_cargo") {
    if (!validText(args.cargo, 500))
      return {
        ok: false,
        error: "Yuk tavsifi bo‘sh bo‘lmasin va 500 belgidan oshmasin.",
      };
    action = { type: "set_cargo", tripId: trip.id, cargo: args.cargo.trim() };
  }
  if (call.name === "request_telegram")
    action = {
      type: "send_telegram",
      tripId: trip.id,
      requiresConfirmation: true,
    };
  if (!action) return { ok: false, error: "Amal topilmadi." };
  context.readTrips.set(trip.id, trip);
  // Repeating a function call must not create duplicate client actions.
  const key = JSON.stringify(action);
  if (!context.actionKeys.has(key)) {
    context.actions.push(action);
    context.actionKeys.add(key);
  }
  return {
    ok: true,
    trip,
    action,
    status: "proposed",
    requiresConfirmation: action.requiresConfirmation === true,
    notice:
      "Bu faqat interfeys amali taklifi. So‘rov yaratilgani yoki xabar yuborilganini anglatmaydi.",
  };
}
function toolSummary(call, result) {
  if (!result.ok)
    return "Vosita parametrlari qabul qilinmadi; hech qanday amal bajarilmadi.";
  if (call.name === "search_trips")
    return `${result.count} ta haqiqiy qatnov topildi.`;
  if (call.name === "get_trip")
    return `${result.trip.id} yo‘nalishi va jo‘nash vaqti tekshirildi.`;
  return call.name === "request_telegram"
    ? "Telegram uchun foydalanuvchi tasdig‘i so‘raldi; xabar yuborilmadi."
    : `${result.trip.id} uchun ${call.name === "open_request" ? "shaklni ochish" : "qoralama"} taklifi tayyorlandi.`;
}
function searchSummary(trips) {
  return trips.length
    ? `Jadval bo‘yicha ${trips.length} ta mos qatnov:\n${trips.map((t) => `${t.id}: ${t.from} → ${t.to}, ${t.date} ${t.time}`).join("\n")}`
    : "Tanlangan shartlarga mos qatnov jadvalda topilmadi.";
}
function deterministicReply(context) {
  const trips = context.lastSearch ?? [...context.readTrips.values()];
  let reply =
    trips.length || context.lastSearch !== null
      ? searchSummary(trips)
      : "So‘ralgan amalni tekshirdim. Quyidagi takliflarni ko‘rib chiqing.";
  if (context.actions.some((a) => a.requiresConfirmation))
    reply +=
      "\n\nSo‘rov yoki xabar hali yuborilmadi. Davom etish uchun taklifni tekshirib, tasdiqlash tugmasini bosing.";
  else if (context.actions.length)
    reply += "\n\nShakl uchun amallar quyida tayyor.";
  return reply;
}
function groundedReply(text, context) {
  const mentioned = [...text.matchAll(/\bY\d{2}\b/g)].map((match) => match[0]);
  const allowed = new Set((context.lastSearch ?? TRIPS).map((t) => t.id));
  if (mentioned.some((id) => !allowed.has(id)))
    return deterministicReply(context);
  if (
    /(yuborildi|yubordim|yaratildi|yaratdim|band\s+qilindi|band\s+qildim|bron\s+qilindi|to‘landi|jo‘natildi)/i.test(
      text,
    )
  )
    return deterministicReply(context);
  return text || deterministicReply(context);
}

/** Native function-calling agent; only validated proposals are returned, never external writes. */
export async function runAgent(payload, options = {}) {
  const data = prepareAiConversation(payload);
  data.system =
    data.system.replace(
      "Hech qanday vosita yoki tashqi qidiruvga ulanmagansan.",
      "Faqat Yo‘lchi uchun berilgan xavfsiz vositalardan foydalana olasan. Tashqi qidiruv yo‘q.",
    ) +
    "\n\nSENING AGENT VAZIFANG: Qatnovni qidirish yoki solishtirish savolida search_trips, bitta qatnovni tekshirishda get_trip ni chaqir. Faqat vosita natijasidagi qatnovlarni tavsiya qil. Foydalanuvchi shaklni ochishni so‘rasa open_request, yuk matnini yozishni so‘rasa set_cargo, ism va yuk bilan qoralama so‘rasa prepare_request dan foydalan. Noma’lum ismni to‘qima. Telegram so‘ralsa faqat request_telegram tasdiq taklifini yarat. Har bir yozuvchi amal faqat TAKLIF; yaratildi/yuborildi deb aytma. Foydalanuvchi tasdiqlashni alohida interfeysda bajaradi. Parametr xatosi bo‘lsa tuzat yoki aniqlashtir. Keraksiz takroriy vosita chaqirma. Oxirida vosita natijalarini oddiy o‘zbekcha matn bilan tushuntir.";
  const transport = createAiTransport(options),
    turns = [];
  const context = {
    cargo: payload.cargo,
    lastSearch: null,
    readTrips: new Map(),
    actions: [],
    actionKeys: new Set(),
  };
  const tools = [];
  let totalCalls = 0,
    last = { provider: "", model: "" },
    reply = "";
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let response;
    try {
      response = await transport.request((candidate, fetchImpl, signal) =>
        modelRound(candidate, data, turns, round, fetchImpl, signal),
      );
    } catch (error) {
      if (error.code === "AI_CANCELLED" || !tools.length) throw error;
      reply = deterministicReply(context);
      break;
    }
    last = { provider: response.provider, model: response.model };
    const turn = response.result;
    turns.push(turn);
    if (!turn.calls.length) {
      reply = groundedReply(transport.redact(turn.content), context);
      break;
    }
    for (const call of turn.calls) {
      if (totalCalls >= MAX_TOOL_CALLS) break;
      if (options.signal?.aborted)
        throw new AiError("Javob kutish bekor qilindi.", 499, "AI_CANCELLED");
      totalCalls++;
      call.args = transport.redact(call.args);
      const result = execute(call, context);
      tools.push({
        name: KNOWN.has(call.name) ? call.name : "invalid_tool",
        summary: toolSummary(call, result),
      });
      turns.push({ role: "tool", id: call.id, name: call.name, result });
    }
    if (
      totalCalls >= MAX_TOOL_CALLS ||
      round === MAX_ROUNDS - 1 ||
      transport.remaining() <= 0
    ) {
      reply = deterministicReply(context);
      break;
    }
  }
  return transport.redact({
    reply: reply || deterministicReply(context),
    ...last,
    tools,
    trips: context.lastSearch ?? [...context.readTrips.values()],
    actions: context.actions,
  });
}
