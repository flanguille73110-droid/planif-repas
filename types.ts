
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

export interface MealSlot {
  starter?: string; // recipe ID
  main?: string;    // recipe ID
  dessert?: string; // recipe ID
}

export interface MealPlanDay {
  lunch?: MealSlot;
  dinner?: MealSlot;
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
  servingsDefault: number;
  language: string;
}
