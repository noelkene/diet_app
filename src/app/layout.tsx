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
                                <a href="/" className="hover:text-teal-600">Home</a>
                                <a href="/inventory" className="hover:text-teal-600">Inventory</a>
                                <a href="/recipes" className="hover:text-teal-600">Recipes</a>
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
