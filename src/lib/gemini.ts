'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ingredient, Recipe } from './types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function identifyIngredientsAction(formData: FormData): Promise<Ingredient[]> {
    const file = formData.get('image') as File;
    if (!file) throw new Error('No image provided');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
    Analyze this image of a fridge or pantry. 
    List all visible food ingredients. 
    Return ONLY a JSON array of objects with the following structure:
    [{ "name": "item name", "quantity": "estimated quantity", "category": "category name" }]
    Do not add any markdown formatting like \`\`\`json.
  `;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.type } },
        ]);
        const response = await result.response;
        const text = response.text();
        // Clean up potential markdown code blocks if the model ignores the instruction
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Ingredient[];
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        throw new Error('Failed to analyze image');
    }
}

export async function generateMealPlanAction(inventory: Ingredient[]): Promise<Recipe[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const inventoryList = inventory.map(i => `${i.name} (${i.quantity})`).join(', ');

    const prompt = `
    You are a meal planner for a family with specific dietary needs.
    Inventory: ${inventoryList}

    Profiles:
    1. Wife: Low carb, Low sugar (Neuropathy/Pre-diabetes).
    2. Son (Teen): High calorie, filling.
    3. Husband (User): Weight loss focused.
    4. General: No microwave available. Reheating must be oven/stove friendly or quick execution.

    Task:
    Suggest 3 distinct dinner recipes that can be made primarily from the inventory (assume basic staples like oil, spices, flour availability).
    Each recipe must accommodate the profiles (e.g. by having modular carbs or naturally low carb base).
    For each recipe, explicitly verify if it meets the stored needs.

    Return ONLY a JSON array of objects:
    [{
      "id": "unique_string",
      "title": "Recipe Title",
      "description": "Short description",
      "ingredients": ["list", "of", "ingredients"],
      "instructions": ["step 1", "step 2"],
      "tags": ["Low Carb", "Hearty", etc],
      "suitability": { "wife": true/false, "son": true/false, "dad": true/false },
      "reheatFriendly": true/false
    }]
    Do not add markdown formatting.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Recipe[];
    } catch (error) {
        console.error('Gemini Planning Error:', error);
        return []; // Return empty on error
    }
}
