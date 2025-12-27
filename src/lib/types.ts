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
    reheatFriendly: boolean;
}

export interface ShoppingItem {
    name: string;
    checked: boolean;
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

