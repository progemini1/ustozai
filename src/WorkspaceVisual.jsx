import React from "react";
import { motion } from "motion/react";
import { TRIPS, DESTINATIONS } from "./content.js";
import { Icon } from "./icons.jsx";
import { dateLabel, sortTrips } from "./domain.js";

const NODES = [
  {
    name: "Barchasi",
    label: "Viloyat markazi",
    code: "VM",
    x: 16,
    y: 43,
    tone: "origin",
  },
  {
    name: "A tumani",
    label: "A tumani",
    code: "A",
    x: 52,
    y: 21,
    tone: "mint",
  },
  {
    name: "B tumani",
    label: "B tumani",
    code: "B",
    x: 83,
    y: 52,
    tone: "peach",
  },
  {
    name: "C tumani",
    label: "C tumani",
    code: "C",
    x: 49,
    y: 80,
    tone: "lavender",
  },
];
const EDGES = [
  { id: "Y01", to: "A tumani", path: "M86 125 Q160 5 281 61" },
  { id: "Y02", to: "B tumani", path: "M86 125 Q260 205 448 151" },
  { id: "Y03", to: "B tumani", path: "M281 61 Q403 30 448 151" },
  { id: "Y04", to: "C tumani", path: "M448 151 Q420 275 265 232" },
  { id: "Y05", to: "A tumani", path: "M265 232 Q185 155 281 61" },
];

export function NetworkScene({ destination, onSelect }) {
  return (
    <div className="network-panel">
      <div className="network-top">
        <span>
          <i /> HUDUDLAR BOG‘LANISHI
        </span>
        <span>01 / 03</span>
      </div>
      <div
        className="network-graph"
        role="group"
        aria-label="Sxemadan yetib borish hududini tanlash"
      >
        <svg
          viewBox="0 0 540 290"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="network-dots"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".7" fill="#ffffff" opacity=".17" />
            </pattern>
          </defs>
          <rect width="540" height="290" fill="url(#network-dots)" />
          {EDGES.map((edge) => (
            <g
              key={edge.id}
              className={
                destination === "Barchasi" || destination === edge.to
                  ? "network-edge active"
                  : "network-edge"
              }
            >
              <path d={edge.path} className="network-edge-base" />
              <path d={edge.path} className="network-edge-flow" />
            </g>
          ))}
        </svg>
        {NODES.map((node) => (
          <button
            key={node.name}
            className={`network-node node-${node.tone} ${destination === node.name ? "selected" : ""}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            aria-label={
              node.name === "Barchasi"
                ? "Sxemada barcha hududlar"
                : `Sxemada ${node.name}`
            }
            aria-pressed={destination === node.name}
            onClick={() => onSelect(node.name)}
          >
            <span className="network-node-disc">
              {node.name === "Barchasi" ? (
                <Icon name="box" size={25} />
              ) : (
                node.code
              )}
              <span className="node-pulse" />
            </span>
            <strong>{node.label}</strong>
          </button>
        ))}
      </div>
      <div className="network-bottom">
        <span>
          <Icon name="pin" size={14} /> Manzil ustiga bosib tanlang
        </span>
        <span>{TRIPS.length} yo‘nalish</span>
      </div>
    </div>
  );
}

export function DestinationOverview({ destination, onSelect }) {
  return (
    <div
      className="destination-overview"
      aria-label="Hududlar bo‘yicha qatnovlar"
    >
      {DESTINATIONS.slice(1).map((name, i) => {
        const trips = TRIPS.filter((t) => t.to === name);
        return (
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            key={name}
            aria-pressed={destination === name}
            className={`destination-card dest-${i} ${destination === name ? "selected" : ""}`}
            onClick={() => onSelect(destination === name ? "Barchasi" : name)}
          >
            <span className="destination-monogram">
              {name[0]}
              <svg viewBox="0 0 100 70" aria-hidden="true">
                <path d="M-10 60C22 60 20 5 55 15S65 70 110 25" />
              </svg>
            </span>
            <span className="destination-card-copy">
              <small>YETIB BORISH HUDUDI</small>
              <strong>{name}</strong>
              <span>
                {trips.length} ta qatnov <i>·</i>{" "}
                {trips
                  .map((t) => t.from)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(", ")}
              </span>
            </span>
            <span className="destination-card-arrow">
              <Icon name={destination === name ? "check" : "out"} size={19} />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function DepartureList({ trips, onDetail }) {
  return (
    <section className="departures-panel">
      <div className="departures-heading">
        <span className="aside-icon">
          <Icon name="clock" size={22} />
        </span>
        <div>
          <p>JADVAL BO‘YICHA</p>
          <h3>Jo‘nash vaqtlari</h3>
        </div>
      </div>
      {sortTrips(trips).map((trip) => (
        <button
          className="departure-row"
          key={trip.id}
          onClick={() => onDetail(trip)}
          aria-label={`${trip.id}, ${trip.time}, tafsilotlar`}
        >
          <span className="departure-time">
            {trip.time}
            <small>{dateLabel(trip.date).replace(" 2026", "")}</small>
          </span>
          <span className="departure-track">
            <i />
          </span>
          <span className="departure-destination">
            <strong>{trip.to}</strong>
            <small>{trip.from}</small>
          </span>
          <Icon name="chevron" size={16} />
        </button>
      ))}
      {!trips.length && (
        <p className="departure-empty">Tanlangan filtrga qatnov topilmadi.</p>
      )}
      <div className="departures-note">
        <Icon name="info" size={17} />
        <p>
          Jo‘nash vaqti ko‘rsatilgan. Yetib borish vaqti tashuvchi bilan
          aniqlanadi.
        </p>
      </div>
    </section>
  );
}
