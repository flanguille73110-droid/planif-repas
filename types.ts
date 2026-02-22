
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
  category?: string;
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

export interface MealSlot {
  recipe1?: string; // recipe ID
  recipe2?: string; // recipe ID
}

export interface MealPlanDay {
  lunch?: MealSlot;
  dinner?: MealSlot;
  viennoiseries?: string[]; // recipe IDs
  sauces?: string[];        // recipe IDs
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  category?: string;
}

export type AppTab = 'recipes' | 'search' | 'planning' | 'recurring' | 'reserve' | 'shopping' | 'settings';

export interface UserSettings {
  userName: string;
  dietaryRestrictions: string[];
  foodPortions: FoodPortion[];
  foodCategories?: string[];
  servingsDefault: number;
  language: string;
}
