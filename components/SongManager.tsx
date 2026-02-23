import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export const LOCAL_SONGS = [
    { id: 'pp-01', title: '8 Letters', artist: 'Why Dont We', url: '/music/paypay/8Letters-WhyDontWe.mp3', duration: 192, hasLyrics: true, addedAt: Date.now() - (2 * 60 * 60 * 1000) },
    { id: 'pp-02', title: 'About You', artist: 'The 1975', url: '/music/paypay/AboutYou-The1975.mp3', duration: 325, hasLyrics: true, addedAt: Date.now() - (24 * 60 * 60 * 1000) },
    { id: 'pp-03', title: 'Alexandra', artist: 'Reality Club', url: '/music/paypay/Alexandra-RealityClub.mp3', duration: 249, hasLyrics: true, addedAt: Date.now() - (40 * 60 * 60 * 1000) },
    { id: 'pp-04', title: 'All Of Me', artist: 'John Legend', url: '/music/paypay/AllOfMe-JohnLegend.mp3', duration: 270, hasLyrics: true, addedAt: Date.now() - (50 * 60 * 60 * 1000) },
    { id: 'pp-05', title: 'All Too Well (10 Minute Version)', artist: 'Taylor Swift', url: '/music/paypay/AllTooWell10MinuteVersionTaylorsVersionFromTheVault-TaylorSwift.mp3', duration: 613 },
    { id: 'pp-06', title: 'An Art Gallery Could Never Be As Unique As You', artist: 'mrld', url: '/music/paypay/AnArtGalleryCouldNeverBeAsUniqueAsYou-mrld.mp3', duration: 169 },
    { id: 'pp-07', title: 'Anchor', artist: 'Novo Amor', url: '/music/paypay/Anchor-NovoAmor.mp3', duration: 254 },
    { id: 'pp-08', title: 'Anything', artist: 'Adrianne Lenker', url: '/music/paypay/Anything-AdrianneLenker.mp3', duration: 202 },
    { id: 'pp-09', title: 'Anything You Want', artist: 'Reality Club', url: '/music/paypay/AnythingYouWant-RealityClub.mp3', duration: 237 },
    { id: 'pp-10', title: 'A Piece Of You', artist: 'Nathaniel Constantin', url: '/music/paypay/APieceOfYou-NathanielConstantin.mp3', duration: 232 },
    { id: 'pp-11', title: 'A Thousand Years', artist: 'Christina Perri', url: '/music/paypay/AThousandYears-ChristinaPerri.mp3', duration: 286 },
    { id: 'pp-12', title: 'August', artist: 'Taylor Swift', url: '/music/paypay/August-TaylorSwift.mp3', duration: 263 },
    { id: 'pp-13', title: 'Best Part', artist: 'H.E.R.', url: '/music/paypay/BestPart-HER.mp3', duration: 209 },
    { id: 'pp-14', title: 'Bimbang', artist: 'Melody', url: '/music/paypay/Bimbang-Melody.mp3', duration: 216 },
    { id: 'pp-15', title: 'Blue Jeans', artist: 'Gangga Kusuma', url: '/music/paypay/BlueJeans-GanggaKusuma.mp3', duration: 225 },
    { id: 'pp-16', title: 'Cheating On You', artist: 'Charlie Puth', url: '/music/paypay/CheatingOnYou-CharliePuth.mp3', duration: 232 },
    { id: 'pp-17', title: 'Cinnamon Girl', artist: 'Lana Del Rey', url: '/music/paypay/CinnamonGirl-LanaDelRey.mp3', duration: 301 },
    { id: 'pp-18', title: 'Coffee', artist: 'Beabadoobee', url: '/music/paypay/Coffee-Beabadoobee.mp3', duration: 128 },
    { id: 'pp-19', title: 'Daylight', artist: 'Taylor Swift', url: '/music/paypay/Daylight-TaylorSwift.mp3', duration: 280 },
    { id: 'pp-20', title: 'End Of Beginning', artist: 'Djo', url: '/music/paypay/EndOfBeginning-Djo.mp3', duration: 159 },
    { id: 'pp-21', title: 'Everything Has Changed', artist: 'Taylor Swift', url: '/music/paypay/EverythingHasChanged-TaylorSwift.mp3', duration: 247 },
    { id: 'pp-22', title: 'Falling In Love', artist: 'Cigarettes After Sex', url: '/music/paypay/FallingInLove-CigarettesAfterSex.mp3', duration: 246 },
    { id: 'pp-23', title: 'Fine Line', artist: 'Harry Styles', url: '/music/paypay/FineLine-HarryStyles.mp3', duration: 375 },
    { id: 'pp-24', title: 'Glimpse Of Us', artist: 'Joji', url: '/music/paypay/GlimpseOfUs-Joji.mp3', duration: 234 },
    { id: 'pp-25', title: 'Happier', artist: 'Olivia Rodrigo', url: '/music/paypay/Happier-OliviaRodrigo.mp3', duration: 176 },
    { id: 'pp-26', title: 'Heather', artist: 'Conan Gray', url: '/music/paypay/Heather-ConanGray.mp3', duration: 197 },
    { id: 'pp-27', title: 'Heaven', artist: 'Jason Aldean', url: '/music/paypay/Heaven-JasonAldean.mp3', duration: 252 },
    { id: 'pp-28', title: 'Here With Me', artist: 'd4vd', url: '/music/paypay/HereWithMe-d4vd.mp3', duration: 241 },
    { id: 'pp-29', title: 'If U Could See Me Cryin In My Room', artist: 'Arash Buana', url: '/music/paypay/IfUCouldSeeMeCryinInMyRoom-ArashBuana.mp3', duration: 286 },
    { id: 'pp-30', title: 'I Love You', artist: 'Billie Eilish', url: '/music/paypay/ILoveYou-BillieEilish.mp3', duration: 292 },
    { id: 'pp-31', title: 'I Love You 3000', artist: 'Stephanie Poetri', url: '/music/paypay/ILoveYou3000-StephaniePoetri.mp3', duration: 208 },
    { id: 'pp-32', title: 'I Love You So', artist: 'The Walters', url: '/music/paypay/ILoveYouSo-TheWalters.mp3', duration: 170 },
    { id: 'pp-33', title: 'I Thought I Saw Your Face Today', artist: 'She And Him', url: '/music/paypay/IThoughtISawYourFaceToday-SheAndHim.mp3', duration: 172 },
    { id: 'pp-34', title: 'It Will Rain', artist: 'Bruno Mars', url: '/music/paypay/ItWillRain-BrunoMars.mp3', duration: 256 },
    { id: 'pp-35', title: 'Ive Always Loved U', artist: 'Arash Buana', url: '/music/paypay/IveAlwaysLovedU-ArashBuana.mp3', duration: 307 },
    { id: 'pp-36', title: 'Ivy', artist: 'Taylor Swift', url: '/music/paypay/Ivy-TaylorSwift.mp3', duration: 258 },
    { id: 'pp-37', title: 'Je Te Laisserai Des Mots', artist: 'Patrick Watson', url: '/music/paypay/JeTeLaisseraiDesMots-PatrickWatson.mp3', duration: 160 },
    { id: 'pp-38', title: 'Just You', artist: 'Teddy Adhitya', url: '/music/paypay/JustYou-TeddyAdhitya.mp3', duration: 181 },
    { id: 'pp-39', title: 'K', artist: 'Cigarettes After Sex', url: '/music/paypay/K-CigarettesAfterSex.mp3', duration: 320 },
    { id: 'pp-40', title: 'Last Forever', artist: 'LANY', url: '/music/paypay/LastForever-LANY.mp3', duration: 223 },
    { id: 'pp-41', title: 'Let You Break My Heart Again', artist: 'Laufey', url: '/music/paypay/LetYouBreakMyHeartAgain-Laufey.mp3', duration: 269 },
    { id: 'pp-42', title: 'Lover', artist: 'Taylor Swift', url: '/music/paypay/Lover-TaylorSwift.mp3', duration: 221 },
    { id: 'pp-43', title: 'Malibu Nights', artist: 'LANY', url: '/music/paypay/MalibuNights-LANY.mp3', duration: 287 },
    { id: 'pp-44', title: 'Margaret', artist: 'Lana Del Rey', url: '/music/paypay/Margaret-LanaDelRey.mp3', duration: 340 },
    { id: 'pp-45', title: 'Matilda', artist: 'Harry Styles', url: '/music/paypay/Matilda-HarryStyles.mp3', duration: 245 },
    { id: 'pp-46', title: 'Maybe', artist: 'Gabriela Bee', url: '/music/paypay/Maybe-GabrielaBee.mp3', duration: 194 },
    { id: 'pp-47', title: 'Melting', artist: 'Kali Uchis', url: '/music/paypay/Melting-KaliUchis.mp3', duration: 204 },
    { id: 'pp-48', title: 'Mine', artist: 'Petra Sihombing', url: '/music/paypay/Mine-PetraSihombing.mp3', duration: 224 },
    { id: 'pp-49', title: 'My Love Mine All Mine', artist: 'Mitski', url: '/music/paypay/MyLoveMineAllMine-Mitski.mp3', duration: 138 },
    { id: 'pp-50', title: 'Mystery Of Love', artist: 'Sufjan Stevens', url: '/music/paypay/MysteryOfLove-SufjanStevens.mp3', duration: 249 },
    { id: 'pp-51', title: 'Nothing', artist: 'Bruno Major', url: '/music/paypay/Nothing-BrunoMajor.mp3', duration: 176 },
    { id: 'pp-52', title: "Nothing's Gonna Hurt You Baby", artist: 'Cigarettes After Sex', url: '/music/paypay/NothingsGonnaHurtYouBaby-CigarettesAfterSex.mp3', duration: 295 },
    { id: 'pp-53', title: 'Not Strong Enough', artist: 'Boygenius', url: '/music/paypay/NotStrongEnough-Boygenius.mp3', duration: 235 },
    { id: 'pp-54', title: 'One Call Away', artist: 'Charlie Puth', url: '/music/paypay/OneCallAway-CharliePuth.mp3', duration: 202 },
    { id: 'pp-55', title: 'Ours To Keep', artist: 'Kendis', url: '/music/paypay/OursToKeep-Kendis.mp3', duration: 208 },
    { id: 'pp-56', title: 'Pluto Projector', artist: 'Rex Orange County', url: '/music/paypay/PlutoProjector-RexOrangeCounty.mp3', duration: 267 },
    { id: 'pp-57', title: 'Que Sera Sera', artist: 'Doris Day', url: '/music/paypay/QueSeraSera-DorisDay.mp3', duration: 178 },
    { id: 'pp-58', title: 'Right Where You Left Me', artist: 'Taylor Swift', url: '/music/paypay/RightWhereYouLeftMe-TaylorSwift.mp3', duration: 250 },
    { id: 'pp-59', title: 'Sailor Song', artist: 'Gigi Perez', url: '/music/paypay/SailorSong-GigiPerez.mp3', duration: 212 },
    { id: 'pp-60', title: 'Say Yes To Heaven', artist: 'Lana Del Rey', url: '/music/paypay/SayYesToHeaven-LanaDelRey.mp3', duration: 209 },
    { id: 'pp-61', title: 'Scott Street', artist: 'Phoebe Bridgers', url: '/music/paypay/ScottStreet-PhoebeBridgers.mp3', duration: 305 },
    { id: 'pp-62', title: 'Snowfall', artist: 'Oneheart', url: '/music/paypay/Snowfall-Oneheart.mp3', duration: 123 },
    { id: 'pp-63', title: "Someday I'll Get It", artist: 'Alek Olsen', url: '/music/paypay/SomedayIllGetIt-AlekOlsen.mp3', duration: 95 },
    { id: 'pp-64', title: 'Sparks', artist: 'Coldplay', url: '/music/paypay/Sparks-Coldplay.mp3', duration: 226 },
    { id: 'pp-65', title: 'The Story Of Us', artist: 'Taylor Swift', url: '/music/paypay/StoryOfUs-TaylorSwift.mp3', duration: 275 },
    { id: 'pp-66', title: 'Stuck With U', artist: 'Ariana Grande', url: '/music/paypay/StuckWithU-ArianaGrande.mp3', duration: 226 },
    { id: 'pp-67', title: 'Sunsetz', artist: 'Cigarettes After Sex', url: '/music/paypay/Sunsetz-CigarettesAfterSex.mp3', duration: 281 },
    { id: 'pp-68', title: 'Sweet', artist: 'Cigarettes After Sex', url: '/music/paypay/Sweet-CigarettesAfterSex.mp3', duration: 292 },
    { id: 'pp-69', title: 'The Archer', artist: 'Taylor Swift', url: '/music/paypay/TheArcher-TaylorSwift.mp3', duration: 220 },
    { id: 'pp-70', title: 'The Cut That Always Bleeds', artist: 'Conan Gray', url: '/music/paypay/TheCutThatAlwaysBleeds-ConanGray.mp3', duration: 243 },
    { id: 'pp-71', title: 'The Night We Met', artist: 'Lord Huron', url: '/music/paypay/TheNightWeMet-LordHuron.mp3', duration: 209 },
    { id: 'pp-72', title: 'The Way I Loved You', artist: 'Taylor Swift', url: '/music/paypay/TheWayILovedYou-TaylorSwift.mp3', duration: 245 },
    { id: 'pp-73', title: 'This Is Me Trying', artist: 'Taylor Swift', url: '/music/paypay/ThisIsMeTrying-TaylorSwift.mp3', duration: 195 },
    { id: 'pp-74', title: 'Those Eyes', artist: 'New West', url: '/music/paypay/ThoseEyes-NewWest.mp3', duration: 220 },
    { id: 'pp-75', title: 'To The Bone', artist: 'Pamungkas', url: '/music/paypay/ToTheBone-Pamungkas.mp3', duration: 342 },
    { id: 'pp-76', title: 'Valentine', artist: 'Laufey', url: '/music/paypay/Valentine-Laufey.mp3', duration: 169 },
    { id: 'pp-77', title: "We Can't Be Friends", artist: 'Ariana Grande', url: '/music/paypay/WeCantBeFriends-ArianaGrande.mp3', duration: 229 },
    { id: 'pp-78', title: 'When I Was Your Man', artist: 'Bruno Mars', url: '/music/paypay/WhenIWasYourMan-BrunoMars.mp3', duration: 214 },
    { id: 'pp-79', title: 'White Ferrari', artist: 'Frank Ocean', url: '/music/paypay/WhiteFerrari-FrankOcean.mp3', duration: 249 },
    { id: 'pp-80', title: 'Who Knows', artist: 'Daniel Caesar', url: '/music/paypay/WhoKnows-DanielCaesar.mp3', duration: 226 },
    { id: 'pp-81', title: 'Wildflower', artist: 'Billie Eilish', url: '/music/paypay/Wildflower-BillieEilish.mp3', duration: 261 },
    { id: 'pp-82', title: 'You Always', artist: 'Artist Unknown', url: '/music/paypay/YouAlways-ArtistUnknown.mp3', duration: 191 },
    { id: 'pp-83', title: 'You Are Enough', artist: 'Sleeping At Last', url: '/music/paypay/YouAreEnough-SleepingAtLast.mp3', duration: 180 },
    { id: 'pp-84', title: "You're Gonna Live Forever in Me", artist: 'John Mayer', url: '/music/paypay/YoureGonnaLiveForeverInMe-JohnMayer.mp3', duration: 185 },
    { id: 'pp-85', title: '18', artist: 'One Direction', url: '/music/paypay/18-OneDirection.mp3', duration: 252, addedAt: Date.now() },
    { id: 'pp-86', title: '2112', artist: 'Reality Club', url: '/music/paypay/2112-RealityClub.mp3', duration: 356, addedAt: Date.now() },
    { id: 'pp-87', title: 'A Man Without Love', artist: 'Engelbert Humperdinck', url: '/music/paypay/AManWithoutLove-EngelbertHumperdinck.mp3', duration: 197, addedAt: Date.now() },
    { id: 'pp-88', title: 'Another Love', artist: 'Tom Odell', url: '/music/paypay/AnotherLove-TomOdell.mp3', duration: 241, addedAt: Date.now() },
    { id: 'pp-89', title: 'A Sorrowful Reunion', artist: 'Reality Club', url: '/music/paypay/ASorrowfulReunion-RealityClub.mp3', duration: 259, addedAt: Date.now() },
    { id: 'pp-90', title: 'A Year Ago', artist: 'James Arthur', url: '/music/paypay/AYearAgo-JamesArthur.mp3', duration: 171, addedAt: Date.now() },
    { id: 'pp-91', title: 'Back To December', artist: 'Taylor Swift', url: '/music/paypay/BackToDecember-TaylorSwift.mp3', duration: 295, addedAt: Date.now() },
    { id: 'pp-92', title: 'Back To Friends', artist: 'Sombr', url: '/music/paypay/BackToFriends-Sombr.mp3', duration: 199, addedAt: Date.now() },
    { id: 'pp-93', title: 'Cars Outside', artist: 'James Arthur', url: '/music/paypay/CarsOutside-JamesArthur.mp3', duration: 247, addedAt: Date.now() },
    { id: 'pp-94', title: 'Dandelions', artist: 'Ruth B.', url: '/music/paypay/Dandelions-RuthB.mp3', duration: 228, addedAt: Date.now() },
    { id: 'pp-95', title: 'Daydreamin', artist: 'Ariana Grande', url: '/music/paypay/Daydreamin-ArianaGrande.mp3', duration: 213, addedAt: Date.now() },
    { id: 'pp-96', title: 'Drunk Text', artist: 'Henry Moodie', url: '/music/paypay/DrunkText-HenryMoodie.mp3', duration: 191, addedAt: Date.now() },
    { id: 'pp-97', title: 'Forever Young', artist: 'Alphaville', url: '/music/paypay/ForeverYoung-Alphaville.mp3', duration: 227, addedAt: Date.now() },
    { id: 'pp-98', title: 'Heat Waves', artist: 'Glass Animals', url: '/music/paypay/HeatWaves-GlassAnimals.mp3', duration: 239, addedAt: Date.now() },
    { id: 'pp-99', title: 'Just A Friend To You', artist: 'Meghan Trainor', url: '/music/paypay/JustAFriendToYou-MeghanTrainor.mp3', duration: 162, addedAt: Date.now() },
    { id: 'pp-100', title: 'Kota Ini Tak Sama Tanpamu', artist: 'Nadhif Basalamah', url: '/music/paypay/KotaIniTakSamaTanpamu-NadhifBasalamah.mp3', duration: 272, addedAt: Date.now() },
    { id: 'pp-101', title: 'Labyrinth', artist: 'Taylor Swift', url: '/music/paypay/Labyrinth-TaylorSwift.mp3', duration: 248, addedAt: Date.now() },
    { id: 'pp-102', title: 'Locked Away', artist: 'R. City', url: '/music/paypay/LockedAway-RCity.mp3', duration: 226, addedAt: Date.now() },
    { id: 'pp-103', title: 'Mind Over Matter (Reprise)', artist: 'Young The Giant', url: '/music/paypay/MindOverMatterReprise-YoungTheGiant.mp3', duration: 230, addedAt: Date.now() },
    { id: 'pp-104', title: 'Mockingbird', artist: 'Eminem', url: '/music/paypay/Mockingbird-Eminem.mp3', duration: 253, addedAt: Date.now() },
    { id: 'pp-105', title: 'Monolog', artist: 'Pamungkas', url: '/music/paypay/Monolog-Pamungkas.mp3', duration: 201, addedAt: Date.now() },
    { id: 'pp-106', title: 'Night Changes', artist: 'One Direction', url: '/music/paypay/NightChanges-OneDirection.mp3', duration: 240, addedAt: Date.now() },
    { id: 'pp-107', title: 'No One Noticed', artist: 'The Marías', url: '/music/paypay/NoOneNoticed-TheMarias.mp3', duration: 236, addedAt: Date.now() },
    { id: 'pp-108', title: 'Perfect', artist: 'One Direction', url: '/music/paypay/Perfect-OneDirection.mp3', duration: 228, addedAt: Date.now() },
    { id: 'pp-109', title: 'See You Again', artist: 'Wiz Khalifa', url: '/music/paypay/SeeYouAgain-WizKhalifa.mp3', duration: 229, addedAt: Date.now() },
    { id: 'pp-110', title: 'The Fate Of Ophelia', artist: 'Taylor Swift', url: '/music/paypay/TheFateOfOphelia-TaylorSwift.mp3', duration: 226, addedAt: Date.now() },
    { id: 'pp-111', title: 'The Man Who Cant Be Moved', artist: 'The Script', url: '/music/paypay/TheManWhoCantBeMoved-TheScript.mp3', duration: 239, addedAt: Date.now() },
    { id: 'pp-112', title: 'Wildest Dreams', artist: 'Taylor Swift', url: '/music/paypay/WildestDreams-TaylorSwift.mp3', duration: 234, addedAt: Date.now() },
    { id: 'pp-113', title: 'Wish You Were Here', artist: 'Taylor Swift', url: '/music/paypay/WishYouWereHere-TaylorSwift.mp3', duration: 248, addedAt: Date.now() },
    { id: 'pp-114', title: 'You Belong With Me', artist: 'Taylor Swift', url: '/music/paypay/YouBelongWithMe-TaylorSwift.mp3', duration: 228, addedAt: Date.now() },
    { id: 'pp-115', title: 'Youre Losing Me', artist: 'Taylor Swift', url: '/music/paypay/YoureLosingMe-TaylorSwift.mp3', duration: 277, addedAt: Date.now() },
];


