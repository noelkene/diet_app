'use client';

import { useState, useEffect } from 'react';
import { Ingredient } from '@/lib/types';
import { identifyIngredientsAction } from '@/lib/gemini';

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            setIngredients(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (ingredients.length > 0) {
            localStorage.setItem('inventory', JSON.stringify(ingredients));
        }
    }, [ingredients]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const newIngredients = await identifyIngredientsAction(formData);
            // Merge with existing or replace? Let's append but check for dupes in a real app.
            // For now, just append.
            setIngredients(prev => [...prev, ...newIngredients]);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const removeItem = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
        // Explicit save for deletion if useEffect doesn't catch empty? 
        // useEffect handles it unless it's empty, but localstorage.setItem works for empty arrays.
        // The useEffect condition `if (ingredients.length > 0)` prevents clearing.
        // We should fix that logic or manually save here.
        localStorage.setItem('inventory', JSON.stringify(newIngredients));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Kitchen Inventory</h1>
                    <label className={`btn btn-primary cursor-pointer ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span>{isAnalyzing ? 'Analyzing...' : '📷 Scan Fridge'}</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isAnalyzing}
                        />
                    </label>
                </div>

                {/* Manual Add */}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                    const qty = (form.elements.namedItem('qty') as HTMLInputElement).value;
                    if (name) {
                        setIngredients([...ingredients, { name, quantity: qty || 'some', category: 'Manual' }]);
                        form.reset();
                    }
                }} className="flex gap-2 p-4 bg-gray-50 rounded-lg">
                    <input name="name" placeholder="Item name" className="flex-1 p-2 border rounded" required />
                    <input name="qty" placeholder="Qty" className="w-24 p-2 border rounded" />
                    <button type="submit" className="btn bg-teal-600 text-white px-4">Add</button>
                </form>
            </div>
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                </div>
            )}

            {isAnalyzing && (
                <div className="p-8 text-center bg-gray-50 rounded-lg animate-pulse">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-teal-600 font-medium"> analyzing your fridge contents...</p>
                    <p className="text-sm text-gray-500">This connects to Gemini Vision AI</p>
                </div>
            )}

            {ingredients.length > 0 ? (
                <div className="grid gap-4">
                    {ingredients.map((item, idx) => (
                        <div key={idx} className="card flex justify-between items-center p-4">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    {item.category}
                                </span>
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="text-gray-400 hover:text-red-500"
                                    aria-label="Remove item"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="text-center pt-4">
                        <a href="/recipes" className="btn btn-primary w-full md:w-auto">
                            Suggested Recipes →
                        </a>
                    </div>
                </div>
            ) : (
                !isAnalyzing && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-lg mb-2">Your inventory is empty.</p>
                        <p>Upload a photo of your shelves to get started!</p>
                    </div>
                )
            )}
        </div>
    );
}
