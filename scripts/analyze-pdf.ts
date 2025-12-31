
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs/promises';
// @ts-ignore
const pdf = require('pdf-parse');

// Initialize Vertex AI
const PROJECT_ID = 'smart-diet-app-482519';
const LOCATION = 'us-central1';
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const modelName = 'gemini-2.5-flash';

async function analyzePdf() {
    const pdfPath = '/Users/noelkenehan/AntigravityProjects/Diet_app/B09KK11MLV.pdf';

    try {
        console.log('Reading PDF locally...');
        const { PDFParse } = require('pdf-parse');

        const pdfBuffer = await fs.readFile(pdfPath);
        const parser = new PDFParse({ data: pdfBuffer });
        const data = await parser.getText();
        const fullText = data.text;

        console.log(`Extracted ${fullText.length} characters of text.`);

        console.log('Sending text payload to Gemini...');
        const model = vertexAI.getGenerativeModel({ model: modelName });

        // Truncate if ABSOLUTELY necessary, but 2.5 Flash has a huge context window (1M tokens).
        // 3.6MB PDF text should fit easily.

        const prompt = `
            You are an expert nutritionist analyzing the text of Dr. William Davis' "Super Gut".
            
            Text Content (Excerpt):
            ${fullText.substring(0, 900000)} 
            
            Task:
            1. **Core Dietary Rules**: Extract specific rules (e.g., 15g net carb limit, allowed/banned foods list).
            2. **Recipes**: Find and structure 5-10 key recipes (e.g., SIBO Yogurt, specific breads).
            3. **Tips**: Extract practical tips for implementation.
            
            Output strictly valid JSON:
            {
                "rules": ["rule 1", ...],
                "banned_ingredients": ["item 1", ...],
                "allowed_ingredients": ["item 1", ...],
                "recipes": [
                    { "title": "Name", "ingredients": [], "instructions": [], "notes": "Why strictly for Super Gut?" }
                ],
                "tips": ["tip 1", ...]
            }
        `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const response = await result.response;
        const text = response.candidates?.[0].content.parts[0].text;

        if (text) {
            const cleanText = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            await fs.writeFile('src/lib/super_gut_data.json', cleanText);
            console.log('Success! Saved to src/lib/super_gut_data.json');
        } else {
            console.error('No response generated.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

analyzePdf();
