import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DESTINATIONS, TRIPS } from "./content.js";
import { tripById, validReceipt, dateLabel, MONTHS } from "./domain.js";
import { Icon } from "./icons.jsx";
import { Button, Link, go } from "./ui.jsx";
import "./RequestsPage.css";

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[‘’ʻʼ`]/g, "'")
    .trim();
}
function createdLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sana ko‘rsatilmagan";
  return `${date.getDate()}-${MONTHS[date.getMonth()]}`;
}
function exportBackup(receipts) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(receipts, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `yolchi-sorovlar-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function TicketArtwork() {
  return (
    <svg
      className="rp-ticket-art"
      viewBox="0 0 340 230"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="170"
        cy="195"
        rx="126"
        ry="17"
        fill="currentColor"
        opacity=".05"
      />
      <g transform="translate(49 38) rotate(-13 115 74)">
        <rect
          width="230"
          height="144"
          rx="18"
          fill="var(--md-sys-color-surface-container-highest)"
          stroke="var(--md-sys-color-outline-variant)"
        />
        <path
          d="M167 0v144"
          stroke="currentColor"
          strokeDasharray="3 5"
          opacity=".2"
        />
      </g>
      <g transform="translate(51 45) rotate(8 115 74)">
        <rect
          width="230"
          height="144"
          rx="18"
          fill="var(--md-sys-color-surface-container-lowest)"
          stroke="var(--md-sys-color-outline-variant)"
        />
        <circle
          cx="25"
          cy="28"
          r="9"
          fill="var(--md-sys-color-primary-container)"
        />
        <path d="m21 28 3 3 5-6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M44 25h58M44 32h36"
          stroke="currentColor"
          opacity=".2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M167 0v144"
          stroke="currentColor"
          strokeDasharray="3 5"
          opacity=".2"
        />
        <circle cx="24" cy="66" r="3" fill="currentColor" />
        <path
          d="M24 71v24"
          stroke="currentColor"
          strokeDasharray="2 3"
          opacity=".3"
        />
        <circle cx="24" cy="100" r="3" stroke="currentColor" />
        <path
          d="M38 66h85M38 100h62"
          stroke="currentColor"
          opacity=".45"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M20 124h66M98 124h38"
          stroke="currentColor"
          opacity=".12"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g stroke="currentColor" opacity=".55">
          <path d="M184 45v46M188 45v46M195 45v46M200 45v46M203 45v46M210 45v46" />
          <path d="M191 45v46M207 45v46" strokeWidth="2" />
        </g>
      </g>
      <circle
        cx="286"
        cy="50"
        r="22"
        fill="var(--md-sys-color-tertiary-container)"
      />
      <path
        d="m277 50 6 6 12-13"
        stroke="var(--md-sys-color-on-tertiary-container)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RequestsPage({
  receipts,
  onImport,
  notify,
  cloud = false,
}) {
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState("Barchasi");
  const [sort, setSort] = useState("recent");
  const [importState, setImportState] = useState(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef(null);
  const destinations = new Set(
    receipts.map((receipt) => tripById(receipt.tripId)?.to),
  );
  const routes = new Set(receipts.map((receipt) => receipt.tripId));
  const filtered = receipts
    .filter((receipt) => {
      const trip = tripById(receipt.tripId);
      return (
        trip &&
        (destination === "Barchasi" || trip.to === destination) &&
        normalize(
          `${receipt.name} ${receipt.cargo} ${receipt.number} ${trip.id} ${trip.from} ${trip.to}`,
        ).includes(normalize(query))
      );
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt) || 0,
        bTime = Date.parse(b.createdAt) || 0;
      return sort === "old" ? aTime - bTime : bTime - aTime;
    });
  const openImport = () => {
    setImportState(null);
    inputRef.current?.click();
  };
  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportState(null);
    try {
      if (file.size > 1024 * 1024)
        throw new Error(
          "Nusxa fayli 1 MB dan oshmasin. Yo‘lchi yaratgan JSON nusxasini tanlang.",
        );
      let items;
      try {
        items = JSON.parse(await file.text());
      } catch {
        throw new Error(
          "Bu faylda o‘qiladigan JSON nusxasi topilmadi. “Nusxani saqlash” orqali olingan faylni tanlang.",
        );
      }
      if (!Array.isArray(items))
        throw new Error("Nusxa so‘rovlar ro‘yxatidan iborat bo‘lishi kerak.");
      if (items.length === 0)
        throw new Error("Bu nusxa bo‘sh. Tiklanadigan so‘rov topilmadi.");
      if (items.length > 100)
        throw new Error(
          "Bir nusxada ko‘pi bilan 100 ta so‘rov bo‘lishi mumkin.",
        );
      if (
        !items.every(
          (item) =>
            validReceipt(item) &&
            item.number.length > 0 &&
            item.number.length <= 80,
        )
      )
        throw new Error(
          "Nusxadagi ayrim so‘rovlar to‘liq yoki mos emas. Mavjud so‘rovlaringiz o‘zgartirilmadi.",
        );
      if (new Set(items.map((item) => item.id)).size !== items.length)
        throw new Error(
          "Nusxada bir xil raqamli so‘rov takrorlangan. To‘g‘ri nusxani tanlang.",
        );
      if (!onImport)
        throw new Error(
          "Tiklashni yakunlab bo‘lmadi. Iltimos, sahifani qayta oching.",
        );
      const result = await onImport(items);
      if (!result?.ok)
        throw new Error(
          result?.error ||
            "So‘rovlar saqlanmadi. Brauzer xotirasiga kirishni tekshiring.",
        );
      const message = `${items.length} ta so‘rov nusxasi tekshirildi va tiklandi.`;
      setImportState({ type: "success", text: message });
      notify?.(message);
    } catch (error) {
      setImportState({
        type: "error",
        text: error.message || "Nusxani o‘qib bo‘lmadi.",
      });
    } finally {
      setImporting(false);
    }
  };
  const clearFilters = () => {
    setQuery("");
    setDestination("Barchasi");
  };

  return (
    <div className="requests-page">
      <div className="page-heading">
        <div>
          <p className="app-eyebrow">YUKINGIZNING KICHIK ARXIVI</p>
          <h1>Har bir so‘rov — o‘z o‘rnida.</h1>
          <p>
            Tayyorlagan ma’lumotlaringizni toping, tasdiqni oching yoki
            nusxasini saqlang.
          </p>
        </div>
        <Button icon="out" onClick={() => go("/qatnovlar")}>
          Yangi so‘rov
        </Button>
      </div>

      <section className="rp-overview" aria-label="So‘rovlar xulosasi">
        <div className="rp-overview-main">
          <div className="rp-overview-copy">
            <span className="rp-overline">
              <i /> SHAXSIY SO‘ROVLAR
            </span>
            <div className="rp-total">
              <strong>{String(receipts.length).padStart(2, "0")}</strong>
              <span>
                tayyorlangan
                <br />
                so‘rov
              </span>
            </div>
            <p>
              Manzil, ism va yuk tavsifi.
              <br />
              Kerakli ma’lumotlar bitta tasdiqda.
            </p>
          </div>
          <TicketArtwork />
        </div>
        <div className="rp-stat-stack">
          <div className="rp-stat-card">
            <span className="rp-stat-icon">
              <Icon name="pin" size={22} />
            </span>
            <div>
              <strong>
                {destinations.size}
                <span>/ {DESTINATIONS.length - 1}</span>
              </strong>
              <p>tanlangan hudud</p>
            </div>
            <span className="rp-stat-mark">A · B · C</span>
          </div>
          <div className="rp-stat-card">
            <span className="rp-stat-icon secondary">
              <Icon name="truck" size={22} />
            </span>
            <div>
              <strong>
                {routes.size}
                <span>/ {TRIPS.length}</span>
              </strong>
              <p>foydalanilgan qatnov</p>
            </div>
            <span className="rp-stat-mark">
              <Icon name="arrow" size={21} />
            </span>
          </div>
        </div>
      </section>

      <section className="rp-archive" aria-labelledby="requests-title">
        <div className="rp-section-heading">
          <div>
            <span className="rp-overline">SO‘ROVLAR TARIXI</span>
            <h2 id="requests-title">
              Siz tayyorlagan so‘rovlar <span>{receipts.length}</span>
            </h2>
          </div>
          <div className="rp-backup-actions">
            <Button
              variant="outlined"
              icon="download"
              disabled={!receipts.length}
              onClick={() => exportBackup(receipts)}
            >
              Nusxani saqlash
            </Button>
            <Button
              variant="text"
              icon="history"
              disabled={importing}
              onClick={openImport}
            >
              {importing ? "Tekshirilmoqda…" : "Nusxadan tiklash"}
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".json,application/json"
          aria-label="So‘rovlar JSON nusxasini tanlash"
          tabIndex={-1}
          onChange={importFile}
        />
        {importState && (
          <div
            className={`rp-import-message ${importState.type}`}
            role={importState.type === "error" ? "alert" : "status"}
          >
            <Icon
              name={importState.type === "error" ? "info" : "check"}
              size={19}
            />
            <p>{importState.text}</p>
            <button
              aria-label="Nusxa xabarini yopish"
              onClick={() => setImportState(null)}
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}
        <div className="rp-controls">
          <div className="search-control">
            <Icon name="search" size={21} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="So‘rovlarni qidirish"
              placeholder="So‘rov raqami, ism, yuk yoki manzil"
            />
            {query && (
              <button
                aria-label="So‘rov qidiruvini tozalash"
                onClick={() => setQuery("")}
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
          <label className="rp-sort">
            <span>Saralash</span>
            <select
              aria-label="So‘rovlarni saralash"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recent">Avval yangilari</option>
              <option value="old">Avval eskilari</option>
            </select>
          </label>
        </div>
        <div className="rp-filter-line">
          <div
            className="rp-filters"
            role="group"
            aria-label="So‘rovlarning yetib borish hududi"
          >
            {DESTINATIONS.map((name) => (
              <button
                key={name}
                aria-pressed={destination === name}
                onClick={() => setDestination(name)}
              >
                {destination === name && <Icon name="check" size={15} />}
                <span>{name}</span>
                <small>
                  {name === "Barchasi"
                    ? receipts.length
                    : receipts.filter(
                        (receipt) => tripById(receipt.tripId)?.to === name,
                      ).length}
                </small>
              </button>
            ))}
          </div>
          <p role="status">{filtered.length} ta so‘rov</p>
        </div>

        <div className="rp-list">
          <AnimatePresence initial={false}>
            {filtered.map((receipt, index) => {
              const trip = tripById(receipt.tripId),
                tone = trip.to[0].toLowerCase();
              return (
                <motion.article
                  className={`rp-ticket rp-tone-${tone}`}
                  key={receipt.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index * 0.025, 0.1),
                  }}
                >
                  <div className="rp-ticket-destination">
                    <span>{trip.to[0]}</span>
                    <small>{trip.id}</small>
                    <svg viewBox="0 0 100 90" aria-hidden="true">
                      <path d="M-10 80C25 80 8 20 44 22S70 70 110 5" />
                    </svg>
                  </div>
                  <div className="rp-ticket-body">
                    <div className="rp-ticket-top">
                      <span className="rp-ticket-number">{receipt.number}</span>
                      <span className="rp-ready">
                        <Icon name="check" size={13} />
                        Tayyorlandi
                      </span>
                    </div>
                    <h3>
                      {trip.from}
                      <Icon name="arrow" size={18} />
                      <strong>{trip.to}</strong>
                    </h3>
                    <p className="rp-cargo">{receipt.cargo}</p>
                    <div className="rp-ticket-meta">
                      <span>
                        <Icon name="edit" size={13} />
                        {receipt.name}
                      </span>
                      <span>Yaratilgan: {createdLabel(receipt.createdAt)}</span>
                    </div>
                  </div>
                  <div className="rp-ticket-action">
                    <div className="rp-ticket-schedule">
                      <strong>{trip.time}</strong>
                      <span>{dateLabel(trip.date)}</span>
                    </div>
                    <Button
                      variant="outlined"
                      icon="out"
                      onClick={() => go(`/tasdiq/${receipt.id}`)}
                    >
                      Tasdiqni ochish
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
        {!filtered.length && (
          <div className="rp-empty">
            <div className="rp-empty-illustration">
              <TicketArtwork />
              <span>
                <Icon name={receipts.length ? "search" : "box"} size={23} />
              </span>
            </div>
            <p className="rp-overline">
              {receipts.length ? "QIDIRUV NATIJASI" : "BIRINCHI QADAM"}
            </p>
            <h2>
              {receipts.length
                ? "Bu so‘rov hali ko‘rinmayapti."
                : "Yukingizning yo‘li shu yerdan boshlanadi."}
            </h2>
            <p>
              {receipts.length
                ? "Boshqa so‘z bilan qidiring yoki yetib borish filtrini o‘zgartiring."
                : "Mos qatnovni tanlang va yukingiz haqida yozing. Tayyorlangan tasdiqlar shu yerda bir joyga jamlanadi."}
            </p>
            {receipts.length ? (
              <Button variant="outlined" onClick={clearFilters}>
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button icon="arrow" onClick={() => go("/qatnovlar")}>
                Birinchi qatnovni tanlash
              </Button>
            )}
          </div>
        )}
      </section>

      <div className="rp-local-note">
        <span className="rp-note-icon">
          <Icon name="shield" size={23} />
        </span>
        <div>
          <h3>
            {cloud
              ? "Hisobingiz va mahalliy nusxa."
              : "Ma’lumotlaringiz shu brauzerda."}
          </h3>
          <p>
            {cloud
              ? "Bulutga saqlangan so‘rovlar Google hisobingiz bilan qayta ochiladi. Saqlanmagan mahalliy nusxalar uchun hisob sahifasidan qayta saqlash yoki JSON nusxa olish mumkin."
              : "Qurilma almashtirishdan oldin JSON nusxasini saqlang. Uni “Nusxadan tiklash” orqali qayta ochish mumkin."}{" "}
            Tasdiqlar haqiqiy bron yoki yetkazib berish holati hisoblanmaydi.
          </p>
        </div>
        <Link to="/qollanma">
          Qo‘llanma
          <Icon name="out" size={17} />
        </Link>
      </div>
    </div>
  );
}
