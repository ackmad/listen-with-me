import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export const LOCAL_SONGS = [
    { id: 'pp-01', title: '8 Letters', artist: 'Why Dont We', url: '/music/paypay/8Letters-WhyDontWe.mp3', duration: 192 },
    { id: 'pp-02', title: 'All Of Me', artist: 'John Legend', url: '/music/paypay/AllOfMe-JohnLegend.mp3', duration: 270 },
    { id: 'pp-03', title: 'All Too Well (10 Minute Version)', artist: 'Taylor Swift', url: '/music/paypay/AllTooWell10MinuteVersionTaylorsVersionFromTheVault-TaylorSwift.mp3', duration: 613 },
    { id: 'pp-04', title: 'An Art Gallery Could Never Be As Unique As You', artist: 'mrld', url: '/music/paypay/AnArtGalleryCouldNeverBeAsUniqueAsYou-mrld.mp3', duration: 169 },
    { id: 'pp-05', title: 'Anything You Want', artist: 'Reality Club', url: '/music/paypay/AnythingYouWant-RealityClub.mp3', duration: 237 },
    { id: 'pp-06', title: 'Bimbang', artist: 'Melody', url: '/music/paypay/Bimbang-Melody.mp3', duration: 216 },
    { id: 'pp-07', title: 'Blue Jeans', artist: 'Gangga Kusuma', url: '/music/paypay/BlueJeans-GanggaKusuma.mp3', duration: 225 },
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
    { id: 'pp-31', title: "Nothing's Gonna Hurt You Baby", artist: 'Cigarettes After Sex', url: '/music/paypay/NothingsGonnaHurtYouBaby-CigarettesAfterSex.mp3', duration: 295 },
    { id: 'pp-32', title: 'Not Strong Enough', artist: 'Boygenius', url: '/music/paypay/NotStrongEnough-Boygenius.mp3', duration: 235 },
    { id: 'pp-33', title: 'One Call Away', artist: 'Charlie Puth', url: '/music/paypay/OneCallAway-CharliePuth.mp3', duration: 202 },
    { id: 'pp-34', title: 'Ours To Keep', artist: 'Kendis', url: '/music/paypay/OursToKeep-Kendis.mp3', duration: 208 },
    { id: 'pp-35', title: 'Que Sera Sera', artist: 'Doris Day', url: '/music/paypay/QueSeraSera-DorisDay.mp3', duration: 178 },
    { id: 'pp-36', title: 'Right Where You Left Me', artist: 'Taylor Swift', url: '/music/paypay/RightWhereYouLeftMe-TaylorSwift.mp3', duration: 250 },
    { id: 'pp-37', title: 'Sailor Song', artist: 'Gigi Perez', url: '/music/paypay/SailorSong-GigiPerez.mp3', duration: 212 },
    { id: 'pp-38', title: 'Say Yes To Heaven', artist: 'Lana Del Rey', url: '/music/paypay/SayYesToHeaven-LanaDelRey.mp3', duration: 209 },
    { id: 'pp-39', title: 'Scott Street', artist: 'Phoebe Bridgers', url: '/music/paypay/ScottStreet-PhoebeBridgers.mp3', duration: 305 },
    { id: 'pp-40', title: 'Snowfall', artist: 'Oneheart', url: '/music/paypay/Snowfall-Oneheart.mp3', duration: 123 },
    { id: 'pp-41', title: 'Someday I\'ll Get It', artist: 'Alek Olsen', url: '/music/paypay/SomedayIllGetIt-AlekOlsen.mp3', duration: 95 },
    { id: 'pp-42', title: 'Sparks', artist: 'Coldplay', url: '/music/paypay/Sparks-Coldplay.mp3', duration: 226 },
    { id: 'pp-43', title: 'The Story Of Us', artist: 'Taylor Swift', url: '/music/paypay/StoryOfUs-TaylorSwift.mp3', duration: 275 },
    { id: 'pp-44', title: 'Stuck With U', artist: 'Ariana Grande', url: '/music/paypay/StuckWithU-ArianaGrande.mp3', duration: 226 },
    { id: 'pp-45', title: 'Sunsetz', artist: 'Cigarettes After Sex', url: '/music/paypay/Sunsetz-CigarettesAfterSex.mp3', duration: 281 },
    { id: 'pp-46', title: 'The Archer', artist: 'Taylor Swift', url: '/music/paypay/TheArcher-TaylorSwift.mp3', duration: 220 },
    { id: 'pp-47', title: 'The Cut That Always Bleeds', artist: 'Conan Gray', url: '/music/paypay/TheCutThatAlwaysBleeds-ConanGray.mp3', duration: 243 },
    { id: 'pp-48', title: 'The Way I Loved You', artist: 'Taylor Swift', url: '/music/paypay/TheWayILovedYou-TaylorSwift.mp3', duration: 245 },
    { id: 'pp-49', title: 'This Is Me Trying', artist: 'Taylor Swift', url: '/music/paypay/ThisIsMeTrying-TaylorSwift.mp3', duration: 195 },
    { id: 'pp-50', title: 'We Can\'t Be Friends', artist: 'Ariana Grande', url: '/music/paypay/WeCantBeFriends-ArianaGrande.mp3', duration: 229 },
    { id: 'pp-51', title: 'When I Was Your Man', artist: 'Bruno Mars', url: '/music/paypay/WhenIWasYourMan-BrunoMars.mp3', duration: 214 },
    { id: 'pp-52', title: 'Who Knows', artist: 'Daniel Caesar', url: '/music/paypay/WhoKnows-DanielCaesar.mp3', duration: 226 },
    { id: 'pp-53', title: 'Wildflower', artist: 'Billie Eilish', url: '/music/paypay/Wildflower-BillieEilish.mp3', duration: 261 },
    { id: 'pp-54', title: 'You Always', artist: 'Artist Unknown', url: '/music/paypay/YouAlways-ArtistUnknown.mp3', duration: 191 },
    { id: 'pp-55', title: 'You Are Enough', artist: 'Sleeping At Last', url: '/music/paypay/YouAreEnough-SleepingAtLast.mp3', duration: 180 },
    { id: 'pp-56', title: 'You\'re Gonna Live Forever in Me', artist: 'John Mayer', url: '/music/paypay/YoureGonnaLiveForeverInMe-JohnMayer.mp3', duration: 185 },
];

