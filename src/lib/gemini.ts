'use server';

import { VertexAI } from '@google-cloud/vertexai';
import { Ingredient, Recipe } from './types';

// Initialize Vertex AI
// We assume default credentials (gcloud auth login) work locally and in Cloud Run.
// Project ID is hardcoded based on user logs or can be env var.
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'platinum-banner-303105';
const LOCATION = 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const modelName = 'gemini-2.5-flash';

export async function identifyIngredientsAction(formData: FormData): Promise<Ingredient[]> {
    const files = formData.getAll('image') as File[];
    if (!files || files.length === 0) throw new Error('No images provided');

    const model = vertexAI.getGenerativeModel({ model: modelName });

    // Process all images in a SINGLE prompt to allow the model to deduplicate
    // if possible, but the API handles "parts" well. 
    // However, for best deduplication, sending all images in one request is ideal if size permits.
    // Vertex AI supports multiple images in one request.

    try {
        const parts = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            return { inlineData: { mimeType: file.type, data: base64Data } };
        }));

        const prompt = `
            Analyze these images of a fridge/pantry. Some images may overlap (e.g. different angles of the same shelf).
            
            Task:
            1. Identify all unique food ingredients.
            2. If you see the same item in multiple images, count it only once (deduplicate).
            3. Ignore non-food items.
            4. If an item is unclear, do not list it.

            Return ONLY a JSON array of objects:
            [{ "name": "item name", "quantity": "estimated total quantity", "category": "category name" }]
            Do not add markdown formatting.
        `;

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }, ...parts]
            }]
        });

        const response = await result.response;
        const text = response.candidates?.[0].content.parts[0].text;
        if (!text) return [];

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Ingredient[];
    } catch (error) {
        console.error('Vertex AI Vision Error:', error);
        throw new Error('Failed to analyze images');
    }
}

export async function generateMealPlanAction(inventory: Ingredient[], profilesStr?: string): Promise<Recipe[]> {
    const model = vertexAI.getGenerativeModel({ model: modelName });

    const inventoryList = inventory.map(i => `${i.name} (${i.quantity})`).join(', ');

    // Use provided profiles or default if not set
    const profileContext = profilesStr || `
    1. Wife: Low carb, Low sugar (Neuropathy/Pre-diabetes).
    2. Son (Teen): High calorie, filling.
    3. Husband (User): Weight loss focused.
    `;

    const prompt = `
    You are a meal planner for a family with specific dietary needs.
    Inventory: ${inventoryList}

    Profiles:
    ${profileContext}
    
    General: No microwave available. Reheating must be oven/stove friendly or quick execution.

    Task:
    Suggest 10 distinct dinner recipes that can be made primarily from the inventory (assume basic staples like oil, spices, flour availability).
    Each recipe must accommodate the profiles (e.g. by having modular carbs or naturally low carb base).
    For each recipe, explicitly verify if it meets the stored needs.
    Include step-by-step cooking instructions.

    Return ONLY a JSON array of objects:
    [{
      "id": "unique_string",
      "title": "Recipe Title",
      "description": "Short description",
      "ingredients": ["list", "of", "ingredients"],
      "instructions": ["step 1", "step 2", "step 3"],
      "tags": ["Low Carb", "Hearty", etc],
      "suitability": { "wife": true/false, "son": true/false, "dad": true/false },
      "reheatFriendly": true/false
    }]
    Do not add markdown formatting.
  `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        const response = await result.response;
        const text = response.candidates?.[0].content.parts[0].text;
        if (!text) return [];

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Recipe[];
    } catch (error) {
        console.error('Vertex AI Planning Error:', error);
        return [];
    }
}
