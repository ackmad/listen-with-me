"use client";
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = [
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💕', label: 'Love' },
    { emoji: '✨', label: 'Sparkle' },
    { emoji: '💃', label: 'Dance' },
    { emoji: '😵‍💫', label: 'Vibe' },
];

interface ReactionItem {
    id: string;
    emoji: string;
    userId: string;
    createdAt: any;
    startX: number;
    duration: number;
}

interface Props {
    roomId: string;
    userId: string;
    // How much bottom offset to apply (e.g. for mobile tab bar clearance)
    bottomOffset?: number;
}

export default function ReactionSystem({ roomId, userId, bottomOffset = 0 }: Props) {
    const [reactions, setReactions] = useState<ReactionItem[]>([]);

    useEffect(() => {
        if (!roomId) return;
        const q = query(
            collection(db, 'rooms', roomId, 'reactions'),
            orderBy('createdAt', 'desc'),
            limit(15)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const now = Date.now();
                    const reactionTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
                    if (now - reactionTime < 5000) {
                        setReactions(prev => [...prev, {
                            id: change.doc.id,
                            emoji: data.emoji,
                            userId: data.userId,
                            createdAt: data.createdAt,
                            startX: Math.random() * 40 - 20,
                            duration: 2 + Math.random() * 2,
                        }]);
                    }
                }
            });
        }, (err) => console.warn("Reactions listener:", err.message));
        return () => unsubscribe();
    }, [roomId]);

    // Auto-cleanup floating reactions
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setReactions(prev => prev.filter(r => {
                const t = r.createdAt?.toMillis ? r.createdAt.toMillis() : now;
                return now - t < 4000;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const sendReaction = async (emoji: string) => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
                emoji, userId, createdAt: serverTimestamp(),
            });
        } catch (error: any) {
            console.warn("Reaction failed:", error.message);
        }
    };

    // bottom of the pill: above tab bar on mobile, near bottom on desktop
    const pillBottom = bottomOffset + 12;

    return (
        <>
            {/* Floating reactions overlay — full screen, behind everything */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 40 }}>
                <AnimatePresence>
                    {reactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{ opacity: 0, scale: 0.5, y: "100vh", x: `${50 + (reaction.startX || 0)}vw` }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0.5, 1.5, 2, 2.5],
                                y: "-20vh",
                                x: `${50 + (reaction.startX || 0) + (Math.random() * 20 - 10)}vw`,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reaction.duration || 3, ease: "easeOut" }}
                            style={{
                                position: "absolute", bottom: 0, fontSize: 48,
                                filter: "drop-shadow(0 0 10px rgba(255,0,153,0.5))",
                                pointerEvents: "none",
                            }}
                        >
                            {reaction.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Reaction pill — positioned ABOVE mobile tab bar */}
            <div style={{
                position: "fixed",
                bottom: pillBottom,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 45,
                pointerEvents: "auto",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 12px",
                    background: "rgba(10,5,8,0.88)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 999,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,153,0.08)",
                }}>
                    {REACTIONS.map((r) => (
                        <motion.button
                            key={r.label}
                            whileHover={{ scale: 1.3, y: -5 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => sendReaction(r.emoji)}
                            title={r.label}
                            style={{
                                width: 40, height: 40,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20, border: "none", cursor: "pointer",
                                background: "transparent", borderRadius: "50%",
                            }}
                            onMouseEnter={(e: any) => e.currentTarget.style.background = "rgba(255,0,153,0.15)"}
                            onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}
                        >
                            {r.emoji}
                        </motion.button>
                    ))}
                </div>
            </div>
        </>
    );
}
