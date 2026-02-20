"use client";
import { useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

export const LOCAL_SONGS = [
    { id: 'lf-01', title: 'Actually Romantic', artist: 'Leanna Firestone', url: '/music/ActuallyRomantic.mp3', duration: 185 },
    { id: 'lf-02', title: 'CANCELLED!', artist: 'Leanna Firestone', url: '/music/CANCELLED.mp3', duration: 192 },
    { id: 'lf-03', title: 'Eldest Daughter', artist: 'Leanna Firestone', url: '/music/EldestDaughter.mp3', duration: 210 },
    { id: 'lf-04', title: 'Elizabeth Taylor', artist: 'Leanna Firestone', url: '/music/ElizabethTaylor.mp3', duration: 178 },
    { id: 'lf-05', title: 'Father Figure', artist: 'Leanna Firestone', url: '/music/FatherFigure.mp3', duration: 205 },
    { id: 'lf-06', title: 'Honey', artist: 'Leanna Firestone', url: '/music/Honey.mp3', duration: 198 },
    { id: 'lf-07', title: 'Opalite', artist: 'Leanna Firestone', url: '/music/Opalite.mp3', duration: 165 },
];

export default function SongManager({ isOpen, onClose, onSongSelect }: {
    isOpen: boolean;
    onClose: () => void;
    onSongSelect: (song: any) => void;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filtered = LOCAL_SONGS.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (song: any) => {
        onSongSelect(song);
        onClose();
        setSearchTerm('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                    style={{
                        position: "fixed", inset: 0, zIndex: 200,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 16 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: "100%", maxWidth: 440,
                            background: "rgba(12, 5, 9, 0.97)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: 24, overflow: "hidden",
                            display: "flex", flexDirection: "column", maxHeight: "78vh",
                            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,0,100,0.08)",
                            position: "relative",
                        }}
                    >
                        {/* Accent line */}
                        <div style={{
                            position: "absolute", top: 0, left: "25%", right: "25%", height: 1,
                            background: "linear-gradient(90deg, transparent, rgba(200,0,100,0.5), transparent)",
                        }} />

                        {/* Header */}
                        <div style={{
                            padding: "24px 24px 18px",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <div>
                                <h2 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                                    Pilih Lagunya
                                </h2>
                                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                                    {LOCAL_SONGS.length} lagu tersedia
                                </p>
                            </div>
                            <button onClick={onClose} style={{
                                width: 34, height: 34, borderRadius: "50%", border: "none",
                                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s",
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,0,100,0.15)"; e.currentTarget.style.color = "#e0608a"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                            >
                                <XMarkIcon style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: "14px 18px 10px" }}>
                            <div style={{ position: "relative" }}>
                                <MagnifyingGlassIcon style={{
                                    width: 16, height: 16, color: "rgba(255,255,255,0.2)",
                                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                }} />
                                <input
                                    type="text" placeholder="Cari lagu..." value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: "100%", padding: "10px 14px 10px 36px",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: 10, color: "#fff", fontSize: 14,
                                        fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = "rgba(200,0,100,0.35)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                                />
                            </div>
                        </div>

                        {/* Song List */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
                            {filtered.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {filtered.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handleSelect(song)}
                                            onMouseEnter={() => setHoveredId(song.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                                                background: hoveredId === song.id ? "rgba(200,0,100,0.07)" : "transparent",
                                                border: `1px solid ${hoveredId === song.id ? "rgba(200,0,100,0.15)" : "transparent"}`,
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <div style={{
                                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                                background: hoveredId === song.id
                                                    ? "linear-gradient(135deg, rgba(200,0,100,0.4), rgba(100,0,180,0.4))"
                                                    : "rgba(255,255,255,0.04)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.15s",
                                            }}>
                                                {hoveredId === song.id
                                                    ? <PlayIcon style={{ width: 15, height: 15, color: "#fff", marginLeft: 2 }} />
                                                    : <MusicalNoteIcon style={{ width: 15, height: 15, color: "rgba(255,255,255,0.2)" }} />
                                                }
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{
                                                    margin: "0 0 2px", fontSize: 14, fontWeight: 600,
                                                    color: hoveredId === song.id ? "#fff" : "rgba(255,255,255,0.7)",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {song.title}
                                                </p>
                                                <p style={{
                                                    margin: 0, fontSize: 11,
                                                    color: hoveredId === song.id ? "rgba(220,100,150,0.8)" : "rgba(255,255,255,0.25)",
                                                }}>
                                                    {song.artist}
                                                </p>
                                            </div>
                                            {hoveredId === song.id && (
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: "rgba(220,100,150,0.9)",
                                                    padding: "3px 9px", borderRadius: 20,
                                                    background: "rgba(200,0,100,0.1)",
                                                    border: "1px solid rgba(200,0,100,0.2)",
                                                    flexShrink: 0,
                                                }}>
                                                    Tambah
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "36px 20px", color: "rgba(255,255,255,0.2)" }}>
                                    <MusicalNoteIcon style={{ width: 36, height: 36, margin: "0 auto 10px", display: "block" }} />
                                    <p style={{ margin: 0, fontSize: 13 }}>Lagunya nggak ketemu 😅</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
