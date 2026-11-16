"use client";

import { useEffect, useState } from "react";

/**
 * Sfondo della hero: le sei immagini in public/home in dissolvenza incrociata continua,
 * ognuna con una lenta deriva (zoom + spostamento) in direzione diversa. Le animazioni
 * girano sempre su tutte le slide, così la deriva non "scatta" quando una slide esce.
 */
const SLIDES = [
  { src: "/home/hero-1.webp", alt: "BMW M3 frontale", position: "50% 60%", drift: "mmh-drift-a" },
  { src: "/home/hero-2.webp", alt: "Alfa Romeo Giulia", position: "50% 55%", drift: "mmh-drift-b" },
  { src: "/home/hero-3.webp", alt: "Alfa Romeo 156 Sportwagon", position: "50% 55%", drift: "mmh-drift-c" },
  { src: "/home/hero-4.webp", alt: "Lamborghini", position: "50% 60%", drift: "mmh-drift-a" },
  { src: "/home/hero-5.webp", alt: "Audi RS6", position: "50% 55%", drift: "mmh-drift-b" },
  { src: "/home/hero-6.webp", alt: "Vano motore turbo", position: "50% 50%", drift: "mmh-drift-c" },
];
const INTERVAL_MS = 6000;

export function HeroBackdrop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-asphalt">
      {/* Su desktop le immagini occupano il 72% di destra (proporzione quasi nativa: nessun ingrandimento
          forzato) e sfumano verso sinistra sotto il testo; su mobile coprono tutto lo sfondo. */}
      <div className="absolute inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent,black_38%)] lg:w-[72%]">
        {SLIDES.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- immagini statiche già ottimizzate (webp) in public/
          <img
            key={slide.src}
            src={slide.src}
            alt=""
            loading="eager"
            decoding="async"
            style={{ objectPosition: slide.position }}
            className={`absolute inset-0 h-full w-full object-cover brightness-[0.6] saturate-90 transition-opacity duration-[1600ms] ease-in-out ${slide.drift} ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-asphalt/90 via-asphalt/40 to-asphalt/20" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-asphalt/60 to-transparent" />
    </div>
  );
}
