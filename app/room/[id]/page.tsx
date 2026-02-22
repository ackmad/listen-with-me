"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc, onSnapshot, updateDoc, arrayUnion, arrayRemove,
    collection, addDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc, runTransaction,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeftIcon, MusicalNoteIcon, CheckIcon, XMarkIcon,
    QueueListIcon, PlusIcon, UsersIcon,
    ChatBubbleOvalLeftIcon, HeartIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon
} from "@heroicons/react/24/outline";
import {
    PlayIcon, PauseIcon, ForwardIcon,
    SpeakerWaveIcon, SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import {
    useBroadcastPresence, useRoomPresence, getInitials,
    type UserPresence,
} from "@/hooks/usePresence";
import { ToastProvider, useToast } from "@/components/Toast";
import SongManager, { LOCAL_SONGS } from "@/components/SongManager";
import ReactionSystem from "@/components/ReactionSystem";
import LyricsPanel from "@/components/LyricsPanel";
import { parseSRT, LyricLine } from "@/lib/srtParser";

// ─── Sync Loading Screen ──────────────────────────────────────────────────
function SyncScreen({ songTitle, artist }: { songTitle?: string; artist?: string }) {
    const tips = [
        "Sinkronisasi musik membutuhkan sebentar...",
        "Menyambungkan ke host...",
        "Menyesuaikan waktu putar...",
        "Hampir siap! 🎵",
    ];
    const [tipIdx, setTipIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 2200);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "var(--app-bg)",
            backdropFilter: "blur(24px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 0,
            padding: 32,
            transition: "var(--theme-transition)",
        }}>
            <div style={{ position: "relative", marginBottom: 36 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{
                        width: 120, height: 120, borderRadius: "50%",
                        background: "var(--app-surface)",
                        border: "2px solid var(--app-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 50px var(--app-soft-accent)",
                    }}
                >
                    <MusicalNoteIcon style={{ width: 36, height: 36, color: "var(--app-primary)" }} />
                </motion.div>
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 2.2], opacity: [0.25, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
                        style={{
                            position: "absolute", inset: 0, borderRadius: "50%",
                            border: "1.5px solid var(--app-primary)",
                            pointerEvents: "none",
                        }}
                    />
                ))}
            </div>

            {songTitle && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: "center", marginBottom: 28 }}
                >
                    <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--app-text)", letterSpacing: "-0.2px" }}>
                        {songTitle}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--app-text-secondary)" }}>{artist}</p>
                </motion.div>
            )}

            <div style={{ display: "flex", gap: 5, alignItems: "flex-end", marginBottom: 24, height: 28 }}>
                {[1, 2, 3, 4, 5, 4, 3, 2].map((h, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: [h * 4, h * 4 + 14, h * 4] }}
                        transition={{ duration: 0.7 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                        style={{ width: 4, background: "var(--app-primary)", borderRadius: 4, minHeight: 4 }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={tipIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        margin: 0, fontSize: 13,
                        color: "var(--app-text-muted)",
                        letterSpacing: "0.04em",
                        textAlign: "center",
                        fontFamily: "var(--font-fredoka)",
                        fontWeight: 600
                    }}
                >
                    {tips[tipIdx]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

// ─── Initial loading skeleton ─────────────────────────────────────────────
function RoomSkeleton() {
    return (
        <div style={{
            minHeight: "100vh", background: "var(--app-bg)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 20,
            transition: "var(--theme-transition)",
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: "3px solid var(--app-border)",
                    borderTopColor: "var(--app-primary)",
                }}
            />
            <p style={{ color: "var(--app-text-muted)", fontFamily: "var(--font-fredoka)", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
                Masuk ke ruang kita...
            </p>
        </div>
    );
}

// ─── Role Badge ───────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: "Host" | "Tamu" }) {
    return (
        <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "3px 8px", borderRadius: 20,
            background: role === "Host" ? "var(--app-primary)" : "var(--app-bg-secondary)",
            color: role === "Host" ? "#fff" : "var(--app-text-secondary)",
            border: `1px solid ${role === "Host" ? "var(--app-primary-hover)" : "var(--app-border)"}`,
            flexShrink: 0,
            boxShadow: role === "Host" ? "0 2px 8px var(--app-soft-accent)" : "none",
        }}>
            {role === "Host" ? "👑 Host" : "Tamu"}
        </span>
    );
}

// ─── User card ────────────────────────────────────────────────────────────
function RoomUserCard({ u, isHost, isMe }: { u: UserPresence; isHost: boolean; isMe: boolean }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 14,
            background: isHost ? "var(--app-bg-secondary)" : "var(--app-surface)",
            border: `1px solid ${isHost ? "var(--app-primary)" : "var(--app-border)"}`,
            transition: "var(--theme-transition)",
        }}>
            <div style={{
                position: "relative", flexShrink: 0,
                width: 38, height: 38, borderRadius: "50%",
                background: isHost ? "var(--app-primary)" : "var(--app-bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: isHost ? "#fff" : "var(--app-text-secondary)",
                border: `2px solid ${isHost ? "#fff" : "var(--app-border)"}`,
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: u.status === "idle" ? "#fbbf24" : "var(--app-indicator)",
                    border: "2px solid var(--app-surface)",
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: isHost ? 800 : 600,
                        color: "var(--app-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe ? " (kamu)" : ""}
                    </p>
                    <RoleBadge role={isHost ? "Host" : "Tamu"} />
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: u.status === "idle" ? "#d97706" : "var(--app-indicator)", fontWeight: 700 }}>
                    {u.status === "idle" ? "Sedang idle" : "Aktif sekarang"}
                </p>
            </div>
        </div>
    );
}

