import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import React from "react";
import ThemeManager from "@/components/ThemeManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ListenWithMe | Sync & Vibe",
  description: "Share music in real-time. Personal vibe space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${fredoka.variable} antialiased selection:bg-[#FF0099] selection:text-white`}
      >
        <ThemeManager />
        {children}
      </body>
    </html>
  );
}
