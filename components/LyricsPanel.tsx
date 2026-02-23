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
                const containerHeight = container.offsetHeight;
                const activeLineHeight = activeLine.offsetHeight;
                const activeLineOffset = activeLine.offsetTop;

                // Center the active line perfectly in the middle of the container
                const targetScroll = activeLineOffset - (containerHeight / 2) + (activeLineHeight / 2);

                container.scrollTo({
                    top: targetScroll,
                    behavior: "smooth"
                });
            }
        }
    }, [activeIndex, autoScrollEnabled, isManualScrolling, isDesktopInline, lyrics]);

    const handleScroll = () => {
        if (autoScrollEnabled && !isDesktopInline) {
            setIsManualScrolling(true);
            if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
            manualScrollTimeout.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 3000);
        }
    };

    if (!lyrics || lyrics.length === 0) {
        if (isDesktopInline) return null;
        return (
            <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: theme.bg, color: theme.text, gap: 16, padding: 32, textAlign: "center",
                transition: "var(--theme-transition)",
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: "50%", background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8
                }}>
                    <MusicalNoteIcon style={{ width: 36, height: 36, opacity: 0.5 }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, opacity: 0.9, maxWidth: 300, lineHeight: 1.4, margin: 0, fontFamily: "var(--font-fredoka)" }}>
                    Lirik belum tersedia untuk lagu ini
                </p>
                <p style={{ fontSize: 13, opacity: 0.5, fontWeight: 500 }}>
                    Putar lagu lain yang memiliki file .srt
                </p>
            </div>
        );
    }

    // Special logic for Desktop Inline (only show 5 lines centered)
    if (isDesktopInline) {
        const linesToShow = [];
        // Lines 1, 2: Previous
        linesToShow.push(activeIndex > 1 ? lyrics[activeIndex - 2] : { text: "", start: 0, end: 0 });
        linesToShow.push(activeIndex > 0 ? lyrics[activeIndex - 1] : { text: "", start: 0, end: 0 });
        // Line 3: Active
        linesToShow.push(activeIndex >= 0 ? lyrics[activeIndex] : { text: "...", start: 0, end: 0 });
        // Lines 4, 5: Next
        for (let i = 1; i <= 2; i++) {
            linesToShow.push(activeIndex + i < lyrics.length ? lyrics[activeIndex + i] : { text: "", start: 0, end: 0 });
        }

        return (
            <div style={{
                display: "flex", flexDirection: "column", gap: 12,
                width: "100%", maxWidth: 600, padding: "0 20px"
            }}>
                {linesToShow.map((line, i) => {
                    const isActive = i === 2; // Middle line is active
                    const isFocus = i >= 1 && i <= 3;
                    return (
                        <motion.div
                            key={`${activeIndex}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: isActive ? 1 : isFocus ? 0.35 : 0.2,
                                scale: isActive ? (isImmersive ? 1.25 : 1.1) : 1,
                                color: isActive ? (isImmersive ? "#FFFFFF" : theme.active) : theme.text,
                                textShadow: isActive ? (isImmersive ? "0 0 25px rgba(255,255,255,0.5)" : `0 0 15px ${theme.active}44`) : "none"
                            }}
                            transition={{ duration: 0.4 }}
                            style={{
                                fontSize: isActive
                                    ? (isImmersive ? "2.6rem" : "1.8rem")
                                    : (isImmersive ? "1.4rem" : "1.2rem"),
                                fontWeight: isActive ? 900 : 700,
                                textAlign: "center",
                                filter: !isActive ? (isImmersive ? "blur(1.5px)" : "blur(0.5px)") : "none",
                                lineHeight: 1.35,
                                minHeight: "1.6em",
                                transition: "all 0.4s ease",
                                willChange: "transform, opacity"
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
                    flex: 1, overflowY: "auto", padding: isMobile ? "40px 20px" : "80px 24px",
                    display: "flex", flexDirection: "column", gap: 8,
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                }}
            >
                <div style={{ minHeight: "40%" }} />
                {lyrics.map((line, i) => {
                    const isActive = i === activeIndex;

                    return (
                        <motion.div
                            key={i}
                            className="lyric-line"
                            initial={false}
                            animate={{
                                color: isActive ? theme.active : theme.text,
                                scale: isActive ? 1.12 : 1,
                                opacity: isActive ? 1 : 0.35,
                                textShadow: isActive ? `0 0 15px ${theme.active}44` : "none",
                                filter: isActive ? "none" : "blur(0.5px)"
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{
                                padding: "12px 24px",
                                borderRadius: 20,
                                textAlign: "center",
                                cursor: "pointer",
                                fontSize: isActive ? (isMobile ? "1.8rem" : "2.2rem") : (isMobile ? "1.2rem" : "1.4rem"),
                                fontWeight: isActive ? 900 : 700,
                                lineHeight: 1.4,
                                position: "relative",
                                width: "100%",
                                willChange: "transform, opacity"
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
