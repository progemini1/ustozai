import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GUIDE, FAQ } from "./content.js";
import { Icon } from "./icons.jsx";
import { Link, Button, go } from "./ui.jsx";
import "./GuidePage.css";

const CHECKLIST_KEY = "yolchi.preparation.v1";
const CHECKS = [
  {
    title: "Yuk mustahkam qadoqlandi",
    text: "Quti yopildi, ichidagi buyum siljimaydi.",
    icon: "box",
  },
  {
    title: "Yo‘nalish tekshirildi",
    text: "Jo‘nash va yetib borish manzili to‘g‘ri.",
    icon: "pin",
  },
  {
    title: "Sana va vaqt tekshirildi",
    text: "Tanlangan qatnov vaqti sizga mos.",
    icon: "clock",
  },
  {
    title: "Tavsif aniq yozildi",
    text: "Buyum turi va miqdori ko‘rsatilgan.",
    icon: "edit",
  },
];
const DETAIL_TIPS = [
  [
    "Qutining o‘lchamini buyumga mos tanlang.",
    "Ichki bo‘shliqqa yumshoq qadoq materiali qo‘ying.",
    "Qutining pastki qismi va qopqog‘ini alohida mahkamlang.",
  ],
  [
    "Buyum nomi va miqdorini birinchi yozing.",
    "Bir nechta quti bo‘lsa, ularning sonini kiriting.",
    "Mo‘rt yoki alohida ehtiyot talab qilsa, tavsifga qo‘shing.",
  ],
  [
    "Buyumlar bir-biriga tegmasligi uchun alohida o‘rang.",
    "Quti ustidagi belgilar ko‘rinadigan joyda bo‘lsin.",
    "Tashuvchi buyumga mos sharoitni ta’minlay olishini aniqlang.",
  ],
  [
    "Boshlang‘ich manzilni yetib borish manzili bilan adashtirmang.",
    "Jo‘nash sanasi va soatini birgalikda tekshiring.",
    "Tasdiq nusxasini yuklang yoki chop etib oling.",
  ],
];
const EXAMPLES = [
  {
    name: "Kitoblar",
    icon: "book",
    label: "2 quti kitob",
    hint: "Og‘ir kitoblarni kichikroq, mustahkam qutilarga joylang. Qutilar orasida og‘irlikni teng taqsimlang.",
  },
  {
    name: "Sovg‘a",
    icon: "box",
    label: "1 quti sovg‘a",
    hint: "Chiroyli o‘ramni alohida tashqi quti bilan himoyalang. Ichidagi buyum quti ichida siljimasin.",
  },
  {
    name: "Mo‘rt buyum",
    icon: "shield",
    label: "1 quti shisha idish, mo‘rt",
    hint: "Har bir buyumni alohida yumshoq materialga o‘rang. Qutini belgilang va ehtiyot talabini tavsifga yozing.",
  },
];

const GENERAL_TIPS = [
  "Jo‘natishdan oldin buyum va qadoq holatini tekshiring.",
  "Zarur ehtiyot talablarini yuk tavsifiga kiriting.",
  "Tanlangan manzil, sana va vaqtni qayta solishtiring.",
];

function tipsFor(item, index) {
  const tips = item.tips ?? DETAIL_TIPS[index] ?? GENERAL_TIPS;
  return Array.isArray(tips)
    ? tips.filter((tip) => typeof tip === "string")
    : GENERAL_TIPS;
}

