'use client';

import { useState, useEffect } from 'react';
import { Ingredient, Recipe } from '@/lib/types';
import { generateMealPlanAction } from '@/lib/gemini';

export default function RecipesPage() {
    const [inventory, setInventory] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedInv = localStorage.getItem('inventory');
        if (savedInv) {
            setInventory(JSON.parse(savedInv));
        }

        // Check for saved recipes too
        const savedRecipes = localStorage.getItem('recipes');
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
    }, []);

    const generateRecipes = async () => {
        if (inventory.length === 0) {
            alert('Please add items to your inventory first!');
            return;
        }
        setIsLoading(true);
        try {
            const newRecipes = await generateMealPlanAction(inventory);
            setRecipes(newRecipes);
            localStorage.setItem('recipes', JSON.stringify(newRecipes));
        } catch (e) {
            console.error(e);
            alert('Failed to generate recipes');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Meal Suggestions</h1>
                <button
                    onClick={generateRecipes}
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Thinking...' : '✨ Generate Ideas'}
                </button>
            </div>

            {recipes.length === 0 && !isLoading && (
                <div className="text-center py-12 text-gray-500">
                    <p>No recipes yet.</p>
                    <p>Make sure your inventory is up to date, then click Generate.</p>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card animate-pulse h-48 bg-gray-100"></div>
                    ))}
                </div>
            )}

            <div className="grid gap-6">
                {recipes.map((recipe) => (
                    <div key={recipe.id} className="card overflow-hidden !p-0 border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{recipe.title}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {recipe.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed bg-white">{recipe.description}</p>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-8">
                                <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-3">Dietary Match</h4>
                                <ul className="space-y-2">
                                    {[
                                        { key: 'wife', label: 'Wife', fit: recipe.suitability.wife, note: 'Low Carb/Sugar Friendly' },
                                        { key: 'son', label: 'Son', fit: recipe.suitability.son, note: 'Filling' },
                                        { key: 'dad', label: 'You', fit: recipe.suitability.dad, note: 'Diet Friendly' }
                                    ].map((person) => (
                                        <li key={person.key} className="flex items-center text-sm">
                                            <span className="mr-2 text-lg">{userEmoji(person.key)}</span>
                                            <span className="font-medium min-w-[3rem] text-gray-900">{person.label}:</span>
                                            <span className={`ml-2 flex-1 ${person.fit ? 'text-green-700 font-medium' : 'text-amber-600'}`}>
                                                {person.fit ? '✅ Matches Profile' : `⚠️ ${person.note}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {!recipe.reheatFriendly && (
                                    <div className="mt-3 flex items-start text-amber-700 text-xs bg-amber-50 p-2 rounded">
                                        <span className="mr-1">⚠️</span>
                                        Note: Best eaten fresh.
                                    </div>
                                )}
                            </div>

                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                                    Ingredients
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {recipe.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center p-2 rounded bg-gray-50 border border-gray-100 text-sm text-gray-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2 flex-shrink-0"></span>
                                            {ing}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                                    Instructions
                                </h3>
                                <div className="space-y-4">
                                    {recipe.instructions?.map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="flex-shrink-0 font-bold text-teal-600">{i + 1}.</span>
                                            <p className="text-gray-700 text-sm leading-relaxed"><FormatText text={step} /></p>
                                        </div>
                                    )) || <p className="text-gray-400 italic">No instructions available.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    const currentList = JSON.parse(localStorage.getItem('shopping-list') || '[]');
                                    const newItems = recipe.ingredients.map(ing => ({ name: ing, checked: false }));
                                    localStorage.setItem('shopping-list', JSON.stringify([...currentList, ...newItems]));
                                    alert('Added ingredients to Shopping List!');
                                }}
                                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                            >
                                🛒 Add to List
                            </button>
                            <button
                                onClick={() => {
                                    const rating = prompt('Rate this meal (1-5):');
                                    if (rating) {
                                        const notes = prompt('Any notes/tips for next time?');
                                        const history = JSON.parse(localStorage.getItem('meal-history') || '[]');
                                        history.unshift({
                                            date: new Date().toISOString(),
                                            recipeTitle: recipe.title,
                                            rating: parseInt(rating) || 3,
                                            notes: notes || ''
                                        });
                                        localStorage.setItem('meal-history', JSON.stringify(history));
                                        alert('Meal logged!');
                                    }
                                }}
                                className="btn bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                            >
                                ✅ Cooked This
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Dismiss this recipe?')) {
                                        const newRecipes = recipes.filter(r => r.id !== recipe.id);
                                        setRecipes(newRecipes);
                                        localStorage.setItem('recipes', JSON.stringify(newRecipes));
                                    }
                                }}
                                className="btn text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormatText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}

function userEmoji(type: string) {
    switch (type) {
        case 'wife': return '👩';
        case 'son': return '👦';
        case 'dad': return '👨';
        default: return '👤';
    }
}
