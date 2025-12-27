'use client';

import { useState, useEffect } from 'react';
import { loadData, saveData } from './actions';
import { ScheduledMeal } from '@/lib/types';

export default function Home() {
    const [schedule, setSchedule] = useState<ScheduledMeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData<ScheduledMeal[]>('schedule.json', [])
            .then(data => {
                setSchedule(data);
                setIsLoading(false);
            })
            .catch(e => {
                console.error(e);
                setIsLoading(false);
            });
    }, []);

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

    const getMealForDay = (dateStr: string) => schedule.find(s => s.date === dateStr);

    const removeFromSchedule = async (dateStr: string) => {
        if (!confirm('Clear meal for this day?')) return;
        const newSchedule = schedule.filter(s => s.date !== dateStr);
        setSchedule(newSchedule);
        await saveData('schedule.json', newSchedule);
    };

    return (
        <div className="space-y-8">
            <section className="text-center py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, Noel</h1>
                <p className="text-gray-600">Here is your meal plan for the week.</p>
            </section>

            <section className="grid gap-4">
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
