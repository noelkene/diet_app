'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { loadData, saveData } from './actions';
import { ScheduledMeal, MealLog, MealType } from '@/lib/types';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import MealLogger from '@/components/MealLogger';

export default function Home() {
    const { data: session, status } = useSession();
    const [schedule, setSchedule] = useState<ScheduledMeal[]>([]);
    const [inventoryCount, setInventoryCount] = useState(0);
    // Loading state for DATA fetching, separate from Auth status
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Settings
    const [displayName, setDisplayName] = useState('');
    const [isGuideDismissed, setIsGuideDismissed] = useState(false);

    // --- LOGGING ---
    const [mealLogs, setMealLogs] = useState<MealLog[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            loadData<MealLog[]>('history.json', []).then(data => setMealLogs(data || []));
        }
    }, [status]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        Promise.all([
            loadData<ScheduledMeal[]>('schedule.json', []),
            loadData<any[]>('inventory.json', []),
            loadData<any>('settings.json', {})
        ]).then(([scheduleData, inventoryData, settingsData]) => {
            setSchedule(scheduleData || []);
            setInventoryCount(inventoryData?.length || 0);
            setDisplayName(settingsData?.displayName || '');
            setIsGuideDismissed(settingsData?.isGuideDismissed || false);
            setIsDataLoading(false);
        }).catch(e => {
            console.error(e);
            setIsDataLoading(false);
        });
    }, [status]);

    const handleLogMeal = async (logData: any) => {
        const newLog: MealLog = {
            id: Date.now().toString(),
            ...logData
        };
        const updatedLogs = [newLog, ...mealLogs];
        setMealLogs(updatedLogs);
        await saveData('history.json', updatedLogs);
        alert('Meal logged successfully!');
    };

    const dismissGuide = async () => {
        setIsGuideDismissed(true);
        const settings = await loadData<any>('settings.json', {});
        await saveData('settings.json', { ...settings, isGuideDismissed: true });
    };

    // Generate next 7 days
    const today = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
            dateObj: d,
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
            formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    });

    const todayStr = today.toISOString().split('T')[0];

    const getMealForDay = (dateStr: string) => schedule.find(s => s.date === dateStr);

    const removeFromSchedule = async (dateStr: string) => {
        if (!confirm('Clear meal for this day?')) return;
        const newSchedule = schedule.filter(s => s.date !== dateStr);
        setSchedule(newSchedule);
        await saveData('schedule.json', newSchedule);
    };

    // --- RENDER LOGIC ---

    if (status === 'loading') {
        return <div className="p-12 text-center text-gray-500">Loading Scantry...</div>;
    }

    // 1. LANDING PAGE (Unauthenticated)
    if (status === 'unauthenticated') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">

                <div className="space-y-4 max-w-2xl">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent pb-2">
                        Scantry
                    </h1>
                    <p className="text-xl text-teal-800 font-medium tracking-wide uppercase">Scan. Plan. Eat.</p>
                    <p className="text-gray-600 text-lg leading-relaxed pt-4">
                        The AI-powered kitchen assistant that helps you organize your fridge,
                        reduce waste, and eat better.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl w-full">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-3xl mb-3">📦</div>
                        <h3 className="font-bold text-gray-900 mb-2">Smart Inventory</h3>
                        <p className="text-sm text-gray-600">Snap a photo of your receipt or fridge. AI instantly tracks what you have.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-3xl mb-3">🍽️</div>
                        <h3 className="font-bold text-gray-900 mb-2">Meal Planning</h3>
                        <p className="text-sm text-gray-600">Get personalized recipe suggestions based on ingredients you already own.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-3xl mb-3">🛒</div>
                        <h3 className="font-bold text-gray-900 mb-2">Auto Shopping List</h3>
                        <p className="text-sm text-gray-600">Run out of milk? It's automatically added to your list for next time.</p>
                    </div>
                </div>

                <div className="bg-teal-50 p-8 rounded-2xl w-full max-w-md border border-teal-100">
                    <p className="font-semibold text-gray-700 mb-4">Ready to simplify your kitchen?</p>
                    <button
                        onClick={() => signIn('google')}
                        className="w-full btn bg-teal-600 text-white text-lg py-3 hover:bg-teal-700 shadow-lg transition-transform transform hover:-translate-y-1"
                    >
                        Sign In with Google
                    </button>
                    <p className="text-xs text-gray-500 mt-4">Safe, secure, and private authentication.</p>
                </div>

            </div>
        );
    }

    // 2. DASHBOARD (Authenticated)

    // Determine Welcome Name
    const firstName = displayName || session?.user?.name?.split(' ')[0] || 'Chef';

    return (
        <div className="space-y-8">
            <section className="text-center py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, {firstName}</h1>
                <p className="text-gray-600">Track your Super Gut progress today.</p>
            </section>

            <OnboardingChecklist
                hasInventory={inventoryCount > 0}
                hasSchedule={schedule.length > 0}
                isDismissed={isGuideDismissed}
                onDismiss={dismissGuide}
            />

            {/* TODAY'S SUPER GUT LOG */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Today's Meals</h2>
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">Super Gut Tracker</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(slot => (
                        <MealLogger
                            key={slot}
                            slot={slot}
                            date={todayStr}
                            onLog={handleLogMeal}
                        />
                    ))}
                </div>
            </section>

            <section className="pt-8 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Plan</h2>
                <div className="grid gap-4">
                    {weekDays.map((day) => {
                        const meal = getMealForDay(day.dateStr);
                        return (
                            <div key={day.dateStr} className={`card flex flex-col sm:flex-row items-center p-4 border-l-4 ${meal ? 'border-teal-500' : 'border-gray-200'}`}>
                                <div className="w-full sm:w-32 flex-shrink-0 text-center sm:text-left mb-2 sm:mb-0">
                                    <p className="font-bold text-gray-900">{day.dayName}</p>
                                    <p className="text-sm text-gray-500">{day.formatted}</p>
                                </div>

                                <div className="flex-grow text-center sm:text-left">
                                    {meal ? (
                                        <div>
                                            <p className="font-medium text-lg text-teal-800">{meal.recipeTitle}</p>
                                            <a href="/recipes" className="text-xs text-gray-400 hover:text-teal-600 underline">View in Recipes</a>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">Not planned yet</p>
                                    )}
                                </div>

                                <div className="mt-2 sm:mt-0 ml-auto">
                                    {meal ? (
                                        <button
                                            onClick={() => removeFromSchedule(day.dateStr)}
                                            className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                                        >
                                            Clear
                                        </button>
                                    ) : (
                                        <a href="/recipes" className="btn bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">
                                            + Add Meal
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">Need ingredients for this week?</p>
                <a href="/shopping-list" className="btn btn-primary">
                    Go to Shopping List
                </a>
            </div>
        </div>
    );
}
