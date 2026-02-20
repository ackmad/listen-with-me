"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
}

interface ToastContextType {
    toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: Toast["type"] = "success") => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{
                position: "fixed", bottom: 100, right: 20, zIndex: 3000,
                display: "flex", flexDirection: "column", gap: 10,
                pointerEvents: "none",
            }}>
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "14px 20px",
                                background: "var(--app-toast-bg)",
                                border: "1.5px solid var(--app-toast-border)",
                                borderRadius: 20,
                                backdropFilter: "blur(20px)",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                                pointerEvents: "auto",
                                maxWidth: 340,
                                transition: "var(--theme-transition)",
                            }}
                        >
                            <div style={{ flexShrink: 0 }}>
                                {t.type === "success" && <CheckCircleIcon style={{ width: 22, height: 22, color: "var(--app-toast-text)" }} />}
                                {t.type === "error" && <XCircleIcon style={{ width: 22, height: 22, color: "var(--app-toast-text)" }} />}
                                {t.type === "info" && <InformationCircleIcon style={{ width: 22, height: 22, color: "var(--app-toast-text)" }} />}
                            </div>
                            <p style={{
                                margin: 0, fontSize: 13,
                                color: "var(--app-toast-text)",
                                fontWeight: 800,
                                lineHeight: 1.4,
                                fontFamily: "var(--font-fredoka)",
                                letterSpacing: "0.01em"
                            }}>
                                {t.message}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
