"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
    const [show, setShow] = useState(false);
    const [stage, setStage] = useState(0); // 0: Start, 1: Particles, 2: Waves, 3: Logo, 4: FadeOut

    useEffect(() => {
        setShow(true);

        const timers = [
            setTimeout(() => setStage(1), 500),   // Start particles
            setTimeout(() => setStage(2), 2000),  // Show audio waves
            setTimeout(() => setStage(3), 3500),  // Show logo
            setTimeout(() => setStage(4), 6000),  // Start fade out
            setTimeout(() => setShow(false), 7000) // Complete
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    if (!show) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            fontFamily: "var(--font-fredoka), sans-serif",
        }}>
            {/* Subtle Purple Glow */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage >= 1 ? 0.3 : 0 }}
                style={{
                    position: "absolute",
                    width: "60vw",
                    height: "60vh",
                    background: "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)",
                    filter: "blur(60px)",
                }}
            />

            {/* Stage 1 & 2: Pink Particles */}
            <AnimatePresence>
                {stage >= 1 && stage < 4 && (
                    <div style={{ position: "absolute", inset: 0 }}>
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 0.6, 0],
                                    scale: [0, 1, 0.5],
                                    x: (Math.random() - 0.5) * 200,
                                    y: (Math.random() - 0.5) * 200,
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: 4,
                                    height: 4,
                                    background: "#FD1581",
                                    borderRadius: "50%",
                                    boxShadow: "0 0 10px #FD1581",
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Stage 2: Gentle Audio Wave Lines (Headphone Hint) */}
            <AnimatePresence>
                {stage === 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        style={{ position: "absolute", display: "flex", gap: 10, alignItems: "center" }}
                    >
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [10, 40, 10] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                style={{ width: 3, background: "#FD1581", borderRadius: 10 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 3: Logo Appearance */}
            <AnimatePresence>
                {stage >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                            opacity: stage === 4 ? 0 : 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        style={{
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                    >
                        {/* Neon Glow beneath logo */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{
                                position: "absolute",
                                width: 200,
                                height: 200,
                                background: "radial-gradient(circle, rgba(253, 21, 129, 0.2) 0%, transparent 70%)",
                                filter: "blur(40px)",
                                zIndex: -1
                            }}
                        />

                        <img
                            src="/images/logo-listenWithMe.svg"
                            alt="ListenWithMe Logo"
                            style={{
                                width: 180,
                                height: "auto",
                                filter: "drop-shadow(0 0 15px rgba(253, 21, 129, 0.3))"
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Fade Out Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage === 4 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "#000",
                    pointerEvents: "none",
                    zIndex: 100
                }}
            />
        </div>
    );
}
