"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user doc
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    username: username || email.split('@')[0],
                    email: email,
                    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userCredential.user.uid}`, // temporary avatar
                    status: 'online',
                    currentRoom: null,
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            {/* Background Pink Glow */}
            <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-[#FF2E93] opacity-20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-[#FF2E93] opacity-10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 bg-[#1A1A1A] rounded-[20px] shadow-2xl border border-[#333] relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#EAEAEA] mb-2">Welcome to Your Private Session</h1>
                    <p className="text-gray-400 text-sm">Login to start listening together.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] transition-colors"
                                placeholder="Your display name"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-3 bg-[#FF2E93] hover:bg-[#FF6EB6] text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-[0_0_15px_rgba(255,46,147,0.3)]"
                    >
                        {isRegistering ? 'Sign Up' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        {isRegistering ? "Already have an account?" : "Don't have an account?"}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="ml-2 text-[#FF2E93] hover:text-[#FF6EB6] font-medium focus:outline-none"
                        >
                            {isRegistering ? 'Login' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
