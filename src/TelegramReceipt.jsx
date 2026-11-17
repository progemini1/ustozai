import React, { useEffect, useState } from "react";
import { Button, Link } from "./ui.jsx";
import { useAuth } from "./AuthContext.jsx";
import { Icon } from "./icons.jsx";
import "./TelegramReceipt.css";
const key = "yolchi.telegram.sent.v1";
function readSent() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export default function TelegramReceipt({ receipt }) {
  const { user, session, saveReceipt } = useAuth();
  const [state, setState] = useState(() =>
      readSent().includes(receipt.id) ? "sent" : "idle",
    ),
    [error, setError] = useState("");
  const [configured, setConfigured] = useState(null);
  useEffect(() => {
    const sent = (e) => {
      if (e.detail === receipt.id) setState("sent");
    };
    window.addEventListener("yolchi:telegram-sent", sent);
    return () => window.removeEventListener("yolchi:telegram-sent", sent);
  }, [receipt.id]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setConfigured(Boolean(data.telegram?.configured)))
      .catch(() => {
        if (!controller.signal.aborted) setConfigured(false);
      });
    return () => controller.abort();
  }, []);
  const send = async () => {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    setError("");
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 14000);
    try {
      const saved = await saveReceipt(receipt);
      if (!saved.ok) throw new Error(saved.error);
      const response = await fetch("/api/telegram/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ receipt }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || !data.sent)
        throw new Error(
          data.error || "Telegramga yuborilmadi. Qayta urinib ko‘ring.",
        );
      setState("sent");
      try {
        localStorage.setItem(
          key,
          JSON.stringify([...new Set([...readSent(), receipt.id])].slice(-500)),
        );
      } catch {}
    } catch (error) {
      setState("error");
      setError(
        error.name === "AbortError"
          ? "Telegram javobi kechikdi. Qayta urinib ko‘ring."
          : error.message || "Ulanishda xato. Tasdiq shu brauzerda mavjud.",
      );
    } finally {
      clearTimeout(timer);
    }
  };
  return (
    <section
      className="telegram-receipt"
      aria-label="Tasdiqni Telegramga yuborish"
    >
      <span className="telegram-mark">
        <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
          <path
            fill="currentColor"
            d="m21.5 3.4-3.3 16.1c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.5-.6-.2L5.6 13l-5-1.6c-1.1-.3-1.1-1.1.2-1.6L20.3 2.3c.9-.3 1.6.2 1.2 1.1Z"
          />
        </svg>
      </span>
      <div className="telegram-copy">
        <h2>
          {state === "sent"
            ? "Telegramga yuborildi"
            : "Tasdiq Telegramda ham yoningizda."}
        </h2>
        <p>
          {state === "sent"
            ? "Tasdiq ulangan Telegram chatiga yetkazildi. Bu transport bron qilinganini bildirmaydi."
            : configured === false
              ? "Telegram ulanishi hozir mavjud emas. Tasdiqni faylga yuklab olishingiz mumkin."
              : "Bosganingizda ism, yuk tavsifi va tanlangan qatnov ulangan Telegram chatiga yuboriladi."}
        </p>
        {error && (
          <p className="telegram-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {!user ? (
        <Link to="/kirish" className="inline-action">
          Google orqali kirish <Icon name="out" size={16} />
        </Link>
      ) : (
        <Button
          variant="outlined"
          icon={state === "sent" ? "check" : "out"}
          disabled={
            state === "sending" || state === "sent" || configured !== true
          }
          onClick={send}
        >
          {state === "sent"
            ? "Yetkazildi"
            : state === "sending"
              ? "Yuborilmoqda…"
              : configured === null
                ? "Tekshirilmoqda…"
                : state === "error"
                  ? "Qayta yuborish"
                  : "Telegramga yuborish"}
        </Button>
      )}
      {state === "sent" && (
        <span className="sr-only" role="status">
          Tasdiq Telegramga muvaffaqiyatli yuborildi.
        </span>
      )}
    </section>
  );
}