// ─── Queue Item ───────────────────────────────────────────────────────────
function QueueItem({ song, isHost, isActive, onPlay, onRemove }: { song: any; isHost: boolean; isActive: boolean; onPlay: () => void; onRemove?: () => void }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            onClick={isHost ? onPlay : undefined}
            style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                background: isActive ? "var(--app-bg-secondary)" : hov ? "var(--app-surface)" : "transparent",
                border: `1.5px solid ${isActive ? "var(--app-primary)" : hov ? "var(--app-border)" : "transparent"}`,
                cursor: isHost ? "pointer" : "default", transition: "all 0.2s ease", minHeight: 48,
                position: "relative",
            }}
        >
            <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: isActive ? "var(--app-primary)" : "var(--app-bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isActive ? "#fff" : "var(--app-text-muted)",
            }}>
                {isHost && hov && !isActive
                    ? <PlayIcon style={{ width: 14, height: 14 }} />
                    : <MusicalNoteIcon style={{ width: 14, height: 14 }} />
                }
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: isActive ? "var(--app-primary)" : "var(--app-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--app-text-muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.artist} {song.requestedBy ? `• dari ${song.requestedBy}` : ""}
                </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {isHost && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                        style={{
                            padding: 6, borderRadius: 8, border: "none", background: "transparent",
                            color: "var(--app-text-muted)", cursor: "pointer", transition: "all 0.2s",
                            display: hov ? "flex" : "none",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}
                    >
                        <XMarkIcon style={{ width: 16, height: 16 }} />
                    </button>
                )}
                {isActive && (
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                        {[1, 2, 3].map(i => (
                            <motion.div key={i}
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                                style={{ width: 3, background: "var(--app-primary)", borderRadius: 2 }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main room logic ──────────────────────────────────────────────────────
function RoomInner() {
    const { id: roomId } = useParams();
    const router = useRouter();
    const rId = typeof roomId === "string" ? roomId : "";
    const { toast } = useToast();

    const audioRef = useRef<HTMLAudioElement>(null);

    const [user, setUser] = useState<any>(null);
    const [authDone, setAuthDone] = useState(false);
    const [room, setRoom] = useState<any>(null);
    const [isHost, setIsHost] = useState(false);
    const [roomUsers, setRoomUsers] = useState<UserPresence[]>([]);
    const [showSongs, setShowSongs] = useState(false);
    const [mobileTab, setMobileTab] = useState<"queue" | "requests" | "users">("queue");
    const [showDrawer, setShowDrawer] = useState(false);

    const [isSyncing, setIsSyncing] = useState(false);
    const [needsInteraction, setNeedsInteraction] = useState(false);
    const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.85);
    const [muted, setMuted] = useState(false);

    const sessionStart = useRef(Date.now());
    const [songsPlayed, setSongsPlayed] = useState(0);

    // Lyrics related state
    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeView, setActiveView] = useState<"player" | "lyrics">("player");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showImmersiveQueue, setShowImmersiveQueue] = useState(false);

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.body.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const songUrl = room?.currentSong?.url;
        if (!songUrl) {
            setLyrics(null);
            setActiveIndex(-1);
            return;
        }
        const baseUrl = songUrl.split('?')[0];
        const srtUrl = baseUrl.replace(/\.[^/.]+$/, "") + ".srt";

        fetch(srtUrl)
            .then(res => {
                if (!res.ok) throw new Error("SRT not found");
                return res.text();
            })
            .then(text => {
                setLyrics(parseSRT(text));
                setActiveIndex(-1);
            })
            .catch(() => {
                setLyrics(null);
                setActiveIndex(-1);
            });
    }, [room?.currentSong?.url]);

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) { router.push("/"); return; }
            setUser(u);
            setAuthDone(true);
        });
    }, [router]);

    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
    useBroadcastPresence(user?.uid ?? null, displayName, user?.photoURL ?? null, {
        activity: "Sedang di room",
        currentRoom: rId,
        currentRoomName: room?.name
    });

    const handleRoomPresence = useCallback((users: UserPresence[]) => setRoomUsers(users), []);
    useRoomPresence(rId, handleRoomPresence);

    useEffect(() => {
        if (!rId || !authDone || !user) return;
        return onSnapshot(doc(db, "rooms", rId), (snap) => {
            if (!snap.exists()) { router.push("/dashboard"); return; }
            const data = snap.data();
            setRoom(data);
            setIsHost(data.hostId === user.uid);
        }, (err) => console.warn("Room:", err.message));
    }, [rId, authDone, user, router]);

    const lastSongUrl = useRef<string | null>(null);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!room?.currentSong?.url) { audio.pause(); audio.src = ""; return; }
        if (room.currentSong.url === lastSongUrl.current) return;
        lastSongUrl.current = room.currentSong.url;
        audio.src = room.currentSong.url;
        audio.volume = volume;
        audio.load();
    }, [room?.currentSong?.url]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !room?.currentSong?.url) return;

        const tryPlay = async () => {
            if (room.isPlaying) {
                if (room.startedAt) {
                    const offset = (Date.now() - (room.startedAt.toMillis?.() ?? Date.now())) / 1000;
                    const target = Math.min(Math.max(offset, 0), audio.duration || offset);
                    if (Math.abs(audio.currentTime - target) > 1.5) audio.currentTime = target;
                }
                try {
                    await audio.play();
                    setNeedsInteraction(false);
                } catch (e: any) {
                    if (e.name === "NotAllowedError") {
                        setNeedsInteraction(true);
                    } else if (e.name !== "AbortError") {
                        console.warn("Play:", e.message);
                    }
                }
            } else {
                audio.pause();
            }
        };

        if (audio.readyState >= 3) {
            tryPlay();
        } else {
            if (!isHost) {
                setIsSyncing(true);
                if (syncTimeout.current) clearTimeout(syncTimeout.current);
                syncTimeout.current = setTimeout(() => setIsSyncing(false), 6000);
            }
            const fn = () => { tryPlay(); setIsSyncing(false); if (syncTimeout.current) clearTimeout(syncTimeout.current); };
            audio.addEventListener("canplay", fn, { once: true });
            return () => audio.removeEventListener("canplay", fn);
        }
    }, [room?.isPlaying, room?.startedAt, isHost]);

    const handleAudioEnded = useCallback(async () => {
        if (!rId) return;
        try {
            await runTransaction(db, async (transaction) => {
                const roomRef = doc(db, "rooms", rId);
                const snap = await transaction.get(roomRef);
                const data = snap.data();
                if (!data) return;

                const currentSrc = audioRef.current?.src || "";
                const dbUrl = data.currentSong?.url || "";
                if (!currentSrc || !dbUrl || !currentSrc.endsWith(dbUrl)) return;

                const queue: any[] = data.queue || [];
                if (queue.length === 0) {
                    transaction.update(roomRef, { currentSong: null, isPlaying: false });
                } else {
                    const next = queue[0];
                    transaction.update(roomRef, {
                        currentSong: next, queue: queue.slice(1),
                        isPlaying: true, startedAt: serverTimestamp(),
                    });
                }
            });
        } catch (err) {
            console.warn("Queue Advance Error:", err);
        }
    }, [rId]);

    const togglePlay = async () => {
        if (!isHost) return;
        const newIsPlaying = !room.isPlaying;
        const currentPos = audioRef.current?.currentTime || 0;

        await updateDoc(doc(db, "rooms", rId), {
            isPlaying: newIsPlaying,
            ...(newIsPlaying && { startedAt: new Date(Date.now() - (currentPos * 1000)) }),
        });
    };
    const skipNext = async () => {
        if (!room?.queue?.length) return;
        const next = room.queue[0];
        await updateDoc(doc(db, "rooms", rId), {
            currentSong: next || null,
            queue: room.queue.slice(1),
            isPlaying: true,
            startedAt: serverTimestamp(),
        });
        setSongsPlayed(p => p + 1);
        toast(`▶ Lompat ke: ${next?.title || "Lagu Selanjutnya"}`, "info");
    };

    const handleSongSelect = async (song: any) => {
        if (!rId || !user) return;
        const songWithId = {
            ...song,
            queueId: `${song.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            requestedBy: displayName,
            requesterId: user.uid
        };
        await updateDoc(doc(db, "rooms", rId), { queue: arrayUnion(songWithId) });
        toast("Lagu ditambahkan ke antrian 🎵", "success");
    };

    const addRandomSongs = async () => {
        if (!rId || !user) return;
        const shuffled = [...LOCAL_SONGS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5).map(s => ({
            ...s,
            queueId: `${s.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            requestedBy: displayName,
            requesterId: user.uid
        }));
        await updateDoc(doc(db, "rooms", rId), { queue: arrayUnion(...selected) });
        toast("5 Lagu random ditambahkan! 🎲", "success");
    };

    const removeFromQueue = async (song: any) => {
        if (!isHost || !rId) return;
        await updateDoc(doc(db, "rooms", rId), { queue: arrayRemove(song) });
        toast("Lagu dihapus dari antrian", "info");
    };

    const playFromQueue = async (song: any) => {
        if (!isHost || !song) return;
        await updateDoc(doc(db, "rooms", rId), {
            currentSong: song || null,
            queue: arrayRemove(song),
            isPlaying: true,
            startedAt: serverTimestamp(),
        });
        setSongsPlayed(p => p + 1);
    };

    const formatTime = (t: number) =>
        (!t || isNaN(t)) ? "0:00" : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const sessionMinutes = Math.floor((Date.now() - sessionStart.current) / 60000);
    const roomUsersSorted = [...roomUsers].sort((a, b) => {
        if (a.uid === room?.hostId) return -1;
        if (b.uid === room?.hostId) return 1;
        return 0;
    });

    if (!authDone) return <RoomSkeleton />;

    // ─── Shared Components ──────────────────────────────────────────────────

    const desktopSidebar = (
        <aside className="room-sidebar-desktop" style={{
            width: 380, flexShrink: 0,
            borderLeft: "1.5px solid var(--app-border)",
            background: "var(--app-surface)",
            display: "flex", flexDirection: "column",
            transition: "var(--theme-transition)",
            height: "100%", overflowY: "auto",
        }}>
            {/* Active Users */}
            <div style={{ padding: "24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UsersIcon style={{ width: 16, height: 16, color: "var(--app-primary)" }} />
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            Teman Mendengar ({roomUsers.length})
                        </h3>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {roomUsersSorted.map(u => (
                        <RoomUserCard key={u.uid} u={u} isHost={u.uid === room?.hostId} isMe={u.uid === user?.uid} />
                    ))}
                </div>
            </div>

            <div style={{ height: 1.5, background: "var(--app-border)", margin: "0 20px" }} />

            {/* Queue */}
            <div style={{ padding: "24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <QueueListIcon style={{ width: 16, height: 16, color: "var(--app-primary)" }} />
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            List Antrian
                        </h3>
                    </div>
                    {isHost && (
                        <button onClick={addRandomSongs} style={{ padding: "4px 10px", borderRadius: 10, border: "none", background: "var(--app-bg-secondary)", color: "var(--app-text-muted)", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                            🎲 RANDOM 5
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {room?.queue?.length > 0 ? (
                        room.queue.map((s: any, i: number) => (
                            <QueueItem key={s.queueId} song={s} isHost={isHost} isActive={false} onPlay={() => playFromQueue(s)} onRemove={() => removeFromQueue(s)} />
                        ))
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", border: "1.5px dashed var(--app-border)", borderRadius: 20, gap: 12 }}>
                            <p style={{ margin: 0, color: "var(--app-text-muted)", fontWeight: 700, fontSize: 13 }}>Antrian masih kosong</p>
                            <button onClick={() => setShowSongs(true)} style={{ background: "none", border: "none", color: "var(--app-primary)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Tambah Lagu</button>
                        </div>
                    )}
                </div>
            </div>
            {/* Version */}
            <div style={{ padding: 12, textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--app-text-muted)", opacity: 0.5 }}>v0.11</span>
            </div>
        </aside>
    );

    const desktopPlayerContent = (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--app-bg)", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 60, width: "100%", maxWidth: 1100 }}>

                    {/* Disc Section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ position: "relative", marginBottom: 40 }}>
                            <motion.div
                                animate={room?.isPlaying ? { rotate: 360 } : { rotate: 0 }}
                                transition={room?.isPlaying ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                                style={{
                                    width: 320, height: 320, borderRadius: "50%",
                                    background: "var(--app-surface)",
                                    border: "6px solid var(--app-border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: room?.isPlaying ? "0 0 60px var(--app-soft-accent)" : "0 20px 50px rgba(0,0,0,0.15)",
                                }}
                            >
                                <div style={{
                                    width: 80, height: 80, borderRadius: "50%",
                                    background: "var(--app-bg-secondary)", border: "3px solid var(--app-border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <MusicalNoteIcon style={{ width: 32, height: 32, color: room?.currentSong ? "var(--app-primary)" : "var(--app-text-muted)" }} />
                                </div>
                            </motion.div>
                        </div>

                        <div style={{ textAlign: "center", width: "100%" }}>
                            <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "var(--app-text)" }}>
                                {room?.currentSong?.title || "Belum ada lagu"}
                            </h2>
                            <p style={{ margin: "0 0 32px", fontSize: 18, color: "var(--app-primary)", fontWeight: 700 }}>
                                {room?.currentSong?.artist || (isHost ? "Klik Request untuk mulai!" : "Menunggu host...")}
                            </p>

                            {/* Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center" }}>
                                <button onClick={() => setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; })}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid var(--app-border)", borderRadius: "50%", cursor: "pointer", color: "var(--app-text-secondary)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {muted ? <SpeakerXMarkIcon style={{ width: 18, height: 18 }} /> : <SpeakerWaveIcon style={{ width: 18, height: 18 }} />}
                                </button>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={togglePlay} disabled={!isHost || !room?.currentSong}
                                    style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: "var(--app-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 30px var(--app-soft-accent)" }}>
                                    {room?.isPlaying ? <PauseIcon style={{ width: 28, height: 28 }} /> : <PlayIcon style={{ width: 28, height: 28, marginLeft: 3 }} />}
                                </motion.button>
                                <button onClick={skipNext} disabled={!isHost || !room?.queue?.length}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid var(--app-border)", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "var(--app-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <ForwardIcon style={{ width: 18, height: 18 }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inline Lyrics Section */}
                    <div style={{ flex: 1, paddingLeft: 40, borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                        <LyricsPanel
                            lyrics={lyrics}
                            activeIndex={activeIndex}
                            autoScrollEnabled={true}
                            setAutoScrollEnabled={() => { }}
                            isDarkMode={isDarkMode}
                            isDesktopInline={true}
                        />
                    </div>
                </div>
            </div>

            {/* Tiny text at bottom */}
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MusicalNoteIcon style={{ width: 12, height: 12, color: "var(--app-text-muted)" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--app-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Sinkronisasi Dengan Host Aktif
                </span>
            </div>
        </div>
    );

    // ─── Mobile Views (iOS Style) ───────────────────────────────────────────

    const mobilePlayerView = (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 60px", background: "var(--app-bg)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {/* Large Apple-style disc */}
                <motion.div
                    animate={room?.isPlaying ? { rotate: 360 } : {}}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{
                        width: "85vw", maxWidth: 320, height: "85vw", maxHeight: 320,
                        borderRadius: 32, background: "var(--app-surface)",
                        boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
                        marginBottom: 48, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >
                    <div style={{ width: "20%", height: "20%", borderRadius: "50%", background: "var(--app-bg)", border: "2px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MusicalNoteIcon style={{ width: "40%", height: "40%", color: "var(--app-primary)" }} />
                    </div>
                </motion.div>

                {/* Song Info */}
                <div style={{ width: "100%", marginBottom: 32 }}>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--app-text)", letterSpacing: "-0.5px" }}>{room?.currentSong?.title || "Belum ada lagu"}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 18, color: "var(--app-text-secondary)", fontWeight: 600 }}>{room?.currentSong?.artist || "Standby..."}</p>
                </div>

                {/* Progress */}
                <div style={{ width: "100%", marginBottom: 40 }}>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: "#fff", borderRadius: 2 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5 }}>{formatTime(currentTime)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5 }}>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Large Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 50, width: "100%" }}>
                    <button style={{ background: "none", border: "none", color: "#fff" }}><PlayIcon style={{ width: 32, height: 32, transform: "rotate(180deg)" }} onClick={() => { }} /></button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                        style={{ width: 84, height: 84, borderRadius: "50%", background: "#fff", border: "none", color: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {room?.isPlaying ? <PauseIcon style={{ width: 40, height: 40 }} /> : <PlayIcon style={{ width: 40, height: 40, marginLeft: 4 }} />}
                    </motion.button>
                    <button onClick={skipNext} style={{ background: "none", border: "none", color: "#fff" }}><ForwardIcon style={{ width: 32, height: 32 }} /></button>
                </div>
            </div>
        </div>
    );

    const mobileLyricsView = (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--app-bg)", overflow: "hidden" }}>
            {/* Small header for lyrics view */}
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MusicalNoteIcon style={{ width: 20, height: 20, color: "var(--app-primary)" }} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>{room?.currentSong?.title}</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, opacity: 0.6 }}>{room?.currentSong?.artist}</p>
                </div>
            </div>

            <div style={{ flex: 1, padding: "20px 0" }}>
                <LyricsPanel
                    lyrics={lyrics}
                    activeIndex={activeIndex}
                    autoScrollEnabled={autoScrollEnabled}
                    setAutoScrollEnabled={setAutoScrollEnabled}
                    isDarkMode={isDarkMode}
                    isMobile={true}
                />
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh", background: "var(--app-bg)", color: "var(--app-text)",
            fontFamily: "var(--font-geist-sans), sans-serif",
            display: "flex", flexDirection: "column",
            transition: "var(--theme-transition)",
        }}>
            <audio
                ref={audioRef}
                onTimeUpdate={() => {
                    const a = audioRef.current;
                    if (a) {
                        const time = a.currentTime;
                        setCurrentTime(time);
                        setDuration(isNaN(a.duration) ? 0 : a.duration);
                        if (lyrics && lyrics.length > 0) {
                            const index = lyrics.findIndex(l => time >= l.start && time <= l.end);
                            if (index !== -1) setActiveIndex(index);
                            else {
                                const lastIndex = [...lyrics].reverse().findIndex(l => time >= l.start);
                                if (lastIndex !== -1) setActiveIndex(lyrics.length - 1 - lastIndex);
                                else setActiveIndex(-1);
                            }
                        }
                    }
                }}
                onCanPlay={() => { setIsSyncing(false); if (syncTimeout.current) clearTimeout(syncTimeout.current); }}
                onEnded={handleAudioEnded}
                onError={() => setIsSyncing(false)}
                preload="auto"
            />

            <AnimatePresence>
                {(isSyncing || needsInteraction) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
                        {needsInteraction ? (
                            <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 32, textAlign: "center" }}>
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--app-bg-secondary)", border: "2px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <MusicalNoteIcon style={{ width: 40, height: 40, color: "var(--app-primary)" }} />
                                </motion.div>
                                <div>
                                    <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900 }}>Siap untuk Mendengarkan?</h2>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--app-text-muted)", fontWeight: 600 }}>Tap tombol di bawah untuk bergabung!</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={async () => { if (audioRef.current) await audioRef.current.play(); setNeedsInteraction(false); }}
                                    style={{ padding: "18px 40px", borderRadius: 24, background: "var(--app-primary)", border: "none", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 30px var(--app-soft-accent)" }}>
                                    Gabung & Sinkron →
                                </motion.button>
                            </div>
                        ) : <SyncScreen songTitle={room?.currentSong?.title} artist={room?.currentSong?.artist} />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Header (Mostly for desktop) */}
            <header className="room-main-header" style={{
                padding: "0 24px", height: 72,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1.5px solid var(--app-border)",
                background: "var(--app-surface)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 50, flexShrink: 0
            }}>
                <button onClick={() => router.push("/dashboard")} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                    borderRadius: 20, background: "var(--app-bg-secondary)", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 800
                }}>
                    <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Keluar
                </button>

                <div className="header-center-info" style={{ textAlign: "center", flex: 1, padding: "0 20px" }}>
                    <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{room?.name || "Room"}</h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                        <MusicalNoteIcon style={{ width: 14, height: 14, color: "var(--app-primary)" }} />
                        <span style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 800 }}>{isHost ? "👑 HOST" : "TAMU"}{sessionMinutes > 0 ? ` • ${sessionMinutes}M` : ""}</span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={toggleFullscreen}
                        className="desktop-only-btn"
                        style={{
                            padding: 10, background: "var(--app-bg-secondary)",
                            borderRadius: "50%", border: "none", color: "var(--app-text)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                    >
                        {isFullscreen ? <ArrowsPointingInIcon style={{ width: 20, height: 20 }} /> : <ArrowsPointingOutIcon style={{ width: 20, height: 20 }} />}
                    </button>
                    {/* Mobile toggle removed as it's now in tabs */}
                    <button onClick={() => setShowSongs(true)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "12px 24px",
                        borderRadius: 24, background: "var(--app-primary)",
                        border: "none", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
                        boxShadow: "0 8px 20px var(--app-soft-accent)"
                    }}>
                        <PlusIcon style={{ width: 18, height: 18 }} />
                        <span className="sm-hidden">Request</span>
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Content View */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Desktop Content */}
                    <div className="desktop-view" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                        {desktopPlayerContent}
                        {desktopSidebar}
                    </div>

                    {/* Mobile Content */}
                    <div className="mobile-view" style={{ flex: 1, display: "none", flexDirection: "column", overflow: "hidden", background: "var(--app-bg)" }}>
                        {/* Mobile Shared Top Area (Chat Input) - Stays visible */}
                        <div style={{ padding: "12px 20px", background: "var(--app-surface)", borderBottom: "1.5px solid var(--app-border)" }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: "var(--app-bg-secondary)",
                                padding: "8px 16px", borderRadius: 24,
                                border: "1.5px solid var(--app-border)"
                            }}>
                                <input
                                    placeholder="Kirim pesan singkat..."
                                    style={{
                                        flex: 1, background: "none", border: "none",
                                        color: "var(--app-text)", fontSize: 13, fontWeight: 600,
                                        outline: "none"
                                    }}
                                />
                                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                                    <ChatBubbleOvalLeftIcon style={{ width: 18, height: 18, color: "var(--app-primary)" }} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Tab Switcher (Lagu / Lirik) */}
                        <div style={{ padding: "16px 20px 8px", display: "flex", justifyContent: "center", background: "var(--app-bg)" }}>
                            <div style={{
                                display: "flex",
                                background: "var(--app-bg-secondary)",
                                borderRadius: 16,
                                padding: 4,
                                border: "1px solid var(--app-border)",
                                gap: 4,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <button
                                    onClick={() => setActiveView("player")}
                                    style={{
                                        padding: "8px 36px",
                                        borderRadius: 12,
                                        border: "none",
                                        background: activeView === "player" ? "var(--app-surface)" : "transparent",
                                        color: activeView === "player" ? "var(--app-primary)" : "var(--app-text-muted)",
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        boxShadow: activeView === "player" ? "0 4px 10px rgba(0,0,0,0.1)" : "none",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                                    }}
                                >
                                    Lagu
                                </button>
                                <button
                                    onClick={() => setActiveView("lyrics")}
                                    style={{
                                        padding: "8px 36px",
                                        borderRadius: 12,
                                        border: "none",
                                        background: activeView === "lyrics" ? "var(--app-surface)" : "transparent",
                                        color: activeView === "lyrics" ? "var(--app-primary)" : "var(--app-text-muted)",
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        boxShadow: activeView === "lyrics" ? "0 4px 10px rgba(0,0,0,0.1)" : "none",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                                    }}
                                >
                                    Lirik
                                </button>
                            </div>
                        </div>

                        {/* Mobile Switchable Content Area */}
                        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            {activeView === "player" ? (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", alignItems: "center", justifyContent: "center" }}>
                                    {/* Disc View with Pulse */}
                                    <div style={{ position: "relative", marginBottom: 36 }}>
                                        <motion.div
                                            animate={room?.isPlaying ? { rotate: 360 } : {}}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                width: "75vw", maxWidth: 300, height: "75vw", maxHeight: 300,
                                                borderRadius: "50%",
                                                background: `linear-gradient(135deg, ${isDarkMode ? '#2D1B36' : '#FFF0F5'} 0%, ${isDarkMode ? '#1A0F20' : '#FFE4E1'} 100%)`,
                                                border: "6px solid var(--app-border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: room?.isPlaying ? "0 20px 60px rgba(0,0,0,0.4)" : "0 10px 30px rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            <div style={{
                                                width: "25%", height: "25%", borderRadius: "50%",
                                                background: "rgba(0,0,0,0.2)", border: "2px solid rgba(255,255,255,0.05)",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <MusicalNoteIcon style={{ width: "40%", height: "40%", color: "var(--app-primary)" }} />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Song Info */}
                                    <div style={{ textAlign: "center", marginBottom: 24, width: "100%" }}>
                                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--app-text)", letterSpacing: "-0.5px" }}>
                                            {room?.currentSong?.title || "Belum ada lagu"}
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: 16, color: "var(--app-primary)", fontWeight: 700 }}>
                                            {room?.currentSong?.artist || "Standby..."}
                                        </p>
                                    </div>

                                    {/* Progress Area */}
                                    <div style={{ width: "100%", maxWidth: 320, marginBottom: 36 }}>
                                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                                            <div style={{ height: "100%", width: `${progress}%`, background: "var(--app-primary)", borderRadius: 2 }} />
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.4 }}>{formatTime(currentTime)}</span>
                                            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.4 }}>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Controls Area */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, width: "100%" }}>
                                        <button onClick={() => setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; })}
                                            style={{ background: "none", border: "none", color: "var(--app-text-secondary)" }}>
                                            {muted ? <SpeakerXMarkIcon style={{ width: 22, height: 22 }} /> : <SpeakerWaveIcon style={{ width: 22, height: 22 }} />}
                                        </button>

                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={togglePlay}
                                            style={{
                                                width: 76, height: 76, borderRadius: "50%",
                                                background: isDarkMode ? "#fff" : "var(--app-primary)",
                                                color: isDarkMode ? "#000" : "#fff",
                                                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                            }}
                                        >
                                            {room?.isPlaying ? <PauseIcon style={{ width: 34, height: 34 }} /> : <PlayIcon style={{ width: 34, height: 34, marginLeft: 4 }} />}
                                        </motion.button>

                                        <button onClick={skipNext} style={{ background: "none", border: "none", color: "var(--app-text-secondary)" }}>
                                            <ForwardIcon style={{ width: 24, height: 24 }} />
                                        </button>
                                    </div>

                                    <div style={{ marginTop: 40 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--app-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                            🎵 Sinkronisasi dengan host
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <LyricsPanel
                                        lyrics={lyrics}
                                        activeIndex={activeIndex}
                                        autoScrollEnabled={autoScrollEnabled}
                                        setAutoScrollEnabled={setAutoScrollEnabled}
                                        isDarkMode={isDarkMode}
                                        isMobile={true}
                                    />
                                </div>
                            )}
                        </div>
                        {/* Visual spacer for bottom bar area */}
                        <div style={{ height: 84, flexShrink: 0 }} />
                    </div>
                </div>
            </div>

            {/* Mobile Tabbar */}
            <div className="mobile-tabbar" style={{
                position: "fixed", bottom: 0, left: 0, right: 0, height: 84,
                background: "var(--app-surface)", borderTop: "1.5px solid var(--app-border)",
                display: "none", alignItems: "center", justifyContent: "space-around",
                padding: "0 12px", zIndex: 1000
            }}>
                {[
                    { id: "queue", icon: QueueListIcon, label: "Antrian", action: () => { setMobileTab("queue"); setShowDrawer(true); } },
                    { id: "users", icon: UsersIcon, label: "Teman", action: () => { setMobileTab("users"); setShowDrawer(true); } },
                ].map(t => (
                    <button key={t.id} onClick={t.action}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", color: (activeView === t.id && !showDrawer) ? "var(--app-primary)" : "var(--app-text-muted)", transition: "all 0.2s" }}>
                        <t.icon style={{ width: 24, height: 24 }} />
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Drawer for Mobile */}
            <AnimatePresence>
                {showDrawer && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 3000 }} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            style={{
                                position: "fixed", bottom: 0, left: 0, right: 0,
                                background: "var(--app-surface)", borderRadius: "32px 32px 0 0",
                                padding: "32px 24px 60px", maxHeight: "85vh", overflowY: "auto", zIndex: 3100
                            }}
                        >
                            <div style={{ width: 40, height: 4, background: "var(--app-border)", borderRadius: 2, margin: "0 auto 30px" }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>{mobileTab === "queue" ? "Daftar Antrian" : "Teman Mendengar"}</h3>
                                <button onClick={() => setShowDrawer(false)} style={{ background: "var(--app-bg-secondary)", border: "none", padding: 10, borderRadius: "50%" }}><XMarkIcon style={{ width: 22, height: 22 }} /></button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {mobileTab === "queue" ? (
                                    room?.queue?.length > 0 ? room.queue.map((s: any) => (<QueueItem key={s.queueId} song={s} isHost={isHost} isActive={false} onPlay={() => { playFromQueue(s); setShowDrawer(false); }} onRemove={() => removeFromQueue(s)} />))
                                        : <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>Daftar kosong</div>
                                ) : roomUsersSorted.map(u => (<RoomUserCard key={u.uid} u={u} isHost={u.uid === room?.hostId} isMe={u.uid === user?.uid} />))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ReactionSystem roomId={rId} userId={user?.uid || ""} />

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 1023px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: flex !important; }
                    .mobile-tabbar { display: flex !important; }
                    .room-main-header { height: 64px !important; }
                    .sm-hidden { display: none; }
                    .mobile-view-toggle { display: block !important; }
                    .desktop-only-btn { display: none !important; }
                }
                @media (min-width: 1024px) {
                    .desktop-view { display: flex !important; }
                    .mobile-view { display: none !important; }
                    .mobile-tabbar { display: none !important; }
                }
                @keyframes room-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            ` }} />

            <SongManager isOpen={showSongs} onClose={() => setShowSongs(false)} onSongSelect={handleSongSelect} />

            {/* Immersive View Overlay */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 10000,
                            background: "#000", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden"
                        }}
                    >
                        {/* Smooth Neon Background - Optimized for Performance */}
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "radial-gradient(circle at 30% 50%, #1a0b2e 0%, #050208 100%)",
                            zIndex: 1,
                            willChange: "transform"
                        }} />

                        {/* Animated Neon Blobs - Lightened for performance (Fewer blobs, less blur) */}
                        <motion.div
                            animate={{
                                x: [0, 80, -60, 0],
                                y: [0, -70, 40, 0],
                                scale: [1, 1.2, 0.9, 1],
                                opacity: [0.2, 0.4, 0.3, 0.2]
                            }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                            style={{
                                position: "absolute", top: '10%', left: '10%', width: "60%", height: "60%",
                                background: "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
                                filter: "blur(40px)",
                                zIndex: 2,
                                willChange: "transform, opacity"
                            }}
                        />
                        <motion.div
                            animate={{
                                x: [0, -80, 50, 0],
                                y: [0, 50, -60, 0],
                                scale: [1.1, 0.9, 1.2, 1.1],
                                opacity: [0.15, 0.3, 0.2, 0.15]
                            }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: 2 }}
                            style={{
                                position: "absolute", bottom: '15%', right: '10%', width: "70%", height: "70%",
                                background: "radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)",
                                filter: "blur(50px)",
                                zIndex: 2,
                                willChange: "transform, opacity"
                            }}
                        />

                        {/* Top Left: Active Users - Positioned slightly differently to match image */}
                        <div style={{ position: "absolute", top: 48, left: 48, zIndex: 100, display: "flex", gap: 16 }}>
                            {roomUsersSorted.slice(0, 10).map((u, i) => (
                                <motion.div
                                    key={u.uid}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                                    style={{
                                        position: "relative",
                                        width: 56, height: 56, borderRadius: "50%",
                                        padding: 3,
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        backdropFilter: "blur(12px)",
                                        boxShadow: u.status === "online" ? "0 0 25px rgba(255, 72, 153, 0.1)" : "none"
                                    }}
                                >
                                    <div style={{
                                        width: "100%", height: "100%", borderRadius: "50%",
                                        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                                        background: "#111",
                                        position: "relative"
                                    }}>
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt={u.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{
                                                width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                                                background: "#1a1a2e", color: "rgba(255,255,255,0.4)",
                                                fontSize: 16, fontWeight: 900,
                                                letterSpacing: "-0.5px"
                                            }}>
                                                {getInitials(u.displayName)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Status Glow Indicator */}
                                    {u.status === "online" && (
                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            style={{
                                                position: "absolute", bottom: 2, right: 2,
                                                width: 14, height: 14, borderRadius: "50%",
                                                background: "var(--app-primary)",
                                                border: "2.5px solid #000",
                                                boxShadow: "0 0 10px var(--app-primary)"
                                            }}
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Top Right: Fullscreen Exit */}
                        <div style={{ position: "absolute", top: 40, right: 40, zIndex: 100 }}>
                            <motion.button
                                whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleFullscreen}
                                style={{
                                    width: 56, height: 56, borderRadius: "50%",
                                    background: "rgba(255,255,255,0.05)",
                                    backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
                                    color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                                }}
                            >
                                <ArrowsPointingInIcon style={{ width: 24, height: 24 }} />
                            </motion.button>
                        </div>

                        {/* Queue Popup - Repositioned to be above bottom bar */}
                        <AnimatePresence>
                            {showImmersiveQueue && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    style={{
                                        position: "absolute", bottom: 124, left: "50%", transform: "translateX(-50%)",
                                        width: "min(420px, 90vw)", maxHeight: "55vh",
                                        background: "rgba(10, 5, 15, 0.85)", backdropFilter: "blur(20px)", // Optimized
                                        borderRadius: 28, border: "1px solid rgba(255,255,255,0.1)",
                                        boxShadow: "0 -20px 80px rgba(0,0,0,0.7)", overflow: "hidden",
                                        display: "flex", flexDirection: "column", zIndex: 1000
                                    }}
                                >
                                    <div style={{ padding: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <QueueListIcon style={{ width: 18, height: 18, color: "var(--app-primary)" }} />
                                            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Daftar Antrian</h3>
                                        </div>
                                        <button onClick={() => setShowSongs(true)} style={{
                                            padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "none",
                                            color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                                        }}>
                                            + Tambah
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                                        {room?.queue?.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                {room.queue.map((s: any) => (
                                                    <QueueItem
                                                        key={s.queueId}
                                                        song={s}
                                                        isHost={isHost}
                                                        isActive={false}
                                                        onPlay={() => playFromQueue(s)}
                                                        onRemove={() => removeFromQueue(s)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: 60, textAlign: "center", opacity: 0.3 }}>
                                                <MusicalNoteIcon style={{ width: 32, height: 32, margin: "0 auto 16px" }} />
                                                <p style={{ fontSize: 13, fontWeight: 700 }}>Antrian masih kosong</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Immersive Layout - Optimized for user's image */}
                        <div style={{
                            position: "relative", zIndex: 10, width: "100%", height: "100%",
                            display: "flex", alignItems: "center", justifyContent: "flex-start",
                            padding: "0 100px"
                        }}>
                            {/* Vinyl Disc Section - Larger as requested */}
                            <div style={{
                                position: "relative",
                                width: "min(680px, 46vw)",
                                height: "min(680px, 46vw)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: "2%"
                            }}>
                                {/* The Record / Piringan - Use darkMode path as requested */}
                                <div
                                    style={{
                                        width: "100%", height: "100%",
                                        borderRadius: "50%",
                                        background: `url('/images/piringan-darkMode.png') center/cover no-repeat`,
                                        boxShadow: "0 80px 150px rgba(0,0,0,0.9)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        position: "relative",
                                        animation: "room-spin 12s linear infinite",
                                        animationPlayState: room?.isPlaying ? "running" : "paused",
                                        willChange: "transform"
                                    }}
                                >
                                    {/* Center Cover */}
                                    <div style={{
                                        width: "28%", height: "28%", borderRadius: "50%",
                                        background: "var(--app-primary)", border: "5px solid #000",
                                        overflow: "hidden", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
                                    }}>
                                        <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <MusicalNoteIcon style={{ width: "45%", height: "45%", color: "#fff", opacity: 0.8 }} />
                                        </div>
                                    </div>
                                </div>

                                {/* The Tonearm / Stik - Larger and correctly pivoted, use darkMode path */}
                                {/* 
                                   TUTORIAL CUSTOMIZE TONEARM (STIK):
                                   - bottom: Geser ke atas (positif) atau bawah (negatif)
                                   - right: Geser ke kiri (positif) atau kanan (negatif)
                                   - width/height: Ukuran tonearm
                                   - transformOrigin: TITIK PUSAT rotasi. (Contoh: "82.5% 82.5%")
                                */}
                                <motion.div
                                    initial={false}
                                    animate={{ rotate: room?.isPlaying ? 0 : -32 }}
                                    transition={{ type: "spring", stiffness: 45, damping: 12 }}
                                    style={{
                                        position: "absolute",
                                        bottom: "-25%", // Geser manual di sini
                                        right: "-10%",  // Geser manual di sini 
                                        width: "80%",  // Ukuran manual di sini
                                        height: "80%", // Ukuran manual di sini
                                        background: `url('/images/turntableTonearm-darkMode.png') center/contain no-repeat`,
                                        transformOrigin: "80% 50%", // TITIK PUSAT (ORIGIN) DI SINI
                                        zIndex: 15,
                                        pointerEvents: "none",
                                        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
                                        willChange: "transform"
                                    }}
                                />
                            </div>

                            {/* Lyrics "Box" Section - Positioned top-rightish as in the image */}
                            <div style={{
                                position: "absolute",
                                top: 120,
                                right: 100,
                                width: "clamp(300px, 30vw, 450px)",
                                bottom: 140,
                                display: "flex",
                                flexDirection: "column",
                                zIndex: 10
                            }}>
                                <LyricsPanel
                                    lyrics={lyrics}
                                    activeIndex={activeIndex}
                                    autoScrollEnabled={true}
                                    setAutoScrollEnabled={() => { }}
                                    isDarkMode={true}
                                    isDesktopInline={true}
                                    isImmersive={true}
                                />
                            </div>
                        </div>

                        {/* Controls Overlay (Bottom Center) */}
                        <div style={{
                            position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
                            display: "flex", alignItems: "center", gap: 0, zIndex: 20,
                            background: "rgba(10, 5, 20, 0.45)", borderRadius: 36,
                            backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)",
                            padding: "10px",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
                        }}>
                            {/* Section 1: Music Playback Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "0 28px" }}>
                                <button onClick={() => setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; })}
                                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s" }}>
                                    {muted ? <SpeakerXMarkIcon style={{ width: 22, height: 22 }} /> : <SpeakerWaveIcon style={{ width: 22, height: 22 }} />}
                                </button>

                                <motion.button
                                    whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    style={{
                                        background: "#fff", color: "#000", border: "none",
                                        width: 56, height: 56, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer"
                                    }}
                                >
                                    {room?.isPlaying ? <PauseIcon style={{ width: 28, height: 28 }} /> : <PlayIcon style={{ width: 28, height: 28, marginLeft: 2 }} />}
                                </motion.button>

                                <button onClick={skipNext} disabled={!isHost || !room?.queue?.length}
                                    style={{ background: "none", border: "none", color: isHost && room?.queue?.length ? "#fdfdfd" : "rgba(255,255,255,0.2)", cursor: isHost && room?.queue?.length ? "pointer" : "default", transition: "all 0.2s" }}>
                                    <ForwardIcon style={{ width: 22, height: 22 }} />
                                </button>
                            </div>

                            {/* Thin Divider Line */}
                            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.12)" }} />

                            {/* Section 2: Queue & Add Music Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 28px" }}>
                                <motion.button
                                    whileHover={{ scale: 1.15, color: "#fff" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowImmersiveQueue(!showImmersiveQueue)}
                                    style={{
                                        background: "none", border: "none",
                                        color: showImmersiveQueue ? "var(--app-primary)" : "rgba(255,255,255,0.45)",
                                        cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s"
                                    }}
                                >
                                    <QueueListIcon style={{ width: 24, height: 24 }} />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.15, color: "#fff" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowSongs(true)}
                                    style={{
                                        background: "none", border: "none",
                                        color: "rgba(255,255,255,0.45)",
                                        cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s"
                                    }}
                                >
                                    <PlusIcon style={{ width: 24, height: 24 }} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function RoomPage() {
    return (
        <ToastProvider>
            <RoomInner />
        </ToastProvider>
    );
}
