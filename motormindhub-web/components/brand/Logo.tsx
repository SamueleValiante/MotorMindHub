import Image from "next/image";

interface LogoProps {
  className?: string;
}

/**
 * Stemma unico (icona + wordmark integrati nel PNG): sostituisce la
 * precedente coppia icona SVG + <span>"MotorMindHub"</span> separati.
 * "MotorMindHub" non è più testo reale nella pagina — alt sull'<Image>
 * resta l'unico modo per uno screen reader di conoscere il nome del sito,
 * per questo non è opzionale/omissibile qui.
 *
 * Dimensione di default pensata per contesti a barra compatta (header
 * pubblico, footer, layout auth, topbar mobile delle sidebar): i blocchi
 * sidebar desktop, che ospitano il logo da solo con più spazio verticale,
 * passano una className più grande dal chiamante.
 */
export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="MotorMindHub"
      width={322}
      height={322}
      className={className ?? "h-10 w-10"}
    />
  );
}
