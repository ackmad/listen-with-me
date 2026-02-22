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

        {/* Night Sky Global Wrapper */}
        <div className="night-sky-layer">
          <div className="twinkling-stars twinkle-1"></div>
          <div className="twinkling-stars twinkle-2"></div>
          <div className="twinkling-stars twinkle-3"></div>
          <div className="meteor" style={{ animationDelay: '5s', animationDuration: '6s', top: '-10%', left: '70%' }}></div>
          <div className="meteor" style={{ animationDelay: '12s', animationDuration: '8s', top: '0%', left: '85%' }}></div>
          <div className="meteor" style={{ animationDelay: '20s', animationDuration: '10s', top: '-5%', left: '95%' }}></div>
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
