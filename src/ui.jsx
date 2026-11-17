import React from "react";
import { BRAND } from "./content.js";
import { Icon } from "./icons.jsx";

export const getLocation = () => location.pathname + location.search;
export function go(path) {
  if (path === getLocation()) return;
  history.pushState({}, "", path);
  window.dispatchEvent(new Event("yolchi:navigate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}
export function Link({ to, children, onClick, ...props }) {
  return (
    <a
      {...props}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (
          !e.defaultPrevented &&
          e.button === 0 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
}
export function Button({ variant = "filled", children, icon, ...props }) {
  const Tag = `md-${variant === "tonal" ? "filled-tonal" : variant}-button`;
  return (
    <Tag {...props}>
      {icon && (
        <span slot="icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      {children}
    </Tag>
  );
}
export function Logo({ small = false, landing = false }) {
  return (
    <Link
      to="/"
      className={`logo ${small ? "logo-small" : ""} ${landing ? "landing-logo" : ""}`}
      aria-label="Yo‘lchi bosh sahifasi"
    >
      <img src="/brand/logo.png" alt="" width="42" height="40" />
      {!small && (
        <span>
          {BRAND.name}
          <small>
            {landing ? "YUKLARNI BOG‘LAYMIZ" : "Kichik yuk uchun qatnov"}
          </small>
        </span>
      )}
    </Link>
  );
}
export function Cube({ className = "" }) {
  return (
    <svg
      className={`cube-art ${className}`}
      viewBox="0 0 220 200"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m110 12 82 46v94l-82 46-82-46V58l82-46Z"
        fill="currentColor"
        opacity=".07"
      />
      <path
        d="m110 12 82 46-82 47-82-47 82-46ZM28 58v94l82 46 82-46V58M110 105v93M70 35l81 47v34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m49 133 35 20M49 143l20 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
