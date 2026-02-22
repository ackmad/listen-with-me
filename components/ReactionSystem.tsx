"use client";
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSmileIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
    startY: number;
    delay: number;
    duration: number;
    size: number;
}

interface MessageItem {
    id: string;
    text: string;
    userId: string;
    createdAt: any;
    startX: number;
    color: string;
}

// ─── Helper: Unique Color for User ──────────────────────────────────────────
const USER_COLORS = [
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
];

const getUserColor = (uid: string) => {
    if (!uid) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export interface Props {
    roomId: string;
    userId: string;
}

export default function ReactionSystem({ roomId, userId }: Props) {
    const [reactions, setReactions] = useState<ReactionItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [isSendingMsg, setIsSendingMsg] = useState(false);

    // ─── Listeners ───
    useEffect(() => {
        if (!roomId) return;

        const qR = query(collection(db, 'rooms', roomId, 'reactions'), orderBy('createdAt', 'desc'), limit(5));
        const unsubR = onSnapshot(qR, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const now = Date.now();
                    const rTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

                    if (now - rTime < 4000) {
                        const burst: ReactionItem[] = Array.from({ length: 8 }).map((_, i) => {
                            const type = Math.random();
                            let x = 50;
                            let y = 110;
                            if (type < 0.25) { x = -10; y = Math.random() * 80 + 20; }
                            else if (type < 0.5) { x = 110; y = Math.random() * 80 + 20; }
                            else { x = Math.random() * 80 + 10; y = 110; }

                            return {
                                id: `${change.doc.id}-${i}`,
                                emoji: data.emoji,
                                userId: data.userId,
                                createdAt: data.createdAt,
                                startX: x,
                                startY: y,
                                delay: Math.random() * 0.4,
                                duration: 2.5 + Math.random() * 2,
                                size: 28 + Math.random() * 32,
                            };
                        });
                        setReactions(prev => [...prev, ...burst]);
                    }
                }
            });
        });

        const qM = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'desc'), limit(5));
        const unsubM = onSnapshot(qM, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const now = Date.now();
                    const mTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

                    if (now - mTime < 5000) {
                        const burstMsg: MessageItem[] = Array.from({ length: 8 }).map((_, i) => ({
                            id: `${change.doc.id}-${i}`,
                            text: data.text,
                            userId: data.userId,
                            createdAt: data.createdAt,
                            startX: 10 + Math.random() * 80, // Better horizontal distribution (10-90vw)
                            color: getUserColor(data.userId),
                        }));
                        setMessages(prev => [...prev, ...burstMsg]);
                    }
                }
            });
        });

        return () => { unsubR(); unsubM(); };
    }, [roomId]);

    // ─── Cleanup ───
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setReactions(prev => prev.filter(r => {
                const t = r.createdAt?.toMillis ? r.createdAt.toMillis() : now;
                return now - t < 5000;
            }));
            setMessages(prev => prev.filter(m => {
                const t = m.createdAt?.toMillis ? m.createdAt.toMillis() : now;
                return now - t < 12000; // Longer cleanup for slower animation
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // ─── Actions ───
    const sendReaction = async (emoji: string) => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
                emoji, userId, createdAt: serverTimestamp(),
            });
            setShowMenu(false);
        } catch (e: any) { console.warn("Reaction Error:", e.message); }
    };

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userId || !msgInput.trim() || isSendingMsg) return;
        setIsSendingMsg(true);
        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: msgInput.trim(), userId, createdAt: serverTimestamp(),
            });
            setMsgInput("");
        } catch (e: any) { console.warn("Message Error:", e.message); }
        finally { setIsSendingMsg(false); }
    };

    return (
        <>
            {/* ─── Floating Overlays (Full Screen) ─── */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100 }}>
                {/* Emojis Burst */}
                <AnimatePresence>
                    {reactions.map((r) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.2, y: `${r.startY}vh`, x: `${r.startX}vw` }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0.2, 1, 1.2, 0.8],
                                y: "-20vh",
                                x: `${r.startX + (r.startX < 0 ? 30 : r.startX > 100 ? -30 : Math.random() * 40 - 20)}vw`,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: r.duration, delay: r.delay, ease: "easeOut" }}
                            style={{ position: "absolute", fontSize: r.size, filter: "drop-shadow(0 0 10px rgba(255,0,153,0.3))" }}
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Messages Float — SMOOTH & COLORFUL */}
                <AnimatePresence>
                    {messages.map((m, idx) => (
                        <motion.div
                            key={m.id}
                            initial={{
                                opacity: 0,
                                scale: 0.5,
                                y: "110vh",
                                x: `${m.startX}vw`,
                                rotate: Math.random() * 20 - 10
                            }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: "-30vh",
                                x: `${m.startX + (Math.random() * 20 - 10)}vw`, // Gentle horizontal drift
                                scale: [0.5, 1, 1, 0.7],
                                rotate: Math.random() * 30 - 15,
                            }}
                            transition={{
                                duration: 8 + Math.random() * 4, // Very slow float (8-12 seconds)
                                ease: "linear", // Move at constant speed to hide "lag"
                                delay: (idx % 8) * 0.2
                            }}
                            style={{
                                position: "absolute",
                                background: m.color,
                                backdropFilter: "blur(10px)",
                                border: "2px solid rgba(255,255,255,0.8)",
                                borderRadius: "20px 20px 4px 20px",
                                padding: "10px 18px",
                                color: "#fff",
                                fontSize: 18, // Smaller for better fit
                                fontWeight: 800,
                                fontFamily: "var(--font-fredoka), cursive",
                                maxWidth: 260,
                                boxShadow: `0 10px 30px rgba(0,0,0,0.2), 0 0 15px ${m.color}66`,
                                pointerEvents: "none",
                                textAlign: "center",
                                letterSpacing: "-0.01em",
                                whiteSpace: "normal", // Allow wrapping for long messages
                                zIndex: 10,
                            }}
                        >
                            {m.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ─── Message Input (Top-Left Area) ─── */}
            <div className="message-input-area" style={{
                position: "fixed", top: 80, left: 16, zIndex: 1000, // Very high z-index
                width: "calc(100% - 80px)", maxWidth: 420, // Diperbesar
                pointerEvents: "auto", // Crucial for clickability
            }}>
                <form onSubmit={sendMessage} style={{ position: "relative", pointerEvents: "auto" }}>
                    <input
                        type="text"
                        placeholder="Kirim pesan singkat..."
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value.slice(0, 50))}
                        style={{
                            width: "100%", padding: "16px 54px 16px 24px",
                            background: "var(--app-surface)", backdropFilter: "blur(20px)",
                            border: "2px solid var(--app-border)",
                            borderRadius: 28, color: "var(--app-text)", fontSize: 16,
                            fontFamily: "var(--font-fredoka), sans-serif", fontWeight: 600,
                            outline: "none",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                            transition: "var(--theme-transition)",
                            pointerEvents: "auto",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "var(--app-primary)";
                            e.target.style.boxShadow = "0 0 0 4px var(--app-soft-accent)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "var(--app-border)";
                            e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!msgInput.trim() || isSendingMsg}
                        style={{
                            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                            width: 36, height: 36, borderRadius: "50%",
                            background: msgInput.trim() ? "var(--app-primary)" : "var(--app-border)",
                            border: "none", color: "#fff", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: msgInput.trim() ? 1 : 0.6,
                            transition: "all 0.3s ease",
                            pointerEvents: "auto",
                        }}
                    >
                        <PaperAirplaneIcon style={{ width: 18, height: 18, marginLeft: -2 }} />
                    </button>
                </form>
            </div>

            {/* ─── Reaction Trigger (Top-Right Area) ─── */}
            <div className="reaction-trigger-area" style={{
                position: "fixed", top: 80, right: 16, zIndex: 1000,
                pointerEvents: "auto",
            }}>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "auto" }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMenu(!showMenu)}
                        className="reaction-toggle-btn"
                        style={{
                            width: 48, height: 48, borderRadius: "50%",
                            color: showMenu ? "var(--app-primary)" : "var(--app-text-muted)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "var(--theme-transition)",
                            pointerEvents: "auto",
                        }}
                    >
                        {showMenu ? <XMarkIcon style={{ width: 28, height: 28 }} /> : <FaceSmileIcon style={{ width: 28, height: 28 }} />}
                    </motion.button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="reaction-menu-popup"
                                style={{
                                    position: "absolute", right: 0,
                                    background: "var(--app-surface)", backdropFilter: "blur(24px)",
                                    border: "2px solid var(--app-border)",
                                    borderRadius: 28, padding: "10px",
                                    display: "flex", flexDirection: "column", gap: 8,
                                    boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
                                    pointerEvents: "auto",
                                }}
                            >
                                {REACTIONS.map((r, i) => (
                                    <motion.button
                                        key={r.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.25, background: "var(--app-bg-secondary)" }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => sendReaction(r.emoji)}
                                        style={{
                                            width: 44, height: 44, borderRadius: "50%",
                                            background: "transparent", border: "none",
                                            fontSize: 22, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "background 0.2s",
                                            pointerEvents: "auto",
                                        }}
                                    >
                                        {r.emoji}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <style>{`
                .reaction-toggle-btn {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .reaction-menu-popup {
                    top: 100%;
                    margin-top: 12px;
                }
                @media (max-width: 1024px) {
                    .message-input-area { 
                        top: auto !important; 
                        bottom: 96px !important; 
                        width: calc(100% - 80px) !important; 
                        left: 16px !important; 
                    }
                    .reaction-trigger-area { 
                        top: auto !important; 
                        bottom: 96px !important; 
                        right: 16px !important; 
                    }
                    .reaction-toggle-btn {
                        background: var(--app-surface) !important;
                        border: 1.5px solid var(--app-border) !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                        width: 48px !important; height: 48px !important;
                    }
                    .reaction-menu-popup {
                        top: auto !important;
                        bottom: 100% !important;
                        margin-bottom: 16px !important;
                        margin-top: 0 !important;
                    }
                }
            `}</style>
        </>
    );
}
