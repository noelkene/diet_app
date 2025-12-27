'use server';

import { Storage } from '@google-cloud/storage';
import { getHouseholdIdForCurrentUser } from '@/lib/auth-helpers';

// Initialize GCS
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is missing');
}
const storage = new Storage({ projectId: PROJECT_ID });
const bucketName = `diet-app-data-${PROJECT_ID}`;
const bucket = storage.bucket(bucketName);

async function getHouseholdPath(filename: string): Promise<string> {
    try {
        const householdId = await getHouseholdIdForCurrentUser();
        return `${householdId}/${filename}`;
    } catch (e) {
        // Fallback for unauthenticated dev/testing if needed, or rethrow
        // For strict auth, we rethrow.
        console.error('Auth Error:', e);
        throw e;
    }
}

export async function saveData(filename: string, data: any) {
    try {
        const path = await getHouseholdPath(filename);
        const file = bucket.file(path);
        await file.save(JSON.stringify(data, null, 2));
        console.log(`Saved ${path} to GCS`);
    } catch (error) {
        console.error('GCS Save Error:', error);
        throw new Error('Failed to save data');
    }
}

export async function loadData<T>(filename: string, defaultValue: T): Promise<T> {
    try {
        const path = await getHouseholdPath(filename);
        const file = bucket.file(path);
        const [exists] = await file.exists();
        if (!exists) {
            console.log(`File ${path} not found, returning default.`);
            return defaultValue;
        }
        const [content] = await file.download();
        return JSON.parse(content.toString()) as T;
    } catch (error) {
        console.error('GCS Load Error:', error);
        return defaultValue;
    }
}
