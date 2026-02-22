"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import { LyricLine } from "@/lib/srtParser";

interface LyricsPanelProps {
    lyrics: LyricLine[] | null;
    activeIndex: number;
    autoScrollEnabled: boolean;
    setAutoScrollEnabled: (v: boolean) => void;
    isDarkMode: boolean;
    isMobile?: boolean;
    isDesktopInline?: boolean; // New prop for the 5-line inline layout
    isImmersive?: boolean; // New prop for larger/brighter immersive lyrics
}

export default function LyricsPanel({
    lyrics,
    activeIndex,
    autoScrollEnabled,
    setAutoScrollEnabled,
    isDarkMode,
    isMobile = false,
    isDesktopInline = false,
    isImmersive = false,
}: LyricsPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const manualScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Visual configurations
    const config = {
        light: {
            bg: isMobile ? "#FFF5F9" : "#FFF7FA",
            text: "#6B4B57",
            active: "#EC4899",
            highlight: "rgba(236, 72, 153, 0.08)",
        },
        dark: {
            bg: isMobile ? "#120A16" : "#140B18",
            text: "#BFAFC4",
            active: "#FF6EB5",
            highlight: "rgba(255, 110, 181, 0.12)",
        }
    };

    const theme = isDarkMode ? config.dark : config.light;

    useEffect(() => {
        if (!isDesktopInline && autoScrollEnabled && !isManualScrolling && activeIndex !== -1 && scrollRef.current) {
            const container = scrollRef.current;
            const lines = container.querySelectorAll('.lyric-line');
            const activeLine = lines[activeIndex] as HTMLElement;

            if (activeLine) {
                const targetScroll = activeLine.offsetTop - container.offsetHeight / 2 + activeLine.offsetHeight / 2;
                container.scrollTo({
                    top: targetScroll,
                    behavior: "smooth"
                });
            }
        }
    }, [activeIndex, autoScrollEnabled, isManualScrolling, isDesktopInline]);

    const handleScroll = () => {
        if (autoScrollEnabled && !isDesktopInline) {
            setIsManualScrolling(true);
            if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
            manualScrollTimeout.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 3000);
        }
    };

    if (!lyrics) {
        if (isDesktopInline) return null; // Don't show anything inline if no lyrics
        return (
            <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: theme.bg, color: theme.text, gap: 16, padding: 32, textAlign: "center",
                transition: "var(--theme-transition)",
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: "50%", background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8
                }}>
                    <MusicalNoteIcon style={{ width: 32, height: 32, opacity: 0.5 }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, opacity: 0.8, maxWidth: 240, lineHeight: 1.5 }}>
                    Lirik belum tersedia untuk lagu ini
                </p>
                <p style={{ fontSize: 12, opacity: 0.5, fontWeight: 500 }}>
                    Putar lagu lain yang memiliki file .srt
                </p>
            </div>
        );
    }

    // Special logic for Desktop Inline (only show 5 lines)
    if (isDesktopInline) {
        const linesToShow = [];
        // Line 1: Previous
        linesToShow.push(activeIndex > 0 ? lyrics[activeIndex - 1] : { text: "", start: 0, end: 0 });
        // Line 2: Active
        linesToShow.push(activeIndex >= 0 ? lyrics[activeIndex] : { text: "...", start: 0, end: 0 });
        // Lines 3, 4, 5: Next
        for (let i = 1; i <= 3; i++) {
            linesToShow.push(activeIndex + i < lyrics.length ? lyrics[activeIndex + i] : { text: "", start: 0, end: 0 });
        }

        return (
            <div style={{
                display: "flex", flexDirection: "column", gap: 12,
                width: "100%", maxWidth: 500, padding: "0 20px"
            }}>
                {linesToShow.map((line, i) => {
                    const isActive = i === 1; // Index 1 is the active line in this 5-line array
                    const isPrev = i === 0;
                    return (
                        <motion.div
                            key={`${activeIndex}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: isActive ? 1 : isPrev ? 0.3 : 0.4,
                                scale: isActive ? (isImmersive ? 1.15 : 1.05) : 1,
                                color: isActive ? (isImmersive ? "#FFFFFF" : theme.active) : theme.text,
                                x: isActive ? (isImmersive ? 20 : 10) : 0,
                                textShadow: isActive && isImmersive ? "0 0 20px rgba(255,255,255,0.4)" : "none"
                            }}
                            transition={{ duration: 0.4 }}
                            style={{
                                fontSize: isActive
                                    ? (isImmersive ? "2.6rem" : "1.4rem")
                                    : (isImmersive ? "1.4rem" : "1rem"),
                                fontWeight: isActive ? 900 : 600,
                                textAlign: "left",
                                filter: !isActive ? (isImmersive ? "blur(1px)" : "blur(0.5px)") : "none",
                                lineHeight: 1.3,
                                minHeight: "1.4em",
                                transition: "all 0.4s ease"
                            }}
                        >
                            {line.text}
                        </motion.div>
                    );
                })}
            </div>
        );
    }

    return (
        <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            background: theme.bg, overflow: "hidden",
            transition: "var(--theme-transition)",
            position: "relative"
        }}>
            {/* Header */}
            {!isMobile && (
                <div style={{
                    padding: "16px 24px",
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    display: "flex", alignItems: "center", gap: 10,
                    zIndex: 10, background: theme.bg
                }}>
                    <MusicalNoteIcon style={{ width: 18, height: 18, color: theme.active }} />
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: theme.text }}>
                        Lirik Lagu
                    </h3>
                </div>
            )}

            {/* Lyrics Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="lyrics-container"
                style={{
                    flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "40px 24px",
                    display: "flex", flexDirection: "column", gap: 4,
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                }}
            >
                {lyrics.map((line, i) => {
                    const isActive = i === activeIndex;

                    return (
                        <motion.div
                            key={i}
                            className="lyric-line"
                            initial={false}
                            animate={{
                                color: isActive ? theme.active : theme.text,
                                scale: isActive ? 1.08 : 1,
                                opacity: isActive ? 1 : 0.4,
                                background: isActive ? theme.highlight : "transparent",
                                filter: isActive ? "none" : "blur(0.2px)"
                            }}
                            transition={{ duration: 0.4 }}
                            style={{
                                padding: "16px 24px",
                                borderRadius: 20,
                                textAlign: "center",
                                cursor: "pointer",
                                fontSize: isActive ? (isMobile ? "1.5rem" : "1.8rem") : "1.1rem",
                                fontWeight: isActive ? 900 : 600,
                                lineHeight: 1.5,
                                position: "relative",
                            }}
                        >
                            {line.text}
                        </motion.div>
                    );
                })}
                <div style={{ minHeight: "60%" }} />
            </div>

            {/* Mobile Auto-scroll Toggle Overlay */}
            {isMobile && (
                <div style={{
                    position: "absolute", bottom: 20, right: 20, zIndex: 20,
                    display: "flex", gap: 8
                }}>
                    <button
                        onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                        style={{
                            padding: "8px 16px", borderRadius: 20, border: "none",
                            background: autoScrollEnabled ? theme.active : (isDarkMode ? "#2D1B36" : "#FEE2E2"),
                            color: autoScrollEnabled ? "#fff" : theme.text,
                            fontSize: 11, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            transition: "all 0.2s"
                        }}
                    >
                        Auto-scroll: {autoScrollEnabled ? "ON" : "OFF"}
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .lyrics-container::-webkit-scrollbar {
                    display: none;
                }
            ` }} />
        </div>
    );
}
