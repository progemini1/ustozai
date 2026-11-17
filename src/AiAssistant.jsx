import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { tripById, dateLabel } from "./domain.js";
import { go } from "./ui.jsx";
import "./AiAssistant.css";

const CONVERSATION_KEY = "yolchi.ai.conversation.v1";
const MAX_INPUT = 2000;
const MAX_HISTORY = 10;

// Keep the latest question intact and fit useful recent context into the API budget.
function compactHistory(messages) {
  let remaining = 11000;
  const compacted = [];
  for (const message of messages.slice(-MAX_HISTORY).reverse()) {
    if (!remaining) break;
    const content = message.content.slice(
      0,
      Math.min(remaining, message.role === "user" ? MAX_INPUT : 4000),
    );
    if (!content) continue;
    compacted.unshift({ role: message.role, content });
    remaining -= content.length;
  }
  while (compacted.length > 1 && compacted[0].role === "assistant")
    compacted.shift();
  return compacted;
}
function mentionedTrips(content) {
  return [
    ...new Set(
      (content.match(/\bY\d{2}\b/gi) || []).map((id) => id.toUpperCase()),
    ),
  ]
    .map(tripById)
    .filter(Boolean);
}

function agentResult(value, contextTripId) {
  const tools = Array.isArray(value.tools)
    ? value.tools
        .slice(0, 20)
        .filter(
          (tool) =>
            tool &&
            typeof tool.name === "string" &&
            typeof tool.summary === "string" &&
            tool.summary.trim(),
        )
        .map((tool) => ({
          name: tool.name.slice(0, 80),
          summary: tool.summary.trim().slice(0, 220),
        }))
    : [];
  const trips = Array.isArray(value.trips)
    ? [
        ...new Set(
          value.trips.map((trip) => trip?.id).filter((id) => tripById(id)),
        ),
      ].map(tripById)
    : [];
  const actions = [];
  if (Array.isArray(value.actions))
    for (const source of value.actions.slice(0, 8)) {
      if (!source || typeof source.type !== "string") continue;
      if (source.type === "send_telegram") {
        actions.push({
          type: "send_telegram",
          ...(tripById(source.tripId) ? { tripId: source.tripId } : {}),
          requiresConfirmation: true,
        });
        continue;
      }
      if (
        !["open_request", "set_cargo", "prepare_request"].includes(source.type)
      )
        continue;
      const tripId = source.tripId || contextTripId;
      if (!tripById(tripId)) continue;
      const name = typeof source.name === "string" ? source.name.trim() : "";
      const cargo = typeof source.cargo === "string" ? source.cargo.trim() : "";
      if (
        name.length > 80 ||
        cargo.length > 500 ||
        (source.type === "set_cargo" && !cargo)
      )
        continue;
      actions.push({
        type: source.type,
        tripId,
        ...(name ? { name } : {}),
        ...(cargo ? { cargo } : {}),
        ...(source.type === "prepare_request"
          ? { requiresConfirmation: true }
          : {}),
      });
    }
  return {
    tools,
    trips,
    actions: [
      ...new Map(
        actions.map((action) => [JSON.stringify(action), action]),
      ).values(),
    ],
  };
}

function ActionStatus({ state }) {
  if (!state) return null;
  return (
    <div
      className={`ai-action-status ${state.pending ? "pending" : state.ok ? "success" : "error"}`}
      role={state.ok || state.pending ? "status" : "alert"}
    >
      <Icon
        name={state.pending ? "clock" : state.ok ? "check" : "info"}
        size={15}
      />
      <span>
        {state.pending
          ? "Amal bajarilmoqda…"
          : state.ok
            ? state.label
            : state.error}
      </span>
    </div>
  );
}

