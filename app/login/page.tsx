"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "15px 20px",
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    color: "#fff",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(255,180,210,0.7)",
    marginBottom: 8,
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(255,0,153,0.7)";
        e.target.style.boxShadow = "0 0 0 3px rgba(255,0,153,0.12), 0 0 20px rgba(255,0,153,0.08)";
        e.target.style.background = "rgba(255,0,153,0.05)";
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
        e.target.style.background = "rgba(255,255,255,0.05)";
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            if (isRegistering) {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", cred.user.uid), {
                    username: username || email.split("@")[0],
                    email,
                    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cred.user.uid}`,
                    status: "online",
                    currentRoom: null,
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/dashboard");
        } catch (err: any) {
            // More readable Firebase errors
            const msg = err.code?.includes("user-not-found") ? "Email not found."
                : err.code?.includes("wrong-password") ? "Wrong password."
                    : err.code?.includes("email-already-in-use") ? "Email already in use. Try logging in."
                        : err.code?.includes("weak-password") ? "Password too weak (min 6 chars)."
                            : err.message || "Something went wrong.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse 90% 70% at 50% 30%, #1a0010 0%, #080004 60%, #020002 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "var(--font-geist-sans), sans-serif",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Background orbs */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <div style={{
                    position: "absolute", top: "-10%", right: "-10%",
                    width: 500, height: 500, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,0,153,0.15) 0%, transparent 70%)",
                }} />
                <div style={{
                    position: "absolute", bottom: "-10%", left: "-10%",
                    width: 400, height: 400, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(130,0,255,0.1) 0%, transparent 70%)",
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: "100%",
                    maxWidth: 420,
                    background: "rgba(18, 8, 14, 0.75)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 28,
                    padding: "40px 36px 36px",
                    position: "relative",
                    zIndex: 1,
                    boxShadow: "0 0 0 1px rgba(255,0,153,0.1), 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(255,0,153,0.06)",
                    overflow: "hidden",
                }}
            >
                {/* Top gradient bar */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: "linear-gradient(90deg, transparent, #FF0099, #FF66C4, #FF0099, transparent)",
                }} />

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ fontSize: 40, marginBottom: 16, filter: "drop-shadow(0 0 16px rgba(255,0,153,0.5))" }}>
                        {isRegistering ? "🎉" : "✨"}
                    </div>
                    <h1 style={{
                        fontSize: 26,
                        fontWeight: 800,
                        letterSpacing: "-0.5px",
                        margin: "0 0 10px",
                        background: "linear-gradient(135deg, #FF0099, #FF88CC)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        {isRegistering ? "Create Your Pass" : "Welcome Back, Babe ✦"}
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: "rgba(255,180,210,0.6)", fontWeight: 400 }}>
                        {isRegistering ? "Join the vibe. Forever." : "Let's vibe together tonight."}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <AnimatePresence>
                        {isRegistering && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: "hidden" }}
                            >
                                <label style={labelStyle}>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Your stage name"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    required
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="min. 6 characters"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            autoComplete={isRegistering ? "new-password" : "current-password"}
                        />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    padding: "12px 16px",
                                    background: "rgba(255,60,60,0.08)",
                                    border: "1px solid rgba(255,60,60,0.25)",
                                    borderRadius: 10,
                                    fontSize: 13,
                                    color: "#FF8080",
                                    textAlign: "center",
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: 6,
                            height: 54,
                            background: isLoading
                                ? "rgba(255,0,153,0.4)"
                                : "linear-gradient(135deg, #FF0099 0%, #D9007A 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 16,
                            border: "none",
                            borderRadius: 14,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            boxShadow: isLoading ? "none" : "0 4px 24px rgba(255,0,153,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                            transition: "all 0.25s ease",
                            fontFamily: "inherit",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <span>Checking vibes...</span>
                            </>
                        ) : (
                            <span>{isRegistering ? "Join the Party 🎉" : "Let's Glow →"}</span>
                        )}
                    </motion.button>
                </form>

                {/* Toggle Mode */}
                <div style={{ marginTop: 28, textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
                    {isRegistering ? "Already have a pass?" : "New here?"}{" "}
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#FF66C4",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            fontFamily: "inherit",
                            textDecoration: "underline",
                            textDecorationStyle: "dotted",
                            textUnderlineOffset: 3,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#FF0099")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#FF66C4")}
                    >
                        {isRegistering ? "Log In" : "Sign Up"}
                    </button>
                </div>
            </motion.div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