function PackageIllustration({ complete }) {
  return (
    <svg
      className="gp-parcel-drawing"
      viewBox="0 0 440 320"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="224"
        cy="272"
        rx="126"
        ry="18"
        fill="currentColor"
        opacity=".07"
      />
      <path
        d="M65 188c-22-37-13-83 14-109M335 87c41 24 55 60 38 106"
        stroke="currentColor"
        strokeDasharray="3 8"
        opacity=".28"
      />
      <path d="m224 70 116 64-116 66-116-66 116-64Z" fill="var(--gp-box-top)" />
      <path d="m108 134 116 66v95l-116-66v-95Z" fill="var(--gp-box-left)" />
      <path d="m340 134-116 66v95l116-66v-95Z" fill="var(--gp-box-right)" />
      <path
        d="m224 70 116 64v95l-116 66-116-66v-95l116-64Zm-116 64 116 66 116-66M224 200v95M165 103l116 64v44"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m199 84 25-14 116 64-24 14-117-64Z"
        fill="var(--gp-tape)"
        opacity=".75"
      />
      <path
        d="m281 167 35-19v55l-35 20v-56Z"
        fill="var(--gp-tape)"
        opacity=".8"
      />
      <path
        d="m134 197 35 20m-35-7 22 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".55"
      />
      <g className="gp-floating-sticker">
        <rect
          x="277"
          y="33"
          width="88"
          height="42"
          rx="12"
          fill="var(--gp-sticker)"
        />
        <path
          d="m293 54 6 6 11-14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="320"
          y="58"
          fill="currentColor"
          fontSize="11"
          fontFamily="Roboto"
        >
          {complete ? "Tayyor" : "Ehtiyot"}
        </text>
      </g>
      <g className="gp-floating-arrow">
        <circle cx="81" cy="93" r="28" fill="var(--gp-sticker)" />
        <path
          d="M81 107V79m-10 10 10-10 10 10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M64 253h36m-18-18v36M356 241h19m-9-9v18"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity=".3"
      />
    </svg>
  );
}

function MiniIllustration({ index }) {
  const drawings = [
    <>
      <path d="m62 20 43 25-43 25-43-25 43-25Zm-43 25v51l43 25 43-25V45M62 70v51M40 33l43 25v26" />
      <path d="M7 104h22m73-85h17m-8-8v17" opacity=".35" />
    </>,
    <>
      <rect x="30" y="18" width="72" height="99" rx="10" />
      <path d="M46 43h28M46 59h40M46 75h34m-22 17 12 8 19-24" />
      <path d="m107 35 13 8M9 92h12" opacity=".35" />
    </>,
    <>
      <path d="M66 16 26 32v36c0 25 40 47 40 47s40-22 40-47V32L66 16Z" />
      <path
        d="m66 41-9 18 16 11-11 23M12 30h13m90 74h14m-7-7v14"
        opacity=".6"
      />
    </>,
    <>
      <rect x="18" y="30" width="96" height="84" rx="13" />
      <path d="M18 53h96M43 17v26m46-26v26M40 72h10m18 0h10m-38 20h10m18 0h10" />
      <circle cx="105" cy="103" r="23" fill="var(--gp-card)" />
      <path d="M105 89v15l9 4" />
    </>,
  ];
  return (
    <svg
      viewBox="0 0 140 140"
      className="gp-mini-drawing"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {drawings[index % drawings.length]}
    </svg>
  );
}

function readPreparation() {
  try {
    const value = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]");
    if (
      !Array.isArray(value) ||
      !value.every((i) => Number.isInteger(i) && i >= 0 && i < CHECKS.length)
    )
      return { checked: [], available: false };
    return { checked: [...new Set(value)], available: true };
  } catch {
    return { checked: [], available: false };
  }
}

