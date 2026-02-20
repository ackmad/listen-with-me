"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCircleIcon, ShieldCheckIcon, MusicalNoteIcon,
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
            minHeight: "100vh", background: "#0a0508",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 20, color: "#fff"
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                    width: 38, height: 38, borderRadius: "50%",
                    border: "3px solid rgba(200,0,100,0.1)",
                    borderTopColor: "#c4005c",
                }}
            />
            <p style={{ color: "rgba(255,180,200,0.3)", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Memuat profilmu...
            </p>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh", background: "#0a0508", color: "#EAEAEA",
            fontFamily: "var(--font-geist-sans), sans-serif",
            position: "relative", overflowX: "hidden",
            padding: "clamp(20px, 5vw, 60px) 20px",
        }}>
            {/* Ambient Background */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 600, height: 600, background: "radial-gradient(ellipse, rgba(160,0,80,0.08) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 450, height: 450, background: "radial-gradient(ellipse, rgba(60,0,140,0.06) 0%, transparent 60%)" }} />
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

                {/* Header Nav */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 44 }}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                            borderRadius: 24, background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#e0608a"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                    >
                        <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Kembali ke Dashboard
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                            borderRadius: 24, background: "rgba(200,0,100,0.06)",
                            border: "1px solid rgba(200,0,100,0.15)",
                            color: "rgba(220,80,130,0.9)", cursor: "pointer", fontSize: 13, fontWeight: 700,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(200,0,100,0.12)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(200,0,100,0.06)"}
                    >
                        <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} /> Logout
                    </button>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

                    {/* Left: Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: "48px 32px", borderRadius: 32,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                            position: "relative", overflow: "hidden"
                        }}
                    >
                        {/* Top Accent */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #c4005c, #8c004a)" }} />

                        <div style={{ position: "relative", marginBottom: 28 }}>
                            <div style={{
                                width: 140, height: 140, borderRadius: "50%",
                                border: "4px solid rgba(200,0,100,0.3)",
                                padding: 6, background: "rgba(0,0,0,0.2)",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
                                    background: "linear-gradient(135deg, #220010, #0a0508)",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900
                                }}>
                                    {getInitials(username) || "U"}
                                </div>
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                style={{
                                    position: "absolute", bottom: 2, right: 2,
                                    width: 36, height: 36, borderRadius: "50%",
                                    background: "#c4005c", border: "4px solid #0a0508",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff"
                                }}
                            >
                                <HeartIcon style={{ width: 18, height: 18 }} />
                            </motion.div>
                        </div>

                        <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                            {username || 'Pecinta Musik'}
                        </h2>
                        <p style={{ margin: "0 0 32px", fontSize: 13, color: "rgba(220,100,150,0.6)", fontWeight: 600, letterSpacing: "0.05em" }}>
                            {user?.email}
                        </p>

                        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ padding: "20px 12px", borderRadius: 20, background: "rgba(10,5,8,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <MusicalNoteIcon style={{ width: 22, height: 22, color: "rgba(200,0,100,0.5)", margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Akrab</p>
                                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontWeight: 700 }}>Status</p>
                            </div>
                            <div style={{ padding: "20px 12px", borderRadius: 20, background: "rgba(10,5,8,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <ShieldCheckIcon style={{ width: 22, height: 22, color: "rgba(74,222,128,0.5)", margin: "0 auto 8px" }} />
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Terverifikasi</p>
                                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontWeight: 700 }}>Akses</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Settings Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            padding: "40px 32px", borderRadius: 32,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex", flexDirection: "column", justifyContent: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12, background: "rgba(200,0,100,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center", color: "#c4005c"
                            }}>
                                <ShieldCheckIcon style={{ width: 22, height: 22 }} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Ubah Identitas</h3>
                        </div>

                        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(220,100,150,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>Nama Tampilan</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{
                                        padding: "16px 20px", borderRadius: 16, background: "rgba(0,0,0,0.3)",
                                        border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
                                        fontSize: 15, fontFamily: "inherit", outline: "none", transition: "all 0.2s"
                                    }}
                                    onFocus={e => e.target.style.borderColor = "rgba(200,0,100,0.4)"}
                                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(220,100,150,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>Kata Sandi Baru (Opsional)</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Isi jika ingin ganti sandi"
                                    style={{
                                        padding: "16px 20px", borderRadius: 16, background: "rgba(0,0,0,0.3)",
                                        border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
                                        fontSize: 15, fontFamily: "inherit", outline: "none", transition: "all 0.2s"
                                    }}
                                    onFocus={e => e.target.style.borderColor = "rgba(200,0,100,0.4)"}
                                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                                />
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <motion.button
                                    whileHover={!isSaving ? { scale: 1.02, y: -2 } : {}}
                                    whileTap={!isSaving ? { scale: 0.98 } : {}}
                                    type="submit"
                                    disabled={isSaving}
                                    style={{
                                        width: "100%", padding: "18px", borderRadius: 16,
                                        background: savedSuccessfully ? "#10b981" : "linear-gradient(135deg, #c4005c, #8c004a)",
                                        color: "#fff", border: "none", cursor: isSaving ? "not-allowed" : "pointer",
                                        fontSize: 15, fontWeight: 800, fontFamily: "inherit",
                                        boxShadow: "0 8px 24px rgba(180,0,80,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                        transition: "background 0.3s ease"
                                    }}
                                >
                                    {isSaving ? (
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                                    ) : savedSuccessfully ? (
                                        <><CheckIcon style={{ width: 20, height: 20 }} /> Tersimpan!</>
                                    ) : (
                                        "Simpan Perubahan ✨"
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                <footer style={{ marginTop: 60, textAlign: "center", opacity: 0.1, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                    Glow Up Your Experience • ListenWithMe
                </footer>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 600px) {
                    h2 { font-size: 20px !important; }
                }
            `}</style>
        </div>
    );
}
