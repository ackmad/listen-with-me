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
            background: "var(--bg-primary)",
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
                        background: "var(--bg-card)",
                        border: "2px solid var(--border-soft)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "var(--shadow-strong)",
                    }}
                >
                    <MusicalNoteIcon style={{ width: 36, height: 36, color: "var(--accent-primary)" }} />
                </motion.div>
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 2.2], opacity: [0.25, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
                        style={{
                            position: "absolute", inset: 0, borderRadius: "50%",
                            border: "1.5px solid var(--accent-primary)",
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
                    <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                        {songTitle}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{artist}</p>
                </motion.div>
            )}

            <div style={{ display: "flex", gap: 5, alignItems: "flex-end", marginBottom: 24, height: 28 }}>
                {[1, 2, 3, 4, 5, 4, 3, 2].map((h, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: [h * 4, h * 4 + 14, h * 4] }}
                        transition={{ duration: 0.7 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                        style={{ width: 4, background: "var(--accent-primary)", borderRadius: 4, minHeight: 4 }}
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
                        color: "var(--text-muted)",
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
            minHeight: "100vh", background: "var(--bg-primary)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 20,
            transition: "var(--theme-transition)",
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: "3px solid var(--border-soft)",
                    borderTopColor: "var(--accent-primary)",
                }}
            />
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-fredoka)", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
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
            background: role === "Host" ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: role === "Host" ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${role === "Host" ? "var(--accent-hover)" : "var(--border-soft)"}`,
            flexShrink: 0,
            boxShadow: role === "Host" ? "var(--shadow-soft)" : "none",
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
            background: isHost ? "var(--bg-secondary)" : "var(--bg-card)",
            border: `1px solid ${isHost ? "var(--accent-primary)" : "var(--border-soft)"}`,
            transition: "var(--theme-transition)",
        }}>
            <div style={{
                position: "relative", flexShrink: 0,
                width: 38, height: 38, borderRadius: "50%",
                background: isHost ? "var(--accent-primary)" : "var(--bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: isHost ? "#fff" : "var(--text-secondary)",
                border: `2px solid ${isHost ? "#fff" : "var(--border-soft)"}`,
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: u.status === "idle" ? "#fbbf24" : "#22C55E",
                    border: "2px solid var(--bg-card)",
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: isHost ? 800 : 600,
                        color: "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe ? " (kamu)" : ""}
                    </p>
                    <RoleBadge role={isHost ? "Host" : "Tamu"} />
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: u.status === "idle" ? "#d97706" : "#22C55E", fontWeight: 700 }}>
                    {u.status === "idle" ? "Sedang idle" : "Aktif sekarang"}
                </p>
            </div>
        </div>
    );
}

// ─── Queue Item ───────────────────────────────────────────────────────────
function QueueItem({ song, isHost, isActive, index, onPlay, onRemove }: { song: any; isHost: boolean; isActive: boolean; index?: number; onPlay: () => void; onRemove?: () => void }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            onClick={isHost ? onPlay : undefined}
            style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                background: isActive ? "var(--bg-secondary)" : hov ? "var(--bg-card)" : "transparent",
                border: `1.5px solid ${isActive ? "var(--accent-primary)" : hov ? "var(--border-soft)" : "transparent"}`,
                cursor: isHost ? "pointer" : "default", transition: "all 0.2s ease", minHeight: 48,
                position: "relative",
            }}
        >
            {index !== undefined && (
                <div style={{ width: 20, textAlign: "center", fontSize: 13, fontWeight: 800, color: "var(--text-muted)", opacity: hov || isActive ? 1 : 0.6 }}>
                    {index}
                </div>
            )}
            <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: isActive ? "var(--accent-primary)" : "var(--bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isActive ? "#fff" : "var(--text-muted)",
            }}>
                {isHost && hov && !isActive
                    ? <PlayIcon style={{ width: 14, height: 14 }} />
                    : <MusicalNoteIcon style={{ width: 14, height: 14 }} />
                }
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: isActive ? "var(--accent-primary)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.artist} {song.requestedBy ? `• dari ${song.requestedBy}` : ""}
                </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {isHost && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                        style={{
                            padding: 6, borderRadius: 8, border: "none", background: "transparent",
                            color: "var(--text-muted)", cursor: "pointer", transition: "all 0.2s",
                            display: hov ? "flex" : "none",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
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
                                style={{ width: 3, background: "var(--accent-primary)", borderRadius: 2 }}
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
    const [showPerfectSync, setShowPerfectSync] = useState(false);

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
    const [isMobileScreen, setIsMobileScreen] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [showImmersiveQueue, setShowImmersiveQueue] = useState(false);

    // Custom states for Immersive Mobile Landscape Menu
    const [showImmersiveMobileMenu, setShowImmersiveMobileMenu] = useState(false);
    const [immersiveMobileTab, setImmersiveMobileTab] = useState<"add" | "queue">("add");
    const [immersiveMobileSearch, setImmersiveMobileSearch] = useState("");

    useEffect(() => {
        const checkMobile = () => {
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            setIsMobileScreen(window.innerWidth <= 1024 || (isTouch && window.innerWidth <= 1366));
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                if (window.screen?.orientation && window.innerWidth <= 1024) {
                    (window.screen.orientation as any).lock('landscape').catch(() => {
                        console.warn("Auto-landscape lock not supported by browser, falling back to CSS.");
                    });
                }
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                if (window.screen?.orientation && (window.screen.orientation as any).unlock) {
                    (window.screen.orientation as any).unlock();
                }
            }).catch(() => { });
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
            const fn = () => {
                tryPlay();
                setIsSyncing(false);
                if (syncTimeout.current) clearTimeout(syncTimeout.current);

                // Trigger perfect sync glow when it successfully catches up
                if (!isHost && room?.isPlaying) {
                    setShowPerfectSync(true);
                    setTimeout(() => setShowPerfectSync(false), 2000);
                }
            };
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

        // If no song is playing and no song is selected, but queue is not empty, play first song
        if (!room?.isPlaying && !room?.currentSong) {
            if (room?.queue?.length > 0) {
                const next = room.queue[0];
                await updateDoc(doc(db, "rooms", rId), {
                    currentSong: next || null,
                    queue: room.queue.slice(1),
                    isPlaying: true,
                    startedAt: serverTimestamp(),
                });
                setSongsPlayed(p => p + 1);
            }
            return;
        }

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
            borderLeft: "1.5px solid var(--border-soft)",
            background: "var(--bg-card)",
            display: "flex", flexDirection: "column",
            transition: "var(--theme-transition)",
            height: "100%", overflowY: "auto",
        }}>
            {/* Active Users */}
            <div style={{ padding: "24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UsersIcon style={{ width: 16, height: 16, color: "var(--accent-primary)" }} />
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

            <div style={{ height: 1.5, background: "var(--border-soft)", margin: "0 20px" }} />

            {/* Queue */}
            <div style={{ padding: "24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <QueueListIcon style={{ width: 16, height: 16, color: "var(--accent-primary)" }} />
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            List Antrian
                        </h3>
                    </div>
                    {isHost && (
                        <button onClick={addRandomSongs} style={{ padding: "4px 10px", borderRadius: 10, border: "none", background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                            🎲 RANDOM 5
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {room?.queue?.length > 0 ? (
                        room.queue.map((s: any, i: number) => (
                            <QueueItem key={s.queueId || `q-${i}`} song={s} isHost={isHost} isActive={false} index={i + 1} onPlay={() => playFromQueue(s)} onRemove={() => removeFromQueue(s)} />
                        ))
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", border: "1.5px dashed var(--border-soft)", borderRadius: 20, gap: 12 }}>
                            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: 700, fontSize: 13 }}>Antrian masih kosong</p>
                            <button onClick={() => setShowSongs(true)} style={{ background: "none", border: "none", color: "var(--accent-primary)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Tambah Lagu</button>
                        </div>
                    )}
                </div>
            </div>
            {/* Version */}
            <div style={{ padding: 12, textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", opacity: 0.5 }}>v0.11</span>
            </div>
        </aside>
    );

    const desktopPlayerContent = (
        <div className="room-player-panel" style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: lyrics && lyrics.length > 0 ? 60 : 0, width: "100%", maxWidth: lyrics && lyrics.length > 0 ? 1100 : 800, justifyContent: "center", transition: "all 0.5s ease" }}>

                    {/* Disc Section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ position: "relative", marginBottom: 40 }}>
                            <motion.div
                                animate={room?.isPlaying && room?.currentSong ? { rotate: 360 } : { rotate: 0 }}
                                transition={room?.isPlaying && room?.currentSong ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                                style={{
                                    width: lyrics && lyrics.length > 0 ? 320 : 460,
                                    height: lyrics && lyrics.length > 0 ? 320 : 460,
                                    borderRadius: "50%",
                                    background: "var(--vinyl-disc)",
                                    border: "6px solid var(--vinyl-border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: room?.isPlaying
                                        ? "0 0 80px var(--accent-glow), 0 30px 100px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.2)"
                                        : "0 20px 50px rgba(0,0,0,0.25)",
                                    transition: "width 0.5s ease, height 0.5s ease"
                                }}
                            >
                                <div style={{
                                    width: lyrics && lyrics.length > 0 ? 80 : 120,
                                    height: lyrics && lyrics.length > 0 ? 80 : 120,
                                    borderRadius: "50%",
                                    background: "var(--vinyl-center)", border: "3px solid var(--vinyl-border)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "width 0.5s ease, height 0.5s ease",
                                    position: "relative"
                                }}>
                                    <MusicalNoteIcon style={{ width: 32, height: 32, color: room?.currentSong ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.15)", position: "relative", zIndex: 1 }} />
                                    <div style={{
                                        width: 6, height: 6, borderRadius: "50%", background: "#000",
                                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                                        zIndex: 2, boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)"
                                    }} />
                                </div>
                            </motion.div>
                        </div>

                        <div style={{ textAlign: "center", width: "100%" }}>
                            <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "var(--text-primary)" }}>
                                {room?.currentSong?.title || "Belum ada lagu"}
                            </h2>
                            <p style={{ margin: "0 0 32px", fontSize: 18, color: "var(--accent-primary)", fontWeight: 700 }}>
                                {room?.currentSong?.artist || (isHost ? "Klik Request untuk mulai!" : "Menunggu host...")}
                            </p>

                            {/* Progress Area (Desktop) */}
                            <div style={{ width: "100%", maxWidth: 400, margin: "0 auto 32px" }}>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-primary)", borderRadius: 3, transition: "width 0.1s linear" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{formatTime(currentTime)}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center" }}>
                                <button onClick={() => setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; })}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border-soft)", borderRadius: "50%", cursor: "pointer", color: "var(--text-secondary)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {muted ? <SpeakerXMarkIcon style={{ width: 18, height: 18 }} /> : <SpeakerWaveIcon style={{ width: 18, height: 18 }} />}
                                </button>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={togglePlay} disabled={!isHost || !room?.currentSong}
                                    style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: "var(--accent-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 30px var(--accent-glow)" }}>
                                    {room?.isPlaying ? <PauseIcon style={{ width: 28, height: 28 }} /> : <PlayIcon style={{ width: 28, height: 28, marginLeft: 3 }} />}
                                </motion.button>
                                <button onClick={skipNext} disabled={!isHost || !room?.queue?.length}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid var(--border-soft)", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <ForwardIcon style={{ width: 18, height: 18 }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inline Lyrics Section (Conditional) */}
                    {lyrics && lyrics.length > 0 && (
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
                    )}
                </div>
            </div>

            {/* Tiny text at bottom */}
            <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MusicalNoteIcon style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Sinkronisasi Dengan Host Aktif
                </span>
            </div>
        </div>
    );

    // ─── Mobile Views (iOS Style) ───────────────────────────────────────────

    const SyncIndicator = ({ isDarkBg = false, isImmersiveMobile = false }) => {
        if (!room?.isPlaying) return null;
        const isRealtimeSynced = !isSyncing;
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={isRealtimeSynced ? "sync" : "wait"}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: isRealtimeSynced
                            ? "var(--accent-glow)"
                            : "rgba(100,100,100,0.05)",
                        marginBottom: isImmersiveMobile ? 12 : 16,
                        backdropFilter: "blur(4px)",
                        border: isRealtimeSynced ? "1px solid var(--accent-soft)" : "1px solid rgba(0,0,0,0.03)"
                    }}
                >
                    <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isRealtimeSynced
                            ? "var(--accent-primary)"
                            : "var(--text-muted)",
                        letterSpacing: "0.02em"
                    }}>
                        {isRealtimeSynced ? "Sinkron banget sekarang 💫" : "🕒 Lagi nyesuain detik…"}
                    </span>
                </motion.div>
            </AnimatePresence>
        );
    };

    const mobilePlayerView = (
        <div className="room-player-panel" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 60px", background: "var(--bg-primary)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {/* Large Apple-style disc */}
                <motion.div
                    animate={room?.isPlaying ? { rotate: 360 } : {}}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{
                        width: "85vw", maxWidth: 320, height: "85vw", maxHeight: 320,
                        borderRadius: 32, background: "var(--vinyl-disc)",
                        boxShadow: room?.isPlaying
                            ? "0 40px 80px rgba(0,0,0,0.35), 0 0 50px var(--accent-glow)"
                            : "0 30px 60px rgba(0,0,0,0.2)",
                        marginBottom: 48, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >
                    <div style={{
                        width: "20%", height: "20%", borderRadius: "50%",
                        background: "var(--vinyl-center)", border: "2px solid var(--vinyl-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative"
                    }}>
                        <MusicalNoteIcon style={{ width: "40%", height: "40%", color: "rgba(0,0,0,0.3)", position: "relative", zIndex: 1 }} />
                        <div style={{
                            width: "15%", height: "15%", borderRadius: "50%", background: "#000",
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            zIndex: 2, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)"
                        }} />
                    </div>
                </motion.div>

                <div style={{ width: "100%", marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{room?.currentSong?.title || "Belum ada lagu"}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 18, color: "var(--text-secondary)", fontWeight: 600 }}>{room?.currentSong?.artist || "Standby..."}</p>
                </div>

                <SyncIndicator isDarkBg={isDarkMode} />

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
        <div className="room-player-panel" style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
            {/* Small header for lyrics view */}
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MusicalNoteIcon style={{ width: 20, height: 20, color: "var(--accent-primary)" }} />
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
        <div className="room-page" style={{
            height: "100vh", overflow: "hidden", background: "var(--bg-primary)", color: "var(--text-primary)",
            fontFamily: "var(--font-geist-sans), sans-serif",
            display: "flex", flexDirection: "column",
            transition: "var(--theme-transition)",
        }}>
            {/* 🌌 Night Sky Layer — Only active in night mode via CSS */}
            <div className="night-sky-layer">
                <div className="night-nebula" />
                <div className="star-layer star-far" />
                <div className="star-layer star-mid" />
                <div className="star-layer star-near" />
                <div className="meteor" style={{ top: '5%', left: '90%', animationDelay: '2s', animationDuration: '8s' }} />
                <div className="meteor" style={{ top: '20%', left: '95%', animationDelay: '7s', animationDuration: '11s' }} />
            </div>
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
                onCanPlay={() => {
                    setIsSyncing(false);
                    if (syncTimeout.current) clearTimeout(syncTimeout.current);

                    if (!isHost && room?.isPlaying && !isSyncing) {
                        setShowPerfectSync(true);
                        setTimeout(() => setShowPerfectSync(false), 2000);
                    }
                }}
                onEnded={handleAudioEnded}
                onError={() => setIsSyncing(false)}
                preload="auto"
            />

            <AnimatePresence>
                {showPerfectSync && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 100,
                            background: "radial-gradient(circle at center, rgba(255,110,181,0.10), transparent 65%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {/* Sparkle dots around center */}
                        <div className="night-sparkle" style={{ top: "38%", left: "42%", animationDelay: "0.1s" }} />
                        <div className="night-sparkle" style={{ top: "36%", left: "58%", animationDelay: "0.35s" }} />
                        <div className="night-sparkle" style={{ top: "62%", left: "45%", animationDelay: "0.2s" }} />
                        <div className="night-sparkle" style={{ top: "60%", left: "55%", animationDelay: "0.5s" }} />
                        <motion.span
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            style={{
                                color: "rgba(255,110,181,0.9)",
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: "var(--font-fredoka)",
                                letterSpacing: "0.05em",
                                filter: "drop-shadow(0 0 8px rgba(255,110,181,0.4))",
                                marginTop: "120px"
                            }}
                        >
                            Langitnya lagi cantik ya 🌙
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(isSyncing || needsInteraction) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
                        {needsInteraction ? (
                            <div style={{ position: "absolute", inset: 0, background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 32, textAlign: "center" }}>
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--bg-secondary)", border: "2px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <MusicalNoteIcon style={{ width: 40, height: 40, color: "var(--accent-primary)" }} />
                                </motion.div>
                                <div>
                                    <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900 }}>Siap untuk Mendengarkan?</h2>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>Tap tombol di bawah untuk bergabung!</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={async () => { if (audioRef.current) await audioRef.current.play(); setNeedsInteraction(false); }}
                                    style={{ padding: "18px 40px", borderRadius: 24, background: "var(--accent-primary)", border: "none", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 30px var(--accent-glow)" }}>
                                    Gabung & Sinkron →
                                </motion.button>
                            </div>
                        ) : <SyncScreen songTitle={room?.currentSong?.title} artist={room?.currentSong?.artist} />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📱 Mobile Simple Navbar (Liquid Glass) */}
            <div className="mobile-simple-navbar" style={{
                position: "fixed", top: 16, left: 16, right: 16, zIndex: 1000,
                height: 60, display: "none", alignItems: "center", justifyContent: "space-between",
                padding: "0 12px 0 16px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 30,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.05)",
                transition: "var(--theme-transition)",
            }}>
                <button onClick={() => router.push("/dashboard")} style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.2s ease"
                }}>
                    <ArrowLeftIcon style={{ width: 20, height: 20 }} />
                </button>

                <div style={{ textAlign: "center", flex: 1, padding: "0 12px" }}>
                    <h1 style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {room?.name || "Loading..."}
                    </h1>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "var(--accent-primary)", opacity: 0.9 }}>
                        {isHost ? "KONTROL HOST" : "MENDENGARKAN"}
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={toggleFullscreen} style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)",
                        color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {isFullscreen ? <ArrowsPointingInIcon style={{ width: 18, height: 18 }} /> : <ArrowsPointingOutIcon style={{ width: 18, height: 18 }} />}
                    </button>
                    <button onClick={() => setShowSongs(true)} style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "var(--accent-primary)", border: "none",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 20px var(--accent-glow)"
                    }}>
                        <PlusIcon style={{ width: 22, height: 22 }} />
                    </button>
                </div>
            </div>

            {/* Main Header (Mostly for desktop) */}
            <header className="room-main-header" style={{
                padding: "0 24px", height: 72,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1.5px solid var(--border-soft)",
                background: "var(--bg-card)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 50, flexShrink: 0
            }}>
                <button onClick={() => router.push("/dashboard")} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                    borderRadius: 20, background: "var(--bg-secondary)", border: "1px solid var(--border-soft)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 800
                }}>
                    <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Keluar
                </button>

                <div className="header-center-info" style={{ textAlign: "center", flex: 1, padding: "0 20px" }}>
                    <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{room?.name || "Room"}</h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                        <MusicalNoteIcon style={{ width: 14, height: 14, color: "var(--accent-primary)" }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>{isHost ? "👑 HOST" : "TAMU"}{sessionMinutes > 0 ? ` • ${sessionMinutes}M` : ""}</span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={toggleFullscreen}
                        style={{
                            padding: 10, background: "var(--bg-secondary)",
                            borderRadius: "50%", border: "none", color: "var(--text-primary)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                    >
                        {isFullscreen ? <ArrowsPointingInIcon style={{ width: 20, height: 20 }} /> : <ArrowsPointingOutIcon style={{ width: 20, height: 20 }} />}
                    </button>
                    {/* Mobile toggle removed as it's now in tabs */}
                    <button onClick={() => setShowSongs(true)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "12px 24px",
                        borderRadius: 24, background: "var(--accent-primary)",
                        border: "none", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
                        boxShadow: "0 8px 20px var(--accent-glow)"
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
                    <div className="mobile-view room-player-panel" style={{
                        flex: 1, display: "none", flexDirection: "column", overflow: "hidden",
                        background: "var(--bg-primary)",
                        paddingTop: 96, // Ample space for floating header
                    }}>

                        {/* Mobile Tab Switcher (Lagu / Lirik) */}
                        <div className="room-player-panel" style={{ padding: "0 20px 8px", display: "flex", justifyContent: "center", background: "var(--bg-primary)" }}>
                            <div style={{
                                display: "flex",
                                background: "var(--bg-secondary)",
                                borderRadius: 16,
                                padding: 4,
                                border: "1px solid var(--border-soft)",
                                gap: 4,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <button
                                    onClick={() => setActiveView("player")}
                                    style={{
                                        padding: "8px 36px",
                                        borderRadius: 12,
                                        border: "none",
                                        background: activeView === "player" ? "var(--bg-card)" : "transparent",
                                        color: activeView === "player" ? "var(--accent-primary)" : "var(--text-muted)",
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
                                        background: activeView === "lyrics" ? "var(--bg-card)" : "transparent",
                                        color: activeView === "lyrics" ? "var(--accent-primary)" : "var(--text-muted)",
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
                                                background: "var(--vinyl-disc)",
                                                border: "6px solid var(--vinyl-border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: room?.isPlaying
                                                    ? "0 30px 90px rgba(0,0,0,0.4), 0 0 50px var(--accent-glow)"
                                                    : "0 10px 40px rgba(0,0,0,0.2)",
                                            }}
                                        >
                                            <div style={{
                                                width: "25%", height: "25%", borderRadius: "50%",
                                                background: "var(--vinyl-center)", border: "2px solid var(--vinyl-border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                position: "relative"
                                            }}>
                                                <MusicalNoteIcon style={{ width: "40%", height: "40%", color: "rgba(0,0,0,0.3)", position: "relative", zIndex: 1 }} />
                                                <div style={{
                                                    width: "15%", height: "15%", borderRadius: "50%", background: "#000",
                                                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                                                    zIndex: 2, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)"
                                                }} />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Song Info */}
                                    <div style={{ textAlign: "center", marginBottom: 24, width: "100%" }}>
                                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                                            {room?.currentSong?.title || "Belum ada lagu"}
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: 16, color: "var(--accent-primary)", fontWeight: 700 }}>
                                            {room?.currentSong?.artist || "Standby..."}
                                        </p>
                                    </div>

                                    {/* Progress Area */}
                                    <div style={{ width: "100%", maxWidth: 320, marginBottom: 36 }}>
                                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                                            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-primary)", borderRadius: 2 }} />
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.4 }}>{formatTime(currentTime)}</span>
                                            <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.4 }}>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Controls Area */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, width: "100%" }}>
                                        <button onClick={() => setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; })}
                                            style={{ background: "none", border: "none", color: "var(--text-secondary)" }}>
                                            {muted ? <SpeakerXMarkIcon style={{ width: 22, height: 22 }} /> : <SpeakerWaveIcon style={{ width: 22, height: 22 }} />}
                                        </button>

                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={togglePlay}
                                            style={{
                                                width: 76, height: 76, borderRadius: "50%",
                                                background: isDarkMode ? "#fff" : "var(--accent-primary)",
                                                color: isDarkMode ? "#000" : "#fff",
                                                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                            }}
                                        >
                                            {room?.isPlaying ? <PauseIcon style={{ width: 34, height: 34 }} /> : <PlayIcon style={{ width: 34, height: 34, marginLeft: 4 }} />}
                                        </motion.button>

                                        <button onClick={skipNext} style={{ background: "none", border: "none", color: "var(--text-secondary)" }}>
                                            <ForwardIcon style={{ width: 24, height: 24 }} />
                                        </button>
                                    </div>

                                    <div style={{ marginTop: 24, marginBottom: 12 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
                        {/* Visual spacer for bottom bar & chat input area */}
                        <div style={{ height: 180, flexShrink: 0 }} />
                    </div>
                </div>
            </div>

            {/* Mobile Tabbar (Liquid Glass) */}
            <div className="mobile-tabbar" style={{
                position: "fixed", bottom: 20, left: 24, right: 24, height: 64,
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 32,
                display: "none", alignItems: "center", justifyContent: "space-around",
                padding: "0 12px", zIndex: 1000,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
                {[
                    { id: "queue", icon: QueueListIcon, label: "Antrian", action: () => { setMobileTab("queue"); setShowDrawer(true); } },
                    { id: "users", icon: UsersIcon, label: "Teman", action: () => { setMobileTab("users"); setShowDrawer(true); } },
                ].map(t => (
                    <button key={t.id} onClick={t.action}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", color: (activeView === t.id && !showDrawer) ? "var(--accent-primary)" : "var(--text-muted)", transition: "all 0.2s" }}>
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
                                background: "var(--bg-card)", borderRadius: "32px 32px 0 0",
                                padding: "32px 24px 60px", maxHeight: "85vh", overflowY: "auto", zIndex: 3100
                            }}
                        >
                            <div style={{ width: 40, height: 4, background: "var(--border-soft)", borderRadius: 2, margin: "0 auto 30px" }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>{mobileTab === "queue" ? "Daftar Antrian" : "Teman Mendengar"}</h3>
                                <button onClick={() => setShowDrawer(false)} style={{ background: "var(--bg-secondary)", border: "none", padding: 10, borderRadius: "50%" }}><XMarkIcon style={{ width: 22, height: 22 }} /></button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {mobileTab === "queue" ? (
                                    room?.queue?.length > 0 ? room.queue.map((s: any, i: number) => (<QueueItem key={s.queueId || `dq-${i}`} song={s} isHost={isHost} isActive={false} onPlay={() => { playFromQueue(s); setShowDrawer(false); }} onRemove={() => removeFromQueue(s)} />))
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
                @media (max-width: 1024px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: flex !important; }
                    .mobile-tabbar { display: flex !important; }
                    .room-main-header { display: none !important; }
                    .mobile-simple-navbar { display: flex !important; }
                    .sm-hidden { display: none; }
                    .mobile-view-toggle { display: block !important; }
                    .desktop-only-btn { display: none !important; }
                }
                @media (max-width: 1024px) and (orientation: portrait) {
                    .mobile-fullscreen-force-landscape {
                        transform: rotate(90deg) !important;
                        transform-origin: top left !important;
                        width: 100vh !important;
                        height: 100vw !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 100% !important;
                    }
                }
                @media (max-width: 1024px) and (orientation: landscape) {
                    .mobile-fullscreen-force-landscape {
                        width: 100vw !important;
                        height: 100vh !important;
                    }
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

            <SongManager isOpen={showSongs} onClose={() => setShowSongs(false)} onSongSelect={handleSongSelect} onAddRandom={addRandomSongs} />

            {/* Immersive View Overlay */}
            <AnimatePresence>
                {isFullscreen && !isMobileScreen && (
                    <motion.div
                        key="immersive-desktop"
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
                                                background: "var(--accent-primary)",
                                                border: "2.5px solid #000",
                                                boxShadow: "0 0 10px var(--accent-primary)"
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
                                            <QueueListIcon style={{ width: 18, height: 18, color: "var(--accent-primary)" }} />
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
                                                {room.queue.map((s: any, i: number) => (
                                                    <QueueItem
                                                        key={s.queueId}
                                                        song={s}
                                                        isHost={isHost}
                                                        isActive={false}
                                                        index={i + 1}
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
                                        animationPlayState: room?.isPlaying && room?.currentSong ? "running" : "paused",
                                        willChange: "transform"
                                    }}
                                >
                                    {/* Center Cover */}
                                    <div style={{
                                        width: "28%", height: "28%", borderRadius: "50%",
                                        background: "var(--accent-primary)", border: "5px solid #000",
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
                                    animate={{ rotate: room?.isPlaying && room?.currentSong ? 0 : -32 }}
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

                            {/* Song Info & Lyrics Section - Positioned right side, parallel to disc */}
                            <div style={{
                                position: "absolute",
                                right: "clamp(40px, 8vw, 120px)",
                                width: "clamp(300px, 35vw, 500px)",
                                height: "min(680px, 46vw)", // Sejajar (vertikal sama) dengan piringan
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                zIndex: 10
                            }}>
                                {/* Song Title & Artist Header */}
                                <div style={{
                                    marginBottom: 32,
                                    paddingLeft: 24, // Agak indent agar sejajar lirik
                                    borderLeft: "4px solid var(--accent-primary)"
                                }}>
                                    <motion.h2
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={room?.currentSong?.title}
                                        style={{
                                            margin: "0 0 10px 0",
                                            fontSize: "clamp(32px, 3vw, 44px)",
                                            fontWeight: 900,
                                            color: "#fff",
                                            lineHeight: 1.1,
                                            letterSpacing: "-1.5px",
                                            fontFamily: "var(--font-geist-sans)" // Font tegas
                                        }}
                                    >
                                        {room?.currentSong?.title || "Belum ada lagu"}
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        key={room?.currentSong?.artist}
                                        style={{
                                            margin: 0,
                                            fontSize: "clamp(18px, 1.5vw, 22px)",
                                            fontWeight: 600,
                                            color: "var(--accent-primary)",
                                            letterSpacing: "0.5px",
                                            fontFamily: "var(--font-fredoka)", // Font beda (lebih fun/tebal)
                                            opacity: 0.9
                                        }}
                                    >
                                        {room?.currentSong?.artist || "Standby..."}
                                    </motion.p>
                                    <SyncIndicator isDarkBg={true} />
                                </div>

                                {/* Lyrics Panel */}
                                <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
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
                                        color: showImmersiveQueue ? "var(--accent-primary)" : "rgba(255,255,255,0.45)",
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

                {(isFullscreen || isLandscape) && isMobileScreen && (
                    <motion.div
                        key="immersive-mobile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mobile-fullscreen-force-landscape"
                        style={{
                            position: "fixed", inset: 0, zIndex: 10000,
                            background: "var(--bg-primary)", // Follow mode background
                            color: "var(--text-primary)",
                            display: "flex", alignItems: "stretch", // full height
                            overflow: "hidden",
                            padding: "24px 32px"
                        }}
                    >
                        {/* 🌌 Night Sky Background for Immersive Mobile (Dark Mode) */}
                        <div className="night-sky-layer" style={{ position: "absolute", zIndex: 0, pointerEvents: "none" }}>
                            <div className="night-nebula" />
                            <div className="star-layer star-far" />
                            <div className="star-layer star-mid" />
                            <div className="star-layer star-near" />

                            {/* Extra Meteors for Mobile for "Clear Visibility" */}
                            <div className="meteor" style={{ top: '10%', left: '80%', animationDelay: '1s', animationDuration: '6s' }} />
                            <div className="meteor" style={{ top: '40%', left: '90%', animationDelay: '5s', animationDuration: '9s' }} />
                            <div className="meteor" style={{ top: '15%', left: '70%', animationDelay: '8s', animationDuration: '12s' }} />
                            <div className="meteor" style={{ top: '60%', left: '95%', animationDelay: '3s', animationDuration: '7s' }} />
                            <div className="meteor" style={{ top: '25%', left: '85%', animationDelay: '12s', animationDuration: '15s' }} />

                            {/* Sparkles for a more magical feel */}
                            <div className="night-sparkle" style={{ top: '30%', left: '15%', animationDelay: '0.2s' }} />
                            <div className="night-sparkle" style={{ top: '70%', left: '25%', animationDelay: '1.5s' }} />
                            <div className="night-sparkle" style={{ top: '45%', left: '55%', animationDelay: '3.2s' }} />
                            <div className="night-sparkle" style={{ top: '20%', left: '80%', animationDelay: '0.8s' }} />
                            <div className="night-sparkle" style={{ top: '85%', left: '65%', animationDelay: '2.4s' }} />
                        </div>
                        {/* Top Right User Active & Close */}
                        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 12, zIndex: 100 }}>
                            {/* User Circles */}
                            <div style={{ display: "flex", alignItems: "center" }}>
                                {roomUsersSorted.slice(0, 3).map((u, i) => (
                                    <div
                                        key={u.uid}
                                        style={{
                                            position: "relative",
                                            marginLeft: i === 0 ? 0 : -8,
                                            border: "2px solid var(--bg-primary)", borderRadius: "50%",
                                            zIndex: 10 - i
                                        }}
                                    >
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid var(--border-soft)" }}>
                                            {u.photoURL ? <img src={u.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ fontSize: 10, fontWeight: 900 }}>{getInitials(u.displayName)}</span>}
                                        </div>
                                        {u.status === "online" && (
                                            <div style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)", border: "2px solid var(--bg-primary)" }} />
                                        )}
                                    </div>
                                ))}
                                {roomUsersSorted.length > 3 && (
                                    <div style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: "var(--text-secondary)" }}>+{roomUsersSorted.length - 3}</div>
                                )}
                            </div>

                            <button onClick={toggleFullscreen} style={{ background: "var(--accent-soft)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                                <ArrowsPointingInIcon style={{ width: 18, height: 18, color: "var(--accent-primary)" }} />
                            </button>
                        </div>

                        {/* Left Column: Info & Controls */}
                        <div style={{ width: "35%", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 10, padding: "24px 0" }}>
                            {/* Top Info */}
                            <div>
                                <h1 style={{ fontSize: "clamp(28px, 6vh, 48px)", fontWeight: 900, margin: "0", color: "var(--text-primary)", fontFamily: "var(--font-geist-sans)", letterSpacing: "-1.5px", lineHeight: "1.05" }}>
                                    {room?.currentSong?.title || "Belum ada lagu"}
                                </h1>
                                <p style={{ fontSize: "clamp(16px, 3vh, 22px)", color: "var(--accent-primary)", fontWeight: 700, margin: "6px 0 12px 0", opacity: 0.9 }}>
                                    {room?.currentSong?.artist || "Standby..."}
                                </p>



                                {/* Progress Bar */}
                                <div style={{ width: "100%", maxWidth: "340px", marginBottom: 32 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)", opacity: 0.6 }}>{formatTime(currentTime)}</span>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)", opacity: 0.6 }}>{formatTime(duration)}</span>
                                    </div>
                                    <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 10, position: "relative", border: "1px solid var(--border-soft)" }}>
                                        <motion.div
                                            initial={false}
                                            animate={{ width: `${progress}%` }}
                                            style={{
                                                height: "100%", background: "var(--accent-primary)", borderRadius: 10, position: "relative",
                                                boxShadow: "0 0 10px var(--accent-glow)"
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Controls (Menu, Play/Pause and Next) */}
                                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
                                    {/* Menu / Queue */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setShowImmersiveMobileMenu(true)}
                                        style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
                                    >
                                        <QueueListIcon style={{ width: 22, height: 22, color: "var(--text-primary)" }} />
                                    </motion.button>

                                    {/* Play / Pause */}
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={togglePlay}
                                        style={{
                                            width: 68, height: 68, borderRadius: "50%",
                                            background: "var(--accent-primary)", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer",
                                            boxShadow: "0 10px 25px var(--accent-glow), inset 0 -2px 5px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.3)"
                                        }}
                                    >
                                        {room?.isPlaying ? <PauseIcon style={{ width: 32, height: 32, color: "#fff" }} /> : <PlayIcon style={{ width: 32, height: 32, marginLeft: 2, color: "#fff" }} />}
                                    </motion.button>

                                    {/* Next */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={skipNext} disabled={!isHost || !room?.queue?.length}
                                        style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isHost && room?.queue?.length ? "pointer" : "default", opacity: isHost && room?.queue?.length ? 1 : 0.5, boxShadow: "var(--shadow-soft)" }}
                                    >
                                        <ForwardIcon style={{ width: 22, height: 22, color: "var(--text-primary)" }} />
                                    </motion.button>
                                </div>



                                {/* Lyrics Snippet (Subtle) */}
                                <div style={{ flex: 1, minHeight: 0, marginTop: 32, paddingBottom: 16, overflow: "hidden", position: "relative", maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}>
                                    <LyricsPanel
                                        lyrics={lyrics}
                                        activeIndex={activeIndex}
                                        autoScrollEnabled={true}
                                        setAutoScrollEnabled={() => { }}
                                        isDarkMode={false}
                                        isDesktopInline={true}
                                        isImmersive={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Area: Cassette Tape */}
                        <div style={{ width: "65%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                            <div style={{
                                width: "100%",
                                maxWidth: "560px",
                                position: "relative",
                                aspectRatio: "1.65 / 1",
                                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.15))",
                                transformOrigin: "center center"
                            }}>
                                {/* Base Cassette Image */}
                                <div style={{
                                    width: "200%",
                                    height: "200%",
                                    background: `url('/images/kasetpita.png') center/contain no-repeat`,
                                    position: "relative",
                                    transform: "scale(1.1) translateX(-10%)",
                                    zIndex: 2,
                                }} />

                                {/* Left Tape Spool */}
                                <style>{`
                                    @keyframes spin-tape {
                                        100% { transform: rotate(360deg); }
                                    }
                                `}</style>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "48.5%",
                                        top: "39.5%",
                                        width: "15%",
                                        aspectRatio: "1/1",
                                        background: `url('/images/pita.png') center/contain no-repeat`,
                                        transformOrigin: "center center",
                                        animation: "spin-tape 4s linear infinite",
                                        animationPlayState: room?.isPlaying && room?.currentSong ? "running" : "paused",
                                        willChange: "transform",
                                        zIndex: 3
                                    }}
                                />

                                {/* Right Tape Spool */}
                                <div
                                    style={{
                                        position: "absolute",
                                        right: "-6.5%",
                                        top: "39.5%",
                                        width: "15%",
                                        aspectRatio: "1/1",
                                        background: `url('/images/pita.png') center/contain no-repeat`,
                                        transformOrigin: "center center",
                                        animation: "spin-tape 4s linear infinite",
                                        animationPlayState: room?.isPlaying && room?.currentSong ? "running" : "paused",
                                        willChange: "transform",
                                        zIndex: 3
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {(isFullscreen || isLandscape) && isMobileScreen && showImmersiveMobileMenu && (
                        <motion.div
                            key="immersive-mobile-menu"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: "fixed", inset: 0, zIndex: 11000,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                                padding: 24
                            }}
                        >
                            <motion.div
                                initial={{ y: 50, scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: 50, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{
                                    width: "100%", maxWidth: 480, height: "100%", maxHeight: 360,
                                    background: "var(--bg-card)", borderRadius: 24, boxShadow: "var(--shadow-strong)",
                                    display: "flex", flexDirection: "column", overflow: "hidden"
                                }}
                            >
                                {/* Header / Tabs */}
                                <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-soft)" }}>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <button onClick={() => setImmersiveMobileTab("add")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 18, fontWeight: 900, color: immersiveMobileTab === "add" ? "var(--text-primary)" : "var(--text-muted)", transition: "color 0.2s" }}>
                                            Pilih Lagu 🎵
                                        </button>
                                        <button onClick={() => setImmersiveMobileTab("queue")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 18, fontWeight: 900, color: immersiveMobileTab === "queue" ? "var(--text-primary)" : "var(--text-muted)", transition: "color 0.2s" }}>
                                            Antrian
                                        </button>
                                    </div>
                                    {immersiveMobileTab === "add" && isHost && (
                                        <button onClick={addRandomSongs} style={{ padding: "6px 12px", borderRadius: 12, background: "var(--accent-primary)", color: "#fff", border: "none", fontSize: 11, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 10px var(--accent-glow)" }}>
                                            🎲 RANDOM 5
                                        </button>
                                    )}
                                </div>

                                {/* Search Bar (Only in Add mode) */}
                                {immersiveMobileTab === "add" && (
                                    <div style={{ padding: "12px 24px" }}>
                                        <input
                                            type="text"
                                            placeholder="Cari judul atau artis..."
                                            value={immersiveMobileSearch}
                                            onChange={(e) => setImmersiveMobileSearch(e.target.value)}
                                            style={{
                                                width: "100%", padding: "12px 16px", borderRadius: 16,
                                                background: "var(--bg-secondary)", border: "1.5px solid var(--border-soft)",
                                                outline: "none", fontSize: 13, fontWeight: 600, color: "var(--text-primary)"
                                            }}
                                        />
                                    </div>
                                )}

                                {/* List Context */}
                                <div style={{ flex: 1, overflowY: "auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                                    {immersiveMobileTab === "add" ? (
                                        LOCAL_SONGS.filter(s => s.title.toLowerCase().includes(immersiveMobileSearch.toLowerCase()) || s.artist.toLowerCase().includes(immersiveMobileSearch.toLowerCase())).length > 0 ? (
                                            LOCAL_SONGS.filter(s => s.title.toLowerCase().includes(immersiveMobileSearch.toLowerCase()) || s.artist.toLowerCase().includes(immersiveMobileSearch.toLowerCase())).map((song) => (
                                                <div key={song.id || `song-${song.title}`} onClick={() => handleSongSelect(song)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                                                        <MusicalNoteIcon style={{ width: 22, height: 22 }} />
                                                    </div>
                                                    <div style={{ flex: 1, borderBottom: "1px solid var(--border-soft)", paddingBottom: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{song.title}</p>
                                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{song.artist}</p>
                                                        </div>
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{formatTime(song.duration || 0)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ textAlign: "center", opacity: 0.5, fontWeight: 700, marginTop: 40, color: "var(--text-primary)" }}>Tidak ditemukan</p>
                                        )
                                    ) : (
                                        room?.queue?.length > 0 ? (
                                            room.queue.map((s: any, i: number) => (
                                                <div key={s.queueId || `q-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0, fontWeight: 900, fontSize: 12 }}>
                                                        {i + 1}
                                                    </div>
                                                    <div style={{ flex: 1, borderBottom: "1px solid var(--border-soft)", paddingBottom: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{s.title}</p>
                                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{s.artist}</p>
                                                        </div>
                                                        {isHost && (
                                                            <button onClick={() => removeFromQueue(s)} style={{ padding: 6, background: "none", border: "none", color: "#ff4d4d", cursor: "pointer" }}>
                                                                <XMarkIcon style={{ width: 18, height: 18 }} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>
                                                <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>Antrian Kosong</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Close Button */}
                                <div style={{ padding: 16 }}>
                                    <button
                                        onClick={() => setShowImmersiveMobileMenu(false)}
                                        style={{ width: "100%", padding: 14, borderRadius: 16, background: "var(--bg-secondary)", border: "none", color: "var(--text-primary)", fontSize: 14, fontWeight: 900, cursor: "pointer", transition: "background 0.2s" }}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
