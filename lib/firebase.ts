import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Lazy, guarded initialization ──────────────────────────────────────────
// Do NOT call initializeApp() at module-level unconditionally.
// Next.js imports this module on the server during build — if env vars
// are missing (e.g. Vercel CI before env vars are set), Firebase throws
// auth/invalid-api-key and the build fails. Guard with apiKey check.
function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const auth: Auth = app ? getAuth(app) : ({} as Auth);
export const db: Firestore = app ? getFirestore(app) : ({} as Firestore);
export const rtdb: Database = app ? getDatabase(app) : ({} as Database);

export default app;
