import React, { useEffect, useRef, useState } from 'react';
import { BRAND } from './content.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const seeded = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const FLAG_COLORS = ['#ffffff', '#0099b5', '#1eb53a', '#ce1126'];
const FLAG_STARS = Object.freeze(
  [3, 4, 5].flatMap((count, row) =>
    Array.from({ length: count }, (_, col) =>
      Object.freeze({ x: 87 - (count - 1 - col) * 12, y: 8 + row * 12, row })
    )
  )
);

const flagCache = new Map();
function uzbekFlagPoints(count) {
  if (flagCache.has(count)) return flagCache.get(count);
  const points = [];
  const lineCount = Math.round((count * 0.1) / 2);
  const moonCount = Math.round(count * 0.11);
  const starCount = 24;
  const backgroundCount = Math.max(100, count - lineCount * 2 - moonCount - starCount * 12);
  const cols = Math.ceil(Math.sqrt(backgroundCount * 2));
  const rows = Math.ceil(backgroundCount / cols);

  for (let i = 0; i < backgroundCount; i++) {
    const x = (((i % cols) + 0.5) / cols) * 250;
    const y = ((Math.floor(i / cols) + 0.5) / rows) * 125;
    points.push({
      x,
      y,
      color: y < 40 ? 1 : y < 42.5 ? 3 : y < 82.5 ? 0 : y < 85 ? 3 : 2,
      feature: 'field',
    });
  }
  for (const y of [41.25, 83.75]) {
    for (let i = 0; i < lineCount; i++) {
      points.push({
        x: ((i + 0.5) / lineCount) * 250,
        y,
        color: 3,
        feature: 'separator',
      });
    }
  }
  let attempt = 0;
  while (points.length < backgroundCount + lineCount * 2 + moonCount && attempt < 20000) {
    const x = 20 + seeded(attempt + 601) * 30;
    const y = 5 + seeded(attempt + 1601) * 30;
    attempt++;
    if (Math.hypot(x - 35, y - 20) <= 15 && Math.hypot(x - 40.5, y - 20) > 15) {
      points.push({ x, y, color: 0, feature: 'crescent' });
    }
  }
  FLAG_STARS.forEach((star, index) => {
    for (let i = 0; i < starCount; i++) {
      const edge = i % 10;
      const angle = -Math.PI / 2 + (edge * Math.PI) / 5;
      const radius = edge % 2 ? 1.15 : 3;
      const fill = i >= 10 ? 0.52 : 1;
      points.push({
        x: star.x + Math.cos(angle) * radius * fill,
        y: star.y + Math.sin(angle) * radius * fill,
        color: 0,
        feature: 'star',
        star: index,
        row: star.row,
      });
    }
  });
  flagCache.set(count, points);
  return points;
}

function advanceParticle(p, target, pointer, waves, dt = 1) {
  const steps = Math.max(1, Math.ceil(dt));
  const step = dt / steps;
  for (let j = 0; j < steps; j++) {
    let ax = (target.x - p.x) * 0.056;
    let ay = (target.y - p.y) * 0.056;
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const d = Math.hypot(dx, dy);
    if (d < 110 && d > 0.01) {
      const force = (1 - d / 110) * 5.0;
      ax += (dx / d) * force;
      ay += (dy / d) * force;
    }
    for (const wave of waves) {
      const x = p.x - wave.x;
      const y = p.y - wave.y;
      const r = Math.hypot(x, y);
      if (r > 0.01 && Math.abs(r - wave.radius) < 26) {
        ax += (x / r) * 9.5;
        ay += (y / r) * 9.5;
      }
    }
    const damping = Math.pow(0.82, step);
    p.vx = (p.vx + ax * step) * damping;
    p.vy = (p.vy + ay * step) * damping;
    p.x += p.vx * step;
    p.y += p.vy * step;
  }
}

