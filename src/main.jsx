import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import "@material/web/button/filled-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/chips/filter-chip.js";
import "@material/web/chips/chip-set.js";
import "@material/web/ripple/ripple.js";
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
} from "@material/material-color-utilities";
import { BRAND, TRIPS, DESTINATIONS } from "./content.js";
import {
  tripById,
  filterTrips,
  validateRequest,
  dateLabel,
  loadReceipts,
  storeReceipt,
  receiptText,
  browserStorage,
  loadDraft,
  sortTrips,
  mergeReceiptBackup,
} from "./domain.js";
import { Icon } from "./icons.jsx";
import Landing from "./Landing.jsx";
import { getLocation, go, Link, Button, Logo, Cube } from "./ui.jsx";
import "./brand.css";
import "./style.css";
import {
  NetworkScene,
  DestinationOverview,
  DepartureList,
} from "./WorkspaceVisual.jsx";
import "./workspace.css";
import GuidePage from "./GuidePage.jsx";
import RequestsPage from "./RequestsPage.jsx";

const SPRING = { type: "spring", stiffness: 320, damping: 30 };
function RouteArt({ trip, large = false }) {
  return (
    <div
      className={`route-art art-${trip.color} ${large ? "art-large" : ""}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <svg viewBox="0 0 360 170">
        <path
          className="road-shadow"
          d="M-20 135C80 135 55 45 140 45S215 135 270 90s45-70 120-55"
        />
        <path
          className="road-line"
          d="M-20 135C80 135 55 45 140 45S215 135 270 90s45-70 120-55"
        />
        <circle cx="108" cy="52" r="7" />
        <circle cx="281" cy="78" r="7" />
        <g className="art-parcel">
          <path d="m177 47 25 14v29l-25 14-25-14V61l25-14Z" />
          <path d="m152 61 25 14 25-14M177 75v29m-12-50 25 14" />
        </g>
      </svg>
      <span className="art-label-from">{trip.from}</span>
      <span className="art-label-to">{trip.to}</span>
      <span className="art-id">{trip.id}</span>
      <span className="art-letter">{trip.to[0]}</span>
    </div>
  );
}
function RouteTimeline({ trip }) {
  return (
    <div className="route-timeline">
      <div>
        <span className="timeline-dot" />
        <small>QAYERDAN</small>
        <strong>{trip.from}</strong>
      </div>
      <div>
        <span className="timeline-dot end" />
        <small>QAYERGA</small>
        <strong>{trip.to}</strong>
      </div>
    </div>
  );
}
function AppShell({
  children,
  page,
  onHelp,
  onTheme,
  dark,
  onPalette,
  receiptCount,
}) {
  return (
    <div className="app-shell">
      <aside className="app-rail">
        <Logo />
        <p className="sidebar-section-label">YUK JO‘NATISH</p>
        <Link to="/qatnovlar" className="rail-main" aria-label="Qatnov topish">
          <Icon name="search" size={26} />
        </Link>
        <nav aria-label="Ilova navigatsiyasi">
          {[
            {
              path: "/qatnovlar",
              icon: "truck",
              name: "Qatnovlar",
              key: "routes",
            },
            {
              path: "/sorovlar",
              icon: "history",
              name: "So‘rovlarim",
              key: "requests",
            },
            {
              path: "/qollanma",
              icon: "book",
              name: "Qo‘llanma",
              key: "guide",
            },
          ].map((n) => (
            <Link
              to={n.path}
              key={n.path}
              className={page === n.key ? "active" : ""}
              aria-current={page === n.key ? "page" : undefined}
            >
              <span className="rail-icon">
                <Icon name={n.icon} />
                {n.key === "requests" && receiptCount > 0 && (
                  <i>{receiptCount}</i>
                )}
              </span>
              <small>{n.name}</small>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Icon name="box" size={29} />
            <h3>
              Yaxshi qadoq.
              <br />
              Xotirjam yo‘l.
            </h3>
            <p>Jo‘natishdan oldin 4 ta kichik qadamni tekshiring.</p>
            <Link to="/qollanma">
              Yukni tayyorlash <Icon name="out" size={16} />
            </Link>
          </div>
          <small>YAQIN MANZILLAR. ANIQ YO‘LLAR.</small>
        </div>
        <button
          className="rail-help"
          onClick={onHelp}
          aria-label="Yordamni ochish"
        >
          <Icon name="help" />
          <span>Yordam va ma’lumot</span>
        </button>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="app-breadcrumb">
            <Link to="/">Yo‘lchi</Link>
            <span>/</span>
            <span>
              {page === "routes"
                ? "Qatnovlar"
                : page === "requests"
                  ? "So‘rovlarim"
                  : page === "guide"
                    ? "Yuk qo‘llanmasi"
                    : page === "receipt"
                      ? "So‘rov tasdig‘i"
                      : "So‘rov tayyorlash"}
            </span>
          </div>
          <div className="topbar-actions">
            <button onClick={onPalette} aria-label="Rang palitrasini tanlash">
              <Icon name="palette" />
            </button>
            <button
              onClick={onTheme}
              aria-label={
                dark ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish"
              }
            >
              <Icon name={dark ? "sun" : "moon"} />
            </button>
            <button onClick={onHelp} aria-label="Yordam">
              <Icon name="help" />
            </button>
            <span className="profile-avatar" title="Shaxsiy brauzer">
              Y
            </span>
          </div>
        </header>
        <main id="main" className="app-main">
          {children}
        </main>
        <footer className="app-footer">
          <span>Yo‘lchi · Kichik yuk uchun transport</span>
          <span>Sinov sayti · Haqiqiy bron qilinmaydi</span>
        </footer>
      </div>
    </div>
  );
}
function Routes({ url, onDetail }) {
  const params = new URLSearchParams(url.split("?")[1] || "");
  const destination = DESTINATIONS.includes(params.get("hudud"))
    ? params.get("hudud")
    : "Barchasi";
  const query = params.get("q") || "";
  const [view, setView] = useState("grid"),
    [sort, setSort] = useState("early");
  const update = (key, value) => {
    const next = new URLSearchParams(location.search);
    value ? next.set(key, value) : next.delete(key);
    history.replaceState({}, "", `/qatnovlar${next.size ? "?" + next : ""}`);
    window.dispatchEvent(new Event("yolchi:filter"));
  };
  const day = params.get("sana") || "";
  const trips = sortTrips(
    filterTrips(destination, query).filter((t) => !day || t.date === day),
    sort,
  );
  const days = [...new Set(TRIPS.map((t) => t.date))];
  const chooseDestination = (name) => {
    update("hudud", name === "Barchasi" ? "" : name);
    document
      .getElementById("route-results")
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="app-eyebrow">MANZILINGIZGA BIR QADAM YAQINROQ</p>
          <h1>Yukingiz qayerga boradi?</h1>
          <p>Yo‘nalishni tanlang. Vaqtini tekshiring. So‘rov qoldiring.</p>
        </div>
        <span className="date-badge">
          <Icon name="clock" size={19} />
          20–21 noyabr, 2026
        </span>
      </div>
      <section className="workspace-hero">
        <div className="workspace-hero-copy">
          <span className="welcome-label">
            <Icon name="truck" size={17} /> YAQIN HUDUDLAR BO‘YLAB
          </span>
          <h2>
            Yukingiz kichik.
            <br />
            <span>Imkoniyati keng.</span>
          </h2>
          <p>
            Kitob, sovg‘a yoki ish buyumlari. Mos qatnovni tanlab, yukingiz
            uchun keyingi yo‘lni belgilang.
          </p>
          <a href="#route-results" className="inline-action workspace-jump">
            Qatnovlarni ko‘rish <Icon name="arrow" size={17} />
          </a>
          <div className="workspace-metrics">
            <div>
              <strong>{TRIPS.length.toString().padStart(2, "0")}</strong>
              <span>aniq qatnov</span>
            </div>
            <div>
              <strong>{DESTINATIONS.length - 1}</strong>
              <span>yetib borish hududi</span>
            </div>
            <div>
              <strong>{days.length}</strong>
              <span>kunlik jadval</span>
            </div>
          </div>
        </div>
        <NetworkScene destination={destination} onSelect={chooseDestination} />
      </section>
      <DestinationOverview
        destination={destination}
        onSelect={chooseDestination}
      />
      <div className="schedule-toolbar">
        <div className="schedule-days" role="group" aria-label="Jo‘nash sanasi">
          <button aria-pressed={!day} onClick={() => update("sana", "")}>
            Barcha kunlar<span>{TRIPS.length}</span>
          </button>
          {days.map((date) => (
            <button
              key={date}
              aria-pressed={day === date}
              onClick={() => update("sana", date)}
            >
              {dateLabel(date).replace(" 2026", "")}
              <span>{TRIPS.filter((t) => t.date === date).length}</span>
            </button>
          ))}
        </div>
        <span className="schedule-note">
          <Icon name="shield" size={15} /> O‘zingizga mos yo‘lni tanlang
        </span>
      </div>
      <section className="route-workspace" id="route-results">
        <div className="route-main-column">
          <div className="results-title">
            <h2>
              Qatnovlar <span>{trips.length}</span>
            </h2>
            <div className="view-controls" role="group" aria-label="Ko‘rinish">
              <button
                aria-label="Karta ko‘rinishi"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Icon name="grid" size={18} />
              </button>
              <button
                aria-label="Ro‘yxat ko‘rinishi"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <Icon name="list" size={18} />
              </button>
            </div>
          </div>
          <div className="search-control">
            <Icon name="search" />
            <input
              aria-label="Qatnovlarni qidirish"
              placeholder="Manzil yoki qatnov raqamini qidiring"
              value={query}
              onChange={(e) => update("q", e.target.value)}
            />
            {query && (
              <button
                aria-label="Qidiruvni tozalash"
                onClick={() => update("q", "")}
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
          <div className="filter-row">
            <div
              className="destination-chips"
              role="group"
              aria-label="Yetib borish hududi"
            >
              {DESTINATIONS.map((d) => (
                <md-filter-chip
                  key={d}
                  label={d}
                  selected={destination === d}
                  onClick={() => update("hudud", d === "Barchasi" ? "" : d)}
                />
              ))}
            </div>
            <label className="sort-select">
              <span className="sr-only">Qatnovlarni saralash</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="early">Avval ertaroq</option>
                <option value="late">Avval kechroq</option>
              </select>
            </label>
          </div>
          <p className="results-announcement" role="status">
            {destination === "Barchasi"
              ? "Barcha yo‘nalishlar"
              : `${destination}ga qatnovlar`}{" "}
            · {trips.length} ta natija
          </p>
          <motion.div
            layout={
              !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            }
            className={`trip-grid ${view === "list" ? "trip-list" : ""}`}
          >
            <AnimatePresence initial={false}>
              {trips.map((trip) => (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={SPRING}
                  className="trip-card"
                  key={trip.id}
                  data-trip-id={trip.id}
                >
                  <RouteArt trip={trip} />
                  <div className="trip-card-content">
                    <div className="trip-card-meta">
                      <span>{trip.type}</span>
                      <button
                        aria-label={`${trip.id} qatnov tafsilotlari`}
                        onClick={() => onDetail(trip)}
                      >
                        <Icon name="info" size={19} />
                      </button>
                    </div>
                    <h3 aria-label={`${trip.from} → ${trip.to}`}>
                      {trip.from}
                      <Icon name="arrow" size={19} />
                      <span>{trip.to}</span>
                    </h3>
                    <div className="trip-date">
                      <Icon name="clock" size={17} />
                      <span>{dateLabel(trip.date)}</span>
                      <b>{trip.time}</b>
                    </div>
                    <div className="trip-card-bottom">
                      <small>{trip.caption}</small>
                      <Button
                        onClick={() => go(`/sorov/${trip.id}`)}
                        icon="arrow"
                      >
                        So‘rov qoldirish
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
          {!trips.length && (
            <div className="empty-state">
              <Icon name="search" size={38} />
              <h3>Bu qidiruvga qatnov topilmadi</h3>
              <p>Manzil nomini qisqaroq yozing yoki filtrlarni tozalang.</p>
              <Button variant="outlined" onClick={() => go("/qatnovlar")}>
                Barcha qatnovlar
              </Button>
            </div>
          )}
        </div>
        <aside className="route-aside">
          <DepartureList trips={trips} onDetail={onDetail} />
          <div className="packing-side-card">
            <div className="aside-title">
              <span className="aside-icon">
                <Icon name="box" size={25} />
              </span>
              <p>YUKINGIZGA E’TIBOR</p>
              <h3>
                Yaxshi qadoq.
                <br />
                Xotirjam yo‘l.
              </h3>
              <p>
                Yo‘lga chiqishdan avval kichik tayyorgarlik katta farq qiladi.
              </p>
            </div>
            <ul className="mini-checklist">
              <li>
                <Icon name="check" size={17} />
                Buyumni mustahkam qadoqlang
              </li>
              <li>
                <Icon name="check" size={17} />
                Yukni aniq tavsiflang
              </li>
              <li>
                <Icon name="check" size={17} />
                Sana va manzilni tekshiring
              </li>
            </ul>
            <Link to="/qollanma" className="inline-action">
              Qo‘llanmani o‘qish <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="aside-note">
            <Icon name="shield" size={19} />
            <p>
              So‘rovlaringizni “So‘rovlarim” bo‘limida qayta ochishingiz mumkin.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
function RequestForm({ trip, onSubmit }) {
  const [draft] = useState(() => loadDraft(trip.id));
  const [name, setName] = useState(draft.name),
    [cargo, setCargo] = useState(draft.cargo),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  useEffect(() => {
    try {
      const storage = browserStorage("sessionStorage");
      if (!storage) {
        setDraftSaved(false);
        return;
      }
      storage.setItem(
        `yolchi.draft.${trip.id}`,
        JSON.stringify({ name, cargo }),
      );
      setDraftSaved(true);
    } catch {
      setDraftSaved(false);
    }
  }, [name, cargo, trip.id]);
  const submitLock = useRef(false);
  const nameRef = useRef(null),
    cargoRef = useRef(null);
  const submit = (e) => {
    e.preventDefault();
    if (busy || submitLock.current) return;
    const next = validateRequest(name, cargo);
    setErrors(next);
    if (Object.keys(next).length) {
      (next.name ? nameRef : cargoRef).current?.focus();
      return;
    }
    submitLock.current = true;
    setBusy(true);
    try {
      onSubmit({ tripId: trip.id, name: name.trim(), cargo: cargo.trim() });
      try {
        browserStorage("sessionStorage")?.removeItem(`yolchi.draft.${trip.id}`);
      } catch {}
    } catch (error) {
      submitLock.current = false;
      setBusy(false);
      setErrors({
        cargo: "So‘rovni tayyorlab bo‘lmadi. Qayta urinib ko‘ring.",
      });
    }
  };
  return (
    <>
      <Link to="/qatnovlar" className="back-link">
        <Icon name="back" size={18} />
        Qatnovlarga qaytish
      </Link>
      <div className="page-heading">
        <div>
          <p className="app-eyebrow">BIR NECHA SO‘Z — ANIQ SO‘ROV</p>
          <h1>Yukingiz haqida ayting.</h1>
          <p>Tanlangan yo‘nalishni tekshiring va so‘rovni tayyorlang.</p>
        </div>
      </div>
      <div className="form-layout">
        <section className="request-panel">
          <div className="steps" aria-label="So‘rov bosqichlari">
            <span className="complete">
              <i>
                <Icon name="check" size={15} />
              </i>
              Qatnov
            </span>
            <b />
            <span className="current" aria-current="step">
              <i>2</i>Yuk ma’lumoti
            </span>
            <b />
            <span>
              <i>3</i>Tasdiq
            </span>
          </div>
          <form onSubmit={submit} noValidate>
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            <h2>So‘rov ma’lumotlari</h2>
            <p className="form-intro">
              Ikki maydonni to‘ldiring. Qo‘shimcha ro‘yxatdan o‘tish shart emas.
            </p>
            {(name || cargo) && (
              <div className="draft-indicator" role="status">
                <i className="live-dot" />
                {draftSaved
                  ? "Qoralama shu oynada saqlandi"
                  : "Qoralama joriy sahifada"}
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    setCargo("");
                    setErrors({});
                    nameRef.current?.focus();
                  }}
                >
                  Tozalash
                </button>
              </div>
            )}
            <div className={`form-field ${errors.name ? "field-error" : ""}`}>
              <label htmlFor="sender-name">
                Ismingiz <span>*</span>
              </label>
              <input
                ref={nameRef}
                id="sender-name"
                autoComplete="given-name"
                value={name}
                maxLength={80}
                required
                aria-invalid={!!errors.name}
                aria-describedby="name-hint"
                placeholder="Masalan, Sinovchi 01"
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((old) => ({ ...old, name: undefined }));
                }}
              />
              <small id="name-hint">
                {errors.name || "Tasdiqda ko‘rsatiladigan ism."}
              </small>
            </div>
            <div className={`form-field ${errors.cargo ? "field-error" : ""}`}>
              <label htmlFor="cargo-description">
                Yukning qisqa tavsifi <span>*</span>
              </label>
              <textarea
                ref={cargoRef}
                id="cargo-description"
                value={cargo}
                maxLength={500}
                rows={5}
                required
                aria-invalid={!!errors.cargo}
                aria-describedby="cargo-hint"
                placeholder="Masalan, 2 quti kitob"
                onChange={(e) => {
                  setCargo(e.target.value);
                  setErrors((old) => ({ ...old, cargo: undefined }));
                }}
              />
              <div className="field-support">
                <small id="cargo-hint">
                  {errors.cargo || "Buyum turi va miqdorini yozing."}
                </small>
                <span>{cargo.length}/500</span>
              </div>
            </div>
            <div className="cargo-examples">
              <span>Tavsif namunasi:</span>
              {[
                "2 quti kitob",
                "1 quti sovg‘a",
                "Kichik oshxona buyumlari",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setCargo(example);
                    setErrors((old) => ({ ...old, cargo: undefined }));
                    cargoRef.current?.focus();
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="form-notice">
              <Icon name="info" size={20} />
              <p>
                Bu sinov so‘rovi. Tasdiq yaratiladi, haqiqiy transport band
                qilinmaydi va haydovchiga xabar yuborilmaydi.
              </p>
            </div>
            <div className="form-actions">
              <Button
                variant="text"
                type="button"
                onClick={() => go("/qatnovlar")}
              >
                Orqaga
              </Button>
              <Button
                type="button"
                disabled={busy}
                icon="arrow"
                onClick={submit}
              >
                {busy ? "Tayyorlanmoqda…" : "So‘rovni yuborish"}
              </Button>
            </div>
          </form>
        </section>
        <aside className="selected-trip-panel">
          <RouteArt trip={trip} large />
          <div className="selected-trip-body">
            <div className="panel-kicker">
              <span>TANLANGAN QATNOV</span>
              <b>{trip.id}</b>
            </div>
            <RouteTimeline trip={trip} />
            <div className="selected-time">
              <span>
                <Icon name="clock" size={20} />
                {dateLabel(trip.date)}
              </span>
              <strong>{trip.time}</strong>
            </div>
            <Link to="/qatnovlar" className="inline-action">
              Boshqa qatnov tanlash <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="selected-tip">
            <Icon name="shield" />
            <p>Yuborishdan avval ism, yuk tavsifi va qatnovni tekshiring.</p>
          </div>
          <div className="live-request-preview">
            <div className="live-preview-heading">
              <span className="live-dot" /> JONLI KO‘RINISH{" "}
              <b>{Number(!!name.trim()) + Number(!!cargo.trim())}/2</b>
            </div>
            <dl>
              <div>
                <dt>JO‘NATUVCHI</dt>
                <dd className={name.trim() ? "" : "preview-placeholder"}>
                  {name.trim() || "Ismingiz shu yerda ko‘rinadi"}
                </dd>
              </div>
              <div>
                <dt>YUK TAVSIFI</dt>
                <dd className={cargo.trim() ? "" : "preview-placeholder"}>
                  {cargo.trim() || "Nima jo‘natmoqchisiz?"}
                </dd>
              </div>
            </dl>
            <p>
              <Icon name="check" size={15} /> Kiritgan ma’lumotlaringiz tasdiqda
              ko‘rsatiladi.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function Receipt({ receipt, saved, notify }) {
  const trip = tripById(receipt.tripId);
  return (
    <>
      <div className="receipt-page">
        <div className="success-icon">
          <Icon name="check" size={34} />
        </div>
        <p className="app-eyebrow">MA’LUMOTLARINGIZ TAYYOR</p>
        <h1>So‘rovingiz tayyorlandi.</h1>
        <p className="receipt-subtitle">
          {saved
            ? "Tasdiq shu brauzerda saqlandi. Uni “So‘rovlarim”dan qayta ochishingiz mumkin."
            : "Tasdiq joriy oynada tayyor. Nusxasini yuklab yoki chop etib oling."}
        </p>
        <section className="receipt-ticket">
          <div className="ticket-header">
            <Logo />
            <span>
              <small>SO‘ROV RAQAMI</small>
              <b>{receipt.number}</b>
            </span>
          </div>
          <RouteTimeline trip={trip} />
          <div className="receipt-date">
            <span>
              <Icon name="clock" size={18} />
              {trip.date} · {trip.time}
            </span>
            <b>{trip.id}</b>
          </div>
          <div className="ticket-perforation" />
          <dl>
            <div>
              <dt>ISM</dt>
              <dd>{receipt.name}</dd>
            </div>
            <div>
              <dt>YUK TAVSIFI</dt>
              <dd>{receipt.cargo}</dd>
            </div>
          </dl>
          <div className="ticket-stamp">
            <Icon name="check" size={17} />
            <span>Sinov so‘rovi tasdig‘i</span>
            <span className="ticket-bars" aria-hidden="true" />
          </div>
        </section>
        <div className="receipt-actions">
          <Button
            icon="download"
            onClick={() =>
              download(receiptText(receipt), `${receipt.number}.txt`)
            }
          >
            Tasdiqni yuklash
          </Button>
          <Button
            variant="outlined"
            icon="print"
            onClick={() => window.print()}
          >
            Chop etish
          </Button>
          <Button
            variant="text"
            icon="copy"
            onClick={() => copyText(receiptText(receipt), notify)}
          >
            Nusxalash
          </Button>
        </div>
        <p className="receipt-disclaimer">
          Tasdiq haqiqiy bron yoki haydovchiga xabar yuborilganini bildirmaydi.
        </p>
        <div className="receipt-next">
          <Link to="/sorovlar">
            So‘rovlarim <Icon name="arrow" size={17} />
          </Link>
          <Link to="/qatnovlar">
            Yana qatnov topish <Icon name="out" size={17} />
          </Link>
        </div>
      </div>
    </>
  );
}
function download(text, name, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copyText(text, notify) {
  try {
    await navigator.clipboard.writeText(text);
    notify("Nusxalandi.");
  } catch {
    download(text, "yolchi-tasdiq.txt");
    notify("Nusxa matn fayli sifatida yuklandi.");
  }
}
function Modal({ title, onClose, children }) {
  const ref = useRef(null),
    opener = useRef(document.activeElement);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const close = () => onClose();
    el.addEventListener("close", close);
    return () => {
      el.removeEventListener("close", close);
      opener.current?.isConnected && opener.current.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="app-dialog"
      aria-labelledby="dialog-heading"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-top">
        <h2 id="dialog-heading">{title}</h2>
        <button onClick={onClose} aria-label="Oynani yopish">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function App() {
  const [url, setUrl] = useState(getLocation),
    [receipts, setReceipts] = useState(
      () => loadReceipts(browserStorage()).items,
    ),
    [storageWarning, setStorageWarning] = useState(
      () => loadReceipts(browserStorage()).reason || "",
    ),
    [unsaved, setUnsaved] = useState([]),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState("");
  const [dark, setDark] = useState(() => {
      try {
        return localStorage.getItem("yolchi.theme") === "dark";
      } catch {
        return false;
      }
    }),
    [seed, setSeed] = useState(() => {
      try {
        return localStorage.getItem("yolchi.color") || BRAND.themeSeed;
      } catch {
        return BRAND.themeSeed;
      }
    });
  useEffect(() => {
    const scheme = new SchemeTonalSpot(
      Hct.fromInt(
        argbFromHex(/^#[a-f\d]{6}$/i.test(seed) ? seed : BRAND.themeSeed),
      ),
      dark,
      0,
    );
    for (const color of new MaterialDynamicColors().allColors)
      document.documentElement.style.setProperty(
        "--md-sys-color-" + color.name.replaceAll("_", "-"),
        hexFromArgb(color.getArgb(scheme)),
      );
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("yolchi.theme", dark ? "dark" : "light");
      localStorage.setItem("yolchi.color", seed);
    } catch {}
  }, [dark, seed]);
  useEffect(() => {
    const changed = () => {
      setUrl(getLocation());
      setModal(null);
    };
    const filtered = () => setUrl(getLocation());
    const sync = () => {
      const state = loadReceipts(browserStorage());
      if (state.available)
        setReceipts((old) => [
          ...old.filter((r) => unsaved.includes(r.id)),
          ...state.items,
        ]);
    };
    window.addEventListener("popstate", changed);
    window.addEventListener("yolchi:navigate", changed);
    window.addEventListener("yolchi:filter", filtered);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("popstate", changed);
      window.removeEventListener("yolchi:navigate", changed);
      window.removeEventListener("yolchi:filter", filtered);
      window.removeEventListener("storage", sync);
    };
  }, [unsaved]);
  useEffect(() => {
    document.title = `${url === "/" ? "Kichik yuk, katta imkoniyat" : url.startsWith("/qatnovlar") ? "Qatnovlar" : url.startsWith("/sorovlar") ? "So‘rovlarim" : url.startsWith("/qollanma") ? "Yuk qo‘llanmasi" : url.startsWith("/tasdiq") ? "So‘rov tasdig‘i" : "So‘rov tayyorlash"} — Yo‘lchi`;
  }, [url.split("?")[0]]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const submit = useCallback(
    (data) => {
      const id = crypto.randomUUID(),
        receipt = {
          ...data,
          id,
          number: `YL-${id.slice(0, 6).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
      const result = storeReceipt(browserStorage(), receipt, receipts);
      setReceipts((old) => [
        receipt,
        ...(result.saved ? result.items.filter((r) => r.id !== id) : old),
      ]);
      if (result.saved) {
        setUnsaved([]);
        setStorageWarning("");
      }
      if (!result.saved) {
        setUnsaved((old) => [...old, id]);
        setStorageWarning(result.reason);
      }
      go(`/tasdiq/${id}`);
    },
    [receipts],
  );
  const path = url.split("?")[0];
  let page = "routes",
    content;
  if (path === "/")
    return (
      <MotionConfig reducedMotion="user">
        <a className="skip-link" href="#main">
          Asosiy mazmunga o‘tish
        </a>
        <Landing />
      </MotionConfig>
    );
  if (path === "/qatnovlar")
    content = (
      <Routes url={url} onDetail={(trip) => setModal({ type: "trip", trip })} />
    );
  else if (path === "/sorovlar") {
    page = "requests";
    content = (
      <RequestsPage
        receipts={receipts}
        notify={setToast}
        onImport={(items) => {
          const result = mergeReceiptBackup(browserStorage(), items, receipts);
          if (result.ok) {
            setReceipts(result.items);
            setUnsaved([]);
            setStorageWarning("");
          }
          return result;
        }}
      />
    );
  } else if (path === "/qollanma") {
    page = "guide";
    content = <GuidePage />;
  } else if (/^\/sorov\/Y\d{2}$/.test(path)) {
    page = "request";
    const trip = tripById(path.split("/")[2]);
    content = trip ? (
      <RequestForm key={trip.id} trip={trip} onSubmit={submit} />
    ) : null;
  } else if (path.startsWith("/tasdiq/")) {
    page = "receipt";
    const receipt = receipts.find((r) => r.id === path.split("/")[2]);
    content = receipt ? (
      <Receipt
        receipt={receipt}
        saved={!unsaved.includes(receipt.id)}
        notify={setToast}
      />
    ) : (
      <div className="empty-state">
        <Icon name="box" size={48} />
        <h1>Bu tasdiq ushbu brauzerda topilmadi.</h1>
        <p>
          Tasdiq havolasi boshqa qurilmaga so‘rov ma’lumotlarini ko‘chirmaydi.
        </p>
        <Button onClick={() => go("/sorovlar")}>So‘rovlarim</Button>
      </div>
    );
  }
  if (!content)
    content = (
      <div className="empty-state">
        <Icon name="pin" size={46} />
        <h1>Bu yo‘l topilmadi.</h1>
        <p>Mavjud qatnovlardan o‘zingizga mosini tanlang.</p>
        <Button onClick={() => go("/qatnovlar")}>Qatnovlarga o‘tish</Button>
      </div>
    );
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Asosiy mazmunga o‘tish
      </a>
      <AppShell
        page={page}
        onHelp={() => setModal({ type: "help" })}
        onPalette={() => setModal({ type: "palette" })}
        onTheme={() => setDark((v) => !v)}
        dark={dark}
        receiptCount={receipts.length}
      >
        {storageWarning && (
          <div className="storage-warning" role="status">
            <Icon name="info" size={19} />
            {storageWarning}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onAnimationComplete={(definition) => {
              if (definition.opacity !== 1) return;
              const heading = document.querySelector("main h1");
              if (heading) {
                heading.tabIndex = -1;
                heading.focus({ preventScroll: true });
              }
            }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </AppShell>
      {modal && (
        <Modal
          title={
            modal.type === "trip"
              ? `${modal.trip.id} — Qatnov tafsilotlari`
              : modal.type === "palette"
                ? "O‘zingizga mos rang"
                : "Yo‘lchi haqida va yordam"
          }
          onClose={() => setModal(null)}
        >
          {modal.type === "trip" ? (
            <>
              <RouteArt trip={modal.trip} />
              <RouteTimeline trip={modal.trip} />
              <div className="selected-time">
                <span>{dateLabel(modal.trip.date)}</span>
                <strong>{modal.trip.time}</strong>
              </div>
              <p className="dialog-note">
                Jo‘nash vaqti jadval bo‘yicha ko‘rsatilgan. Narx va yuk sig‘imi
                belgilanmagan.
              </p>
              <div className="dialog-actions">
                <Button
                  onClick={() => go(`/sorov/${modal.trip.id}`)}
                  icon="arrow"
                >
                  So‘rov qoldirish
                </Button>
              </div>
            </>
          ) : modal.type === "palette" ? (
            <>
              <p>
                Yoqtirgan rangingizni tanlang. Ichki sahifalar shu rangga
                moslashadi, tanlovingiz esa shu brauzerda saqlanadi.
              </p>
              <div className="palette-options">
                {[
                  { color: BRAND.themeSeed, name: "Moviy" },
                  { color: "#6750a4", name: "Binafsha" },
                  { color: "#00856a", name: "Yashil" },
                  { color: "#ad4d25", name: "Terrakota" },
                ].map((c) => (
                  <label key={c.color} style={{ "--swatch": c.color }}>
                    <input
                      type="radio"
                      name="palette"
                      value={c.color}
                      checked={seed === c.color}
                      onChange={() => setSeed(c.color)}
                    />
                    <span className="palette-swatch" />
                    <span>{c.name}</span>
                    {seed === c.color && <Icon name="check" size={18} />}
                  </label>
                ))}
              </div>
              <div className="dialog-actions">
                <Button onClick={() => setModal(null)}>Tayyor</Button>
              </div>
            </>
          ) : (
            <>
              <p>
                Yo‘lchi kichik yuk uchun mos qatnovni tanlash va so‘rov
                tayyorlashga yordam beradi.
              </p>
              <ol className="help-steps">
                <li>Yetib borish hududini tanlang.</li>
                <li>Qatnov yo‘nalishi va vaqtini tekshiring.</li>
                <li>Ism va yuk tavsifini kiriting.</li>
                <li>Tasdiqni oling yoki chop eting.</li>
              </ol>
              <p className="dialog-note">
                Bu sinov xizmati. Haqiqiy bron, to‘lov yoki haydovchiga xabar
                yuborish yo‘q. So‘rovlar shu brauzerda saqlanadi.
              </p>
              <div className="dialog-actions">
                <Button variant="outlined" onClick={() => go("/qollanma")}>
                  To‘liq qo‘llanma
                </Button>
                <Button onClick={() => setModal(null)}>Tushunarli</Button>
              </div>
            </>
          )}
        </Modal>
      )}
      <div className={`toast ${toast ? "toast-visible" : ""}`} role="status">
        {toast && (
          <>
            <Icon name="check" size={18} />
            {toast}
          </>
        )}
      </div>
    </MotionConfig>
  );
}
createRoot(document.getElementById("root")).render(<App />);
