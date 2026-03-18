export interface Recipe {
  id: string;
  title: string;
  servings: number;
  category: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  tags: string[];
  maxServings?: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealPlanDay {
  lunch?: { recipe1?: string; recipe2?: string };
  dinner?: { recipe1?: string; recipe2?: string };
  viennoiseries?: (string | undefined)[];
  sauces?: (string | undefined)[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
}

export type AppTab = 'recipes' | 'search' | 'planning' | 'recurring' | 'reserve' | 'shopping' | 'settings' | 'notice';

export interface UserSettings {
  userName: string;
  servings: number;
  servingsDefault: number;
  language: string;
  dietaryRestrictions: string[];
  foodCategories: string[];
  foodPortions: FoodPortion[];
  startDay?: number;
  defaultWeek?: 'current' | 'next';
}

export interface FoodPortion {
  id: string;
  name: string;
  unit: string;
  category: string;
  amount: number;
}
