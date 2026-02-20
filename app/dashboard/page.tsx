"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, rtdb } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { motion } from 'framer-motion';
import { PlusIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/outline'; // Adjust import

import SongManager from '@/components/SongManager';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
    const [rooms, setRooms] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSongManager, setShowSongManager] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const router = useRouter();
    const user = auth.currentUser;

    // Presence System
    useEffect(() => {
        if (!user) return;

        const userStatusRef = ref(rtdb, '/status/' + user.uid);
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };
        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
            username: user.displayName || user.email,
            avatar: user.photoURL,
        };

        set(userStatusRef, isOnlineForDatabase);
        onDisconnect(userStatusRef).set(isOfflineForDatabase);

        // Listen for other users
        const allStatusRef = ref(rtdb, '/status');
        const unsubscribeRtdb = onValue(allStatusRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setOnlineUsers(data);
            }
        });

        return () => {
            unsubscribeRtdb();
        };
    }, [user]);

    // Fetch Rooms
    useEffect(() => {
        const q = query(collection(db, "rooms"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const roomsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRooms(roomsData);
        });
        return () => unsubscribe();
    }, []);

    const createRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            const docRef = await addDoc(collection(db, "rooms"), {
                name: newRoomName,
                hostId: user.uid,
                createdAt: serverTimestamp(),
                participants: [user.uid],
                isPlaying: false,
                currentSong: null,
                queue: [],
            });
            router.push(`/room/${docRef.id}`);
        } catch (error) {
            console.error("Error creating room: ", error);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Sessions
                    </h2>
                    <p className="text-gray-500">See who's online and start a session.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSongManager(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-[#222] hover:bg-[#333] rounded-full font-bold transition-all border border-[#333]"
                        title="Manage Library"
                    >
                        <MusicalNoteIcon className="w-5 h-5 text-[#FF2E93]" />
                        <span className="hidden md:inline">Library</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#FF2E93] hover:bg-[#FF6EB6] rounded-full font-bold shadow-[0_0_15px_rgba(255,46,147,0.4)] transition-all transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Active Rooms */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                        <PlayIcon className="w-5 h-5 text-[#FF2E93]" />
                        Active Rooms
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rooms.length === 0 ? (
                            <div className="col-span-2 p-8 text-center border border-dashed border-[#333] rounded-2xl text-gray-500">
                                No active sessions. Start one now!
                            </div>
                        ) : (
                            rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-6 bg-[#1A1A1A] rounded-2xl border border-[#333] hover:border-[#FF2E93]/50 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/room/${room.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold group-hover:text-[#FF2E93] transition-colors">{room.name}</h4>
                                        <span className="px-2 py-1 bg-[#222] text-xs rounded text-gray-400">
                                            {room.participants?.length || 0} listening
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Live Now
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar - Online Users */}
                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#333] h-fit">
                    <h3 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-[#FF2E93]" />
                        Online ({Object.keys(onlineUsers).length})
                    </h3>

                    <div className="space-y-4">
                        {Object.entries(onlineUsers).map(([userId, userData]: [string, any]) => (
                            <div key={userId} className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src={userData.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userId}`}
                                        className="w-10 h-10 rounded-full bg-[#222]"
                                        alt="User"
                                    />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${userData.state === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{userData.username || 'Anonymous'}</p>
                                    <p className="text-xs text-gray-500">{userData.state === 'online' ? 'In Dashboard' : 'Offline'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1A1A1A] p-8 rounded-2xl w-full max-w-md border border-[#333] shadow-2xl"
                    >
                        <h3 className="text-2xl font-bold mb-6">Create New Session</h3>
                        <input
                            type="text"
                            placeholder="Session Name (e.g., Chill Vibes)"
                            className="w-full px-4 py-3 bg-[#222] border border-[#333] rounded-lg text-[#EAEAEA] focus:outline-none focus:border-[#FF2E93] mb-6"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-transparent border border-gray-600 rounded-lg font-bold hover:bg-[#222] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createRoom}
                                className="flex-1 py-3 bg-[#FF2E93] hover:bg-[#FF6EB6] text-white rounded-lg font-bold transition-colors"
                            >
                                Start
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Song Manager Modal (Library Mode) */}
            <SongManager
                isOpen={showSongManager}
                onClose={() => setShowSongManager(false)}
                onSongSelect={(song) => console.log("Song selected in dashboard:", song)}
            />
        </div>
    );
}
