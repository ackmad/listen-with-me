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
} from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
    useBroadcastPresence, useAllPresence, formatLastSeen, getInitials,
    type UserPresence,
} from "@/hooks/usePresence";

// ─── Presence dot ─────────────────────────────────────────────────────────
function StatusDot({ status }: { status: UserPresence["status"] }) {
    const color = status === "online" ? "#4ade80" : status === "idle" ? "#fbbf24" : "#6b7280";
    return (
        <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: color, flexShrink: 0,
            boxShadow: status === "online" ? `0 0 5px ${color}` : "none",
        }}>
            {status === "online" && (
                <motion.span
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        display: "block", width: "100%", height: "100%",
                        borderRadius: "50%", background: color,
                    }}
                />
            )}
        </span>
    );
}

// ─── User card for presence list ──────────────────────────────────────────
function UserCard({ u, isMe }: { u: UserPresence; isMe: boolean }) {
    const activityLabel =
        u.status === "offline" ? "Offline" :
            u.status === "idle" ? "Sedang idle" :
                u.currentRoom ? "Sedang di room" : "Melihat dashboard";

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 14,
            background: isMe ? "rgba(200,0,100,0.05)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isMe ? "rgba(200,0,100,0.12)" : "rgba(255,255,255,0.05)"}`,
        }}>
            {/* Avatar */}
            <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, rgba(180,0,80,0.4), rgba(100,0,150,0.4))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "rgba(255,200,220,0.9)",
                border: `2px solid ${u.status === "online" ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)"}`,
                position: "relative",
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: u.status === "online" ? "#4ade80" : u.status === "idle" ? "#fbbf24" : "#6b7280",
                    border: "2px solid #0a0508",
                }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: 700,
                        color: u.status === "offline" ? "rgba(255,255,255,0.3)" : "#fff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe && " (kamu)"}
                    </p>
                    {isMe && (
                        <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                            color: "rgba(200,0,100,0.8)", background: "rgba(200,0,100,0.1)",
                            padding: "2px 6px", borderRadius: 20, flexShrink: 0,
                        }}>kamu</span>
                    )}
                </div>
                <p style={{
                    margin: "2px 0 0", fontSize: 11,
                    color: u.status === "offline" ? "rgba(255,255,255,0.2)" :
                        u.status === "idle" ? "rgba(251,191,36,0.6)" :
                            "rgba(74,222,128,0.6)",
                }}>
                    {activityLabel}
                </p>
                {u.status !== "online" && u.lastSeen > 0 && (
                    <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
                        Terakhir aktif {formatLastSeen(u.lastSeen)}
                    </p>
                )}
            </div>
        </div>
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

    // Auth
    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) { router.push("/"); return; }
            setUser(u);
        });
    }, [router]);

    // Presence: broadcast self
    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
    const { updateActivity } = useBroadcastPresence(
        user?.uid ?? null,
        displayName,
        user?.photoURL ?? null,
        { activity: "Melihat dashboard", currentRoom: null }
    );

    // Presence: watch all users
    const handlePresenceUpdate = useCallback((users: UserPresence[]) => {
        setAllUsers(users);
    }, []);
    useAllPresence(handlePresenceUpdate);

    // Rooms
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
                name: newRoomName.trim(),
                hostId: user.uid,
                hostName: displayName,
                createdAt: serverTimestamp(),
                isPlaying: false,
                currentSong: null,
                queue: [],
            });
            router.push(`/room/${docRef.id}`);
        } catch (err: any) {
            console.error("Create room:", err.message);
            setCreating(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 5) return "Masih melek nih";
        if (h < 12) return "Selamat pagi";
        if (h < 17) return "Selamat siang";
        if (h < 20) return "Selamat sore";
        return "Selamat malam";
    };

    const onlineUsers = allUsers.filter(u => u.status === "online");
    const orderedUsers = [
        ...allUsers.filter(u => u.status === "online"),
        ...allUsers.filter(u => u.status === "idle"),
        ...allUsers.filter(u => u.status === "offline"),
    ];

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0508",
            fontFamily: "var(--font-geist-sans), sans-serif", color: "#e8e8e8",
            position: "relative", overflow: "hidden",
        }}>
            {/* Ambient glow */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <div style={{
                    position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
                    width: 700, height: 500,
                    background: "radial-gradient(ellipse, rgba(160,0,80,0.07) 0%, transparent 70%)",
                }} />
            </div>

            {/* ── Header ── */}
            <header style={{
                padding: "0 20px", height: 58,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(10,5,8,0.85)", backdropFilter: "blur(16px)",
                position: "sticky", top: 0, zIndex: 30,
            }}>
                <div>
                    <h1 style={{
                        margin: 0, fontSize: 15, fontWeight: 800,
                        background: "linear-gradient(135deg, #fff, rgba(255,180,200,0.7))",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>🎧 ListenWithMe</h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Online count pill */}
                    <button
                        onClick={() => setShowUsers(v => !v)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 20,
                            background: showUsers ? "rgba(200,0,100,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${showUsers ? "rgba(200,0,100,0.2)" : "rgba(255,255,255,0.07)"}`,
                            color: showUsers ? "rgba(220,100,150,0.9)" : "rgba(255,255,255,0.4)",
                            cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}
                    >
                        <span style={{
                            width: 7, height: 7, borderRadius: "50%", background: "#4ade80",
                            boxShadow: "0 0 5px #4ade80",
                        }} />
                        <span>{onlineUsers.length} online</span>
                        <UserGroupIcon style={{ width: 14, height: 14 }} />
                    </button>

                    <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20,
                        background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#e0608a"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                    >
                        <ArrowRightOnRectangleIcon style={{ width: 15, height: 15 }} />
                        <span style={{ display: "none" }}>Keluar</span>
                    </button>
                </div>
            </header>

            {/* ── Layout: sidebar + main ── */}
            <div style={{
                maxWidth: 1100, margin: "0 auto", padding: "0 16px",
                display: "flex", gap: 28, position: "relative", zIndex: 1,
                alignItems: "flex-start",
            }}>
                {/* ──── Main Content ──── */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 36, paddingBottom: 40 }}>
                    {/* Greeting */}
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{
                            margin: "0 0 5px", fontSize: "clamp(20px, 4vw, 26px)",
                            fontWeight: 800, letterSpacing: "-0.3px", color: "#fff",
                        }}>
                            {greeting()}, {displayName} 👋
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                            {onlineUsers.length > 1
                                ? `${onlineUsers.length} orang sedang online sekarang`
                                : "Mau dengerin lagu bareng hari ini?"
                            }
                        </p>
                    </div>

                    {/* Create button */}
                    <motion.button
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setShowCreate(true)}
                        style={{
                            width: "100%", padding: "17px 24px", marginBottom: 28,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            background: "linear-gradient(135deg, rgba(180,0,80,0.85), rgba(110,0,60,0.85))",
                            border: "1px solid rgba(200,0,100,0.2)",
                            borderRadius: 18, color: "#fff", cursor: "pointer",
                            fontFamily: "inherit", fontSize: 15, fontWeight: 700,
                            boxShadow: "0 4px 20px rgba(160,0,80,0.2), inset 0 1px 0 rgba(255,255,255,0.07)",
                        }}
                    >
                        <PlusIcon style={{ width: 20, height: 20 }} />
                        Mulai Sesi Baru
                    </motion.button>

                    {/* Rooms */}
                    <p style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                        color: "rgba(255,255,255,0.2)", textTransform: "uppercase", margin: "0 0 14px",
                    }}>
                        Sesi Tersedia
                    </p>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "50px 0" }}>
                            <div style={{ width: 28, height: 28, border: "2px solid rgba(200,0,100,0.15)", borderTopColor: "#c4005c", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "50px 20px" }}>
                            <MusicalNoteIcon style={{ width: 36, height: 36, color: "rgba(255,255,255,0.1)", margin: "0 auto 12px", display: "block" }} />
                            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.15)" }}>Belum ada sesi aktif</p>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(200,0,100,0.35)", cursor: "pointer" }} onClick={() => setShowCreate(true)}>
                                Buat yang pertama →
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {rooms.map((room, i) => {
                                const usersInRoom = allUsers.filter(u => u.currentRoom === room.id && u.status !== "offline");
                                return (
                                    <motion.div
                                        key={room.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.22, delay: i * 0.04 }}
                                        onClick={() => router.push(`/room/${room.id}`)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 14,
                                            padding: "15px 18px", borderRadius: 16, cursor: "pointer",
                                            background: "rgba(255,255,255,0.02)",
                                            border: "1px solid rgba(255,255,255,0.05)",
                                            transition: "all 0.18s",
                                        }}
                                        whileHover={{
                                            background: "rgba(200,0,100,0.05)",
                                            borderColor: "rgba(200,0,100,0.13)",
                                            y: -2,
                                        }}
                                    >
                                        {/* Play icon */}
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                                            background: room.isPlaying
                                                ? "linear-gradient(135deg, rgba(180,0,80,0.4), rgba(100,0,150,0.4))"
                                                : "rgba(255,255,255,0.04)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            boxShadow: room.isPlaying ? "0 0 14px rgba(180,0,80,0.25)" : "none",
                                        }}>
                                            {room.isPlaying
                                                ? <PlayIcon style={{ width: 17, height: 17, color: "rgba(220,100,150,0.9)", marginLeft: 2 }} />
                                                : <MusicalNoteIcon style={{ width: 17, height: 17, color: "rgba(255,255,255,0.2)" }} />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {room.name}
                                            </p>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>oleh {room.hostName}</span>
                                                {room.currentSong && (
                                                    <>
                                                        <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
                                                        <span style={{ fontSize: 12, color: "rgba(220,100,150,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                                                            ♪ {room.currentSong.title}
                                                        </span>
                                                    </>
                                                )}
                                                {usersInRoom.length > 0 && (
                                                    <>
                                                        <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
                                                        <span style={{ fontSize: 12, color: "rgba(74,222,128,0.5)" }}>
                                                            {usersInRoom.length} di ruang ini
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status indicator */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                            {room.isPlaying && (
                                                <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                                                    {[1, 2, 3].map(j => (
                                                        <motion.div key={j}
                                                            animate={{ height: [3, 10, 3] }}
                                                            transition={{ duration: 0.7, repeat: Infinity, delay: j * 0.1 }}
                                                            style={{ width: 2.5, background: "rgba(200,0,100,0.5)", borderRadius: 2, minHeight: 3 }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <span style={{
                                                fontSize: 11,
                                                color: room.isPlaying ? "rgba(220,100,150,0.7)" : "rgba(255,255,255,0.2)",
                                            }}>
                                                {room.isPlaying ? "Aktif" : "Diam"}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ──── Sidebar: Online Users ──── */}
                <AnimatePresence>
                    {showUsers && (
                        <motion.aside
                            initial={{ opacity: 0, x: 20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 276 }}
                            exit={{ opacity: 0, x: 20, width: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                flexShrink: 0, overflow: "hidden",
                                paddingTop: 36,
                            }}
                        >
                            <div style={{
                                width: 276,
                                background: "rgba(8,4,7,0.6)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 20,
                                padding: "20px 16px",
                                position: "sticky", top: 78,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                                            Pengguna Aktif
                                        </p>
                                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                                            {onlineUsers.length} dari {orderedUsers.length} online
                                        </p>
                                    </div>
                                    {/* Online bar */}
                                    <div style={{
                                        height: 3, width: 50, borderRadius: 3, overflow: "hidden",
                                        background: "rgba(255,255,255,0.07)",
                                    }}>
                                        <div style={{
                                            height: "100%", borderRadius: 3,
                                            width: `${orderedUsers.length ? (onlineUsers.length / orderedUsers.length) * 100 : 0}%`,
                                            background: "linear-gradient(90deg, #4ade80, #22d3ee)",
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {orderedUsers.length === 0 ? (
                                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "20px 0" }}>
                                            Belum ada data presence
                                        </p>
                                    ) : orderedUsers.map(u => (
                                        <UserCard key={u.uid} u={u} isMe={u.uid === user?.uid} />
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Create Room Modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
                        style={{
                            position: "fixed", inset: 0, zIndex: 200,
                            background: "rgba(0,0,0,0.65)",
                            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 16 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                width: "100%", maxWidth: 380, padding: "32px 28px",
                                background: "rgba(12,5,9,0.97)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 24, boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
                                position: "relative", overflow: "hidden",
                            }}
                        >
                            <div style={{
                                position: "absolute", top: 0, left: "30%", right: "30%", height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(200,0,100,0.5), transparent)",
                            }} />
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff" }}>Buat Sesi Baru</h2>
                            <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                                Beri nama ruang dengerin kalian
                            </p>
                            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <input
                                    type="text" placeholder="malam minggu sama savira..."
                                    value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                                    autoFocus required
                                    style={{
                                        width: "100%", padding: "13px 16px",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: 12, color: "#fff", fontSize: 14,
                                        fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "rgba(200,0,100,0.4)"}
                                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                                />
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button type="button" onClick={() => setShowCreate(false)}
                                        style={{
                                            flex: 1, height: 48, borderRadius: 12, cursor: "pointer",
                                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                                            color: "rgba(255,255,255,0.4)", fontFamily: "inherit", fontSize: 14,
                                        }}>
                                        Batal
                                    </button>
                                    <motion.button
                                        whileHover={!creating && newRoomName.trim() ? { scale: 1.02 } : {}}
                                        whileTap={!creating && newRoomName.trim() ? { scale: 0.98 } : {}}
                                        type="submit" disabled={creating || !newRoomName.trim()}
                                        style={{
                                            flex: 2, height: 48, borderRadius: 12,
                                            cursor: creating || !newRoomName.trim() ? "not-allowed" : "pointer",
                                            background: "linear-gradient(135deg, #c4005c, #8c004a)",
                                            border: "none", color: "#fff", fontFamily: "inherit",
                                            fontSize: 14, fontWeight: 700,
                                            boxShadow: "0 3px 14px rgba(180,0,80,0.3)",
                                            opacity: creating || !newRoomName.trim() ? 0.6 : 1,
                                        }}>
                                        {creating ? "Membuat..." : "Yuk Mulai →"}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
