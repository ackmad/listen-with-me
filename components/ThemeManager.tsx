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
        <button
            onClick={toggleTheme}
            title="Ssst! Ini Rahasia..."
            style={{
                position: "fixed",
                bottom: "-30px",
                left: "-30px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(255, 69, 58, 0.15)", // Subtle "Liquid Glass" red spot
                border: "1px solid rgba(255, 255, 255, 0.05)",
                cursor: "pointer",
                zIndex: 999999, // Above everything
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                outline: "none",
                backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 69, 58, 0.4)";
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.bottom = "-20px";
                e.currentTarget.style.left = "-20px";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 69, 58, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.bottom = "-30px";
                e.currentTarget.style.left = "-30px";
            }}
        >
            <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                position: "absolute", top: "35%", right: "35%"
            }} />
        </button>
    );
}
