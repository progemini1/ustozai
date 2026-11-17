import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { BRAND } from "./content.js";
import { browserStorage, loadReceipts } from "./domain.js";
import { Button, Link, go, Logo } from "./ui.jsx";
import { Icon } from "./icons.jsx";
import "./AuthPage.css";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2.1 3v2.5h3.4c2-1.8 3-4.3 3-7.4Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.8 0 5.1-.9 6.8-2.4l-3.4-2.5c-.9.6-2 1-3.4 1-2.7 0-5-1.8-5.8-4.2H2.7v2.6A10.2 10.2 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.2 13.9a6 6 0 0 1 0-3.8V7.5H2.7a10 10 0 0 0 0 9l3.5-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l3-2.9A9.7 9.7 0 0 0 12 2a10.2 10.2 0 0 0-9.3 5.5l3.5 2.6A6.1 6.1 0 0 1 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  );
}
function avatarUrl(user) {
  try {
    const url = new URL(user?.user_metadata?.avatar_url || "");
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
function OAuthNotice({ message }) {
  return message ? (
    <div className="auth-notice" role="alert">
      <Icon name="info" size={19} />
      <p>{message}</p>
    </div>
  ) : null;
}

export default function AuthPage() {
  const {
    user,
    loading,
    configured,
    configError,
    signInWithGoogle,
    signOut,
    cloudReceipts,
    cloudLoading,
    cloudError,
    retryCloud,
    importReceipts,
  } = useAuth();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [local] = useState(() => loadReceipts(browserStorage()));
  const [imageFailed, setImageFailed] = useState(false);
  const name =
    [
      user?.user_metadata?.full_name,
      user?.user_metadata?.name,
      user?.email?.split("@")[0],
    ]
      .find((value) => typeof value === "string" && value.trim())
      ?.trim()
      .slice(0, 120) || "Yo‘lchi foydalanuvchisi";
  const photo = avatarUrl(user);
  async function login() {
    if (busy) return;
    setBusy("login");
    setMessage("");
    const result = await signInWithGoogle();
    if (!result?.ok) {
      setMessage(result?.error || "Kirishni boshlashning imkoni bo‘lmadi.");
      setBusy("");
    } else
      setTimeout(
        () => setBusy((value) => (value === "login" ? "" : value)),
        10000,
      );
  }
  async function logout() {
    if (busy) return;
    setBusy("logout");
    setMessage("");
    const result = await signOut();
    setBusy("");
    if (!result?.ok) setMessage(result?.error || "Hisobdan chiqib bo‘lmadi.");
    else {
      setNotice("Hisobdan chiqdingiz. Mahalliy so‘rovlar shu brauzerda qoldi.");
      go("/kirish");
    }
  }
  async function syncLocal() {
    if (busy || !local.items.length) return;
    setBusy("sync");
    setMessage("");
    setNotice("");
    const result = await importReceipts(local.items);
    setBusy("");
    if (!result.ok) setMessage(result.error);
    else
      setNotice(
        `${local.items.length} ta mahalliy so‘rov hisobingizga saqlandi.`,
      );
  }

  if (loading)
    return (
      <div className="auth-page auth-loading">
        <span className="auth-loader" />
        <p className="app-eyebrow">HISOBINGIZNI TEKSHIRYAPMIZ</p>
        <h1>Yo‘lingiz davom etmoqda.</h1>
        <p>Google sessiyasi va so‘rovlaringiz tekshirilmoqda.</p>
      </div>
    );
  if (user)
    return (
      <div className="auth-page auth-account">
        <div className="page-heading">
          <div>
            <p className="app-eyebrow">SHAXSIY HISOB</p>
            <h1>Salom, {name.split(" ")[0]}.</h1>
            <p>
              Hisobingiz, saqlangan so‘rovlar va qurilmalar o‘rtasidagi
              bog‘lanish.
            </p>
          </div>
          <Button variant="outlined" icon="out" onClick={() => go("/sorovlar")}>
            So‘rovlarim
          </Button>
        </div>
        <section className="auth-profile-hero">
          <div className="auth-profile-copy">
            <span className="auth-connected">
              <i /> GOOGLE ORQALI KIRILGAN
            </span>
            <div className="auth-profile-person">
              <span className="auth-profile-avatar">
                {photo && !imageFailed ? (
                  <img
                    src={photo}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  String(name)[0].toUpperCase()
                )}
              </span>
              <div>
                <h2>{name}</h2>
                <p>{user.email || "Google hisobingiz ulangan"}</p>
              </div>
            </div>
            <p className="auth-profile-description">
              Yangi so‘rovlaringiz hisobingizga saqlanishi mumkin. Qayerda
              bo‘lmang, shu Google hisobingiz bilan qayta oching.
            </p>
            <button className="auth-signout" disabled={!!busy} onClick={logout}>
              <Icon name="out" size={16} />
              {busy === "logout" ? "Hisobdan chiqilmoqda…" : "Hisobdan chiqish"}
            </button>
          </div>
          <div className="auth-profile-art">
            <img
              src="/images/dashboard-parcels.webp"
              alt="Yo‘lga tayyorlangan kichik qutilar"
            />
            <span>
              <Icon name="shield" size={15} />
              Ma’lumotlar hisobingizga tegishli
            </span>
          </div>
        </section>
        <OAuthNotice message={message} />
        {notice && (
          <div className="auth-success" role="status">
            <Icon name="check" size={19} />
            <p>{notice}</p>
          </div>
        )}
        <div className="auth-account-grid">
          <section className="auth-cloud-card">
            <span className="auth-card-icon">
              <Icon name="history" size={25} />
            </span>
            <p className="app-eyebrow">HISOBDAGI SO‘ROVLAR</p>
            <div className="auth-cloud-count">
              <strong>
                {cloudLoading || cloudError
                  ? "—"
                  : String(cloudReceipts.length).padStart(2, "0")}
              </strong>
              <span>
                bulutda saqlangan
                <br />
                so‘rov
              </span>
            </div>
            <h2>Kerakli tasdiq, kerakli paytda.</h2>
            <p>
              {cloudLoading
                ? "Hisobingizdagi so‘rovlar yuklanmoqda…"
                : "Hisobingiz bilan saqlangan so‘rovlarni istalgan qurilmada qayta ochishingiz mumkin."}
            </p>
            {cloudError ? (
              <div className="auth-cloud-error" role="alert">
                <p>{cloudError}</p>
                <button onClick={retryCloud} disabled={cloudLoading}>
                  <Icon name="refresh" size={14} />
                  Qayta urinish
                </button>
              </div>
            ) : (
              <Link to="/sorovlar" className="auth-inline-link">
                Saqlangan so‘rovlarni ochish
                <Icon name="arrow" size={17} />
              </Link>
            )}
          </section>
          <section className="auth-local-card">
            <span className="auth-card-icon">
              <Icon name="copy" size={24} />
            </span>
            <p className="app-eyebrow">SHU BRAUZERDAGI NUSXA</p>
            <h2>Mahalliy so‘rovlarni ham olib o‘ting.</h2>
            <p>
              Bu brauzerda {local.items.length} ta so‘rov bor. Ular hisobingizga
              avtomatik ko‘chirilmaydi. Xohlasangiz, ularni bir marta bulutga
              saqlang.
            </p>
            <Button
              variant="outlined"
              icon="history"
              disabled={!!busy || !local.items.length || !local.available}
              onClick={syncLocal}
            >
              {busy === "sync"
                ? "Saqlanmoqda…"
                : "Mahalliy so‘rovlarni hisobga saqlash"}
            </Button>
            {!local.available && <small role="status">{local.reason}</small>}
            <div className="auth-local-note">
              <Icon name="shield" size={17} />
              <span>
                Hisobdan chiqish mahalliy nusxalarni o‘chirmaydi. Umumiy
                qurilmada Google hisobingizdan chiqishni unutmang.
              </span>
            </div>
          </section>
        </div>
      </div>
    );

  return (
    <div className="auth-page auth-signin">
      <section className="auth-signin-layout">
        <div className="auth-story">
          <div className="auth-story-photo">
            <img
              src="/images/dashboard-delivery.webp"
              alt="Kichik yuklar uchun shaharlararo yo‘l"
            />
            <span className="auth-photo-label">
              <Icon name="pin" size={14} />
              YAQIN MANZILLAR. ANIQ YO‘LLAR.
            </span>
          </div>
          <div className="auth-story-copy">
            <p className="app-eyebrow">YO‘LCHI BILAN DAVOM ETING</p>
            <h2>
              Yaqin manzillar.
              <br />
              <span>Bir hisobda.</span>
            </h2>
            <p>
              Qatnovni tanlang, so‘rovni tayyorlang. Hisobga kirib,
              tasdiqlaringizni qurilmalar o‘rtasida saqlang.
            </p>
            <div className="auth-story-points">
              <span>
                <Icon name="check" size={15} />
                Haqiqiy Google kirishi
              </span>
              <span>
                <Icon name="check" size={15} />
                Shaxsiy so‘rovlar tarixi
              </span>
            </div>
          </div>
        </div>
        <div className="auth-login-panel">
          <Logo />
          <div className="auth-login-heading">
            <p className="app-eyebrow">XUSH KELIBSIZ</p>
            <h1>
              Yukingiz uchun yo‘l.
              <br />
              Siz uchun qulaylik.
            </h1>
            <p>
              Hisobingizga Google orqali kiring va so‘rovlaringizni bir joyda
              saqlang.
            </p>
          </div>
          <OAuthNotice message={message || configError} />
          {notice && (
            <p className="auth-login-notice" role="status">
              {notice}
            </p>
          )}
          {configured ? (
            <button
              className="auth-google-button"
              disabled={!!busy}
              onClick={login}
            >
              <GoogleMark />
              <span>
                {busy === "login"
                  ? "Google sahifasi ochilmoqda…"
                  : "Google orqali kirish"}
              </span>
              <Icon name="arrow" size={18} />
            </button>
          ) : (
            <div className="auth-unavailable" role="status">
              <Icon name="info" size={20} />
              <div>
                <strong>Hisobga kirish hozircha mavjud emas.</strong>
                <p>
                  Google ulanishi sozlangach, shu yerda ochiladi. Hozir
                  qatnovlardan mehmon sifatida to‘liq foydalanishingiz mumkin.
                </p>
              </div>
            </div>
          )}
          <div className="auth-divider">
            <span />
            yoki
            <span />
          </div>
          <Button
            variant="outlined"
            icon="truck"
            onClick={() => go("/qatnovlar")}
          >
            Mehmon sifatida davom etish
          </Button>
          <div className="auth-login-footnote">
            <Icon name="shield" size={17} />
            <p>
              Google parolingiz {BRAND.name} saytiga berilmaydi. Kirish
              Google’ning o‘z sahifasida bajariladi.
            </p>
          </div>
          <Link to="/qollanma" className="auth-inline-link">
            Savollaringiz bormi? Qo‘llanma
            <Icon name="out" size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function readOAuthError() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const error = search.get("error") || hash.get("error");
  if (!error) return "";
  return error === "access_denied"
    ? "Google orqali kirish bekor qilindi. Istasangiz, qayta urinib ko‘ring."
    : "Google orqali kirish yakunlanmadi. Qayta urinib ko‘ring yoki mehmon sifatida davom eting.";
}
export function AuthCallback() {
  const { loading, user, configured, configError } = useAuth();
  const [oauthError] = useState(readOAuthError);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 18000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (oauthError) {
      const url = new URL(window.location.href);
      ["error", "error_description", "error_code"].forEach((key) =>
        url.searchParams.delete(key),
      );
      const hash = new URLSearchParams(url.hash.slice(1));
      ["error", "error_description", "error_code"].forEach((key) =>
        hash.delete(key),
      );
      url.hash = hash.toString();
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      return;
    }
    if (!loading && user) {
      window.history.replaceState({}, "", "/hisob");
      window.dispatchEvent(new Event("yolchi:navigate"));
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [loading, user, oauthError]);
  const failed =
    oauthError ||
    configError ||
    (!loading && !configured
      ? "Google ulanishi hozir mavjud emas."
      : !loading && !user
        ? "Google sessiyasi topilmadi. Kirishni qayta boshlang."
        : "");
  return (
    <div className="auth-page auth-callback">
      <span className={`auth-callback-symbol ${failed ? "failed" : ""}`}>
        {failed ? (
          <Icon name="info" size={32} />
        ) : (
          <span className="auth-loader" />
        )}
      </span>
      <p className="app-eyebrow">GOOGLE ORQALI KIRISH</p>
      <h1>
        {failed ? "Kirishni yakunlab bo‘lmadi." : "Hisobingizga ulanyapmiz."}
      </h1>
      <p role="status">
        {failed ||
          "Google javobi tekshirilmoqda. Sessiya tayyor bo‘lgach, hisobingiz ochiladi."}
      </p>
      {slow && !failed && (
        <p className="auth-slow-note">
          Ulanish biroz uzoq davom etmoqda. Internet aloqasini tekshiring yoki
          kirishni qayta boshlang.
        </p>
      )}
      {(failed || slow) && (
        <div className="auth-callback-actions">
          <Button icon="refresh" onClick={() => go("/kirish")}>
            Kirish sahifasiga qaytish
          </Button>
          <Button variant="text" onClick={() => go("/qatnovlar")}>
            Qatnovlarni ko‘rish
          </Button>
        </div>
      )}
    </div>
  );
}
