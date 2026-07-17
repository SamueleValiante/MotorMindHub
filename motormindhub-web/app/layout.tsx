import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastViewport } from "@/components/toast/ToastViewport";
import { CookieBanner } from "@/components/cookie-consent/CookieBanner";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
      </body>
    </html>
  );
}
