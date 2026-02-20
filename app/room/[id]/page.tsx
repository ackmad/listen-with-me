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
    useBroadcastPresence, useRoomPresence, getInitials, formatLastSeen,
    type UserPresence,
} from "@/hooks/usePresence";
import { ToastProvider, useToast } from "@/components/Toast";
import SongManager from "@/components/SongManager";
import ReactionSystem from "@/components/ReactionSystem";

// ─── Badge component ───────────────────────────────────────────────────────
function RoleBadge({ role }: { role: "Host" | "Tamu" }) {
    return (
        <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 20,
            background: role === "Host" ? "rgba(200,0,100,0.15)" : "rgba(255,255,255,0.07)",
            color: role === "Host" ? "rgba(220,100,150,0.9)" : "rgba(255,255,255,0.35)",
            border: `1px solid ${role === "Host" ? "rgba(200,0,100,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}>
            {role === "Host" ? "👑 Host" : "Tamu"}
        </span>
    );
}

// ─── User card inside room ─────────────────────────────────────────────────
function RoomUserCard({ u, isHost, isMe }: { u: UserPresence; isHost: boolean; isMe: boolean }) {
    const role = isHost ? "Host" : "Tamu";
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 14,
            background: isHost ? "rgba(200,0,100,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isHost ? "rgba(200,0,100,0.18)" : "rgba(255,255,255,0.05)"}`,
            boxShadow: isHost ? "0 0 0 1px rgba(200,0,100,0.08), 0 3px 12px rgba(0,0,0,0.2)" : "none",
        }}>
            {/* Avatar */}
            <div style={{
                position: "relative", flexShrink: 0,
                width: 36, height: 36, borderRadius: "50%",
                background: isHost
                    ? "linear-gradient(135deg, rgba(200,0,100,0.5), rgba(120,0,160,0.5))"
                    : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                color: isHost ? "rgba(255,200,220,0.95)" : "rgba(255,255,255,0.5)",
                border: `2px solid ${isHost ? "rgba(200,0,100,0.35)" : "rgba(255,255,255,0.08)"}`,
            }}>
                {getInitials(u.displayName)}
                {/* Online dot */}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 9, height: 9, borderRadius: "50%",
                    background: u.status === "idle" ? "#fbbf24" : "#4ade80",
                    border: "2px solid #0a0508",
                }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: isHost ? 800 : 600,
                        color: isHost ? "#fff" : "rgba(255,255,255,0.65)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe ? " (kamu)" : ""}
                    </p>
                    <RoleBadge role={role} />
                </div>
                <p style={{
                    margin: "2px 0 0", fontSize: 10,
                    color: u.status === "idle" ? "rgba(251,191,36,0.55)" : "rgba(74,222,128,0.55)",
                }}>
                    {u.status === "idle" ? "Sedang idle" : "Aktif sekarang"}
                </p>
            </div>

            {/* Listening indicator when both online in same room */}
            {u.status === "online" && (
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ height: [3, 9, 3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                            style={{ width: 2.5, background: "rgba(74,222,128,0.5)", borderRadius: 2, minHeight: 3 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Queue Item ────────────────────────────────────────────────────────────
function QueueItem({ song, isHost, isActive, onPlay }: { song: any; isHost: boolean; isActive: boolean; onPlay: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={isHost ? onPlay : undefined}
            style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 11,
                background: isActive ? "rgba(200,0,100,0.07)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
                border: `1px solid ${isActive ? "rgba(200,0,100,0.18)" : hovered ? "rgba(255,255,255,0.06)" : "transparent"}`,
                cursor: isHost ? "pointer" : "default", transition: "all 0.15s",
                minHeight: 44,
            }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: isActive ? "rgba(200,0,100,0.2)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {isHost && hovered && !isActive
                    ? <PlayIcon style={{ width: 12, height: 12, color: "rgba(220,100,150,0.8)", marginLeft: 1 }} />
                    : <MusicalNoteIcon style={{ width: 12, height: 12, color: isActive ? "rgba(220,100,150,0.8)" : "rgba(255,255,255,0.2)" }} />
                }
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.title}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: isActive ? "rgba(220,100,150,0.6)" : "rgba(255,255,255,0.2)" }}>
                    {song.artist}
                </p>
            </div>
            {isActive && (
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
                    {[1, 2, 3].map(i => (
                        <motion.div key={i}
                            animate={{ height: [3, 11, 3] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                            style={{ width: 2.5, background: "rgba(200,0,100,0.6)", borderRadius: 2, minHeight: 3 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Inner room (needs ToastProvider above) ────────────────────────────────
function RoomInner() {
    const { id: roomId } = useParams();
    const router = useRouter();
    const rId = typeof roomId === "string" ? roomId : "";
    const { toast } = useToast();

    const audioRef = useRef<HTMLAudioElement>(null);

    const [user, setUser] = useState<any>(null);
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [roomUsers, setRoomUsers] = useState<UserPresence[]>([]);
    const [showSongs, setShowSongs] = useState(false);
    // Mobile tab: "queue" | "requests" | "users"
    const [mobileTab, setMobileTab] = useState<"queue" | "requests" | "users">("queue");

    // Audio
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.85);
    const [muted, setMuted] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);

    const sessionStart = useRef(Date.now());
    const [songsPlayed, setSongsPlayed] = useState(0);

    // ── Auth ──
    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) router.push("/");
            else setUser(u);
        });
    }, [router]);

    // ── Presence: broadcast self into this room ──
    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
    const { updateActivity } = useBroadcastPresence(
        user?.uid ?? null,
        displayName,
        user?.photoURL ?? null,
        { activity: "Sedang di room", currentRoom: rId }
    );

    // ── Presence: watch room users ──
    const handleRoomPresence = useCallback((users: UserPresence[]) => {
        setRoomUsers(users);
    }, []);
    useRoomPresence(rId, handleRoomPresence);

    // ── Room listener ──
    useEffect(() => {
        if (!rId || !user) return;
        return onSnapshot(doc(db, "rooms", rId), (snap) => {
            if (!snap.exists()) { router.push("/dashboard"); return; }
            const data = snap.data();
            setRoom(data);
            setIsHost(data.hostId === user.uid);
            setLoading(false);
        }, (err) => { console.warn("Room:", err.message); setLoading(false); });
    }, [rId, user, router]);

    // ── Requests listener ──
    useEffect(() => {
        if (!rId || !isHost) return;
        const q = query(collection(db, "rooms", rId, "requests"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.warn("Requests:", err.message));
    }, [rId, isHost]);

    // ── Audio load ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!room?.currentSong?.url) { audio.pause(); audio.src = ""; return; }
        setAudioLoading(true);
        audio.src = room.currentSong.url;
        audio.volume = volume;
        audio.load();
    }, [room?.currentSong?.url]);

    // ── Audio play/pause sync ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !room?.currentSong?.url) return;
        const tryPlay = async () => {
            if (room.isPlaying) {
                if (room.startedAt) {
                    const offset = (Date.now() - (room.startedAt.toMillis?.() ?? Date.now())) / 1000;
                    if (Math.abs(audio.currentTime - offset) > 1.5)
                        audio.currentTime = Math.min(Math.max(offset, 0), audio.duration || offset);
                }
                try { await audio.play(); } catch (e: any) { if (e.name !== "AbortError") console.warn("Play:", e.message); }
            } else {
                audio.pause();
            }
        };
        if (audio.readyState >= 3) tryPlay();
        else {
            const fn = () => { tryPlay(); setAudioLoading(false); };
            audio.addEventListener("canplay", fn, { once: true });
            return () => audio.removeEventListener("canplay", fn);
        }
    }, [room?.isPlaying, room?.startedAt]);

    // ── Auto-play next ──
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

    // ── Host controls ──
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

    // ── Song select ──
    const handleSongSelect = async (song: any) => {
        if (!rId || !user) return;
        if (isHost) {
            await updateDoc(doc(db, "rooms", rId), { queue: arrayUnion(song) });
            toast("Lagu ditambahkan ke antrian 🎵", "success");
        } else {
            await addDoc(collection(db, "rooms", rId, "requests"), {
                ...song,
                requestedBy: displayName,
                requesterId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast("Request dikirim ke host 💌", "info");
        }
    };

    // ── Request approve/reject ──
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
    const otherUsers = roomUsers.filter(u => u.uid !== user?.uid);
    const hostUser = roomUsers.find(u => u.uid === room?.hostId);

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#0a0508", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 36, height: 36, border: "2.5px solid rgba(200,0,100,0.15)", borderTopColor: "#c4005c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "rgba(255,180,200,0.35)", fontFamily: "sans-serif", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>Masuk ke ruang kita...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
    if (!room) return null;

    // ─── Sync banner: both listening ──
    const isSynced = roomUsers.length >= 2 && room.isPlaying && roomUsers.every(u => u.status !== "offline");

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0508", color: "#EAEAEA",
            fontFamily: "var(--font-geist-sans), sans-serif",
            display: "flex", flexDirection: "column",
        }}>
            {/* Hidden audio */}
            <audio
                ref={audioRef}
                onTimeUpdate={() => { const a = audioRef.current; if (a) { setCurrentTime(a.currentTime); setDuration(isNaN(a.duration) ? 0 : a.duration); } }}
                onCanPlay={() => setAudioLoading(false)}
                onWaiting={() => setAudioLoading(true)}
                onPlaying={() => setAudioLoading(false)}
                onEnded={handleAudioEnded}
                onError={() => setAudioLoading(false)}
                preload="auto"
            />

            {/* ── Header ── */}
            <header style={{
                padding: "0 16px", height: 54,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(10,5,8,0.9)", backdropFilter: "blur(16px)",
                position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
            }}>
                <button onClick={() => router.push("/dashboard")} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    borderRadius: 20, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.4)", cursor: "pointer",
                    fontSize: 13, fontFamily: "inherit", minHeight: 44,
                }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#e0608a"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                >
                    <ArrowLeftIcon style={{ width: 15, height: 15 }} /> Keluar
                </button>

                <div style={{ textAlign: "center", flex: 1, padding: "0 12px" }}>
                    <h1 style={{
                        margin: 0, fontSize: 14, fontWeight: 800,
                        color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {room.name || "Ruang Kita"}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 2 }}>
                        <span style={{
                            width: 5, height: 5, borderRadius: "50%", display: "inline-block",
                            background: isHost ? "#e0608a" : "#4ade80",
                        }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {isHost ? "Host" : "Tamu"}{sessionMinutes > 0 ? ` · ${sessionMinutes}m` : ""}
                        </span>
                    </div>
                </div>

                <button onClick={() => setShowSongs(true)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    borderRadius: 20, background: "linear-gradient(135deg, #c4005c, #8c004a)",
                    border: "none", color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 2px 12px rgba(180,0,80,0.3)", minHeight: 44,
                }}>
                    <PlusIcon style={{ width: 15, height: 15 }} />
                    <span>{isHost ? "Tambah" : "Request"}</span>
                </button>
            </header>

            {/* ── Sync Banner ── */}
            <AnimatePresence>
                {isSynced && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: "rgba(74,222,128,0.06)",
                            borderBottom: "1px solid rgba(74,222,128,0.1)",
                            padding: "7px 20px", textAlign: "center",
                        }}
                    >
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(74,222,128,0.7)", letterSpacing: "0.06em" }}>
                            🎵 {roomUsers.map(u => u.displayName.split(" ")[0]).join(" & ")} sedang mendengarkan bersama
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main layout ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* ──── Player (left / top-mobile) ──── */}
                <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "clamp(20px, 4vw, 44px) 20px",
                    minWidth: 0,
                }}>
                    {/* Disc */}
                    <div style={{ position: "relative", marginBottom: "clamp(20px, 4vw, 30px)" }}>
                        <motion.div
                            animate={room.isPlaying ? { rotate: 360 } : { rotate: 0 }}
                            transition={room.isPlaying ? { duration: 10, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                            style={{
                                width: "clamp(130px, 25vw, 170px)", height: "clamp(130px, 25vw, 170px)", borderRadius: "50%",
                                background: "radial-gradient(circle at 35% 35%, #1a0010, #07030a)",
                                border: "2px solid rgba(200,0,100,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: room.isPlaying
                                    ? "0 0 36px rgba(180,0,90,0.18), 0 0 70px rgba(180,0,90,0.06)"
                                    : "0 0 16px rgba(0,0,0,0.45)",
                            }}
                        >
                            <div style={{
                                width: 42, height: 42, borderRadius: "50%",
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <MusicalNoteIcon style={{
                                    width: 18, height: 18,
                                    color: room.currentSong ? "rgba(220,100,150,0.7)" : "rgba(255,255,255,0.1)",
                                }} />
                            </div>
                        </motion.div>
                        {room.isPlaying && (
                            <motion.div
                                animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.35, 0.15] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                style={{
                                    position: "absolute", inset: -14, borderRadius: "50%",
                                    border: "1px solid rgba(200,0,100,0.35)", pointerEvents: "none",
                                }}
                            />
                        )}
                    </div>

                    {/* Track info */}
                    <div style={{ textAlign: "center", marginBottom: "clamp(18px, 4vw, 26px)", width: "100%", maxWidth: 320 }}>
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={room.currentSong?.title || "empty"}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22 }}
                                style={{
                                    margin: "0 0 6px", fontSize: "clamp(17px, 3vw, 22px)", fontWeight: 800, letterSpacing: "-0.2px",
                                    color: room.currentSong ? "#fff" : "rgba(255,255,255,0.18)",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}
                            >
                                {room.currentSong?.title || "Belum ada lagu"}
                            </motion.h2>
                        </AnimatePresence>
                        <p style={{
                            margin: 0, fontSize: 13,
                            color: room.currentSong ? "rgba(220,120,160,0.75)" : "rgba(255,255,255,0.2)",
                        }}>
                            {room.currentSong?.artist || (isHost ? "Tambah lagu →" : "Menunggu host...")}
                        </p>
                        {songsPlayed > 0 && (
                            <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
                                {songsPlayed} lagu sudah diputar
                            </p>
                        )}
                    </div>

                    {/* Progress bar */}
                    {room.currentSong && (
                        <div style={{ width: "100%", maxWidth: 340, marginBottom: "clamp(18px, 4vw, 24px)" }}>
                            <div style={{
                                height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3,
                                overflow: "hidden", cursor: isHost ? "pointer" : "default",
                            }}
                                onClick={(e) => {
                                    if (!isHost || !duration) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    if (audioRef.current) audioRef.current.currentTime = pct * duration;
                                }}
                            >
                                <div style={{
                                    height: "100%", width: `${progress}%`,
                                    background: "linear-gradient(90deg, #c4005c, #e0608a)",
                                    borderRadius: 3, transition: "width 0.35s linear",
                                }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>{formatTime(currentTime)}</span>
                                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>{formatTime(duration)}</span>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "clamp(14px, 4vw, 22px)", marginBottom: 18 }}>
                        <button onClick={() => { setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; }); }} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(255,255,255,0.3)", padding: 6, minWidth: 44, minHeight: 44,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {muted ? <SpeakerXMarkIcon style={{ width: 20, height: 20 }} /> : <SpeakerWaveIcon style={{ width: 20, height: 20 }} />}
                        </button>

                        <motion.button
                            whileHover={isHost ? { scale: 1.06 } : {}}
                            whileTap={isHost ? { scale: 0.94 } : {}}
                            onClick={togglePlay}
                            disabled={!isHost || !room.currentSong}
                            style={{
                                width: 60, height: 60, borderRadius: "50%", border: "none",
                                background: isHost && room.currentSong
                                    ? "linear-gradient(135deg, #c4005c, #8c004a)"
                                    : "rgba(255,255,255,0.07)",
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: isHost && room.currentSong ? "pointer" : "not-allowed",
                                boxShadow: isHost && room.currentSong ? "0 4px 20px rgba(180,0,80,0.35)" : "none",
                            }}
                        >
                            {audioLoading ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            ) : room.isPlaying
                                ? <PauseIcon style={{ width: 24, height: 24 }} />
                                : <PlayIcon style={{ width: 24, height: 24, marginLeft: 2 }} />
                            }
                        </motion.button>

                        <button onClick={skipNext} disabled={!isHost || !room.queue?.length} style={{
                            background: "none", border: "none", minWidth: 44, minHeight: 44,
                            cursor: isHost && room.queue?.length ? "pointer" : "not-allowed",
                            color: isHost && room.queue?.length ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                            padding: 6, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <ForwardIcon style={{ width: 22, height: 22 }} />
                        </button>
                    </div>

                    {/* Volume */}
                    <div style={{ width: "100%", maxWidth: 260, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, position: "relative", height: 22, display: "flex", alignItems: "center" }}>
                            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ width: `${muted ? 0 : volume * 100}%`, height: "100%", background: "rgba(200,0,100,0.45)", borderRadius: 2 }} />
                            </div>
                            <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume}
                                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
                                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                            />
                        </div>
                    </div>

                    {!isHost && (
                        <p style={{ marginTop: 14, fontSize: 10, color: "rgba(220,100,150,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Sinkron dengan host
                        </p>
                    )}
                </div>

                {/* ──── Right panel: Queue + Requests + Users ──── */}
                <aside style={{
                    width: "clamp(260px, 28vw, 310px)", flexShrink: 0,
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(8,4,7,0.5)",
                    display: "flex", flexDirection: "column",
                    // Hide on small screens (handled via mediaQuery style below)
                }}
                    className="room-sidebar"
                >
                    {/* User presence at top */}
                    <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>
                            Di Ruang Ini
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {roomUsers.length === 0 ? (
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", margin: 0 }}>Mengambil data...</p>
                            ) : roomUsers.map(u => (
                                <RoomUserCard
                                    key={u.uid}
                                    u={u}
                                    isHost={u.uid === room?.hostId}
                                    isMe={u.uid === user?.uid}
                                />
                            ))}
                        </div>

                        {/* Other user active banner */}
                        {otherUsers.length > 0 && otherUsers[0].status === "online" && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{
                                    marginTop: 10, padding: "7px 10px",
                                    background: "rgba(74,222,128,0.05)",
                                    border: "1px solid rgba(74,222,128,0.12)",
                                    borderRadius: 10, fontSize: 11, color: "rgba(74,222,128,0.65)",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}
                            >
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                                {otherUsers[0].displayName.split(" ")[0]} sedang aktif sekarang
                            </motion.div>
                        )}
                    </div>

                    {/* Queue section */}
                    <div style={{
                        padding: "14px 14px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <QueueListIcon style={{ width: 15, height: 15, color: "rgba(220,100,150,0.5)" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Antrian</span>
                        {room.queue?.length > 0 && (
                            <span style={{
                                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                                color: "rgba(200,0,100,0.65)", background: "rgba(200,0,100,0.09)",
                                padding: "2px 8px", borderRadius: 20,
                            }}>
                                {room.queue.length}
                            </span>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 100px" }}>
                        {/* Requests */}
                        <AnimatePresence>
                            {isHost && requests.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 18 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(200,0,100,0.6)", textTransform: "uppercase", margin: "0 0 9px 2px" }}>
                                        🎯 Request ({requests.length})
                                    </p>
                                    <AnimatePresence>
                                        {requests.map(req => (
                                            <motion.div
                                                key={req.id}
                                                layout
                                                initial={{ opacity: 0, x: 14 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -14, height: 0, overflow: "hidden" }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    padding: "10px 12px", marginBottom: 6,
                                                    background: "rgba(200,0,100,0.05)",
                                                    border: "1px solid rgba(200,0,100,0.11)",
                                                    borderRadius: 12, display: "flex", alignItems: "center", gap: 8,
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</p>
                                                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>dari {req.requestedBy}</p>
                                                </div>
                                                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                                    <button onClick={() => approveRequest(req)} style={{
                                                        width: 30, height: 30, borderRadius: "50%", border: "none",
                                                        background: "rgba(40,160,80,0.12)", color: "#4ade80",
                                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                    }}>
                                                        <CheckIcon style={{ width: 13, height: 13 }} />
                                                    </button>
                                                    <button onClick={() => rejectRequest(req)} style={{
                                                        width: 30, height: 30, borderRadius: "50%", border: "none",
                                                        background: "rgba(180,30,60,0.12)", color: "#f87171",
                                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                    }}>
                                                        <XMarkIcon style={{ width: 13, height: 13 }} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Queue list */}
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase", margin: "0 0 9px 2px" }}>
                            Selanjutnya
                        </p>
                        {room.queue?.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {room.queue.map((song: any, i: number) => (
                                    <QueueItem
                                        key={`${song.title}-${i}`}
                                        song={song}
                                        isHost={isHost}
                                        isActive={room.currentSong?.title === song.title}
                                        onPlay={() => playFromQueue(song)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "24px 16px", textAlign: "center" }}>
                                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.15)" }}>Antrian kosong</p>
                                <p onClick={() => setShowSongs(true)} style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(200,0,100,0.35)", cursor: "pointer" }}>
                                    + Tambah lagu
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* ── Mobile bottom tab bar ── */}
            <div className="mobile-tabbar" style={{
                display: "none",
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
                background: "rgba(10,5,8,0.95)", backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                padding: "8px 16px 16px",
                flexDirection: "column", gap: 0,
            }}>
                {/* Tab selector */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {(["queue", "requests", "users"] as const).map(tab => {
                        const labels = { queue: "Antrian", requests: `Request${requests.length > 0 ? ` (${requests.length})` : ""}`, users: "Pengguna" };
                        const icons = { queue: <QueueListIcon style={{ width: 14, height: 14 }} />, requests: <MusicalNoteIcon style={{ width: 14, height: 14 }} />, users: <UsersIcon style={{ width: 14, height: 14 }} /> };
                        return (
                            <button key={tab} onClick={() => setMobileTab(tab)} style={{
                                flex: 1, padding: "9px 8px",
                                borderRadius: 12, border: "none",
                                background: mobileTab === tab ? "rgba(200,0,100,0.12)" : "rgba(255,255,255,0.04)",
                                color: mobileTab === tab ? "rgba(220,100,150,0.9)" : "rgba(255,255,255,0.3)",
                                cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                minHeight: 52,
                            }}>
                                {icons[tab]}
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mobileTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        style={{ maxHeight: 220, overflowY: "auto" }}
                    >
                        {mobileTab === "queue" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {room.queue?.length > 0
                                    ? room.queue.map((s: any, i: number) => (
                                        <QueueItem key={`${s.title}-${i}`} song={s} isHost={isHost}
                                            isActive={room.currentSong?.title === s.title}
                                            onPlay={() => playFromQueue(s)} />
                                    ))
                                    : <p style={{ textAlign: "center", padding: "16px 0", fontSize: 13, color: "rgba(255,255,255,0.2)", margin: 0 }}>Antrian kosong</p>
                                }
                            </div>
                        )}
                        {mobileTab === "requests" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {isHost && requests.length > 0
                                    ? requests.map(req => (
                                        <motion.div key={req.id} layout exit={{ opacity: 0, height: 0 }}
                                            style={{
                                                padding: "10px 12px", borderRadius: 12,
                                                background: "rgba(200,0,100,0.05)",
                                                border: "1px solid rgba(200,0,100,0.1)",
                                                display: "flex", alignItems: "center", gap: 8,
                                            }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{req.title}</p>
                                                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>dari {req.requestedBy}</p>
                                            </div>
                                            <div style={{ display: "flex", gap: 5 }}>
                                                <button onClick={() => approveRequest(req)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(40,160,80,0.12)", color: "#4ade80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <CheckIcon style={{ width: 14, height: 14 }} />
                                                </button>
                                                <button onClick={() => rejectRequest(req)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(180,30,60,0.12)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <XMarkIcon style={{ width: 14, height: 14 }} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                    : <p style={{ textAlign: "center", padding: "16px 0", fontSize: 13, color: "rgba(255,255,255,0.2)", margin: 0 }}>Tidak ada request</p>
                                }
                            </div>
                        )}
                        {mobileTab === "users" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {roomUsers.map(u => (
                                    <RoomUserCard key={u.uid} u={u} isHost={u.uid === room?.hostId} isMe={u.uid === user?.uid} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <ReactionSystem roomId={rId} userId={user?.uid || ""} />
            <SongManager isOpen={showSongs} onClose={() => setShowSongs(false)} onSongSelect={handleSongSelect} />

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile responsive */
        @media (max-width: 700px) {
          .room-sidebar { display: none !important; }
          .mobile-tabbar { display: flex !important; }
        }
      `}</style>
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
