import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import React, { useEffect } from "react";

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

function ThemeManager() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      // Light Mode: 04.00 – 18.00
      const isLight = hour >= 4 && hour < 18;

      if (isLight) {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      } else {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      }
    };

    updateTheme();
    // Check every minute if the theme needs to change
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

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
