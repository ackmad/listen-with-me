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
  title: "ListenWithMe | Barbie & Ken",
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

        {/* Night Sky — 3-Layer Parallax (only transform+opacity animated, zero repaint) */}
        <div className="night-sky-layer">
          <div className="night-nebula"></div>
          <div className="star-layer star-far"></div>
          <div className="star-layer star-mid"></div>
          <div className="star-layer star-near"></div>
          <div className="meteor" style={{ animationDelay: '10s', animationDuration: '7s', top: '-8%', left: '88%' }}></div>
          <div className="meteor" style={{ animationDelay: '18s', animationDuration: '9s', top: '-12%', left: '72%' }}></div>
          <div className="meteor" style={{ animationDelay: '27s', animationDuration: '11s', top: '-2%', left: '96%' }}></div>
        </div>

        <div className="main-content">
          <SplashScreen />
          {children}
          <VersionBadge />
        </div>
      </body>
    </html>
  );
}
