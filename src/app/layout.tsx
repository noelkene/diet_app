import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NavBar from '@/components/NavBar';
import Providers from '@/components/Providers';

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
                    <Providers>
                        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                            <div className="max-w-4xl mx-auto flex justify-between items-center">
                                <h1 className="text-xl font-bold text-teal-600"><a href="/">SmartDiet</a></h1>
                                <NavBar />
                            </div>
                        </header>
                        <main className="max-w-4xl mx-auto p-4">
                            {children}
                        </main>
                    </Providers>
                </div>
            </body>
        </html>
    );
}
