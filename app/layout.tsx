import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { getAppBaseUrl } from "@/lib/urls";

import "./globals.css";

const APP_URL = getAppBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Clubee",
  description: "Crie clubes e publique eventos pagos ou gratuitos com RSVP.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Clubee",
    title: "Clubee",
    description: "Crie clubes e publique eventos pagos ou gratuitos com RSVP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clubee",
    description: "Crie clubes e publique eventos pagos ou gratuitos com RSVP.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Fonts: Sora (display) + Manrope (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Toaster richColors />
      </body>
    </html>
  );
}
