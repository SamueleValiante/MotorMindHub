"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Compare quando entra nel viewport (una volta sola), con la stessa animazione
 * d'ingresso del resto del sito (.mmh-rise in globals.css: stessa curva, durata
 * e risalita), così lo scroll della home e i cambi pagina parlano la stessa lingua.
 * `delay` in ms per sfalsare gli elementi di una griglia. Con prefers-reduced-motion
 * il contenuto è subito visibile.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
      className={`${shown ? "mmh-rise" : "opacity-0 motion-reduce:opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}
