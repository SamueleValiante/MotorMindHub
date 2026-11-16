"use client";

import { smoothScrollTo } from "@/lib/ui/smoothScroll";

/** Freccia a fine sezione: scorre in modo fluido fino alla sezione con id `to`. */
export function ScrollArrow({ to, label }: { to: string; label: string }) {
  return (
    <div className="mt-14 flex justify-center">
      <a
        href={`#${to}`}
        onClick={(e) => smoothScrollTo(e, to)}
        aria-label={label}
        className="mmh-float flex h-11 w-11 items-center justify-center rounded-full border border-paper/20 text-chrome"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
