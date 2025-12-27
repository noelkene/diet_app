'use client';

import { useState, useEffect } from 'react';
import { loadData, saveData } from '../actions';
import { UserProfile, DEFAULT_PROFILES } from '@/lib/types';

export default function SettingsPage() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const updateProfile = (index: number, field: keyof UserProfile, value: string) => {
        const newProfiles = [...profiles];
        // @ts-expect-error simple key access
        newProfiles[index][field] = value;
        setProfiles(newProfiles);
    };

    return (
        <div className="space-y-6">
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
