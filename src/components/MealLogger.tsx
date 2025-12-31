'use client';

import { useState } from 'react';
import { MealType, DEFAULT_PROFILES, UserProfileKey } from '@/lib/types';
import { analyzeMealAction } from '@/lib/gemini';

interface MealLoggerProps {
    slot: MealType;
    date: string;
    onLog: (data: any) => void;
}

export default function MealLogger({ slot, date, onLog }: MealLoggerProps) {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<{ netCarbs: number; compliant: boolean; notes: string } | null>(null);
    const [attendees, setAttendees] = useState<UserProfileKey[]>(['dad']); // Default to self

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setAnalysis(null); // Reset analysis on new image
        }
    };

    const toggleAttendee = (id: UserProfileKey) => {
        if (attendees.includes(id)) {
            setAttendees(attendees.filter(a => a !== id));
        } else {
            setAttendees([...attendees, id]);
        }
    };

    const analyze = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('image', image);
            const result = await analyzeMealAction(formData);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert('Failed to analyze meal');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        onLog({
            slot,
            date,
            attendees,
            imageUrl: preview,
            analysis
        });
        // Reset or close? Usually handled by parent
        setImage(null);
        setPreview(null);
        setAnalysis(null);
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 capitalize mb-2">{slot}</h3>

            {!image ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-3xl mb-1">📷</span>
                    <span className="text-sm text-gray-500">Snap a photo</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </label>
            ) : (
                <div className="space-y-3">
                    <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img src={preview!} alt="Meal" className="w-full h-full object-cover" />
                        <button
                            onClick={() => { setImage(null); setPreview(null); }}
                            className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-xs shadow-sm hover:bg-white"
                        >
                            ✕
                        </button>
                    </div>

                    {!analysis && (
                        <button
                            onClick={analyze}
                            disabled={isAnalyzing}
                            className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                        >
                            {isAnalyzing ? 'Analyzing Super Gut...' : 'Analyze Carbs'}
                        </button>
                    )}

                    {analysis && (
                        <div className={`p-3 rounded-lg border text-sm ${analysis.compliant ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold">Net Carbs: {analysis.netCarbs}g</span>
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/50">
                                    {analysis.compliant ? 'Compliant' : 'Over Limit'}
                                </span>
                            </div>
                            <p className="opacity-90">{analysis.notes}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Who ate this?</p>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_PROFILES.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleAttendee(p.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-all ${attendees.includes(p.id)
                                            ? 'bg-teal-100 border-teal-300 text-teal-800 font-semibold'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {p.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave} className="w-full py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900">
                        Log Meal
                    </button>
                </div>
            )}
        </div>
    );
}
