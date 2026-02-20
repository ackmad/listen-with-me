"use client";
import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CloudArrowUpIcon, MusicalNoteIcon, PlusIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';

export default function SongManager({ roomId, isOpen, onClose }) {
    const [songs, setSongs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');

    // Fetch songs
    useEffect(() => {
        if (!isOpen) return;
        const fetchSongs = async () => {
            const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const songList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSongs(songList);
        };
        fetchSongs();
    }, [isOpen]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;
        setUploading(true);

        try {
            const storageRef = ref(storage, `songs/${uuidv4()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // Calculate duration? For MVP, maybe skip or use a library. 
            // Let's just default to 0 or try to get it from audio element.
            const duration = 0; // TODO: Implement duration check

            const songData = {
                title,
                url,
                duration,
                createdAt: new Date(),
            };

            const docRef = await addDoc(collection(db, 'songs'), songData);
            setSongs([{ id: docRef.id, ...songData }, ...songs]);
            setFile(null);
            setTitle('');

        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleSongClick = (song) => {
        if (onSongSelect) {
            onSongSelect(song);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] w-full max-w-2xl text-[#EAEAEA] rounded-2xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MusicalNoteIcon className="w-6 h-6 text-[#FF2E93]" />
                        Music Library
                    </h2>
                    <button onClick={onClose} className="hover:text-[#FF2E93]">Close</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Upload Section */}
                    <div className="bg-[#222] p-4 rounded-xl border border-[#333]">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Upload New Track</h3>
                        <form onSubmit={handleUpload} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Song Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1A1A1A] rounded border border-[#333] text-sm focus:border-[#FF2E93] outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded text-sm hover:border-[#FF2E93] transition-colors relative">
                                    <span className="truncate block max-w-[150px]">{file ? file.name : "Choose MP3 File"}</span>
                                    <input
                                        type="file"
                                        accept="audio/mp3,audio/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={uploading || !file || !title}
                                className="px-4 py-2 bg-[#FF2E93] hover:bg-[#FF6EB6] text-white rounded font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? "Uploading..." : <><CloudArrowUpIcon className="w-4 h-4" /> Upload</>}
                            </button>
                        </form>
                    </div>

                    {/* Library List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Library</h3>
                        <div className="space-y-2">
                            {songs.map((song) => (
                                <div key={song.id} className="flex items-center justify-between p-3 hover:bg-[#222] rounded-lg group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#333] rounded flex items-center justify-center text-gray-500">
                                            <MusicalNoteIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{song.title}</p>
                                        </div>
                                    </div>

                                    {roomId && (
                                        <button
                                            onClick={() => addToQueue(song)}
                                            className="text-xs px-3 py-1 border border-[#FF2E93] text-[#FF2E93] rounded hover:bg-[#FF2E93] hover:text-white transition-colors"
                                        >
                                            Add to Queue
                                        </button>
                                    )}
                                </div>
                            ))}
                            {songs.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-4">No songs in library.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
