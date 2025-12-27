'use client';

import { useState, useEffect } from 'react';
import { Ingredient, Recipe, ShoppingItem } from '@/lib/types';

export default function ShoppingListPage() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        // Generate shopping list based on missing ingredients from selected recipes
        // For MVP, we'll just have a manual list + button to "Import from Recipes"
        const saved = localStorage.getItem('shopping-list');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('shopping-list', JSON.stringify(items));
    }, [items]);

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setItems([...items, { name: newItem, checked: false }]);
        setNewItem('');
    };

    const toggleItem = (index: number) => {
        const newItems = [...items];
        newItems[index].checked = !newItems[index].checked;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const clearChecked = () => {
        setItems(items.filter(i => !i.checked));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Shopping List</h1>

            <form onSubmit={addItem} className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add item..."
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button type="submit" className="btn btn-primary px-6">
                    Add
                </button>
            </form>

            <div className="card">
                {items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded group ${item.checked ? 'opacity-50' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleItem(idx)}
                                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                />
                                <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                                    {item.name}
                                </span>
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Your list is empty.
                    </div>
                )}
            </div>

            {items.some(i => i.checked) && (
                <button onClick={clearChecked} className="text-sm text-red-600 hover:underline">
                    Clear completed items
                </button>
            )}
        </div>
    );
}
