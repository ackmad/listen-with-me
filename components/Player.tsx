"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateCurrentTime, playSong, pauseSong } from '@/lib/syncEngine';
import { motion } from 'framer-motion';

export default function Player({ roomId, isHost }: { roomId: any; isHost: boolean }) {
    const audioRef = useRef < HTMLAudioElement > (null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSong, setCurrentSong] = useState < any > (null);
    const [syncedStartedAt, setSyncedStartedAt] = useState < any > (null);
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioError, setAudioError] = useState < string | null > (null);

    // === Firestore Listener ===
    useEffect(() => {
        if (!roomId) return;
        const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
            const data = snap.data();
            if (!data) return;
            setIsPlaying(data.isPlaying ?? false);
            setCurrentSong(data.currentSong ?? null);
            setSyncedStartedAt(data.startedAt ?? null);
        }, (err) => {
            console.warn("Player listener error:", err.message);
        });
        return () => unsub();
    }, [roomId]);

    // === Load Song when it changes ===
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!currentSong?.url) {
            audio.pause();
            audio.src = '';
            setIsLoading(false);
            setAudioError(null);
            return;
        }

        setAudioError(null);
        setIsLoading(true);

        // Decode the URL (might be double-encoded from Firestore)
        let finalUrl = currentSong.url;
        try { finalUrl = decodeURIComponent(finalUrl); } catch { }
        // Re-encode properly
        const parts = finalUrl.split('/');
        finalUrl = parts.map((p: string, i: number) => i === 0 ? p : encodeURIComponent(p)).join('/');

        audio.src = finalUrl;
        audio.volume = volume;
        audio.load();
    }, [currentSong?.url]);

    // === Play/Pause Sync ===
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.url) return;

        const tryPlay = async () => {
            if (isPlaying) {
                // Sync timestamp
                const offset = calculateCurrentTime(syncedStartedAt);
                if (!isNaN(audio.duration) && Math.abs(audio.currentTime - offset) > 1.5) {
                    audio.currentTime = Math.min(offset, audio.duration || offset);
                }
                try {
                    await audio.play();
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        console.warn("Play failed:", e.message);
                        setAudioError("Click play to start audio (browser policy).");
                    }
                }
            } else {
                audio.pause();
            }
        };

        // Wait for audio to be ready
        if (audio.readyState >= 3) {
            tryPlay();
        } else {
            const onReady = () => { tryPlay(); setIsLoading(false); };
            audio.addEventListener('canplay', onReady, { once: true });
            return () => audio.removeEventListener('canplay', onReady);
        }
    }, [isPlaying, syncedStartedAt]);

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        setDuration(isNaN(audio.duration) ? 0 : audio.duration);
    };

    const handleCanPlay = () => setIsLoading(false);
    const handleAudioError = (e: any) => {
        const audio = audioRef.current;
        const code = audio?.error?.code;
        const msgs: Record<number, string> = {
            1: "Song loading aborted.",
            2: "Network error loading song.",
            3: "Song could not be decoded.",
            4: "Song format not supported.",
        };
        setAudioError(msgs[code ?? 0] || "Cannot load audio.");
        setIsLoading(false);
        console.error("Audio error:", audio?.error);
    };

    const togglePlay = async () => {
        if (!isHost || !currentSong) return;
        if (isPlaying) {
            await pauseSong(roomId);
        } else {
            await playSong(roomId, currentSong);
        }
    };

    const toggleMute = () => {
        setMuted(prev => {
            if (audioRef.current) audioRef.current.muted = !prev;
            return !prev;
        });
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    const formatTime = (t: number) => {
        if (!t || isNaN(t)) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentSong) return (
        <div style={{
            textAlign: "center", padding: "24px",
            border: "2px dashed rgba(255,255,255,0.07)", borderRadius: 20,
        }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }}>
                {isHost ? "Add a song from the queue to start playing" : "Waiting for host to play a song…"}
            </p>
        </div>
    );

    return (
        <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "24px",
            display: "flex", flexDirection: "column", gap: 20,
            backdropFilter: "blur(12px)",
            fontFamily: "var(--font-geist-sans), sans-serif",
        }}>
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onCanPlay={handleCanPlay}
                onError={handleAudioError}
                onEnded={() => isHost && pauseSong(roomId)}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                preload="auto"
            />

            {/* Error message */}
            {audioError && (
                <div style={{
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10, fontSize: 12, color: "#fca5a5",
                    textAlign: "center",
                }}>
                    ⚠️ {audioError}
                </div>
            )}

            {/* Progress bar */}
            <div>
                <div style={{
                    height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4,
                    overflow: "hidden", position: "relative", cursor: isHost ? "pointer" : "default",
                }}>
                    <motion.div
                        style={{
                            height: "100%", width: `${progress}%`,
                            background: "linear-gradient(90deg, #FF0099, #FF66C4)",
                            borderRadius: 4,
                            boxShadow: progress > 0 ? "0 0 8px rgba(255,0,153,0.5)" : "none",
                            transition: "width 0.3s linear",
                        }}
                    />
                </div>
                <div style={{
                    display: "flex", justifyContent: "space-between", marginTop: 6,
                    fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.3)",
                }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 6 }}>
                    <BackwardIcon style={{ width: 22, height: 22 }} />
                </button>

                <motion.button
                    whileHover={isHost ? { scale: 1.08 } : {}}
                    whileTap={isHost ? { scale: 0.94 } : {}}
                    onClick={togglePlay}
                    disabled={!isHost || isLoading}
                    style={{
                        width: 60, height: 60, borderRadius: "50%", border: "none",
                        background: isHost
                            ? "linear-gradient(135deg, #FF0099, #D9007A)"
                            : "rgba(255,255,255,0.08)",
                        color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: isHost && !isLoading ? "pointer" : "not-allowed",
                        boxShadow: isHost ? "0 4px 24px rgba(255,0,153,0.4), 0 0 0 0 rgba(255,0,153,0.3)" : "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    {isLoading ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"
                                style={{ animation: "spin 0.7s linear infinite", transformOrigin: "center", display: "block" }} />
                        </svg>
                    ) : isPlaying ? (
                        <PauseIcon style={{ width: 24, height: 24 }} />
                    ) : (
                        <PlayIcon style={{ width: 24, height: 24, marginLeft: 3 }} />
                    )}
                </motion.button>

                <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 6 }}>
                    <ForwardIcon style={{ width: 22, height: 22 }} />
                </button>
            </div>

            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
                    {muted ? <SpeakerXMarkIcon style={{ width: 16, height: 16 }} /> : <SpeakerWaveIcon style={{ width: 16, height: 16 }} />}
                </button>
                <div style={{ flex: 1, position: "relative", height: 20, display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${muted ? 0 : volume * 100}%`, height: "100%", background: "rgba(255,0,153,0.5)", borderRadius: 3, transition: "width 0.1s" }} />
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
                    />
                </div>
            </div>

            {!isHost && (
                <p style={{
                    margin: 0, textAlign: "center", fontSize: 10,
                    color: "rgba(255,102,196,0.4)", letterSpacing: "0.1em",
                    textTransform: "uppercase",
                }}>
                    Synced with Host
                </p>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
