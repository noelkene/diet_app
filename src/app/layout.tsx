import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Smart Diet App',
    description: 'AI-powered meal planning and inventory tracking',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-gray-50 text-gray-900">
                    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            <h1 className="text-xl font-bold text-teal-600">SmartDiet</h1>
                            <nav className="space-x-4 text-sm font-medium text-gray-500">
                                <a href="/" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors">Home</a>
                                <a href="/inventory" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors">Inventory</a>
                                <a href="/recipes" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors">Recipes</a>
                                <a href="/settings" className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors">Settings</a>
                            </nav>
                        </div>
                    </header>
                    <main className="max-w-4xl mx-auto p-4">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
