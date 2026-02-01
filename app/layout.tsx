import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Clubee",
  description: "Create and manage paid clubs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
