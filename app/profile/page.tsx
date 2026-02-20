"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username);
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

        try {
            await updateProfile(user, { displayName: username });
            await updateDoc(doc(db, 'users', user.uid), { username });

            if (newPassword) {
                await updatePassword(user, newPassword);
            }
            alert('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile.');
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-[#FF2E93]">Loading...</div>;

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            <div className="w-full max-w-md p-8 bg-[#1A1A1A] rounded-[20px] shadow-2xl border border-[#333] relative z-10">
                <h1 className="text-3xl font-bold text-[#EAEAEA] mb-6 text-center">Manage your identity</h1>

                <div className="flex justify-center mb-6">
                    <img
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.uid}`}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-2 border-[#FF2E93] shadow-[0_0_15px_rgba(255,46,147,0.3)]"
                    />
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Password (optional)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] transition-colors"
                            placeholder="Leave blank to keep current"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-[#FF2E93] hover:bg-[#FF6EB6] text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-[0_0_10px_rgba(255,46,147,0.2)]"
                    >
                        Save Changes
                    </button>
                </form>

                <button
                    onClick={handleLogout}
                    className="w-full mt-4 py-3 border border-[#FF2E93] text-[#FF2E93] hover:bg-[#FF2E93] hover:text-white font-bold rounded-lg transition-all"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
