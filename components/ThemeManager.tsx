"use client";
import { useEffect } from "react";

/**
 * Automatically applies the correct visual theme based on current local time.
 * Runs on every page load and updates every minute.
 *
 * Time ranges (local time):
 *   05:00 – 10:59  → morning
 *   11:00 – 14:59  → afternoon
 *   15:00 – 18:59  → evening
 *   19:00 – 04:59  → night
 */
function getThemeForHour(hour: number): string {
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 15) return "afternoon";
    if (hour >= 15 && hour < 19) return "evening";
    return "night"; // 19:00 – 04:59
}

export default function ThemeManager() {
    useEffect(() => {
        const applyTheme = () => {
            const hour = new Date().getHours();
            const theme = getThemeForHour(hour);
            document.documentElement.setAttribute("data-theme", theme);
        };

        // Apply immediately on page load / refresh
        applyTheme();

        // Re-check every 60 seconds in case hour rolls over while on the page
        const interval = setInterval(applyTheme, 60_000);
        return () => clearInterval(interval);
    }, []);

    return null;
}
