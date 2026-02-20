"use client";
import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon, ForwardIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { calculateCurrentTime, playSong, pauseSong, seekSong } from '@/lib/syncEngine';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function Player({ roomId, isHost }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [currentSong, setCurrentSong] = useState(null);
    const [syncedStartedAt, setSyncedStartedAt] = useState(null);

    // Sync Logic
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
            const data = doc.data();
            if (data) {
                setIsPlaying(data.isPlaying);
                setCurrentSong(data.currentSong);
                setSyncedStartedAt(data.startedAt);
            }
        });
        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (audioRef.current && currentSong) {
            if (isPlaying) {
                const offset = calculateCurrentTime(syncedStartedAt);
                if (Math.abs(audioRef.current.currentTime - offset) > 0.5) {
                    audioRef.current.currentTime = offset;
                }
                audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong, syncedStartedAt]);

    const togglePlay = () => {
        if (!isHost) return;
        if (isPlaying) {
            pauseSong(roomId);
        } else {
            playSong(roomId, currentSong);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    if (!currentSong) return <div className="text-gray-500 text-center py-10">No song selected</div>;

    return (
        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#333] shadow-lg w-full max-w-4xl mx-auto">
            <audio
                ref={audioRef}
                src={currentSong.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => isHost && pauseSong(roomId)} // Or play next
            />

            <div className="flex flex-col items-center gap-6">
                {/* Helper visualizer placeholder */}
                <div className="w-full h-32 bg-[#111] rounded-xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FF2E93]/20 to-transparent pointer-events-none" />
                    {/* Simple bars animation */}
                    <div className="flex items-end gap-1 h-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: isPlaying ? [10, 40, 20, 50, 15] : 5 }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.05,
                                    ease: "easeInOut"
                                }}
                                className="w-2 bg-[#FF2E93] rounded-full opacity-80"
                            />
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">{currentSong.title}</h3>
                    <p className="text-[#FF2E93] text-sm font-medium">Now Playing</p>
                </div>

                <div className="w-full flex items-center gap-4">
                    <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
                    <div className="flex-1 relative h-2 bg-[#333] rounded-full overflow-hidden group">
                        <div
                            className="absolute top-0 left-0 h-full bg-[#FF2E93] transition-all duration-100"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                        {/* Host seeking could be implemented here with an input range overlay */}
                    </div>
                    <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-8">
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <SpeakerWaveIcon className="w-6 h-6" />
                    </button>

                    <button
                        onClick={togglePlay}
                        disabled={!isHost}
                        className={clsx(
                            "p-6 rounded-full bg-[#FF2E93] text-white shadow-[0_0_20px_rgba(255,46,147,0.4)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                            !isHost && "bg-gray-700"
                        )}
                    >
                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 left-1 relative" />}
                    </button>

                    <button className="text-gray-400 hover:text-white transition-colors">
                        <ForwardIcon className="w-8 h-8" />
                    </button>
                </div>

                {!isHost && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                        Synced with Host • Controls disabled
                    </p>
                )}
            </div>
        </div>
    );
}
