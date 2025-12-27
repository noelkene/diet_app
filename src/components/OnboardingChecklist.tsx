'use client';

import { useState } from 'react';
import Link from 'next/link';

interface OnboardingProps {
    hasInventory: boolean;
    hasSchedule: boolean;
    isDismissed: boolean;
    onDismiss: () => void;
}

export default function OnboardingChecklist({ hasInventory, hasSchedule, isDismissed, onDismiss }: OnboardingProps) {
    if (isDismissed) return null;

    // Calculate progress
    const steps = [
        { id: 'inventory', label: 'Scan your first receipt or item', completed: hasInventory, link: '/inventory/upload', action: 'Upload' },
        { id: 'schedule', label: 'Generate a meal plan', completed: hasSchedule, link: '/recipes', action: 'Plan' },
        { id: 'invite', label: 'Invite a family member', completed: false, link: '/settings', action: 'Invite', manualCheck: true },
    ];

    const [checkedSteps, setCheckedSteps] = useState<string[]>([]);

    const isStepComplete = (step: any) => {
        if (step.manualCheck) return checkedSteps.includes(step.id);
        return step.completed;
    };

    const toggleCheck = (id: string) => {
        if (checkedSteps.includes(id)) {
            setCheckedSteps(checkedSteps.filter(s => s !== id));
        } else {
            setCheckedSteps([...checkedSteps, id]);
        }
    };

    const allComplete = steps.every(isStepComplete);
    const progress = Math.round((steps.filter(isStepComplete).length / steps.length) * 100);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <button
                onClick={onDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss guide"
            >
                ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                    🏁
                </div>
                <div>
                    <h2 className="font-bold text-gray-800">Get Started with Scantry</h2>
                    <p className="text-sm text-gray-500">Complete these steps to set up your smart kitchen.</p>
                </div>
            </div>

            <div className="space-y-3">
                {steps.map(step => {
                    const complete = isStepComplete(step);
                    return (
                        <div key={step.id} className={`flex items-center justify-between p-3 rounded-lg border ${complete ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => step.manualCheck && toggleCheck(step.id)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${complete ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 text-transparent hover:border-teal-400'}`}
                                    disabled={!step.manualCheck}
                                >
                                    ✓
                                </button>
                                <span className={complete ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}>
                                    {step.label}
                                </span>
                            </div>

                            {!complete && (
                                <Link href={step.link} className="text-sm font-semibold text-teal-600 hover:text-teal-800 px-3 py-1 bg-teal-50 rounded-full hover:bg-teal-100 transition-colors">
                                    {step.action} →
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            {allComplete && (
                <div className="mt-4 text-center text-sm text-teal-700 bg-teal-50 p-2 rounded animate-pulse">
                    🎉 You're all set! Enjoy using Scantry.
                </div>
            )}
        </div>
    );
}
