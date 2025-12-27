'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function NavBar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isActive = (path: string) => {
        return pathname === path ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm ring-1 ring-teal-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
    };

    if (!session) {
        return (
            <div className="flex gap-4">
                <button onClick={() => signIn('google')} className="text-sm font-medium text-teal-600 hover:underline">
                    Sign In with Google
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <Link href="/" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/')}`}>
                    📅 Schedule
                </Link>
                <Link href="/inventory" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/inventory')}`}>
                    📦 Inventory
                </Link>
                <Link href="/recipes" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/recipes')}`}>
                    🍽️ Recipes
                </Link>
                <Link href="/shopping-list" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/shopping-list')}`}>
                    🛒 Shop
                </Link>
                <Link href="/history" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/history')}`}>
                    📜 History
                </Link>
                <Link href="/settings" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/settings')}`}>
                    ⚙️ Settings
                </Link>
                <Link href="/feedback" className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive('/feedback')}`}>
                    💬 Feedback
                </Link>
            </nav>
            <div className="flex items-center gap-2 border-l pl-4 ml-2">
                {session.user?.image ? (
                    <img src={session.user.image} alt={session.user.name || 'User'} className="w-8 h-8 rounded-full" />
                ) : (
                    <span className="text-xs bg-teal-100 text-teal-800 rounded-full w-8 h-8 flex items-center justify-center">
                        {session.user?.name?.[0] || 'U'}
                    </span>
                )}
            </div>
        </div>
    );
}
