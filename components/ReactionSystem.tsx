"use client";
import React, { useEffect, useState } from 'react';
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

export default function ReactionSystem({ roomId, userId }: { roomId: string; userId: string }) {
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
                    const newReaction: ReactionItem = {
                        id: change.doc.id,
                        emoji: data.emoji,
                        userId: data.userId,
                        createdAt: data.createdAt,
                        startX: Math.random() * 40 - 20,
                        duration: 2 + Math.random() * 2,
                    };

                    const now = Date.now();
                    const reactionTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

                    if (now - reactionTime < 5000) {
                        setReactions(prev => [...prev, newReaction]);
                    }
                }
            });
        }, (err) => {
            console.warn("Reactions listener:", err.message);
        });

        return () => unsubscribe();
    }, [roomId]);

    // Auto-cleanup
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setReactions(prev => prev.filter(r => {
                const reactionTime = r.createdAt?.toMillis ? r.createdAt.toMillis() : now;
                return now - reactionTime < 4000;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const sendReaction = async (emoji: string) => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
                emoji,
                userId,
                createdAt: serverTimestamp(),
            });
        } catch (error: any) {
            console.warn("Reaction failed:", error.message);
        }
    };

    return (
        <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 50, pointerEvents: "none",
            display: "flex", justifyContent: "center", paddingBottom: 32,
        }}>
            {/* Floating reactions overlay */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <AnimatePresence>
                    {reactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{
                                opacity: 0,
                                scale: 0.5,
                                y: "100vh",
                                x: `${50 + (reaction.startX || 0)}vw`,
                            }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0.5, 1.5, 2, 2.5],
                                y: "-20vh",
                                x: `${50 + (reaction.startX || 0) + (Math.random() * 20 - 10)}vw`,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reaction.duration || 3, ease: "easeOut" }}
                            style={{
                                position: "absolute", bottom: 0, fontSize: 56,
                                filter: "drop-shadow(0 0 10px rgba(255,0,153,0.5))",
                                pointerEvents: "none",
                            }}
                        >
                            {reaction.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Reaction Buttons */}
            <div style={{
                pointerEvents: "auto",
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 16px",
                background: "rgba(10,5,8,0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,153,0.1)",
                transform: "translateY(0)",
                transition: "transform 0.3s ease",
            }}>
                {REACTIONS.map((r) => (
                    <motion.button
                        key={r.label}
                        whileHover={{ scale: 1.25, y: -6 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => sendReaction(r.emoji)}
                        title={r.label}
                        style={{
                            width: 44, height: 44,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, border: "none", cursor: "pointer",
                            background: "transparent", borderRadius: "50%",
                            transition: "background 0.2s",
                            position: "relative",
                        }}
                        onMouseEnter={(e: any) => e.currentTarget.style.background = "rgba(255,0,153,0.15)"}
                        onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}
                    >
                        {r.emoji}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
