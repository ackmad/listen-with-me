import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import React from "react";
import ThemeManager from "@/components/ThemeManager";
import SplashScreen from "@/components/SplashScreen";
import VersionBadge from "@/components/VersionBadge";

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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/images/logo-listenWithMe.png",
  },
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
        <SplashScreen />
        {children}
        <VersionBadge />
      </body>
    </html>
  );
}
