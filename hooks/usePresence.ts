"use client";
import { useEffect, useRef, useCallback } from "react";
import { ref, onValue, set, onDisconnect, serverTimestamp, DatabaseReference } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export type PresenceStatus = "online" | "idle" | "offline";

export interface UserPresence {
    uid: string;
    displayName: string;
    status: PresenceStatus;
    activity: string; // e.g. "Sedang di room", "Melihat dashboard"
    currentRoom: string | null;
    currentRoomName?: string | null;
    lastSeen: number; // unix ms
    photoURL?: string | null;
    email?: string | null;
}

// ── Broadcast own presence to RTDB ──────────────────────────────────────────
export function useBroadcastPresence(
    uid: string | null,
    displayName: string | null,
    photoURL?: string | null,
    extraFields?: Partial<Pick<UserPresence, "activity" | "currentRoom" | "currentRoomName">>
) {
    const presenceRef = useRef<DatabaseReference | null>(null);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const write = useCallback(
        (status: PresenceStatus, extra?: Partial<UserPresence>) => {
            if (!uid || !presenceRef.current) return;
            const data: Record<string, unknown> = {
                uid,
                displayName: displayName || "User",
                status,
                activity: extra?.activity ?? extraFields?.activity ?? "Aktif",
                currentRoom: extra?.currentRoom ?? extraFields?.currentRoom ?? null,
                currentRoomName: extra?.currentRoomName ?? extraFields?.currentRoomName ?? null,
                lastSeen: Date.now(),
                ...(photoURL !== undefined && { photoURL }),
            };
            set(presenceRef.current, data);
        },
        [uid, displayName, photoURL, extraFields]
    );

    useEffect(() => {
        if (!uid) return;
        presenceRef.current = ref(rtdb, `presence/${uid}`);

        // Set online immediately
        write("online");

        // On disconnect → mark offline, but RETAIN currentRoom for "Still listening" indicator
        onDisconnect(presenceRef.current).update({
            status: "offline",
            lastSeen: Date.now(),
        });

        // Idle detection: 3 min inactivity → idle
        const resetIdle = () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
            write("online");
            idleTimer.current = setTimeout(() => write("idle"), 3 * 60 * 1000);
        };
        const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
        events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
        resetIdle();

        // Cleanup
        return () => {
            events.forEach((ev) => window.removeEventListener(ev, resetIdle));
            if (idleTimer.current) clearTimeout(idleTimer.current);
            write("offline");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    // Allow callers to update activity/room info dynamically
    const updateActivity = useCallback(
        (activity: string, currentRoom: string | null = null, currentRoomName: string | null = null) => {
            write("online", { activity, currentRoom, currentRoomName });
        },
        [write]
    );

    return { updateActivity };
}

// ── Merged Presence: Registerd Firestore Users + RTDB Status ──────────────────
import { collection, onSnapshot as onSnapshotFS, query as queryFS } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

export function useMergedPresence(onUpdate: (users: UserPresence[]) => void) {
    useEffect(() => {
        const presenceRef = ref(rtdb, "presence");
        const usersRef = collection(db, "users");

        let rtdbData: Record<string, UserPresence> = {};
        let fsData: any[] = [];

        const mergeAndSend = () => {
            const merged = fsData.map(fsUser => {
                const presence = rtdbData[fsUser.id];
                return {
                    uid: fsUser.id,
                    displayName: fsUser.username || fsUser.displayName || "User",
                    email: fsUser.email || null,
                    status: (presence?.status as PresenceStatus) ?? "offline",
                    activity: presence?.activity ?? "Offline",
                    currentRoom: presence?.currentRoom ?? null,
                    currentRoomName: presence?.currentRoomName ?? null,
                    lastSeen: presence?.lastSeen ?? fsUser.lastSeen ?? 0,
                    photoURL: fsUser.photoURL ?? presence?.photoURL ?? null,
                };
            });
            onUpdate(merged);
        };

        // Watch Firestore Users
        const unsubFS = onSnapshotFS(usersRef, (snap) => {
            fsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeAndSend();
        });

        // Watch RTDB Presence
        const unsubRTDB = onValue(presenceRef, (snap) => {
            rtdbData = snap.val() ?? {};
            mergeAndSend();
        });

        return () => { unsubFS(); unsubRTDB(); };
    }, [onUpdate]);
}

export function useAllPresence(
    onUpdate: (users: UserPresence[]) => void
) {
    useEffect(() => {
        const presenceRef = ref(rtdb, "presence");
        const unsub = onValue(presenceRef, (snap) => {
            const raw = snap.val() ?? {};
            const users: UserPresence[] = Object.values(raw).map((u: any) => ({
                uid: u.uid ?? "",
                displayName: u.displayName ?? "User",
                status: (u.status as PresenceStatus) ?? "offline",
                activity: u.activity ?? "",
                currentRoom: u.currentRoom ?? null,
                currentRoomName: u.currentRoomName ?? null,
                lastSeen: u.lastSeen ?? 0,
                photoURL: u.photoURL ?? null,
            }));
            onUpdate(users);
        });
        return () => unsub();
    }, [onUpdate]);
}

// ── Watch users in a specific room ──────────────────────────────────────────
export function useRoomPresence(
    roomId: string | null,
    onUpdate: (users: UserPresence[]) => void
) {
    useEffect(() => {
        if (!roomId) return;
        const presenceRef = ref(rtdb, "presence");
        const unsub = onValue(presenceRef, (snap) => {
            const raw = snap.val() ?? {};
            const inRoom: UserPresence[] = Object.values(raw)
                .filter((u: any) => u.currentRoom === roomId && u.status !== "offline")
                .map((u: any) => ({
                    uid: u.uid ?? "",
                    displayName: u.displayName ?? "User",
                    status: (u.status as PresenceStatus) ?? "offline",
                    activity: u.activity ?? "",
                    currentRoom: u.currentRoom ?? null,
                    lastSeen: u.lastSeen ?? 0,
                    photoURL: u.photoURL ?? null,
                }));
            onUpdate(inRoom);
        });
        return () => unsub();
    }, [roomId, onUpdate]);
}

// ── Helper: human-readable last-seen ────────────────────────────────────────
export function formatLastSeen(ms: number): string {
    if (!ms) return "baru saja";
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 10) return "baru saja";
    if (diff < 60) return `${diff} detik lalu`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
}

// ── Helper: initials from name ───────────────────────────────────────────────
export function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? "")
        .join("");
}
