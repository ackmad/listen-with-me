import { db } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const SYNC_MARGIN_MS = 100; // Acceptable sync margin

/**
 * Calculates the current audio time based on startedAt timestamp
 * @param {object} startedAt - Firestore Timestamp or null
 * @returns {number} Current time in seconds
 */
export const calculateCurrentTime = (startedAt) => {
    if (!startedAt) return 0;

    // Handle both Firestore Timestamp and potential Date objects/numbers
    const startTime = startedAt.toMillis ? startedAt.toMillis() : startedAt;
    const now = Date.now(); // We rely on client clock for now, assuming reasonable sync. 
    // In a robust production app, we might use a server time offset.

    const diff = now - startTime;
    return Math.max(0, diff / 1000);
};

/**
 * Updates the room state to start playing a song
 * @param {string} roomId 
 * @param {object} song - Song object { id, url, title, duration }
 */
export const playSong = async (roomId, song) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        currentSong: song,
        isPlaying: true,
        startedAt: serverTimestamp(),
    });
};

/**
 * Updates the room state to pause playback
 * @param {string} roomId 
 */
export const pauseSong = async (roomId) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        isPlaying: false,
        startedAt: null, // Reset start time or handle pause logic differently if seeking is needed
    });
    // Note: For advanced pause/resume at specific time, we'd need to store 'pausedAt' time.
    // For this simple version, we might just stop or rely on clients to sync snap.
};

/**
 * Updates the room state to simple seek/play from new time
 * Actually, for this strict sync model, 'seek' usually means updating 'startedAt' 
 * to a time in the past relative to now.
 * newStartedAt = now - seekTimeInMS
 */
export const seekSong = async (roomId, seekTimeSeconds) => {
    // We can't easily do "serverTimestamp() - offset" in firestore write directly without cloud functions usually.
    // Client-side approximation:
    const now = Date.now();
    const newStartTime = now - (seekTimeSeconds * 1000);
    // basic approximation, might be slightly off due to latency, but acceptable for MVP

    // Convert to Firestore compatible timestamp if needed, or just use number if we stored as number.
    // But we are using serverTimestamp() usually. 
    // To strictly use serverTimestamp for sync, we can't easily seek from client without a cloud function 
    // OR we change the logic to store 'baseTime' and 'pausedAt'.

    // Alternative: We will just trust the host's timestamp for 'seek' actions for simplicity in this MVP.
    // But specific requirement was "Gunakan serverTimestamp()".
    // Strategy: When playing from 0, use serverTimestamp().
    // When seeking, we might need a trusted timestamp. 
    // Let's stick to the user request "Pastikan ketika host menekan play, sistem menyimpan waktu mulai ke database."
    // We will assume play always starts from now for simple Play interactions.
    // For seeking, we might implement later if needed, but for now focus on Play/Pause.
};
