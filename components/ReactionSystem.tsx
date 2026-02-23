"use client";
import React, { useEffect, useState } from 'react';
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
                            startX: 10 + Math.random() * 80,
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
                return now - t < 12000;
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

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

                {/* Messages Float */}
                <AnimatePresence>
                    {messages.map((m, idx) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.5, y: "110vh", x: `${m.startX}vw`, rotate: Math.random() * 20 - 10 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: "-30vh",
                                x: `${m.startX + (Math.random() * 20 - 10)}vw`,
                                scale: [0.5, 1, 1, 0.7],
                                rotate: Math.random() * 30 - 15,
                            }}
                            transition={{ duration: 8 + Math.random() * 4, ease: "linear", delay: (idx % 8) * 0.2 }}
                            style={{
                                position: "absolute",
                                background: m.color,
                                backdropFilter: "blur(10px)",
                                border: "2px solid rgba(255,255,255,0.8)",
                                borderRadius: "20px 20px 4px 20px",
                                padding: "10px 18px",
                                color: "#fff",
                                fontSize: 18,
                                fontWeight: 800,
                                fontFamily: "var(--font-fredoka), cursive",
                                maxWidth: 260,
                                boxShadow: `0 10px 30px rgba(0,0,0,0.2), 0 0 15px ${m.color}66`,
                                pointerEvents: "none",
                                textAlign: "center",
                                letterSpacing: "-0.01em",
                                whiteSpace: "normal",
                                zIndex: 10,
                            }}
                        >
                            {m.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ─── Desktop UI ─── */}
            <div className="desktop-chat-ui">
                <div className="message-input-area" style={{
                    position: "fixed", top: 80, left: 16, zIndex: 1000,
                    width: "calc(100% - 80px)", maxWidth: 420,
                    pointerEvents: "auto",
                }}>
                    <form onSubmit={sendMessage} style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Kirim pesan singkat..."
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value.slice(0, 50))}
                            style={{
                                width: "100%", padding: "16px 54px 16px 24px",
                                background: "var(--bg-card)", backdropFilter: "blur(20px)",
                                border: "2px solid var(--border-soft)",
                                borderRadius: 28, color: "var(--text-primary)", fontSize: 16,
                                fontFamily: "var(--font-fredoka), sans-serif", fontWeight: 600,
                                outline: "none",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                transition: "var(--theme-transition)",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!msgInput.trim() || isSendingMsg}
                            style={{
                                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                                width: 36, height: 36, borderRadius: "50%",
                                background: msgInput.trim() ? "var(--accent-primary)" : "var(--border-soft)",
                                border: "none", color: "#fff", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.3s ease",
                            }}
                        >
                            <PaperAirplaneIcon style={{ width: 18, height: 18, marginLeft: -2 }} />
                        </button>
                    </form>
                </div>

                <div className="reaction-trigger-area" style={{
                    position: "fixed", top: 80, right: 396, zIndex: 1000,
                    pointerEvents: "auto",
                }}>
                    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <motion.button
                            whileHover={{ scale: 1.1, background: "rgba(255,110,181,0.15)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowMenu(!showMenu)}
                            style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: "var(--bg-card)", backdropFilter: "blur(20px)",
                                color: showMenu ? "var(--accent-primary)" : "var(--text-primary)",
                                cursor: "pointer", border: "1.5px solid var(--border-soft)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "var(--shadow-soft)", transition: "all 0.3s ease",
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
                                    style={{
                                        position: "absolute", top: "100%", right: 0, marginTop: 12,
                                        background: "var(--bg-card)", backdropFilter: "blur(24px)",
                                        border: "2px solid var(--border-soft)",
                                        borderRadius: 28, padding: "10px",
                                        display: "flex", flexDirection: "column", gap: 8,
                                        boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    {REACTIONS.map((r, i) => (
                                        <motion.button
                                            key={r.label}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ scale: 1.25, background: "var(--bg-secondary)" }}
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => sendReaction(r.emoji)}
                                            style={{
                                                width: 44, height: 44, borderRadius: "50%",
                                                background: "transparent", border: "none",
                                                fontSize: 22, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
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
            </div>

            {/* ─── Mobile UI (Consolidated Parallel Liquid Glass) ─── */}
            <div className="mobile-chat-ui" style={{
                position: "fixed", bottom: 96, left: 16, right: 16, zIndex: 1000,
                display: "none", alignItems: "center", gap: 10,
                pointerEvents: "auto",
            }}>
                <form onSubmit={sendMessage} style={{ flex: 1, position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Kirim pesan..."
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value.slice(0, 50))}
                        style={{
                            width: "100%", height: 52, padding: "0 54px 0 20px",
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(24px) saturate(160%)",
                            WebkitBackdropFilter: "blur(24px) saturate(160%)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            borderRadius: 26,
                            color: "var(--text-primary)",
                            fontSize: 15,
                            fontFamily: "var(--font-fredoka), sans-serif",
                            fontWeight: 600,
                            outline: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            transition: "all 0.3s ease",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!msgInput.trim() || isSendingMsg}
                        style={{
                            position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)",
                            width: 38, height: 38, borderRadius: "50%",
                            background: msgInput.trim() ? "var(--accent-primary)" : "rgba(255,255,255,0.05)",
                            border: "none", color: msgInput.trim() ? "#fff" : "var(--text-muted)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                        }}
                    >
                        <PaperAirplaneIcon style={{ width: 18, height: 18, marginLeft: -2 }} />
                    </button>
                </form>

                <div style={{ position: "relative" }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(24px) saturate(160%)",
                            WebkitBackdropFilter: "blur(24px) saturate(160%)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: showMenu ? "var(--accent-primary)" : "var(--text-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            cursor: "pointer"
                        }}
                    >
                        {showMenu ? <XMarkIcon style={{ width: 24, height: 24 }} /> : <FaceSmileIcon style={{ width: 24, height: 24 }} />}
                    </motion.button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                style={{
                                    position: "absolute", bottom: "120%", right: 0,
                                    background: "var(--bg-card)",
                                    backdropFilter: "blur(20px)",
                                    border: "1.5px solid var(--border-soft)",
                                    borderRadius: 24, padding: "8px",
                                    display: "flex", flexDirection: "column", gap: 8,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                                }}
                            >
                                {REACTIONS.map((r) => (
                                    <button
                                        key={r.label}
                                        onClick={() => sendReaction(r.emoji)}
                                        style={{
                                            width: 40, height: 40, borderRadius: "50%",
                                            background: "transparent", border: "none", fontSize: 20,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {r.emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .desktop-chat-ui { display: none !important; }
                    .mobile-chat-ui { display: flex !important; }
                }
            `}</style>
        </>
    );
}
