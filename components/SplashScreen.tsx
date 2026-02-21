"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import packageJson from "../package.json";

export default function SplashScreen() {
    const [show, setShow] = useState(false);
    const [stage, setStage] = useState(0); // 0: Start, 1: Particles, 2: Waves, 3: Logo, 4: Final Logo, 5: FadeOut

    useEffect(() => {
        setShow(true);

        const timers = [
            setTimeout(() => setStage(1), 500),    // Start particles
            setTimeout(() => setStage(2), 2500),   // Show audio waves (headphone hint)
            setTimeout(() => setStage(3), 4500),   // Show main logo text/icon
            setTimeout(() => setStage(4), 6500),   // Show FINAL PNG LOGO clearly
            setTimeout(() => setStage(5), 9000),   // Start fade out
            setTimeout(() => setShow(false), 10000) // Complete
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
            {/* Ambient Purple Glow - Stronger */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage >= 1 ? 0.4 : 0 }}
                style={{
                    position: "absolute",
                    width: "80vw",
                    height: "80vh",
                    background: "radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)",
                    filter: "blur(80px)",
                }}
            />

            {/* Stage 1 & 2: Pink Particles - Larger and clearer */}
            <AnimatePresence>
                {stage >= 1 && stage < 5 && (
                    <div style={{ position: "absolute", inset: 0 }}>
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1.5, 0.5],
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: 6,
                                    height: 6,
                                    background: "#FD1581",
                                    borderRadius: "50%",
                                    boxShadow: "0 0 15px #FD1581",
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Stage 2 & 3: Audio Wave Beats */}
            <AnimatePresence>
                {stage === 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.6, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        style={{ position: "absolute", display: "flex", gap: 15, alignItems: "center" }}
                    >
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [20, 100, 20] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                style={{ width: 6, background: "#FD1581", borderRadius: 20, boxShadow: "0 0 10px #FD1581" }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 3 & 4: Logo Reveal */}
            <AnimatePresence>
                {stage >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{
                            opacity: stage === 5 ? 0 : 1,
                            scale: stage === 4 ? 1.4 : 1.1, // Enlarged Final Position
                        }}
                        transition={{
                            duration: 2,
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
                        {/* Stronger Neon Glow */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            style={{
                                position: "absolute",
                                width: 350,
                                height: 350,
                                background: "radial-gradient(circle, rgba(253, 21, 129, 0.35) 0%, transparent 70%)",
                                filter: "blur(50px)",
                                zIndex: -1
                            }}
                        />

                        {/* Logic to switch between SVG and PNG for final crispness */}
                        {stage === 3 ? (
                            <img
                                src="/images/logo-listenWithMe.svg"
                                alt="ListenWithMe Loading"
                                style={{
                                    width: 320,
                                    height: "auto",
                                    filter: "drop-shadow(0 0 20px rgba(253, 21, 129, 0.4))"
                                }}
                            />
                        ) : (
                            <img
                                src="/images/logo-listenWithMe.png"
                                alt="ListenWithMe Final"
                                style={{
                                    width: 380,
                                    height: "auto",
                                    filter: "drop-shadow(0 0 25px rgba(253, 21, 129, 0.5))"
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Version Indicator Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: stage >= 1 ? 0.5 : 0, y: 0 }}
                style={{
                    position: "absolute",
                    bottom: 40,
                    color: "rgba(253, 21, 129, 0.8)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                }}
            >
                VERSION {packageJson.version}
            </motion.div>

            {/* Global Fade Out Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage === 5 ? 1 : 0 }}
                transition={{ duration: 1 }}
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
