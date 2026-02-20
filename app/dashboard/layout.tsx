"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
    HomeIcon,
    MusicalNoteIcon,
    UserCircleIcon,
    ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline'; // Adjust import based on installed icon lib
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    ];

    return (
        <div className="flex min-h-screen bg-[#0F0F0F] text-[#EAEAEA]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#222] hidden md:flex flex-col p-6 fixed h-full bg-[#151515]">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF2E93] shadow-[0_0_10px_#FF2E93]" />
                    <h1 className="text-xl font-bold tracking-tight">ListenWithMe</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.name} href={item.href}>
                                <div
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                                        isActive
                                            ? "bg-[#FF2E93]/10 text-[#FF2E93] border border-[#FF2E93]/20"
                                            : "text-gray-400 hover:bg-[#222] hover:text-white"
                                    )}
                                >
                                    <Icon className={clsx("w-6 h-6", isActive && "text-[#FF2E93]")} />
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute left-0 w-1 h-8 bg-[#FF2E93] rounded-r-full"
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-[#FF2E93] transition-colors mt-auto"
                >
                    <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
                {children}
            </main>

            {/* Mobile Nav (Bottom) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#151515] border-t border-[#222] p-4 flex justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div className={clsx("flex flex-col items-center gap-1", isActive ? "text-[#FF2E93]" : "text-gray-400")}>
                                <Icon className="w-6 h-6" />
                                <span className="text-xs">{item.name}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