export default function GuidePage() {
  const [initialPreparation] = useState(readPreparation);
  const [checked, setChecked] = useState(initialPreparation.checked);
  const [example, setExample] = useState(0);
  const [storageReady, setStorageReady] = useState(
    initialPreparation.available,
  );
  const [notice, setNotice] = useState("");
  const done = checked.length === CHECKS.length;
  useEffect(() => {
    // Preserve an unreadable saved value; never silently replace it with [].
    if (!initialPreparation.available) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
      setStorageReady(true);
    } catch {
      setStorageReady(false);
    }
  }, [checked, initialPreparation.available]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const toggle = (index) =>
    setChecked((old) =>
      old.includes(index) ? old.filter((i) => i !== index) : [...old, index],
    );
  const saveChecklist = () => {
    const text = `Yo‘lchi — jo‘natish oldidan\n\n${CHECKS.map((item, i) => `${checked.includes(i) ? "[x]" : "[ ]"} ${item.title}`).join("\n")}\n\nBelgilar: ${checked.length}/${CHECKS.length}\nBu shaxsiy tayyorgarlik ro‘yxati. Haqiqiy bron tasdig‘i emas.`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "yolchi-yuk-tayyorlash.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Tayyorgarlik ro‘yxati yuklandi.");
  };
  return (
    <div className="guide-page">
      <div className="page-heading">
        <div>
          <p className="app-eyebrow">YUKINGIZGA E’TIBOR</p>
          <h1>Yukingiz yo‘lga tayyormi?</h1>
          <p>Yaxshi tayyorgarlik oddiy, lekin muhim detallardan boshlanadi.</p>
        </div>
        <Button icon="search" onClick={() => go("/qatnovlar")}>
          Qatnov topish
        </Button>
      </div>
      <section className="gp-hero" aria-labelledby="gp-hero-title">
        <div className="gp-hero-copy">
          <span className="gp-kicker">
            <span /> JO‘NATISHDAN OLDIN
          </span>
          <h2 id="gp-hero-title">
            Kichik detallar.
            <br />
            <span>Katta xotirjamlik.</span>
          </h2>
          <p>
            Mustahkam quti, tushunarli tavsif va tekshirilgan manzil.
            Yukingizning yaxshi yo‘li — sizning g‘amxo‘rligingizdan.
          </p>
          <a className="gp-text-link" href="#tayyorgarlik">
            4 qadamni tekshirish <Icon name="arrow" size={18} />
          </a>
          <div className="gp-hero-meta">
            <span>
              <Icon name="book" size={17} />
              {GUIDE.length} amaliy tavsiya
            </span>
            <i />
            <span>
              <Icon name="clock" size={16} />3 daqiqa o‘qish
            </span>
          </div>
        </div>
        <div className="gp-hero-art">
          <PackageIllustration complete={done} />
          <span className="gp-art-caption">
            EHTIYOTKOR QADOQ — YAXSHI BOSHLANISH
          </span>
        </div>
      </section>
      <div className="gp-content-layout">
        <div className="gp-lessons">
          <div className="gp-section-heading">
            <div>
              <p className="app-eyebrow">BIRMA-BIR TAYYORLAYMIZ</p>
              <h2>Yo‘lga chiqishdan avval</h2>
            </div>
            <span>01 — {String(GUIDE.length).padStart(2, "0")}</span>
          </div>
          <div className="gp-card-grid">
            {GUIDE.map((item, index) => (
              <motion.article
                key={item.id}
                className={`gp-lesson gp-tone-${index % 4}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                viewport={{ once: true, amount: 0.15 }}
              >
                <div className="gp-lesson-visual">
                  <span className="gp-lesson-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <MiniIllustration index={index} />
                  <span className="gp-lesson-symbol">
                    <Icon name={item.icon} size={19} />
                  </span>
                </div>
                <div className="gp-lesson-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <details>
                    <summary>
                      Batafsil tavsiyalar <Icon name="chevron" size={15} />
                    </summary>
                    <ul>
                      {tipsFor(item, index).map((tip, tipIndex) => (
                        <li key={`${tipIndex}-${tip}`}>{tip}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
        <aside
          className="gp-preparation"
          id="tayyorgarlik"
          aria-labelledby="gp-checklist-title"
        >
          <div className="gp-preparation-top">
            <span className="gp-kicker">SHAXSIY TAYYORGARLIK</span>
            <div className="gp-progress-circle">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="gp-progress-track" cx="50" cy="50" r="43" />
                <circle
                  className="gp-progress-value"
                  cx="50"
                  cy="50"
                  r="43"
                  strokeDasharray="270.18"
                  strokeDashoffset={
                    270.18 * (1 - checked.length / CHECKS.length)
                  }
                />
              </svg>
              <span>
                {done ? (
                  <Icon name="check" size={30} />
                ) : (
                  <>
                    <strong>{checked.length}</strong>
                    <small>/ 4</small>
                  </>
                )}
              </span>
            </div>
            <h2 id="gp-checklist-title">
              {done
                ? "Yukingizga e’tibor berdingiz."
                : "Yuborishdan oldin tekshiring."}
            </h2>
            <p className="gp-progress-announcement" role="status">
              {done
                ? "Barcha 4 qadam belgilandi. Endi mos qatnovni tanlashingiz mumkin."
                : `${CHECKS.length - checked.length} ta qadam qoldi. Tayyor bo‘lganlarini belgilang.`}
            </p>
          </div>
          <div className="gp-checks">
            {CHECKS.map((check, index) => (
              <label
                key={check.title}
                className={`gp-check ${checked.includes(index) ? "gp-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked.includes(index)}
                  onChange={() => toggle(index)}
                />
                <span className="gp-custom-check">
                  {checked.includes(index) && <Icon name="check" size={16} />}
                </span>
                <span>
                  <strong>{check.title}</strong>
                  <small>{check.text}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="gp-preparation-footer">
            <p>
              <Icon name={storageReady ? "shield" : "info"} size={15} />
              {storageReady
                ? "Belgilar shu brauzerda saqlanadi."
                : "Belgilar faqat joriy oynada saqlanadi."}
            </p>
            <Button variant="outlined" icon="download" onClick={saveChecklist}>
              Ro‘yxatni yuklash
            </Button>
            <Link to="/qatnovlar" className="gp-next-link">
              Mos qatnovni topish <Icon name="arrow" size={17} />
            </Link>
          </div>
        </aside>
      </div>
      <section
        className="gp-description-lab"
        aria-labelledby="gp-description-title"
      >
        <div className="gp-lab-heading">
          <span className="gp-lab-icon">
            <Icon name="edit" size={26} />
          </span>
          <p className="app-eyebrow">ANIQ SO‘Z — TUSHUNARLI YUK</p>
          <h2 id="gp-description-title">
            Yukni qanday <br />
            tavsiflaymiz?
          </h2>
          <p>
            Qisqa tavsifda buyum turi va miqdorini yozing. Zarur bo‘lsa, alohida
            ehtiyot talabini qo‘shing.
          </p>
        </div>
        <div className="gp-lab-body">
          <div
            className="gp-example-tabs"
            role="tablist"
            aria-label="Yuk tavsifi namunalari"
          >
            {EXAMPLES.map((item, index) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                tabIndex={example === index ? 0 : -1}
                aria-selected={example === index}
                aria-controls="gp-example-panel"
                id={`gp-example-tab-${index}`}
                onClick={() => setExample(index)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % EXAMPLES.length
                      : event.key === "ArrowLeft"
                        ? (index + EXAMPLES.length - 1) % EXAMPLES.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? EXAMPLES.length - 1
                            : null;
                  if (next === null) return;
                  event.preventDefault();
                  setExample(next);
                  event.currentTarget.parentElement
                    .querySelectorAll('[role="tab"]')
                    [next]?.focus();
                }}
              >
                <Icon name={item.icon} size={17} />
                {item.name}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={example}
              id="gp-example-panel"
              role="tabpanel"
              aria-labelledby={`gp-example-tab-${example}`}
              className="gp-example-panel"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span>TAVSIF NAMUNASI</span>
              <blockquote>“{EXAMPLES[example].label}”</blockquote>
              <p>{EXAMPLES[example].hint}</p>
              <span className="gp-example-check">
                <Icon name="check" size={15} /> Buyum turi aniq <i /> Miqdori
                bor
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      <section className="gp-faq" aria-labelledby="gp-faq-title">
        <div>
          <p className="app-eyebrow">BILISH FOYDALI</p>
          <h2 id="gp-faq-title">
            Savol bormi?
            <br />
            <span>Javobi shu yerda.</span>
          </h2>
          <p>Qatnov, so‘rov va ma’lumotlaringiz haqida qisqa javoblar.</p>
          <Link to="/sorovlar" className="gp-text-link">
            So‘rovlarimni ko‘rish <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="gp-faq-items">
          {FAQ.map(([question, answer], index) => (
            <details key={question}>
              <summary>
                <span className="gp-faq-number">0{index + 1}</span>
                <span>{question}</span>
                <span className="gp-faq-plus">+</span>
              </summary>
              <p>
                {answer.replace(
                  "Biletda narx, yo‘l davomiyligi va yuk sig‘imi berilmagan.",
                  "Qatnovlar jadvalida narx, yo‘l davomiyligi va yuk sig‘imi ko‘rsatilmagan.",
                )}
              </p>
            </details>
          ))}
        </div>
      </section>
      <div className="gp-bottom-note">
        <Icon name="info" size={18} />
        <p>
          Bu umumiy tayyorgarlik tavsiyalari. Alohida sharoit talab qiladigan
          buyumlar uchun tashuvchining talablarini oldindan aniqlang.
        </p>
      </div>
      <div className="gp-notice" role="status">
        {notice}
      </div>
    </div>
  );
}