export default function SongManager({ isOpen, onClose, onSongSelect }: {
    isOpen: boolean; onClose: () => void; onSongSelect: (song: any) => void;
}) {
    const [search, setSearch] = useState("");

    const filtered = LOCAL_SONGS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 3000,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 20, pointerEvents: "auto",
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
                    />

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
                        <div style={{ padding: "24px 24px 16px" }}>
                            <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 900, fontFamily: "var(--font-fredoka)", color: "var(--app-text)", letterSpacing: "-0.01em" }}>Pilih Lagu 🎵</h2>
                            <div style={{ position: "relative" }}>
                                <MagnifyingGlassIcon style={{ position: "absolute", left: 14, top: 12, width: 18, height: 18, color: "var(--app-text-muted)" }} />
                                <input
                                    autoFocus
                                    placeholder="Cari judul atau artis..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 16px 12px 42px",
                                        borderRadius: 16, border: "1.5px solid var(--app-border)",
                                        background: "var(--app-bg-secondary)",
                                        color: "var(--app-text)", fontSize: 14, fontWeight: 600,
                                        outline: "none", transition: "all 0.2s"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 24px" }}>
                            {filtered.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {filtered.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => { onSongSelect(s); onClose(); }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 14,
                                                padding: "12px 14px", borderRadius: 16, border: "none",
                                                background: "none", textAlign: "left", cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "var(--app-bg-secondary)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "none";
                                            }}
                                        >
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: "var(--app-primary)", display: "flex",
                                                alignItems: "center", justifyContent: "center", fontSize: 20
                                            }}>🎵</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "var(--app-text)" }}>{s.title}</p>
                                                <p style={{ margin: 0, fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600 }}>{s.artist}</p>
                                            </div>
                                            <span style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 700 }}>
                                                {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--app-text-muted)", fontWeight: 600 }}>Lagu tidak ditemukan 🥺</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
