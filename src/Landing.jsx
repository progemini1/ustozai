import React, { useState, useEffect } from 'react';
import { BRAND, TRIPS, DESTINATIONS, GUIDE, FAQ } from './content.js';
import { Link, Logo } from './ui.jsx';
import ParticleScene from './ParticleScene.jsx';
import './Landing.css';

const SECTIONS = [
  { id: 'boshlanish', label: 'Boshlanish' },
  { id: 'qarash', label: 'Bizning qarash' },
  { id: 'qanday', label: 'Qanday ishlaydi' },
  { id: 'signal', label: 'Manzillar signali' },
  { id: 'yonalishlar', label: 'Yo‘nalishlar' },
  { id: 'savollar', label: 'Qo‘llanma va savollar' },
  { id: 'reja', label: 'Yo‘lga chiqish' },
];

const HERO_MODES = [
  { id: 'combo', num: '01', label: 'Logo + YO‘LCHI' },
  { id: 'logo', num: '02', label: 'Bizning Logo' },
  { id: 'text', num: '03', label: 'YO‘LCHI' },
  { id: 'snake', num: '04', label: 'Shior' },
];

const ART_STYLES = ['literacy', 'lab', 'mentor', 'science', 'literacy'];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heroMode, setHeroMode] = useState('combo');
  const [activeSection, setActiveSection] = useState('boshlanish');
  const [activeDest, setActiveDest] = useState('Barchasi');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) setPaused(true);
  }, []);

  useEffect(() => {
    const syncActive = () => {
      const mid = window.innerHeight * 0.45;
      const sections = [...document.querySelectorAll('.landing main > section[id]')];
      const current = sections.find((el) => {
        const b = el.getBoundingClientRect();
        return b.top <= mid && b.bottom > mid;
      });
      if (current?.id) setActiveSection(current.id);
    };
    syncActive();
    window.addEventListener('scroll', syncActive, { passive: true });
    window.addEventListener('resize', syncActive);
    return () => {
      window.removeEventListener('scroll', syncActive);
      window.removeEventListener('resize', syncActive);
    };
  }, []);

  const cycleHeroMode = () => {
    const idx = HERO_MODES.findIndex((m) => m.id === heroMode);
    const next = HERO_MODES[(idx + 1) % HERO_MODES.length];
    setHeroMode(next.id);
  };

  const filteredTrips =
    activeDest === 'Barchasi' ? TRIPS : TRIPS.filter((t) => t.to === activeDest);

  return (
    <div className={`landing si-landing ${paused ? 'motion-paused' : ''}`}>
      <ParticleScene
        paused={paused}
        heroMode={heroMode}
        onHeroModeChange={setHeroMode}
      />

      <header className="si-header">
        <Logo landing />
        <nav className="si-header-nav" aria-label="Landing navigatsiya">
          <a href="#qarash">Bizning qarash</a>
          <a href="#qanday">Qanday ishlaydi</a>
          <a href="#yonalishlar">Yo‘nalishlar</a>
          <Link to="/qollanma">Yuk qo‘llanmasi</Link>
        </nav>
        <Link to="/qatnovlar" className="si-header-link">
          {BRAND.cta} <span aria-hidden="true">↗</span>
        </Link>
        <button
          type="button"
          className="si-motion-control"
          aria-label={paused ? 'Harakat: davom ettirish' : 'Harakat: to‘xtatish'}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={paused ? 'M8 5l11 7-11 7Z' : 'M9 5v14M15 5v14'} />
          </svg>
          <span>Harakat</span>
        </button>
      </header>

      <nav className="si-section-nav" aria-label="Sahifa bo‘limlari">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={s.label}
            aria-current={activeSection === s.id ? 'location' : undefined}
          >
            <span>{s.label}</span>
          </a>
        ))}
      </nav>

      <main id="main">
        {/* 1. HERO — FULL VIEWPORT SI.GOV STYLE WITH LOGO + TEXT PARTICLES */}
        <section
          className="si-hero si-section-dark"
          data-motion="combo"
          id="boshlanish"
          aria-labelledby="hero-title"
        >
          <div className="si-hero-art">
            <button
              type="button"
              className="si-art-toggle"
              aria-label="Zarracha shaklini keyingi ko‘rinishga o‘tkazish"
              onClick={cycleHeroMode}
            />
            <div className="si-hero-mode-bar" role="group" aria-label="Zarracha shakli tanlovi">
              {HERO_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={heroMode === m.id}
                  onClick={() => setHeroMode(m.id)}
                >
                  <span>{m.num}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="si-art-coordinate left">KICHIK YUK + ANIQ MANZIL</div>
            <div className="si-art-coordinate right">39.65° N / 66.96° E · BILET 006</div>
          </div>

          <div className="si-hero-copy">
            <div>
              <p className="si-eyebrow">
                <span className="si-status-dot" /> ODDIY YUK. O‘YLANGAN YO‘L.
              </p>
              <h1 id="hero-title">
                {BRAND.hero[0]}
                <br />
                <em>{BRAND.hero[1]}</em>
              </h1>
            </div>
            <div className="si-hero-aside">
              <p>{BRAND.introduction}</p>
              <div className="si-hero-actions">
                <Link className="si-button primary" to="/qatnovlar">
                  {BRAND.cta} <span aria-hidden="true">↗</span>
                </Link>
                <a className="si-button ghost" href="#yonalishlar">
                  5 ta qatnovni ko‘rish <span aria-hidden="true">↓</span>
                </a>
              </div>
              <a className="si-scroll-cue" href="#qarash">
                <span aria-hidden="true">↓</span> Keyingi bo‘lim · {TRIPS.length} ta tayyor qatnov · 3 ta hudud
              </a>
            </div>
          </div>
          <span className="si-hero-edition" aria-hidden="true">
            YO‘LCHI / TRANSPORT VA YETKAZIB BERISH / 2026
          </span>
        </section>

        {/* 2. VISION — 3D SPHERE & ORBITAL RING */}
        <section
          className="si-vision si-section-dark"
          data-motion="ring"
          id="qarash"
          aria-labelledby="vision-title"
        >
          <div className="si-section-inner">
            <p className="si-eyebrow">
              <span className="si-status-dot" /> NEGA YO‘LCHI?
            </p>
            <h2 id="vision-title" className="si-statement">
              Kichik yuklar ham —<br />
              katta <em>e’tiborga loyiq.</em>
            </h2>
            <div className="si-vision-bottom">
              <p>
                Yaqiningizga kitob, muhim hujjat, sovg‘a yoki kundalik ish buyumi. Uzoq qidiruv va
                noaniq vaqtlar o‘rniga — tayyor qatnovlar ro‘yxati, aniq jo‘nash vaqti va bir
                zumda shakllanadigan so‘rov tasdig‘i.
              </p>
              <div className="si-vision-note">
                <span>01 — BIZNING QARASH</span>
                <p>
                  Aniq yo‘nalish.<br />
                  Xotirjam <em>jo‘natma.</em>
                </p>
              </div>
            </div>
            <div className="si-motion-stage si-vision-stage" aria-hidden="true" />
          </div>
        </section>

        {/* 3. APPROACH — 3 FULL-VIEWPORT ARCHITECTURAL STEPS */}
        <section
          className="si-approach si-section-cream"
          data-motion="helix"
          id="qanday"
          aria-labelledby="approach-title"
        >
          <div className="si-section-inner">
            <div className="si-section-top">
              <p className="si-eyebrow">
                <span className="si-status-dot" /> SODDA YONDASHUV
              </p>
              <span className="si-section-index">02 / 04</span>
            </div>
            <div className="si-approach-heading">
              <h2 id="approach-title">
                Bitta so‘rov.<br />
                <em>Uchta aniq qadam.</em>
              </h2>
              <p>
                Ortiqcha ro‘yxatdan o‘tish yoki murakkab hisob-kitob yo‘q. Manzilni tanlang,
                vaqtni solishtiring va so‘rovni tasdiqlang.
              </p>
            </div>

            <div className="si-steps">
              <article className="si-step" data-motion="helix">
                <span className="si-step-number">01 / QADAM</span>
                <div className="si-step-copy">
                  <h3>Manzilingizni tanlang.</h3>
                  <p>
                    Yukingiz qayerga yetib borishi kerak? «Barchasi», «A tumani», «B tumani» yoki
                    «C tumani» filtrini tanlab, faqat o‘zingizga mos yo‘nalishlarni ajratib oling.
                  </p>
                  <Link to="/qatnovlar" className="si-step-link">
                    Hudud bo‘yicha filtrlash <span aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div className="si-motion-stage" aria-hidden="true" />
              </article>

              <article className="si-step" data-motion="towers">
                <span className="si-step-number">02 / QADAM</span>
                <div className="si-step-copy">
                  <h3>Qatnovni solishtiring.</h3>
                  <p>
                    20–21-noyabr kunlariga belgilangan 5 ta qatnovning qayerdan chiqishi, qayerga
                    borishi va aniq soatini solishtiring. Ma’lumotlar bir qarashda ko‘rinadi.
                  </p>
                  <a href="#yonalishlar" className="si-step-link">
                    Jadvalni ko‘rish <span aria-hidden="true">↓</span>
                  </a>
                </div>
                <div className="si-motion-stage" aria-hidden="true" />
              </article>

              <article className="si-step" data-motion="logo">
                <span className="si-step-number">03 / QADAM</span>
                <div className="si-step-copy">
                  <h3>Yuk haqida yozing.</h3>
                  <p>
                    Ismingiz va yukning qisqa tavsifini (masalan, «2 quti kitob») kiriting.
                    Tasdiq chiptasi shu zahoti yaratiladi — uni saqlab yoki chop etib oling.
                  </p>
                  <Link to="/sorov/Y02" className="si-step-link">
                    So‘rov shaklini sinab ko‘rish <span aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div className="si-motion-stage" aria-hidden="true" />
              </article>
            </div>
          </div>
        </section>

        {/* 4. SIGNAL — FULL-SCREEN RADAR BROADCAST WAVES */}
        <section
          className="si-signal si-section-dark"
          data-motion="broadcast"
          id="signal"
          aria-labelledby="signal-title"
        >
          <div className="si-section-inner">
            <p className="si-eyebrow">
              <span className="si-status-dot" /> HUDUDLARARO BOG‘LANISH
            </p>
            <h2 id="signal-title">
              Bitta yo‘nalish.<br />
              <em>Aniq vaqt va ishonch.</em>
            </h2>
            <p>
              Viloyat markazi hamda A, B va C tumanlari o‘rtasidagi barcha qatnovlar yagona
              tushunarli tizimda.
            </p>
          </div>
        </section>

        {/* 5. ROUTES & INITIATIVES — SI.GOV ARCHITECTURAL GRID */}
        <section
          className="si-initiatives si-section-light"
          data-motion="scatter"
          id="yonalishlar"
          aria-labelledby="routes-title"
        >
          <div className="si-section-inner">
            <div className="si-section-top">
              <p className="si-eyebrow">
                <span className="si-status-dot" /> BILET 006 QATNOVLARI
              </p>
              <span className="si-section-index">03 / 04</span>
            </div>

            <div className="si-initiatives-heading">
              <h2 id="routes-title">
                Yaqin hududlar.<br />
                <em>Aniq yo‘nalishlar.</em>
              </h2>
              <p>
                Yetib borish hududini tanlab qatnovlarni tekshiring yoki to‘g‘ridan-to‘g‘ri
                so‘rov shakliga o‘ting.
              </p>
            </div>

            <div className="si-filter-bar">
              <div className="si-filters" role="group" aria-label="Yetib borish hududi">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    aria-pressed={activeDest === dest}
                    onClick={() => setActiveDest(dest)}
                  >
                    {dest}
                  </button>
                ))}
              </div>
              <p className="si-results" role="status" aria-live="polite">
                {filteredTrips.length} ta qatnov
              </p>
            </div>

            <div className="si-initiative-grid">
              {filteredTrips.map((trip, idx) => {
                const artClass = ART_STYLES[idx % ART_STYLES.length];
                return (
                  <article key={trip.id} className="si-initiative-card">
                    <div className={`si-card-art si-art-${artClass}`} aria-hidden="true">
                      <span className="si-art-label">{trip.type.toUpperCase()}</span>
                      <div className="si-card-glyph">
                        <span className="si-glyph-id">{trip.id}</span>
                        <span className="si-glyph-time">{trip.time}</span>
                      </div>
                      <span className="si-art-bottom">
                        {trip.date} · {trip.from.toUpperCase()} → {trip.to.toUpperCase()}
                      </span>
                    </div>
                    <div className="si-card-copy">
                      <p className="si-card-kicker">
                        QATNOV {trip.id} / JO‘NASH: {trip.date}, SOAT {trip.time}
                      </p>
                      <h3>
                        {trip.from} <span aria-hidden="true">→</span> {trip.to}
                      </h3>
                      <p>
                        {trip.caption}. Yetib borish manzili — <strong>{trip.to}</strong>. Kichik
                        yuk uchun so‘rovni bir daqiqada rasmiylashtiring.
                      </p>
                      <div className="si-card-actions">
                        <Link to={`/sorov/${trip.id}`} className="si-card-open">
                          So‘rov qoldirish <span aria-hidden="true">↗</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="si-destinations-strip">
              {DESTINATIONS.slice(1).map((dest, i) => {
                const count = TRIPS.filter((t) => t.to === dest).length;
                const origins = [...new Set(TRIPS.filter((t) => t.to === dest).map((t) => t.from))].join(' · ');
                return (
                  <Link
                    key={dest}
                    to={`/qatnovlar?hudud=${encodeURIComponent(dest)}`}
                    className="si-dest-row"
                  >
                    <span className="si-dest-num">0{i + 1}</span>
                    <span className="si-dest-name">
                      <small>YETIB BORISH HUDUDI</small>
                      <strong>{dest}</strong>
                    </span>
                    <span className="si-dest-origins">{origins}</span>
                    <span className="si-dest-count">{count} ta qatnov</span>
                    <span className="si-dest-arrow" aria-hidden="true">↗</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. PACKING GUIDE & FAQ */}
        <section
          className="si-faq-wrap si-section-cream"
          data-motion="sphere"
          id="savollar"
          aria-labelledby="faq-title"
        >
          <div className="si-section-inner">
            <div className="si-packing-hero">
              <div className="si-packing-copy">
                <p className="si-eyebrow">
                  <span className="si-status-dot" /> YUKINGIZGA G‘AMXO‘RLIK
                </p>
                <h2>
                  Yo‘lga chiqishdan oldingi<br />
                  <em>to‘rtta oltin qoida.</em>
                </h2>
                <p>
                  Mustahkam quti, aniq tavsif va tekshirilgan jo‘nash vaqti — yukingiz manzilga
                  bus-butun yetib borishining asosi.
                </p>
                <Link to="/qollanma" className="si-button navy">
                  To‘liq yuk qo‘llanmasi <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="si-guide-mini-grid">
                {GUIDE.map((g, i) => (
                  <div key={g.id} className="si-guide-mini-card">
                    <span>0{i + 1}</span>
                    <h3>{g.title}</h3>
                    <p>{g.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="si-faq-grid">
              <div>
                <p className="si-eyebrow">
                  <span className="si-status-dot" /> KO‘P SO‘RALADIGAN SAVOLLAR
                </p>
                <h2 id="faq-title">
                  Savolingiz bormi?<br />
                  <em>Javobi shu yerda.</em>
                </h2>
              </div>
              <div className="si-faq-list">
                {FAQ.map(([q, a]) => (
                  <details key={q}>
                    <summary>
                      {q}
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. CLOSING & WAVING 3D UZBEKISTAN FLAG */}
        <section
          className="si-plan si-section-dark"
          data-motion="flag"
          id="reja"
          aria-labelledby="plan-title"
        >
          <div className="si-section-inner">
            <div className="si-section-top">
              <p className="si-eyebrow">
                <span className="si-status-dot" /> SIZNING KEYINGI QADAMINGIZ
              </p>
              <span className="si-section-index">04 / 04</span>
            </div>

            <div className="si-plan-layout">
              <div>
                <h2 id="plan-title">
                  Yukingiz uchun<br />
                  <em>yo‘l topamiz.</em><br />
                  Bugundan.
                </h2>
                <p className="si-plan-intro">
                  Barcha 5 ta qatnov, hududlar bo‘yicha filtr va bir zumda tayyor bo‘ladigan
                  so‘rov tasdig‘i siz uchun shay.
                </p>
                <Link className="si-text-link" to="/qatnovlar">
                  Qatnovlar oynasiga o‘tish <span aria-hidden="true">↗</span>
                </Link>
                <div className="si-motion-stage si-flag-stage" aria-hidden="true" />
                <p className="si-flag-caption">O‘ZBEKISTON · SAMARQAND · YO‘LCHI 2026</p>
              </div>

              <div className="si-plan-panel">
                <div className="si-plan-panel-heading">
                  <span>TEZKOR YO‘NALISHLAR PANELI</span>
                  <span>{TRIPS.length} / {TRIPS.length} QATNOV</span>
                </div>
                <div className="si-plan-items">
                  {TRIPS.map((trip) => (
                    <article key={trip.id} className="si-plan-item">
                      <div>
                        <h3>
                          {trip.from} → {trip.to}
                        </h3>
                        <p>
                          {trip.id} · {trip.date}, soat {trip.time} · {trip.type}
                        </p>
                      </div>
                      <Link
                        to={`/sorov/${trip.id}`}
                        className="si-plan-go"
                        aria-label={`${trip.id} qatnoviga so‘rov qoldirish`}
                      >
                        ↗
                      </Link>
                    </article>
                  ))}
                </div>
                <Link to="/qatnovlar" className="si-button pale si-full-btn">
                  Barcha qatnovlar va filtr <span aria-hidden="true">↗</span>
                </Link>
                <p className="si-privacy-note">{BRAND.note}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="si-footer si-section-dark">
        <div className="si-footer-top">
          <Logo landing />
          <p>
            Kichik yuk. Aniq vaqt.<br />
            <em>Ishonchli yo‘nalish.</em>
          </p>
          <div className="si-footer-links">
            <Link to="/qatnovlar">Qatnovlar ↗</Link>
            <Link to="/sorovlar">So‘rovlarim ↗</Link>
            <Link to="/qollanma">Yuk qo‘llanmasi ↗</Link>
          </div>
        </div>
        <div className="si-footer-bottom">
          <span>© 2026 {BRAND.name} · Bilet 006 sinov loyihasi</span>
          <span>{BRAND.note}</span>
        </div>
      </footer>

      {/* SPINNING CIRCULAR MENU ORB (SI.GOV SIGNATURE) */}
      <button
        type="button"
        className="si-menu-orb"
        aria-label="Asosiy menyuni ochish"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
      >
        <svg className="si-orb-ring" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path
              id="si-circle-text"
              d="M50,50m-37,0a37,37 0 1,1 74,0a37,37 0 1,1 -74,0"
            />
          </defs>
          <text>
            <textPath href="#si-circle-text">
              YO‘LCHI · KICHIK YUK · ANIQ MANZIL ·
            </textPath>
          </text>
        </svg>
        <span>Menyu</span>
      </button>

      {menuOpen && (
        <div className="si-menu-dialog" role="dialog" aria-modal="true" aria-label="Asosiy menyu">
          <div className="si-menu-heading">
            <Logo landing onClick={() => setMenuOpen(false)} />
            <button
              type="button"
              className="si-close"
              aria-label="Menyuni yopish"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="si-menu-body">
            <p className="si-eyebrow">SAHIFA VA BO‘LIMLAR</p>
            <nav aria-label="Katta menyu">
              <Link to="/qatnovlar" onClick={() => setMenuOpen(false)}>
                <small>01</small>Qatnovlar va filtr <span>↗</span>
              </Link>
              <Link to="/sorov/Y02" onClick={() => setMenuOpen(false)}>
                <small>02</small>So‘rov yuborish (Y02) <span>↗</span>
              </Link>
              <Link to="/sorovlar" onClick={() => setMenuOpen(false)}>
                <small>03</small>So‘rovlarim tarixi <span>↗</span>
              </Link>
              <Link to="/qollanma" onClick={() => setMenuOpen(false)}>
                <small>04</small>Yuk tayyorlash qo‘llanmasi <span>↗</span>
              </Link>
              <a href="#yonalishlar" onClick={() => setMenuOpen(false)}>
                <small>05</small>5 ta qatnov vitrinasi <span>↓</span>
              </a>
              <a href="#savollar" onClick={() => setMenuOpen(false)}>
                <small>06</small>Ko‘p so‘raladigan savollar <span>↓</span>
              </a>
            </nav>
            <p className="si-menu-note">{BRAND.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
