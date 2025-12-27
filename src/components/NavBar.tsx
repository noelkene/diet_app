'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm ring-1 ring-teal-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
    };

    return (
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
        </nav>
    );
}
