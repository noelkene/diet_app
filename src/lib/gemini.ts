'use server';

import { VertexAI } from '@google-cloud/vertexai';
import { Ingredient, Recipe } from './types';

// Initialize Vertex AI
// We assume default credentials (gcloud auth login) work locally and in Cloud Run.
// Project ID from env
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is missing');
}
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

export async function generateMealPlanAction(inventory: Ingredient[], profilesStr?: string, rejectedRecipes: string[] = []): Promise<Recipe[]> {
    const model = vertexAI.getGenerativeModel({ model: modelName });

    const inventoryList = inventory.map(i => `${i.name} (${i.quantity})`).join(', ');

    const profileContext = profilesStr || `
    1. Wife: Low carb, Low sugar (Neuropathy/Pre-diabetes).
    2. Son (Teen): High calorie, filling.
    3. Husband (User): Weight loss focused.
    `;

    const rejectionContext = rejectedRecipes.length > 0
        ? `AVOID recipes similar to or containing these rejected titles: ${rejectedRecipes.join(', ')}.`
        : '';

    const prompt = `
    You are a meal planner for a family with specific dietary needs.
    Inventory: ${inventoryList}

    Profiles:
    ${profileContext}

    General: No microwave available. Reheating must be oven/stove friendly or quick execution.
    ${rejectionContext}

    Task:
    Suggest 10 distinct dinner recipes that can be made primarily from the inventory (assume basic staples like oil, spices, flour availability).
    
    IMPORTANT Constraints:
    1. Variety: Do NOT use the same main ingredient for more than 2 recipes (e.g. max 2 egg dishes, max 2 chicken dishes).
    2. Freshness: Prioritize using fresh produce (vegetables, fruit) from the inventory over pantry staples to prevent spoilage.
    3. Profiles: Each recipe must accommodate the profiles (e.g. by having modular carbs or naturally low carb base).

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
        "suitability": { "wife": true, "son": true, "dad": true },
        "reheatFriendly": true
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

export async function categorizeShoppingListAction(items: string[]): Promise<{ category: string, items: string[] }[]> {
    if (items.length === 0) return [];

    const model = vertexAI.getGenerativeModel({ model: modelName });
    const prompt = `
    Organize this shopping list into typical grocery store categories (aisles).
    Items: ${items.join(', ')}

    Return ONLY a JSON array of objects:
    [{ "category": "Category Name", "items": ["item1", "item2"] }]
    
    Categories examples: Produce, Meat & Seafood, Dairy & Eggs, Pantry, Frozen, etc.
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
        return JSON.parse(cleanText) as { category: string, items: string[] }[];
    } catch (error) {
        console.error('Vertex AI Categorization Error:', error);
        return [];
    }
}

export async function parseRecipeAction(text: string): Promise<Recipe | null> {
    const model = vertexAI.getGenerativeModel({ model: modelName });

    let contentToAnalyze = text;

    // Check if URL and try to fetch
    if (text.startsWith('http')) {
        try {
            const res = await fetch(text);
            if (res.ok) {
                const html = await res.text();
                // Strip basic tags or take a chunk to avoid huge payload
                // Just taking the body content roughly
                contentToAnalyze = `URL provided: ${text}\nContent: ${html.substring(0, 30000)}`;
            } else {
                contentToAnalyze = `URL provided: ${text} (Fetch failed: ${res.status}). Use the URL structure to infer recipe if possible, or return null.`;
            }
        } catch (e) {
            console.error('Fetch failed', e);
            contentToAnalyze = `URL provided: ${text} (Fetch error).`;
        }
    }

    const prompt = `
    Extract a structured recipe from the following text or HTML content.
    Content: "${contentToAnalyze.substring(0, 30000)}"

    Task:
    1. Extract title, ingredients, instructions, and tags.
    2. Analyze suitability for: Wife (Low Carb), Son (Note if good), Dad (Weight Loss).
    3. Generate a short description.

    Return ONLY a JSON object:
    {
      "id": "imported_${Date.now()}",
      "title": "Recipe Title",
      "description": "Short description",
      "ingredients": ["list", "of", "ingredients"],
      "instructions": ["step 1", "step 2", "step 3"],
      "tags": ["mains", etc],
      "suitability": { "wife": true, "son": true, "dad": true },
      "reheatFriendly": true
    }
    Do not add markdown formatting.
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        const response = await result.response;
        const resText = response.candidates?.[0].content.parts[0].text;
        if (!resText) return null;

        const cleanText = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Recipe;
    } catch (error) {
        console.error('Vertex AI Parse Recipe Error:', error);
        return null;
    }
}

export async function parseRecipeImageAction(formData: FormData): Promise<Recipe | null> {
    const file = formData.get('image') as File;
    if (!file) throw new Error('No image provided');

    const model = vertexAI.getGenerativeModel({ model: modelName });
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
    Extract a structured recipe from this image (e.g. cookbook page, handwritten card).
    
    Task:
    1. Extract title, exact ingredients, and instructions.
    2. Analyze suitability for: Wife (Low Carb), Son (Note if good), Dad (Weight Loss).
    3. Generate a short description.

    Return ONLY a JSON object (Recipe format):
    {
      "id": "imported_img_${Date.now()}",
      "title": "Recipe Title",
      "description": "Short description",
      "ingredients": ["list", "of", "ingredients"],
      "instructions": ["step 1", "step 2", "step 3"],
      "tags": ["imported", "mains"],
      "suitability": { "wife": true, "son": true, "dad": true },
      "reheatFriendly": true
    }
    Do not add markdown formatting.
    `;

    try {
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: file.type, data: base64Data } }
                ]
            }]
        });
        const response = await result.response;
        const resText = response.candidates?.[0].content.parts[0].text;
        if (!resText) return null;

        const cleanText = resText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as Recipe;
    } catch (error) {
        console.error('Vertex AI Parse Image Error:', error);
        return null;
    }
}