function shapeTarget(kind, i, count, time, box, pointer = { nx: 0, ny: 0 }) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.31;

  if (kind === 'sphere' || kind === 'ring') {
    const ring = kind === 'ring' ? Math.floor(count * 0.22) : 0;
    if (i < ring) {
      const a = (i / ring) * Math.PI * 2 + time * 0.35;
      const x = Math.cos(a) * r * 1.48;
      const y = Math.sin(a) * r * 0.36;
      return {
        x: cx + x * Math.cos(-0.32) - y * Math.sin(-0.32),
        y: cy + x * Math.sin(-0.32) + y * Math.cos(-0.32),
        alpha: 0.96,
        color: 1,
        size: 1.9,
      };
    }
    const t = (i - ring + 0.5) / Math.max(1, count - ring);
    const polar = Math.acos(clamp(1 - 2 * t, -1, 1));
    const angle = (i - ring + 0.5) * 10.166407384630519;
    const x = Math.sin(polar) * Math.cos(angle);
    const y = Math.cos(polar);
    const z = Math.sin(polar) * Math.sin(angle);
    const rotation = time * 0.24 + pointer.nx * 0.65;
    const tilt = 0.35 + pointer.ny * 0.32;
    const xx = x * Math.cos(rotation) - z * Math.sin(rotation);
    const zz = x * Math.sin(rotation) + z * Math.cos(rotation);
    const yy = y * Math.cos(tilt) - zz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
    const perspective = 1 / (1.9 - depth * 0.5);
    return {
      x: cx + xx * r * perspective * 1.42,
      y: cy + yy * r * perspective * 1.42,
      alpha: 0.34 + 0.66 * (depth * 0.5 + 0.5),
      size: 1.35 + depth * 0.85,
    };
  }

  if (kind === 'helix') {
    const strand = i % 3;
    const t = (i / count + time * 0.03) % 1;
    const a = t * Math.PI * 16 + time * 1.1 + (strand === 1 ? Math.PI : 0);
    const radius = Math.min(box.w, box.h) * 0.2;
    if (strand === 2) {
      const row = Math.floor(t * 44) / 44;
      return {
        x: cx + radius * Math.cos(row * Math.PI * 16 + time * 1.1) * (((i * 0.618) % 1) * 2 - 1),
        y: box.y + box.h * (0.86 - row * 0.72),
        alpha: 0.58,
        color: 2,
        size: 1.45,
      };
    }
    const depth = Math.sin(a);
    return {
      x: cx + radius * Math.cos(a) * (1 + t * 0.42),
      y: box.y + box.h * (0.86 - t * 0.72),
      alpha: 0.44 + 0.56 * (depth * 0.5 + 0.5),
      color: strand ? 1 : 0,
      size: 1.45 + depth * 0.8,
    };
  }

  if (kind === 'towers') {
    const column = i % 36;
    const col = column % 9;
    const row = Math.floor(column / 9);
    const level = (i * 0.381966) % 1;
    const height = 0.25 + seeded(column + 98) * 0.7;
    return {
      x:
        box.x +
        box.w * (0.16 + (col / 8) * 0.68) +
        (row - 1.5) * box.w * 0.026 +
        (box.w / 9) * 0.4 * (1 - row * 0.12) * (((i * 0.7548) % 1) - 0.5),
      y:
        box.y +
        box.h * (0.86 - row * 0.05) -
        level * box.h * 0.58 * height * (0.9 + 0.1 * Math.sin(time * 1.4 + column)),
      alpha: 0.4 + row * 0.18 + (level > 0.97 ? 0.35 : 0),
      color: level > 0.97 ? 1 : row === 3 ? 2 : 0,
      size: 1.6,
    };
  }

  if (kind === 'broadcast') {
    const ring = i % 9;
    const t = (time * 0.065 + ring / 9) % 1;
    const a =
      (Math.floor(i / 9) / Math.ceil(count / 9)) * Math.PI * 2 +
      0.4 * ring +
      0.05 * Math.sin(time * 0.3 + ring);
    const radius = 28 + t * Math.max(box.w, box.h) * 0.5;
    return {
      x: cx + Math.cos(a) * radius,
      y: cy + box.h * 0.04 + Math.sin(a) * radius * (box.w < 700 ? 1 : 0.56),
      alpha: 0.9 * (1 - t),
      color: ring % 3 === 0 ? 1 : 2,
      size: 1.5 + 0.9 * (1 - t),
    };
  }

  if (kind === 'flag') {
    const pts = uzbekFlagPoints(count);
    const p = pts[i % pts.length];
    const w = Math.min(box.w * 0.82, box.h * 1.45);
    const h = w / 2;
    const u = p.x / 250;
    const wave =
      Math.sin(u * 7 - time * 2.4) * h * 0.05 * (u + 0.15) +
      Math.sin(u * 3 - time * 1.1) * h * 0.02;
    return {
      x: box.x + (box.w - w) / 2 + u * w,
      y: box.y + (box.h - h) / 2 + (p.y / 125) * h + wave,
      alpha: 1,
      color: p.color,
      size: p.feature === 'star' ? 1.35 : 1.75,
    };
  }

  return {
    x: box.x + ((seeded(i + 51) * box.w + 8 * time * (seeded(i + 5) + 0.2)) % (box.w + 20)) - 10,
    y: box.y + seeded(i + 71) * box.h + 8 * Math.sin(time * 0.5 + seeded(i + 5) * 9),
    alpha: 0.12 + 0.28 * seeded(i + 5),
    size: 1.3 + seeded(i + 5),
  };
}

