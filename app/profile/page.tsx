"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { UserCircleIcon, ShieldCheckIcon, MusicalNoteIcon, HeartIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username || currentUser.displayName || '');
                }
            } else {
                router.push('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            await updateProfile(user, { displayName: username });
            await updateDoc(doc(db, 'users', user.uid), { username });

            if (newPassword) {
                await updatePassword(user, newPassword);
            }
            alert('Profile updated successfully, Babe! ✨');
        } catch (error: any) {
            console.error(error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#050505] text-[#FF0099] font-bold tracking-widest animate-pulse">
            PREPARING YOUR ACCESS...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-sans relative overflow-x-hidden p-6 md:p-12">
            <div className="radial-spotlight absolute inset-0 pointer-events-none" />
            <div className="noise-bg" />

            {/* Back Button */}
            <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center relative z-10">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="group flex items-center gap-2 p-3 rounded-full border border-white/10 hover:border-[#FF0099] text-gray-400 hover:text-[#FF0099] transition-all bg-[#0A0A0A]/50 backdrop-blur-md"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Back to Lounge</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 p-3 px-6 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all bg-red-900/10 backdrop-blur-md font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Logout
                </button>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Left Side: ID Card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-center justify-center text-center p-12 rounded-[40px] bg-glass border border-white/5 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF0099] via-[#FF66C4] to-[#5B21B6]" />

                    <div className="relative mb-8">
                        <div className="w-40 h-40 rounded-full border-4 border-[#FF0099] shadow-[0_0_30px_rgba(255,0,153,0.4)] overflow-hidden bg-[#111]">
                            <img
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.uid}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-2 -right-2 bg-[#FF0099] p-3 rounded-full shadow-lg"
                        >
                            <UserCircleIcon className="w-6 h-6 text-white" />
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
                        {username || 'Anonymous Vibe'}
                    </h2>
                    <p className="text-[#FF66C4] font-medium tracking-widest text-sm uppercase mb-8">
                        {user?.email}
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="p-6 rounded-3xl bg-[#0A0A0A]/80 border border-white/5 text-center group-hover:border-[#FF0099]/20 transition-all">
                            <MusicalNoteIcon className="w-6 h-6 text-[#FF0099] mx-auto mb-2" />
                            <p className="text-2xl font-black text-white">12</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Rooms Joined</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-[#0A0A0A]/80 border border-white/5 text-center group-hover:border-[#FF66C4]/20 transition-all">
                            <HeartIcon className="w-6 h-6 text-[#FF66C4] mx-auto mb-2" />
                            <p className="text-2xl font-black text-white">450</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vibes Shared</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Settings */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-10 rounded-[40px] bg-glass border border-white/5 shadow-2xl flex flex-col justify-center"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2 rounded-xl bg-[#FF0099]/10 text-[#FF0099]">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Identity Settings</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#FF66C4] uppercase tracking-[0.2em] pl-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-6 py-5 bg-[#050505]/80 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#FF0099] focus:ring-1 focus:ring-[#FF0099] transition-all placeholder:text-gray-600 shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#FF66C4] uppercase tracking-[0.2em] pl-2">Security</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-6 py-5 bg-[#050505]/80 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#FF0099] focus:ring-1 focus:ring-[#FF0099] transition-all placeholder:text-gray-600 shadow-inner"
                                placeholder="Edit Password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-5 bg-[#FF0099] hover:bg-[#D90082] text-white font-black text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,0,153,0.4)] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSaving ? (
                                <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Save Changes ✨</>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-gray-600 uppercase tracking-widest">
                        Last vibe update: Just now
                    </p>
                </motion.div>
            </main>

            <footer className="mt-20 text-center text-[10px] tracking-[0.3em] text-white/10 uppercase">
                Glow Up Your Experience • ListenWithMe
            </footer>
        </div>
    );
}
