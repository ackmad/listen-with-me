"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth'; // Ensure we check auth state
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore'; // Missing imports
import Player from '@/components/Player'; // Correct import
import ReactionSystem from '@/components/ReactionSystem'; // Correct import
import { ArrowLeftIcon, MusicalNoteIcon, PlusIcon } from '@heroicons/react/24/outline'; // Adjust icons
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx'; // Missing import

export default function RoomPage() {
    const { id: roomId } = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [showQueue, setShowQueue] = useState(false); // Mobile toggle or sidebar

    // Auth Check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Room Listener
    useEffect(() => {
        if (!roomId) return;
        const roomRef = doc(db, 'rooms', roomId);
        const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const roomData = docSnapshot.data();
                setRoom(roomData);
                if (user) {
                    setIsHost(roomData.hostId === user.uid);
                }
            } else {
                router.push('/dashboard'); // Room not found
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [roomId, user, router]);

    // Update participants on join (simple version)
    useEffect(() => {
        if (user && roomId) {
            // Ideally use arrayUnion to add user to participants
        }
    }, [user, roomId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FF2E93]">Loading...</div>;
    if (!room) return null;

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#EAEAEA] relative overflow-hidden flex flex-col">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FF2E93] opacity-5 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="p-6 flex items-center justify-between relative z-10 w-full max-w-6xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 border border-[#FF2E93]/30 rounded-full hover:bg-[#FF2E93]/10 transition-colors text-[#FF2E93]"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <h1 className="text-xl font-bold tracking-wide">{room.name}</h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isHost ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                        {isHost ? 'You are Host' : 'Guest View'}
                    </div>
                </div>

                <div className="w-10" /> {/* Spacer for balance */}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-6xl mx-auto">
                <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Player Area */}
                    <div className="lg:col-span-2 flex flex-col items-center">
                        {/* Album Art / Visualizer Area */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full aspect-square max-w-md bg-[#1A1A1A] rounded-[30px] shadow-2xl border border-[#333] flex items-center justify-center mb-8 relative overflow-hidden group"
                        >
                            {room.currentSong ? (
                                <div className="text-center p-8">
                                    <MusicalNoteIcon className="w-32 h-32 text-[#FF2E93] mx-auto opacity-50 mb-4 animate-pulse" />
                                    <p className="text-gray-500">Visualizer Active</p>
                                </div>
                            ) : (
                                <div className="text-gray-600">No song playing</div>
                            )}

                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF2E93]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>

                        <Player roomId={roomId} isHost={isHost} />
                    </div>

                    {/* Queue / Song List (Sidebar on Desktop, Bottom Sheet on Mobile could be better but let's stick to grid) */}
                    <div className="bg-[#1A1A1A]/50 backdrop-blur-md border border-[#333] rounded-2xl p-6 h-[500px] flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                            <span>Queue</span>
                            <span className="text-xs text-[#FF2E93]">{room.queue?.length || 0} songs</span>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                            {room.queue?.length > 0 ? (
                                room.queue.map((song, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#222] transition-colors group cursor-pointer"
                                        onClick={() => isHost && updateDoc(doc(db, 'rooms', roomId), { currentSong: song })}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center text-gray-500 group-hover:text-[#FF2E93]">
                                            <MusicalNoteIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">{song.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{song.artist || 'Unknown Artist'}</p>
                                        </div>
                                        {isHost && (
                                            <PlayIcon className="w-5 h-5 text-gray-600 group-hover:text-[#FF2E93] opacity-0 group-hover:opacity-100 transition-all" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-10 text-sm">
                                    Queue is empty.<br />Add some vibes!
                                </div>
                            )}
                        </div>

                        {/* Add Song Button - Ideally opens a modal */}
                        <button className="mt-4 w-full py-3 border border-dashed border-[#444] rounded-xl text-gray-400 hover:text-[#FF2E93] hover:border-[#FF2E93] transition-colors flex items-center justify-center gap-2 text-sm">
                            <PlusIcon className="w-4 h-4" />
                            Add Song
                        </button>
                    </div>
                </div>

                {/* Reaction System Overlay */}
                <ReactionSystem roomId={roomId} userId={user?.uid} />
            </main>

            {/* Floating "Feel the vibe" text */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-[#FF2E93]/50 uppercase pointer-events-none">
                Feel the vibe together
            </div>
        </div>
    );
}

// Icon wrapper to avoid direct heroicons import errors if specific icon names changed
function PlayIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
        </svg>
    );
}
