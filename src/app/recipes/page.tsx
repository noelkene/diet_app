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
                    <div key={recipe.id} className="card border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-gray-800">{recipe.title}</h2>
                            <div className="flex gap-2">
                                {recipe.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 mb-4">{recipe.description}</p>

                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                            <p className="font-semibold mb-1">Detailed Fit:</p>
                            <ul className="space-y-1">
                                <li className={recipe.suitability.wife ? 'text-green-600' : 'text-amber-600'}>
                                    {userEmoji('wife')} Wife: {recipe.suitability.wife ? 'Low Carb/Sugar Friendly' : 'Check sugar content'}
                                </li>
                                <li className={recipe.suitability.son ? 'text-green-600' : 'text-amber-600'}>
                                    {userEmoji('son')} Son: {recipe.suitability.son ? 'Filling' : 'May need extra side'}
                                </li>
                                <li className={recipe.suitability.dad ? 'text-green-600' : 'text-amber-600'}>
                                    {userEmoji('dad')} You: {recipe.suitability.dad ? 'Diet Friendly' : 'Watch portion'}
                                </li>
                            </ul>
                            {!recipe.reheatFriendly && (
                                <p className="text-red-500 mt-2 text-xs font-bold">⚠️ Best eaten fresh (reheat careful)</p>
                            )}
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <h3 className="font-medium mb-2">Ingredients:</h3>
                            <div className="flex flex-wrap gap-2">
                                {recipe.ingredients.map((ing, i) => (
                                    <span key={i} className="text-sm bg-white border border-gray-200 px-2 py-1 rounded">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => {
                                    const currentList = JSON.parse(localStorage.getItem('shopping-list') || '[]');
                                    const newItems = recipe.ingredients.map(ing => ({ name: ing, checked: false }));
                                    localStorage.setItem('shopping-list', JSON.stringify([...currentList, ...newItems]));
                                    alert('Added ingredients to Shopping List!');
                                }}
                                className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
                            >
                                + Shopping List
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
                                className="btn bg-teal-50 text-teal-600 hover:bg-teal-100 text-sm"
                            >
                                ✅ Cooked This
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
