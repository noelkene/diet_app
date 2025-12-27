'use client';

import { useState, useEffect } from 'react';
import { loadData } from '../actions';
import { Recipe } from '@/lib/types';

interface HistoryItem {
    date: string; // ISO string
    recipeTitle: string;
    rating: number; // 1-5
    notes: string;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    // In a real app, this would be form to log a meal. 
    // Here we'll show the log. The "Cooked This" button in recipes should redirect here or open a modal.

    useEffect(() => {
        loadData<HistoryItem[]>('history.json', [])
            .then(data => setHistory(data))
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Meal History</h1>

            <div className="card">
                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map((item, idx) => (
                            <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold">{item.recipeTitle}</h3>
                                    <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex text-yellow-400 my-1">
                                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                                </div>
                                {item.notes && <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{item.notes}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>No meals logged yet.</p>
                        <p>After cooking a suggested recipe, mark it as cooked to track it here!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
