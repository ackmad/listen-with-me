"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection, onSnapshot, query, orderBy, addDoc, serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRightOnRectangleIcon, PlusIcon, MusicalNoteIcon, UserGroupIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
    useBroadcastPresence, useAllPresence, formatLastSeen, getInitials,
    type UserPresence,
} from "@/hooks/usePresence";

// ─── Status Dot ──────────────────────────────────────────────────────────
function StatusDot({ status }: { status: UserPresence["status"] }) {
    const color = status === "online" ? "#4ade80" : status === "idle" ? "#fbbf24" : "#374151";
    return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
            {status === "online" && (
                <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, pointerEvents: "none" }}
                />
            )}
        </span>
    );
}

// ─── User card for presence drawer ───────────────────────────────────────
function UserCard({ u, isMe }: { u: UserPresence; isMe: boolean }) {
    const activity =
        u.status === "offline" ? "Offline" :
            u.status === "idle" ? "Sedang idle" :
                u.currentRoom ? "Sedang di room" : "Melihat dashboard";

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 14,
            background: isMe ? "rgba(200,0,100,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isMe ? "rgba(200,0,100,0.14)" : "rgba(255,255,255,0.04)"}`,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: isMe
                    ? "linear-gradient(135deg, rgba(200,0,100,0.45), rgba(120,0,160,0.45))"
                    : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                color: isMe ? "rgba(255,200,220,0.9)" : "rgba(255,255,255,0.45)",
                position: "relative",
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%", border: "2px solid #0a0508",
                    background: u.status === "online" ? "#4ade80" : u.status === "idle" ? "#fbbf24" : "#374151",
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: 700,
                        color: u.status === "offline" ? "rgba(255,255,255,0.3)" : "#fff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}
                    </p>
                    {isMe && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(200,0,100,0.7)", background: "rgba(200,0,100,0.1)", padding: "2px 6px", borderRadius: 20, flexShrink: 0 }}>
                            kamu
                        </span>
                    )}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: u.status === "offline" ? "rgba(255,255,255,0.18)" : u.status === "idle" ? "rgba(251,191,36,0.55)" : "rgba(74,222,128,0.6)" }}>
                    {activity}
                </p>
                {u.status !== "online" && u.lastSeen > 0 && (
                    <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.12)" }}>
                        {formatLastSeen(u.lastSeen)}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Room Card ────────────────────────────────────────────────────────────
function RoomCard({ room, usersInRoom, onClick, index }: { room: any; usersInRoom: UserPresence[]; onClick: () => void; index: number }) {
    const [hov, setHov] = useState(false);
    const isActive = room.isPlaying;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                borderRadius: 18, cursor: "pointer",
                background: hov
                    ? isActive ? "rgba(200,0,100,0.07)" : "rgba(255,255,255,0.04)"
                    : isActive ? "rgba(200,0,100,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${hov
                    ? isActive ? "rgba(200,0,100,0.2)" : "rgba(255,255,255,0.09)"
                    : isActive ? "rgba(200,0,100,0.12)" : "rgba(255,255,255,0.05)"}`,
                transition: "all 0.2s ease",
                transform: hov ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hov
                    ? isActive ? "0 8px 32px rgba(200,0,100,0.12)" : "0 8px 24px rgba(0,0,0,0.2)"
                    : "none",
            }}
        >
            {/* Disc icon */}
            <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: isActive
                    ? "linear-gradient(135deg, rgba(180,0,80,0.5), rgba(100,0,150,0.5))"
                    : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${isActive ? "rgba(200,0,100,0.2)" : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? "0 0 20px rgba(180,0,80,0.2)" : "none",
                position: "relative", overflow: "hidden",
            }}>
                {isActive
                    ? <PlayIcon style={{ width: 18, height: 18, color: "rgba(220,120,160,0.95)", marginLeft: 2 }} />
                    : <MusicalNoteIcon style={{ width: 18, height: 18, color: "rgba(255,255,255,0.2)" }} />
                }
                {isActive && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: "absolute", inset: -32, borderRadius: "50%", opacity: 0.06,
                            background: "conic-gradient(rgba(200,0,100,0.8) 0deg, transparent 180deg)",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {room.name}
                    </p>
                    <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0,
                        padding: "2px 7px", borderRadius: 10,
                        background: isActive ? "rgba(200,0,100,0.12)" : "rgba(255,255,255,0.05)",
                        color: isActive ? "rgba(220,100,150,0.8)" : "rgba(255,255,255,0.25)",
                        border: `1px solid ${isActive ? "rgba(200,0,100,0.2)" : "rgba(255,255,255,0.07)"}`,
                    }}>
                        {isActive ? "Aktif" : "Diam"}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>oleh {room.hostName}</span>

                    {room.currentSong && (
                        <>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "rgba(220,100,150,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                                ♪ {room.currentSong.title}
                            </span>
                        </>
                    )}

                    {usersInRoom.length > 0 && (
                        <>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "rgba(74,222,128,0.55)" }}>
                                {usersInRoom.length} di ruang ini
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: waveform if playing */}
            <div style={{ flexShrink: 0 }}>
                {isActive ? (
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 20 }}>
                        {[1, 2, 3, 2, 1].map((h, i) => (
                            <motion.div key={i}
                                animate={{ height: [h * 3, h * 3 + 8, h * 3] }}
                                transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                style={{ width: 3, background: "rgba(200,0,100,0.55)", borderRadius: 3, minHeight: 3 }}
                            />
                        ))}
                    </div>
                ) : (
                    <ArrowRightOnRectangleIcon style={{ width: 16, height: 16, color: "rgba(255,255,255,0.12)", transform: "rotate(180deg)" }} />
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────
export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [creating, setCreating] = useState(false);
    const [showUsers, setShowUsers] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) { router.push("/"); return; }
            setUser(u);
        });
    }, [router]);

    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

    useBroadcastPresence(user?.uid ?? null, displayName, user?.photoURL ?? null, { activity: "Melihat dashboard", currentRoom: null });

    const handlePresenceUpdate = useCallback((users: UserPresence[]) => setAllUsers(users), []);
    useAllPresence(handlePresenceUpdate);

    useEffect(() => {
        const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (err) => { console.warn("Rooms:", err.message); setLoading(false); });
        return () => unsub();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !user) return;
        setCreating(true);
        try {
            const docRef = await addDoc(collection(db, "rooms"), {
                name: newRoomName.trim(), hostId: user.uid, hostName: displayName,
                createdAt: serverTimestamp(), isPlaying: false, currentSong: null, queue: [],
            });
            router.push(`/room/${docRef.id}`);
        } catch (err: any) { console.error("Create room:", err.message); setCreating(false); }
    };

    const handleLogout = async () => { await signOut(auth); router.push("/"); };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 5) return "Masih melek nih";
        if (h < 11) return "Selamat pagi";
        if (h < 15) return "Selamat siang";
        if (h < 18) return "Selamat sore";
        return "Selamat malam";
    };
    const greetingEmoji = () => {
        const h = new Date().getHours();
        if (h < 5) return "🌙";
        if (h < 11) return "☀️";
        if (h < 18) return "👋";
        return "🌙";
    };

    const onlineUsers = allUsers.filter(u => u.status === "online");
    const orderedUsers = [
        ...allUsers.filter(u => u.status === "online"),
        ...allUsers.filter(u => u.status === "idle"),
        ...allUsers.filter(u => u.status === "offline"),
    ];

    return (
        <div style={{
            minHeight: "100vh", background: "#080408",
            fontFamily: "var(--font-geist-sans), sans-serif", color: "#e8e8e8",
            position: "relative",
        }}>
            {/* Background ambient */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse, rgba(150,0,70,0.08) 0%, transparent 65%)" }} />
                <div style={{ position: "absolute", bottom: "5%", right: "10%", width: 400, height: 400, background: "radial-gradient(ellipse, rgba(60,0,120,0.06) 0%, transparent 60%)" }} />
            </div>

            {/* ── Header ── */}
            <header style={{
                padding: "0 20px", height: 58,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(8,4,8,0.9)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 30,
            }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "linear-gradient(135deg, #c4005c, #6c0050)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 12px rgba(180,0,85,0.35)",
                    }}>
                        <MusicalNoteIcon style={{ width: 14, height: 14, color: "#fff" }} />
                    </div>
                    <h1 style={{
                        margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.2px",
                        background: "linear-gradient(135deg, #fff 40%, rgba(255,180,200,0.7) 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>ListenWithMe</h1>
                </div>

                {/* Right controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowUsers(v => !v)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                            background: showUsers ? "rgba(200,0,100,0.1)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${showUsers ? "rgba(200,0,100,0.22)" : "rgba(255,255,255,0.07)"}`,
                            color: showUsers ? "rgba(220,110,150,0.9)" : "rgba(255,255,255,0.4)",
                            fontSize: 13, fontFamily: "inherit", transition: "all 0.2s",
                        }}
                    >
                        <StatusDot status="online" />
                        {onlineUsers.length} online
                        <UserGroupIcon style={{ width: 14, height: 14 }} />
                    </motion.button>

                    <button onClick={handleLogout} style={{
                        width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)",
                        background: "transparent", color: "rgba(255,255,255,0.3)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#e0608a")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                    >
                        <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1, display: "flex", gap: 24, alignItems: "flex-start" }}>

                {/* ─── Main ─── */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 40, paddingBottom: 80 }}>

                    {/* Greeting header */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 36 }}>
                        <h2 style={{ margin: "0 0 6px", fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>
                            {greeting()}, {displayName} {greetingEmoji()}
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>
                            {onlineUsers.length > 1
                                ? `${onlineUsers.length} orang sedang online sekarang ✦`
                                : "Mau dengerin lagu bareng hari ini?"
                            }
                        </p>
                    </motion.div>

                    {/* ── Create Room CTA ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
                        style={{ marginBottom: 36 }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.015, y: -2, boxShadow: "0 12px 40px rgba(180,0,80,0.3)" }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => setShowCreate(true)}
                            style={{
                                width: "100%", padding: "18px 28px",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                background: "linear-gradient(135deg, #c4005c 0%, #780042 100%)",
                                border: "1px solid rgba(220,100,160,0.2)",
                                borderRadius: 20, color: "#fff", cursor: "pointer",
                                fontFamily: "inherit", fontSize: 16, fontWeight: 700,
                                boxShadow: "0 4px 24px rgba(160,0,80,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                                position: "relative", overflow: "hidden",
                                letterSpacing: "-0.1px",
                            }}
                        >
                            {/* Shimmer */}
                            <motion.div
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                                style={{
                                    position: "absolute", inset: 0,
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                                    pointerEvents: "none",
                                }}
                            />
                            <PlusIcon style={{ width: 20, height: 20 }} />
                            Mulai Sesi Baru
                        </motion.button>
                    </motion.div>

                    {/* ── Rooms ── */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>
                                Sesi Tersedia
                            </p>
                            {rooms.length > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: "rgba(200,0,100,0.6)",
                                    background: "rgba(200,0,100,0.08)", padding: "2px 8px", borderRadius: 20,
                                    border: "1px solid rgba(200,0,100,0.12)",
                                }}>
                                    {rooms.length}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {[1, 2].map(i => (
                                    <motion.div key={i}
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
                                        style={{ height: 80, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
                                    />
                                ))}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: 20, background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize: 40, marginBottom: 14 }}>🎵</div>
                                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>Belum ada sesi aktif</p>
                                <p onClick={() => setShowCreate(true)} style={{ margin: 0, fontSize: 13, color: "rgba(200,0,100,0.4)", cursor: "pointer" }}>
                                    Buat yang pertama →
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {rooms.map((room, i) => {
                                    const usersInRoom = allUsers.filter(u => u.currentRoom === room.id && u.status !== "offline");
                                    return (
                                        <RoomCard
                                            key={room.id} room={room} usersInRoom={usersInRoom}
                                            onClick={() => router.push(`/room/${room.id}`)} index={i}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ─── Users Sidebar ─── */}
                <AnimatePresence>
                    {showUsers && (
                        <motion.aside
                            initial={{ opacity: 0, x: 24, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 268 }}
                            exit={{ opacity: 0, x: 24, width: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="presence-sidebar"
                            style={{ flexShrink: 0, overflow: "hidden", paddingTop: 40 }}
                        >
                            <div style={{
                                width: 268,
                                background: "rgba(12,5,10,0.8)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 20, padding: "20px 14px",
                                position: "sticky", top: 78,
                                backdropFilter: "blur(16px)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>Pengguna</p>
                                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                                            {onlineUsers.length}/{orderedUsers.length} online
                                        </p>
                                    </div>
                                    <button onClick={() => setShowUsers(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <XMarkIcon style={{ width: 14, height: 14 }} />
                                    </button>
                                </div>

                                {/* Online ratio bar */}
                                <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.05)", marginBottom: 16, overflow: "hidden" }}>
                                    <motion.div
                                        animate={{ width: `${orderedUsers.length ? (onlineUsers.length / orderedUsers.length) * 100 : 0}%` }}
                                        transition={{ duration: 0.6 }}
                                        style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #4ade80, #22d3ee)" }}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {orderedUsers.length === 0
                                        ? <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", textAlign: "center", padding: "20px 0", margin: 0 }}>Belum ada data</p>
                                        : orderedUsers.map(u => <UserCard key={u.uid} u={u} isMe={u.uid === user?.uid} />)
                                    }
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Mobile bottom nav ── */}
            <div className="mobile-bottomnav" style={{
                display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
                background: "rgba(8,4,8,0.97)", backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "10px 24px 24px",
                justifyContent: "space-around",
            }}>
                <button onClick={() => router.push("/dashboard")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "rgba(200,0,100,0.85)", padding: "4px 16px" }}>
                    <MusicalNoteIcon style={{ width: 22, height: 22 }} />
                    <span style={{ fontSize: 10, fontFamily: "inherit", fontWeight: 600 }}>Dashboard</span>
                </button>
                <button onClick={() => router.push("/profile")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "4px 16px" }}>
                    <UserGroupIcon style={{ width: 22, height: 22 }} />
                    <span style={{ fontSize: 10, fontFamily: "inherit", fontWeight: 600 }}>Profile</span>
                </button>
            </div>

            {/* ── Create Room Modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={e => e.target === e.currentTarget && setShowCreate(false)}
                        style={{
                            position: "fixed", inset: 0, zIndex: 200,
                            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
                            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 20 }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                width: "100%", maxWidth: 390, padding: "32px 28px",
                                background: "rgba(12,5,9,0.98)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 24, boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
                                position: "relative", overflow: "hidden",
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 1, background: "linear-gradient(90deg, transparent, rgba(200,0,100,0.6), transparent)" }} />

                            <div style={{ fontSize: 36, marginBottom: 16, textAlign: "center" }}>🎵</div>
                            <h2 style={{ margin: "0 0 7px", fontSize: 20, fontWeight: 800, color: "#fff", textAlign: "center" }}>Buat Sesi Baru</h2>
                            <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                                Beri nama ruang dengerin kalian
                            </p>

                            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <input
                                    type="text"
                                    placeholder="malam minggu sama savira..."
                                    value={newRoomName}
                                    onChange={e => setNewRoomName(e.target.value)}
                                    autoFocus required
                                    style={{
                                        width: "100%", padding: "14px 16px", boxSizing: "border-box",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: 14, color: "#fff", fontSize: 14,
                                        fontFamily: "inherit", outline: "none",
                                    }}
                                    onFocus={e => e.target.style.borderColor = "rgba(200,0,100,0.45)"}
                                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                                />
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button type="button" onClick={() => setShowCreate(false)} style={{
                                        flex: 1, height: 50, borderRadius: 14, cursor: "pointer",
                                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                        color: "rgba(255,255,255,0.4)", fontFamily: "inherit", fontSize: 14,
                                    }}>
                                        Batal
                                    </button>
                                    <motion.button
                                        whileHover={!creating && newRoomName.trim() ? { scale: 1.02 } : {}}
                                        whileTap={!creating && newRoomName.trim() ? { scale: 0.98 } : {}}
                                        type="submit" disabled={creating || !newRoomName.trim()}
                                        style={{
                                            flex: 2, height: 50, borderRadius: 14,
                                            cursor: creating || !newRoomName.trim() ? "not-allowed" : "pointer",
                                            background: "linear-gradient(135deg, #c4005c, #8c004a)",
                                            border: "none", color: "#fff", fontFamily: "inherit",
                                            fontSize: 15, fontWeight: 700,
                                            boxShadow: "0 4px 16px rgba(180,0,80,0.3)",
                                            opacity: creating || !newRoomName.trim() ? 0.55 : 1,
                                        }}
                                    >
                                        {creating ? "Membuat..." : "Yuk Mulai →"}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 680px) {
                    .presence-sidebar { display: none !important; }
                    .mobile-bottomnav { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
