import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Realtime Collab (v1)",
  description: "Starter for a realtime collaboration app (Step 1)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
