import type { ReactNode } from "react";
import { Header } from "@/components/header";

import "./globals.css";

export const metadata = {
  title: "Clubee",
  description: "Create and manage paid clubs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
