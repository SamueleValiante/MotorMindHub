interface AvatarProps {
  nome: string;
  cognome: string;
  fotoProfilo?: string | null;
  className?: string;
}

/** Nessun upload foto profilo supportato lato backend: fallback a iniziali, non un placeholder finto. */
export function Avatar({ nome, cognome, fotoProfilo, className }: AvatarProps) {
  const size = className ?? "h-16 w-16";

  if (fotoProfilo) {
    // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'utente, non ottimizzabile da next/image senza un dominio remoto configurato
    return (
      <img
        src={fotoProfilo}
        alt={`${nome} ${cognome}`}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initials = `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-surface-raised font-heading font-bold text-amber`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
