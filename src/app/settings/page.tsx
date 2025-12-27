'use client';

import { useState, useEffect } from 'react';
import { loadData, saveData } from '../actions';
import { UserProfile, DEFAULT_PROFILES } from '@/lib/types';

import { inviteAction } from '../invite-action';

export default function SettingsPage() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        loadData<UserProfile[]>('profiles.json', [])
            .then(data => {
                if (data && data.length > 0) {
                    setProfiles(data);
                } else {
                    setProfiles(DEFAULT_PROFILES);
                }
                setIsLoading(false);
            })
            .catch(e => {
                console.error(e);
                setIsLoading(false);
            });
    }, []);

    const saveProfiles = async () => {
        setIsLoading(true);
        await saveData('profiles.json', profiles);
        setIsLoading(false);
        alert('Profiles saved! Future recipe suggestions will use these settings.');
    };

    const handleInvite = async () => {
        if (!inviteEmail.includes('@')) return alert('Invalid email');
        const res = await inviteAction(inviteEmail);
        if (res.success) {
            alert(`Added ${inviteEmail} to your household permissions!\n\nNow opening your email client to notify them...`);

            const subject = encodeURIComponent("Join my Smart Diet App Household");
            const body = encodeURIComponent(`Hey,\n\nI've added you to my household on the Smart Diet App.\n\nPlease log in here to see our recipes and shopping list:\n${window.location.origin}\n\n(Make sure to sign in with this email address)`);

            window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;

            setInviteEmail('');
        } else {
            alert('Failed to invite user.');
        }
    };

    const updateProfile = (index: number, field: keyof UserProfile, value: string) => {
        const newProfiles = [...profiles];
        // @ts-expect-error simple key access
        newProfiles[index][field] = value;
        setProfiles(newProfiles);
    };

    return (
        <div className="space-y-8">
            {/* Invite Section */}
            <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
                <h2 className="text-xl font-bold mb-4 text-teal-800">Manage Household</h2>
                <p className="text-sm text-teal-600 mb-4">Invite family members to share your inventory, recipes, and shopping list. They must sign in with their Google account.</p>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="family.member@gmail.com"
                        className="flex-1 p-2 border rounded-md"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button onClick={handleInvite} className="btn bg-teal-600 text-white hover:bg-teal-700">Invite</button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Family Profiles</h1>
                <button onClick={saveProfiles} className="btn btn-primary">Save Changes</button>
            </div>

            <p className="text-gray-600">Adjust the dietary goals for each family member. The AI will use these to customize meal suggestions.</p>

            <div className="grid gap-6">
                {profiles.map((profile, idx) => (
                    <div key={profile.id} className="card">
                        <h3 className="text-lg font-semibold mb-3">{profile.id === 'dad' ? 'You' : profile.name.split(' ')[0]}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    value={profile.name}
                                    onChange={(e) => updateProfile(idx, 'name', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Needs / Goals</label>
                                <textarea
                                    value={profile.dietaryNeeds}
                                    onChange={(e) => updateProfile(idx, 'dietaryNeeds', e.target.value)}
                                    className="w-full p-2 border rounded h-24"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
