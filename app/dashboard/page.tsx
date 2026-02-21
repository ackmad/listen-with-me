"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection, onSnapshot, query, orderBy, addDoc, serverTimestamp,
    doc, getDoc, setDoc, updateDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRightOnRectangleIcon, PlusIcon, MusicalNoteIcon, UserGroupIcon,
    XMarkIcon, UserIcon
} from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
    useBroadcastPresence, useAllPresence, useMergedPresence, formatLastSeen, getInitials,
    type UserPresence,
} from "@/hooks/usePresence";
import { LOCAL_SONGS } from "@/components/SongManager";

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
function UserCard({ u, isMe, onJoin }: { u: UserPresence; isMe: boolean; onJoin: (roomId: string) => void }) {
    const router = useRouter();
    const isOnline = u.status === "online";
    const isIdle = u.status === "idle";
    const isOffline = u.status === "offline";

    let activityText = u.activity || (isOffline ? "Offline" : "Aktif");
    const hasRoom = !!u.currentRoom;

    if (u.currentRoom && u.currentRoomName) {
        activityText = isOffline ? `Ttp denger lagu di ${u.currentRoomName}` : `Mendengarkan di ${u.currentRoomName}`;
    } else if (u.currentRoom) {
        activityText = isOffline ? "Ttp denger lagu nih" : "Sedang mendengarkan";
    }

    const statusColor = isOnline ? "var(--app-indicator)" : isIdle ? "#fbbf24" : "var(--app-text-muted)";

    return (
        <motion.div
            whileHover={{ x: 4, background: "var(--app-bg-secondary)" }}
            onClick={() => hasRoom && u.currentRoom && onJoin(u.currentRoom)}
            style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 20,
                background: isMe ? "var(--app-bg-secondary)" : "transparent",
                border: `1.5px solid ${isMe ? "var(--app-primary)" : "var(--app-border)"}`,
                transition: "all 0.2s ease",
                cursor: hasRoom ? "pointer" : "default",
                position: "relative",
                overflow: "hidden"
            }}>
            <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: isOnline ? "var(--app-primary)" : "var(--app-bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800,
                color: isOnline ? "#fff" : "var(--app-text-muted)",
                position: "relative",
                border: "2px solid var(--app-border)",
            }}>
                {getInitials(u.displayName)}
                <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--app-surface)",
                    background: statusColor,
                }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                    <p style={{
                        margin: 0, fontSize: 13, fontWeight: 800,
                        color: "var(--app-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {u.displayName}{isMe ? " (Kamu)" : ""}
                    </p>
                    {!isOnline && u.lastSeen > 0 && (
                        <span style={{ fontSize: 9, color: "var(--app-text-muted)", fontWeight: 700 }}>
                            {formatLastSeen(u.lastSeen)}
                        </span>
                    )}
                </div>
                <p style={{
                    margin: 0, fontSize: 11,
                    color: hasRoom ? "var(--app-primary)" : "var(--app-text-muted)",
                    fontWeight: 700,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 4
                }}>
                    {hasRoom && <MusicalNoteIcon style={{ width: 10, height: 10 }} />}
                    {activityText}
                </p>
            </div>
            {hasRoom && !isMe && (
                <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--app-primary)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 10px var(--app-soft-accent)"
                }}>
                    <PlayIcon style={{ width: 14, height: 14, marginLeft: 2 }} />
                </div>
            )}
        </motion.div>
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

            // Ensure user is registered in Firestore
            const userRef = doc(db, "users", u.uid);
            getDoc(userRef).then(snap => {
                if (!snap.exists()) {
                    setDoc(userRef, {
                        username: u.displayName || u.email?.split("@")[0] || "User",
                        email: u.email,
                        photoURL: u.photoURL,
                        createdAt: serverTimestamp(),
                        lastSeen: Date.now()
                    });
                } else {
                    updateDoc(userRef, { lastSeen: Date.now() });
                }
            });
        });
    }, [router]);

    const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
    useBroadcastPresence(user?.uid ?? null, displayName, user?.photoURL ?? null, {
        activity: "Melihat dashboard",
        currentRoom: null,
        currentRoomName: null
    });

    const handlePresenceUpdate = useCallback((users: UserPresence[]) => setAllUsers(users), []);
    useMergedPresence(handlePresenceUpdate);

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
                padding: "0 20px", height: 68,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1.5px solid var(--app-border)",
                background: "var(--app-surface)", backdropFilter: "blur(20px)",
                position: "sticky", top: 0, zIndex: 100,
                transition: "var(--theme-transition)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        overflow: "hidden",
                        background: "var(--app-bg-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid var(--app-border)"
                    }}>
                        <img src="/images/logo-listenWithMe.png" alt="Logo" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
                    </div>
                    <div className="md:hidden">
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--app-primary)", letterSpacing: "-0.02em" }}>ListenWithMe</h1>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => setShowUsers(!showUsers)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                        background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)",
                        color: "var(--app-text)", fontSize: 12, fontWeight: 800,
                        transition: "all 0.2s"
                    }}>
                        <StatusDot status="online" />
                        <span className="hidden sm:inline">{onlineUsers.length} Online</span>
                        <span className="sm:hidden">{onlineUsers.length}</span>
                    </button>
                    <button onClick={() => router.push("/profile")} style={{
                        width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--app-border)",
                        background: "var(--app-bg-secondary)", color: "var(--app-text-muted)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s"
                    }}>
                        <UserIcon style={{ width: 22, height: 22 }} />
                    </button>
                </div>
            </header>

            <main className="dashboard-main" style={{
                maxWidth: 900,
                margin: "0 auto",
                position: "relative",
                zIndex: 1,
                minHeight: "calc(100vh - 68px)"
            }}>
                <div style={{ padding: "40px 20px" }} className="main-content-inner">
                    {/* Greeting Area */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
                        <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "var(--app-text)", letterSpacing: "-0.04em" }}>
                            {greeting}, {displayName.split(" ")[0]} {greetingEmoji}
                        </h2>
                        <p style={{ margin: 0, fontSize: 16, color: "var(--app-text-muted)", fontWeight: 600 }}>
                            {rooms.length > 0 ? `Ada ${rooms.length} ruang seru yang sedang mendengarkan! ✨` : "Mulai ruang musik pertamamu hari ini."}
                        </p>
                        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                            <div style={{ padding: "6px 12px", borderRadius: 12, background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)", fontSize: 12, fontWeight: 800, color: "var(--app-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                                <MusicalNoteIcon style={{ width: 14, height: 14 }} />
                                {LOCAL_SONGS.length} Lagu Tersedia
                            </div>
                        </div>
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
                </div>
            </main>

            {/* Presence Sidebar */}
            <AnimatePresence>
                {showUsers && (
                    <motion.aside
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        style={{
                            position: "fixed", top: 0, right: 0, bottom: 0, width: 320, zIndex: 200,
                            background: "var(--app-surface)", borderLeft: "1.5px solid var(--app-border)",
                            padding: "24px", overflowY: "auto", boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
                            transition: "var(--theme-transition)"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Daftar Teman</h3>
                            <button onClick={() => setShowUsers(false)} style={{
                                width: 36, height: 36, borderRadius: "50%", background: "var(--app-bg-secondary)",
                                border: "none", cursor: "pointer", color: "var(--app-text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <XMarkIcon style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {orderedUsers.map(u => (
                                <UserCard
                                    key={u.uid}
                                    u={u}
                                    isMe={u.uid === user?.uid}
                                    onJoin={(id) => router.push(`/room/${id}`)}
                                />
                            ))}
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
                        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{
                                width: "100%", maxWidth: 440, background: "var(--app-surface)",
                                border: "2px solid var(--app-border)", borderRadius: 32, padding: 32, position: "relative",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.2)"
                            }}
                        >
                            <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, textAlign: "center", letterSpacing: "-0.02em" }}>Bikin Ruang Musik</h2>
                            <p style={{ margin: "0 0 32px", fontSize: 15, color: "var(--app-text-muted)", textAlign: "center", fontWeight: 600 }}>Tentukan nama ruang biar teman gampang nemunya!</p>

                            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <input
                                    type="text" placeholder="Contoh: Dengerin Lagu Galau..."
                                    value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                                    autoFocus required
                                    style={{
                                        width: "100%", padding: "18px 24px", background: "var(--app-bg-secondary)",
                                        border: "2px solid var(--app-border)", borderRadius: 20, color: "var(--app-text)",
                                        fontSize: 16, fontWeight: 600, fontFamily: "var(--font-fredoka)", outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                />
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 16, borderRadius: 18, background: "var(--app-bg-secondary)", border: "none", color: "var(--app-text-muted)", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Batal</button>
                                    <button type="submit" disabled={creating || !newRoomName.trim()} style={{
                                        flex: 2, padding: 16, borderRadius: 18, background: "var(--app-primary)", border: "none", color: "#fff",
                                        fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 20px var(--app-soft-accent)", opacity: creating ? 0.6 : 1
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
                display: "none", position: "fixed", bottom: 0, left: 0, right: 0, height: 80,
                background: "var(--app-surface)", borderTop: "1.5px solid var(--app-border)",
                justifyContent: "space-around", alignItems: "center", zIndex: 100,
                paddingBottom: "env(safe-area-inset-bottom)",
                transition: "var(--theme-transition)"
            }}>
                <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "var(--app-primary)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <MusicalNoteIcon style={{ width: 26, height: 26 }} />
                    <span style={{ fontSize: 11, fontWeight: 800 }}>DASHBOARD</span>
                </button>
                <button onClick={() => router.push("/profile")} style={{ background: "none", border: "none", color: "var(--app-text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <UserIcon style={{ width: 26, height: 26 }} />
                    <span style={{ fontSize: 11, fontWeight: 800 }}>PROFIL</span>
                </button>
            </nav>

            <style>{`
                @media (max-width: 680px) {
                    .dashboard-main { 
                        max-width: 100% !important; 
                        padding: 0 !important; 
                    }
                    .main-content-inner {
                        padding: 24px 20px 100px !important;
                    }
                    .mobile-bottomnav { display: flex !important; }
                    header { background: var(--app-surface) !important; }
                }
            `}</style>
        </div>
    );
}
