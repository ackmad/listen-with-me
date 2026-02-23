"use client";
import { useEffect, useState } from "react";

/**
 * Automatically applies the correct visual theme based on current local time.
 */
const themes = ["morning", "afternoon", "evening", "night"];
const themeIcons: Record<string, string> = {
    morning: "🌅",
    afternoon: "☀️",
    evening: "🌆",
    night: "🌙"
};

function getThemeForHour(hour: number): string {
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 15) return "afternoon";
    if (hour >= 15 && hour < 18) return "evening";
    return "night";
}

export default function ThemeManager() {
    const [currentTheme, setCurrentTheme] = useState<string>("");
    const [isManual, setIsManual] = useState(false);

    useEffect(() => {
        if (isManual) return;

        const applyTheme = () => {
            const hour = new Date().getHours();
            const theme = getThemeForHour(hour);
            setTheme(theme);
        };

        applyTheme();
        const interval = setInterval(applyTheme, 60_000);
        return () => clearInterval(interval);
    }, [isManual]);

    const setTheme = (theme: string) => {
        setCurrentTheme(theme);
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "night") {
            document.documentElement.classList.add("dark");
            document.body.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
            document.body.classList.remove("dark");
        }
    };

    const toggleTheme = () => {
        setIsManual(true);
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <div style={{
            position: "fixed", top: 16, right: 80, zIndex: 99999,
            display: "flex", alignItems: "center", gap: 8
        }}>
            <button
                onClick={toggleTheme}
                title="Toggle Theme (Dev)"
                style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--bg-card)", border: "1.5px solid var(--border-soft)",
                    boxShadow: "var(--shadow-soft)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, transition: "all 0.3s ease"
                }}
            >
                {themeIcons[currentTheme] || "🌓"}
            </button>
        </div>
    );
}
