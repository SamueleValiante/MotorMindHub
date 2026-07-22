type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Gestione Autori (mockup 29/30/34): nessuna icona "persone" esisteva ancora nel design system. */
export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c1.2-3.2 3.5-5 6-5s4.8 1.8 6 5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 12.2c1.9.3 3.4 1.7 4.5 4.3" />
    </svg>
  );
}
