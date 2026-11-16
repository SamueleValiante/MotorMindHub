"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Sfondo animato della hero: scene vettoriali a tema motori (strada, contagiri,
 * ingranaggi, disco freno, schema tecnico) nei colori del sito, in dissolvenza
 * incrociata con lenta deriva. Nessuna foto = nessun diritto da gestire: per usare
 * fotografie proprie basta sostituire SCENES con <img> a tutto schermo.
 */
const ACCENT = "#3DA9FC";
const EMBER = "#EE471D";

function ticks(cx: number, cy: number, r1: number, r2: number, from: number, to: number, n: number, color: string, w = 3) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return (
      <line
        key={i}
        x1={cx + r1 * Math.cos(a)}
        y1={cy + r1 * Math.sin(a)}
        x2={cx + r2 * Math.cos(a)}
        y2={cy + r2 * Math.sin(a)}
        stroke={color}
        strokeWidth={i % 5 === 0 ? w * 1.8 : w}
        strokeLinecap="round"
      />
    );
  });
}

function Road() {
  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A0B0D" />
          <stop offset="1" stopColor="#12304a" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={ACCENT} stopOpacity="0.55" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      <circle cx="1000" cy="470" r="360" fill="url(#sun)" />
      <polygon points="0,900 1600,900 1600,500 0,500" fill="#0c0e12" />
      <polygon points="700,500 900,500 1500,900 100,900" fill="#16181D" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const t = i / 6;
        const y = 500 + 400 * t * t * 1.0;
        const h = 12 + 70 * t * t;
        const w = 4 + 26 * t * t;
        return <rect key={i} x={800 - w / 2} y={y} width={w} height={h} fill="#EDEEF0" opacity={0.75} />;
      })}
      <line x1="700" y1="500" x2="100" y2="900" stroke={ACCENT} strokeWidth="3" opacity="0.7" />
      <line x1="900" y1="500" x2="1500" y2="900" stroke={ACCENT} strokeWidth="3" opacity="0.7" />
      <line x1="0" y1="500" x2="1600" y2="500" stroke={ACCENT} strokeWidth="2" opacity="0.5" />
    </>
  );
}

function Tachometer() {
  return (
    <>
      <rect width="1600" height="900" fill="#0A0B0D" />
      <circle cx="1100" cy="450" r="520" fill="#12304a" opacity="0.35" />
      <g fill="none">
        <circle cx="1100" cy="450" r="380" stroke="#20242B" strokeWidth="26" />
        <path d="M 1100 70 A 380 380 0 1 1 745 585" stroke={ACCENT} strokeWidth="10" opacity="0.8" />
        <path d="M 1405 224 A 380 380 0 0 1 1480 450" stroke={EMBER} strokeWidth="14" opacity="0.95" />
      </g>
      {ticks(1100, 450, 330, 365, 135, 405, 40, "#EDEEF0", 2.5)}
      <line x1="1100" y1="450" x2="1380" y2="270" stroke={EMBER} strokeWidth="8" strokeLinecap="round" className="mmh-needle" />
      <circle cx="1100" cy="450" r="26" fill="#EDEEF0" />
    </>
  );
}

function Gears() {
  const gear = (cx: number, cy: number, r: number, teeth: number, color: string, cls: string) => (
    <g className={cls} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="28" strokeDasharray={`${(2 * Math.PI * r) / teeth / 2} ${(2 * Math.PI * r) / teeth / 2}`} opacity="0.85" />
      <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke={color} strokeWidth="14" />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke={color} strokeWidth="10" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return <line key={i} x1={cx + r * 0.35 * Math.cos(a)} y1={cy + r * 0.35 * Math.sin(a)} x2={cx + (r - 30) * Math.cos(a)} y2={cy + (r - 30) * Math.sin(a)} stroke={color} strokeWidth="10" />;
      })}
    </g>
  );
  return (
    <>
      <rect width="1600" height="900" fill="#0A0B0D" />
      <rect width="1600" height="900" fill="#16181D" opacity="0.6" />
      {gear(1150, 330, 300, 24, ACCENT, "mmh-spin")}
      {gear(640, 640, 190, 16, "#6b86a0", "mmh-spin-rev")}
      {gear(1450, 760, 140, 12, EMBER, "mmh-spin-rev")}
    </>
  );
}

