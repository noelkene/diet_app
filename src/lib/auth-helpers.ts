import { Storage } from '@google-cloud/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) throw new Error('GOOGLE_CLOUD_PROJECT missing');

const storage = new Storage({ projectId: PROJECT_ID });
const bucketName = `diet-app-data-${PROJECT_ID}`;
const bucket = storage.bucket(bucketName);

const ADMIN_FILE = 'admin/users.json';

interface UserRegistry {
    [email: string]: string; // email -> householdId
}

export async function getHouseholdIdForCurrentUser(): Promise<string> {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
        throw new Error('Not authenticated');
    }

    try {
        const file = bucket.file(ADMIN_FILE);
        const [exists] = await file.exists();

        let registry: UserRegistry = {};

        if (exists) {
            const [content] = await file.download();
            registry = JSON.parse(content.toString());
        }

        if (registry[email]) {
            return registry[email];
        }

        // New User -> Create new Household ID
        const newHouseholdId = crypto.randomUUID();
        registry[email] = newHouseholdId;

        await file.save(JSON.stringify(registry, null, 2));

        return newHouseholdId;
    } catch (e) {
        console.error('Error in getHouseholdIdForCurrentUser', e);
        throw new Error('Failed to resolve household');
    }
}

export async function inviteUserToHousehold(targetEmail: string): Promise<void> {
    const session = await getServerSession(authOptions);
    const currentUserEmail = session?.user?.email;

    if (!currentUserEmail) throw new Error('Not authenticated');

    const file = bucket.file(ADMIN_FILE);
    const [exists] = await file.exists();
    if (!exists) throw new Error('System registry missing');

    const [content] = await file.download();
    const registry: UserRegistry = JSON.parse(content.toString());

    const currentHouseholdId = registry[currentUserEmail];
    if (!currentHouseholdId) throw new Error('Current user has no household');

    // Map target user to same household
    // WARNING: This overwrites target invdividual household if they had one.
    // For simplicity in this demo, we assume that is acceptable or user is new.
    registry[targetEmail] = currentHouseholdId;

    await file.save(JSON.stringify(registry, null, 2));
}