function AgentRunView({ run, runId, status, onAction, currentReceipt }) {
  const receiptTrip = tripById(currentReceipt?.tripId);
  const hasReceipt =
    receiptTrip &&
    typeof currentReceipt?.name === "string" &&
    typeof currentReceipt?.cargo === "string";
  return (
    <div className="ai-agent-result">
      {run.tools.length > 0 && (
        <div
          className="ai-tool-trace"
          aria-label="Yordamchi bajargan tekshiruvlar"
        >
          {run.tools.map((tool, index) => (
            <span key={`${tool.name}-${index}`}>
              <Icon name="check" size={12} />
              {tool.summary}
            </span>
          ))}
        </div>
      )}
      {run.trips.length > 0 && (
        <div className="ai-agent-trips" aria-label="Topilgan qatnovlar">
          {run.trips.map((trip) => (
            <div className="ai-agent-trip" key={trip.id}>
              <div className="ai-agent-trip-top">
                <span>{trip.id}</span>
                <strong>{trip.time}</strong>
                <small>{dateLabel(trip.date)}</small>
              </div>
              <p>
                {trip.from}
                <Icon name="arrow" size={13} />
                <b>{trip.to}</b>
              </p>
              <button
                aria-label={`${trip.id} qatnovini ochish`}
                onClick={() =>
                  onAction(
                    { type: "open_request", tripId: trip.id },
                    `${runId}:trip:${trip.id}`,
                  )
                }
              >
                Qatnovni tanlash
                <Icon name="out" size={14} />
              </button>
              <ActionStatus state={status[`${runId}:trip:${trip.id}`]} />
            </div>
          ))}
        </div>
      )}
      {run.actions.map((action, index) => {
        const base = `${runId}:action:${index}`;
        if (action.type === "open_request" || action.type === "set_cargo")
          return <ActionStatus key={base} state={status[base]} />;
        if (action.type === "prepare_request") {
          const trip = tripById(action.tripId),
            fillKey = `${base}:fill`,
            createKey = `${base}:create`;
          const complete = Boolean(action.name?.trim() && action.cargo?.trim());
          return (
            <section
              className="ai-confirm-card"
              key={base}
              aria-label="So‘rovni tasdiqlash"
            >
              <div className="ai-confirm-heading">
                <span>
                  <Icon name="shield" size={17} />
                </span>
                <div>
                  <p>QAROR SIZDA</p>
                  <h4>So‘rovni ko‘rib chiqing</h4>
                </div>
                <b>{trip.id}</b>
              </div>
              <div className="ai-confirm-route">
                <strong>
                  {trip.from}
                  <Icon name="arrow" size={15} />
                  {trip.to}
                </strong>
                <span>
                  <Icon name="clock" size={13} />
                  {trip.date} · {trip.time}
                </span>
              </div>
              <dl>
                <div>
                  <dt>Ism</dt>
                  <dd>{action.name || "Shaklda to‘ldiring"}</dd>
                </div>
                <div>
                  <dt>Yuk tavsifi</dt>
                  <dd>{action.cargo || "Shaklda to‘ldiring"}</dd>
                </div>
              </dl>
              <p className="ai-confirm-note">
                {complete
                  ? "Tasdiq faqat siz tugmani bosganingizdan keyin yaratiladi."
                  : "Yetishmagan ma’lumotlarni so‘rov shaklida to‘ldiring."}
              </p>
              <div className="ai-confirm-buttons">
                <button
                  className="ai-confirm-secondary"
                  disabled={status[fillKey]?.pending}
                  onClick={() =>
                    onAction({ ...action, type: "fill_request" }, fillKey)
                  }
                >
                  Shaklga joylash
                  <Icon name="edit" size={14} />
                </button>
                <button
                  className="ai-confirm-primary"
                  disabled={
                    !complete ||
                    status[createKey]?.pending ||
                    status[createKey]?.ok
                  }
                  onClick={() =>
                    onAction(
                      {
                        ...action,
                        type: "create_request",
                        requiresConfirmation: true,
                      },
                      createKey,
                    )
                  }
                >
                  {status[createKey]?.ok
                    ? "Tasdiq yaratildi"
                    : "Tasdiq yaratish"}
                  <Icon name="check" size={15} />
                </button>
              </div>
              <ActionStatus state={status[fillKey]} />
              <ActionStatus state={status[createKey]} />
            </section>
          );
        }
        if (action.type === "send_telegram") {
          const sendKey = `${base}:send`;
          return (
            <section
              className="ai-confirm-card ai-telegram-card"
              key={base}
              aria-label="Telegramga yuborishni tasdiqlash"
            >
              <div className="ai-confirm-heading">
                <span>
                  <Icon name="out" size={18} />
                </span>
                <div>
                  <p>YUBORISHNI TASDIQLANG</p>
                  <h4>Tasdiqni Telegramga yuborish</h4>
                </div>
              </div>
              {hasReceipt ? (
                <>
                  <div className="ai-confirm-route">
                    <strong>
                      {receiptTrip.from}
                      <Icon name="arrow" size={15} />
                      {receiptTrip.to}
                    </strong>
                    <span>
                      {receiptTrip.id} · {receiptTrip.date}, {receiptTrip.time}
                    </span>
                  </div>
                  <dl>
                    <div>
                      <dt>Ism</dt>
                      <dd>{currentReceipt.name}</dd>
                    </div>
                    <div>
                      <dt>Yuk tavsifi</dt>
                      <dd>{currentReceipt.cargo}</dd>
                    </div>
                  </dl>
                  <p className="ai-confirm-note">
                    Ushbu ma’lumotlar ulangan Telegram suhbatiga yuboriladi. Bu
                    haqiqiy transport broni hisoblanmaydi.
                  </p>
                </>
              ) : (
                <p className="ai-confirm-note">
                  Avval yubormoqchi bo‘lgan so‘rovingiz tasdig‘ini oching.
                  Telegramga aynan ochilgan tasdiq yuboriladi.
                </p>
              )}
              <button
                className="ai-confirm-primary ai-telegram-send"
                disabled={
                  !hasReceipt || status[sendKey]?.pending || status[sendKey]?.ok
                }
                onClick={() =>
                  onAction(
                    { type: "send_telegram", requiresConfirmation: true },
                    sendKey,
                  )
                }
              >
                {status[sendKey]?.ok
                  ? "Telegramga yuborildi"
                  : status[sendKey]?.pending
                    ? "Yuborilmoqda…"
                    : "Telegramga yuborish"}
                <Icon name="out" size={15} />
              </button>
              <ActionStatus state={status[sendKey]} />
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}

function readConversation(ownerId = "guest") {
  const storageKey = CONVERSATION_KEY + "." + ownerId;
  try {
    const storage = window.sessionStorage;
    const raw = storage.getItem(storageKey);
    if (!raw) return { messages: [], mode: "available" };
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      return { messages: [], mode: "corrupt" };
    }
    if (
      !Array.isArray(value) ||
      !value.every(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string" &&
          message.content.trim().length > 0 &&
          message.content.length <=
            (message.role === "user" ? MAX_INPUT : 24000),
      )
    ) {
      return { messages: [], mode: "corrupt" };
    }
    return {
      messages: value
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content })),
      mode: "available",
    };
  } catch {
    return { messages: [], mode: "unavailable" };
  }
}

function Spark({ size = 23 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2c.7 6.2 3.8 9.3 10 10-6.2.7-9.3 3.8-10 10C11.3 15.8 8.2 12.7 2 12 8.2 11.3 11.3 8.2 12 2Z"
        fill="currentColor"
      />
      <path
        d="m20 1 .6 2.4L23 4l-2.4.6L20 7l-.6-2.4L17 4l2.4-.6L20 1Z"
        fill="currentColor"
        opacity=".55"
      />
    </svg>
  );
}

export default function AiAssistant({
  ownerId = "guest",
  tripId,
  onUseCargo,
  onAgentAction,
  currentReceipt,
}) {
  const storageKey = CONVERSATION_KEY + "." + ownerId;
  const [initial] = useState(() => readConversation(ownerId));
  const [messages, setMessages] = useState(initial.messages);
  const [storageMode, setStorageMode] = useState(initial.mode);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [failedRequest, setFailedRequest] = useState(null);
  const [agentRuns, setAgentRuns] = useState({});
  const [actionStatus, setActionStatus] = useState({});
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const transcriptRef = useRef(null);
  const openerRef = useRef(null);
  const requestRef = useRef(null);
  const mountedRef = useRef(true);
  const runCounterRef = useRef(0);
  const pendingActionsRef = useRef(new Set());
  const completedActionsRef = useRef(new Set());
  const trip = tripById(tripId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (storageMode !== "available" || !messages.length) return;
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify(
          messages
            .slice(-MAX_HISTORY)
            .map(({ role, content }) => ({ role, content })),
        ),
      );
    } catch {
      setStorageMode("unavailable");
    }
  }, [messages, storageMode]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      if (dialog.open) dialog.close();
      if (openerRef.current?.isConnected)
        openerRef.current.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (open && transcriptRef.current)
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: "auto",
      });
  }, [
    messages,
    pending,
    error,
    open,
    agentRuns,
    actionStatus,
    currentReceipt?.id,
  ]);

  const closePanel = () => {
    requestRef.current?.abort();
    setOpen(false);
  };
  const openPanel = () => {
    openerRef.current = document.activeElement;
    setOpen(true);
  };

  async function performAction(action, key) {
    if (
      pendingActionsRef.current.has(key) ||
      completedActionsRef.current.has(key)
    )
      return;
    pendingActionsRef.current.add(key);
    setActionStatus((previous) => ({ ...previous, [key]: { pending: true } }));
    try {
      if (typeof onAgentAction !== "function")
        throw new Error(
          "Amalni yakunlab bo‘lmadi. So‘rov shaklini ochib davom eting.",
        );
      const outcome = await onAgentAction(action);
      if (!outcome?.ok)
        throw new Error(
          outcome?.error || "Amal bajarilmadi. Qayta urinib ko‘ring.",
        );
      if (["create_request", "send_telegram"].includes(action.type))
        completedActionsRef.current.add(key);
      if (mountedRef.current)
        setActionStatus((previous) => ({
          ...previous,
          [key]: {
            ok: true,
            label:
              typeof outcome.label === "string"
                ? outcome.label.slice(0, 400)
                : "Amal bajarildi.",
          },
        }));
      return outcome;
    } catch (caught) {
      if (mountedRef.current)
        setActionStatus((previous) => ({
          ...previous,
          [key]: {
            ok: false,
            error:
              typeof caught.message === "string"
                ? caught.message.slice(0, 400)
                : "Amalni yakunlab bo‘lmadi.",
          },
        }));
      return { ok: false };
    } finally {
      pendingActionsRef.current.delete(key);
    }
  }

  async function requestAnswer(payload) {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);
    setError("");
    setFailedRequest(null);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 35000);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          messages: compactHistory(payload.messages),
        }),
        signal: controller.signal,
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          "Yordamchi bilan bog‘lanib bo‘lmadi. Bir ozdan keyin qayta urinib ko‘ring.",
        );
      }
      if (!response.ok) {
        const message =
          typeof result?.error === "string" && result.error.trim()
            ? result.error.trim().slice(0, 400)
            : "Yordamchi hozir javob bera olmadi. Qayta urinib ko‘ring.";
        throw new Error(message);
      }
      if (
        typeof result?.reply !== "string" ||
        !result.reply.trim() ||
        result.reply.length > 8000
      )
        throw new Error(
          "Javobni o‘qib bo‘lmadi. Savolingizni qayta yuborib ko‘ring.",
        );
      if (controller.signal.aborted || !mountedRef.current) return;
      const runId = `run-${++runCounterRef.current}`;
      const run = agentResult(result, payload.tripId);
      setAgentRuns((previous) => ({ ...previous, [runId]: run }));
      setMessages((previous) =>
        [
          ...previous,
          { role: "assistant", content: result.reply.trim(), runId },
        ].slice(-MAX_HISTORY),
      );
      for (const [index, action] of run.actions.entries()) {
        if (!mountedRef.current || controller.signal.aborted) break;
        if (action.type === "open_request" || action.type === "set_cargo")
          await performAction(action, `${runId}:action:${index}`);
      }
    } catch (caught) {
      if (!mountedRef.current) return;
      setError(
        controller.signal.aborted
          ? timedOut
            ? "Javob kutilganidan uzoq davom etdi. Qayta urinib ko‘ring."
            : "Javob olish to‘xtatildi. Istasangiz, qayta urinib ko‘ring."
          : caught instanceof TypeError
            ? "Ulanishda xatolik yuz berdi. Internet aloqasini tekshirib, qayta urinib ko‘ring."
            : caught.message ||
              "Ulanishda xatolik yuz berdi. Qayta urinib ko‘ring.",
      );
      setFailedRequest(payload);
    } finally {
      clearTimeout(timer);
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (mountedRef.current) {
          setPending(false);
          requestAnimationFrame(() => {
            if (dialogRef.current?.open)
              inputRef.current?.focus({ preventScroll: true });
          });
        }
      }
    }
  }

  function sendMessage(value = input) {
    const content = value.trim();
    if (!content || pending || requestRef.current) return;
    if (content.length > MAX_INPUT) {
      setError("Savol 2000 belgidan oshmasin. Uni qisqaroq yozing.");
      return;
    }
    const next = [...messages, { role: "user", content }].slice(-MAX_HISTORY);
    setMessages(next);
    setInput("");
    requestAnswer({ messages: next, ...(trip ? { tripId: trip.id } : {}) });
  }

  function newConversation() {
    if (pending || pendingActionsRef.current.size) return;
    setMessages([]);
    setInput("");
    setError("");
    setFailedRequest(null);
    setAgentRuns({});
    setActionStatus({});
    completedActionsRef.current.clear();
    if (storageMode === "available") {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        setStorageMode("unavailable");
      }
    }
    inputRef.current?.focus();
  }

  const suggestions = [
    {
      icon: "truck",
      label: trip ? `${trip.id} qatnovi haqida` : "B tumaniga qatnov topish",
      question: trip
        ? `${trip.id} qatnovining yo‘nalishi va vaqtini ayting. So‘rov yuborish uchun nima qilishim kerak?`
        : "20-noyabr kuni B tumaniga qaysi qatnovlar bor? Yo‘nalishi va vaqtini ayting.",
    },
    {
      icon: "box",
      label: "Yukni qanday qadoqlayman?",
      question:
        "2 quti kitobni jo‘natish uchun qanday qadoqlashim kerak? Qisqa, amaliy tavsiyalar bering.",
    },
    {
      icon: "edit",
      label: "Yuk tavsifini yozishda yordam",
      question:
        "Yuk tavsifini qisqa va aniq yozishga yordam bering. Qaysi ma’lumotlarni yozishim kerak?",
    },
  ];

  return (
    <>
      <button
        className="ai-launcher"
        onClick={openPanel}
        aria-label="Yo‘lchi AI yordamchisini ochish"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="ai-launcher-spark">
          <Spark size={21} />
        </span>
        <span>
          Yo‘lchi <b>AI</b>
        </span>
        <Icon name="arrow" size={17} />
      </button>
      <dialog
        ref={dialogRef}
        className="ai-dialog"
        aria-labelledby="ai-title"
        aria-describedby="ai-description"
        onCancel={(event) => {
          event.preventDefault();
          closePanel();
        }}
        onClick={(event) => {
          if (event.target !== dialogRef.current) return;
          const rect = dialogRef.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            closePanel();
        }}
      >
        <div className="ai-panel">
          <header className="ai-header">
            <span className="ai-avatar">
              <Spark size={24} />
            </span>
            <div>
              <h2 id="ai-title">
                Yo‘lchi yordamchi <span>AI</span>
              </h2>
              <p id="ai-description">Yuk va yo‘nalish bo‘yicha suhbat</p>
            </div>
            <div className="ai-header-actions">
              <button
                onClick={newConversation}
                disabled={
                  pending ||
                  !messages.length ||
                  Object.values(actionStatus).some((state) => state.pending)
                }
                aria-label="Yangi AI suhbatini boshlash"
                title="Yangi suhbat"
              >
                <Icon name="refresh" size={18} />
              </button>
              <button
                onClick={closePanel}
                aria-label="AI yordamchisini yopish"
                title="Yopish"
              >
                <Icon name="close" size={21} />
              </button>
            </div>
          </header>
          {trip && (
            <div className="ai-trip-context">
              <Icon name="pin" size={14} />
              <span>
                {trip.id} <i>·</i> {trip.from} <Icon name="arrow" size={12} />{" "}
                {trip.to}
              </span>
            </div>
          )}
          <div ref={transcriptRef} className="ai-transcript">
            {!messages.length && (
              <div className="ai-welcome">
                <div className="ai-welcome-art" aria-hidden="true">
                  <span className="ai-orbit ai-orbit-one" />
                  <span className="ai-orbit ai-orbit-two" />
                  <span className="ai-welcome-spark">
                    <Spark size={39} />
                  </span>
                  <span className="ai-art-dot dot-one" />
                  <span className="ai-art-dot dot-two" />
                </div>
                <p className="ai-eyebrow">KICHIK SAVOL. FOYDALI YORDAM.</p>
                <h3>Birga yo‘l topamiz.</h3>
                <p>
                  Qatnovlarni solishtirish, yukni tayyorlash yoki tavsif
                  yozishda yordam so‘rang.
                </p>
                <div className="ai-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => sendMessage(suggestion.question)}
                    >
                      <span>
                        <Icon name={suggestion.icon} size={18} />
                        {suggestion.label}
                      </span>
                      <Icon name="out" size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div
              className="ai-messages"
              role="log"
              aria-label="AI suhbat xabarlari"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((message, index) => (
                <article
                  className={`ai-message ai-message-${message.role}`}
                  key={`${index}-${message.role}-${message.content.slice(0, 20)}`}
                >
                  <div className="ai-message-label">
                    {message.role === "assistant" ? (
                      <>
                        <Spark size={12} />
                        <span>Yo‘lchi</span>
                      </>
                    ) : (
                      <span>Siz</span>
                    )}
                  </div>
                  <div className="ai-message-bubble">{message.content}</div>
                  {message.role === "assistant" &&
                    message.runId &&
                    agentRuns[message.runId] && (
                      <AgentRunView
                        run={agentRuns[message.runId]}
                        runId={message.runId}
                        status={actionStatus}
                        onAction={performAction}
                        currentReceipt={currentReceipt}
                      />
                    )}
                  {message.role === "assistant" &&
                    !agentRuns[message.runId]?.trips.length &&
                    mentionedTrips(message.content).length > 0 && (
                      <div
                        className="ai-route-actions"
                        aria-label="Javobdagi qatnovlarni ochish"
                      >
                        {mentionedTrips(message.content).map((mentioned) => (
                          <button
                            key={mentioned.id}
                            aria-label={`${mentioned.id} qatnovini ochish`}
                            onClick={() => {
                              closePanel();
                              go(`/sorov/${mentioned.id}`);
                            }}
                          >
                            <span>{mentioned.id}</span>
                            {mentioned.to}
                            <Icon name="out" size={13} />
                            <span className="sr-only">
                              {mentioned.id} qatnovini ochish
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  {message.role === "assistant" &&
                    onUseCargo &&
                    message.content.length <= 500 && (
                      <button
                        className="ai-use-cargo"
                        onClick={() => {
                          onUseCargo(message.content);
                          closePanel();
                        }}
                      >
                        <Icon name="edit" size={14} />
                        Yuk tavsifiga qo‘yish
                        <Icon name="arrow" size={14} />
                      </button>
                    )}
                </article>
              ))}
            </div>
            {pending && (
              <div className="ai-pending" role="status">
                <span className="ai-pending-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>Yordamchi javob tayyorlamoqda…</span>
              </div>
            )}
            {error && (
              <div className="ai-error" role="alert">
                <Icon name="info" size={18} />
                <div>
                  <p>{error}</p>
                  {failedRequest && !pending && (
                    <button onClick={() => requestAnswer(failedRequest)}>
                      <Icon name="refresh" size={14} />
                      Qayta urinish
                    </button>
                  )}
                </div>
              </div>
            )}
            {storageMode !== "available" && (
              <p className="ai-storage-note">
                <Icon name="shield" size={13} />
                {storageMode === "corrupt"
                  ? "Oldingi suhbat nusxasini o‘qib bo‘lmadi. Asl nusxa o‘zgartirilmadi."
                  : "Suhbat shu oynada qoladi. Brauzer xotirasiga saqlash cheklangan."}
              </p>
            )}
          </div>
          <div className="ai-compose-area">
            <form
              className="ai-compose"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <label className="sr-only" htmlFor="ai-question">
                AI yordamchisiga savolingiz
              </label>
              <textarea
                ref={inputRef}
                id="ai-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={MAX_INPUT}
                rows={2}
                placeholder="Yukingiz yoki qatnov haqida so‘rang…"
                disabled={pending}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="ai-compose-bottom">
                <span>
                  {input.length
                    ? `${input.length} / ${MAX_INPUT}`
                    : "Enter — yuborish · Shift + Enter — yangi qator"}
                </span>
                {pending ? (
                  <button
                    type="button"
                    className="ai-stop"
                    onClick={() => requestRef.current?.abort()}
                    aria-label="AI javobini olishni to‘xtatish"
                  >
                    <span />
                    To‘xtatish
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ai-send"
                    disabled={!input.trim()}
                    aria-label="Savolni AI yordamchisiga yuborish"
                  >
                    <Icon name="arrow" size={19} />
                  </button>
                )}
              </div>
            </form>
            <p className="ai-disclaimer">
              <Spark size={11} />
              AI javobini tekshiring. Haqiqiy bron amalga oshirilmaydi.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
