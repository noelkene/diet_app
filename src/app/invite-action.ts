'use server';

import { inviteUserToHousehold } from '@/lib/auth-helpers';

export async function inviteAction(email: string) {
    try {
        await inviteUserToHousehold(email);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to invite user' };
    }
}
