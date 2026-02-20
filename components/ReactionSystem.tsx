"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSmileIcon, PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

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
}

export interface Props {
    roomId: string;
    userId: string;
    bottomOffset?: number;
}

export default function ReactionSystem({ roomId, userId, bottomOffset = 0 }: Props) {
    const [reactions, setReactions] = useState<ReactionItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [isSendingMsg, setIsSendingMsg] = useState(false);

    // ─── Listeners ───
    useEffect(() => {
        if (!roomId) return;

        // Reactions Listener
        const qR = query(collection(db, 'rooms', roomId, 'reactions'), orderBy('createdAt', 'desc'), limit(5));
        const unsubR = onSnapshot(qR, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const now = Date.now();
                    const rTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

                    if (now - rTime < 4000) {
                        // BURST EFFECT: Create 6 local items for 1 doc
                        const burst: ReactionItem[] = Array.from({ length: 8 }).map((_, i) => {
                            const type = Math.random(); // 0-0.3: left, 0.3-0.6: right, rest: bottom
                            let x = 50;
                            let y = 110;
                            if (type < 0.25) { x = -10; y = Math.random() * 80 + 20; } // Left side
                            else if (type < 0.5) { x = 110; y = Math.random() * 80 + 20; } // Right side
                            else { x = Math.random() * 80 + 10; y = 110; } // Bottom

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

        // Messages Listener
        const qM = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'desc'), limit(5));
        const unsubM = onSnapshot(qM, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const now = Date.now();
                    const mTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;

                    if (now - mTime < 5000) {
                        setMessages(prev => [...prev, {
                            id: change.doc.id,
                            text: data.text,
                            userId: data.userId,
                            createdAt: data.createdAt,
                            startX: Math.random() * 40 - 20,
                        }]);
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
                return now - t < 6000;
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

                {/* Messages Float */}
                <AnimatePresence>
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.8, y: "110vh", x: `${50 + m.startX}vw` }}
                            animate={{ opacity: [0, 1, 1, 0], y: "-30vh" }}
                            transition={{ duration: 6, ease: "linear" }}
                            style={{
                                position: "absolute",
                                background: "rgba(255,255,255,0.1)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "16px 16px 4px 16px",
                                padding: "8px 16px",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 500,
                                maxWidth: 200,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                pointerEvents: "none",
                            }}
                        >
                            {m.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ─── Message Input (Top-Left/Center Area) ─── */}
            <div className="message-input-area" style={{
                position: "fixed", top: 70, left: 16, zIndex: 150,
                width: "calc(100% - 100px)", maxWidth: 300,
            }}>
                <form onSubmit={sendMessage} style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Kirim pesan singkat..."
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value.slice(0, 50))} // limit to 50 chars
                        style={{
                            width: "100%", padding: "10px 40px 10px 16px",
                            background: "rgba(10,5,8,0.4)", backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 20, color: "#fff", fontSize: 13,
                            fontFamily: "inherit", outline: "none",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                            transition: "all 0.3s ease",
                        }}
                        onFocus={(e) => {
                            e.target.style.background = "rgba(10,5,8,0.7)";
                            e.target.style.borderColor = "rgba(200,0,100,0.4)";
                        }}
                        onBlur={(e) => {
                            e.target.style.background = "rgba(10,5,8,0.4)";
                            e.target.style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!msgInput.trim() || isSendingMsg}
                        style={{
                            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                            width: 28, height: 28, borderRadius: "50%",
                            background: msgInput.trim() ? "linear-gradient(135deg, #c4005c, #8c004a)" : "rgba(255,255,255,0.1)",
                            border: "none", color: "#fff", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: msgInput.trim() ? 1 : 0.5,
                        }}
                    >
                        <PaperAirplaneIcon style={{ width: 14, height: 14 }} />
                    </button>
                </form>
            </div>

            {/* ─── Reaction Trigger (Top-Right Area) ─── */}
            <div className="reaction-trigger-area" style={{
                position: "fixed", top: 70, right: 16, zIndex: 150,
            }}>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: showMenu ? "linear-gradient(135deg, #c4005c, #8c004a)" : "rgba(10,5,8,0.6)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#fff", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                        }}
                    >
                        {showMenu ? <XMarkIcon style={{ width: 20, height: 20 }} /> : <FaceSmileIcon style={{ width: 22, height: 22 }} />}
                    </motion.button>

                    {/* Vertical Emoji List */}
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 10, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                                style={{
                                    position: "absolute", top: "100%", right: 0,
                                    background: "rgba(10,5,8,0.8)", backdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 24, padding: "8px",
                                    display: "flex", flexDirection: "column", gap: 6,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                }}
                            >
                                {REACTIONS.map((r, i) => (
                                    <motion.button
                                        key={r.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.2, x: -4 }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => sendReaction(r.emoji)}
                                        style={{
                                            width: 42, height: 42, borderRadius: "50%",
                                            background: "rgba(255,255,255,0.05)", border: "none",
                                            fontSize: 20, cursor: "pointer",
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

            {/* Global Styles for Mobile Awareness */}
            <style>{`
                @media (max-width: 700px) {
                    .message-input-area { top: 64px !important; }
                    .reaction-trigger-area { top: 64px !important; }
                }
            `}</style>
        </>
    );
}

function XMarkIcon({ style }: { style?: React.CSSProperties }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={style}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