function BrakeDisc() {
  return (
    <>
      <rect width="1600" height="900" fill="#0A0B0D" />
      <circle cx="1150" cy="450" r="480" fill="#12304a" opacity="0.4" />
      <g className="mmh-spin" style={{ transformOrigin: "1150px 450px" }}>
        <circle cx="1150" cy="450" r="400" fill="#16181D" stroke="#3a4048" strokeWidth="14" />
        <circle cx="1150" cy="450" r="300" fill="none" stroke="#20242B" strokeWidth="70" />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * Math.PI) / 18;
          const rr = i % 2 ? 330 : 270;
          return <circle key={i} cx={1150 + rr * Math.cos(a)} cy={450 + rr * Math.sin(a)} r="13" fill="#0A0B0D" />;
        })}
        <circle cx="1150" cy="450" r="120" fill="#20242B" stroke={ACCENT} strokeWidth="6" />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * 2 * Math.PI) / 5;
          return <circle key={i} cx={1150 + 70 * Math.cos(a)} cy={450 + 70 * Math.sin(a)} r="11" fill={ACCENT} />;
        })}
      </g>
      <path d="M 1450 120 A 420 420 0 0 1 1560 450 L 1480 450 A 340 340 0 0 0 1400 190 Z" fill={EMBER} opacity="0.85" />
    </>
  );
}

function Blueprint() {
  return (
    <>
      <rect width="1600" height="900" fill="#0b1a28" />
      {Array.from({ length: 33 }, (_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="900" stroke={ACCENT} strokeWidth="1" opacity={i % 4 ? 0.1 : 0.22} />
      ))}
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="1600" y2={i * 50} stroke={ACCENT} strokeWidth="1" opacity={i % 4 ? 0.1 : 0.22} />
      ))}
      <g fill="none" stroke={ACCENT} strokeWidth="4" opacity="0.9">
        <path d="M 250 640 L 420 640 L 480 560 L 760 560 L 860 460 L 1180 460 L 1280 560 L 1450 560 L 1450 640 L 1350 640" />
        <circle cx="560" cy="640" r="90" />
        <circle cx="560" cy="640" r="48" />
        <circle cx="1230" cy="640" r="90" />
        <circle cx="1230" cy="640" r="48" />
        <path d="M 760 560 L 860 460 M 1180 460 L 1280 560" />
        <path d="M 650 640 L 1140 640" strokeDasharray="14 12" />
      </g>
      <g stroke={EMBER} strokeWidth="3" opacity="0.9">
        <line x1="250" y1="720" x2="1450" y2="720" />
        <line x1="250" y1="705" x2="250" y2="735" />
        <line x1="1450" y1="705" x2="1450" y2="735" />
      </g>
    </>
  );
}

const SCENES: ReactNode[] = [<Road key="r" />, <Tachometer key="t" />, <Gears key="g" />, <BrakeDisc key="b" />, <Blueprint key="p" />];
const INTERVAL_MS = 6500;

export function HeroBackdrop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % SCENES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-asphalt">
      {SCENES.map((scene, i) => (
        <svg
          key={i}
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className={`absolute inset-0 h-full w-full transition-opacity duration-[1800ms] ease-in-out ${
            i === active ? "mmh-drift opacity-100" : "opacity-0"
          }`}
        >
          {scene}
        </svg>
      ))}
      {/* Velatura per la leggibilità del testo + sfumatura in basso verso il resto della pagina */}
      <div className="absolute inset-0 bg-gradient-to-r from-asphalt/95 via-asphalt/55 to-transparent" />
    </div>
  );
}
