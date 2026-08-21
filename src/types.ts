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
  dietLunch?: { protein?: string; vegetable?: string; starch?: string; dessert?: string; dietRecipe?: string; servings?: number };
  dietDinner?: { protein?: string; vegetable?: string; starch?: string; dessert?: string; dietRecipe?: string; servings?: number };
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
  defaultRecipesTab?: 'recipes' | 'regime';
  defaultPlanningTab?: 'recipes' | 'regime';
  dietServingsDefault?: number;
  dietLunchCustomServings?: number;
  dietLunchCustomDays?: number[];
  dietDinnerCustomServings?: number;
  dietDinnerCustomDays?: number[];
}

export interface FoodPortion {
  id: string;
  name: string;
  unit: string;
  category: string;
  amount: number;
}

export type DietCategory = 'Protéines' | 'Légumes' | 'Féculents' | 'Desserts';

export interface DietItem {
  id: string;
  name: string;
  category: DietCategory;
  weight: string;
}

export interface DietRecipeItem {
  name: string;
  weight: string;
  category?: string;
}

export interface DietRecipe {
  id: string;
  name: string;
  ingredients: string;
  servings: number;
  items?: DietRecipeItem[];
}
