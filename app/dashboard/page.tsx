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
    XMarkIcon, UserIcon
} from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
    useBroadcastPresence, useAllPresence, formatLastSeen, getInitials,
    type UserPresence,
} from "@/hooks/usePresence";

// ─── Status Dot ──────────────────────────────────────────────────────────
function StatusDot({ status }: { status: UserPresence["status"] }) {
    const color = status === "online" ? "var(--app-indicator)" : status === "idle" ? "#fbbf24" : "var(--app-text-muted)";
    return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
            {status === "online" && (
                <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
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
                u.currentRoom ? "Sedang mendengarkan" : "Melihat dashboard";

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 16,
            background: isMe ? "var(--app-bg-secondary)" : "var(--app-surface)",
            border: `1.5px solid ${isMe ? "var(--app-primary)" : "var(--app-border)"}`,
            transition: "all 0.2s ease"
        }}>
            <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: isMe ? "var(--app-primary)" : "var(--app-bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: isMe ? "#fff" : "var(--app-text-muted)",
                position: "relative",
                border: "1.5px solid var(--app-border)",
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%", border: "2px solid var(--app-surface)",
                    background: u.status === "online" ? "var(--app-indicator)" : u.status === "idle" ? "#fbbf24" : "var(--app-text-muted)",
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: 700,
                        color: "var(--app-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe ? " (Kamu)" : ""}
                    </p>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--app-text-muted)", fontWeight: 600 }}>
                    {activity}
                </p>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                borderRadius: 22, cursor: "pointer",
                background: isActive ? "var(--app-bg-secondary)" : "var(--app-surface)",
                border: `1.5px solid ${hov ? "var(--app-primary)" : isActive ? "var(--app-primary)" : "var(--app-border)"}`,
                transition: "all 0.3s ease",
                transform: hov ? "translateY(-3px)" : "translateY(0)",
                boxShadow: hov ? "0 12px 30px var(--app-soft-accent)" : "none",
            }}
        >
            <div style={{
                width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                background: isActive ? "var(--app-primary)" : "var(--app-bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
                boxShadow: isActive ? "0 4px 15px var(--app-soft-accent)" : "none",
                position: "relative", overflow: "hidden",
            }}>
                {isActive
                    ? <PlayIcon style={{ width: 22, height: 22, marginLeft: 2 }} />
                    : <MusicalNoteIcon style={{ width: 22, height: 22, color: "var(--app-primary)" }} />
                }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--app-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {room.name}
                    </p>
                    {isActive && (
                        <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                            padding: "3px 8px", borderRadius: 20,
                            background: "var(--app-primary)", color: "#fff",
                        }}>
                            Aktif
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600 }}>by {room.hostName}</span>
                    {room.currentSong && (
                        <>
                            <span style={{ fontSize: 12, color: "var(--app-primary)", fontWeight: 700 }}>
                                ♪ {room.currentSong.title}
                            </span>
                        </>
                    )}
                    {usersInRoom.length > 0 && (
                        <span style={{ fontSize: 12, color: "var(--app-indicator)", fontWeight: 700 }}>
                            • {usersInRoom.length} mendengarkan
                        </span>
                    )}
                </div>
            </div>

            <div style={{ flexShrink: 0 }}>
                {isActive ? (
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 24 }}>
                        {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                            <motion.div key={i}
                                animate={{ height: [h * 3, h * 3 + 10, h * 3] }}
                                transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                style={{ width: 3.5, background: "var(--app-primary)", borderRadius: 3 }}
                            />
                        ))}
                    </div>
                ) : (
                    <ArrowRightOnRectangleIcon style={{ width: 20, height: 20, color: "var(--app-text-muted)", transform: "rotate(180deg)" }} />
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

    const hour = new Date().getHours();
    const isMorning = hour >= 4 && hour < 11;
    const isDay = hour >= 11 && hour < 15;
    const isEvening = hour >= 15 && hour < 18;

    const greeting = isMorning ? "Selamat Pagi" : isDay ? "Selamat Siang" : isEvening ? "Selamat Sore" : "Selamat Malam";
    const greetingEmoji = isMorning ? "☀️" : isDay ? "🌈" : isEvening ? "🌇" : "🌙";

    const onlineUsers = allUsers.filter(u => u.status === "online");
    const orderedUsers = [
        ...allUsers.filter(u => u.status === "online"),
        ...allUsers.filter(u => u.status === "idle"),
        ...allUsers.filter(u => u.status === "offline"),
    ];

    return (
        <div style={{
            minHeight: "100vh", background: "var(--app-bg)",
            fontFamily: "var(--font-fredoka), sans-serif", color: "var(--app-text)",
            position: "relative", transition: "var(--theme-transition)",
        }}>
            {/* Ambient Vibes */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse, var(--app-soft-accent) 0%, transparent 65%)" }} />
            </div>

            {/* Header */}
            <header style={{
                padding: "0 20px", height: 64,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1.5px solid var(--app-border)",
                background: "var(--app-surface)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 100,
                transition: "var(--theme-transition)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: "var(--app-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px var(--app-soft-accent)",
                    }}>
                        <MusicalNoteIcon style={{ width: 16, height: 16, color: "#fff" }} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--app-primary)" }}>ListenWithMe</h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setShowUsers(!showUsers)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                        background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)",
                        color: "var(--app-text-secondary)", fontSize: 12, fontWeight: 800,
                        transition: "all 0.2s"
                    }}>
                        <StatusDot status="online" />
                        {onlineUsers.length} Online
                    </button>
                    <button onClick={() => router.push("/profile")} style={{
                        width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--app-border)",
                        background: "var(--app-bg-secondary)", color: "var(--app-text-muted)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <UserIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>

                {/* Greeting Area */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
                    <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "var(--app-text)", letterSpacing: "-0.02em" }}>
                        {greeting}, {displayName.split(" ")[0]} {greetingEmoji}
                    </h2>
                    <p style={{ margin: 0, fontSize: 16, color: "var(--app-text-muted)", fontWeight: 600 }}>
                        {rooms.length > 0 ? `Ada ${rooms.length} ruang seru yang sedang mendengarkan! ✨` : "Mulai ruang musik pertamamu hari ini."}
                    </p>
                </motion.div>

                {/* Create Button Large */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -4, boxShadow: "0 15px 35px var(--app-soft-accent)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreate(true)}
                    style={{
                        width: "100%", padding: "22px", marginBottom: 48,
                        background: "var(--app-primary)",
                        borderRadius: 24, color: "#fff", cursor: "pointer",
                        fontSize: 18, fontWeight: 900, border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                        boxShadow: "0 10px 25px var(--app-soft-accent)",
                    }}
                >
                    <PlusIcon style={{ width: 24, height: 24 }} strokeWidth={2.5} />
                    Buat Ruang Musik Baru
                </motion.button>

                {/* Rooms List */}
                <section>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "var(--app-text-muted)", textTransform: "uppercase" }}>
                            Eksplorasi Ruang
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: 90, borderRadius: 22, background: "var(--app-surface)", border: "1.5px solid var(--app-border)", opacity: 0.5 }} />
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--app-bg-secondary)", borderRadius: 24, border: "2px dashed var(--app-border)" }}>
                            <MusicalNoteIcon style={{ width: 48, height: 48, color: "var(--app-text-muted)", margin: "0 auto 16px", opacity: 0.3 }} />
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--app-text-muted)" }}>Masih sepi nih, belum ada ruang aktif.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {rooms.map((room, i) => (
                                <RoomCard
                                    key={room.id} room={room}
                                    usersInRoom={allUsers.filter(u => u.currentRoom === room.id && u.status !== "offline")}
                                    onClick={() => router.push(`/room/${room.id}`)} index={i}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Presence Sidebar */}
            <AnimatePresence>
                {showUsers && (
                    <motion.aside
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        style={{
                            position: "fixed", top: 64, right: 0, bottom: 0, width: 300, zIndex: 90,
                            background: "var(--app-surface)", borderLeft: "1.5px solid var(--app-border)",
                            padding: "24px", overflowY: "auto", boxShadow: "-10px 0 30px rgba(0,0,0,0.05)"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Daftar Teman</h3>
                            <button onClick={() => setShowUsers(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-text-muted)" }}>
                                <XMarkIcon style={{ width: 22, height: 22 }} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {orderedUsers.map(u => <UserCard key={u.uid} u={u} isMe={u.uid === user?.uid} />)}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={e => e.target === e.currentTarget && setShowCreate(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{ width: "100%", maxWidth: 400, background: "var(--app-surface)", border: "2px solid var(--app-border)", borderRadius: 28, padding: 32, position: "relative" }}
                        >
                            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900, textAlign: "center" }}>Bikin Ruang Musik</h2>
                            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--app-text-muted)", textAlign: "center", fontWeight: 600 }}>Tentukan nama ruang biar teman gampang nemunya!</p>

                            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <input
                                    type="text" placeholder="Contoh: Dengerin Lagu Galau..."
                                    value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                                    autoFocus required
                                    style={{
                                        width: "100%", padding: "16px 20px", background: "var(--app-bg-secondary)",
                                        border: "1.5px solid var(--app-border)", borderRadius: 16, color: "var(--app-text)",
                                        fontSize: 15, fontWeight: 600, fontFamily: "var(--font-fredoka)", outline: "none"
                                    }}
                                />
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: "var(--app-bg-secondary)", border: "none", color: "var(--app-text-muted)", fontWeight: 700, cursor: "pointer" }}>Batal</button>
                                    <button type="submit" disabled={creating || !newRoomName.trim()} style={{
                                        flex: 2, padding: 14, borderRadius: 14, background: "var(--app-primary)", border: "none", color: "#fff",
                                        fontWeight: 900, cursor: "pointer", boxShadow: "0 5px 15px var(--app-soft-accent)", opacity: creating ? 0.6 : 1
                                    }}>
                                        {creating ? "Membuat..." : "Gas! →"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Nav */}
            <nav className="mobile-bottomnav" style={{
                display: "none", position: "fixed", bottom: 0, left: 0, right: 0, height: 74,
                background: "var(--app-surface)", borderTop: "1.5px solid var(--app-border)",
                justifyContent: "space-around", alignItems: "center", zIndex: 100
            }}>
                <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "var(--app-primary)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <MusicalNoteIcon style={{ width: 24, height: 24 }} />
                    <span style={{ fontSize: 10, fontWeight: 800 }}>DASHBOARD</span>
                </button>
                <button onClick={() => router.push("/profile")} style={{ background: "none", border: "none", color: "var(--app-text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <UserIcon style={{ width: 24, height: 24 }} />
                    <span style={{ fontSize: 10, fontWeight: 800 }}>PROFIL</span>
                </button>
            </nav>

            <style>{`
                @media (max-width: 680px) {
                    .presence-sidebar { display: none !important; }
                    .mobile-bottomnav { display: flex !important; }
                    main { padding-bottom: 100px !important; }
                }
            `}</style>
        </div>
    );
}
