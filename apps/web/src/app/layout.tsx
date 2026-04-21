import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flight Tracker",
  description: "Monitor live aircraft positions worldwide with Supabase Realtime and OpenSky.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

