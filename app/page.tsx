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
    if (code.includes("user-not-found")) return "Kamu belum terdaftar di sini. Hubungi host dulu ya 💌";
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
      fontFamily: "var(--font-fredoka), sans-serif",
      background: "var(--app-bg)",
      position: "relative", overflow: "hidden",
      padding: 24,
      transition: "var(--theme-transition)",
    }}>
      {/* Ambient Decor */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 600,
          background: "radial-gradient(circle, var(--app-soft-accent) 0%, transparent 70%)",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 420, position: "relative", zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 44, marginBottom: 16 }}
          >
            🎧
          </motion.div>
          <h1 style={{
            margin: "0 0 10px", fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em",
            color: "var(--app-text)"
          }}>
            Selamat Datang
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "var(--app-text-muted)", fontWeight: 600 }}>
            Masuk untuk mendengarkan lagu bareng!
          </p>
        </div>

        <div style={{
          background: "var(--app-surface)",
          border: "2.5px solid var(--app-border)",
          borderRadius: 32, padding: "36px 32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
          position: "relative", overflow: "hidden",
          transition: "var(--theme-transition)",
        }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 800,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "var(--app-text-muted)", marginBottom: 10, paddingLeft: 4
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email kamu..."
                required
                style={{
                  width: "100%", padding: "16px 20px",
                  background: "var(--app-bg-secondary)",
                  border: "2px solid var(--app-border)",
                  borderRadius: 18, color: "var(--app-text)", fontSize: 15,
                  fontWeight: 600, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--app-primary)";
                  e.target.style.boxShadow = "0 0 0 4px var(--app-soft-accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--app-border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 800,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "var(--app-text-muted)", marginBottom: 10, paddingLeft: 4
              }}>Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi rahasia..."
                required
                style={{
                  width: "100%", padding: "16px 20px",
                  background: "var(--app-bg-secondary)",
                  border: "2px solid var(--app-border)",
                  borderRadius: 18, color: "var(--app-text)", fontSize: 15,
                  fontWeight: 600, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--app-primary)";
                  e.target.style.boxShadow = "0 0 0 4px var(--app-soft-accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--app-border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: "12px 16px", fontSize: 13,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1.5px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 14, color: "#ef4444",
                    fontWeight: 700, textAlign: "center", lineHeight: 1.4
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={!isLoading ? { scale: 1.02, y: -2, boxShadow: "0 8px 20px var(--app-soft-accent)" } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8, padding: "18px",
                background: "var(--app-primary)",
                color: "#fff", fontWeight: 900, fontSize: 16,
                border: "none", borderRadius: 18, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 6px 20px var(--app-soft-accent)",
                transition: "all 0.3s ease", fontFamily: "inherit",
              }}
            >
              {isLoading ? (
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              ) : (
                "Masuk Ke Ruang Kita →"
              )}
            </motion.button>
          </form>
        </div>

        <p style={{
          textAlign: "center", marginTop: 40, fontSize: 12,
          color: "var(--app-text-muted)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase"
        }}>
          ✦ ListenWithMe ✦
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
