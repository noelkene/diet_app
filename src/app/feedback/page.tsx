'use client';

import { useState } from 'react';
import { saveData, loadData } from '../actions';
import { useSession } from 'next-auth/react';

export default function FeedbackPage() {
    const { data: session } = useSession();
    const [type, setType] = useState('Suggestion');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            // NOTE: Ideally this would append to a central log. 
            // For now, we save to the user's isolated storage or a shared 'feedback' naming convention
            // BUT since we forced isolation in actions.ts, we can't write to a global admin file easily 
            // without a dedicated action.
            // WORKAROUND: We will assume there's a dedicated Feedback Action we need to create,
            // OR we accept that for this demo, feedback is stored in the user's folder as 'my-feedback.json'.

            const existing = await loadData<any[]>('feedback.json', []);
            const newEntry = {
                id: Date.now(),
                user: session?.user?.email || 'Anonymous',
                type,
                message,
                date: new Date().toISOString()
            };
            await saveData('feedback.json', [newEntry, ...existing]);

            alert('Feedback sent! Thank you.');
            setMessage('');
        } catch (error) {
            console.error(error);
            alert('Failed to send feedback.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Send Feedback</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
                    <div className="flex gap-4">
                        {['Suggestion', 'Bug Report', 'Other'].map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value={t}
                                    checked={type === t}
                                    onChange={(e) => setType(e.target.value)}
                                    className="text-teal-600 focus:ring-teal-500"
                                />
                                {t}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="Tell us what you think..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn btn-primary py-3"
                >
                    {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
}
