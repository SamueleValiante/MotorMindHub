import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastViewport } from "@/components/toast/ToastViewport";
import { CookieBanner } from "@/components/cookie-consent/CookieBanner";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ReportUserModal } from "@/components/report/ReportUserModal";
import "./globals.css";

/**
 * File locali (next/font/local) invece di next/font/google: il build Vercel
 * dipendeva dal fetch di fonts.gstatic.com al momento del build (Turbopack),
 * fallito due volte in una notte (prima Inter, poi Oswald con lo stesso
 * sintomo, un redeploy senza cache non è bastato la seconda volta — non era
 * transitorio). Solo i pesi realmente usati in questo progetto (verificato:
 * font-bold/font-semibold/default sono le uniche varianti applicate ovunque
 * nel codice, cfr. grep su font-heading/font-body/font-mono), niente 300/500
 * mai referenziati nonostante fossero nell'array weight originale.
 */
const oswald = localFont({
  variable: "--font-oswald",
  display: "swap",
  src: [
    { path: "./fonts/oswald-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/oswald-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/oswald-700.woff2", weight: "700", style: "normal" },
  ],
});

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  display: "swap",
  src: [
    { path: "./fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "MotorMindHub",
  description: "Il tuo hub tecnico automotive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${oswald.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-asphalt text-paper font-body">
        <AuthProvider>{children}</AuthProvider>
        <ToastViewport />
        <CookieBanner />
        <PageViewTracker />
        <ReportUserModal />
      </body>
    </html>
  );
}
