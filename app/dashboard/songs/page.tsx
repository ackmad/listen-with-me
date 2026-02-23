"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
    MusicalNoteIcon,
    ClockIcon,
    ChevronRightIcon,
    PlusIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { LOCAL_SONGS } from '@/components/SongManager';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function SongsLibrary() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterArtist, setFilterArtist] = useState('Semua');
    const [rooms, setRooms] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Selection/Popup states
    const [selectedSong, setSelectedSong] = useState<any>(null);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => setUser(u));
    }, []);

    useEffect(() => {
        const q = query(collection(db, "rooms"));
        const unsub = onSnapshot(q, (snap) => {
            setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleSongClick = (song: any) => {
        setSelectedSong(song);
        setShowSelectionModal(true);
    };

    const handleAddToRoom = async (roomId: string) => {
        if (!selectedSong) return;
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
            const roomData = roomSnap.data();
            const shouldStartPlaying = !roomData.currentSong;

            const songWithQueueId = {
                ...selectedSong,
                queueId: `${selectedSong.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            };

            await updateDoc(roomRef, {
                queue: arrayUnion(songWithQueueId),
                ...(shouldStartPlaying ? {
                    currentSong: songWithQueueId,
                    isPlaying: true,
                    lastAction: 'play',
                    lastActionTime: Date.now()
                } : {})
            });
            router.push(`/room/${roomId}`);
        }
    };

    const handleCreateAndPlay = async (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/dashboard?create=true&songId=${selectedSong?.id}`);
    };

    const artists = useMemo(() => {
        const unique = Array.from(new Set(LOCAL_SONGS.map(s => s.artist)));
        return ['Semua', ...unique.sort()];
    }, []);

    const filteredSongs = useMemo(() => {
        const filtered = LOCAL_SONGS.filter(s => {
            const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.artist.toLowerCase().includes(search.toLowerCase());
            const matchesArtist = filterArtist === 'Semua' || s.artist === filterArtist;
            return matchesSearch && matchesArtist;
        });

        // Sort: New songs (within 42h) first, then alphabetical by artist
        const now = Date.now();
        const threshold = 42 * 60 * 60 * 1000;

        return filtered.sort((a, b) => {
            const isNewA = a.addedAt && (now - a.addedAt < threshold);
            const isNewB = b.addedAt && (now - b.addedAt < threshold);

            if (isNewA && !isNewB) return -1;
            if (!isNewA && isNewB) return 1;
            if (isNewA && isNewB) return (b.addedAt || 0) - (a.addedAt || 0);

            const artistCompare = a.artist.localeCompare(b.artist);
            if (artistCompare !== 0) return artistCompare;
            return a.title.localeCompare(b.title);
        });
    }, [search, filterArtist]);

    const getTimeAgo = (timestamp?: number) => {
        if (!timestamp) return "";
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Barusan";
        return `${hours} jam yang lalu`;
    };

    const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
    const paginatedSongs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSongs.slice(start, start + itemsPerPage);
    }, [filteredSongs, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterArtist]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ padding: '40px 24px 120px', maxWidth: 1100, margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em' }}>Perpustakaan Lagu</h1>
                <p style={{ margin: 0, fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Jelajahi {LOCAL_SONGS.length} lagu pilihan untuk menemani harimu.
                </p>
            </div>

            {/* Controls Row */}
            <div style={{
                display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap',
                alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 300 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <MagnifyingGlassIcon style={{
                            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                            width: 20, height: 20, color: 'var(--text-muted)'
                        }} />
                        <input
                            type="text"
                            placeholder="Cari lagu atau artis..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 48px',
                                background: 'var(--bg-card)', border: '1.5px solid var(--border-soft)',
                                borderRadius: 18, color: 'var(--text-primary)',
                                outline: 'none', fontWeight: 600, fontSize: 14,
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>
                    <select
                        value={filterArtist}
                        onChange={(e) => setFilterArtist(e.target.value)}
                        style={{
                            padding: '0 16px', background: 'var(--bg-card)',
                            border: '1.5px solid var(--border-soft)', borderRadius: 18,
                            color: 'var(--text-primary)', fontWeight: 700, fontSize: 13,
                            outline: 'none', cursor: 'pointer'
                        }}
                    >
                        {artists.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div style={{
                    display: 'flex', background: 'var(--bg-secondary)',
                    padding: 4, borderRadius: 16, border: '1.5px solid var(--border-soft)'
                }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: '8px 12px', borderRadius: 12, border: 'none',
                            background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                            color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            boxShadow: viewMode === 'grid' ? 'var(--shadow-soft)' : 'none',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12
                        }}
                    >
                        <Squares2X2Icon style={{ width: 18, height: 18 }} /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '8px 12px', borderRadius: 12, border: 'none',
                            background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                            color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            boxShadow: viewMode === 'list' ? 'var(--shadow-soft)' : 'none',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12
                        }}
                    >
                        <ListBulletIcon style={{ width: 18, height: 18 }} /> List
                    </button>
                </div>
            </div>

            {/* Songs Display */}
            <motion.div
                layout
                className="library-items-container"
                style={{
                    display: viewMode === 'grid' ? 'grid' : 'flex',
                    flexDirection: viewMode === 'list' ? 'column' : undefined,
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(180px, 1fr))' : undefined,
                    gap: 32
                }}
            >
                <AnimatePresence mode="popLayout">
                    {paginatedSongs.map((song, i) => (
                        <motion.div
                            key={song.id}
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4, delay: i * 0.02, type: 'spring' }}
                            onClick={() => handleSongClick(song)}
                            style={{
                                display: 'flex',
                                flexDirection: viewMode === 'grid' ? 'column' : 'row',
                                alignItems: 'center',
                                gap: viewMode === 'grid' ? 20 : 16,
                                cursor: 'pointer',
                                position: 'relative',
                                background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                                border: viewMode === 'list' ? '1.5px solid var(--border-soft)' : 'none',
                                borderRadius: viewMode === 'list' ? 24 : 0,
                                padding: viewMode === 'list' ? '12px 20px' : 0,
                            }}
                        >
                            {viewMode === 'grid' ? (
                                <>
                                    {/* Vinyl Record Visual */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 45 }}
                                        style={{
                                            width: '100%', aspectRatio: '1/1',
                                            borderRadius: '50%', background: '#121212',
                                            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Vinyl Grooves - CSS Gradient */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: `repeating-radial-gradient(circle at center, transparent 0, transparent 2px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)`,
                                            opacity: 0.8
                                        }} />

                                        {/* Vinyl Shine */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.05) 45deg, transparent 90deg, rgba(255,255,255,0.05) 135deg, transparent 180deg, rgba(255,255,255,0.05) 225deg, transparent 270deg, rgba(255,255,255,0.05) 315deg, transparent 360deg)',
                                            mixBlendMode: 'screen'
                                        }} />

                                        {/* Center Label */}
                                        <div style={{
                                            width: '35%', height: '35%', borderRadius: '50%',
                                            background: 'var(--accent-primary)', position: 'relative',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '4px solid #1a1a1a', zIndex: 2,
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
                                        }}>
                                            <MusicalNoteIcon style={{ width: '50%', color: '#fff' }} />
                                            {/* Center Hole */}
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-primary)', position: 'absolute' }} />
                                        </div>

                                        {/* Rotating Animation Overlay on Hover */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                                        />

                                        {/* New Badge Overlay (Grid) */}
                                        {song.addedAt && (Date.now() - song.addedAt < 42 * 60 * 60 * 1000) && (
                                            <div style={{
                                                position: 'absolute', top: 12, right: 12,
                                                background: 'linear-gradient(135deg, #FF0099, #FF0055)',
                                                color: '#fff', fontSize: 10, fontWeight: 900,
                                                padding: '4px 10px', borderRadius: 10,
                                                boxShadow: '0 4px 12px rgba(255,0,153,0.4)',
                                                zIndex: 10
                                            }}>
                                                BARU
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Song Info (Below Vinyl) */}
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                        <h3 style={{
                                            margin: '0 0 2px', fontSize: 13, fontWeight: 900,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>{song.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <p style={{
                                                margin: 0, fontSize: 11, fontWeight: 700,
                                                color: 'var(--text-muted)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>{song.artist}</p>
                                            {song.addedAt && (Date.now() - song.addedAt < 42 * 60 * 60 * 1000) && (
                                                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary)', opacity: 0.8 }}>
                                                    • {getTimeAgo(song.addedAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* List View Card (Existing) */}
                                    <div style={{
                                        width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <MusicalNoteIcon style={{ width: 18, color: 'var(--accent-primary)', opacity: 0.4 }} />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</h3>
                                            {song.addedAt && (Date.now() - song.addedAt < 42 * 60 * 60 * 1000) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{
                                                        fontSize: 8, background: 'linear-gradient(135deg, #FF0099, #FF0055)',
                                                        color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 900
                                                    }}>
                                                        BARU
                                                    </span>
                                                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary)', opacity: 0.7 }}>
                                                        {getTimeAgo(song.addedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</p>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                                            <ClockIcon style={{ width: 12, height: 12 }} />
                                            {formatDuration(song.duration)}
                                        </div>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <PlusIcon style={{ width: 16, height: 16 }} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{
                    marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    paddingBottom: 40
                }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{
                            width: 44, height: 44, borderRadius: 14, background: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-soft)', color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        <ChevronLeftIcon style={{ width: 20, height: 20 }} />
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            const isCurrent = page === currentPage;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    style={{
                                        width: 44, height: 44, borderRadius: 14,
                                        background: isCurrent ? 'var(--accent-primary)' : 'var(--bg-card)',
                                        border: '1.5px solid var(--border-soft)',
                                        color: isCurrent ? '#fff' : 'var(--text-primary)',
                                        fontWeight: 900, fontSize: 14, cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isCurrent ? 'var(--shadow-soft)' : 'none'
                                    }}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{
                            width: 44, height: 44, borderRadius: 14, background: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-soft)', color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        <ChevronRightIcon style={{ width: 20, height: 20 }} />
                    </button>
                </div>
            )}

            {paginatedSongs.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '100px 20px',
                    background: 'var(--bg-secondary)', borderRadius: 32,
                    border: '2px dashed var(--border-soft)', marginTop: 20
                }}>
                    <MusicalNoteIcon style={{ width: 64, height: 64, color: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.2 }} />
                    <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Lagu tidak ditemukan</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 600 }}>Coba cari dengan kata kunci lain atau hapus filter.</p>
                </div>
            )}

            <AnimatePresence>
                {showSelectionModal && selectedSong && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowSelectionModal(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: "100%", maxWidth: 460, background: "var(--bg-card)",
                                border: "1.5px solid var(--border-soft)", borderRadius: 36, padding: 32,
                                boxShadow: "0 20px 60px rgba(0,0,0,0.15)", position: "relative"
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent-soft)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <MusicalNoteIcon style={{ width: 32, height: 32 }} />
                                </div>
                                <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900 }}>Mau putar lagu ini?</h2>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)' }}>{selectedSong.title}</p>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pilih Ruang Aktif
                                </p>
                                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
                                    {rooms.length > 0 ? (
                                        rooms.map(room => (
                                            <motion.div
                                                key={room.id}
                                                whileHover={{ x: 6, background: 'var(--bg-secondary)' }}
                                                onClick={() => handleAddToRoom(room.id)}
                                                style={{
                                                    padding: '14px 18px', borderRadius: 20, border: '1.5px solid var(--border-soft)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</p>
                                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Host: {room.hostName}</p>
                                                </div>
                                                <PlayIcon style={{ width: 14, height: 14, color: 'var(--accent-primary)' }} />
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', borderRadius: 24, border: '1.5px dashed var(--border-soft)' }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Belum ada ruang aktif nih 🥺</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => { setShowSelectionModal(false); setShowCreateRoom(true); }}
                                style={{
                                    width: "100%", padding: 18, borderRadius: 22, background: "var(--accent-primary)", border: "none", color: "#fff",
                                    fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 20px var(--accent-glow)",
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                            >
                                <PlusIcon style={{ width: 18, height: 18 }} strokeWidth={3} />
                                Buat Ruang Baru & Putar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Modal from Selection */}
            <AnimatePresence>
                {showCreateRoom && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowCreateRoom(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: "100%", maxWidth: 440, background: "var(--bg-card)",
                                border: "1.5px solid var(--border-soft)", borderRadius: 36, padding: 32, position: "relative",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
                            }}
                        >
                            <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, textAlign: "center", letterSpacing: "-0.02em" }}>Bikin Ruang Dulu Yuk</h2>
                            <p style={{ margin: "0 0 32px", fontSize: 14, color: "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>Beri nama yang asik buat ruang musikmu!</p>

                            <form onSubmit={handleCreateAndPlay} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <input
                                    type="text" placeholder="Contoh: Senja Bersama..."
                                    value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                                    autoFocus required
                                    style={{
                                        width: "100%", padding: "18px 24px", background: "var(--bg-secondary)",
                                        border: "1.5px solid var(--border-soft)", borderRadius: 20, color: "var(--text-primary)",
                                        fontSize: 16, fontWeight: 600, fontFamily: "var(--font-fredoka)", outline: "none"
                                    }}
                                />
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setShowCreateRoom(false)} style={{ flex: 1, padding: 16, borderRadius: 18, background: "var(--bg-secondary)", border: "none", color: "var(--text-muted)", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Batal</button>
                                    <button type="submit" disabled={!newRoomName.trim()} style={{
                                        flex: 2, padding: 16, borderRadius: 18, background: "var(--accent-primary)", border: "none", color: "#fff",
                                        fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 20px var(--accent-glow)"
                                    }}>
                                        Gas! →
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 680px) {
                    .library-items-container {
                        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
                        gap: 12px !important;
                    }
                    .library-items-container > div {
                        padding: 14px !important;
                        border-radius: 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}
