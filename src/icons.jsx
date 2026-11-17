import React from "react";
const paths = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  out: "M6 18 18 6M6 6h12v12",
  search: "m21 21-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 8h16M4 16h16",
  grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check: "m5 12 4 4L19 6",
  clock: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  box: "m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11M7 5l10 4",
  truck:
    "M3 5h11v12H3V5Zm11 5h4l3 4v3h-7M8 17a2 2 0 1 1-4 0m16 0a2 2 0 1 1-4 0",
  home: "m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v6l4 2",
  book: "M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3V4Zm9 2v16",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10",
  help: "M9 9a3 3 0 1 1 4 3v2m-1 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  back: "M20 12H5m6-6-6 6 6 6",
  chevron: "m9 5 7 7-7 7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  copy: "M8 8h13v13H8V8ZM4 16H2V2h14v2",
  print: "M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6v-7",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6",
  edit: "m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5",
  pause: "M8 4v16M16 4v16",
  play: "m8 4 12 8-12 8V4",
  refresh: "M20 8a9 9 0 1 0 1 8M21 3v6h-6",
  palette:
    "M12 3a9 9 0 1 0 0 18h2c2 0 2-3 0-4-1-1 0-3 2-3h2c5 0 4-11-6-11ZM7 8h.01M12 6h.01M17 8h.01M6 13h.01",
  info: "M12 10v7m0-11h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};
export function Icon({ name, size = 22, ...props }) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.box} />
    </svg>
  );
}
