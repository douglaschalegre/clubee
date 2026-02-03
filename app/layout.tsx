import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/header";

import "./globals.css";

const APP_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Clubee",
  description: "Crie e gerencie clubes com assinaturas pagas.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Clubee",
    title: "Clubee",
    description: "Crie e gerencie clubes com assinaturas pagas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clubee",
    description: "Crie e gerencie clubes com assinaturas pagas.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Fonts: Sora (display) + Manrope (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
      </body>
    </html>
  );
}
