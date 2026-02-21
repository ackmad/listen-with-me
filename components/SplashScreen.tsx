"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
        // Auto hide after video duration or reasonable time
        // Assuming video is around 3-5 seconds
        const timer = setTimeout(() => {
            handleFinish();
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    const handleFinish = () => {
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                    }}
                >
                    {/* Dark Background with Sparkles for Mobile */}
                    <div className="sparkle-container">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="sparkle" style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                transform: `scale(${0.5 + Math.random()})`
                            }} />
                        ))}
                    </div>

                    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <video
                            src="/videos/splashscreen.mp4"
                            autoPlay
                            muted
                            playsInline
                            onEnded={handleFinish}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                zIndex: 2
                            }}
                        />
                    </div>

                    <style jsx>{`
                        .sparkle-container {
                            position: absolute;
                            inset: 0;
                            display: none;
                        }
                        @media (max-width: 768px) {
                            .sparkle-container {
                                display: block;
                            }
                        }
                        .sparkle {
                            position: absolute;
                            width: 4px;
                            height: 4px;
                            background: white;
                            border-radius: 50%;
                            filter: blur(1px);
                            opacity: 0;
                            box-shadow: 0 0 10px white, 0 0 20px #FF0099;
                            animation: sparkleAnim 4s infinite linear;
                        }
                        @keyframes sparkleAnim {
                            0% { transform: scale(0) rotate(0deg); opacity: 0; }
                            50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
                            100% { transform: scale(0) rotate(360deg); opacity: 0; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
