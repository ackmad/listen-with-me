"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const friendlyError = (code: string) => {
    if (code.includes("user-not-found")) return "Kamu belum terdaftar di sini. Hubungi Elfan dulu ya 💌";
    if (code.includes("wrong-password")) return "Kata sandinya kurang tepat, coba ingat-ingat lagi 🔑";
    if (code.includes("too-many-requests")) return "Terlalu banyak percobaan. Tunggu sebentar ya ⏳";
    if (code.includes("network-request-failed")) return "Koneksinya agak rewel nih, coba lagi 🌐";
    return "Ada yang salah nih, coba ulangi lagi ya 🙏";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(friendlyError(err.code || ""));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-geist-sans), sans-serif",
      background: "#0a0508",
      position: "relative", overflow: "hidden",
      padding: 24,
    }}>
      {/* Ambient — subtle only */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,0,100,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", right: "-10%",
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(80,0,160,0.08) 0%, transparent 70%)",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 400, position: "relative", zIndex: 1,
        }}
      >
        {/* Header — personal identity */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 36, marginBottom: 16,
            filter: "drop-shadow(0 0 20px rgba(255,80,160,0.4))",
            lineHeight: 1,
          }}>🎧</div>
          <h1 style={{
            margin: "0 0 10px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 30%, rgba(255,130,200,0.8) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Ruang kita masih di sini
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,180,200,0.5)", lineHeight: 1.5 }}>
            Siap dengerin lagu bareng hari ini?
          </p>
        </div>

        {/* Glass Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24, padding: "32px 28px",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 2px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,100,180,0.06)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Top accent line */}
          <div style={{
            position: "absolute", top: 0, left: "30%", right: "30%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,100,180,0.5), transparent)",
          }} />

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,180,200,0.5)", marginBottom: 8,
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masukkan emailmu"
                required
                autoComplete="email"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#fff", fontSize: 15,
                  fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(220,60,130,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(220,60,130,0.1)";
                  e.target.style.background = "rgba(220,60,130,0.04)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "rgba(255,255,255,0.04)";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,180,200,0.5)", marginBottom: 8,
              }}>Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="rahasia kita"
                required
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#fff", fontSize: 15,
                  fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(220,60,130,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(220,60,130,0.1)";
                  e.target.style.background = "rgba(220,60,130,0.04)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "rgba(255,255,255,0.04)";
                }}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: "11px 14px", fontSize: 13,
                    background: "rgba(200,30,80,0.08)",
                    border: "1px solid rgba(200,30,80,0.2)",
                    borderRadius: 10, color: "rgba(255,140,160,0.9)",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4, height: 52,
                background: isLoading
                  ? "rgba(180,30,100,0.35)"
                  : "linear-gradient(135deg, #c4005c 0%, #8c004a 100%)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", borderRadius: 12, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: isLoading ? "none" : "0 4px 20px rgba(180,0,90,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                transition: "all 0.2s ease", fontFamily: "inherit", letterSpacing: "0.02em",
              }}
            >
              {isLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span>Masuk...</span>
                </>
              ) : (
                <span>Masuk ke Ruang Kita →</span>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", marginTop: 28, fontSize: 12,
          color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em",
        }}>
          ✦ Hanya untuk Elfan & Savira ✦
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
