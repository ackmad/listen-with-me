"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc, onSnapshot, updateDoc, arrayUnion, arrayRemove,
    collection, addDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeftIcon, MusicalNoteIcon, CheckIcon, XMarkIcon,
    QueueListIcon, PlusIcon, UsersIcon,
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
import SongManager from "@/components/SongManager";
import ReactionSystem from "@/components/ReactionSystem";

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
            {/* Pulsing disc */}
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
                {/* Ripple rings */}
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

            {/* Song info */}
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

            {/* Waveform bars */}
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

            {/* Rotating tips */}
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
function QueueItem({ song, isHost, isActive, onPlay }: { song: any; isHost: boolean; isActive: boolean; onPlay: () => void }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            onClick={isHost ? onPlay : undefined}
            style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                background: isActive ? "var(--app-bg-secondary)" : hov ? "var(--app-surface)" : "transparent",
                border: `1px solid ${isActive ? "var(--app-primary)" : hov ? "var(--app-border)" : "transparent"}`,
                cursor: isHost ? "pointer" : "default", transition: "all 0.2s ease", minHeight: 48,
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
                <p style={{ margin: 0, fontSize: 11, color: "var(--app-text-muted)", fontWeight: 500 }}>{song.artist}</p>
            </div>
            {isActive && (
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
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
    const [requests, setRequests] = useState<any[]>([]);
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

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) { router.push("/"); return; }
            setUser(u);
            setAuthDone(true);
        });
    }, [router]);

    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
    useBroadcastPresence(user?.uid ?? null, displayName, user?.photoURL ?? null, { activity: "Sedang di room", currentRoom: rId });

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

    useEffect(() => {
        if (!rId || !isHost) return;
        const q = query(collection(db, "rooms", rId, "requests"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.warn("Requests:", err.message));
    }, [rId, isHost]);

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
                    setNeedsInteraction(false); // Play success, hide interaction overlay
                } catch (e: any) {
                    if (e.name === "NotAllowedError") {
                        setNeedsInteraction(true); // Play failed due to interaction policy
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
        if (!isHost || !rId) return;
        const snap = await getDoc(doc(db, "rooms", rId));
        const data = snap.data();
        if (!data) return;
        const queue: any[] = data.queue || [];
        if (queue.length === 0) {
            await updateDoc(doc(db, "rooms", rId), { currentSong: null, isPlaying: false });
            return;
        }
        const next = queue[0];
        await updateDoc(doc(db, "rooms", rId), {
            currentSong: next, queue: queue.slice(1),
            isPlaying: true, startedAt: serverTimestamp(),
        });
        setSongsPlayed(p => p + 1);
        toast(`▶ Sekarang: ${next.title}`, "info");
    }, [isHost, rId, toast]);

    const togglePlay = async () => {
        if (!isHost) return;
        await updateDoc(doc(db, "rooms", rId), {
            isPlaying: !room.isPlaying,
            ...(!room.isPlaying && { startedAt: serverTimestamp() }),
        });
    };
    const skipNext = async () => {
        if (!isHost || !room.queue?.length) return;
        const next = room.queue[0];
        await updateDoc(doc(db, "rooms", rId), {
            currentSong: next, queue: room.queue.slice(1),
            isPlaying: true, startedAt: serverTimestamp(),
        });
        setSongsPlayed(p => p + 1);
        toast(`▶ Lompat ke: ${next.title}`, "info");
    };

    const handleSongSelect = async (song: any) => {
        if (!rId || !user) return;
        if (isHost) {
            await updateDoc(doc(db, "rooms", rId), { queue: arrayUnion(song) });
            toast("Lagu ditambahkan ke antrian 🎵", "success");
        } else {
            await addDoc(collection(db, "rooms", rId, "requests"), {
                ...song, requestedBy: displayName, requesterId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast("Request dikirim ke host 💌", "info");
        }
    };

    const approveRequest = async (req: any) => {
        const { id, requestedBy, requesterId, createdAt, ...songData } = req;
        await updateDoc(doc(db, "rooms", rId), { queue: arrayUnion(songData) });
        await deleteDoc(doc(db, "rooms", rId, "requests", req.id));
        toast(`"${req.title}" disetujui! ✅`, "success");
    };
    const rejectRequest = async (req: any) => {
        await deleteDoc(doc(db, "rooms", rId, "requests", req.id));
        toast(`Request "${req.title}" ditolak`, "error");
    };
    const playFromQueue = async (song: any) => {
        if (!isHost) return;
        await updateDoc(doc(db, "rooms", rId), {
            currentSong: song, queue: arrayRemove(song),
            isPlaying: true, startedAt: serverTimestamp(),
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
                    if (a) { setCurrentTime(a.currentTime); setDuration(isNaN(a.duration) ? 0 : a.duration); }
                }}
                onCanPlay={() => { setIsSyncing(false); if (syncTimeout.current) clearTimeout(syncTimeout.current); }}
                onEnded={handleAudioEnded}
                onError={() => setIsSyncing(false)}
                preload="auto"
            />

            <AnimatePresence>
                {(isSyncing || needsInteraction) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: "fixed", inset: 0, zIndex: 2000 }}
                    >
                        {needsInteraction ? (
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "var(--app-bg)",
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center", gap: 32,
                                padding: 32, textAlign: "center",
                                transition: "var(--theme-transition)",
                            }}>
                                <div style={{ position: "relative" }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--app-bg-secondary)", border: "2px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <MusicalNoteIcon style={{ width: 40, height: 40, color: "var(--app-primary)" }} />
                                    </motion.div>
                                </div>
                                <div>
                                    <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "var(--app-text)" }}>
                                        Siap untuk Mendengarkan?
                                    </h2>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--app-text-muted)", fontWeight: 600, fontFamily: "var(--font-fredoka)", maxWidth: 300 }}>
                                        Tap tombol di bawah untuk bergabung dan sinkronisasi musik otomatis! ✨
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        const audio = audioRef.current;
                                        if (audio) {
                                            try {
                                                await audio.play();
                                                setNeedsInteraction(false);
                                            } catch (e) {
                                                console.warn("Manual join failed:", e);
                                            }
                                        }
                                    }}
                                    style={{
                                        padding: "18px 40px", borderRadius: 24,
                                        background: "var(--app-primary)", border: "none",
                                        color: "#fff", fontSize: 18, fontWeight: 900,
                                        cursor: "pointer", boxShadow: "0 10px 30px var(--app-soft-accent)",
                                        display: "flex", alignItems: "center", gap: 12
                                    }}
                                >
                                    Gabung & Sinkron →
                                </motion.button>
                            </div>
                        ) : (
                            <SyncScreen
                                songTitle={room?.currentSong?.title}
                                artist={room?.currentSong?.artist}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{
                padding: "0 16px", height: 60,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1.5px solid var(--app-border)",
                background: "var(--app-surface)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
                transition: "var(--theme-transition)",
            }}>
                <button onClick={() => router.push("/dashboard")} style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "10px 16px",
                    borderRadius: 20, background: "var(--app-bg-secondary)",
                    border: "1px solid var(--app-border)",
                    color: "var(--app-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 700,
                    transition: "all 0.2s ease"
                }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--app-primary)"; e.currentTarget.style.borderColor = "var(--app-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--app-text-secondary)"; e.currentTarget.style.borderColor = "var(--app-border)"; }}
                >
                    <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Keluar
                </button>

                <div style={{ textAlign: "center", flex: 1, padding: "0 12px" }}>
                    <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--app-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {room?.name || "Memuat..."}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--app-indicator)" }} />
                        <span style={{ fontSize: 10, color: "var(--app-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                            {isHost ? "👑 Host" : "Tamu"}{sessionMinutes > 0 ? ` · ${sessionMinutes}m` : ""}
                        </span>
                    </div>
                </div>

                <button onClick={() => setShowSongs(true)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                    borderRadius: 20, background: "var(--app-primary)",
                    border: "none", color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 4px 15px var(--app-soft-accent)",
                    transition: "all 0.2s"
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--app-primary-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--app-primary)"}
                >
                    <PlusIcon style={{ width: 16, height: 16 }} />
                    <span className="hidden sm:inline">{isHost ? "Tambah Lagu" : "Request"}</span>
                </button>
            </header>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* ──── Player ──── */}
                <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "20px",
                    paddingBottom: "120px",
                }}>
                    {/* Disc View */}
                    <div style={{ position: "relative", marginBottom: 32 }}>
                        <motion.div
                            animate={room?.isPlaying ? { rotate: 360 } : { rotate: 0 }}
                            transition={room?.isPlaying ? { duration: 10, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                            style={{
                                width: "clamp(160px, 30vw, 240px)", height: "clamp(160px, 30vw, 240px)", borderRadius: "50%",
                                background: "var(--app-surface)",
                                border: "4px solid var(--app-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: room?.isPlaying
                                    ? "0 0 50px var(--app-soft-accent)"
                                    : "0 10px 30px rgba(0,0,0,0.1)",
                                transition: "var(--theme-transition)",
                            }}
                        >
                            <div style={{
                                width: 50, height: 50, borderRadius: "50%",
                                background: "var(--app-bg-secondary)", border: "2px solid var(--app-border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <MusicalNoteIcon style={{ width: 22, height: 22, color: room?.currentSong ? "var(--app-primary)" : "var(--app-text-muted)" }} />
                            </div>
                        </motion.div>
                        {room?.isPlaying && (
                            <motion.div
                                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ position: "absolute", inset: -15, borderRadius: "50%", border: "2px solid var(--app-primary)", pointerEvents: "none", opacity: 0.2 }}
                            />
                        )}
                    </div>

                    <div style={{ textAlign: "center", marginBottom: 28, width: "100%", maxWidth: 400 }}>
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={room?.currentSong?.title || "none"}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    margin: "0 0 8px", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900,
                                    color: room?.currentSong ? "var(--app-text)" : "var(--app-text-muted)",
                                    lineHeight: 1.2,
                                }}
                            >
                                {room?.currentSong?.title || "Belum ada lagu"}
                            </motion.h2>
                        </AnimatePresence>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--app-primary)", fontWeight: 600, letterSpacing: "0.02em" }}>
                            {room?.currentSong?.artist || (isHost ? "Klik + untuk mulai!" : "Menunggu host...")}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {room?.currentSong && (
                        <div style={{ width: "100%", maxWidth: 360, marginBottom: 24 }}>
                            <div style={{
                                height: 6, background: "var(--app-prog-track)", borderRadius: 10, overflow: "hidden", cursor: isHost ? "pointer" : "default",
                                transition: "var(--theme-transition)",
                            }}
                                onClick={e => {
                                    if (!isHost || !duration) return;
                                    const r = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - r.left) / r.width;
                                    if (audioRef.current) audioRef.current.currentTime = pct * duration;
                                }}
                            >
                                <motion.div
                                    style={{ height: "100%", width: `${progress}%`, background: "var(--app-prog-fill)", borderRadius: 10 }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--app-text-muted)" }}>{formatTime(currentTime)}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--app-text-muted)" }}>{formatTime(duration)}</span>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
                        <button onClick={() => { setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; }); }}
                            style={{ background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)", borderRadius: "50%", cursor: "pointer", color: "var(--app-text-secondary)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                            {muted ? <SpeakerXMarkIcon style={{ width: 20, height: 20 }} /> : <SpeakerWaveIcon style={{ width: 20, height: 20 }} />}
                        </button>

                        <motion.button
                            whileHover={isHost && room?.currentSong ? { scale: 1.1 } : {}}
                            whileTap={isHost && room?.currentSong ? { scale: 0.9 } : {}}
                            onClick={togglePlay}
                            disabled={!isHost || !room?.currentSong}
                            style={{
                                width: 72, height: 72, borderRadius: "50%", border: "none",
                                background: isHost && room?.currentSong ? "var(--app-primary)" : "var(--app-border)",
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: isHost && room?.currentSong ? "pointer" : "not-allowed",
                                boxShadow: isHost && room?.currentSong ? "0 8px 25px var(--app-soft-accent)" : "none",
                                transition: "background 0.3s ease"
                            }}>
                            {room?.isPlaying ? <PauseIcon style={{ width: 32, height: 32 }} /> : <PlayIcon style={{ width: 32, height: 32, marginLeft: 4 }} />}
                        </motion.button>

                        <button onClick={skipNext} disabled={!isHost || !room?.queue?.length}
                            style={{
                                background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)", borderRadius: "50%", width: 44, height: 44,
                                cursor: isHost && room?.queue?.length ? "pointer" : "not-allowed",
                                color: isHost && room?.queue?.length ? "var(--app-primary)" : "var(--app-text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                            }}>
                            <ForwardIcon style={{ width: 20, height: 20 }} />
                        </button>
                    </div>

                    {!isHost && (
                        <p style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            🎵 Sinkronisasi dengan Host aktif
                        </p>
                    )}
                </div>

                {/* ──── Sidebar ──── */}
                <aside className="room-sidebar" style={{
                    width: 320, flexShrink: 0,
                    borderLeft: "1.5px solid var(--app-border)",
                    background: "var(--app-surface)",
                    display: "flex", flexDirection: "column",
                    transition: "var(--theme-transition)",
                }}>
                    {/* Users Section */}
                    <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--app-border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <UsersIcon style={{ width: 14, height: 14, color: "var(--app-primary)" }} />
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--app-text-muted)", textTransform: "uppercase" }}>
                                Teman Mendengar ({roomUsers.length})
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {roomUsersSorted.map(u => (
                                <RoomUserCard key={u.uid} u={u} isHost={u.uid === room?.hostId} isMe={u.uid === user?.uid} />
                            ))}
                        </div>
                    </div>

                    {/* Queue Section */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
                        {/* Requests for Host */}
                        <AnimatePresence>
                            {isHost && requests.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: "var(--app-primary)", textTransform: "uppercase", margin: "0 0 12px 4px", letterSpacing: "0.05em" }}>🎯 Request Masuk</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {requests.map(req => (
                                            <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                                style={{ padding: "12px", background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-primary)", borderRadius: 16 }}>
                                                <div style={{ marginBottom: 10 }}>
                                                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "var(--app-text)" }}>{req.title}</p>
                                                    <p style={{ margin: 0, fontSize: 11, color: "var(--app-text-muted)", fontWeight: 600 }}>dari {req.requestedBy}</p>
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button onClick={() => approveRequest(req)} style={{ flex: 1, borderRadius: 10, border: "none", background: "var(--app-primary)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: "6px" }}>Setujui</button>
                                                    <button onClick={() => rejectRequest(req)} style={{ borderRadius: 10, border: "1.5px solid var(--app-border)", background: "transparent", color: "var(--app-text-muted)", fontSize: 12, cursor: "pointer", padding: "6px 12px" }}>Tolak</button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <QueueListIcon style={{ width: 14, height: 14, color: "var(--app-text-muted)" }} />
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--app-text-muted)", textTransform: "uppercase" }}>
                                List Antrian
                            </p>
                        </div>

                        {room?.queue?.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {room.queue.map((s: any, i: number) => (
                                    <QueueItem key={`${s.id}-${i}`} song={s} isHost={isHost} isActive={room.currentSong?.id === s.id} onPlay={() => playFromQueue(s)} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px 24px", background: "var(--app-bg-secondary)", borderRadius: 20, border: "1.5px dashed var(--app-border)" }}>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--app-text-muted)", fontWeight: 600 }}>Antrian masih kosong</p>
                                <button onClick={() => setShowSongs(true)} style={{ marginTop: 12, color: "var(--app-primary)", fontWeight: 800, fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>+ Tambah Lagu</button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Tab Bar */}
            <div className="mobile-tabbar" style={{
                position: "fixed", bottom: 0, left: 0, right: 0, height: 80,
                background: "var(--app-surface)", borderTop: "1.5px solid var(--app-border)",
                display: "none", alignItems: "center", justifyContent: "space-around",
                padding: "0 10px", zIndex: 1000,
                transition: "var(--theme-transition)",
            }}>
                {[
                    { id: "queue", icon: QueueListIcon, label: "Antrian" },
                    { id: "requests", icon: PlusIcon, label: "Request" },
                    { id: "users", icon: UsersIcon, label: "Teman" },
                ].map(t => (
                    <button key={t.id}
                        onClick={() => {
                            if (t.id === "requests") {
                                setShowSongs(true);
                            } else {
                                setMobileTab(t.id as any);
                                setShowDrawer(true);
                            }
                        }}
                        style={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                            background: "none", border: "none",
                            color: showDrawer && mobileTab === t.id ? "var(--app-primary)" : "var(--app-text-muted)",
                            transition: "all 0.2s", cursor: "pointer"
                        }}>
                        <t.icon style={{ width: 22, height: 22 }} />
                        <span style={{ fontSize: 10, fontWeight: 800 }}>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Mobile Drawer Popup */}
            <AnimatePresence>
                {showDrawer && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDrawer(false)}
                            style={{
                                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(4px)", zIndex: 1100
                            }}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            style={{
                                position: "fixed", bottom: 0, left: 0, right: 0,
                                background: "var(--app-surface)",
                                borderTop: "2px solid var(--app-border)",
                                borderRadius: "32px 32px 0 0",
                                padding: "24px 20px 40px",
                                maxHeight: "80vh", overflowY: "auto",
                                zIndex: 1200,
                                boxShadow: "0 -10px 40px rgba(0,0,0,0.3)"
                            }}
                        >
                            {/* Handle */}
                            <div style={{
                                width: 40, height: 4, background: "var(--app-border)",
                                borderRadius: 2, margin: "0 auto 24px"
                            }} />

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {mobileTab === "queue" ? "Antrian Lagu" : "Teman Mendengar"}
                                </h3>
                                <button onClick={() => setShowDrawer(false)} style={{ background: "var(--app-bg-secondary)", border: "none", padding: 8, borderRadius: "50%", color: "var(--app-text-muted)" }}>
                                    <XMarkIcon style={{ width: 20, height: 20 }} />
                                </button>
                            </div>

                            {mobileTab === "queue" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {room?.queue?.length > 0 ? (
                                        room.queue.map((s: any, i: number) => (
                                            <QueueItem key={`${s.id}-${i}`} song={s} isHost={isHost} isActive={room.currentSong?.id === s.id} onPlay={() => { playFromQueue(s); setShowDrawer(false); }} />
                                        ))
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "40px 20px", border: "1.5px dashed var(--app-border)", borderRadius: 20 }}>
                                            <p style={{ margin: 0, color: "var(--app-text-muted)", fontWeight: 600 }}>Antrian masih kosong</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {roomUsersSorted.map(u => (
                                        <RoomUserCard key={u.uid} u={u} isHost={u.uid === room?.hostId} isMe={u.uid === user?.uid} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Reactions & Mobile Popups Overlay */}
            <ReactionSystem roomId={rId} userId={user?.uid || ""} />

            {/* Extra Styles */}
            <style>{`
                @media (max-width: 700px) {
                    .room-sidebar { display: none !important; }
                    .mobile-tabbar { display: flex !important; }
                }
            `}</style>

            <SongManager isOpen={showSongs} onClose={() => setShowSongs(false)} onSongSelect={handleSongSelect} />
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
