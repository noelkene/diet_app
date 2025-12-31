'use client';

import { useState, useEffect } from 'react';
import { loadData, saveData } from '../actions';
import { Ingredient, Recipe, ScheduledMeal } from '@/lib/types';
import { generateMealPlanAction, parseRecipeAction, parseRecipeImageAction } from '@/lib/gemini';

export default function RecipesPage() {
    const [inventory, setInventory] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Import State
    const [importMode, setImportMode] = useState<'text' | 'image'>('text');
    const [importText, setImportText] = useState('');
    const [importImage, setImportImage] = useState<File | null>(null);

    // Scheduling State
    const [schedulingRecipeId, setSchedulingRecipeId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        // Load initial data
        Promise.all([
            loadData<Ingredient[]>('inventory.json', []),
            loadData<Recipe[]>('recipes.json', []),
            loadData<string[]>('rejected.json', [])
        ]).then(([inv, rec, rej]) => {
            setInventory(inv);
            setRecipes(rec);
            setRejected(rej);
        });
    }, []);

    const generateRecipes = async () => {
        if (inventory.length === 0) {
            alert('Please add items to your inventory first!');
            return;
        }
        setIsLoading(true);
        try {
            const newRecipes = await generateMealPlanAction(inventory, undefined, rejected);
            setRecipes(newRecipes);
            await saveData('recipes.json', newRecipes);
        } catch (e) {
            console.error(e);
            alert('Failed to generate recipes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        setIsLoading(true);
        setIsImporting(false);
        try {
            let recipe: Recipe | null = null;

            if (importMode === 'text') {
                if (!importText.trim()) return;
                recipe = await parseRecipeAction(importText);
            } else if (importMode === 'image') {
                if (!importImage) return;
                const formData = new FormData();
                formData.append('image', importImage);
                recipe = await parseRecipeImageAction(formData);
            }

            if (recipe) {
                const updated = [recipe, ...recipes];
                setRecipes(updated);
                await saveData('recipes.json', updated);
                setImportText('');
                setImportImage(null);
                alert('Recipe imported successfully!');
            } else {
                alert('Failed to extract recipe. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Error during import');

        } finally {
            setIsLoading(false);
        }
    };

    const addToShoppingList = async (ingredients: string[], silent = false) => {
        try {
            const currentList = await loadData<any[]>('shopping-list.json', []);
            // Simple check to avoid exact dupes if unchecked
            const existingNames = new Set(currentList.map(i => i.name));
            const newItems = ingredients
                .filter(name => !existingNames.has(name))
                .map(ing => ({ name: ing, checked: false }));

            if (newItems.length === 0) {
                if (!silent) alert('Ingredients already in list!');
                return;
            }

            const updated = [...currentList, ...newItems];
            await saveData('shopping-list.json', updated);
            if (!silent) alert(`Added ${newItems.length} items to Shopping List!`);
        } catch (e) {
            console.error(e);
            if (!silent) alert('Failed to update shopping list');
        }
    };

    const logMeal = async (recipeTitle: string) => {
        const rating = prompt('Rate this meal (1-5):');
        if (rating) {
            const notes = prompt('Any notes/tips for next time?');
            try {
                const history = await loadData<any[]>('history.json', []);
                history.unshift({
                    date: new Date().toISOString(),
                    recipeTitle,
                    rating: parseInt(rating) || 3,
                    notes: notes || ''
                });
                await saveData('history.json', history);
                alert('Meal logged! Check the History page.');
            } catch (e) {
                console.error(e);
            }
        }
    };

    const scheduleMeal = async (recipe: Recipe) => {
        if (!selectedDate) return;
        try {
            const schedule = await loadData<ScheduledMeal[]>('schedule.json', []);

            // Check for conflict
            const existing = schedule.find(s => s.date === selectedDate);
            if (existing) {
                alert(`There is already a meal scheduled for ${selectedDate}: "${existing.recipeTitle}". \nPlease remove it from the Home page first.`);
                return;
            }

            const newSchedule = [...schedule, {
                date: selectedDate,
                recipeId: recipe.id,
                recipeTitle: recipe.title
            }];

            await saveData('schedule.json', newSchedule);
            setSchedulingRecipeId(null);

            // Auto-add to shopping list
            await addToShoppingList(recipe.ingredients, true); // Pass true to suppress the extra alert inside, or just handle manually here? 
            // Better: update addToShoppingList to return success boolean and handle alerting here.

            alert(`Scheduled for ${selectedDate}! Ingredients added to Shopping List.`);
        } catch (e) {
            console.error(e);
            alert('Failed to schedule meal');
        }
    };

    const dismissRecipe = async (recipeId: string) => {
        if (confirm('Dismiss this recipe?')) {
            const newRecipes = recipes.filter(r => r.id !== recipeId);
            setRecipes(newRecipes);
            await saveData('recipes.json', newRecipes);
        }
    };

    const blockRecipe = async (recipe: Recipe) => {
        if (confirm(`Block similar recipes to "${recipe.title}" in the future?`)) {
            const newRejected = [...rejected, recipe.title];
            setRejected(newRejected);
            await saveData('rejected.json', newRejected);

            // Also dismiss it
            const newRecipes = recipes.filter(r => r.id !== recipe.id);
            setRecipes(newRecipes);
            await saveData('recipes.json', newRecipes);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Meal Suggestions</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImporting(!isImporting)}
                        className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        📝 Import Recipe
                    </button>
                    <button
                        onClick={generateRecipes}
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Thinking...' : '✨ Generate Ideas'}
                    </button>
                </div>
            </div>

            {isImporting && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Import Recipe</h3>

                    <div className="flex gap-4 mb-4 border-b border-gray-200">
                        <button
                            onClick={() => setImportMode('text')}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${importMode === 'text' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Text / URL
                        </button>
                        <button
                            onClick={() => setImportMode('image')}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${importMode === 'image' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            📸 From Photo
                        </button>
                    </div>

                    {importMode === 'text' ? (
                        <>
                            <p className="text-sm text-gray-500 mb-2">Paste a recipe URL or full text below:</p>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="w-full h-32 p-3 border rounded-md mb-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="https://example.com/recipe... or Paste text here..."
                            ></textarea>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-2">Upload a photo of a cookbook, card, or screen:</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImportImage(e.target.files?.[0] || null)}
                                className="w-full p-2 border rounded-md mb-4 text-sm bg-gray-50"
                            />
                        </>
                    )}

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsImporting(false)} className="btn text-gray-500">Cancel</button>
                        <button onClick={handleImport} className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Analyzing...' : 'Analyze & Save'}
                        </button>
                    </div>
                </div>
            )}

            {recipes.length === 0 && !isLoading && !isImporting && (
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


                            {/* Super Gut & Nutrition Info */}
                            {(recipe.netCarbs !== undefined || recipe.superGutBenefit || recipe.calories) && (
                                <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100 text-sm">
                                    {recipe.superGutBenefit && (
                                        <div className="mb-3">
                                            <span className="font-bold text-teal-800">🦠 Super Gut Benefit: </span>
                                            <span className="text-teal-700 block mt-1 leading-relaxed">{recipe.superGutBenefit}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-4 pt-2 border-t border-teal-100 mt-2">
                                        {recipe.netCarbs !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-gray-700">Net Carbs:</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${recipe.netCarbs <= 15 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {recipe.netCarbs}g
                                                </span>
                                            </div>
                                        )}
                                        {recipe.calories && (
                                            <div className="flex gap-4 text-xs text-gray-600 items-center">
                                                <span title="Wife">👩 <b>{recipe.calories.wife}</b> kcal</span>
                                                <span title="Son">👦 <b>{recipe.calories.son}</b> kcal</span>
                                                <span title="Dad">👨 <b>{recipe.calories.dad}</b> kcal</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                onClick={() => addToShoppingList(recipe.ingredients)}
                                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                            >
                                🛒 Add to List
                            </button>
                            <button
                                onClick={() => logMeal(recipe.title)}
                                className="btn bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                            >
                                ✅ Cooked This
                            </button>

                            {/* Scheduling UI */}
                            <div className="relative">
                                {schedulingRecipeId === recipe.id ? (
                                    <div className="flex items-center gap-2 bg-white border border-teal-200 rounded p-1 absolute bottom-full mb-2 left-0 shadow-lg z-10 w-64">
                                        <input
                                            type="date"
                                            className="border rounded px-2 py-1 text-sm flex-grow"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                        <button
                                            onClick={() => scheduleMeal(recipe)}
                                            className="bg-teal-600 text-white text-xs px-2 py-1 rounded"
                                        >
                                            Save
                                        </button>
                                        <button onClick={() => setSchedulingRecipeId(null)} className="text-gray-400 hover:text-gray-600 px-1">✕</button>
                                    </div>
                                ) : null}
                                <button
                                    onClick={() => {
                                        setSchedulingRecipeId(recipe.id);
                                        // Default to tomorrow
                                        const tmrw = new Date();
                                        tmrw.setDate(tmrw.getDate() + 1);
                                        setSelectedDate(tmrw.toISOString().split('T')[0]);
                                    }}
                                    className="btn bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm"
                                >
                                    📅 Schedule
                                </button>
                            </div>

                            <div className="ml-auto flex gap-2">
                                <button
                                    onClick={() => blockRecipe(recipe)}
                                    className="btn text-gray-400 hover:text-red-700 hover:bg-red-50"
                                    title="Never suggest this again"
                                >
                                    🚫 Block
                                </button>
                                <button
                                    onClick={() => dismissRecipe(recipe.id)}
                                    className="btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    Dismiss
                                </button>
                            </div>
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
