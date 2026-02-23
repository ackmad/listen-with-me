"use client";
export const dynamic = 'force-dynamic';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
    HomeIcon,
    UserCircleIcon,
    MusicalNoteIcon,
    ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Library', href: '/dashboard/songs', icon: MusicalNoteIcon },
        { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
    ];

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", transition: "var(--theme-transition)" }}>
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 fixed h-full p-6"
                style={{
                    background: "var(--bg-sidebar)",
                    borderRight: "1.5px solid var(--border-soft)",
                    zIndex: 50,
                    transition: "var(--theme-transition)"
                }}>
                <div className="mb-10 flex items-center gap-3">
                    <img src="/images/logo-listenWithMe.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--accent-primary)" }}>ListenWithMe</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.name} href={item.href}>
                                <div
                                    className={clsx(
                                        "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer relative group",
                                        isActive
                                            ? "text-white shadow-[0_8px_20px_var(--accent-glow)]"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                                    )}
                                    style={{
                                        background: isActive ? "var(--accent-primary)" : "transparent",
                                    }}
                                >
                                    <Icon className={clsx("w-6 h-6 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-[var(--text-muted)]")} />
                                    <span className="font-bold text-sm tracking-wide uppercase">{item.name}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-[-2px] w-1.5 h-8 bg-white rounded-r-full"
                                            style={{ zIndex: 10 }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 transition-colors mt-auto font-bold opacity-70 hover:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                >
                    <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            {/* On mobile, we want padding to be 0 or small for "full" look. On desktop, we offset for sidebar */}
            <main className="flex-1 md:ml-64 min-h-screen relative overflow-x-hidden">
                {children}
            </main>

            {/* Mobile Bottom Navigation - Liquid Glass Style */}
            <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px]" style={{ zIndex: 1000 }}>
                <nav className="flex justify-around items-center p-2.5 rounded-[36px] border-[1px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative"
                    style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        backdropFilter: "blur(32px) saturate(180%)",
                        WebkitBackdropFilter: "blur(32px) saturate(180%)",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                    }}
                >
                    {/* Glossy Liquid Highlight Reflection */}
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(110deg, transparent, rgba(255,255,255,0.08), transparent)',
                            pointerEvents: 'none', zIndex: 1
                        }}
                    />

                    {/* Top Edge Rim Light */}
                    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', pointerEvents: 'none', zIndex: 2 }} />

                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.name} href={item.href} className="relative z-10 flex-1">
                                <motion.div
                                    whileTap={{ scale: 0.92 }}
                                    className="flex flex-col items-center gap-1 px-2 py-2.5 relative"
                                >
                                    {/* Liquid Plasma Active Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="liquid-pill"
                                            className="absolute inset-0 rounded-[28px] -z-10"
                                            style={{
                                                background: "var(--accent-primary)",
                                                opacity: 0.15,
                                                filter: "blur(12px)",
                                            }}
                                            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                                        />
                                    )}

                                    <div className="relative">
                                        <Icon className={clsx("w-6 h-6 transition-all duration-500", isActive ? "text-[var(--accent-primary)] drop-shadow-[0_0_8px_var(--accent-glow)]" : "text-[var(--text-muted)] opacity-60")} />
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-dot"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_var(--accent-primary)]"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            />
                                        )}
                                    </div>
                                    <span className={clsx("text-[9px] font-[900] tracking-[0.2em] uppercase transition-colors duration-300", isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] opacity-50")}>
                                        {item.name}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
