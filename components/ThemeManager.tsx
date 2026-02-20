"use client";
import { useEffect } from "react";

export default function ThemeManager() {
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
