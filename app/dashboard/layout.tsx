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
        { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    ];

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", transition: "var(--theme-transition)" }}>
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 fixed h-full p-6"
                style={{
                    background: "var(--bg-sidebar)",
                    borderRight: "1.5px solid var(--border-primary)",
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

            {/* Mobile Bottom Navigation - Using the one from dashboard/page.tsx or replacing it here */}
            {/* The user wants full atas bawah, so we ensure this nav doesn't crowd too much or we match the design */}
        </div>
    );
}
