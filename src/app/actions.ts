'use server';

import { Storage } from '@google-cloud/storage';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'platinum-banner-303105';
const BUCKET_NAME = `diet-app-data-${PROJECT_ID}`; // e.g. diet-app-data-platinum-banner-303105
const storage = new Storage({ projectId: PROJECT_ID });

async function getBucket() {
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    if (!exists) {
        try {
            await bucket.create({ location: 'US-CENTRAL1' });
            console.log(`Created bucket ${BUCKET_NAME}`);
        } catch (e) {
            // Ignore if race condition created it
            console.log('Bucket creation check:', e);
        }
    }
    return bucket;
}

export async function loadData<T>(filename: string, defaultValue: T): Promise<T> {
    try {
        const bucket = await getBucket();
        const file = bucket.file(filename);
        const [exists] = await file.exists();

        if (!exists) {
            return defaultValue;
        }

        const [content] = await file.download();
        const json = content.toString();
        return JSON.parse(json) as T;
    } catch (e) {
        console.error(`Error loading ${filename}:`, e);
        return defaultValue;
    }
}

export async function saveData<T>(filename: string, data: T): Promise<boolean> {
    try {
        const bucket = await getBucket();
        const file = bucket.file(filename);
        await file.save(JSON.stringify(data, null, 2), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'no-cache',
            }
        });
        return true;
    } catch (e) {
        console.error(`Error saving ${filename}:`, e);
        throw new Error(`Failed to save ${filename}`);
    }
}
