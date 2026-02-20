"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

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

    const colors = {
        success: { bg: "rgba(30,140,80,0.9)", border: "rgba(50,200,110,0.25)", icon: "#4ade80" },
        error: { bg: "rgba(140,30,60,0.9)", border: "rgba(220,60,100,0.25)", icon: "#f87171" },
        info: { bg: "rgba(30,60,140,0.9)", border: "rgba(80,130,255,0.25)", icon: "#93c5fd" },
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{
                position: "fixed", bottom: 90, right: 20, zIndex: 999,
                display: "flex", flexDirection: "column", gap: 8,
                pointerEvents: "none",
            }}>
                <AnimatePresence>
                    {toasts.map((t) => {
                        const c = colors[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "11px 16px",
                                    background: c.bg,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: 12,
                                    backdropFilter: "blur(12px)",
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                                    pointerEvents: "auto",
                                    maxWidth: 300,
                                }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                    background: "rgba(255,255,255,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {t.type === "error"
                                        ? <XMarkIcon style={{ width: 12, height: 12, color: c.icon }} />
                                        : <CheckIcon style={{ width: 12, height: 12, color: c.icon }} />
                                    }
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.4 }}>
                                    {t.message}
                                </p>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
