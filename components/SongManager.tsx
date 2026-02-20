"use client";
import { useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

export const LOCAL_SONGS = [
    { id: 'pp-01', title: '8 Letters', artist: 'Why Dont We', url: '/music/paypay/8Letters-WhyDontWe.mp3', duration: 192 },
    { id: 'pp-02', title: 'All Of Me', artist: 'John Legend', url: '/music/paypay/AllOfMe-JohnLegend.mp3', duration: 270 },
    { id: 'pp-03', title: 'An Art Gallery Could Never Be As Unique As You', artist: 'mrld', url: '/music/paypay/AnArtGalleryCouldNeverBeAsUniqueAsYou-mrld.mp3', duration: 169 },
    { id: 'pp-04', title: 'Anything You Want', artist: 'Reality Club', url: '/music/paypay/AnythingYouWant-RealityClub.mp3', duration: 237 },
    { id: 'pp-05', title: 'Bimbang', artist: 'Melody', url: '/music/paypay/Bimbang-Melody.mp3', duration: 216 },
    { id: 'pp-06', title: 'Blue Jeans', artist: 'Gangga Kusuma', url: '/music/paypay/BlueJeans-GanggaKusuma.mp3', duration: 225 },
    { id: 'pp-07', title: "Nothing's Gonna Hurt You Baby", artist: 'Cigarettes After Sex', url: "/music/paypay/Cigarettes After Sex - Nothing's Gonna Hurt You Baby (Lyrics).mp3", duration: 295 },
    { id: 'pp-08', title: 'Cinnamon Girl', artist: 'Lana Del Rey', url: '/music/paypay/CinnamonGirl-LanaDelRey.mp3', duration: 301 },
    { id: 'pp-09', title: 'Coffee', artist: 'Beabadoobee', url: '/music/paypay/Coffee-Beabadoobee.mp3', duration: 128 },
    { id: 'pp-10', title: 'Falling In Love', artist: 'Cigarettes After Sex', url: '/music/paypay/FallingInLove-CigarettesAfterSex.mp3', duration: 246 },
    { id: 'pp-11', title: 'Glimpse Of Us', artist: 'Joji', url: '/music/paypay/GlimpseOfUs-Joji.mp3', duration: 234 },
    { id: 'pp-12', title: 'Happier', artist: 'Olivia Rodrigo', url: '/music/paypay/Happier-OliviaRodrigo.mp3', duration: 176 },
    { id: 'pp-13', title: 'Heather', artist: 'Conan Gray', url: '/music/paypay/Heather-ConanGray.mp3', duration: 197 },
    { id: 'pp-14', title: 'Heaven', artist: 'Jason Aldean', url: '/music/paypay/Heaven-JasonAldean.mp3', duration: 252 },
    { id: 'pp-15', title: 'Here With Me', artist: 'd4vd', url: '/music/paypay/HereWithMe-d4vd.mp3', duration: 241 },
    { id: 'pp-16', title: 'If U Could See Me Cryin In My Room', artist: 'Arash Buana', url: '/music/paypay/IfUCouldSeeMeCryinInMyRoom-ArashBuana.mp3', duration: 286 },
    { id: 'pp-17', title: 'I Thought I Saw Your Face Today', artist: 'She And Him', url: '/music/paypay/IThoughtISawYourFaceToday-SheAndHim.mp3', duration: 172 },
    { id: 'pp-18', title: 'It Will Rain', artist: 'Bruno Mars', url: '/music/paypay/ItWillRain-BrunoMars.mp3', duration: 256 },
    { id: 'pp-19', title: 'Ive Always Loved U', artist: 'Arash Buana', url: '/music/paypay/IveAlwaysLovedU-ArashBuana.mp3', duration: 307 },
    { id: 'pp-20', title: 'Ivy', artist: 'Taylor Swift', url: '/music/paypay/Ivy-TaylorSwift.mp3', duration: 258 },
    { id: 'pp-21', title: 'Je Te Laisserai Des Mots', artist: 'Patrick Watson', url: '/music/paypay/JeTeLaisseraiDesMots-PatrickWatson.mp3', duration: 160 },
    { id: 'pp-22', title: 'Just You', artist: 'Teddy Adhitya', url: '/music/paypay/JustYou-TeddyAdhitya.mp3', duration: 181 },
    { id: 'pp-23', title: 'K', artist: 'Cigarettes After Sex', url: '/music/paypay/K-CigarettesAfterSex.mp3', duration: 320 },
    { id: 'pp-24', title: 'Last Forever', artist: 'LANY', url: '/music/paypay/LastForever-LANY.mp3', duration: 223 },
    { id: 'pp-25', title: 'Let You Break My Heart Again', artist: 'Laufey', url: '/music/paypay/LetYouBreakMyHeartAgain-Laufey.mp3', duration: 269 },
    { id: 'pp-26', title: 'Malibu Nights', artist: 'LANY', url: '/music/paypay/MalibuNights-LANY.mp3', duration: 287 },
    { id: 'pp-27', title: 'Margaret', artist: 'Lana Del Rey', url: '/music/paypay/Margaret-LanaDelRey.mp3', duration: 340 },
    { id: 'pp-28', title: 'Maybe', artist: 'Gabriela Bee', url: '/music/paypay/Maybe-GabrielaBee.mp3', duration: 194 },
    { id: 'pp-29', title: 'Mine', artist: 'Petra Sihombing', url: '/music/paypay/Mine-PetraSihombing.mp3', duration: 224 },
    { id: 'pp-30', title: 'Mystery Of Love', artist: 'Sufjan Stevens', url: '/music/paypay/MysteryOfLove-SufjanStevens.mp3', duration: 249 },
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
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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
                            background: "var(--app-surface)",
                            border: "1.5px solid var(--app-border)",
                            borderRadius: 24, overflow: "hidden",
                            display: "flex", flexDirection: "column", maxHeight: "78vh",
                            boxShadow: "0 40px 80px rgba(0,0,0,0.25)",
                            position: "relative",
                            transition: "var(--theme-transition)",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: "24px 24px 18px",
                            borderBottom: "1px solid var(--app-border)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <div>
                                <h2 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 800, color: "var(--app-text)" }}>
                                    Pilih Lagunya
                                </h2>
                                <p style={{ margin: 0, fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600 }}>
                                    {LOCAL_SONGS.length} lagu tersedia
                                </p>
                            </div>
                            <button onClick={onClose} style={{
                                width: 34, height: 34, borderRadius: "50%", border: "none",
                                background: "var(--app-bg-secondary)", color: "var(--app-text-muted)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--app-primary)"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--app-bg-secondary)"; e.currentTarget.style.color = "var(--app-text-muted)"; }}
                            >
                                <XMarkIcon style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: "14px 18px 10px" }}>
                            <div style={{ position: "relative" }}>
                                <MagnifyingGlassIcon style={{
                                    width: 16, height: 16, color: "var(--app-text-muted)",
                                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                }} />
                                <input
                                    type="text" placeholder="Cari lagu favorit..." value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 14px 12px 40px",
                                        background: "var(--app-bg-secondary)",
                                        border: "1.5px solid var(--app-border)",
                                        borderRadius: 14, color: "var(--app-text)", fontSize: 14,
                                        fontFamily: "var(--font-fredoka)", fontWeight: 600,
                                        outline: "none", boxSizing: "border-box",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = "var(--app-primary)"; e.target.style.boxShadow = "0 0 0 3px var(--app-soft-accent)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "var(--app-border)"; e.target.style.boxShadow = "none"; }}
                                />
                            </div>
                        </div>

                        {/* Song List */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
                            {filtered.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {filtered.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handleSelect(song)}
                                            onMouseEnter={() => setHoveredId(song.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                padding: "12px", borderRadius: 16, cursor: "pointer",
                                                background: hoveredId === song.id ? "var(--app-bg-secondary)" : "transparent",
                                                border: `1.5px solid ${hoveredId === song.id ? "var(--app-primary)" : "transparent"}`,
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                                background: hoveredId === song.id ? "var(--app-primary)" : "var(--app-bg-secondary)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: hoveredId === song.id ? "#fff" : "var(--app-primary)",
                                                transition: "all 0.2s",
                                            }}>
                                                {hoveredId === song.id
                                                    ? <PlayIcon style={{ width: 16, height: 16, marginLeft: 2 }} />
                                                    : <MusicalNoteIcon style={{ width: 16, height: 16 }} />
                                                }
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{
                                                    margin: "0 0 3px", fontSize: 14, fontWeight: 800,
                                                    color: hoveredId === song.id ? "var(--app-primary)" : "var(--app-text)",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {song.title}
                                                </p>
                                                <p style={{
                                                    margin: 0, fontSize: 11, fontWeight: 600,
                                                    color: "var(--app-text-muted)",
                                                }}>
                                                    {song.artist}
                                                </p>
                                            </div>
                                            {hoveredId === song.id && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                                                    style={{
                                                        fontSize: 11, fontWeight: 800, color: "#fff",
                                                        padding: "4px 10px", borderRadius: 20,
                                                        background: "var(--app-primary)",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    Pilih
                                                </motion.span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--app-text-muted)" }}>
                                    <MusicalNoteIcon style={{ width: 40, height: 40, margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Lagunya nggak ketemu 😅</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
