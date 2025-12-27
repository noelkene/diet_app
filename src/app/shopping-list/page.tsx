'use client';

import { useState, useEffect } from 'react';
import { loadData, saveData } from '../actions';
import { ShoppingItem, ScheduledMeal, Recipe } from '@/lib/types';
import { categorizeShoppingListAction } from '@/lib/gemini';

type GroupedList = { category: string, items: ShoppingItem[] }[];

export default function ShoppingListPage() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [groupedItems, setGroupedItems] = useState<GroupedList | null>(null);

    useEffect(() => {
        loadData<ShoppingItem[]>('shopping-list.json', [])
            .then(data => {
                setItems(data);
                setIsLoading(false);
            });
    }, []);

    const saveList = async (updated: ShoppingItem[]) => {
        setItems(updated);
        await saveData('shopping-list.json', updated);
        // If grouped view is active, update it too locally to reflect check changes
        if (groupedItems) {
            const newGrouped = groupedItems.map(g => ({
                ...g,
                items: g.items.map(i => updated.find(u => u.name === i.name) || i)
            }));
            setGroupedItems(newGrouped);
        }
    };

    // ... addItem, toggleItem, removeItem helpers ...
    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        const updated = [...items, { name: newItem, checked: false }];
        await saveList(updated);
        setNewItem('');
        // Reset grouping if added manually as we don't know category
        if (groupedItems) setGroupedItems(null);
    };

    const toggleItem = async (index: number) => {
        const newItems = [...items];
        newItems[index].checked = !newItems[index].checked;
        await saveList(newItems);
    };

    const toggleItemByName = async (name: string) => {
        const index = items.findIndex(i => i.name === name);
        if (index !== -1) toggleItem(index);
    };

    const removeItem = async (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        await saveList(newItems);
        // Refresh grouping logic or just drop out of group mode to be safe
        setGroupedItems(null);
    };

    const clearChecked = async () => {
        const newItems = items.filter(i => !i.checked);
        await saveList(newItems);
        setGroupedItems(null);
    };

    const addFromCalendar = async (days: number) => {
        setIsLoading(true);
        try {
            const [schedule, recipes] = await Promise.all([
                loadData<ScheduledMeal[]>('schedule.json', []),
                loadData<Recipe[]>('recipes.json', [])
            ]);

            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + days);

            const todayStr = today.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const upcoming = schedule.filter(s => s.date >= todayStr && s.date < endStr);

            if (upcoming.length === 0) {
                alert(`No meals scheduled for the next ${days} days.`);
                setIsLoading(false);
                return;
            }

            const newIngredients: string[] = [];
            upcoming.forEach(slot => {
                const recipe = recipes.find(r => r.id === slot.recipeId);
                if (recipe) {
                    newIngredients.push(...recipe.ingredients);
                }
            });

            const existingNames = new Set(items.map(i => i.name));
            const toAdd = newIngredients
                .filter(name => !existingNames.has(name))
                .map(name => ({ name, checked: false }));

            if (toAdd.length === 0) {
                alert('Everything needed is already in the list.');
                setIsLoading(false);
                return;
            }

            const updated = [...items, ...toAdd];
            await saveList(updated);
            alert(`Added ${toAdd.length} items from ${upcoming.length} meals!`);
            setGroupedItems(null); // Reset grouping on new import
        } catch (e) {
            console.error(e);
            alert('Failed to import from calendar');
        } finally {
            setIsLoading(false);
        }
    };

    const organizeList = async () => {
        if (items.length === 0) return;
        setIsOrganizing(true);
        try {
            const itemNames = items.map(i => i.name);
            const organized = await categorizeShoppingListAction(itemNames);

            // Re-hydrate with actual item objects (preserving checked state)
            const grouped = organized.map(group => ({
                category: group.category,
                items: group.items.map(name => items.find(i => i.name === name)).filter(Boolean) as ShoppingItem[]
            }));

            // Catch any orphans (AI might miss some or hallucinate names)
            const capturedNames = new Set(grouped.flatMap(g => g.items.map(i => i.name)));
            const orphans = items.filter(i => !capturedNames.has(i.name));
            if (orphans.length > 0) {
                grouped.push({ category: 'Other', items: orphans });
            }

            setGroupedItems(grouped);
        } catch (e) {
            console.error(e);
            alert('Failed to organize list');
        } finally {
            setIsOrganizing(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Shopping List</h1>

            <div className="flex gap-2">
                <form onSubmit={addItem} className="flex gap-2 flex-grow">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add item..."
                        className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>Add</button>
                </form>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                    {groupedItems && (
                        <button onClick={() => setGroupedItems(null)} className="text-sm text-gray-500 hover:text-gray-800 underline">
                            Show Flat List
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => addFromCalendar(3)} disabled={isLoading} className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm border-indigo-100">
                        📅 Import (3 Days)
                    </button>
                    <button onClick={() => addFromCalendar(7)} disabled={isLoading} className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm border-indigo-100">
                        📅 Import (Week)
                    </button>
                    <button onClick={organizeList} disabled={isLoading || isOrganizing || items.length === 0} className="btn bg-teal-50 text-teal-700 hover:bg-teal-100 text-sm ml-auto border-teal-100">
                        {isOrganizing ? 'Organizing...' : '✨ Sort by Aisle'}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {groupedItems ? (
                    groupedItems.map((group, gIdx) => (
                        <div key={gIdx} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 text-sm border-b border-gray-100">
                                {group.category}
                            </div>
                            <div className="divide-y divide-gray-50">
                                {group.items.map((item) => (
                                    <div key={item.name} className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${item.checked ? 'opacity-50' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItemByName(item.name)}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                        />
                                        <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card">
                        {items.length > 0 ? (
                            <div className="space-y-1">
                                {items.map((item, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded group ${item.checked ? 'opacity-50' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItem(idx)}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                        />
                                        <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                                            {item.name}
                                        </span>
                                        <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {isLoading ? 'Loading list...' : 'Your list is empty.'}
                            </div>
                        )}
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