function drawProceduralHexLogo(c, cx, cy, radius) {
  c.save();
  const colors = ['#2563eb', '#06b6d4', '#079982', '#7c3aed'];
  for (let s = 0; s < 6; s++) {
    const a1 = (s * Math.PI) / 3 - Math.PI / 6;
    const a2 = ((s + 1) * Math.PI) / 3 - Math.PI / 6;
    c.beginPath();
    c.moveTo(cx + Math.cos(a1) * radius * 0.42, cy + Math.sin(a1) * radius * 0.42);
    c.lineTo(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
    c.lineTo(cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius);
    c.lineTo(cx + Math.cos(a2) * radius * 0.42, cy + Math.sin(a2) * radius * 0.42);
    c.closePath();
    c.fillStyle = colors[s % colors.length];
    c.fill();
  }
  c.restore();
}

export default function ParticleScene({
  paused = false,
  heroMode = 'combo',
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    paused,
    heroMode,
    reduced: false,
    frame: 0,
    time: 0,
    last: 0,
    waves: [],
    cache: new Map(),
    particles: [],
    pointer: { x: -10000, y: -10000, nx: 0, ny: 0 },
    mode: 'combo',
    scene: 'hero',
    targetName: 'YO‘LCHI',
    box: { x: 0, y: 0, w: 1, h: 1 },
    visible: true,
    motionStart: 0,
    signature: '',
    targets: null,
    previous: null,
    stageBounds: null,
    logoImg: null,
    logoLoaded: false,
    light: true,
    opacity: 1,
    width: 1,
    height: 1,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    stateRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    stateRef.current.heroMode = heroMode;
  }, [heroMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const st = stateRef.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    st.reduced = media.matches;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      st.logoImg = img;
      st.logoLoaded = true;
      st.cache.clear();
      st.syncScene?.(true);
      if (st.paused || st.reduced) st.snap?.();
      st.paint?.(0);
    };
    img.src = '/brand/logo.png';

    function buildCanvasTargets(kind, text, box) {
      const key = [
        kind,
        text,
        box.x | 0,
        box.y | 0,
        box.w | 0,
        box.h | 0,
        st.particles.length,
        st.logoLoaded ? 1 : 0,
      ].join(':');
      if (st.cache.has(key)) return st.cache.get(key);

      const W = Math.max(80, Math.round(box.w));
      const H = Math.max(80, Math.round(box.h));
      const mask = document.createElement('canvas');
      mask.width = W;
      mask.height = H;
      const c = mask.getContext('2d', { willReadFrequently: true });
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.clearRect(0, 0, W, H);

      if (kind === 'logo') {
        const size = Math.min(W, H) * 0.92;
        if (st.logoLoaded && st.logoImg) {
          const iw = st.logoImg.naturalWidth || 1310;
          const ih = st.logoImg.naturalHeight || 1200;
          const scale = Math.min(size / iw, size / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          c.drawImage(st.logoImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        } else {
          drawProceduralHexLogo(c, W / 2, H / 2, size * 0.45);
        }
      } else if (kind === 'combo') {
        const logoBoxSize = Math.min(H * 0.88, W * 0.25);
        const gap = Math.max(24, W * 0.032);
        c.font = '400 100px "Instrument Serif", Georgia, serif';
        const m = c.measureText(text);
        const mw = (m.actualBoundingBoxLeft || m.width / 2) + (m.actualBoundingBoxRight || m.width / 2);
        const ascent = (m.actualBoundingBoxAscent || 72) / 100;
        const descent = (m.actualBoundingBoxDescent || 18) / 100;
        const totalH = ascent + descent;
        const availTextW = Math.max(140, W * 0.92 - logoBoxSize - gap);
        const font = Math.min(availTextW / (mw / 100), (H * 0.88) / totalH);
        c.font = `400 ${font}px "Instrument Serif", Georgia, serif`;
        const textW = (mw / 100) * font;
        const groupW = logoBoxSize + gap + textW;
        const startX = (W - groupW) / 2;

        if (st.logoLoaded && st.logoImg) {
          const iw = st.logoImg.naturalWidth || 1310;
          const ih = st.logoImg.naturalHeight || 1200;
          const scale = Math.min(logoBoxSize / iw, logoBoxSize / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          c.drawImage(st.logoImg, startX + (logoBoxSize - dw) / 2, (H - dh) / 2, dw, dh);
        } else {
          drawProceduralHexLogo(c, startX + logoBoxSize / 2, H / 2, logoBoxSize * 0.45);
        }

        c.fillStyle = '#062c35';
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        const textX = startX + logoBoxSize + gap;
        const textY = (H - totalH * font) / 2 + ascent * font;
        c.fillText(text, textX, textY);
      } else if (kind === 'circle') {
        const chars = [...text];
        const radius = Math.min(W, H) * 0.36;
        const font = radius * 0.42;
        c.fillStyle = '#062c35';
        c.font = `400 ${font}px "Instrument Serif", Georgia, serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        chars.forEach((char, i) => {
          const a = -Math.PI / 2 + (i / chars.length) * Math.PI * 2;
          c.save();
          c.translate(W / 2 + Math.cos(a) * radius, H / 2 + Math.sin(a) * radius);
          c.rotate(a + Math.PI / 2);
          c.fillText(char, 0, 0);
          c.restore();
        });
      } else {
        const lines = text.split('|');
        c.font = '400 100px "Instrument Serif", Georgia, serif';
        const metrics = lines.map((line) => c.measureText(line));
        const mw = Math.max(
          ...metrics.map((m) => (m.actualBoundingBoxLeft || m.width / 2) + (m.actualBoundingBoxRight || m.width / 2))
        );
        const ascent = (metrics[0].actualBoundingBoxAscent || 72) / 100;
        const descent = (metrics.at(-1).actualBoundingBoxDescent || 18) / 100;
        const total = ascent + 0.92 * (lines.length - 1) + descent;
        const font = Math.min((W * 0.9) / (mw / 100), (H * 0.88) / total);
        c.fillStyle = '#062c35';
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        c.font = `400 ${font}px "Instrument Serif", Georgia, serif`;
        lines.forEach((line, i) =>
          c.fillText(line, W / 2, (H - total * font) / 2 + ascent * font + i * font * 0.92)
        );
      }

      const pixels = c.getImageData(0, 0, W, H).data;
      const isOpaque = (px, py) => {
        if (px < 0 || py < 0 || px >= W || py >= H) return false;
        return pixels[(py * W + px) * 4 + 3] > 135;
      };
      const isCleanSolid = (px, py) => {
        if (!isOpaque(px, py)) return false;
        let neighbors = 0;
        if (isOpaque(px - 2, py)) neighbors++;
        if (isOpaque(px + 2, py)) neighbors++;
        if (isOpaque(px, py - 2)) neighbors++;
        if (isOpaque(px, py + 2)) neighbors++;
        return neighbors >= 2;
      };

      // Binary search for exact SI.gov lattice grid spacing so every particle gets a distinct grid cell
      const targetCount = st.particles.length;
      let lo = 2.4,
        hi = 18.0,
        bestSpacing = 4.6;
      for (let iter = 0; iter < 8; iter++) {
        const mid = (lo + hi) * 0.5;
        let cnt = 0;
        for (let y = mid / 2; y < H; y += mid) {
          const iy = Math.floor(y);
          for (let x = mid / 2; x < W; x += mid) {
            if (isCleanSolid(Math.floor(x), iy)) cnt++;
          }
        }
        if (cnt >= targetCount) {
          bestSpacing = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const spacing = Math.max(2.6, bestSpacing);
      const points = [];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (let y = spacing / 2; y < H; y += spacing) {
        const iy = Math.floor(y);
        for (let x = spacing / 2; x < W; x += spacing) {
          const ix = Math.floor(x);
          if (isCleanSolid(ix, iy)) {
            const idx = (iy * W + ix) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];
            const isColoredLogoPixel =
              (kind === 'logo' || kind === 'combo') &&
              (Math.abs(r - 6) > 18 || Math.abs(g - 44) > 18 || Math.abs(b - 53) > 18);
            points.push({
              x: box.x + x,
              y: box.y + y,
              nx: (x / W) * 2 - 1,
              ny: (y / H) * 2 - 1,
              column: Math.floor(x / spacing),
              line: text.includes('|') && y > H / 2 ? 1 : 0,
              edgeAlpha: clamp((a - 100) / 140, 0.65, 1),
              customColor: isColoredLogoPixel ? `rgb(${r},${g},${b})` : null,
            });
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (!points.length) {
        for (let i = 0; i < st.particles.length; i++) {
          points.push({
            x: box.x + seeded(i + 1) * box.w,
            y: box.y + seeded(i + 2) * box.h,
            nx: 0,
            ny: 0,
            column: i,
            line: 0,
            edgeAlpha: 1,
            customColor: null,
          });
        }
        minX = 0;
        minY = 0;
        maxX = W;
        maxY = H;
      }

      points.sort((a, b) => a.line - b.line || a.column - b.column || (a.column % 2 ? b.y - a.y : a.y - b.y));
      points.forEach((p, i) => (p.rank = i / points.length));
      for (let j = points.length - 1; j > 0; j--) {
        const k = Math.floor(seeded(j + 97) * (j + 1));
        [points[j], points[k]] = [points[k], points[j]];
      }

      const dotRadius = clamp(spacing * 0.36, 1.45, 2.05);
      const result = Array.from({ length: st.particles.length }, (_, i) => {
        const p = points[i % points.length];
        return {
          ...p,
          x: p.x,
          y: p.y,
          alpha: p.edgeAlpha ?? 1,
          size: p.customColor ? dotRadius * 1.08 : dotRadius,
        };
      });
      result.bounds = { x: box.x + minX, y: box.y + minY, w: Math.max(40, maxX - minX), h: Math.max(40, maxY - minY) };
      st.cache.set(key, result);
      return result;
    }

    function targetAt(i) {
      if ((st.mode === 'text' || st.mode === 'combo' || st.mode === 'logo') && st.targets) {
        const p = st.targets[i % st.targets.length];
        if (!p) return { x: st.width / 2, y: st.height / 2, alpha: 0.5, size: 1.5 };
        return p;
      }
      if (st.mode === 'snake' && st.targets) {
        const p = st.targets[i % st.targets.length];
        if (!p) return { x: st.width / 2, y: st.height / 2, alpha: 0.5, size: 1.5 };
        const progress = (st.time - st.motionStart) / 2.0;
        if (!st.reduced && progress < p.rank) {
          const prev = st.previous?.[i % (st.previous.length || 1)];
          return prev || { ...p, alpha: 0.3 };
        }
        return {
          ...p,
          color: !st.reduced && progress - p.rank < 0.045 ? 1 : undefined,
          size: !st.reduced && progress - p.rank < 0.045 ? 2.9 : p.size || 1.85,
        };
      }
      if (st.mode === 'circle' && st.targets) {
        const p = st.targets[i % st.targets.length];
        if (!p) return { x: st.width / 2, y: st.height / 2, alpha: 0.5, size: 1.5 };
        const cx = st.box.x + st.box.w / 2;
        const cy = st.box.y + st.box.h / 2;
        const angle = st.reduced ? 0 : Math.max(0, st.time - st.motionStart - 0.5) * 0.35;
        const x = p.x - cx;
        const y = p.y - cy;
        return {
          ...p,
          x: cx + x * Math.cos(angle) - y * Math.sin(angle),
          y: cy + x * Math.sin(angle) + y * Math.cos(angle),
          size: 1.75,
        };
      }
      return shapeTarget(
        st.mode,
        i,
        st.particles.length,
        st.reduced ? 0 : st.time,
        st.box,
        st.pointer
      );
    }

    function snap() {
      if (!st.particles.length) return;
      for (let i = 0; i < st.particles.length; i++) {
        const t = targetAt(i);
        const p = st.particles[i];
        if (!t) continue;
        p.x = t.x;
        p.y = t.y;
        p.vx = p.vy = 0;
      }
    }

    function syncScene(force = false) {
      const middle = st.height * 0.5;
      const hero = document.querySelector('.landing .si-hero');
      if (!hero) return;
      const heroBox = hero.getBoundingClientRect();
      const candidates = [...document.querySelectorAll('.landing [data-motion]')].filter((e) => {
        const b = e.getBoundingClientRect();
        return b.top <= middle && b.bottom > middle;
      });
      const section = candidates.at(-1) || hero;
      const scene = section === hero ? 'hero' : section.id || section.dataset.motion || 'text';
      let mode = section.dataset.motion || 'combo';
      let box;

      if (scene === 'hero') {
        const copyEl = document.querySelector('.landing .si-hero-copy');
        const heading = (copyEl ? copyEl.getBoundingClientRect().top : st.height * 0.6) + window.scrollY;
        const availH = Math.max(180, heading - 98);
        mode = st.heroMode || 'combo';
        if (mode === 'snake' && st.width < 900) mode = 'circle';

        if (st.width >= 900) {
          const isLogoOnly = mode === 'logo';
          const w = isLogoOnly
            ? Math.min(availH * 1.05, 430)
            : Math.min(st.width * (mode === 'text' ? 0.84 : 0.82), mode === 'text' ? 1440 : 1360);
          const h = isLogoOnly
            ? Math.min(availH * 0.94, 380)
            : Math.min(availH * 0.92, mode === 'snake' ? 360 : 350);
          box = {
            x: (st.width - w) / 2,
            y: 78 + Math.max(0, (availH - h) * 0.35),
            w,
            h,
          };
        } else {
          const w = st.width * 0.88;
          const h = Math.min(availH * 0.82, 220);
          box = {
            x: (st.width - w) / 2,
            y: 72 + Math.max(0, (availH - h) * 0.35),
            w,
            h,
          };
        }
      } else {
        const stageEl = section.querySelector('.si-motion-stage');
        const b = stageEl?.getBoundingClientRect();
        box =
          st.width >= 900 && scene !== 'reja'
            ? { x: st.width * 0.54, y: st.height * 0.16, w: st.width * 0.38, h: st.height * 0.64 }
            : b && b.width > 20 && b.height > 20
              ? { x: b.left, y: b.top, w: b.width, h: b.height }
              : { x: st.width * 0.12, y: st.height * 0.16, w: st.width * 0.76, h: st.height * 0.44 };
      }

      if (mode === 'scatter' || mode === 'broadcast') {
        box = { x: 0, y: 0, w: st.width, h: st.height };
      }

      const brandTitle = (BRAND.name || 'Yo‘lchi').toUpperCase();
      const target =
        mode === 'text' || mode === 'combo'
          ? brandTitle
          : mode === 'logo'
            ? 'LOGO'
            : mode === 'snake'
              ? 'Ishonchli Yo‘l|Aniq Manzil'
              : mode === 'circle'
                ? `${brandTitle} · ISHONCHLI YO‘L · `
                : '';

      const signature = [
        mode,
        scene,
        target,
        st.logoLoaded ? 1 : 0,
        Math.round(box.x),
        Math.round(box.y),
        Math.round(box.w),
        Math.round(box.h),
      ].join('|');

      const changed = signature !== st.signature;
      st.scene = scene;
      st.box = box;
      st.mode = mode;
      st.targetName = target;

      const surface = section.closest('section') || hero;
      const channels = getComputedStyle(surface)
        .backgroundColor.match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      st.light = !channels || channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 150;
      canvas.dataset.surface = st.light ? 'light' : 'dark';

      const footer = document.querySelector('.landing .si-footer');
      if (footer) {
        const fb = footer.getBoundingClientRect();
        st.opacity = clamp((fb.top - st.height * 0.25) / (st.height * 0.5), 0, 1);
      } else {
        st.opacity = 1;
      }
      if (scene === 'hero' && heroBox.bottom < 0) st.opacity = 0;

      if (changed || force) {
        const modeChanged = canvas.dataset.form !== mode;
        st.signature = signature;
        if (['text', 'combo', 'logo', 'snake', 'circle'].includes(mode)) {
          st.previous = st.targets;
          st.targets = buildCanvasTargets(mode, target, box);
          st.stageBounds = st.targets.bounds;
        }
        if (modeChanged) st.motionStart = st.time;
        canvas.dataset.form = mode;
        canvas.dataset.scene = scene;
        if (st.paused || st.reduced) snap();
      }
    }

    function paint(dt = 0) {
      if (!st.particles.length) return;
      ctx.clearRect(0, 0, st.width, st.height);
      const palette =
        st.mode === 'flag'
          ? FLAG_COLORS
          : st.light
            ? ['#091e3a', '#2563eb', '#06b6d4', '#7c3aed']
            : ['#ffffff', '#38bdf8', '#a78bfa', '#34d399'];

      for (let i = 0; i < st.particles.length; i++) {
        const p = st.particles[i];
        const t = targetAt(i);
        if (!t) continue;
        if (dt) advanceParticle(p, t, st.pointer, st.waves, dt);
        const speed = clamp(Math.hypot(p.vx, p.vy) / 7, 0, 1);
        const size = (t.size || 1.75) * (st.width < 700 ? 1.2 : 1.5) + speed * 1.6;
        ctx.globalAlpha = clamp(((t.alpha ?? 1) + speed * 0.4) * st.opacity, 0, 1);

        if (t.customColor) {
          ctx.fillStyle = speed > 0.48 ? '#0099b5' : t.customColor;
        } else {
          const colorIdx = st.mode === 'flag' ? (t.color ?? 0) : speed > 0.35 ? 1 : (t.color ?? p.color ?? 0);
          ctx.fillStyle = palette[colorIdx] || '#062c35';
        }

        if (st.mode === 'flag' && st.light && t.color === 0) {
          ctx.strokeStyle = '#59757d';
          ctx.lineWidth = 0.45;
          ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size);
        }
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      st.frame = 0;
      if (st.paused || !st.visible) return;
      const elapsed = st.last ? clamp((now - st.last) / 16.6667, 0, 3) : 1;
      st.last = now;
      st.time += elapsed / 60;
      for (const wave of st.waves) wave.radius += 16 * elapsed;
      st.waves = st.waves.filter((w) => w.radius < Math.max(st.width, st.height) * 1.2);
      paint(elapsed);
      start();
    }

    function start() {
      if (!st.frame && !st.paused && st.visible) {
        st.frame = requestAnimationFrame(tick);
      }
    }

    function stop() {
      if (st.frame) cancelAnimationFrame(st.frame);
      st.frame = 0;
      st.last = 0;
    }

    function resize() {
      st.width = window.innerWidth;
      st.height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(st.width * dpr);
      canvas.height = Math.round(st.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = st.width < 700 ? 1700 : 2500;
      if (st.particles.length !== count) {
        st.particles = Array.from({ length: count }, (_, i) => ({
          x: seeded(i + 7) * st.width,
          y: seeded(i + 47) * st.height,
          vx: 0,
          vy: 0,
          color: seeded(i + 17) < 0.35 ? 1 : seeded(i + 37) < 0.4 ? 2 : 0,
        }));
      }
      st.cache.clear();
      syncScene(true);
      if (st.paused || st.reduced) snap();
      paint();
      start();
    }

    function onPointerMove(e) {
      if (e.pointerType === 'touch' || st.paused || st.reduced) return;
      st.pointer = {
        x: e.clientX,
        y: e.clientY,
        nx: (e.clientX / st.width) * 2 - 1,
        ny: (e.clientY / st.height) * 2 - 1,
      };
    }

    function onPointerLeave() {
      st.pointer.x = st.pointer.y = -10000;
    }

    function onPointerDown(e) {
      if (st.paused || st.reduced || e.target.closest('a,input,button:not(.si-art-toggle),dialog')) return;
      st.waves.push({ x: e.clientX, y: e.clientY, radius: 0 });
    }

    function onScroll() {
      syncScene();
      if (st.paused) paint();
    }

    let resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    function onVisibility() {
      st.visible = !document.hidden;
      if (st.visible) start();
      else stop();
    }

    function onReduceChange(e) {
      st.reduced = e.matches;
      if (st.reduced) {
        syncScene(true);
        snap();
      }
      paint();
    }

    let cancelled = false;
    (async () => {
      try {
        if (document.fonts?.load) {
          await document.fonts.load('400 200px "Instrument Serif"');
          await document.fonts.ready;
        }
      } catch {}
      if (cancelled) return;
      resize();
      setReady(true);
    })();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener('change', onReduceChange);

    st.syncScene = syncScene;
    st.paint = paint;
    st.start = start;
    st.stop = stop;
    st.snap = snap;

    return () => {
      cancelled = true;
      stop();
      clearTimeout(resizeTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener('change', onReduceChange);
    };
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    if (!st.syncScene) return;
    st.syncScene(true);
    if (paused) {
      st.snap?.();
      st.stop?.();
      st.paint?.(0);
    } else {
      st.start?.();
    }
  }, [paused, heroMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`si-particle-field ${ready ? 'ready' : ''}`}
      aria-hidden="true"
    />
  );
}
