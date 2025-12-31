export interface Ingredient {
    name: string;
    quantity?: string;
    category?: string; // e.g., 'Dairy', 'Vegetable'
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    ingredients: string[]; // List of strings for simplicity in display
    instructions: string[];
    tags: string[]; // 'Low Carb', 'High Protein', etc.
    suitability: {
        wife: boolean;
        son: boolean;
        dad: boolean;
    };
    calories?: {
        wife: number;
        son: number;
        dad: number;
    };
    netCarbs?: number; // Estimated per serving
    superGutBenefit?: string; // Why is this good for the gut?
    reheatFriendly: boolean;
}

export interface ShoppingItem {
    name: string;
    checked: boolean;
}

export interface ScheduledMeal {
    date: string; // YYYY-MM-DD
    recipeId: string;
    recipeTitle: string;
}

export type UserProfileKey = 'wife' | 'son' | 'dad';

export interface UserProfile {
    id: UserProfileKey;
    name: string;
    dietaryNeeds: string;
}

export const DEFAULT_PROFILES: UserProfile[] = [
    { id: 'wife', name: 'Vera (Wife)', dietaryNeeds: 'Low carb, Low sugar (Neuropathy/Pre-diabetes)' },
    { id: 'son', name: 'Hiro (Son)', dietaryNeeds: 'High calorie, filling (Teenager)' },
    { id: 'dad', name: 'Noel (Me)', dietaryNeeds: 'Weight loss focused' }
];

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface SuperGutAnalysis {
    netCarbs: number;
    compliant: boolean; // <= 15g net carbs
    notes: string;
}

export interface MealLog {
    id: string;
    date: string; // YYYY-MM-DD
    slot: MealType;
    recipeTitle?: string; // Optional if ad-hoc
    imageUrl?: string;
    description?: string; // "Leftover steak"
    attendees: UserProfileKey[]; // Who ate this?
    analysis?: SuperGutAnalysis;
}

// Updated from simple interface to support slots
export interface ScheduledMeal {
    date: string;
    slot: MealType;
    recipeId: string;
    recipeTitle: string;
    attendees?: UserProfileKey[]; // Who is this planned for?
}

