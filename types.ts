
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface FoodPortion {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  category: string;
  imageUrl?: string;
  tags: string[];
}

export interface MealPlanDay {
  date: string; // ISO string
  lunch?: string; // recipe ID
  dinner?: string; // recipe ID
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  category?: string;
}

export type AppTab = 'recipes' | 'search' | 'planning' | 'recurring' | 'shopping' | 'settings';

export interface UserSettings {
  userName: string;
  dietaryRestrictions: string[];
  foodPortions: FoodPortion[];
  servingsDefault: number;
  language: string;
}
