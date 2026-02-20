"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const EMOJIS = ['🔥', '❤️', '🤘', '🎶', '😭', '🤯'];

export default function ReactionSystem({ roomId, userId }) {
    const [reactions, setReactions] = useState([]);

    // Listen for reactions
    useEffect(() => {
        const q = query(
            collection(db, 'rooms', roomId, 'reactions'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newReaction = { id: change.doc.id, ...change.doc.data() };
                    // Only show recent reactions (avoid loading old ones on refresh)
                    const now = Date.now();
                    const reactionTime = newReaction.createdAt?.toMillis ? newReaction.createdAt.toMillis() : now;
                    if (now - reactionTime < 5000) {
                        setReactions(prev => [...prev, newReaction]);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [roomId]);

    // Cleanup old reactions from state
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

    const sendReaction = async (emoji) => {
        try {
            await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
                emoji,
                userId,
                createdAt: serverTimestamp(),
            });
            // Optimistic update for sender? Not really needed with fast firestore sync for local feeedback, 
            // but let's rely on listener to keep it simple and consistent.
        } catch (error) {
            console.error("Error sending reaction:", error);
        }
    };

    return (
        <div className="relative w-full">
            {/* Visual Area for Floating Reactions */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                    {reactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{ opacity: 0, scale: 0.5, y: 100, x: Math.random() * 200 - 100 }} // Random X start
                            animate={{ opacity: 1, scale: 1.5, y: -500 }} // Float up
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-4xl"
                            style={{ left: `${50 + (Math.random() * 40 - 20)}%` }} // Random horizontal position
                        >
                            {reaction.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Emoji Buttons */}
            <div className="flex justify-center gap-4 mt-8">
                {EMOJIS.map((emoji) => (
                    <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => sendReaction(emoji)}
                        className="p-3 bg-[#222] rounded-full text-2xl hover:bg-[#FF2E93] hover:shadow-[0_0_15px_#FF2E93] transition-all border border-[#333]"
                    >
                        {emoji}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
