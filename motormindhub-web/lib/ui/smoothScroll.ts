import type { MouseEvent } from "react";

/** Scorrimento fluido (ease-in-out) verso l'elemento con quell'id; con reduced-motion salta direttamente. */
export function smoothScrollTo(event: MouseEvent, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const end = target.getBoundingClientRect().top + window.scrollY - 16;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, end);
    return;
  }
  const start = window.scrollY;
  const distance = end - start;
  const duration = Math.min(1400, 700 + Math.abs(distance) * 0.4);
  const t0 = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
