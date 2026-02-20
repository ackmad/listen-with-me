"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheckIcon, MusicalNoteIcon,
    HeartIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { getInitials } from '@/hooks/usePresence';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);
    const router = useRouter();

    useEffect(() => {
        return onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username || currentUser.displayName || '');
                } else {
                    setUsername(currentUser.displayName || '');
                }
            } else {
                router.push('/');
            }
            setLoading(false);
        });
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setSavedSuccessfully(false);

        try {
            await updateProfile(user, { displayName: username });
            await updateDoc(doc(db, 'users', user.uid), { username });

            if (newPassword) {
                await updatePassword(user, newPassword);
            }
            setSavedSuccessfully(true);
            setTimeout(() => setSavedSuccessfully(false), 3000);
        } catch (error: any) {
            console.error(error);
            alert('Gagal update profile: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    if (loading) return (
        <div style={{
            minHeight: "100vh", background: "var(--app-bg)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 20, color: "var(--app-text)"
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                    width: 38, height: 38, borderRadius: "50%",
                    border: "3px solid var(--app-border)",
                    borderTopColor: "var(--app-primary)",
                }}
            />
            <p style={{ color: "var(--app-text-muted)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-fredoka)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Memuat profilmu...
            </p>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh", background: "var(--app-bg)", color: "var(--app-text)",
            fontFamily: "var(--font-fredoka), sans-serif",
            position: "relative", overflowX: "hidden",
            padding: "clamp(20px, 5vw, 60px) 20px",
            transition: "var(--theme-transition)",
        }}>
            {/* Ambient Background */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 600, height: 600, background: "radial-gradient(ellipse, var(--app-soft-accent) 0%, transparent 70%)" }} />
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

                {/* Header Nav */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 44 }}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                            borderRadius: 24, background: "var(--app-bg-secondary)",
                            border: "1.5px solid var(--app-border)",
                            color: "var(--app-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 800,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--app-primary)"; e.currentTarget.style.borderColor = "var(--app-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--app-text-secondary)"; e.currentTarget.style.borderColor = "var(--app-border)"; }}
                    >
                        <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Dashboard
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                            borderRadius: 24, background: "var(--app-bg-secondary)",
                            border: "1.5px solid var(--app-border)",
                            color: "var(--app-text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 800,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--app-primary)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--app-bg-secondary)"; e.currentTarget.style.color = "var(--app-text-muted)"; }}
                    >
                        <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} /> Keluar
                    </button>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>

                    {/* Left: Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: "48px 32px", borderRadius: 32,
                            background: "var(--app-surface)",
                            border: "1.5px solid var(--app-border)",
                            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
                            position: "relative", overflow: "hidden"
                        }}
                    >
                        <div style={{ position: "relative", marginBottom: 32 }}>
                            <div style={{
                                width: 150, height: 150, borderRadius: "50%",
                                border: "4px solid var(--app-soft-accent)",
                                padding: 8, background: "var(--app-bg-secondary)",
                            }}>
                                <div style={{
                                    width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
                                    background: "var(--app-primary)", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900
                                }}>
                                    {getInitials(username) || "U"}
                                </div>
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{
                                    position: "absolute", bottom: 5, right: 5,
                                    width: 40, height: 40, borderRadius: "50%",
                                    background: "var(--app-primary)", border: "4px solid var(--app-surface)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff"
                                }}
                            >
                                <HeartIcon style={{ width: 20, height: 20 }} />
                            </motion.div>
                        </div>

                        <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "var(--app-text)" }}>
                            {username || 'Pecinta Musik'}
                        </h2>
                        <p style={{ margin: "0 0 32px", fontSize: 14, color: "var(--app-text-muted)", fontWeight: 700 }}>
                            {user?.email}
                        </p>

                        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ padding: "20px 12px", borderRadius: 24, background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)" }}>
                                <MusicalNoteIcon style={{ width: 24, height: 24, color: "var(--app-primary)", margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--app-text)" }}>Akrab</p>
                                <p style={{ margin: 0, fontSize: 10, color: "var(--app-text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Status</p>
                            </div>
                            <div style={{ padding: "20px 12px", borderRadius: 24, background: "var(--app-bg-secondary)", border: "1.5px solid var(--app-border)" }}>
                                <ShieldCheckIcon style={{ width: 24, height: 24, color: "var(--app-indicator)", margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--app-text)" }}>Aktif</p>
                                <p style={{ margin: 0, fontSize: 10, color: "var(--app-text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Akses</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Settings Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: "48px 32px", borderRadius: 32,
                            background: "var(--app-surface)",
                            border: "1.5px solid var(--app-border)",
                            display: "flex", flexDirection: "column", justifyContent: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
                            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--app-text)" }}>Ubah Profil</h3>
                        </div>

                        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>Nama Kamu</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{
                                        padding: "18px 24px", borderRadius: 18, background: "var(--app-bg-secondary)",
                                        border: "1.5px solid var(--app-border)", color: "var(--app-text)",
                                        fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", transition: "all 0.2s"
                                    }}
                                    onFocus={e => { e.target.style.borderColor = "var(--app-primary)"; e.target.style.boxShadow = "0 0 0 4px var(--app-soft-accent)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--app-border)"; e.target.style.boxShadow = "none"; }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <label style={{ fontSize: 12, fontWeight: 800, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>Sandi Baru (Opsional)</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Kosongkan jika tidak ganti"
                                    style={{
                                        padding: "18px 24px", borderRadius: 18, background: "var(--app-bg-secondary)",
                                        border: "1.5px solid var(--app-border)", color: "var(--app-text)",
                                        fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", transition: "all 0.2s"
                                    }}
                                    onFocus={e => { e.target.style.borderColor = "var(--app-primary)"; e.target.style.boxShadow = "0 0 0 4px var(--app-soft-accent)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--app-border)"; e.target.style.boxShadow = "none"; }}
                                />
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <motion.button
                                    whileHover={!isSaving ? { scale: 1.02, y: -2, boxShadow: "0 10px 20px var(--app-soft-accent)" } : {}}
                                    whileTap={!isSaving ? { scale: 0.98 } : {}}
                                    type="submit"
                                    disabled={isSaving}
                                    style={{
                                        width: "100%", padding: "20px", borderRadius: 20,
                                        background: savedSuccessfully ? "var(--app-indicator)" : "var(--app-primary)",
                                        color: "#fff", border: "none", cursor: isSaving ? "not-allowed" : "pointer",
                                        fontSize: 16, fontWeight: 900, fontFamily: "inherit",
                                        boxShadow: "0 6px 15px var(--app-soft-accent)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                                        transition: "all 0.4s ease"
                                    }}
                                >
                                    {isSaving ? (
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                                    ) : savedSuccessfully ? (
                                        <><CheckIcon style={{ width: 22, height: 22, strokeWidth: 3 }} /> Profil Disimpan!</>
                                    ) : (
                                        "Simpan Perubahan ✨"
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 600px) {
                    h2 { font-size: 24px !important; }
                }
            `}</style>
        </div>
    );
}