export default function SongManager({ isOpen, onClose, onSongSelect, onAddRandom }: {
    isOpen: boolean; onClose: () => void; onSongSelect: (song: any) => void; onAddRandom?: () => void;
}) {
    const [search, setSearch] = useState("");

    const sortedSongs = [...LOCAL_SONGS].sort((a, b) => {
        const now = Date.now();
        const threshold = 42 * 60 * 60 * 1000;

        const isNewA = a.addedAt && (now - a.addedAt < threshold);
        const isNewB = b.addedAt && (now - b.addedAt < threshold);

        if (isNewA && !isNewB) return -1;
        if (!isNewA && isNewB) return 1;
        if (isNewA && isNewB) return (b.addedAt || 0) - (a.addedAt || 0);

        const artistCompare = a.artist.localeCompare(b.artist);
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title);
    });

    const getTimeAgo = (timestamp?: number) => {
        if (!timestamp) return "";
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Barusan";
        return `${hours} jam yang lalu`;
    };

    const filtered = sortedSongs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 20000,
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
                            background: "var(--bg-card)",
                            border: "1.5px solid var(--border-soft)",
                            borderRadius: 24, overflow: "hidden",
                            display: "flex", flexDirection: "column", maxHeight: "78vh",
                            boxShadow: "0 40px 80px rgba(0,0,0,0.25)",
                            position: "relative",
                            transition: "var(--theme-transition)",
                        }}
                    >
                        <div style={{ padding: "24px 24px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, fontFamily: "var(--font-fredoka)", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Pilih Lagu 🎵</h2>
                                {onAddRandom && (
                                    <button
                                        onClick={onAddRandom}
                                        style={{
                                            padding: "6px 12px", borderRadius: 12, border: "none",
                                            background: "var(--accent-primary)", color: "#fff",
                                            fontSize: 11, fontWeight: 900, cursor: "pointer",
                                            boxShadow: "var(--shadow-soft)",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        🎲 RANDOM 5
                                    </button>
                                )}
                            </div>
                            <div style={{ position: "relative" }}>
                                <MagnifyingGlassIcon style={{ position: "absolute", left: 14, top: 12, width: 18, height: 18, color: "var(--text-muted)" }} />
                                <input
                                    autoFocus
                                    placeholder="Cari judul atau artis..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 16px 12px 42px",
                                        borderRadius: 16, border: "1.5px solid var(--border-soft)",
                                        background: "var(--bg-secondary)",
                                        color: "var(--text-primary)", fontSize: 14, fontWeight: 600,
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
                                            onClick={() => { onSongSelect(s); }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 14,
                                                padding: "12px 14px", borderRadius: 16, border: "none",
                                                background: "none", textAlign: "left", cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "var(--bg-secondary)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "none";
                                            }}
                                        >
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: "var(--accent-primary)", display: "flex",
                                                alignItems: "center", justifyContent: "center", fontSize: 20
                                            }}>🎵</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{s.title}</p>
                                                    {s.addedAt && (Date.now() - s.addedAt < 42 * 60 * 60 * 1000) && (
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            <span style={{
                                                                fontSize: 9,
                                                                background: "linear-gradient(135deg, #FF0099, #FF0055)",
                                                                color: "#fff",
                                                                padding: "2px 8px",
                                                                borderRadius: 6,
                                                                fontWeight: 900,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.05em",
                                                                boxShadow: "0 2px 8px rgba(255,0,153,0.3)"
                                                            }}>
                                                                Baru
                                                            </span>
                                                            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary)', opacity: 0.8 }}>
                                                                {getTimeAgo(s.addedAt)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {s.hasLyrics && (
                                                        <span style={{
                                                            fontSize: 9,
                                                            background: "rgba(255, 72, 153, 0.1)",
                                                            color: "var(--accent-primary)",
                                                            padding: "2px 6px",
                                                            borderRadius: 6,
                                                            fontWeight: 900,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.05em",
                                                            border: "1px solid rgba(255, 72, 153, 0.2)"
                                                        }}>
                                                            Lirik
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{s.artist}</p>
                                            </div>
                                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                                                {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>Lagu tidak ditemukan 🥺</p>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: "12px 24px 24px", textAlign: "center" }}>
                            <button
                                onClick={onClose}
                                style={{
                                    width: "100%", padding: "14px", borderRadius: 16, border: "none",
                                    background: "var(--bg-secondary)", color: "var(--text-primary)",
                                    fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--border-soft)"}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                            >
                                Tutup
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
