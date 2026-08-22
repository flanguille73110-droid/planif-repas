import { SearchableSelect } from './src/components/SearchableSelect';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion, DietItem, DietCategory, DietRecipe, DietRecipeItem } from './src/types';
import { CATEGORIES, DIETARY_OPTIONS, FOOD_CATEGORIES } from './constants';

// Extend ICONS
const ICONS = {
  Book: () => <span>📖</span>,
  Search: () => <span>🔍</span>,
  Calendar: () => <span>📅</span>,
  Cart: () => <span>🛒</span>,
  Settings: () => <span>⚙️</span>
};

const EXT_ICONS = {
  ...ICONS,
  Recurring: () => <span>🔄</span>,
  Box: () => <span>📦</span>,
  Info: () => <span>ℹ️</span>,
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Grip: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
};

interface PantryGroup {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

const formatTotalTime = (minutes: number) => {
  if (minutes > 59) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')} h ${mins.toString().padStart(2, '0')} min`;
  }
  return `${minutes} min`;
};

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_DIET_ITEMS: DietItem[] = [
  // Protéines (Rouge)
  { id: 'p1', name: 'Blanc de poulet', category: 'Protéines', weight: '150 g' },
  { id: 'p2', name: 'Pavé de saumon', category: 'Protéines', weight: '140 g' },
  { id: 'p3', name: 'Steak haché 5%', category: 'Protéines', weight: '125 g' },
  { id: 'p4', name: 'Œufs entiers', category: 'Protéines', weight: '2 pièces' },
  { id: 'p5', name: 'Thon au naturel', category: 'Protéines', weight: '130 g' },
  { id: 'p6', name: 'Filet de cabillaud / colin', category: 'Protéines', weight: '160 g' },
  { id: 'p7', name: 'Tofu ferme', category: 'Protéines', weight: '150 g' },
  // Légumes (Verte)
  { id: 'l1', name: 'Courgettes', category: 'Légumes', weight: '200 g' },
  { id: 'l2', name: 'Haricots verts', category: 'Légumes', weight: '200 g' },
  { id: 'l3', name: 'Brocolis', category: 'Légumes', weight: '200 g' },
  { id: 'l4', name: 'Tomates', category: 'Légumes', weight: '150 g' },
  { id: 'l5', name: 'Épinards', category: 'Légumes', weight: '200 g' },
  { id: 'l6', name: 'Carottes', category: 'Légumes', weight: '150 g' },
  { id: 'l7', name: 'Poivrons', category: 'Légumes', weight: '150 g' },
  // Féculents (Jaune foncé)
  { id: 'f1', name: 'Riz complet / basmati cuit', category: 'Féculents', weight: '120 g' },
  { id: 'f2', name: 'Pâtes complètes cuites', category: 'Féculents', weight: '120 g' },
  { id: 'f3', name: 'Pommes de terre vapeur', category: 'Féculents', weight: '150 g' },
  { id: 'f4', name: 'Patate douce', category: 'Féculents', weight: '150 g' },
  { id: 'f5', name: 'Quinoa cuit', category: 'Féculents', weight: '120 g' },
  { id: 'f6', name: 'Lentilles cuites', category: 'Féculents', weight: '130 g' },
  { id: 'f7', name: 'Flocons d\'avoine', category: 'Féculents', weight: '40 g' },
  // Desserts (Fruits, yaourts...)
  { id: 'd1', name: 'Pomme', category: 'Desserts', weight: '1 pièce (150 g)' },
  { id: 'd2', name: 'Banane', category: 'Desserts', weight: '1 pièce (120 g)' },
  { id: 'd3', name: 'Yaourt nature', category: 'Desserts', weight: '1 pot (125 g)' },
  { id: 'd4', name: 'Fromage blanc 0%', category: 'Desserts', weight: '100 g' },
  { id: 'd5', name: 'Compote sans sucre', category: 'Desserts', weight: '100 g' },
  { id: 'd6', name: 'Fruits rouges / Fraises', category: 'Desserts', weight: '150 g' },
  { id: 'd7', name: 'Kiwi', category: 'Desserts', weight: '2 pièces' },
];

const DIET_PERSON_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const DAYS_OF_WEEK_CONFIG = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
  { id: 0, label: 'Dimanche' },
];

const getDayOfWeekFromDateOrString = (dateInput: string | Date): number => {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).getDay();
    }
    return new Date(dateInput).getDay();
  }
  return dateInput.getDay();
};

const getDefaultDietServings = (
  dateInput: string | Date,
  mealType: 'lunch' | 'dinner' | 'dietLunch' | 'dietDinner',
  settings?: UserSettings
): number => {
  const dayOfWeek = getDayOfWeekFromDateOrString(dateInput);
  const baseDefault = settings?.dietServingsDefault ?? 2.5;

  const isLunch = mealType === 'lunch' || mealType === 'dietLunch';
  if (isLunch) {
    const customDays = settings?.dietLunchCustomDays ?? [1, 2, 3, 4, 5];
    const customServings = settings?.dietLunchCustomServings ?? 1;
    if (customDays.includes(dayOfWeek)) {
      return customServings;
    }
    return baseDefault;
  } else {
    const customDays = settings?.dietDinnerCustomDays ?? [];
    const customServings = settings?.dietDinnerCustomServings ?? 2.5;
    if (customDays.includes(dayOfWeek)) {
      return customServings;
    }
    return baseDefault;
  }
};

const scaleTextQuantity = (text: string, servings: number, baseServings: number = 2.5): string => {
  if (!text || typeof text !== 'string') return typeof text === 'number' ? String(text) : '';
  if (!baseServings || servings === baseServings) return text;
  const ratio = servings / baseServings;

  return text.replace(/([0-9]+(?:[.,][0-9]+)?)/g, (match) => {
    const num = parseFloat(match.replace(',', '.'));
    if (isNaN(num)) return match;
    const scaled = num * ratio;
    const rounded = Math.round(scaled * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.0', '');
  });
};

const formatScaledWeight = (rawWeight: string, servings: number, baseServings: number = 2.5): string => {
  if (!rawWeight) return '';
  if (servings === baseServings) return rawWeight;
  const ratio = servings / baseServings;

  const match = rawWeight.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
  if (match) {
    const numStr = match[1].replace(',', '.');
    const num = parseFloat(numStr);
    const unit = match[2];
    if (!isNaN(num)) {
      const scaled = num * ratio;
      const rounded = Math.round(scaled * 10) / 10;
      const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.0', '');
      return unit ? `${formatted} ${unit}`.trim() : `${formatted}`;
    }
  }
  return rawWeight;
};

const normalizeDietFoodName = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
};

const getDietFoodStem = (word: string): string => {
  if (word.length > 3) {
    if (word.endsWith('s') || word.endsWith('x')) {
      return word.slice(0, -1);
    }
  }
  return word;
};

const levenshteinDist = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const findSimilarDietFoods = (query: string, allExistingFoods: string[]): string[] => {
  if (!query || !query.trim()) return [];
  const normQuery = normalizeDietFoodName(query);
  const stemQuery = getDietFoodStem(normQuery);
  const queryWords = normQuery.split(/\s+/).filter(w => w.length > 1 && !['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'et', 'en', 'a', 'd'].includes(w));
  const queryStems = queryWords.map(getDietFoodStem);

  const scored: { name: string; score: number }[] = [];
  const seen = new Set<string>();

  allExistingFoods.forEach(foodName => {
    if (!foodName || !foodName.trim()) return;
    const trimmed = foodName.trim();
    const normFood = normalizeDietFoodName(trimmed);
    if (seen.has(normFood)) return;
    seen.add(normFood);

    if (normFood === normQuery) {
      scored.push({ name: trimmed, score: 100 });
      return;
    }

    const stemFood = getDietFoodStem(normFood);
    if (stemFood === stemQuery || normFood === stemQuery || stemFood === normQuery) {
      scored.push({ name: trimmed, score: 95 });
      return;
    }

    let score = 0;

    if (normFood.includes(normQuery) || normQuery.includes(normFood)) {
      score += 60;
    } else if (normFood.includes(stemQuery) || stemFood.includes(stemQuery)) {
      score += 50;
    }

    const foodWords = normFood.split(/\s+/).filter(w => w.length > 1 && !['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'et', 'en', 'a', 'd'].includes(w));
    const foodStems = foodWords.map(getDietFoodStem);

    let matchingWordsCount = 0;
    queryStems.forEach(qs => {
      if (foodStems.some(fs => fs === qs || fs.includes(qs) || qs.includes(fs))) {
        matchingWordsCount++;
      }
    });

    if (matchingWordsCount > 0) {
      score += (matchingWordsCount / Math.max(queryStems.length, 1)) * 40;
    }

    const lenMax = Math.max(normQuery.length, normFood.length);
    if (lenMax <= 20) {
      const dist = levenshteinDist(normQuery, normFood);
      const simRatio = 1 - (dist / lenMax);
      if (simRatio >= 0.55) {
        score += simRatio * 35;
      }
    }

    if (score >= 30) {
      scored.push({ name: trimmed, score });
    }
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map(s => s.name);
};

const resolveDietFoodCategory = (
  foodName: string, 
  directCat?: string, 
  dietItems: DietItem[] = [], 
  foodPortions: FoodPortion[] = []
): DietCategory | 'Autre' => {
  const catCandidate = directCat ? directCat.replace(/^(Régime:\s*|Recettes:\s*)/i, '').trim() : '';
  if (catCandidate && ['Protéines', 'Légumes', 'Féculents', 'Desserts'].includes(catCandidate)) {
    return catCandidate as DietCategory;
  }

  const cleanName = (foodName || '').trim().toLowerCase();
  if (!cleanName) return 'Autre';

  // 1. Exact match in dietItems
  const matchedDiet = dietItems.find(di => di.name.trim().toLowerCase() === cleanName);
  if (matchedDiet && matchedDiet.category) return matchedDiet.category;

  // 2. Partial match in dietItems
  const partialDiet = dietItems.find(di => {
    const dName = di.name.trim().toLowerCase();
    return cleanName.includes(dName) || dName.includes(cleanName);
  });
  if (partialDiet && partialDiet.category) return partialDiet.category;

  // 3. Match in foodPortions / settings
  const matchedPortion = (foodPortions || []).find(fp => fp.name.trim().toLowerCase() === cleanName);
  if (matchedPortion && matchedPortion.category) {
    const pCat = matchedPortion.category.toLowerCase();
    if (/viande|poisson|charcuterie|oeuf|œuf|prot|tofu|boucherie|traiteur/i.test(pCat)) return 'Protéines';
    if (/légume|legume|fruit et|maraîcher/i.test(pCat)) return 'Légumes';
    if (/féculent|feculent|pain|boulangerie|pâte|pate|riz|céréale|cereale/i.test(pCat)) return 'Féculents';
    if (/dessert|yaourt|sucrée|sucre|crèmerie|cremerie|fromage|douceur/i.test(pCat)) return 'Desserts';
  }

  // 4. Keyword heuristics
  if (/poulet|boeuf|bœuf|veau|porc|dinde|jambon|poisson|saumon|thon|cabillaud|colin|oeuf|œuf|tofu|steak|viande|crevette|canard|bacon|saucisse|dinde|lard|protéine|proteine|merlu|lieu|hareng|maquereau|sardine|haché|hache|cordon bleu|nugget|agneau/i.test(cleanName)) return 'Protéines';
  if (/haricot|courgette|tomate|carotte|brocoli|salade|épinard|epinard|poivron|champignon|poireau|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri|betterave|avocat|asperge|poireaux|épinards|epinards|légume|legume|petits pois|artichaut|mâche|mache|roquette|endive|citrouille|potiron|butternut|courge/i.test(cleanName)) return 'Légumes';
  if (/riz|pâte|pate|coquillette|spaghetti|penne|tagliatelle|pomme de terre|patate|quinoa|boulgour|semoule|pain|lentille|pois chiche|avoine|fécule|fecule|blé|ble|maïs|mais|gnocchi|polenta|féculent|feculent|patates|nouille|vermicelle/i.test(cleanName)) return 'Féculents';
  if (/yaourt|fromage blanc|compote|pomme|banane|fruit|dessert|fraise|kiwi|orange|poire|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|crème|creme|flan|chocolat|mousse|gâteau|gateau|tarte|sorbet|glace/i.test(cleanName)) return 'Desserts';

  return 'Autre';
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('recipes');
  
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('culina_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [mealPlan, setMealPlan] = useState<Record<string, MealPlanDay>>(() => {
    const saved = localStorage.getItem('culina_plan_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [showReviewNewFoodsModal, setShowReviewNewFoodsModal] = useState(false);
  const [pendingNewFoodsToReview, setPendingNewFoodsToReview] = useState<{name: string, category?: string, settingsCategory?: string, weight?: string}[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedMatchMode, setSelectedMatchMode] = useState<string>('__NEW__');
  const [reviewedReplacements, setReviewedReplacements] = useState<Record<string, string>>({});
  const [reviewedNewFoods, setReviewedNewFoods] = useState<{name: string, dietCat: string, setCat: string, weight?: string}[]>([]);
  const [reviewedDietItemsToAdd, setReviewedDietItemsToAdd] = useState<{name: string, dietCat: string, weight?: string}[]>([]);
  const [reviewDietCat, setReviewDietCat] = useState<DietCategory>('Légumes');
  const [reviewSetCat, setReviewSetCat] = useState<string>('');
  const [pendingDietRecipes, setPendingDietRecipes] = useState<DietRecipe[]>([]);

  const [dietItems, setDietItems] = useState<DietItem[]>(() => {
    const saved = localStorage.getItem('culina_diet_items_v1');
    if (!saved) return [];
    try {
      const parsed: DietItem[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [pantryGroups, setPantryGroups] = useState<PantryGroup[]>(() => {
    const saved = localStorage.getItem('culina_pantry_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [reserveItems, setReserveItems] = useState<ShoppingListItem[]>(() => {
    const saved = localStorage.getItem('culina_reserve');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    const saved = localStorage.getItem('culina_shopping');
    return saved ? JSON.parse(saved) : [];
  });

  const [sentMeals, setSentMeals] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('culina_sent_meals');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('culina_settings');
    const defaultSettings: UserSettings = {
      userName: 'Utilisateur',
      servings: 4,
      dietaryRestrictions: [],
      foodCategories: FOOD_CATEGORIES,
      foodPortions: [
        { id: '1', name: 'Pomme', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '2', name: 'Banane', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '3', name: 'Carotte', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '4', name: 'Tomate', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '5', name: 'Poulet', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '6', name: 'Bœuf', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '7', name: 'Saumon', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '8', name: 'Colin', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '9', name: 'Jambon', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '10', name: 'Salami', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '11', name: 'Chorizo', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '12', name: 'Salade de pâtes', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '13', name: 'Quiche', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '14', name: 'Pizza', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '15', name: 'Baguette', amount: 1, unit: 'g', category: 'Pain' },
        { id: '16', name: 'Pain de mie', amount: 1, unit: 'g', category: 'Pain' },
        { id: '17', name: 'Pain complet', amount: 1, unit: 'g', category: 'Pain' },
        { id: '18', name: 'Yaourt nature', amount: 1, unit: 'g', category: 'Yaourts' },
        { id: '19', name: 'Yaourt aux fruits', amount: 1, unit: 'g', category: 'Yaourts' },
        { id: '20', name: 'Emmental', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '21', name: 'Camembert', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '22', name: 'Chèvre', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '23', name: 'Lait', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '24', name: 'Beurre', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '25', name: 'Œufs', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '26', name: 'Crème fraîche', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '27', name: 'Frites', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '28', name: 'Petits pois', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '29', name: 'Glace', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '30', name: 'Sucre', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '31', name: 'Chocolat', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '32', name: 'Biscuits', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '33', name: 'Farine', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '34', name: 'Sel', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '35', name: 'Pâtes', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '36', name: 'Riz', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '37', name: "Huile d'olive", amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '38', name: 'Eau', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '39', name: "Jus d'orange", amount: 1, unit: 'g', category: 'Boissons' },
        { id: '40', name: 'Soda', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '41', name: 'Café', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '42', name: 'Savon', amount: 1, unit: 'g', category: 'Hygiène et entretien' },
        { id: '43', name: 'Lessive', amount: 1, unit: 'g', category: 'Hygiène et entretien' },
        { id: '44', name: 'Papier toilette', amount: 1, unit: 'g', category: 'Hygiène et entretien' }
      ],
      servingsDefault: 1,
      language: 'fr',
      defaultRecipesTab: 'recipes',
      defaultPlanningTab: 'recipes',
      dietServingsDefault: 2.5,
      dietLunchCustomServings: 1,
      dietLunchCustomDays: [1, 2, 3, 4, 5],
      dietDinnerCustomServings: 2.5,
      dietDinnerCustomDays: []
    };
    
    if (!saved) return defaultSettings;
    
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        dietServingsDefault: parsed.dietServingsDefault ?? defaultSettings.dietServingsDefault,
        dietLunchCustomServings: parsed.dietLunchCustomServings ?? defaultSettings.dietLunchCustomServings,
        dietLunchCustomDays: parsed.dietLunchCustomDays ?? defaultSettings.dietLunchCustomDays,
        dietDinnerCustomServings: parsed.dietDinnerCustomServings ?? defaultSettings.dietDinnerCustomServings,
        dietDinnerCustomDays: parsed.dietDinnerCustomDays ?? defaultSettings.dietDinnerCustomDays,
        foodPortions: parsed.foodPortions || defaultSettings.foodPortions
      };
    } catch (e) {
      return defaultSettings;
    }
  });

  const [dietServings, setDietServings] = useState<number>(() => {
    const saved = localStorage.getItem('culina_diet_servings');
    return saved ? parseFloat(saved) || 2.5 : 2.5;
  });

  const [dietRecipes, setDietRecipes] = useState<DietRecipe[]>(() => {
    const saved = localStorage.getItem('culina_diet_recipes_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [showQuickBackupModal, setShowQuickBackupModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('culina_recipes', JSON.stringify(recipes));
    localStorage.setItem('culina_plan_v2', JSON.stringify(mealPlan));
    localStorage.setItem('culina_settings', JSON.stringify(settings));
    localStorage.setItem('culina_shopping', JSON.stringify(shoppingList));
    localStorage.setItem('culina_pantry_v3', JSON.stringify(pantryGroups));
    localStorage.setItem('culina_reserve', JSON.stringify(reserveItems));
    localStorage.setItem('culina_sent_meals', JSON.stringify(Array.from(sentMeals)));
    localStorage.setItem('culina_diet_items_v1', JSON.stringify(dietItems));
    localStorage.setItem('culina_diet_servings', dietServings.toString());
    localStorage.setItem('culina_diet_recipes_v1', JSON.stringify(dietRecipes));
  }, [recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems, sentMeals, dietItems, dietServings, dietRecipes]);

  const addRecipe = (r: Recipe) => setRecipes(prev => {
    const index = prev.findIndex(item => item.id === r.id);
    let updated;
    if (index > -1) {
      updated = [...prev];
      updated[index] = r;
    } else {
      updated = [...prev, r];
    }
    return updated.sort((a, b) => a.title.localeCompare(b.title));
  });

  const deleteRecipe = (id: string) => setRecipes(prev => prev.filter(r => r.id !== id));
  
  const updateMealPlan = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => {
    setMealPlan(prev => {
      const day = prev[date] || {};
      if (mealType === 'extra') {
        const field = slot === 'viennoiseries' ? 'viennoiseries' : 'sauces';
        const currentArray = day[field] || [];
        const newArray = [...currentArray];
        if (index !== undefined) {
          newArray[index] = recipeId || '';
        }
        return {
          ...prev,
          [date]: {
            ...day,
            [field]: newArray
          }
        };
      }
      const meal = day[mealType as 'lunch' | 'dinner'] || {};
      return {
        ...prev,
        [date]: {
          ...day,
          [mealType as 'lunch' | 'dinner']: {
            ...meal,
            [slot as 'recipe1' | 'recipe2']: recipeId
          }
        }
      };
    });
    const mealKey = mealType === 'extra' ? `${date}-${slot}-${index}` : `${date}-${mealType}-${slot}`;
    if (sentMeals.has(mealKey)) {
      const next = new Set(sentMeals);
      next.delete(mealKey);
      setSentMeals(next);
    }
  };

  const updateDietMealPlan = (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe' | 'servings', itemIdOrValue: string | number | undefined) => {
    setMealPlan(prev => {
      const day = prev[date] || {};
      const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const dietObj = (mealType === 'lunch' ? day.dietLunch : day.dietDinner) || {};
      return {
        ...prev,
        [date]: {
          ...day,
          [targetKey]: {
            ...dietObj,
            [slot]: itemIdOrValue
          }
        }
      };
    });
    if (slot !== 'servings') {
      const mealKey = `${date}-${mealType === 'lunch' ? 'dietLunch' : 'dietDinner'}-${slot}`;
      if (sentMeals.has(mealKey)) {
        const next = new Set(sentMeals);
        next.delete(mealKey);
        setSentMeals(next);
      }
    }
  };

  const mergeToShoppingList = useCallback((newItems: ShoppingListItem[]) => {
    setShoppingList(currentList => {
      const updatedList = [...currentList];
      newItems.forEach(newItem => {
        const existingIndex = updatedList.findIndex(
          item => item.name.toLowerCase() === newItem.name.toLowerCase() && item.unit === newItem.unit
        );
        if (existingIndex > -1 && !updatedList[existingIndex].checked) {
          updatedList[existingIndex].amount += newItem.amount;
        } else {
          updatedList.push(newItem);
        }
      });
      return updatedList;
    });
  }, []);

  const handleQuickAddFoodToSettings = (name: string, unit: string = 'g', category: string = 'Épicerie') => {
    setSettings(prev => {
      const portions = prev.foodPortions || [];
      const trimmedName = name.trim();
      const existingIndex = portions.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (existingIndex > -1) {
        const updatedPortions = [...portions];
        updatedPortions[existingIndex] = {
          ...updatedPortions[existingIndex],
          category: category || updatedPortions[existingIndex].category
        };
        return { ...prev, foodPortions: updatedPortions };
      }
      const newPortion: FoodPortion = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        amount: 1,
        unit: unit,
        category: category
      };
      return { ...prev, foodPortions: [...portions, newPortion] };
    });
  };

  const exportToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      recipes,
      mealPlan,
      settings,
      shoppingList,
      pantryGroups,
      reserveItems,
      sentMeals: Array.from(sentMeals),
      dietItems,
      dietRecipes
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_backup_${today}.json`;
    a.click();
  };

  const importFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.recipes) setRecipes(data.recipes);
        if (data.mealPlan) setMealPlan(data.mealPlan);
        if (data.settings) setSettings(data.settings);
        if (data.shoppingList) setShoppingList(data.shoppingList);
        if (data.pantryGroups) setPantryGroups(data.pantryGroups);
        if (data.reserveItems) setReserveItems(data.reserveItems);
        if (data.dietItems && Array.isArray(data.dietItems)) setDietItems(data.dietItems);
        if (data.dietRecipes && Array.isArray(data.dietRecipes)) setDietRecipes(data.dietRecipes);
        if (data.sentMeals && Array.isArray(data.sentMeals)) {
          setSentMeals(new Set(data.sentMeals));
        }
        alert("Données importées avec succès !");
      } catch (err) { alert("Erreur lors de l'importation."); }
    };
    reader.readAsText(file);
  };

  const exportPlanningToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      mealPlan,
      sentMeals: Array.from(sentMeals)
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_planning_${today}.json`;
    a.click();
  };

  const importPlanningFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data && typeof data === 'object' && ('mealPlan' in data || 'sentMeals' in data)) {
          if (data.mealPlan) setMealPlan(data.mealPlan);
          if (Array.isArray(data.sentMeals)) setSentMeals(new Set(data.sentMeals));
        } else {
          setMealPlan(data);
        }
        alert("Planning importé avec succès !");
      } catch (err) { alert("Erreur lors de l'importation du planning."); }
    };
    reader.readAsText(file);
  };

  const exportDietPlanningToJSON = () => {
    const today = formatDateKey(new Date());
    const dietPlanData: Record<string, { dietLunch?: { protein?: string; vegetable?: string; starch?: string; dessert?: string }; dietDinner?: { protein?: string; vegetable?: string; starch?: string; dessert?: string } }> = {};

    Object.entries(mealPlan).forEach(([dateStr, dayPlan]) => {
      const plan = dayPlan as MealPlanDay;
      if (plan?.dietLunch || plan?.dietDinner) {
        const getSlotName = (itemId?: string) => {
          if (!itemId) return undefined;
          const found = dietItems.find(i => i.id === itemId);
          return found ? found.name : itemId;
        };

        const lunch = plan.dietLunch ? {
          protein: getSlotName(plan.dietLunch.protein),
          vegetable: getSlotName(plan.dietLunch.vegetable),
          starch: getSlotName(plan.dietLunch.starch),
          dessert: getSlotName(plan.dietLunch.dessert)
        } : undefined;

        const dinner = plan.dietDinner ? {
          protein: getSlotName(plan.dietDinner.protein),
          vegetable: getSlotName(plan.dietDinner.vegetable),
          starch: getSlotName(plan.dietDinner.starch),
          dessert: getSlotName(plan.dietDinner.dessert)
        } : undefined;

        if (lunch || dinner) {
          dietPlanData[dateStr] = {};
          if (lunch) dietPlanData[dateStr].dietLunch = lunch;
          if (dinner) dietPlanData[dateStr].dietDinner = dinner;
        }
      }
    });

    const data = {
      type: "culinashare_diet_planning",
      dietPlan: dietPlanData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_planning_regime_${today}.json`;
    a.click();
  };

  const importDietPlanningFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!raw) {
          alert("Fichier JSON invalide.");
          return;
        }

        const sourceData = raw.dietPlan || raw.mealPlan || raw;
        if (typeof sourceData !== 'object') {
          alert("Format du fichier JSON non reconnu.");
          return;
        }

        let updatedMealPlan = { ...mealPlan };
        let currentDietItems = [...dietItems];
        let itemsAddedCount = 0;

        const resolveDietItemId = (val?: string, categoryDefault: DietCategory = 'Protéines'): string | undefined => {
          if (!val || typeof val !== 'string' || !val.trim()) return undefined;
          const trimmed = val.trim();
          
          let found = currentDietItems.find(i => i.id === trimmed);
          if (found) return found.id;

          found = currentDietItems.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
          if (found) return found.id;

          const newId = Math.random().toString(36).substr(2, 9);
          const newItem: DietItem = {
            id: newId,
            name: trimmed,
            category: categoryDefault,
            weight: '100 g'
          };
          currentDietItems.push(newItem);
          itemsAddedCount++;
          return newId;
        };

        Object.entries(sourceData).forEach(([dateStr, planObj]: [string, any]) => {
          if (!planObj || typeof planObj !== 'object') return;

          const dietLunch = planObj.dietLunch || planObj.lunch;
          const dietDinner = planObj.dietDinner || planObj.dinner;

          const newLunch = dietLunch ? {
            protein: resolveDietItemId(dietLunch.protein, 'Protéines'),
            vegetable: resolveDietItemId(dietLunch.vegetable, 'Légumes'),
            starch: resolveDietItemId(dietLunch.starch, 'Féculents'),
            dessert: resolveDietItemId(dietLunch.dessert, 'Desserts')
          } : undefined;

          const newDinner = dietDinner ? {
            protein: resolveDietItemId(dietDinner.protein, 'Protéines'),
            vegetable: resolveDietItemId(dietDinner.vegetable, 'Légumes'),
            starch: resolveDietItemId(dietDinner.starch, 'Féculents'),
            dessert: resolveDietItemId(dietDinner.dessert, 'Desserts')
          } : undefined;

          updatedMealPlan[dateStr] = {
            ...updatedMealPlan[dateStr],
            ...(newLunch ? { dietLunch: newLunch } : {}),
            ...(newDinner ? { dietDinner: newDinner } : {})
          };
        });

        setMealPlan(updatedMealPlan);
        setDietItems(currentDietItems);

        let msg = "Planning Régime (JSON) importé avec succès !";
        if (itemsAddedCount > 0) {
          msg += `\n${itemsAddedCount} nouveau(x) aliment(s) ajouté(s) automatiquement aux Aliments Régime.`;
        }
        alert(msg);
      } catch (err) {
        alert("Erreur lors de l'importation du planning régime.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportDietRecipesToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      type: "culinashare_diet_recipes",
      dietRecipes: dietRecipes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_recettes_regime_${today}.json`;
    a.click();
  };

  const importDietRecipesFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!raw) {
          alert("Fichier JSON invalide.");
          return;
        }

        const list = Array.isArray(raw) ? raw : (raw.dietRecipes || raw.recipes || []);
        if (!Array.isArray(list) || list.length === 0) {
          alert("Aucune recette régime trouvée dans le fichier JSON.");
          return;
        }

        let addedCount = 0;
        let extractedItems: { name: string, category?: string, weight?: string }[] = [];
        const newRecipes: DietRecipe[] = [];
        
        // Ensure we know the existing ones to avoid dupes in the recipe list itself
        const existingIds = new Set(dietRecipes.map(r => r.id));
        const existingNames = new Set(dietRecipes.map(r => r.name.trim().toLowerCase()));

        list.forEach((item: any) => {
          if (!item || !item.name || typeof item.name !== 'string') return;
          const trimmedName = item.name.trim();
          if (!trimmedName) return;

          if (existingNames.has(trimmedName.toLowerCase())) return;

          const newRecipe: DietRecipe = {
            id: item.id && !existingIds.has(item.id) ? item.id : Math.random().toString(36).substr(2, 9),
            name: trimmedName,
            ingredients: typeof item.ingredients === 'string' ? item.ingredients : (Array.isArray(item.ingredients) ? item.ingredients.map((i: any) => typeof i === 'string' ? i : (i?.name || '')).join(' + ') : (item.ingredients ? String(item.ingredients) : '')),
            servings: typeof item.servings === 'number' ? item.servings : 2.5,
            items: Array.isArray(item.items) ? item.items : []
          };

          const recipeItems: DietRecipeItem[] = [];
          if (Array.isArray(item.items) && item.items.length > 0) {
            item.items.forEach((i: any) => {
              if (i && i.name && typeof i.name === 'string') {
                const trName = i.name.trim();
                if (trName) {
                  recipeItems.push({ name: trName, category: i.category, weight: i.weight || '' });
                  extractedItems.push({ name: trName, category: i.category, weight: i.weight || '' });
                }
              }
            });
          } else if (typeof newRecipe.ingredients === 'string' && newRecipe.ingredients.trim()) {
            const rawParts = newRecipe.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
            rawParts.forEach((part: string) => {
              const trimmed = part.trim();
              const match = trimmed.match(/^(.*?)(?:\s*\(|\s+)([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)\)?$/i);
              const ingName = match ? match[1].replace(/[:\-]$/, '').trim() : trimmed.replace(/\(.*?\)/g, '').trim();
              const ingWeight = match ? match[2].trim() : '';
              if (ingName) {
                recipeItems.push({ name: ingName, weight: ingWeight });
                extractedItems.push({ name: ingName, weight: ingWeight });
              }
            });
          }

          if (newRecipe.items.length === 0 && recipeItems.length > 0) {
            newRecipe.items = recipeItems;
          }

          newRecipes.push(newRecipe);
          existingNames.add(trimmedName.toLowerCase());
          addedCount++;
        });

        if (addedCount === 0) {
          alert("Aucune nouvelle recette régime trouvée à importer.");
          return;
        }

        const existingNamesInDiet = new Set(dietItems.map(d => d.name.trim().toLowerCase()));
        const existingNamesInSettings = new Set(
          (settings.foodPortions || []).map(p => p.name.trim().toLowerCase())
        );

        const newFoods: typeof extractedItems = [];
        const seenNew = new Set<string>();

        extractedItems.forEach(ex => {
          const nLow = ex.name.toLowerCase();
          const isKnown = existingNamesInDiet.has(nLow) || existingNamesInSettings.has(nLow);
          if (!isKnown) {
            if (!seenNew.has(nLow)) {
              seenNew.add(nLow);
              newFoods.push(ex);
            }
          }
        });

        if (newFoods.length > 0) {
          setPendingDietRecipes(newRecipes);
          setPendingNewFoodsToReview(newFoods);
          setCurrentReviewIndex(0);
          setSelectedMatchMode('__NEW__');
          setReviewedReplacements({});
          setReviewedNewFoods([]);

          const firstFood = newFoods[0];
          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : 'Légumes');
          
          const availableSettingsCategories = settings.foodCategories || [];
          setReviewSetCat(availableSettingsCategories.length > 0 ? availableSettingsCategories[0] : 'Légumes');

          setShowReviewNewFoodsModal(true);
        } else {
          setDietRecipes(prev => [...prev, ...newRecipes]);
          alert(`Recettes Régime importées avec succès !\n${addedCount} recette(s) ajoutée(s).`);
        }

      } catch (err) {
        alert("Erreur lors de l'importation des recettes régime.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportDietItemsToExcel = () => {
    const today = formatDateKey(new Date());
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("La bibliothèque d'export Excel n'est pas chargée.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const dietData = dietItems.map(item => {
      const settingsPortion = settings.foodPortions?.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      return {
        "Aliments": item.name,
        "Poids": item.weight || "100 g",
        "Personnes": 2.5,
        "Catégorie (Régime)": item.category || "Protéines",
        "Catégorie (Réglages)": settingsPortion?.category || item.category || "Protéines"
      };
    });

    const ws = XLSX.utils.json_to_sheet(dietData);
    XLSX.utils.book_append_sheet(workbook, ws, "Aliments Régime");

    XLSX.writeFile(workbook, `culina_aliments_regime_${today}.xlsx`);
  };

  const importDietItemsFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    const file = e.target.files?.[0];
    if (!file || !XLSX) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const firstSheetName = wb.SheetNames[0];
        const sheetName = wb.SheetNames.includes("Aliments Régime") ? "Aliments Régime" : firstSheetName;
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          alert("Aucune feuille trouvée dans le fichier Excel.");
          return;
        }

        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          alert("Aucun aliment trouvé dans le fichier Excel.");
          return;
        }

        const itemsToImport = data.map((row: any) => {
          const keys = Object.keys(row);
          // Colonne A: Aliments
          const rawName = row["Aliments"] || row["aliments"] || row["ALIMENTS"] || row["Aliment"] || row["aliment"] || (keys[0] ? row[keys[0]] : "");
          // Colonne B: Poids
          const rawWeight = row["Poids"] || row["poids"] || row["POIDS"] || (keys[1] ? row[keys[1]] : "") || "100 g";
          
          // Colonne Personnes:
          const personsValue = row["Personnes"] || row["personnes"] || row["PERSONNES"] || row["Personne"] || row["personne"] || row["Nb personnes"] || row["Nombre de personnes"] || row["Nb Personnes"] || row["Nombre de Personnes"];
          let parsedPersons = 2.5;
          if (personsValue !== undefined && personsValue !== null && personsValue !== "") {
            const p = parseFloat(String(personsValue).replace(',', '.'));
            if (!isNaN(p) && p > 0) {
              parsedPersons = p;
            }
          }

          const strWeight = rawWeight ? String(rawWeight).trim() : "100 g";
          const normalizedWeight = parsedPersons !== 2.5 ? scaleTextQuantity(strWeight, 2.5, parsedPersons) : strWeight;

          // Colonne C / D: Catégories
          const rawDietCategory = row["Catégorie (Régime)"] || row["Categorie (Regime)"] || row["Catégorie Régime"] || row["Catégories"] || row["Catégorie"] || row["catégorie"];
          let finalDietCategory = rawDietCategory;
          if (!finalDietCategory) {
            const dietKey = keys.find(k => /régime|regime/i.test(k));
            if (dietKey) {
              finalDietCategory = row[dietKey];
            } else if (personsValue !== undefined) {
              finalDietCategory = keys[3] ? row[keys[3]] : "";
            } else {
              finalDietCategory = keys[2] ? row[keys[2]] : "";
            }
          }

          const rawSettingsCategory = row["Catégorie (Réglages)"] || row["Categorie (Reglages)"] || row["Catégorie Réglages"] || row["Catégories (Réglages)"];
          let finalSettingsCategory = rawSettingsCategory;
          if (!finalSettingsCategory) {
            const setKey = keys.find(k => /réglages|reglages/i.test(k));
            if (setKey) {
              finalSettingsCategory = row[setKey];
            } else if (personsValue !== undefined) {
              finalSettingsCategory = keys[4] ? row[keys[4]] : "";
            } else {
              finalSettingsCategory = keys[3] ? row[keys[3]] : "";
            }
          }

          return {
            name: rawName ? String(rawName).trim() : "",
            weight: normalizedWeight || "100 g",
            dietCategory: finalDietCategory ? String(finalDietCategory).trim() : "Protéines",
            settingsCategory: finalSettingsCategory ? String(finalSettingsCategory).trim() : (finalDietCategory ? String(finalDietCategory).trim() : "Protéines")
          };
        }).filter(item => item.name.length > 0);

        if (itemsToImport.length === 0) {
          alert("Aucun aliment valide trouvé dans le fichier Excel.");
          return;
        }

        const existingNamesInDiet = new Set(dietItems.map(d => d.name.trim().toLowerCase()));
        const existingNamesInSettings = new Set((settings.foodPortions || []).map(p => p.name.trim().toLowerCase()));

        const itemsToReview = itemsToImport
          .filter(item => {
            const normName = item.name.trim().toLowerCase();
            const inDiet = existingNamesInDiet.has(normName);
            const inSettings = existingNamesInSettings.has(normName);
            // Règle 1 : Présent dans les 2 listes -> Ignorer (rien ne se passe, évite les doublons)
            // Règle 2 & 3 : Absent de 1 ou des 2 listes -> À valider via le modal
            return !(inDiet && inSettings);
          })
          .map(item => ({
            name: item.name,
            category: item.dietCategory,
            settingsCategory: item.settingsCategory,
            weight: item.weight
          }));

        if (itemsToReview.length > 0) {
          setPendingDietRecipes([]);
          setPendingNewFoodsToReview(itemsToReview);
          setCurrentReviewIndex(0);
          setSelectedMatchMode('__NEW__');
          setReviewedReplacements({});
          setReviewedNewFoods([]);
          setReviewedDietItemsToAdd([]);

          const firstFood = itemsToReview[0];
          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : 'Légumes');

          const availableSettingsCategories = settings.foodCategories || [];
          setReviewSetCat((firstFood.settingsCategory && availableSettingsCategories.includes(firstFood.settingsCategory)) ? firstFood.settingsCategory : (availableSettingsCategories.length > 0 ? availableSettingsCategories[0] : 'Légumes'));

          setShowReviewNewFoodsModal(true);
        } else {
          alert("Tous les aliments de ce fichier Excel sont déjà présents dans vos 2 listes (Recettes Régime et Réglages Aliments).");
        }
      } catch (err) {
        alert("Erreur lors de l'importation du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportToExcel = () => {
    const today = formatDateKey(new Date());
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("La bibliothèque d'export Excel n'est pas chargée.");
      return;
    }
    
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Récurrents
    const recurringData = pantryGroups.flatMap(group => 
      group.items.map(item => ({
        Liste: group.name,
        Article: item.name,
        Quantité: item.amount,
        Unité: item.unit
      }))
    );
    const wsRecurring = XLSX.utils.json_to_sheet(recurringData);
    XLSX.utils.book_append_sheet(workbook, wsRecurring, "Récurrents");

    // Sheet 2: En réserve
    const reserveData = reserveItems.map(item => ({
      Article: item.name,
      Quantité: item.amount,
      Unité: item.unit
    }));
    const wsReserve = XLSX.utils.json_to_sheet(reserveData);
    XLSX.utils.book_append_sheet(workbook, wsReserve, "reserves");

    // Sheet 3: Aliments
    const foodData = (settings.foodPortions || []).map(item => ({
      Aliment: item.name,
      Catégorie: item.category || "Sans catégorie"
    }));
    const wsFood = XLSX.utils.json_to_sheet(foodData);
    XLSX.utils.book_append_sheet(workbook, wsFood, "Aliments");

    XLSX.writeFile(workbook, `culinashare_stocks_${today}.xlsx`);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    const file = e.target.files?.[0];
    if (!file || !XLSX) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Process Récurrents
        if (wb.SheetNames.includes("Récurrents")) {
          const ws = wb.Sheets["Récurrents"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          setPantryGroups(prev => {
            const updatedGroups = [...prev];
            data.forEach(row => {
              const listName = (row.Liste || row.liste || row.LISTE || "Sans Nom").toString();
              const itemName = (row.Article || row.article || row.ARTICLE || "").toString();
              const amount = Number(row.Quantité || row.quantité || row.QUANTITE || 1);
              const unit = (row.Unité || row.unité || row.UNITE || "unité").toString();
              if (!itemName) return;
              let group = updatedGroups.find(g => g.name.toLowerCase() === listName.toLowerCase());
              if (!group) {
                group = { id: Math.random().toString(36).substr(2, 9), name: listName, items: [] };
                updatedGroups.push(group);
              }
              group.items.push({
                id: Math.random().toString(36).substr(2, 9),
                name: itemName,
                amount: amount,
                unit: unit,
                checked: false
              });
            });
            return updatedGroups;
          });
        }

        // Process reserves
        if (wb.SheetNames.includes("reserves")) {
          const ws = wb.Sheets["reserves"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          setReserveItems(prev => {
            const updatedReserve = [...prev];
            data.forEach(row => {
              const itemName = (row.Article || row.article || row.ARTICLE || "").toString();
              const amount = Number(row.Quantité || row.quantité || row.QUANTITE || 1);
              const unit = (row.Unité || row.unité || row.UNITE || "unité").toString();
              if (!itemName) return;
              
              // Eviter les doublons lors de l'import
              const exists = updatedReserve.find(i => i.name.toLowerCase() === itemName.toLowerCase());
              if (!exists) {
                updatedReserve.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: itemName,
                  amount: amount,
                  unit: unit,
                  checked: false
                });
              }
            });
            return updatedReserve.sort((a, b) => a.name.localeCompare(b.name));
          });
        }

        // Process Aliments
        if (wb.SheetNames.includes("Aliments")) {
          const ws = wb.Sheets["Aliments"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          setSettings(prev => {
            const updatedFoodPortions = [...(prev.foodPortions || [])];
            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || "").toString().trim();
              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || "").toString().trim();
              if (!foodName) return;
              
              const exists = updatedFoodPortions.find(f => f.name.toLowerCase() === foodName.toLowerCase());
              if (!exists) {
                updatedFoodPortions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: foodName,
                  amount: 1,
                  unit: 'g',
                  category: category === "Sans catégorie" ? undefined : category
                });
              } else if (category && category !== "Sans catégorie") {
                // Update category if it exists but was empty or different
                exists.category = category;
              }
            });
            return { ...prev, foodPortions: updatedFoodPortions };
          });
        }

        alert("Données Excel importées !");
      } catch (err) {
        alert("Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  const handleQuickBackup = () => {
    exportToJSON();
    setShowQuickBackupModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-20 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onQuickBackup={handleQuickBackup} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'recipes' && (
          <RecipeBook 
            recipes={recipes} 
            mealPlan={mealPlan}
            addRecipe={addRecipe} 
            deleteRecipe={deleteRecipe}
            onAddToShopping={(ings) => {
              const items: ShoppingListItem[] = ings.map(ing => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                checked: false
              }));
              mergeToShoppingList(items);
            }} 
            foodPortions={settings.foodPortions} 
            foodCategories={settings.foodCategories || ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre']}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            onRemoveFoodFromSettings={(foodName) => {
              setSettings(prev => ({
                ...prev,
                foodPortions: (prev.foodPortions || []).filter(
                  p => p.name.trim().toLowerCase() !== foodName.trim().toLowerCase()
                )
              }));
            }}
            updateMealPlan={updateMealPlan}
            updateDietMealPlan={updateDietMealPlan}
            setSentMeals={setSentMeals}
            dietItems={dietItems}
            setDietItems={setDietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
            dietRecipes={dietRecipes}
            setDietRecipes={setDietRecipes}
            defaultTab={settings.defaultRecipesTab || 'recipes'}
            settings={settings}
          />
        )}
        {activeTab === 'search' && (
          <RecipeSearch 
            recipes={recipes} 
            dietRecipes={dietRecipes}
            setDietRecipes={setDietRecipes}
            dietItems={dietItems}
            setDietItems={setDietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
            mealPlan={mealPlan}
            addRecipe={addRecipe} 
            deleteRecipe={deleteRecipe}
            onAddToShopping={(ings) => {
              const items: ShoppingListItem[] = ings.map(ing => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                checked: false
              }));
              mergeToShoppingList(items);
            }} 
            updateMealPlan={updateMealPlan} 
            updateDietMealPlan={updateDietMealPlan}
            foodPortions={settings.foodPortions || []}
            foodCategories={settings.foodCategories || FOOD_CATEGORIES}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            setSentMeals={setSentMeals}
            settings={settings}
          />
        )}
        {activeTab === 'planning' && (
          <Planning 
            mealPlan={mealPlan} 
            recipes={recipes} 
            updateMealPlan={updateMealPlan} 
            updateDietMealPlan={updateDietMealPlan}
            onMergeToShopping={mergeToShoppingList}
            sentMeals={sentMeals}
            setSentMeals={setSentMeals}
            settings={settings}
            dietItems={dietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
            dietRecipes={dietRecipes}
          />
        )}
        {activeTab === 'recurring' && (
          <RecurringView 
            groups={pantryGroups} 
            setGroups={setPantryGroups} 
            foodPortions={settings.foodPortions} 
            foodCategories={settings.foodCategories}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            onSendToShopping={(items) => {
              mergeToShoppingList(items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) })));
              setActiveTab('shopping');
            }}
          />
        )}
        {activeTab === 'reserve' && (
          <InStockView 
            items={reserveItems}
            setItems={setReserveItems}
            foodPortions={settings.foodPortions}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingView 
            list={shoppingList} 
            setList={setShoppingList} 
            settings={settings}
            foodPortions={settings.foodPortions || []}
            foodCategories={settings.foodCategories || ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre']}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            reserveItems={reserveItems}
            setReserveItems={setReserveItems}
            pantryGroups={pantryGroups}
            setPantryGroups={setPantryGroups}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings} 
            setSettings={setSettings} 
            exportToJSON={exportToJSON} 
            importFromJSON={importFromJSON} 
            exportToExcel={exportToExcel}
            importFromExcel={importFromExcel}
            exportPlanningToJSON={exportPlanningToJSON}
            importPlanningFromJSON={importPlanningFromJSON}
            exportDietItemsToExcel={exportDietItemsToExcel}
            importDietItemsFromExcel={importDietItemsFromExcel}
            exportDietPlanningToJSON={exportDietPlanningToJSON}
            importDietPlanningFromJSON={importDietPlanningFromJSON}
            exportDietRecipesToJSON={exportDietRecipesToJSON}
            importDietRecipesFromJSON={importDietRecipesFromJSON}
            sentMeals={sentMeals}
            setSentMeals={setSentMeals}
            recipes={recipes}
            dietRecipes={dietRecipes}
            pantryGroups={pantryGroups}
            reserveItems={reserveItems}
          />
        )}
        {activeTab === 'notice' && (
          <Notice />
        )}
      </main>

      {/* MODAL REVIEW NOUVEAUX ALIMENTS (IMPORT RECETTES RÉGIME) */}
      {showReviewNewFoodsModal && pendingNewFoodsToReview.length > 0 && currentReviewIndex < pendingNewFoodsToReview.length && (() => {
        const currentFood = pendingNewFoodsToReview[currentReviewIndex];
        
        // Collect all unique existing food names
        const allExistingFoodNamesList: string[] = [];
        const seenNames = new Set<string>();
        (dietItems || []).forEach(d => {
          if (d.name && d.name.trim() && !seenNames.has(d.name.trim().toLowerCase())) {
            seenNames.add(d.name.trim().toLowerCase());
            allExistingFoodNamesList.push(d.name.trim());
          }
        });
        (settings.foodPortions || []).forEach(p => {
          if (p.name && p.name.trim() && !seenNames.has(p.name.trim().toLowerCase())) {
            seenNames.add(p.name.trim().toLowerCase());
            allExistingFoodNamesList.push(p.name.trim());
          }
        });
        allExistingFoodNamesList.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

        const similarSuggestions = findSimilarDietFoods(currentFood.name, allExistingFoodNamesList);
        const isNewSelected = selectedMatchMode === '__NEW__';

        const handleConfirmCurrent = () => {
          const updatedReplacements = { ...reviewedReplacements };
          const updatedNewFoods = [...reviewedNewFoods];
          const updatedDietItemsToAdd = [...reviewedDietItemsToAdd];

          if (isNewSelected) {
            updatedNewFoods.push({
              name: currentFood.name,
              weight: currentFood.weight,
              dietCat: reviewDietCat,
              setCat: reviewSetCat
            });
            setReviewedNewFoods(updatedNewFoods);
            updatedDietItemsToAdd.push({
              name: currentFood.name,
              weight: currentFood.weight,
              dietCat: reviewDietCat
            });
          } else {
            updatedReplacements[currentFood.name] = selectedMatchMode;
            setReviewedReplacements(updatedReplacements);
            updatedDietItemsToAdd.push({
              name: selectedMatchMode,
              weight: currentFood.weight,
              dietCat: reviewDietCat
            });
          }
          setReviewedDietItemsToAdd(updatedDietItemsToAdd);

          if (currentReviewIndex + 1 < pendingNewFoodsToReview.length) {
            const nextIdx = currentReviewIndex + 1;
            setCurrentReviewIndex(nextIdx);
            setSelectedMatchMode('__NEW__');
            const nextFood = pendingNewFoodsToReview[nextIdx];
            const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Desserts'];
            setReviewDietCat((nextFood.category && defaultDietCats.includes(nextFood.category)) ? nextFood.category as DietCategory : 'Légumes');
            const availableSettingsCategories = settings.foodCategories || [];
            setReviewSetCat(availableSettingsCategories.length > 0 ? availableSettingsCategories[0] : 'Légumes');
          } else {
            // Finalize import!
            // 1. Apply replacements to recipes
            const finalRecipes = pendingDietRecipes.map(recipe => {
              const updatedRecipe = { ...recipe };
              
              if (Array.isArray(updatedRecipe.items) && updatedRecipe.items.length > 0) {
                updatedRecipe.items = updatedRecipe.items.map(it => {
                  const rep = updatedReplacements[it.name];
                  if (rep) {
                    return { ...it, name: rep };
                  }
                  return it;
                });
                updatedRecipe.ingredients = updatedRecipe.items.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ');
              } else if (typeof updatedRecipe.ingredients === 'string') {
                let ingStr = updatedRecipe.ingredients;
                Object.entries(updatedReplacements).forEach(([oldName, newName]) => {
                  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(^|\\s|\\+|\\,|\\()${escaped}(\\s|\\+|\\,|\\)|$)`, 'gi');
                  ingStr = ingStr.replace(regex, `$1${newName}$2`);
                });
                updatedRecipe.ingredients = ingStr;
              }

              return updatedRecipe;
            });

            // 2. Add/register all reviewed diet items (both new & mapped from settings) into dietItems (Recettes > Catégories Régime)
            if (updatedDietItemsToAdd.length > 0) {
              setDietItems(prevDiet => {
                const currentDietNames = new Set(prevDiet.map(d => d.name.trim().toLowerCase()));
                const toAdd: DietItem[] = [];
                updatedDietItemsToAdd.forEach(ex => {
                  const nLow = ex.name.trim().toLowerCase();
                  if (!currentDietNames.has(nLow)) {
                    toAdd.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: ex.name.trim(),
                      category: ex.dietCat as DietCategory,
                      weight: ex.weight || ''
                    });
                    currentDietNames.add(nLow);
                  }
                });
                return toAdd.length > 0 ? [...prevDiet, ...toAdd] : prevDiet;
              });
            }

            // 3. Add new foods to Settings > Aliments
            if (updatedNewFoods.length > 0) {
              setSettings(prevSet => {
                const currentPortions = prevSet.foodPortions || [];
                const currentCategories = prevSet.foodCategories || [];
                let changed = false;
                const newPortions = [...currentPortions];
                let newCategories = [...currentCategories];
                
                updatedNewFoods.forEach(ex => {
                  const nLow = ex.name.trim().toLowerCase();
                  if (!newPortions.some(p => p.name.trim().toLowerCase() === nLow)) {
                    newPortions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: ex.name.trim(),
                      amount: 1,
                      unit: 'g',
                      category: ex.setCat
                    });
                    changed = true;
                  }
                  if (!newCategories.includes(ex.setCat)) {
                    newCategories.push(ex.setCat);
                    changed = true;
                  }
                });
                return changed ? { ...prevSet, foodPortions: newPortions, foodCategories: newCategories } : prevSet;
              });
            }

            // 4. Save recipes
            setDietRecipes(prev => [...prev, ...finalRecipes]);
            setShowReviewNewFoodsModal(false);
            setPendingNewFoodsToReview([]);
            setPendingDietRecipes([]);
            setCurrentReviewIndex(0);
            setSelectedMatchMode('__NEW__');
            setReviewedReplacements({});
            setReviewedNewFoods([]);
            setReviewedDietItemsToAdd([]);

            const replacedCount = Object.keys(updatedReplacements).length;
            const newCreatedCount = updatedNewFoods.length;
            const totalAddedDiet = updatedDietItemsToAdd.length;

            if (pendingDietRecipes.length > 0) {
              alert(`Importation réussie !\n- ${finalRecipes.length} recette(s) régime ajoutée(s).\n- ${totalAddedDiet} aliment(s) enregistré(s) dans Recettes > Catégories Régime.\n- ${newCreatedCount} nouvel(aux) aliment(s) créé(s) dans Réglages > Aliments.`);
            } else {
              alert(`Importation des aliments régime réussie !\n- ${totalAddedDiet} aliment(s) enregistré(s) dans Recettes > Catégories Régime.\n- ${newCreatedCount} nouvel(aux) aliment(s) créé(s) dans Réglages > Aliments.`);
            }
          }
        };

        const handleCancel = () => {
          setShowReviewNewFoodsModal(false);
          setPendingNewFoodsToReview([]);
          setPendingDietRecipes([]);
          setCurrentReviewIndex(0);
          setSelectedMatchMode('__NEW__');
          setReviewedReplacements({});
          setReviewedNewFoods([]);
          setReviewedDietItemsToAdd([]);
        };

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
              <div className="p-6 sm:p-8 text-center overflow-y-auto flex-1 custom-scrollbar">
                <div className="w-14 h-14 rounded-3xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                  🔎
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                  Aliment à valider
                </h3>
                <p className="text-sm font-bold text-gray-500 mb-5">
                  Aliment {currentReviewIndex + 1} sur {pendingNewFoodsToReview.length}
                </p>

                {/* Box aliment détecté */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left border border-gray-200/80 shadow-2xs">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Aliment à valider :
                  </p>
                  <p className="text-xl font-black text-purple-800 flex items-center gap-2 flex-wrap">
                    <span>🥗</span>
                    <span>« {currentFood.name} »</span>
                    {currentFood.weight && (
                      <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                        {currentFood.weight}
                      </span>
                    )}
                  </p>
                </div>

                {/* Choix : Nouveau ou Aliments ressemblants existants */}
                <div className="space-y-4 text-left">
                  <p className="text-xs font-black text-gray-700 uppercase tracking-wider pl-1">
                    Que souhaitez-vous faire ?
                  </p>

                  <div className="space-y-2">
                    {/* Option 1: Nouveau */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatchMode('__NEW__');
                        const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Desserts'];
                        setReviewDietCat((currentFood.category && defaultDietCats.includes(currentFood.category)) ? currentFood.category as DietCategory : 'Légumes');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isNewSelected
                          ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="font-black text-sm">
                            Nouveau : Créer « {currentFood.name} »
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            Ajouter cet aliment à vos listes avec les catégories choisies
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isNewSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                      }`}>
                        {isNewSelected && <span className="text-xs font-black">✓</span>}
                      </div>
                    </button>

                    {/* Suggestions d'aliments ressemblants */}
                    {similarSuggestions.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wider pl-1 mb-2">
                          Aliments existants ressemblants :
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {similarSuggestions.map(sug => {
                            const isSugSelected = selectedMatchMode === sug;
                            return (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => {
                                  setSelectedMatchMode(sug);
                                  const bestCat = resolveDietFoodCategory(sug, currentFood.category, dietItems, settings.foodPortions);
                                  if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Desserts'].includes(bestCat)) {
                                    setReviewDietCat(bestCat as DietCategory);
                                  }
                                }}
                                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                                  isSugSelected
                                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-base">🔄</span>
                                  <div>
                                    <p className="font-black text-sm">
                                      Utiliser : « <span className="text-purple-700 font-black">{sug}</span> »
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-500">
                                      Remplacera « {currentFood.name} » par « {sug} » dans la recette
                                    </p>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSugSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                                }`}>
                                  {isSugSelected && <span className="text-xs font-black">✓</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Autre aliment existant dropdown */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider pl-1 mb-1.5">
                        Ou choisir un autre aliment enregistré :
                      </label>
                      <select
                        value={!isNewSelected && !similarSuggestions.includes(selectedMatchMode) ? selectedMatchMode : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const val = e.target.value;
                            setSelectedMatchMode(val);
                            const bestCat = resolveDietFoodCategory(val, currentFood.category, dietItems, settings.foodPortions);
                            if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Desserts'].includes(bestCat)) {
                              setReviewDietCat(bestCat as DietCategory);
                            }
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        <option value="">-- Parcourir tous les aliments enregistrés --</option>
                        {allExistingFoodNamesList.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Choix des catégories : Nouveau vs Existant */}
                  {isNewSelected ? (
                    <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3 mt-3 animate-fadeIn">
                      <p className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span>Catégories pour le nouvel aliment « {currentFood.name} » :</span>
                      </p>

                      <div>
                        <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                          Catégorie Régime (Colonnes)
                        </label>
                        <select
                          value={reviewDietCat}
                          onChange={(e) => setReviewDietCat(e.target.value as DietCategory)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          <option value="Protéines">Protéines</option>
                          <option value="Légumes">Légumes</option>
                          <option value="Féculents">Féculents</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                          Catégorie Réglages (Liste de courses)
                        </label>
                        <select
                          value={reviewSetCat}
                          onChange={(e) => setReviewSetCat(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          {(settings.foodCategories || []).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3 animate-fadeIn">
                      <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200 flex items-center gap-2.5 text-green-900 text-xs font-bold">
                        <span className="text-base">✅</span>
                        <span>
                          La recette sera importée en remplaçant <strong>« {currentFood.name} »</strong> par <strong>« {selectedMatchMode} »</strong>.
                        </span>
                      </div>

                      <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                        <p className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                          <span>🏷️</span>
                          <span>Catégorie Régime pour l'aliment « {selectedMatchMode} » :</span>
                        </p>

                        <div>
                          <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                            Catégorie Régime (Colonnes)
                          </label>
                          <select
                            value={reviewDietCat}
                            onChange={(e) => setReviewDietCat(e.target.value as DietCategory)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                          >
                            <option value="Protéines">Protéines</option>
                            <option value="Légumes">Légumes</option>
                            <option value="Féculents">Féculents</option>
                            <option value="Desserts">Desserts</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm cursor-pointer"
                  >
                    Annuler l'import
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCurrent}
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{currentReviewIndex + 1 < pendingNewFoodsToReview.length ? "Valider et Suivant" : "Terminer l'import"}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL CONFIRMATION SAUVEGARDE RAPIDE */}
      {showQuickBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl">✅</div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Sauvegarde terminée !</h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Le fichier JSON de sauvegarde complète (culinashare_backup_...) a été téléchargé avec succès.
              </p>
              <button 
                onClick={() => setShowQuickBackupModal(false)}
                className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform active:scale-95"
              >
                Génial !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Components ---

const Navbar: React.FC<{ activeTab: AppTab; setActiveTab: (t: AppTab) => void; onQuickBackup: () => void }> = ({ activeTab, setActiveTab, onQuickBackup }) => {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipes', label: 'Recettes', icon: <EXT_ICONS.Book /> },
    { id: 'search', label: 'Recherche', icon: <EXT_ICONS.Search /> },
    { id: 'planning', label: 'Planning', icon: <EXT_ICONS.Calendar /> },
    { id: 'recurring', label: "Récurrents", icon: <EXT_ICONS.Recurring /> },
    { id: 'reserve', label: "En réserve", icon: <EXT_ICONS.Box /> },
    { id: 'shopping', label: 'Courses', icon: <EXT_ICONS.Cart /> },
    { id: 'settings', label: 'Réglages', icon: <EXT_ICONS.Settings /> },
    { id: 'notice', label: 'Notice', icon: <EXT_ICONS.Info /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:sticky md:top-0 md:h-screen md:flex-col md:w-64 md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto no-scrollbar">
      <div className="hidden md:block mb-8 text-2xl font-black text-purple-600 px-4">Gestion cuisine</div>
      <div className="flex md:flex-col w-full justify-around md:gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 ${activeTab === tab.id ? 'text-purple-600 bg-purple-50 md:bg-purple-600 md:text-white shadow-sm' : 'text-gray-400 hover:bg-purple-50/50'}`}>
            {tab.icon} <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
        <button 
          onClick={onQuickBackup}
          className="flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 text-blue-600 hover:bg-blue-50 border-2 border-transparent md:mt-4 md:border-blue-100 md:bg-white"
          title="Sauvegarde rapide"
        >
          <span>💾</span>
          <span className="text-[10px] md:text-xs font-black whitespace-nowrap uppercase tracking-widest">Sauvegarde</span>
        </button>
      </div>
    </nav>
  );
};

// --- InStockView (En réserve) ---

const InStockView: React.FC<{
  items: ShoppingListItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
}> = ({ items, setItems, foodPortions, onAddFoodToSettings }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const addItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit, 'Épicerie');
    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      amount: newItemAmount,
      unit: newItemUnit,
      checked: false
    };
    setItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateAmount = (id: string, newAmount: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      <header>
        <h2 className="text-3xl font-black text-gray-800 tracking-tight text-center sm:text-left">En Réserve</h2>
        <p className="text-sm font-bold text-purple-400 mt-1 text-center sm:text-left uppercase tracking-widest">Gérer votre stock à la maison</p>
      </header>

      {/* Manual Add Form */}
      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ajouter un produit</p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <input 
              type="text" 
              list="stock-food-suggestions"
              placeholder="Ex: Pâtes, Farine..."
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-purple-200"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addItem()}
            />
            <datalist id="stock-food-suggestions">
              {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <input 
              type="number" 
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-black text-center text-purple-600 outline-none" 
              value={newItemAmount} 
              onChange={e => setNewItemAmount(Number(e.target.value))} 
            />
          </div>
          <div className="sm:col-span-2">
            <select 
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-500 outline-none cursor-pointer" 
              value={newItemUnit} 
              onChange={e => setNewItemUnit(e.target.value)}
            >
              <option value="boite">boite</option>
              <option value="C.à S">C.à S</option>
              <option value="cl">cl</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="paquet">paq.</option>
              <option value="pièce">pc.</option>
              <option value="tranche">tr.</option>
              <option value="unité">u.</option>
            </select>
          </div>
          <button 
            onClick={addItem} 
            className="sm:col-span-2 bg-purple-600 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="p-20 text-center text-gray-300 italic font-medium">Votre réserve est vide.</div>
        ) : (
          sortedItems.map(i => (
            <div key={i.id} className="p-5 flex gap-5 items-center hover:bg-purple-50/10 transition-all group">
              <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
              <p className="flex-1 font-bold text-lg text-gray-800">{i.name}</p>
              <div className="flex items-center gap-2 shrink-0">
                <input 
                  type="number"
                  className="w-16 p-2 text-center font-black text-sm bg-purple-50 text-purple-600 rounded-xl outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                  value={i.amount}
                  onChange={(e) => updateAmount(i.id, Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-[10px] font-black text-purple-400 w-10">{i.unit}</span>
              </div>
              <button 
                onClick={() => removeItem(i.id)} 
                className="text-gray-200 hover:text-red-400 transition-colors font-bold text-xl ml-2 opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DIET_RECIPE_UNITS = ['boite', 'C à C', 'C à S', 'cl', 'kg', 'g', 'L', 'ml', 'u.'];

const RecipeBook: React.FC<{ 
  recipes: Recipe[]; 
  mealPlan: Record<string, MealPlanDay>;
  addRecipe: (r: Recipe) => void; 
  deleteRecipe: (id: string) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  foodPortions: FoodPortion[];
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  onRemoveFoodFromSettings?: (name: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  updateDietMealPlan?: (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe', itemId: string | undefined) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  dietItems: DietItem[];
  setDietItems: React.Dispatch<React.SetStateAction<DietItem[]>>;
  dietServings: number;
  setDietServings: React.Dispatch<React.SetStateAction<number>>;
  dietRecipes?: DietRecipe[];
  setDietRecipes?: React.Dispatch<React.SetStateAction<DietRecipe[]>>;
  defaultTab?: 'recipes' | 'regime';
  settings: UserSettings;
}> = ({ recipes, mealPlan, addRecipe, deleteRecipe, onAddToShopping, foodPortions, foodCategories, onAddFoodToSettings, onRemoveFoodFromSettings, updateMealPlan, updateDietMealPlan, setSentMeals, dietItems, setDietItems, dietServings, setDietServings, dietRecipes = [], setDietRecipes, defaultTab = 'recipes', settings }) => {
  const [viewMode, setViewMode] = useState<'recipes' | 'regime' | 'categories_regime'>(() => (defaultTab as any) || 'recipes');

  useEffect(() => {
    setViewMode(defaultTab);
  }, [defaultTab]);
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Diet planning modal state
  const [planningDietRecipe, setPlanningDietRecipe] = useState<DietRecipe | null>(null);
  const [dietPlanDate, setDietPlanDate] = useState<string>(() => formatDateKey(new Date()));
  const [dietPlanMealType, setDietPlanMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [dietPlanServings, setDietPlanServings] = useState<number>(2.5);
  const [showDietAvailability, setShowDietAvailability] = useState(false);
  const [dietAvailabilityWeekDate, setDietAvailabilityWeekDate] = useState(() => {
    const d = new Date();
    const startDay = settings.startDay ?? 1;
    const day = d.getDay();
    const diff = (day - startDay + 7) % 7;
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  const handleProgrammerAuPlanningRegime = () => {
    if (!planningDietRecipe) return;
    if (!dietPlanDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    if (updateDietMealPlan) {
      updateDietMealPlan(dietPlanDate, dietPlanMealType, 'dietRecipe', planningDietRecipe.id);
    }
    if (setDietServings && dietPlanServings) {
      setDietServings(dietPlanServings);
    }
    const mealLabel = dietPlanMealType === 'lunch' ? 'Déjeuner' : 'Dîner';
    alert(`Recette régime « ${planningDietRecipe.name} » programmée au planning régime pour le ${dietPlanDate} (${mealLabel}) pour ${dietPlanServings.toString().replace('.', ',')} pers. !`);
    setPlanningDietRecipe(null);
  };

  // Diet modal state
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietToDelete, setDietToDelete] = useState<DietItem | null>(null);
  const [editingDietItem, setEditingDietItem] = useState<DietItem | null>(null);
  const [dietFormName, setDietFormName] = useState('');
  const [dietFormCategory, setDietFormCategory] = useState<DietCategory>('Protéines');
  const [dietFormSettingsCategory, setDietFormSettingsCategory] = useState<string>('Protéines');
  const [dietFormWeight, setDietFormWeight] = useState('');
  const [dietSearch, setDietSearch] = useState('');
  const [dietModalServings, setDietModalServings] = useState<number>(2.5);

  // Diet recipe modal state
  const [showDietRecipeModal, setShowDietRecipeModal] = useState(false);
  const [dietRecipeToDelete, setDietRecipeToDelete] = useState<DietRecipe | null>(null);
  const [editingDietRecipe, setEditingDietRecipe] = useState<DietRecipe | null>(null);
  const [dietRecipeFormName, setDietRecipeFormName] = useState('');
  const [dietRecipeFormIngredients, setDietRecipeFormIngredients] = useState('');
  const [dietRecipeFormServings, setDietRecipeFormServings] = useState<number>(2.5);

  // Bulk delete diet recipes state
  const [showDeleteDietRecipesModal, setShowDeleteDietRecipesModal] = useState(false);
  const [selectedDietRecipesToDelete, setSelectedDietRecipesToDelete] = useState<Set<string>>(new Set());
  const [showConfirmBulkDeleteDietRecipes, setShowConfirmBulkDeleteDietRecipes] = useState(false);

  // Diet recipe ingredients list state
  const [dietRecipeItems, setDietRecipeItems] = useState<DietRecipeItem[]>([]);
  const [selectedFoodCategoryFilter, setSelectedFoodCategoryFilter] = useState<string>('Toutes');
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodWeight, setSelectedFoodWeight] = useState<string>('');
  const [selectedFoodUnit, setSelectedFoodUnit] = useState<string>('g');
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [editingIngredientName, setEditingIngredientName] = useState<string>('');
  const [editingIngredientWeight, setEditingIngredientWeight] = useState<string>('');
  const [editingIngredientUnit, setEditingIngredientUnit] = useState<string>('g');

  // New Food modal state
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [pendingNewFoodName, setPendingNewFoodName] = useState('');
  const [pendingNewFoodWeight, setPendingNewFoodWeight] = useState('');
  const [newFoodRecipeDietCat, setNewFoodRecipeDietCat] = useState<string>('Légumes');
  const [newFoodSettingsCat, setNewFoodSettingsCat] = useState<string>('Légumes');
  const [selectedMatchModeDiet, setSelectedMatchModeDiet] = useState<string>('__NEW__');

  const allExistingFoodNamesList = useMemo(() => {
    const set = new Set<string>();
    dietItems.forEach(i => set.add(i.name.trim()));
    (foodPortions || []).forEach(fp => set.add(fp.name.trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [dietItems, foodPortions]);

  const pendingDietSimilarSuggestions = useMemo(() => {
    if (!pendingNewFoodName) return [];
    return findSimilarDietFoods(pendingNewFoodName, allExistingFoodNamesList);
  }, [pendingNewFoodName, allExistingFoodNamesList]);

  const dietModalNameSuggestions = useMemo(() => {
    if (!dietFormName || editingDietItem) return [];
    return findSimilarDietFoods(dietFormName, allExistingFoodNamesList);
  }, [dietFormName, editingDietItem, allExistingFoodNamesList]);

  // Manage category batch modal state
  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [manageCategory, setManageCategory] = useState<DietCategory>('Protéines');
  const [selectedCategoryItemIds, setSelectedCategoryItemIds] = useState<string[]>([]);

  const handleOpenManageCategory = (category: DietCategory) => {
    setManageCategory(category);
    setSelectedCategoryItemIds([]);
    setShowManageCategoryModal(true);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedCategoryItemIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllCategoryItems = (categoryItems: DietItem[]) => {
    const categoryIds = categoryItems.map(i => i.id);
    const allSelected = categoryIds.length > 0 && categoryIds.every(id => selectedCategoryItemIds.includes(id));
    if (allSelected) {
      setSelectedCategoryItemIds(prev => prev.filter(id => !categoryIds.includes(id)));
    } else {
      setSelectedCategoryItemIds(prev => Array.from(new Set([...prev, ...categoryIds])));
    }
  };

  const handleDeleteSelectedCategoryItems = () => {
    if (selectedCategoryItemIds.length === 0) return;
    setDietItems(prev => prev.filter(item => !selectedCategoryItemIds.includes(item.id)));
    setSelectedCategoryItemIds([]);
  };

  const availableSettingsCategories = useMemo(() => {
    const cats = foodCategories && foodCategories.length > 0 
      ? foodCategories 
      : ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre'];
    return Array.from(new Set(cats));
  }, [foodCategories]);

  // Combined existing foods list for selector
  const allExistingFoodsList = useMemo(() => {
    const map = new Map<string, { name: string; category: string; source: 'régime' | 'recettes' }>();

    dietItems.forEach(item => {
      map.set(item.name.toLowerCase().trim(), {
        name: item.name,
        category: `Régime: ${item.category}`,
        source: 'régime'
      });
    });

    (foodPortions || []).forEach(fp => {
      const key = fp.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: fp.name,
          category: `Recettes: ${fp.category || 'Sans catégorie'}`,
          source: 'recettes'
        });
      }
    });

    return Array.from(map.values());
  }, [dietItems, foodPortions]);

  const filteredFoodsForSelection = useMemo(() => {
    if (!selectedFoodCategoryFilter || selectedFoodCategoryFilter === 'Toutes') {
      return allExistingFoodsList;
    }
    return allExistingFoodsList.filter(f => f.category === selectedFoodCategoryFilter);
  }, [allExistingFoodsList, selectedFoodCategoryFilter]);

  const resolveDietFoodCategory = useCallback((foodName: string, directCat?: string): DietCategory | 'Autre' => {
    const catCandidate = directCat ? directCat.replace(/^(Régime:\s*|Recettes:\s*)/i, '').trim() : '';
    if (catCandidate && ['Protéines', 'Légumes', 'Féculents', 'Desserts'].includes(catCandidate)) {
      return catCandidate as DietCategory;
    }

    const cleanName = (foodName || '').trim().toLowerCase();
    if (!cleanName) return 'Autre';

    // 1. Exact match in dietItems
    const matchedDiet = dietItems.find(di => di.name.trim().toLowerCase() === cleanName);
    if (matchedDiet && matchedDiet.category) return matchedDiet.category;

    // 2. Partial match in dietItems
    const partialDiet = dietItems.find(di => {
      const dName = di.name.trim().toLowerCase();
      return cleanName.includes(dName) || dName.includes(cleanName);
    });
    if (partialDiet && partialDiet.category) return partialDiet.category;

    // 3. Match in foodPortions / settings
    const matchedPortion = (foodPortions || []).find(fp => fp.name.trim().toLowerCase() === cleanName);
    if (matchedPortion && matchedPortion.category) {
      const pCat = matchedPortion.category.toLowerCase();
      if (/viande|poisson|charcuterie|oeuf|œuf|prot|tofu|boucherie|traiteur/i.test(pCat)) return 'Protéines';
      if (/légume|legume|fruit et|maraîcher/i.test(pCat)) return 'Légumes';
      if (/féculent|feculent|pain|boulangerie|pâte|pate|riz|céréale|cereale/i.test(pCat)) return 'Féculents';
      if (/dessert|yaourt|sucrée|sucre|crèmerie|cremerie|fromage|douceur/i.test(pCat)) return 'Desserts';
    }

    // 4. Keyword heuristics
    if (/poulet|boeuf|bœuf|veau|porc|dinde|jambon|poisson|saumon|thon|cabillaud|colin|oeuf|œuf|tofu|steak|viande|crevette|canard|bacon|saucisse|dinde|lard|protéine|proteine|merlu|lieu|hareng|maquereau|sardine|haché|hache|cordon bleu|nugget|agneau/i.test(cleanName)) return 'Protéines';
    if (/haricot|courgette|tomate|carotte|brocoli|salade|épinard|epinard|poivron|champignon|poireau|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri|betterave|avocat|asperge|poireaux|épinards|epinards|légume|legume|petits pois|artichaut|mâche|mache|roquette|endive|citrouille|potiron|butternut|courge/i.test(cleanName)) return 'Légumes';
    if (/riz|pâte|pate|coquillette|spaghetti|penne|tagliatelle|pomme de terre|patate|quinoa|boulgour|semoule|pain|lentille|pois chiche|avoine|fécule|fecule|blé|ble|maïs|mais|gnocchi|polenta|féculent|feculent|patates|nouille|vermicelle/i.test(cleanName)) return 'Féculents';
    if (/yaourt|fromage blanc|compote|pomme|banane|fruit|dessert|fraise|kiwi|orange|poire|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|crème|creme|flan|chocolat|mousse|gâteau|gateau|tarte|sorbet|glace/i.test(cleanName)) return 'Desserts';

    return 'Autre';
  }, [dietItems, foodPortions]);

  const handleOpenAddDietRecipe = () => {
    setEditingDietRecipe(null);
    setDietRecipeFormName('');
    setDietRecipeFormIngredients('');
    setDietRecipeFormServings(dietServings || 2.5);
    setDietRecipeItems([]);
    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedFoodCategoryFilter('Toutes');
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
    setShowDietRecipeModal(true);
  };

  const handleOpenEditDietRecipe = (dr: DietRecipe) => {
    setEditingDietRecipe(dr);
    setDietRecipeFormName(dr.name);
    setDietRecipeFormIngredients(typeof dr.ingredients === 'string' ? dr.ingredients : String(dr.ingredients || ''));
    setDietRecipeFormServings(dr.servings || 2.5);
    
    if (dr.items && dr.items.length > 0) {
      setDietRecipeItems(dr.items);
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const parts = dr.ingredients.split('+').map(p => {
        const trimmed = p.trim();
        const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
        if (match) {
          return { name: match[1].trim(), weight: match[2].trim() };
        }
        return { name: trimmed, weight: '' };
      }).filter(i => i.name);
      setDietRecipeItems(parts);
    } else {
      setDietRecipeItems([]);
    }

    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedFoodCategoryFilter('Toutes');
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
    setShowDietRecipeModal(true);
  };

  const handleAddIngredientToRecipe = () => {
    const trimmedName = selectedFoodName.trim();
    if (!trimmedName) {
      alert("Veuillez saisir ou choisir un nom d'aliment.");
      return;
    }

    const rawWeight = selectedFoodWeight.trim();
    let trimmedWeight = '';
    if (rawWeight) {
      if (rawWeight.toLowerCase().endsWith(selectedFoodUnit.toLowerCase()) || /[a-z]/i.test(rawWeight)) {
        trimmedWeight = rawWeight;
      } else {
        trimmedWeight = `${rawWeight} ${selectedFoodUnit}`;
      }
    }

    // Check if food exists in dietItems or foodPortions
    const existsInDiet = dietItems.some(i => i.name.toLowerCase() === trimmedName.toLowerCase());
    const existsInSettings = (foodPortions || []).some(fp => fp.name.toLowerCase() === trimmedName.toLowerCase());

    if (existsInDiet || existsInSettings) {
      // Existing food -> add directly
      const matched = allExistingFoodsList.find(f => f.name.toLowerCase() === trimmedName.toLowerCase());
      const rawCat = matched ? matched.category.replace(/^(Régime:\s*|Recettes:\s*)/i, '').trim() : undefined;
      setDietRecipeItems(prev => [...prev, { name: matched ? matched.name : trimmedName, weight: trimmedWeight, category: rawCat }]);
      setSelectedFoodName('');
      setSelectedFoodWeight('');
      setSelectedFoodUnit('g');
    } else {
      // New food -> open "Nouveau aliment" modal
      setPendingNewFoodName(trimmedName);
      setPendingNewFoodWeight(trimmedWeight);
      setNewFoodRecipeDietCat('Légumes');
      setNewFoodSettingsCat(availableSettingsCategories[0] || 'Légumes');
      setSelectedMatchModeDiet('__NEW__');
      setShowNewFoodModal(true);
    }
  };

  const handleConfirmNewFood = () => {
    const weightVal = pendingNewFoodWeight.trim();

    if (selectedMatchModeDiet !== '__NEW__' && selectedMatchModeDiet) {
      const matchedDiet = dietItems.find(di => di.name.toLowerCase() === selectedMatchModeDiet.toLowerCase());
      const matchedPortion = (foodPortions || []).find(fp => fp.name.toLowerCase() === selectedMatchModeDiet.toLowerCase());
      const rawCat = matchedDiet ? matchedDiet.category : matchedPortion ? matchedPortion.category : undefined;

      setDietRecipeItems(prev => [...prev, { name: selectedMatchModeDiet, weight: weightVal, category: rawCat }]);
      setSelectedFoodName('');
      setSelectedFoodWeight('');
      setSelectedFoodUnit('g');
      setSelectedMatchModeDiet('__NEW__');
      setShowNewFoodModal(false);
      return;
    }

    if (!pendingNewFoodName.trim()) return;

    const trimmedName = pendingNewFoodName.trim();

    // Add to dietItems if a diet category was chosen
    if (['Protéines', 'Légumes', 'Féculents', 'Desserts'].includes(newFoodRecipeDietCat)) {
      const newDietItem: DietItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        category: newFoodRecipeDietCat as DietCategory,
        weight: weightVal || '100 g'
      };
      setDietItems(prev => [...prev, newDietItem]);
    }

    // Add to settings/foodPortions via onAddFoodToSettings
    if (onAddFoodToSettings) {
      onAddFoodToSettings(trimmedName, 'g', newFoodSettingsCat);
    }

    // Add to recipe items list
    setDietRecipeItems(prev => [...prev, { name: trimmedName, weight: weightVal, category: newFoodSettingsCat }]);

    // Reset and close
    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedMatchModeDiet('__NEW__');
    setShowNewFoodModal(false);
  };

  const handleStartEditIngredient = (index: number) => {
    const item = dietRecipeItems[index];
    if (!item) return;
    setEditingIngredientIndex(index);
    setEditingIngredientName(item.name || '');
    const rawWeight = item.weight || '';
    const match = rawWeight.match(/^([0-9.,]+)\s*(.*)$/);
    if (match && match[2] && DIET_RECIPE_UNITS.includes(match[2].trim())) {
      setEditingIngredientWeight(match[1]);
      setEditingIngredientUnit(match[2].trim());
    } else if (match && match[2]) {
      setEditingIngredientWeight(match[1]);
      setEditingIngredientUnit(match[2].trim());
    } else {
      setEditingIngredientWeight(rawWeight);
      setEditingIngredientUnit('g');
    }
  };

  const handleSaveEditedIngredient = (index: number) => {
    if (!editingIngredientName.trim()) {
      alert("Veuillez saisir un nom d'aliment.");
      return;
    }
    const rawWeight = editingIngredientWeight.trim();
    let combinedWeight = '';
    if (rawWeight) {
      if (rawWeight.toLowerCase().endsWith(editingIngredientUnit.toLowerCase()) || /[a-z]/i.test(rawWeight)) {
        combinedWeight = rawWeight;
      } else {
        combinedWeight = `${rawWeight} ${editingIngredientUnit}`;
      }
    }
    setDietRecipeItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name: editingIngredientName.trim(), weight: combinedWeight } : item
    ));
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
  };

  const handleCancelEditIngredient = () => {
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
  };

  const handleRemoveIngredientFromRecipe = (index: number) => {
    if (editingIngredientIndex === index) {
      handleCancelEditIngredient();
    }
    setDietRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDietRecipe = () => {
    if (!dietRecipeFormName.trim()) {
      alert("Veuillez saisir le nom de la recette.");
      return;
    }

    const formattedIngredients = dietRecipeItems.length > 0
      ? dietRecipeItems.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ')
      : (typeof dietRecipeFormIngredients === 'string' ? dietRecipeFormIngredients.trim() : String(dietRecipeFormIngredients || '').trim());

    if (setDietRecipes) {
      if (editingDietRecipe) {
        setDietRecipes(prev => prev.map(r => r.id === editingDietRecipe.id ? {
          ...r,
          name: dietRecipeFormName.trim(),
          ingredients: formattedIngredients,
          servings: dietRecipeFormServings,
          items: dietRecipeItems
        } : r));
      } else {
        const newRecipe: DietRecipe = {
          id: Math.random().toString(36).substr(2, 9),
          name: dietRecipeFormName.trim(),
          ingredients: formattedIngredients,
          servings: dietRecipeFormServings,
          items: dietRecipeItems
        };
        setDietRecipes(prev => [...prev, newRecipe]);
      }
    }
    setShowDietRecipeModal(false);
  };

  const handleDeleteDietRecipe = (dr: DietRecipe) => {
    setDietRecipeToDelete(dr);
  };

  const filtered = (recipes || []).filter(r => 
    (selectedCat === 'Tous' || r.category === selectedCat) && 
    (r.title || "").toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const handleEdit = (e: React.MouseEvent, r: Recipe) => {
    e.stopPropagation();
    setEditingRecipe(r);
    setIsAdding(true);
  };

  const handleOpenAddDiet = (defaultCat: DietCategory = 'Protéines') => {
    setEditingDietItem(null);
    setDietFormName('');
    setDietFormCategory(defaultCat);
    const initialSettingsCat = availableSettingsCategories.includes(defaultCat)
      ? defaultCat
      : (availableSettingsCategories[0] || 'Protéines');
    setDietFormSettingsCategory(initialSettingsCat);
    setDietFormWeight('');
    setDietModalServings(2.5);
    setShowDietModal(true);
  };

  const handleOpenEditDiet = (item: DietItem) => {
    setEditingDietItem(item);
    setDietFormName(item.name);
    setDietFormCategory(item.category);

    const existingPortion = foodPortions?.find(p => p.name.toLowerCase() === item.name.toLowerCase().trim());
    if (existingPortion && existingPortion.category) {
      setDietFormSettingsCategory(existingPortion.category);
    } else {
      const initialSettingsCat = availableSettingsCategories.includes(item.category)
        ? item.category
        : (availableSettingsCategories[0] || 'Protéines');
      setDietFormSettingsCategory(initialSettingsCat);
    }

    setDietFormWeight(item.weight);
    setDietModalServings(2.5);
    setShowDietModal(true);
  };

  const handleDeleteDiet = (item: DietItem) => {
    setDietToDelete(item);
  };

  const handleSaveDietItem = () => {
    if (!dietFormName.trim()) {
      alert("Veuillez saisir le nom de l'aliment.");
      return;
    }
    if (!dietFormWeight.trim()) {
      alert("Veuillez indiquer le poids ou la portion.");
      return;
    }

    const normalizedWeight = formatScaledWeight(dietFormWeight.trim(), 2.5, dietModalServings);

    if (editingDietItem) {
      setDietItems(prev => prev.map(item => item.id === editingDietItem.id ? {
        ...item,
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight
      } : item));
    } else {
      const newItem: DietItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight
      };
      setDietItems(prev => [...prev, newItem]);
    }

    // Enregistrer dans Réglages, Aliments par rapport à Catégories (Réglages)
    if (onAddFoodToSettings) {
      onAddFoodToSettings(dietFormName.trim(), 'g', dietFormSettingsCategory);
    }

    setShowDietModal(false);
    setEditingDietItem(null);
    setDietFormName('');
    setDietFormWeight('');
    setDietModalServings(2.5);
  };

  const filteredDietItems = useMemo(() => {
    if (!dietSearch.trim()) return dietItems;
    return dietItems.filter(item => item.name.toLowerCase().includes(dietSearch.toLowerCase().trim()));
  }, [dietItems, dietSearch]);

  const proteins = useMemo(() => filteredDietItems.filter(i => i.category === 'Protéines').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const vegetables = useMemo(() => filteredDietItems.filter(i => i.category === 'Légumes').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const starches = useMemo(() => filteredDietItems.filter(i => i.category === 'Féculents').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const desserts = useMemo(() => filteredDietItems.filter(i => i.category === 'Desserts').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);

  if (isAdding) return (
    <RecipeForm 
      onSave={(r) => { addRecipe(r); setIsAdding(false); setEditingRecipe(null); }} 
      onDelete={(id) => { deleteRecipe(id); setIsAdding(false); setEditingRecipe(null); }}
      onCancel={() => { setIsAdding(false); setEditingRecipe(null); }} 
      foodPortions={foodPortions} 
      onAddFoodToSettings={onAddFoodToSettings}
      initialData={editingRecipe || undefined}
      foodCategories={foodCategories}
    />
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SÉLECTEUR 3 POSITIONS TOUT EN HAUT : RECETTES / RÉGIME / CATÉGORIES RÉGIME */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-md sm:max-w-lg">
          <button
            onClick={() => setViewMode('recipes')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'recipes'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <EXT_ICONS.Book />
            <span>Recettes</span>
          </button>
          <button
            onClick={() => setViewMode('regime')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'regime'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🥗</span>
            <span>Régime</span>
          </button>
          <button
            onClick={() => setViewMode('categories_regime')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'categories_regime'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📂</span>
            <span>Catégories Régime</span>
          </button>
        </div>
      </div>

      {/* VUE 1 : RECETTES */}
      {viewMode === 'recipes' && (
        <div className="space-y-6 animate-fadeIn">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Recettes</h2>
                <span className="text-xs font-black bg-purple-50 px-2 py-1 rounded-lg text-purple-600 border border-purple-100 shadow-sm">
                  {filtered.length}/{recipes.length}
                </span>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs font-black uppercase tracking-widest pb-1 border-b-2 border-purple-600 text-purple-600">Ma Bibliothèque</span>
              </div>
            </div>
            <button onClick={() => { setEditingRecipe(null); setIsAdding(true); }} className="bg-purple-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-100">Ajouter</button>
          </header>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Rechercher dans ma bibliothèque..." className="flex-1 p-4 rounded-2xl border border-purple-100 bg-white shadow-sm outline-none focus:ring-2 focus:ring-purple-300 font-medium" value={filter} onChange={e => setFilter(e.target.value)} />
            <select className="p-4 rounded-2xl border border-purple-100 bg-white font-bold outline-none cursor-pointer" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
              <option>Tous</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-300 italic">Aucune recette enregistrée.</div>
            ) : (
              filtered.map(r => (
                <div key={r.id} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span>
                          {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                        </div>
                        <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">⏲️ {formatTotalTime(r.prepTime + r.cookTime)}</span>
                      </div>
                      <button onClick={(e) => handleEdit(e, r)} className="bg-purple-50 p-2 rounded-xl text-purple-600 hover:bg-purple-100 transition-all shadow-sm">
                        <EXT_ICONS.Edit />
                      </button>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 break-words">{r.title}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VUE 2 : RÉGIME (RECETTES RÉGIME) */}
      {viewMode === 'regime' && (
        <div className="space-y-6 animate-fadeIn">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Recettes Régime</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100">
                  {dietRecipes.length} recettes
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Portions calculées pour {dietServings} personne{dietServings > 1 ? 's' : ''} (base 2.5 pers.)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-100 shadow-sm">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                  <span>👥</span> Personnes :
                </span>
                <select
                  value={dietServings}
                  onChange={(e) => setDietServings(parseFloat(e.target.value))}
                  className="bg-white border border-purple-200 rounded-xl px-3 py-1 font-black text-sm text-purple-900 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer shadow-sm"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddDietRecipe}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="text-lg leading-none">+</span>
                <span>Ajouter une recette régime</span>
              </button>
              <button
                onClick={() => {
                  setSelectedDietRecipesToDelete(new Set());
                  setShowDeleteDietRecipesModal(true);
                }}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-2xl font-black shadow-sm hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <EXT_ICONS.Trash />
                <span>Supprimer des recettes</span>
              </button>
            </div>
          </header>

          <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {dietRecipes.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-400 italic font-medium">
                  Aucune recette régime enregistrée.
                </div>
              ) : (
                dietRecipes.map((dr) => {
                  const baseServings = dr.servings || 2.5;
                  const currentServings = dietServings || 2.5;

                  let displayIngredients: React.ReactNode = null;
                  type ItemToDisplay = { name: string; weight: string; category?: string };
                  let itemsToDisplay: ItemToDisplay[] = [];

                  if (dr.items && dr.items.length > 0) {
                    itemsToDisplay = dr.items.map(item => ({
                      name: item.name,
                      weight: item.weight || '',
                      category: item.category
                    }));
                  } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                    const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
                    itemsToDisplay = rawParts.map(part => {
                      const trimmed = part.trim();
                      const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
                      if (match) {
                        return { name: match[1].trim(), weight: match[2].trim() };
                      }
                      return { name: trimmed, weight: '' };
                    });
                  }

                  if (itemsToDisplay.length > 0) {
                    displayIngredients = (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {itemsToDisplay.map((item, idx) => {
                          let text = '';
                          if (item.weight && typeof item.weight === 'string' && item.weight.trim()) {
                            const scaledW = scaleTextQuantity(item.weight, currentServings, baseServings);
                            text = `${item.name} ${scaledW}`.trim();
                          } else {
                            text = scaleTextQuantity(item.name || '', currentServings, baseServings);
                          }
                          
                          const cat = resolveDietFoodCategory(item.name, item.category);

                          let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                          if (cat === 'Protéines') {
                            colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                          } else if (cat === 'Légumes') {
                            colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                          } else if (cat === 'Féculents') {
                            colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                          } else if (cat === 'Desserts') {
                            colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';
                          }

                          return (
                            <span 
                              key={idx} 
                              className={`px-2.5 py-1 border rounded-xl text-[11px] font-black tracking-wide shadow-xs ${colorClass}`}
                              title={`Catégorie : ${cat}`}
                            >
                              {text}
                            </span>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={dr.id} 
                      onClick={() => {
                        setPlanningDietRecipe(dr);
                        setDietPlanDate(formatDateKey(new Date()));
                        setDietPlanMealType('lunch');
                        setDietPlanServings(dr.servings || 2.5);
                        setShowDietAvailability(false);
                      }}
                      className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:shadow-md hover:border-purple-300 transition-all group cursor-pointer"
                      title="Cliquer pour planifier au planning régime"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-black text-gray-800 text-base leading-snug group-hover:text-purple-700 transition-colors">{dr.name}</h4>
                          <span className="shrink-0 bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200" title={`Portions ajustées pour ${currentServings} pers. (Base créations: ${baseServings}p)`}>
                            👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-700 bg-white p-3 rounded-xl border border-purple-50 mt-2 whitespace-pre-wrap leading-relaxed">
                          {displayIngredients || (typeof dr.ingredients === 'string' ? dr.ingredients : '') || "Aucun aliment renseigné."}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-purple-100/60 opacity-90 group-hover:opacity-100">
                        <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                          <span>📅</span>
                          <span>Planifier</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                            title="Modifier"
                          >
                            <EXT_ICONS.Edit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Supprimer"
                          >
                            <EXT_ICONS.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VUE 3 : CATÉGORIES RÉGIME */}
      {viewMode === 'categories_regime' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER RÉGIME & PORTIONS */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Régime & Portions</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100">
                  {dietItems.length} aliments
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Portions calculées pour {dietServings} personne{dietServings > 1 ? 's' : ''} (base 2.5 pers.)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-100 shadow-sm">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                  <span>👥</span> Personnes :
                </span>
                <select
                  value={dietServings}
                  onChange={(e) => setDietServings(parseFloat(e.target.value))}
                  className="bg-white border border-purple-200 rounded-xl px-3 py-1 font-black text-sm text-purple-900 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer shadow-sm"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Filtrer les aliments..."
                value={dietSearch}
                onChange={(e) => setDietSearch(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-purple-200 flex-1 md:w-48"
              />
              <button 
                onClick={() => handleOpenAddDiet('Protéines')} 
                className="bg-purple-600 text-white px-6 py-2.5 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                <span>Ajouter un aliment</span>
              </button>
            </div>
          </header>

          {/* 4 COLONNES : PROTÉINES / LÉGUMES / FÉCULENTS / DESSERTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            
            {/* COLONNE 1 : PROTÉINES */}
            <div className="bg-white rounded-[32px] border-2 border-red-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-red-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥩</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Protéines</h3>
                    <p className="text-[10px] text-red-100 font-bold uppercase tracking-wider">Viandes, poissons, œufs, tofu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {proteins.length}
                  </span>
                </div>
              </div>

              <div className="bg-red-50/60 border-b border-red-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Protéines')}
                  className="bg-white hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Protéines"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-red-50/80 border-b border-red-100 text-xs font-black text-red-800 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-red-50">
                {proteins.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-red-50/40 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-red-100 text-red-800 font-black text-xs px-2.5 py-1 rounded-xl border border-red-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {proteins.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Protéines.
                  </div>
                )}
              </div>

              <div className="p-3 bg-red-50/40 border-t border-red-100">
                <button
                  onClick={() => handleOpenAddDiet('Protéines')}
                  className="w-full py-2 px-3 text-xs font-black text-red-700 hover:bg-red-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter une protéine</span>
                </button>
              </div>
            </div>

            {/* COLONNE 2 : LÉGUMES */}
            <div className="bg-white rounded-[32px] border-2 border-green-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-green-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥦</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Légumes</h3>
                    <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider">Légumes crus & cuits</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {vegetables.length}
                  </span>
                </div>
              </div>

              <div className="bg-green-50/60 border-b border-green-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Légumes')}
                  className="bg-white hover:bg-green-100 text-green-600 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Légumes"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-green-50/80 border-b border-green-100 text-xs font-black text-green-800 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-green-50">
                {vegetables.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-green-50/40 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-green-100 text-green-800 font-black text-xs px-2.5 py-1 rounded-xl border border-green-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {vegetables.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Légumes.
                  </div>
                )}
              </div>

              <div className="p-3 bg-green-50/40 border-t border-green-100">
                <button
                  onClick={() => handleOpenAddDiet('Légumes')}
                  className="w-full py-2 px-3 text-xs font-black text-green-700 hover:bg-green-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un légume</span>
                </button>
              </div>
            </div>

            {/* COLONNE 3 : FÉCULENTS */}
            <div className="bg-white rounded-[32px] border-2 border-amber-300 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥔</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Féculents</h3>
                    <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">Riz, pâtes, tubercules, céréales</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {starches.length}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50/60 border-b border-amber-200 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Féculents')}
                  className="bg-white hover:bg-amber-100 text-amber-600 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Féculents"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-amber-50/90 border-b border-amber-200 text-xs font-black text-amber-900 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-amber-50">
                {starches.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-amber-50/50 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-xl border border-amber-300" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {starches.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Féculents.
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50/40 border-t border-amber-200">
                <button
                  onClick={() => handleOpenAddDiet('Féculents')}
                  className="w-full py-2 px-3 text-xs font-black text-amber-800 hover:bg-amber-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un féculent</span>
                </button>
              </div>
            </div>

            {/* COLONNE 4 : DESSERTS */}
            <div className="bg-white rounded-[32px] border-2 border-pink-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-pink-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍨</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Desserts</h3>
                    <p className="text-[10px] text-pink-100 font-bold uppercase tracking-wider">Fruits, yaourts, compotes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {desserts.length}
                  </span>
                </div>
              </div>

              <div className="bg-pink-50/60 border-b border-pink-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Desserts')}
                  className="bg-white hover:bg-pink-100 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Desserts"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-pink-50/90 border-b border-pink-100 text-xs font-black text-pink-900 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-pink-50">
                {desserts.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-pink-50/50 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-pink-100 text-pink-900 font-black text-xs px-2.5 py-1 rounded-xl border border-pink-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {desserts.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Desserts.
                  </div>
                )}
              </div>

              <div className="p-3 bg-pink-50/40 border-t border-pink-100">
                <button
                  onClick={() => handleOpenAddDiet('Desserts')}
                  className="w-full py-2 px-3 text-xs font-black text-pink-700 hover:bg-pink-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un dessert</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL SUPPRIMER DES RECETTES RÉGIME */}
      {showDeleteDietRecipesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center border-b border-gray-100 shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                <EXT_ICONS.Trash />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                Supprimer des recettes
              </h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">
                Sélectionnez les recettes que vous souhaitez supprimer.
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-2">
              {dietRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic font-medium">Aucune recette enregistrée.</div>
              ) : (
                dietRecipes.map(recipe => (
                  <label key={recipe.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-red-600 rounded-lg border-gray-300 focus:ring-red-500"
                      checked={selectedDietRecipesToDelete.has(recipe.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedDietRecipesToDelete);
                        if (e.target.checked) newSet.add(recipe.id);
                        else newSet.delete(recipe.id);
                        setSelectedDietRecipesToDelete(newSet);
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{recipe.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{recipe.ingredients}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-gray-100 shrink-0 flex gap-3">
              <button 
                onClick={() => setShowDeleteDietRecipesModal(false)} 
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm"
              >
                Annuler
              </button>
              {selectedDietRecipesToDelete.size > 0 && (
                <button 
                  onClick={() => setShowConfirmBulkDeleteDietRecipes(true)} 
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-colors shadow-lg shadow-red-200 text-sm animate-fadeIn"
                >
                  Supprimer ({selectedDietRecipesToDelete.size})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION EN MASSE */}
      {showConfirmBulkDeleteDietRecipes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
                ⚠️
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Êtes-vous sûr ?</h3>
              <p className="text-gray-500 font-medium mb-8">
                Vous êtes sur le point de supprimer <strong className="text-gray-800">{selectedDietRecipesToDelete.size} recette(s)</strong>. Cette action est irréversible.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmBulkDeleteDietRecipes(false)} 
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    setDietRecipes(prev => prev.filter(r => !selectedDietRecipesToDelete.has(r.id)));
                    setShowConfirmBulkDeleteDietRecipes(false);
                    setShowDeleteDietRecipesModal(false);
                    setSelectedDietRecipesToDelete(new Set());
                  }} 
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER / MODIFIER UNE RECETTE RÉGIME */}
      {showDietRecipeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🍳
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                {editingDietRecipe ? "Modifier la recette régime" : "Ajouter une recette régime"}
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Renseignez le nom, les aliments nécessaires et le nombre de personnes.
              </p>

              <div className="space-y-5 text-left">
                {/* Champ Nom de la recette */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de la recette
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Omelette espagnole légère"
                    value={dietRecipeFormName}
                    onChange={(e) => setDietRecipeFormName(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Section Aliments nécessaires (Choix par catégories + poids + liste) */}
                <div className="bg-purple-50/50 p-4 sm:p-5 rounded-3xl border border-purple-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🥗</span> Aliments nécessaires
                    </label>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg">
                      {dietRecipeItems.length} aliment(s)
                    </span>
                  </div>

                  {/* Filtre par catégorie (Recettes / Régime) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                      Filtrer par catégorie
                    </label>
                    <select
                      value={selectedFoodCategoryFilter}
                      onChange={(e) => setSelectedFoodCategoryFilter(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-white font-semibold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    >
                      <option value="Toutes">Toutes les catégories (Recettes & Régime)</option>
                      <option value="Régime: Protéines">Régime: Protéines 🥩</option>
                      <option value="Régime: Légumes">Régime: Légumes 🥦</option>
                      <option value="Régime: Féculents">Régime: Féculents 🥔</option>
                      <option value="Régime: Desserts">Régime: Desserts 🍨</option>
                      {availableSettingsCategories.map(cat => (
                        <option key={cat} value={`Recettes: ${cat}`}>
                          Recettes: {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Champs sélection/saisie d'un aliment + poids + unité */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    {/* Choix ou nom de l'aliment */}
                    <div className="sm:col-span-6">
                      <input 
                        type="text"
                        list="diet-foods-suggestions"
                        placeholder="Choisir ou taper un aliment..."
                        value={selectedFoodName}
                        onChange={(e) => setSelectedFoodName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <datalist id="diet-foods-suggestions">
                        {filteredFoodsForSelection.map((item, idx) => (
                          <option key={`${item.name}-${idx}`} value={item.name}>
                            {item.category}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Poids / Quantité */}
                    <div className="sm:col-span-3">
                      <input 
                        type="text"
                        placeholder="Ex: 100"
                        value={selectedFoodWeight}
                        onChange={(e) => setSelectedFoodWeight(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    {/* Unité */}
                    <div className="sm:col-span-3">
                      <select
                        value={selectedFoodUnit}
                        onChange={(e) => setSelectedFoodUnit(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {DIET_RECIPE_UNITS.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredientToRecipe}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>+ Ajouter cet aliment à la recette</span>
                  </button>

                  {/* Liste des aliments enregistrés dans la recette avec nom et poids */}
                  <div className="pt-2">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-2">
                      Aliments enregistrés dans la recette :
                    </p>
                    {dietRecipeItems.length === 0 ? (
                      <div className="text-center py-4 bg-white/70 rounded-2xl border border-dashed border-purple-100 text-xs text-gray-400 italic font-medium">
                        Aucun aliment ajouté pour l'instant. Choisissez un aliment ci-dessus.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {dietRecipeItems.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between shadow-xs hover:border-purple-200 transition-all"
                          >
                            {editingIngredientIndex === index ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editingIngredientName}
                                  onChange={(e) => setEditingIngredientName(e.target.value)}
                                  placeholder="Nom de l'aliment"
                                  className="flex-1 w-full sm:w-auto p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <input
                                  type="text"
                                  value={editingIngredientWeight}
                                  onChange={(e) => setEditingIngredientWeight(e.target.value)}
                                  placeholder="Poids"
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-medium text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <select
                                  value={editingIngredientUnit}
                                  onChange={(e) => setEditingIngredientUnit(e.target.value)}
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                                >
                                  {DIET_RECIPE_UNITS.map(unit => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedIngredient(index)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                                    title="Valider la modification"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditIngredient}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  {(() => {
                                    const itemCat = resolveDietFoodCategory(item.name, item.category);
                                    let catBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                    let dotClass = 'bg-purple-500';
                                    if (itemCat === 'Protéines') {
                                      catBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                                      dotClass = 'bg-red-500';
                                    } else if (itemCat === 'Légumes') {
                                      catBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                      dotClass = 'bg-emerald-500';
                                    } else if (itemCat === 'Féculents') {
                                      catBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                      dotClass = 'bg-amber-500';
                                    } else if (itemCat === 'Desserts') {
                                      catBadgeClass = 'bg-pink-50 text-pink-700 border-pink-200';
                                      dotClass = 'bg-pink-500';
                                    }

                                    return (
                                      <>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                        <span className="font-bold text-gray-800 text-xs truncate">{item.name}</span>
                                        {item.weight && (
                                          <span className="bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                                            {item.weight}
                                          </span>
                                        )}
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${catBadgeClass}`}>
                                          {itemCat}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditIngredient(index)}
                                    className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                                    title="Modifier cet aliment"
                                  >
                                    <EXT_ICONS.Edit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIngredientFromRecipe(index)}
                                    className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                    title="Retirer cet aliment"
                                  >
                                    <EXT_ICONS.Trash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Pour (pers.) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <span>👥</span> Pour (pers.)
                  </label>
                  <select
                    value={dietRecipeFormServings}
                    onChange={(e) => setDietRecipeFormServings(parseFloat(e.target.value))}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOUTONS ANNULER ET ENREGISTRER LA RECETTE */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowDietRecipeModal(false)}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveDietRecipe}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-sm active:scale-95"
                >
                  Enregistrer la recette
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU ALIMENT */}
      {showNewFoodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
                ✨
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                Aliment à classer
              </h3>
              <p className="text-gray-500 font-medium mb-5 text-xs">
                L'aliment <span className="font-bold text-purple-700">"{pendingNewFoodName}"</span> n'est pas encore enregistré.
              </p>

              <div className="space-y-3 text-left">
                {/* Mode Créer nouveau */}
                <button
                  type="button"
                  onClick={() => setSelectedMatchModeDiet('__NEW__')}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    selectedMatchModeDiet === '__NEW__'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">✨</span>
                    <div>
                      <p className="font-black text-xs">Créer « {pendingNewFoodName} »</p>
                      <p className="text-[10px] text-gray-500">Ajouter comme nouvel aliment dans l'application</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedMatchModeDiet === '__NEW__' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                  }`}>
                    {selectedMatchModeDiet === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                  </div>
                </button>

                {/* Suggestions existantes */}
                {pendingDietSimilarSuggestions.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                      Ou utiliser un aliment existant :
                    </p>
                    <div className="space-y-1.5">
                      {pendingDietSimilarSuggestions.map(sug => {
                        const isSug = selectedMatchModeDiet === sug;
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setSelectedMatchModeDiet(sug)}
                            className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                              isSug
                                ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🔄</span>
                              <p className="font-black text-xs">Utiliser : « <span className="text-purple-700">{sug}</span> »</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSug ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                            }`}>
                              {isSug && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Champs si __NEW__ */}
                {selectedMatchModeDiet === '__NEW__' && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Nom de l'aliment
                      </label>
                      <input
                        type="text"
                        value={pendingNewFoodName}
                        onChange={(e) => setPendingNewFoodName(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Catégorie dans régime
                      </label>
                      <select
                        value={newFoodRecipeDietCat}
                        onChange={(e) => setNewFoodRecipeDietCat(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="Protéines">Régime: Protéines 🥩</option>
                        <option value="Légumes">Régime: Légumes 🥦</option>
                        <option value="Féculents">Régime: Féculents 🥔</option>
                        <option value="Desserts">Régime: Desserts 🍨</option>
                        <option value="Recette (Général)">Recette (Général) 🍲</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Catégorie dans Réglages
                      </label>
                      <select
                        value={newFoodSettingsCat}
                        onChange={(e) => setNewFoodSettingsCat(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {availableSettingsCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons Annuler et Valider */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewFoodModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNewFood}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-xs active:scale-95"
                >
                  {selectedMatchModeDiet === '__NEW__' ? "Ajouter l'aliment" : "Utiliser cet aliment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER / MODIFIER UN ALIMENT */}
      {showDietModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-10 text-center">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm ${
                dietFormCategory === 'Protéines' ? 'bg-red-100 text-red-600 border border-red-200' :
                dietFormCategory === 'Légumes' ? 'bg-green-100 text-green-600 border border-green-200' :
                dietFormCategory === 'Féculents' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-pink-100 text-pink-700 border border-pink-200'
              }`}>
                {dietFormCategory === 'Protéines' ? '🥩' : dietFormCategory === 'Légumes' ? '🥦' : dietFormCategory === 'Féculents' ? '🥔' : '🍨'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                {editingDietItem ? "Modifier l'aliment" : "Ajouter un aliment"}
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Indiquez le nom, la catégorie et le poids selon le nombre de personnes souhaité.
              </p>

              <div className="space-y-4 sm:space-y-5 text-left">
                {/* Champ Nom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de l'aliment
                  </label>
                  <input 
                    type="text"
                    value={dietFormName}
                    onChange={(e) => setDietFormName(e.target.value)}
                    placeholder="Ex: Blanc de poulet, Brocolis, Pomme, Yaourt..."
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    autoFocus
                  />
                  {dietModalNameSuggestions.length > 0 && (
                    <div className="pt-1 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 space-y-1">
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                        🔄 Aliments déjà enregistrés proches :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {dietModalNameSuggestions.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setDietFormName(sug)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-800 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Champ Catégorie (Régime) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Catégorie (Régime)
                  </label>
                  <select
                    value={dietFormCategory}
                    onChange={(e) => setDietFormCategory(e.target.value as DietCategory)}
                    className={`w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer ${
                      dietFormCategory === 'Protéines' ? 'text-red-600' :
                      dietFormCategory === 'Légumes' ? 'text-emerald-600' :
                      dietFormCategory === 'Féculents' ? 'text-amber-600' :
                      'text-pink-600'
                    }`}
                  >
                    <option value="Protéines" className="text-red-600 font-bold">Protéines</option>
                    <option value="Légumes" className="text-emerald-600 font-bold">Légumes</option>
                    <option value="Féculents" className="text-amber-600 font-bold">Féculents</option>
                    <option value="Desserts" className="text-pink-600 font-bold">Desserts</option>
                  </select>
                </div>

                {/* Champ Catégories (Réglages) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Catégories (Réglages)
                  </label>
                  <select
                    value={dietFormSettingsCategory}
                    onChange={(e) => setDietFormSettingsCategory(e.target.value)}
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    {availableSettingsCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champ Nombre de personnes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span>Nombre de personnes</span>
                    <span className="text-[10px] text-gray-400 font-semibold normal-case">Portion de référence</span>
                  </label>
                  <select
                    value={dietModalServings}
                    onChange={(e) => {
                      const newServings = parseFloat(e.target.value);
                      if (dietFormWeight.trim()) {
                        setDietFormWeight(prev => formatScaledWeight(prev, newServings, dietModalServings));
                      }
                      setDietModalServings(newServings);
                    }}
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} personne{val > 1 ? 's' : ''} {val === 2.5 ? '(Défaut 2,5)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champ Poids */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Poids / Portion (pour {dietModalServings.toString().replace('.', ',')} pers.)
                  </label>
                  <input 
                    type="text"
                    value={dietFormWeight}
                    onChange={(e) => setDietFormWeight(e.target.value)}
                    placeholder="Ex: 150 g, 200 g, 2 pièces, 1 tranche..."
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveDietItem()}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100">
              <button 
                onClick={() => { setShowDietModal(false); setEditingDietItem(null); }}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveDietItem}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95"
              >
                {editingDietItem ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDATION SUPPRESSION ALIMENT RÉGIME */}
      {dietToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🗑️
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Supprimer cet aliment ?
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm leading-relaxed">
                Voulez-vous vraiment supprimer <span className="font-black text-gray-800">« {dietToDelete.name} »</span> de votre régime ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDietToDelete(null)}
                  className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    setDietItems(prev => prev.filter(i => i.id !== dietToDelete.id));
                    if (onRemoveFoodFromSettings) {
                      onRemoveFoodFromSettings(dietToDelete.name);
                    }
                    setDietToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDATION SUPPRESSION RECETTE RÉGIME */}
      {dietRecipeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🗑️
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Supprimer cette recette ?
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm leading-relaxed">
                Voulez-vous vraiment supprimer <span className="font-black text-gray-800">« {dietRecipeToDelete.name} »</span> de vos recettes régime ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDietRecipeToDelete(null)}
                  className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    if (setDietRecipes) {
                      setDietRecipes(prev => prev.filter(r => r.id !== dietRecipeToDelete.id));
                    }
                    setDietRecipeToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER ET GÉRER LES ALIMENTS DE LA CATÉGORIE */}
      {showManageCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col">
            {/* En-tête de la modal */}
            <div className={`p-6 text-white flex items-center justify-between ${
              manageCategory === 'Protéines' ? 'bg-red-600' : 
              manageCategory === 'Légumes' ? 'bg-green-600' : 
              manageCategory === 'Féculents' ? 'bg-amber-600' : 
              'bg-pink-600'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {manageCategory === 'Protéines' ? '🥩' : 
                   manageCategory === 'Légumes' ? '🥦' : 
                   manageCategory === 'Féculents' ? '🥔' : '🍨'}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Gérer la catégorie {manageCategory}
                  </h3>
                  <p className="text-xs opacity-90 font-medium">
                    Liste complète des aliments ({dietItems.filter(i => i.category === manageCategory).length})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowManageCategoryModal(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Corps de la modal avec liste complète */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              {(() => {
                const categoryItems = dietItems.filter(i => i.category === manageCategory);
                const allSelected = categoryItems.length > 0 && categoryItems.every(i => selectedCategoryItemIds.includes(i.id));

                if (categoryItems.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 italic font-medium">
                      Aucun aliment trouvé dans la catégorie {manageCategory}.
                    </div>
                  );
                }

                return (
                  <>
                    {/* Barre d'outils haut de liste : Tout sélectionner + Bouton Supprimer */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                        <input 
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleToggleSelectAllCategoryItems(categoryItems)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                        />
                        <span>Tout sélectionner ({categoryItems.length})</span>
                      </label>

                      {selectedCategoryItemIds.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedCategoryItems}
                          className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-200 active:scale-95 cursor-pointer animate-fadeIn"
                        >
                          <EXT_ICONS.Trash />
                          <span>Supprimer ({selectedCategoryItemIds.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Liste des aliments avec cases à cocher */}
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                      {categoryItems.map((item) => {
                        const isChecked = selectedCategoryItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleSelectItem(item.id)}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors select-none ${
                              isChecked ? 'bg-red-50/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectItem(item.id);
                                }}
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-400 cursor-pointer"
                              />
                              <span className={`text-sm font-bold ${isChecked ? 'text-red-900' : 'text-gray-800'}`}>
                                {item.name}
                              </span>
                            </div>
                            <span className="text-xs font-black text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl">
                              {item.weight}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Pied de la modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowManageCategoryModal(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFIER AU PLANNING RÉGIME */}
      {planningDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* En-tête de la modale */}
            <div className="p-6 sm:p-7 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-purple-200 shrink-0">
                  🍳
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                    Planifier au planning régime
                  </h3>
                  <p className="text-xs font-bold text-purple-700 truncate">
                    « {planningDietRecipe.name} »
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {/* Bouton Les disponibilités au-dessus de la date */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowDietAvailability(true)}
                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 p-3.5 rounded-2xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Voir les disponibilités de la semaine"
                >
                  <span>💗</span>
                  <span>Les disponibilités</span>
                </button>
              </div>

              {/* Champ Date */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>📅</span> Date
                </label>
                <input 
                  type="date"
                  value={dietPlanDate}
                  onChange={(e) => setDietPlanDate(e.target.value)}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Liste déroulante : Déjeuner / Dîner */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>🍽️</span> Repas
                </label>
                <select
                  value={dietPlanMealType}
                  onChange={(e) => setDietPlanMealType(e.target.value as 'lunch' | 'dinner')}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="lunch">Déjeuner</option>
                  <option value="dinner">Dîner</option>
                </select>
              </div>

              {/* Sélecteur de personnes : par défaut 2.5 pers */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>👥</span> Nombre de personnes
                </label>
                <select
                  value={dietPlanServings}
                  onChange={(e) => setDietPlanServings(parseFloat(e.target.value))}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pied de modal avec boutons */}
            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setPlanningDietRecipe(null)}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={handleProgrammerAuPlanningRegime}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                Programmer au planning régime
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPONIBILITÉS DE LA SEMAINE RÉGIME */}
      {showDietAvailability && planningDietRecipe && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="p-6 md:p-7 border-b flex justify-between items-center bg-pink-50/40">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-pink-500">💗</span> Les disponibilités (Planning Régime)
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  « {planningDietRecipe.name} » • Cliquez sur un créneau pour le sélectionner
                </p>
              </div>
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg transition-all cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() - 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine précédente"
                >
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-gray-700 min-w-[220px] text-center">
                  Semaine du {dietAvailabilityWeekDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() + 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine suivante"
                >
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(dietAvailabilityWeekDate);
                  d.setDate(dietAvailabilityWeekDate.getDate() + i);
                  const dateStr = formatDateKey(d);
                  const dayPlan = mealPlan[dateStr];
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/80 p-3.5 rounded-[24px] border border-gray-100 space-y-2.5">
                      <p className="text-[11px] font-black text-center uppercase tracking-widest text-gray-500 border-b border-gray-200/60 pb-2">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      {(['lunch', 'dinner'] as const).map(mType => {
                        const mKey = mType === 'lunch' ? 'dietLunch' : 'dietDinner';
                        const dietMeal = dayPlan?.[mKey];
                        const existingDietRecipeId = dietMeal?.dietRecipe;
                        const isCurrentRecipe = existingDietRecipeId === planningDietRecipe.id;
                        const hasDietRecipe = !!existingDietRecipeId;
                        const hasAliments = !!(dietMeal?.protein || dietMeal?.vegetable || dietMeal?.starch || dietMeal?.dessert);
                        const isOccupied = hasDietRecipe || hasAliments;

                        let occupantLabel = 'Disponible';
                        if (isCurrentRecipe) {
                          occupantLabel = 'Déjà ici';
                        } else if (hasDietRecipe) {
                          const existingDr = dietRecipes.find(r => r.id === existingDietRecipeId);
                          occupantLabel = existingDr ? existingDr.name : 'Recette planifiée';
                        } else if (hasAliments) {
                          occupantLabel = 'Aliments choisis';
                        }

                        const isSelected = dietPlanDate === dateStr && dietPlanMealType === mType;
                        const isDisabled = isOccupied && !isCurrentRecipe;

                        return (
                          <button
                            key={mType}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType(mType);
                              setShowDietAvailability(false);
                            }}
                            className={`w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-1 
                              ${isDisabled ? 'opacity-60 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                              ${!isDisabled && isSelected ? 'ring-2 ring-purple-600 bg-purple-100 border-purple-300 text-purple-900 scale-105 shadow-md' :
                                isCurrentRecipe ? 'bg-green-100 border-green-300 text-green-700' :
                                isOccupied ? 'bg-amber-50/90 border-amber-200 text-amber-800' :
                                mType === 'lunch' ? 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50 hover:scale-[1.02] shadow-xs' :
                                'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-[1.02] shadow-xs'
                              }
                            `}
                          >
                            <span className="font-extrabold">{mType === 'lunch' ? 'Midi (Déjeuner)' : 'Soir (Dîner)'}</span>
                            <span className="text-[9px] font-bold truncate max-w-full">{occupantLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} recipes={recipes} mealPlan={mealPlan} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
};

const RecipeDetail: React.FC<{ 
  recipe: Recipe; 
  recipes: Recipe[];
  mealPlan: Record<string, MealPlanDay>;
  onClose: () => void; 
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit?: (recipe: Recipe) => void;
}> = ({ recipe, recipes, mealPlan, onClose, onAddToShopping, updateMealPlan, setSentMeals, onEdit }) => {
  const [servings, setServings] = useState(recipe.servings || 4);
  const [planDate, setPlanDate] = useState('');
  const [mealType, setMealType] = useState<'lunch' | 'dinner' | 'extra'>(
    recipe.category === 'Viennoiserie' || recipe.category === 'Sauce' ? 'extra' : 'lunch'
  );
  const [slotType, setSlotType] = useState<'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces'>(
    recipe.category === 'Viennoiserie' ? 'viennoiseries' : recipe.category === 'Sauce' ? 'sauces' : 'recipe1'
  );
  const [extraIndex, setExtraIndex] = useState(0);
  const [conflict, setConflict] = useState<{ existingRecipeTitle: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<'plan' | 'planAndSend' | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityWeekDate, setAvailabilityWeekDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    // Start on Saturday (6). If today is Sat(6), diff=0. If Sun(0), diff=-1. If Mon(1), diff=-2...
    const diff = d.getDate() - (day === 6 ? 0 : day + 1);
    return new Date(d.setDate(diff));
  });
  const ratio = servings / (recipe.servings || 4);

  useEffect(() => {
    if (recipe.category === 'Viennoiserie' || recipe.category === 'Gâteaux') {
      setSlotType('viennoiseries');
      setMealType('extra');
    } else if (recipe.category === 'Sauce' || recipe.category === 'Coulis') {
      setSlotType('sauces');
      setMealType('extra');
    } else {
      setSlotType('recipe1');
      setMealType('lunch');
    }
  }, [recipe.category]);

  const checkConflict = () => {
    if (!planDate) return false;
    let existingId: string | undefined;
    if (mealType === 'extra') {
      existingId = mealPlan[planDate]?.[slotType as 'viennoiseries' | 'sauces']?.[extraIndex];
    } else {
      existingId = mealPlan[planDate]?.[mealType as 'lunch' | 'dinner']?.[slotType as 'recipe1' | 'recipe2'];
    }
    if (existingId && existingId !== recipe.id) {
      const existing = recipes.find(r => r.id === existingId);
      setConflict({ existingRecipeTitle: existing?.title || 'Inconnue' });
      return true;
    }
    return false;
  };

  const executePlan = () => {
    updateMealPlan(planDate, mealType, slotType, recipe.id, mealType === 'extra' ? extraIndex : undefined);
    alert(`Recette programmée pour le ${planDate} (${mealType === 'lunch' ? 'Midi' : mealType === 'dinner' ? 'Soir' : 'Extra'}) - ${slotType === 'recipe1' ? 'Recette 1' : slotType === 'recipe2' ? 'Recette 2' : slotType === 'viennoiseries' ? 'Viennoiserie et Gâteau' : 'Sauce et Coulis'}`);
    setConflict(null);
    setPendingAction(null);
  };

  const executePlanAndSend = () => {
    updateMealPlan(planDate, mealType, slotType, recipe.id, mealType === 'extra' ? extraIndex : undefined);
    onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title);
    const mealKey = mealType === 'extra' ? `${planDate}-${slotType}-${extraIndex}` : `${planDate}-${mealType}-${slotType}`;
    setSentMeals(prev => new Set(prev).add(mealKey));
    alert(`Recette planifiée et ingrédients envoyés !`);
    setConflict(null);
    setPendingAction(null);
    onClose();
  };

  const handlePlan = () => {
    if (!planDate) { alert("Veuillez choisir une date."); return; }
    if (checkConflict()) {
      setPendingAction('plan');
    } else {
      executePlan();
    }
  };

  const handlePlanAndSend = () => {
    if (!planDate) { alert("Veuillez choisir une date pour le planning."); return; }
    if (checkConflict()) {
      setPendingAction('planAndSend');
    } else {
      executePlanAndSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-fadeIn p-4 md:p-8">
      {conflict && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">⚠️</div>
            <h3 className="text-xl font-black text-gray-800">Conflit de Planning</h3>
            <p className="text-gray-500 font-medium">
              La recette <span className="text-purple-600 font-bold">"{conflict.existingRecipeTitle}"</span> est déjà programmée pour ce créneau.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => {
                  if (pendingAction === 'plan') executePlan();
                  else if (pendingAction === 'planAndSend') executePlanAndSend();
                }}
                className="w-full p-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all"
              >
                Remplacer la recette
              </button>
              <button 
                onClick={() => setConflict(null)} 
                className="w-full p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all"
              >
                Changer la date
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{recipe.title}</h2>
                <div className="flex gap-2">
                  {recipe.tags?.includes('TM7') && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-sm">TM7</span>}
                </div>
              </div>
              {onEdit && (
                <button 
                  onClick={() => onEdit(recipe)}
                  className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-purple-100 shadow-xs transition-all shrink-0"
                  title="Modifier cette recette"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-purple-50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Planifier au menu</p>
                <button 
                  onClick={() => setShowAvailability(true)}
                  className="text-[10px] font-black bg-pink-50 text-pink-500 px-3 py-1.5 rounded-xl border border-pink-100 hover:bg-pink-100 transition-all shadow-sm"
                >
                  💗 Les disponibilités
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-200" 
                  value={planDate} 
                  onChange={e => setPlanDate(e.target.value)} 
                />
                <div className="grid grid-cols-2 gap-3">
                  <select className="p-3 border border-gray-100 rounded-2xl font-bold outline-none cursor-pointer bg-gray-50 text-xs" value={mealType} onChange={e => setMealType(e.target.value as any)}>
                    <option value="lunch">Midi</option>
                    <option value="dinner">Soir</option>
                    <option value="extra">Extra</option>
                  </select>
                  <select className="p-3 border border-gray-100 rounded-2xl font-bold outline-none cursor-pointer bg-gray-50 text-xs" value={slotType} onChange={e => setSlotType(e.target.value as any)}>
                    <option value="recipe1">Recette 1</option>
                    <option value="recipe2">Recette 2</option>
                    <option value="viennoiseries">Viennoiseries et Gâteaux</option>
                    <option value="sauces">Sauces et Coulis</option>
                  </select>
                </div>
                {mealType === 'extra' && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Position (1-6)</label>
                    <select className="w-full p-3 border border-gray-100 rounded-2xl font-bold outline-none cursor-pointer bg-gray-50 text-xs" value={extraIndex} onChange={e => setExtraIndex(Number(e.target.value))}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <option key={i} value={i}>Emplacement #{i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button 
                onClick={handlePlan}
                className="w-full bg-purple-50 text-purple-600 p-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all"
              >
                📅 Programmer au planning
              </button>
            </div>

            <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-2xl">
              <span className="font-black text-xs text-purple-600 pl-2">Portions :</span>
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 bg-white rounded-lg font-black">-</button>
              <span className="font-black w-8 text-center">{servings}</span>
              <button onClick={() => setServings(s => Math.min(s + 1, recipe.maxServings || recipe.servings))} className="w-8 h-8 bg-white rounded-lg font-black">+</button>
              <span className="font-black text-xs text-purple-400 pr-2">/ 👥 Pers Max {recipe.maxServings || recipe.servings}</span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title)}
                className="w-full bg-purple-600 text-white p-5 rounded-3xl font-black shadow-lg shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                🚀 Envoyer aux courses
              </button>
              <button 
                onClick={handlePlanAndSend}
                className="w-full bg-green-600 text-white p-5 rounded-3xl font-black shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                ✅ Programmer & Envoyer
              </button>
            </div>
          </div>
          <div className="space-y-6 bg-gray-50 p-6 rounded-[32px]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800">Ingrédients</h3>
              <span className="text-xs font-black text-purple-400">Total : {formatTotalTime(recipe.prepTime + recipe.cookTime)}</span>
            </div>
            <ul className="space-y-3">
              {(recipe.ingredients || []).map((ing, i) => (
                <li key={i} className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">{ing.name}</span>
                  <span className="font-black text-purple-600">{Math.round(ing.amount * ratio * 100) / 100} {ing.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            {(recipe.instructions || []).map((step, i) => (
              <div key={i} className="flex gap-4">
                <p className="text-gray-600 leading-relaxed font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAvailability && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-[95vw] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <div className="p-8 border-b flex justify-between items-center bg-pink-50/30">
              <div>
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-pink-500">💗</span> Disponibilités de la semaine
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {recipe.title} • {slotType === 'recipe1' ? 'Recette 1' : slotType === 'recipe2' ? 'Recette 2' : slotType === 'viennoiseries' ? 'Viennoiserie et Gâteau' : 'Sauce et Coulis'}
                </p>
              </div>
              <button onClick={() => setShowAvailability(false)} className="p-4 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-all font-black text-xl">×</button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button 
                  onClick={() => {
                    const next = new Date(availabilityWeekDate);
                    next.setDate(availabilityWeekDate.getDate() - 7);
                    setAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600"
                >
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-gray-600 min-w-[200px] text-center">
                  Semaine du {availabilityWeekDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button 
                  onClick={() => {
                    const next = new Date(availabilityWeekDate);
                    next.setDate(availabilityWeekDate.getDate() + 7);
                    setAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600"
                >
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(availabilityWeekDate);
                  d.setDate(availabilityWeekDate.getDate() + i);
                  const dateStr = formatDateKey(d);
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/50 p-4 rounded-[32px] border border-gray-100 space-y-3">
                      <p className="text-[10px] font-black text-center uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      {(['lunch', 'dinner'] as const).map(type => 
                        (['recipe1', 'recipe2'] as const).map(slot => {
                          const existingId = mealPlan[dateStr]?.[type]?.[slot];
                          const isOccupied = !!existingId;
                          const isCurrentRecipe = existingId === recipe.id;

                          return (
                            <button
                              key={`${type}-${slot}`}
                              disabled={isOccupied && !isCurrentRecipe}
                              onClick={() => {
                                if (isCurrentRecipe) return;
                                updateMealPlan(dateStr, type, slot, recipe.id);
                                setShowAvailability(false);
                              }}
                              className={`w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1
                                ${isCurrentRecipe ? 'bg-green-100 border-green-200 text-green-600 cursor-default' : 
                                  isOccupied ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50' : 
                                  type === 'lunch' ? 'bg-white border-pink-100 text-pink-500 hover:bg-pink-50 hover:scale-[1.02] shadow-sm' :
                                  'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-[1.02] shadow-sm'}
                              `}
                            >
                              <span>{type === 'lunch' ? 'Midi' : 'Soir'} {slot === 'recipe1' ? '1' : '2'}</span>
                              {isCurrentRecipe ? 'Déjà ici' : isOccupied ? 'Occupé' : 'Disponible'}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
              
              {(() => {
                const isAlreadyInWeek = Array.from({ length: 7 }, (_, j) => {
                  const dj = new Date(availabilityWeekDate);
                  dj.setDate(availabilityWeekDate.getDate() + j);
                  const djStr = formatDateKey(dj);
                  const plan = mealPlan[djStr];
                  return (plan?.lunch?.recipe1 === recipe.id || plan?.lunch?.recipe2 === recipe.id || plan?.dinner?.recipe1 === recipe.id || plan?.dinner?.recipe2 === recipe.id);
                }).some(v => v);

                return isAlreadyInWeek && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-600 text-xs font-bold text-center animate-pulse">
                    ℹ️ Cette recette est déjà programmée cette semaine.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecipeForm: React.FC<{ 
  onSave: (r: Recipe) => void; 
  onDelete?: (id: string) => void;
  onCancel: () => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  initialData?: Recipe;
  foodCategories: string[];
}> = ({ onSave, onDelete, onCancel, foodPortions, onAddFoodToSettings, initialData, foodCategories }) => {
  const [formData, setFormData] = useState<Partial<Recipe>>(initialData || { 
    title: '', 
    servings: 4, 
    category: CATEGORIES[1], 
    ingredients: [], 
    instructions: [''],
    prepTime: 15,
    cookTime: 20,
    tags: []
  });

  const [tm7Checked, setTm7Checked] = useState(initialData?.tags?.includes('TM7') || false);
  const [pendingIng, setPendingIng] = useState<Ingredient>({ name: '', amount: 1, unit: 'g' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Épicerie');
  const [selectedMatchMode, setSelectedMatchMode] = useState<string>('__NEW__');

  const allFoodNamesList = useMemo(() => {
    const names = (foodPortions || []).map(fp => fp.name.trim()).filter(Boolean);
    return Array.from(new Set(names)).sort((a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [foodPortions]);

  const similarSuggestions = useMemo(() => {
    if (!pendingIng.name) return [];
    return findSimilarDietFoods(pendingIng.name, allFoodNamesList);
  }, [pendingIng.name, allFoodNamesList]);

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/œ/g, "oe")
      .trim();
  };

  const totalTime = (formData.prepTime || 0) + (formData.cookTime || 0);

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const addPendingIngredient = () => {
    const trimmedName = pendingIng.name.trim();
    if (!trimmedName) return;

    const finalName = capitalizeFirstLetter(trimmedName);
    const ingredientToAdd = { ...pendingIng, name: finalName };
    
    const normalizedInput = normalizeString(finalName);
    const existing = foodPortions.find(fp => normalizeString(fp.name) === normalizedInput);

    if (!existing) {
      setPendingIng(ingredientToAdd); // Update pendingIng with capitalized name before showing modal
      setSelectedMatchMode('__NEW__');
      setShowNewFoodModal(true);
      return;
    }

    onAddFoodToSettings(finalName, pendingIng.unit);
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ingredientToAdd]
    }));
    setPendingIng({ name: '', amount: 1, unit: 'g' });
  };

  const confirmNewFood = () => {
    if (selectedMatchMode !== '__NEW__' && selectedMatchMode) {
      // Use existing food chosen from suggestions
      const matched = (foodPortions || []).find(fp => fp.name.toLowerCase() === selectedMatchMode.toLowerCase());
      const cat = matched?.category || 'Épicerie';
      onAddFoodToSettings(selectedMatchMode, pendingIng.unit, cat);
      setFormData(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), { ...pendingIng, name: selectedMatchMode }]
      }));
    } else {
      // Create new food
      onAddFoodToSettings(pendingIng.name, pendingIng.unit, newFoodCategory);
      setFormData(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), { ...pendingIng }]
      }));
    }
    setPendingIng({ name: '', amount: 1, unit: 'g' });
    setSelectedMatchMode('__NEW__');
    setShowNewFoodModal(false);
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  const editIngredient = (index: number) => {
    const ing = (formData.ingredients || [])[index];
    setPendingIng(ing);
    removeIngredient(index);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[40px] shadow-2xl space-y-10 animate-slideUp relative">
      <div className="flex justify-between items-center">
        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{initialData ? 'Modifier la Recette' : 'Nouvelle Recette'}</h3>
        {initialData && onDelete && (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
            title="Supprimer la recette"
          >
            <EXT_ICONS.Trash />
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <EXT_ICONS.Trash />
            </div>
            <h3 className="text-xl font-black text-gray-800">Supprimer la recette ?</h3>
            <p className="text-gray-500 font-medium">Cette action est irréversible. Voulez-vous continuer ?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all">Annuler</button>
              <button 
                onClick={() => {
                  if (initialData?.id) onDelete(initialData.id);
                  setShowDeleteConfirm(false);
                }} 
                className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFoodModal && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-slideUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-1 text-2xl">✨</div>
            <h3 className="text-xl font-black text-gray-800">Aliment à classer</h3>
            <p className="text-gray-500 font-medium text-xs">
              L'aliment <span className="text-purple-600 font-bold">"{pendingIng.name}"</span> n'est pas encore enregistré.
            </p>

            <div className="space-y-3 text-left">
              {/* Option Nouveau */}
              <button
                type="button"
                onClick={() => setSelectedMatchMode('__NEW__')}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectedMatchMode === '__NEW__'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✨</span>
                  <div>
                    <p className="font-black text-xs">Créer « {pendingIng.name} »</p>
                    <p className="text-[10px] text-gray-500">Ajouter comme nouvel aliment dans vos réglages</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMatchMode === '__NEW__' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                }`}>
                  {selectedMatchMode === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                </div>
              </button>

              {/* Option Suggestions similaires */}
              {similarSuggestions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                    Ou utiliser un aliment existant :
                  </p>
                  <div className="space-y-1.5">
                    {similarSuggestions.map(sug => {
                      const isSug = selectedMatchMode === sug;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setSelectedMatchMode(sug)}
                          className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSug
                              ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🔄</span>
                            <p className="font-black text-xs">Utiliser : « <span className="text-purple-700">{sug}</span> »</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSug ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                          }`}>
                            {isSug && <span className="text-[10px] font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sélection catégorie si __NEW__ */}
              {selectedMatchMode === '__NEW__' && (
                <div className="pt-2 animate-fadeIn space-y-1">
                  <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest pl-1">
                    Catégorie dans Réglages
                  </label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    value={newFoodCategory}
                    onChange={e => setNewFoodCategory(e.target.value)}
                  >
                    {foodCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewFoodModal(false)} className="flex-1 p-3.5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs active:scale-95 transition-all">Annuler</button>
              <button 
                onClick={confirmNewFood} 
                className="flex-1 p-3.5 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-100 active:scale-95 transition-all"
              >
                {selectedMatchMode === '__NEW__' ? "Ajouter" : "Utiliser cet aliment"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Titre de la recette</label>
            <input className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-purple-200" placeholder="Ex: Gratin de courgettes..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 transition-all">
            <input 
              type="checkbox" 
              id="tm7" 
              className="w-5 h-5 accent-green-600 rounded cursor-pointer" 
              checked={tm7Checked} 
              onChange={e => setTm7Checked(e.target.checked)} 
            />
            <label htmlFor="tm7" className="text-sm font-black text-green-600 cursor-pointer uppercase tracking-widest">Appareil TM7</label>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Catégorie</label>
            <select className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">👥 Pour (pers.)</label>
                <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.servings} onChange={e => {
                  const newServings = Number(e.target.value);
                  if (formData.maxServings && newServings > formData.maxServings) {
                    setFormData({ ...formData, servings: formData.maxServings })
                  } else {
                    setFormData({ ...formData, servings: newServings })
                  }
                }} />
              </div>
              {tm7Checked && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">👥 Pers max</label>
                  <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.maxServings} onChange={e => setFormData({ ...formData, maxServings: Number(e.target.value) })} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">⏲️ Préparation (min)</label>
                <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.prepTime} onChange={e => setFormData({ ...formData, prepTime: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">🔥 Cuisson (min)</label>
                <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.cookTime} onChange={e => setFormData({ ...formData, cookTime: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <label className="text-[10px] font-black text-green-400 uppercase tracking-widest ml-2">⌛ Temps Total</label>
              <div className="w-full p-4 border border-green-50 rounded-2xl bg-green-50 font-black text-green-600 flex items-center justify-center">
                {formatTotalTime(totalTime)}
              </div>
            </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Aliments nécessaires</label>
            <div className="grid grid-cols-12 gap-3 bg-white p-4 border border-purple-100 rounded-[28px] shadow-sm">
              <input 
                type="number" 
                placeholder="Qté"
                className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-black text-xs outline-none focus:ring-2 focus:ring-purple-200 transition-all" 
                value={pendingIng.amount} 
                onFocus={(e) => e.target.select()}
                onChange={e => setPendingIng({ ...pendingIng, amount: Number(e.target.value) })} 
              />
              <select 
                className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-[10px] outline-none" 
                value={pendingIng.unit} 
                onChange={e => setPendingIng({ ...pendingIng, unit: e.target.value })}
              >
                <option value="boite">boite</option>
                <option value="C.à C">C.à C</option>
                <option value="C.à S">C.à S</option>
                <option value="cl">cl</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="unité">u.</option>
              </select>
              <div className="col-span-6 relative">
                <input 
                  list="recipe-food-suggestions"
                  className="w-full p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-xs outline-none focus:ring-2 focus:ring-purple-200 transition-all" 
                  placeholder="Nom aliment..." 
                  value={pendingIng.name} 
                  onChange={e => setPendingIng({ ...pendingIng, name: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && addPendingIngredient()}
                />
                <datalist id="recipe-food-suggestions">
                  {(foodPortions || []).filter(fp => {
                    const search = normalizeString(pendingIng.name);
                    if (!search) return true;
                    return normalizeString(fp.name).includes(search);
                  }).map(fp => <option key={fp.id} value={fp.name} />)}
                </datalist>
              </div>
              <button onClick={addPendingIngredient} className="col-span-12 mt-3 bg-purple-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 active:scale-95 transition-all">Ajouter à la liste</button>
            </div>
          </div>
          
          <div className="space-y-2 border-t border-gray-50 pt-4">
            {(formData.ingredients || []).length === 0 ? (
              <p className="text-center text-xs text-gray-300 italic py-10">Aucun aliment ajouté</p>
            ) : (
              (formData.ingredients || []).map((ing, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 animate-slideUp group">
                  <div className="flex gap-3 items-center">
                    <span className="font-black text-purple-600 text-xs w-14">{ing.amount} {ing.unit}</span>
                    <span className="font-bold text-gray-700 text-sm">{ing.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editIngredient(idx)} className="text-blue-400 hover:text-blue-600 transition-colors p-2" title="Modifier">
                      <EXT_ICONS.Edit />
                    </button>
                    <button onClick={() => removeIngredient(idx)} className="text-red-300 hover:text-red-500 font-black px-3 transition-colors">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-50">
         <button onClick={onCancel} className="flex-1 p-5 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all">Annuler</button>
         <button 
           onClick={() => {
             if(!formData.title || (formData.ingredients || []).length === 0) {
               alert("Veuillez remplir le titre et au moins un ingrédient.");
               return;
             }
             const baseTags = (formData.tags || []).filter(t => t !== 'TM7');
             const tags = tm7Checked ? [...baseTags, 'TM7'] : baseTags;
             onSave({ 
               ...formData as Recipe, 
               id: formData.id || Math.random().toString(36).substr(2, 9), 
               tags: tags, 
               description: formData.description || '',
               instructions: formData.instructions || ['Mélanger et servir.']
             });
           }} 
           className="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-100 active:scale-95 transition-all"
         >
           {initialData ? 'Mettre à jour' : 'Enregistrer la recette'}
         </button>
      </div>
    </div>
  );
};

const normalizeSearchText = (text: string) => {
  return (text || '')
    .toLowerCase()
    .replace(/é/g, '___e_acute___')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/___e_acute___/g, 'é')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9é\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isWordMatch = (targetWord: string, queryWord: string): boolean => {
  if (!targetWord || !queryWord) return false;
  return targetWord === queryWord;
};

const doesTargetMatchQuery = (targetText: string, query: string) => {
  const normTarget = normalizeSearchText(targetText);
  const normQuery = normalizeSearchText(query);
  if (!normTarget || !normQuery) return false;

  const targetWords = normTarget.split(/\s+/).filter(Boolean);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return false;

  return queryTokens.every(qTok => 
    targetWords.some(tWord => isWordMatch(tWord, qTok))
  );
};

const countRecipeMatches = (r: Recipe, searchTerms: string[], appliance: string): number => {
  if (appliance === 'Thermomix TM7' && !r.tags?.includes('TM7')) return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    const matchesIng = (r.ingredients || []).some(ri => {
      const ingName = ri.name || '';
      return doesTargetMatchQuery(ingName, term);
    });
    if (matchesIng) {
      score++;
    }
  }
  return score;
};

const countDietRecipeMatches = (dr: DietRecipe, searchTerms: string[], appliance: string): number => {
  if (appliance === 'Thermomix TM7') return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    let matched = false;
    if (dr.items && dr.items.length > 0) {
      if (dr.items.some(item => doesTargetMatchQuery(item.name || '', term))) {
        matched = true;
      }
    }
    if (!matched && dr.ingredients && typeof dr.ingredients === 'string') {
      if (doesTargetMatchQuery(dr.ingredients, term)) {
        matched = true;
      }
    }
    if (matched) {
      score++;
    }
  }
  return score;
};

const doesRecipeMatchTerms = (r: Recipe, searchTerms: string[], appliance: string) => {
  return countRecipeMatches(r, searchTerms, appliance) > 0;
};

const doesDietRecipeMatchTerms = (dr: DietRecipe, searchTerms: string[], appliance: string) => {
  return countDietRecipeMatches(dr, searchTerms, appliance) > 0;
};

const RecipeSearch: React.FC<{ 
  recipes: Recipe[]; 
  dietRecipes?: DietRecipe[];
  setDietRecipes?: React.Dispatch<React.SetStateAction<DietRecipe[]>>;
  dietItems?: DietItem[];
  setDietItems?: React.Dispatch<React.SetStateAction<DietItem[]>>;
  dietServings?: number;
  setDietServings?: React.Dispatch<React.SetStateAction<number>>;
  mealPlan: Record<string, MealPlanDay>;
  addRecipe: (r: Recipe) => void;
  deleteRecipe?: (id: string) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  updateDietMealPlan?: (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe', itemId: string | undefined) => void;
  foodPortions: FoodPortion[];
  foodCategories?: string[];
  onAddFoodToSettings?: (name: string, unit: string, category?: string) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  settings?: UserSettings;
}> = ({ 
  recipes, 
  dietRecipes = [], 
  setDietRecipes,
  dietItems = [], 
  setDietItems,
  dietServings = 2.5, 
  setDietServings, 
  mealPlan, 
  addRecipe, 
  deleteRecipe,
  onAddToShopping, 
  updateMealPlan, 
  updateDietMealPlan, 
  foodPortions, 
  foodCategories = FOOD_CATEGORIES,
  onAddFoodToSettings,
  setSentMeals, 
  settings 
}) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputIng, setInputIng] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliance, setAppliance] = useState('Standard');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Classic recipe editing state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Diet recipe editing state
  const [editingDietRecipe, setEditingDietRecipe] = useState<DietRecipe | null>(null);
  const [editDietRecipeName, setEditDietRecipeName] = useState('');
  const [editDietRecipeServings, setEditDietRecipeServings] = useState(2.5);
  const [editDietRecipeItems, setEditDietRecipeItems] = useState<{ name: string; weight: string; unit?: string; category?: string }[]>([]);
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('Toutes');
  const [editSelectedFoodName, setEditSelectedFoodName] = useState('');
  const [editSelectedFoodWeight, setEditSelectedFoodWeight] = useState('100');
  const [editSelectedFoodUnit, setEditSelectedFoodUnit] = useState('g');
  const [editingIngredientIdx, setEditingIngredientIdx] = useState<number | null>(null);
  const [editingIngName, setEditingIngName] = useState('');
  const [editingIngWeight, setEditingIngWeight] = useState('');
  const [editingIngUnit, setEditingIngUnit] = useState('g');
  const [showDeleteDietConfirm, setShowDeleteDietConfirm] = useState(false);

  // Diet planning modal state in search
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [planningDietRecipe, setPlanningDietRecipe] = useState<DietRecipe | null>(null);
  const [dietPlanDate, setDietPlanDate] = useState<string>(() => formatDateKey(new Date()));
  const [dietPlanMealType, setDietPlanMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [dietPlanServings, setDietPlanServings] = useState<number>(dietServings || 2.5);
  const [showDietAvailability, setShowDietAvailability] = useState(false);
  const [dietAvailabilityWeekDate, setDietAvailabilityWeekDate] = useState(() => {
    const d = new Date();
    const startDay = settings?.startDay ?? 1;
    const day = d.getDay();
    const diff = (day - startDay + 7) % 7;
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  const DIET_UNITS_LIST = ['g', 'kg', 'ml', 'cl', 'l', 'cuillère(s)', 'c.à.s', 'c.à.c', 'pièce(s)', 'pincée(s)', 'tranche(s)', 'pot(s)', 'œufs'];

  const handleOpenEditDietRecipe = (dr: DietRecipe) => {
    setEditingDietRecipe(dr);
    setEditDietRecipeName(dr.name || '');
    setEditDietRecipeServings(dr.servings || 2.5);
    setShowDeleteDietConfirm(false);
    setEditingIngredientIdx(null);
    setEditSelectedFoodName('');
    setEditSelectedFoodWeight('100');
    setEditSelectedFoodUnit('g');
    setEditSelectedCategory('Toutes');

    let items: { name: string; weight: string; unit?: string; category?: string }[] = [];
    if (dr.items && dr.items.length > 0) {
      items = dr.items.map(item => {
        const rawW = item.weight || '';
        const match = rawW.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
        if (match) {
          return {
            name: item.name,
            weight: match[1],
            unit: match[2]?.trim() || 'g',
            category: item.category
          };
        }
        return {
          name: item.name,
          weight: rawW,
          unit: 'g',
          category: item.category
        };
      });
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
      items = rawParts.map(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(.*?)\s+([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-ZÀ-ÿ\.\/]+)?$/i);
        if (match) {
          return {
            name: match[1].trim(),
            weight: match[2].trim(),
            unit: match[3]?.trim() || 'g'
          };
        }
        return { name: trimmed, weight: '', unit: '' };
      });
    }
    setEditDietRecipeItems(items);
  };

  const handleAddEditIngredient = () => {
    const trimmed = editSelectedFoodName.trim();
    if (!trimmed) {
      alert("Veuillez saisir ou choisir un aliment.");
      return;
    }
    const weightVal = editSelectedFoodWeight.trim() || '100';
    const unitVal = editSelectedFoodUnit || 'g';
    const cat = resolveDietFoodCategory(trimmed, undefined, dietItems, foodPortions);

    setEditDietRecipeItems(prev => [
      ...prev,
      {
        name: trimmed,
        weight: weightVal,
        unit: unitVal,
        category: cat
      }
    ]);
    setEditSelectedFoodName('');
    setEditSelectedFoodWeight('100');
  };

  const handleStartInlineEditIngredient = (index: number) => {
    const item = editDietRecipeItems[index];
    if (!item) return;
    setEditingIngredientIdx(index);
    setEditingIngName(item.name);
    setEditingIngWeight(item.weight || '');
    setEditingIngUnit(item.unit || 'g');
  };

  const handleSaveInlineEditIngredient = (index: number) => {
    const trimmed = editingIngName.trim();
    if (!trimmed) return;
    const cat = resolveDietFoodCategory(trimmed, undefined, dietItems, foodPortions);
    setEditDietRecipeItems(prev => {
      const next = [...prev];
      next[index] = {
        name: trimmed,
        weight: editingIngWeight.trim(),
        unit: editingIngUnit,
        category: cat
      };
      return next;
    });
    setEditingIngredientIdx(null);
  };

  const handleRemoveEditIngredient = (index: number) => {
    setEditDietRecipeItems(prev => prev.filter((_, i) => i !== index));
    if (editingIngredientIdx === index) {
      setEditingIngredientIdx(null);
    }
  };

  const handleSaveDietRecipe = () => {
    if (!editingDietRecipe || !setDietRecipes) return;
    const trimmedName = editDietRecipeName.trim();
    if (!trimmedName) {
      alert("Veuillez donner un nom à la recette régime.");
      return;
    }

    const itemsFormatted = editDietRecipeItems.map(item => ({
      name: item.name,
      weight: item.weight ? `${item.weight} ${item.unit || 'g'}`.trim() : '',
      category: item.category
    }));

    const ingredientsString = itemsFormatted.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ');

    const updatedRecipe: DietRecipe = {
      ...editingDietRecipe,
      name: trimmedName,
      servings: editDietRecipeServings || 2.5,
      items: itemsFormatted,
      ingredients: ingredientsString
    };

    setDietRecipes(prev => prev.map(dr => dr.id === updatedRecipe.id ? updatedRecipe : dr));
    setEditingDietRecipe(null);
  };

  const handleDeleteDietRecipe = () => {
    if (!editingDietRecipe || !setDietRecipes) return;
    setDietRecipes(prev => prev.filter(dr => dr.id !== editingDietRecipe.id));
    setEditingDietRecipe(null);
    setShowDeleteDietConfirm(false);
  };

  const handleProgrammerAuPlanningRegime = () => {
    if (!planningDietRecipe) return;
    if (!dietPlanDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    if (updateDietMealPlan) {
      updateDietMealPlan(dietPlanDate, dietPlanMealType, 'dietRecipe', planningDietRecipe.id);
    }
    if (setDietServings && dietPlanServings) {
      setDietServings(dietPlanServings);
    }
    const mealLabel = dietPlanMealType === 'lunch' ? 'Déjeuner' : 'Dîner';
    alert(`Recette régime « ${planningDietRecipe.name} » programmée au planning régime pour le ${dietPlanDate} (${mealLabel}) pour ${dietPlanServings.toString().replace('.', ',')} pers. !`);
    setPlanningDietRecipe(null);
  };

  const activeSearchTerms = useMemo(() => {
    const list = [...ingredients];
    const trimmedInput = inputIng.trim();
    if (trimmedInput && !list.some(item => item.toLowerCase() === trimmedInput.toLowerCase())) {
      list.push(trimmedInput);
    }
    return list.filter(Boolean);
  }, [ingredients, inputIng]);

  const results = useMemo(() => {
    if (activeSearchTerms.length === 0) return [];
    return recipes
      .map(r => ({ recipe: r, score: countRecipeMatches(r, activeSearchTerms, appliance) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.title || '').localeCompare(b.recipe.title || ''))
      .map(item => item.recipe);
  }, [recipes, activeSearchTerms, appliance]);

  const dietResults = useMemo(() => {
    if (activeSearchTerms.length === 0) return [];
    return (dietRecipes || [])
      .map(dr => ({ recipe: dr, score: countDietRecipeMatches(dr, activeSearchTerms, appliance) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.name || '').localeCompare(b.recipe.name || ''))
      .map(item => item.recipe);
  }, [dietRecipes, activeSearchTerms, appliance]);

  const handleSearch = () => {
    if (inputIng.trim()) {
      const trimmed = inputIng.trim();
      if (!ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
        setIngredients([...ingredients, trimmed]);
      }
      setInputIng('');
    }
  };

  const appliances = ['Standard', 'Thermomix TM7'];

  const allFoodSuggestions = useMemo(() => {
    const list: string[] = [];
    (foodPortions || []).forEach(fp => { if (fp.name) list.push(fp.name); });
    (dietItems || []).forEach(di => { if (di.name) list.push(di.name); });
    return Array.from(new Set(list)).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [foodPortions, dietItems]);

  const matchingFoodSuggestions = useMemo(() => {
    if (!inputIng.trim()) return allFoodSuggestions;
    const term = inputIng.trim();
    return allFoodSuggestions.filter(name => 
      doesTargetMatchQuery(name, term) || name.toLowerCase().includes(term.toLowerCase())
    );
  }, [inputIng, allFoodSuggestions]);

  const filteredDietFoodSuggestions = useMemo(() => {
    let list: string[] = [];
    if (editSelectedCategory === 'Toutes') {
      list = allFoodSuggestions;
    } else {
      const catDietNames = (dietItems || []).filter(di => {
        const cat = resolveDietFoodCategory(di.name, di.category, dietItems, foodPortions);
        return cat === editSelectedCategory;
      }).map(di => di.name);

      const catPortionNames = (foodPortions || []).filter(fp => {
        const cat = resolveDietFoodCategory(fp.name, fp.category, dietItems, foodPortions);
        return cat === editSelectedCategory;
      }).map(fp => fp.name);

      list = Array.from(new Set([...catDietNames, ...catPortionNames]));
    }
    return list.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [editSelectedCategory, allFoodSuggestions, dietItems, foodPortions]);

  const totalFound = results.length + dietResults.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <h2 className="text-3xl font-black text-center text-gray-800 tracking-tight">Recherche par Ingrédients</h2>
      
      <div className="bg-white p-8 border border-purple-50 rounded-[40px] shadow-sm space-y-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Votre matériel</p>
          <div className="flex gap-2 flex-wrap">
            {appliances.map(a => (
              <button
                key={a}
                onClick={() => setAppliance(a)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                  appliance === a ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' : 'bg-white text-gray-400 border-gray-100 border-purple-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ingrédients à disposition</p>
          <div className="flex gap-2 flex-wrap min-h-[40px]">
            {(ingredients || []).map(i => (
              <span key={i} className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-100 flex items-center gap-2">
                {i} <button onClick={() => setIngredients(ingredients.filter(x => x !== i))} className="hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
          
          <div className="relative">
            <div className="flex gap-2">
              <input 
                type="text"
                list="food-suggestions-search"
                className="flex-1 border-gray-100 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-200 font-bold" 
                placeholder="Ajouter un ingrédient..." 
                value={inputIng} 
                onChange={e => {
                  setInputIng(e.target.value);
                  setShowSearchSuggestions(true);
                }} 
                onFocus={() => setShowSearchSuggestions(true)}
                onKeyPress={e => e.key === 'Enter' && (inputIng.trim() && (setIngredients([...ingredients, inputIng.trim()]), setInputIng(''), setShowSearchSuggestions(false)))} 
              />
              <datalist id="food-suggestions-search">
                {allFoodSuggestions.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={() => setShowSearchSuggestions(!showSearchSuggestions)}
                className="px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Afficher la liste des aliments (15 visibles)"
              >
                <span>📋</span>
                <span className="hidden sm:inline">15 visibles</span>
                <span>{showSearchSuggestions ? '▲' : '▼'}</span>
              </button>

              <button 
                onClick={() => { 
                  if(inputIng.trim()) { 
                    setIngredients([...ingredients, inputIng.trim()]); 
                    setInputIng(''); 
                    setShowSearchSuggestions(false);
                  } 
                }} 
                className="bg-gray-800 text-white px-6 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer"
              >
                Ajouter
              </button>
            </div>

            {/* LISTE DÉROULANTE INTERACTIVE - 15 ALIMENTS VISIBLES */}
            {showSearchSuggestions && matchingFoodSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-purple-200 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
                <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                  <span className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🥗</span> Liste des aliments ({matchingFoodSuggestions.length} disponible{matchingFoodSuggestions.length > 1 ? 's' : ''} — 15 visibles) :
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowSearchSuggestions(false)}
                    className="text-xs font-bold text-gray-500 hover:text-purple-800 px-2.5 py-1 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    ✕ Fermer
                  </button>
                </div>
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                  {matchingFoodSuggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!ingredients.some(i => i.toLowerCase() === name.toLowerCase())) {
                          setIngredients([...ingredients, name]);
                        }
                        setInputIng('');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-purple-100/80 hover:text-purple-900 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{name}</span>
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        + Ajouter
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-3xl font-black shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95">
          {loading ? 'Recherche...' : 'Rechercher dans ma bibliothèque & recettes régimes'}
        </button>
      </div>

      {/* RÉSULTATS : RECETTES CLASSIQUES */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Recettes Classiques</h3>
            <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-0.5 rounded-full">
              {results.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {results.map(r => (
              <div key={r.id} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative">
                <div className="aspect-video bg-purple-50 relative">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
                    {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                    {activeSearchTerms.length > 1 && (
                      <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {countRecipeMatches(r, activeSearchTerms, appliance)}/{activeSearchTerms.length} ingr.
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRecipe(r);
                      }}
                      className="p-2 bg-white/90 hover:bg-white text-purple-700 hover:text-purple-900 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="Modifier la recette"
                    >
                      <EXT_ICONS.Edit />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span>
                    <h3 className="text-sm font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRecipe(r);
                    }}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                    title="Modifier la recette"
                  >
                    <EXT_ICONS.Edit />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RÉSULTATS : RECETTES RÉGIME */}
      {dietResults.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <span>🥗</span>
              <span>Recettes Régime</span>
            </h3>
            <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-0.5 rounded-full">
              {dietResults.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {dietResults.map(dr => {
              const currentServings = dietServings || 2.5;
              const baseServings = dr.servings || 2.5;

              type ItemToDisplay = { name: string; weight: string; category?: string };
              let itemsToDisplay: ItemToDisplay[] = [];

              if (dr.items && dr.items.length > 0) {
                itemsToDisplay = dr.items.map(item => ({
                  name: item.name,
                  weight: item.weight || '',
                  category: item.category
                }));
              } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
                itemsToDisplay = rawParts.map(part => {
                  const trimmed = part.trim();
                  const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
                  if (match) {
                    return { name: match[1].trim(), weight: match[2].trim() };
                  }
                  return { name: trimmed, weight: '' };
                });
              }

              let displayIngredients: React.ReactNode = null;
              if (itemsToDisplay.length > 0) {
                displayIngredients = (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {itemsToDisplay.map((item, idx) => {
                      let text = '';
                      if (item.weight && typeof item.weight === 'string' && item.weight.trim()) {
                        const scaledW = scaleTextQuantity(item.weight, currentServings, baseServings);
                        text = `${item.name} ${scaledW}`.trim();
                      } else {
                        text = scaleTextQuantity(item.name || '', currentServings, baseServings);
                      }
                      
                      const cat = resolveDietFoodCategory(item.name, item.category, dietItems, foodPortions);

                      let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                      if (cat === 'Protéines') {
                        colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                      } else if (cat === 'Légumes') {
                        colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                      } else if (cat === 'Féculents') {
                        colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                      } else if (cat === 'Desserts') {
                        colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';
                      }

                      return (
                        <span 
                          key={idx} 
                          className={`px-2.5 py-1 border rounded-xl text-[11px] font-black tracking-wide shadow-xs ${colorClass}`}
                          title={`Catégorie : ${cat}`}
                        >
                          {text}
                        </span>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div 
                  key={dr.id} 
                  onClick={() => {
                    setPlanningDietRecipe(dr);
                    setDietPlanDate(formatDateKey(new Date()));
                    setDietPlanMealType('lunch');
                    setDietPlanServings(dr.servings || 2.5);
                    setShowDietAvailability(false);
                  }}
                  className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-purple-100 hover:shadow-xl transition-all cursor-pointer group relative flex flex-col justify-between p-5 space-y-3"
                  title="Cliquer pour programmer au planning régime"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                        Régime
                      </span>
                      <div className="flex items-center gap-1.5">
                        {activeSearchTerms.length > 1 && (
                          <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shrink-0">
                            {countDietRecipeMatches(dr, activeSearchTerms, appliance)}/{activeSearchTerms.length} ingr.
                          </span>
                        )}
                        <span className="bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200 shrink-0">
                          👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDietRecipe(dr);
                          }}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 rounded-lg border border-purple-200 transition-colors shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                          title="Modifier la recette régime (aliments, poids, etc.)"
                        >
                          <EXT_ICONS.Edit />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-1">{dr.name}</h3>
                    <div className="text-xs font-medium text-gray-700 bg-purple-50/40 p-3 rounded-xl border border-purple-50 mt-2.5 whitespace-pre-wrap leading-relaxed">
                      {displayIngredients || (typeof dr.ingredients === 'string' ? dr.ingredients : '') || "Aucun aliment renseigné."}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-purple-50">
                    <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                      <span>📅</span>
                      <span>Planifier</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDietRecipe(dr);
                      }}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline"
                    >
                      <EXT_ICONS.Edit />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalFound === 0 && activeSearchTerms.length > 0 && (
        <p className="text-center text-gray-400 italic py-6">Aucune recette ne correspond à ces ingrédients dans votre bibliothèque ou dans vos recettes régimes.</p>
      )}

      {activeSearchTerms.length === 0 && (
        <p className="text-center text-gray-400 italic py-6">Commencez à taper un ingrédient ou sélectionnez-en un pour voir les recettes correspondantes.</p>
      )}

      {/* MODAL FICHE RECETTE CLASSIQUE */}
      {viewingRecipe && (
        <RecipeDetail 
          recipe={viewingRecipe} 
          recipes={recipes} 
          mealPlan={mealPlan} 
          onClose={() => setViewingRecipe(null)} 
          onAddToShopping={onAddToShopping} 
          updateMealPlan={updateMealPlan} 
          setSentMeals={setSentMeals}
          onEdit={(r) => {
            setViewingRecipe(null);
            setEditingRecipe(r);
          }}
        />
      )}

      {/* MODAL MODIFIER RECETTE CLASSIQUE */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[40px] bg-white custom-scrollbar">
            <RecipeForm 
              initialData={editingRecipe}
              foodPortions={foodPortions}
              foodCategories={foodCategories}
              onAddFoodToSettings={(name, unit, cat) => {
                if (onAddFoodToSettings) {
                  onAddFoodToSettings(name, unit, cat);
                }
              }}
              onSave={(updated) => {
                addRecipe(updated);
                setEditingRecipe(null);
                if (viewingRecipe && viewingRecipe.id === updated.id) {
                  setViewingRecipe(updated);
                }
              }}
              onDelete={(id) => {
                if (deleteRecipe) deleteRecipe(id);
                setEditingRecipe(null);
                if (viewingRecipe && viewingRecipe.id === id) {
                  setViewingRecipe(null);
                }
              }}
              onCancel={() => setEditingRecipe(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL MODIFIER RECETTE RÉGIME */}
      {editingDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl animate-scaleUp custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🍳
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                Modifier la recette régime
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Modifiez le nom, les aliments, quantités ou poids de votre recette.
              </p>

              <div className="space-y-5 text-left">
                {/* Champ Nom de la recette */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de la recette
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Omelette espagnole légère"
                    value={editDietRecipeName}
                    onChange={(e) => setEditDietRecipeName(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Section Aliments nécessaires (Choix par catégories + poids + liste) */}
                <div className="space-y-3 bg-purple-50/40 p-4 sm:p-5 rounded-3xl border border-purple-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🥗</span> Aliments et Poids de la recette
                    </label>
                    <span className="text-[10px] font-bold text-purple-500 bg-purple-100/80 px-2 py-0.5 rounded-full">
                      {editDietRecipeItems.length} aliment(s)
                    </span>
                  </div>

                  {/* Filtre par catégorie pour la sélection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      Filtrer les suggestions :
                    </label>
                    <select
                      value={editSelectedCategory}
                      onChange={(e) => setEditSelectedCategory(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white font-bold text-gray-700 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    >
                      <option value="Toutes">Toutes les catégories</option>
                      <option value="Protéines">Régime: Protéines 🥩</option>
                      <option value="Légumes">Régime: Légumes 🥦</option>
                      <option value="Féculents">Régime: Féculents 🥔</option>
                      <option value="Desserts">Régime: Desserts 🍨</option>
                    </select>
                  </div>

                  {/* Champs sélection/saisie d'un aliment + poids + unité */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    {/* Choix ou nom de l'aliment */}
                    <div className="sm:col-span-6">
                      <input 
                        type="text"
                        list="search-edit-diet-foods-suggestions"
                        placeholder="Choisir ou taper un aliment..."
                        value={editSelectedFoodName}
                        onChange={(e) => setEditSelectedFoodName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <datalist id="search-edit-diet-foods-suggestions">
                        {filteredDietFoodSuggestions.map((item, idx) => (
                          <option key={`${item}-${idx}`} value={item} />
                        ))}
                      </datalist>
                    </div>

                    {/* Poids / Quantité */}
                    <div className="sm:col-span-3">
                      <input 
                        type="text"
                        placeholder="Poids (ex: 100)"
                        value={editSelectedFoodWeight}
                        onChange={(e) => setEditSelectedFoodWeight(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    {/* Unité */}
                    <div className="sm:col-span-3">
                      <select
                        value={editSelectedFoodUnit}
                        onChange={(e) => setEditSelectedFoodUnit(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {DIET_UNITS_LIST.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditIngredient}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>+ Ajouter cet aliment à la recette</span>
                  </button>

                  {/* Liste des aliments enregistrés dans la recette avec nom et poids */}
                  <div className="pt-2">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-2">
                      Aliments dans cette recette :
                    </p>
                    {editDietRecipeItems.length === 0 ? (
                      <div className="text-center py-4 bg-white/70 rounded-2xl border border-dashed border-purple-100 text-xs text-gray-400 italic font-medium">
                        Aucun aliment. Choisissez un aliment ci-dessus pour l'ajouter.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {editDietRecipeItems.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between shadow-xs hover:border-purple-200 transition-all"
                          >
                            {editingIngredientIdx === index ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editingIngName}
                                  onChange={(e) => setEditingIngName(e.target.value)}
                                  placeholder="Nom de l'aliment"
                                  className="flex-1 w-full sm:w-auto p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <input
                                  type="text"
                                  value={editingIngWeight}
                                  onChange={(e) => setEditingIngWeight(e.target.value)}
                                  placeholder="Poids"
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-medium text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <select
                                  value={editingIngUnit}
                                  onChange={(e) => setEditingIngUnit(e.target.value)}
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                                >
                                  {DIET_UNITS_LIST.map(unit => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineEditIngredient(index)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                                    title="Valider"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingIngredientIdx(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  {(() => {
                                    const itemCat = resolveDietFoodCategory(item.name, item.category, dietItems, foodPortions);
                                    let catBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                    let dotClass = 'bg-purple-500';
                                    if (itemCat === 'Protéines') {
                                      catBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                                      dotClass = 'bg-red-500';
                                    } else if (itemCat === 'Légumes') {
                                      catBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                      dotClass = 'bg-emerald-500';
                                    } else if (itemCat === 'Féculents') {
                                      catBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                      dotClass = 'bg-amber-500';
                                    } else if (itemCat === 'Desserts') {
                                      catBadgeClass = 'bg-pink-50 text-pink-700 border-pink-200';
                                      dotClass = 'bg-pink-500';
                                    }

                                    return (
                                      <>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                        <span className="font-bold text-gray-800 text-xs truncate">
                                          {item.name}
                                        </span>
                                        {item.weight && (
                                          <span className="font-black text-purple-700 text-xs shrink-0 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                            {item.weight} {item.unit || ''}
                                          </span>
                                        )}
                                        {itemCat !== 'Autre' && (
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-block ${catBadgeClass}`}>
                                            {itemCat}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartInlineEditIngredient(index)}
                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Modifier le poids ou le nom"
                                  >
                                    <EXT_ICONS.Edit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditIngredient(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer cet aliment"
                                  >
                                    <EXT_ICONS.Trash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Nombre de personnes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Portions de référence (Nombre de personnes)
                  </label>
                  <select
                    value={editDietRecipeServings}
                    onChange={(e) => setEditDietRecipeServings(parseFloat(e.target.value))}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowDeleteDietConfirm(true)} 
                  className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <EXT_ICONS.Trash />
                  <span>Supprimer</span>
                </button>
                <div className="flex-1 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingDietRecipe(null)} 
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-xs sm:text-sm"
                  >
                    Annuler
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveDietRecipe} 
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 active:scale-95 text-xs sm:text-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION RECETTE RÉGIME */}
      {showDeleteDietConfirm && editingDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[220] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h4 className="text-xl font-black text-gray-800">Supprimer cette recette régime ?</h4>
            <p className="text-gray-500 text-sm">
              Êtes-vous sûr de vouloir supprimer la recette « <strong className="text-gray-800">{editingDietRecipe.name}</strong> » ?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteDietConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Non, annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteDietRecipe}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-red-200"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFIER AU PLANNING RÉGIME DEPUIS LA RECHERCHE */}
      {planningDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-7 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-purple-200 shrink-0">
                  🍳
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                    Planifier au planning régime
                  </h3>
                  <p className="text-xs font-bold text-purple-700 truncate">
                    « {planningDietRecipe.name} »
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <button 
                  type="button"
                  onClick={() => setShowDietAvailability(true)}
                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 p-3.5 rounded-2xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Voir les disponibilités de la semaine"
                >
                  <span>💗</span>
                  <span>Les disponibilités</span>
                </button>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>📅</span> Date
                </label>
                <input 
                  type="date"
                  value={dietPlanDate}
                  onChange={(e) => setDietPlanDate(e.target.value)}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>🍽️</span> Repas
                </label>
                <select
                  value={dietPlanMealType}
                  onChange={(e) => setDietPlanMealType(e.target.value as 'lunch' | 'dinner')}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="lunch">Déjeuner</option>
                  <option value="dinner">Dîner</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>👥</span> Nombre de personnes
                </label>
                <select
                  value={dietPlanServings}
                  onChange={(e) => setDietPlanServings(parseFloat(e.target.value))}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setPlanningDietRecipe(null)}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={handleProgrammerAuPlanningRegime}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                Programmer au planning régime
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPONIBILITÉS DE LA SEMAINE RÉGIME */}
      {showDietAvailability && planningDietRecipe && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="p-6 md:p-7 border-b flex justify-between items-center bg-pink-50/40">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-pink-500">💗</span> Les disponibilités (Planning Régime)
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  « {planningDietRecipe.name} » • Cliquez sur un créneau pour le sélectionner
                </p>
              </div>
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg transition-all cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() - 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine précédente"
                >
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-gray-700 min-w-[220px] text-center">
                  Semaine du {dietAvailabilityWeekDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() + 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine suivante"
                >
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(dietAvailabilityWeekDate);
                  d.setDate(dietAvailabilityWeekDate.getDate() + i);
                  const dateStr = formatDateKey(d);
                  const dayPlan = mealPlan[dateStr];
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/80 p-3.5 rounded-[24px] border border-gray-100 space-y-2.5">
                      <div className="text-center pb-2 border-b border-gray-200/60">
                        <span className="text-xs font-black text-gray-800 uppercase block">
                          {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600">
                          {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      {/* Créneau Déjeuner */}
                      <button
                        onClick={() => {
                          setDietPlanDate(dateStr);
                          setDietPlanMealType('lunch');
                          setShowDietAvailability(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          dayPlan?.dietLunch?.dietRecipe || dayPlan?.dietLunch?.protein || dayPlan?.dietLunch?.vegetable || dayPlan?.dietLunch?.starch || dayPlan?.dietLunch?.dessert
                            ? 'bg-purple-100/60 border-purple-300 hover:bg-purple-200/70'
                            : 'bg-white border-green-200 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-gray-700 uppercase">Déjeuner</span>
                          {dayPlan?.dietLunch?.dietRecipe || dayPlan?.dietLunch?.protein || dayPlan?.dietLunch?.vegetable || dayPlan?.dietLunch?.starch || dayPlan?.dietLunch?.dessert ? (
                            <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                          ) : (
                            <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                          {dayPlan?.dietLunch?.dietRecipe 
                            ? (dietRecipes.find(r => r.id === dayPlan?.dietLunch?.dietRecipe)?.name || 'Recette régime')
                            : [
                                dayPlan?.dietLunch?.protein && (dietItems.find(x => x.id === dayPlan?.dietLunch?.protein)?.name || dayPlan?.dietLunch?.protein),
                                dayPlan?.dietLunch?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietLunch?.vegetable)?.name || dayPlan?.dietLunch?.vegetable),
                                dayPlan?.dietLunch?.starch && (dietItems.find(x => x.id === dayPlan?.dietLunch?.starch)?.name || dayPlan?.dietLunch?.starch),
                                dayPlan?.dietLunch?.dessert && (dietItems.find(x => x.id === dayPlan?.dietLunch?.dessert)?.name || dayPlan?.dietLunch?.dessert)
                              ].filter(Boolean).join(' • ') || 'Créneau vide'
                          }
                        </p>
                      </button>

                      {/* Créneau Dîner */}
                      <button
                        onClick={() => {
                          setDietPlanDate(dateStr);
                          setDietPlanMealType('dinner');
                          setShowDietAvailability(false);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          dayPlan?.dietDinner?.dietRecipe || dayPlan?.dietDinner?.protein || dayPlan?.dietDinner?.vegetable || dayPlan?.dietDinner?.starch || dayPlan?.dietDinner?.dessert
                            ? 'bg-purple-100/60 border-purple-300 hover:bg-purple-200/70'
                            : 'bg-white border-green-200 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-gray-700 uppercase">Dîner</span>
                          {dayPlan?.dietDinner?.dietRecipe || dayPlan?.dietDinner?.protein || dayPlan?.dietDinner?.vegetable || dayPlan?.dietDinner?.starch || dayPlan?.dietDinner?.dessert ? (
                            <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                          ) : (
                            <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                          {dayPlan?.dietDinner?.dietRecipe 
                            ? (dietRecipes.find(r => r.id === dayPlan?.dietDinner?.dietRecipe)?.name || 'Recette régime')
                            : [
                                dayPlan?.dietDinner?.protein && (dietItems.find(x => x.id === dayPlan?.dietDinner?.protein)?.name || dayPlan?.dietDinner?.protein),
                                dayPlan?.dietDinner?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietDinner?.vegetable)?.name || dayPlan?.dietDinner?.vegetable),
                                dayPlan?.dietDinner?.starch && (dietItems.find(x => x.id === dayPlan?.dietDinner?.starch)?.name || dayPlan?.dietDinner?.starch),
                                dayPlan?.dietDinner?.dessert && (dietItems.find(x => x.id === dayPlan?.dietDinner?.dessert)?.name || dayPlan?.dietDinner?.dessert)
                              ].filter(Boolean).join(' • ') || 'Créneau vide'
                          }
                        </p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-50 border-t flex justify-end">
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecurringView: React.FC<{ 
  groups: PantryGroup[]; 
  setGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
  foodPortions: FoodPortion[];
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  onSendToShopping: (items: ShoppingListItem[]) => void;
}> = ({ groups, setGroups, foodPortions, foodCategories, onAddFoodToSettings, onSendToShopping }) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [tempItems, setTempItems] = useState<ShoppingListItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Épicerie');
  const [selectedMatchMode, setSelectedMatchMode] = useState<string>('__NEW__');

  const allPortionNames = useMemo(() => {
    return (foodPortions || []).map(fp => fp.name.trim()).filter(Boolean);
  }, [foodPortions]);

  const similarSuggestions = useMemo(() => {
    if (!newItemName) return [];
    return findSimilarDietFoods(newItemName, allPortionNames);
  }, [newItemName, allPortionNames]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const addTempItem = () => {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    const unit = newItemUnit;

    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const normalizedInput = normalize(name);
    const existing = foodPortions.find(fp => normalize(fp.name) === normalizedInput);

    if (!existing) {
      setSelectedMatchMode('__NEW__');
      setShowNewFoodModal(true);
      return;
    }

    onAddFoodToSettings(name, unit, existing.category || 'Épicerie');
    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      amount: newItemAmount,
      unit: unit,
      checked: false
    };
    // Trier automatiquement lors de l'ajout
    setTempItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
  };

  const confirmNewFood = () => {
    let nameToAdd = newItemName.trim();
    let categoryToAdd = newFoodCategory;

    if (selectedMatchMode !== '__NEW__' && selectedMatchMode) {
      nameToAdd = selectedMatchMode;
      const existing = foodPortions.find(fp => fp.name.toLowerCase() === selectedMatchMode.toLowerCase());
      if (existing) categoryToAdd = existing.category || 'Épicerie';
    } else {
      onAddFoodToSettings(nameToAdd, newItemUnit, categoryToAdd);
    }

    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: nameToAdd,
      amount: newItemAmount,
      unit: newItemUnit,
      checked: false
    };
    setTempItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
    setSelectedMatchMode('__NEW__');
    setShowNewFoodModal(false);
  };

  const removeTempItem = (id: string) => {
    setTempItems(tempItems.filter(i => i.id !== id));
  };

  const updateItemAmount = (groupId: string, itemId: string, newAmount: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(i => i.id === itemId ? { ...i, amount: newAmount } : i)
        };
      }
      return g;
    }));
  };

  const validateList = () => {
    if (!newListName.trim() || tempItems.length === 0) {
      alert("Veuillez donner un nom à la liste et ajouter au moins un article.");
      return;
    }

    // On s'assure que les articles sont triés avant de sauvegarder
    const sortedItems = [...tempItems].sort((a, b) => a.name.localeCompare(b.name));

    if (editingGroupId) {
      setGroups(groups.map(g => g.id === editingGroupId ? { ...g, name: newListName.trim(), items: sortedItems } : g));
    } else {
      const newGroup: PantryGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: newListName.trim(),
        items: sortedItems
      };
      setGroups([...groups, newGroup]);
    }

    setNewListName('');
    setTempItems([]);
    setEditingGroupId(null);
    setIsAddingList(false);
  };

  const handleEditGroup = (group: PantryGroup) => {
    setEditingGroupId(group.id);
    setNewListName(group.name);
    setTempItems(group.items);
    setIsAddingList(true);
  };

  const toggleItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
        };
      }
      return g;
    }));
  };

  const uncheckAll = () => {
    setGroups(prev => prev.map(g => ({
      ...g,
      items: g.items.map(i => ({ ...i, checked: false }))
    })));
  };

  const onDragStart = (e: React.DragEvent, itemId: string, sourceGroupId: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, sourceGroupId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const { itemId, sourceGroupId } = JSON.parse(dataStr);
      if (sourceGroupId === targetGroupId) return;

      setGroups(prev => {
        const sourceGroup = prev.find(g => g.id === sourceGroupId);
        const itemToMove = sourceGroup?.items.find(i => i.id === itemId);
        if (!itemToMove) return prev;

        return prev.map(g => {
          if (g.id === sourceGroupId) {
            return { ...g, items: g.items.filter(i => i.id !== itemId) };
          }
          if (g.id === targetGroupId) {
            return { ...g, items: [...g.items, itemToMove].sort((a, b) => a.name.localeCompare(b.name)) };
          }
          return g;
        });
      });
    } catch (err) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-32 px-2 relative">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Récurrents</h2>
        {!isAddingList && (
          <div className="flex gap-3">
            <button 
              onClick={uncheckAll}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-green-100 hover:scale-105 transition-all"
            >
              Tous décocher
            </button>
            <button 
              onClick={() => {
                setEditingGroupId(null);
                setNewListName('');
                setTempItems([]);
                setIsAddingList(true);
              }} 
              className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 transition-all"
            >
              Ajouter une liste
            </button>
          </div>
        )}
      </header>

      {isAddingList && (
        <div className="bg-white p-8 md:p-10 rounded-[40px] border-2 border-purple-100 shadow-2xl space-y-8 animate-slideDown">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <input 
               type="text" 
               className="text-2xl font-black text-gray-800 outline-none border-b-2 border-transparent focus:border-purple-200 bg-transparent placeholder-gray-300 w-full sm:w-2/3"
               placeholder="NOM DE LA LISTE..."
               value={newListName}
               onChange={e => setNewListName(e.target.value)}
             />
             <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={() => setIsAddingList(false)} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">Annuler</button>
               <button onClick={validateList} className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg shadow-green-100">Valider la liste</button>
             </div>
          </div>

          <div className="bg-purple-50/50 p-6 rounded-[32px] border border-purple-100 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                   <input 
                     list="pantry-suggestions"
                     className="w-full p-4 rounded-2xl border border-gray-100 font-bold outline-none focus:ring-2 focus:ring-purple-200"
                     placeholder="Nom de l'article..."
                     value={newItemName}
                     onChange={e => setNewItemName(e.target.value)}
                     onKeyPress={e => e.key === 'Enter' && addTempItem()}
                   />
                   <datalist id="pantry-suggestions">
                     {foodPortions.map(fp => <option key={fp.id} value={fp.name} />)}
                   </datalist>
                </div>
                <div className="sm:col-span-2">
                   <input 
                     type="number" 
                     className="w-full p-4 rounded-2xl border border-gray-100 font-black text-center text-purple-600 outline-none"
                     placeholder="QTÉ"
                     value={newItemAmount}
                     onChange={e => setNewItemAmount(Number(e.target.value))}
                   />
                </div>
                <div className="sm:col-span-3">
                   <select 
                     className="w-full p-4 rounded-2xl border border-gray-100 font-bold text-gray-500 outline-none cursor-pointer"
                     value={newItemUnit}
                     onChange={e => setNewItemUnit(e.target.value)}
                   >
                     <option value="boite">boite</option>
                     <option value="C.à S">C.à S</option>
                     <option value="cl">cl</option>
                     <option value="g">g</option>
                     <option value="kg">kg</option>
                     <option value="L">L</option>
                     <option value="ml">ml</option>
                     <option value="unité">u.</option>
                   </select>
                </div>
                <button onClick={addTempItem} className="sm:col-span-2 bg-purple-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all">Ajouter</button>
             </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
             {tempItems.length === 0 ? (
               <p className="text-center text-gray-300 italic py-10">Aucun article dans cette liste pour le moment</p>
             ) : (
               tempItems.map(item => (
                 <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 animate-slideUp">
                    <span className="font-bold text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-4">
                       <span className="font-black text-purple-600 text-xs bg-purple-50 px-3 py-1 rounded-lg">{item.amount} {item.unit}</span>
                       <button onClick={() => removeTempItem(item.id)} className="text-red-300 hover:text-red-500 font-black text-lg">×</button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {groups.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-300 italic font-medium bg-white rounded-[40px] border border-dashed border-gray-200">
            Aucun récurrent. Cliquez sur "Ajouter une liste" pour commencer.
          </div>
        ) : (
          groups.map(group => (
            <div 
              key={group.id} 
              onDragOver={e => { e.preventDefault(); setDragOverGroupId(group.id); }}
              onDragLeave={() => setDragOverGroupId(null)}
              onDrop={e => onDrop(e, group.id)}
              className={`bg-white rounded-[40px] border-2 transition-all shadow-sm overflow-hidden flex flex-col animate-slideUp ${dragOverGroupId === group.id ? 'border-purple-400 scale-[1.02]' : 'border-gray-100'}`}
            >
                <div className="p-6 bg-purple-50/30 flex justify-between items-center border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{group.name}</h3>
                    <span className="text-xs font-black bg-white px-2 py-1 rounded-lg text-purple-600 border border-purple-100 shadow-sm">
                      {group.items.filter(i => i.checked).length}/{group.items.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSendToShopping(group.items.filter(i => i.checked))}
                      className="text-purple-600 p-2 hover:bg-purple-100 rounded-xl transition-all"
                      title="Envoyer les articles cochés aux courses"
                    >
                      <EXT_ICONS.Cart />
                    </button>
                    <button 
                      onClick={() => handleEditGroup(group)} 
                      className="text-purple-600 hover:bg-purple-100 p-2 rounded-xl transition-all"
                      title="Modifier la liste"
                    >
                      <EXT_ICONS.Edit />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(group.id)} 
                      className="text-gray-300 hover:text-red-400 transition-colors p-2"
                      title="Supprimer la liste"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
               </div>
               <div className="p-6 divide-y divide-gray-50">
                  {/* Affichage trié par ordre alphabétique */}
                  {group.items.slice().sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                    <div 
                      key={item.id} 
                      draggable="true"
                      onDragStart={e => onDragStart(e, item.id, group.id)}
                      className={`py-4 flex gap-4 items-center cursor-grab active:cursor-grabbing hover:bg-purple-50/50 px-2 rounded-xl transition-all ${item.checked ? 'opacity-60' : ''}`}
                    >
                       <div onClick={() => toggleItem(group.id, item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                         {item.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                       </div>
                       <span className={`flex-1 font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                       <div className="flex items-center gap-1.5">
                         <input 
                           type="number"
                           className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                           value={item.amount}
                           onChange={(e) => updateItemAmount(group.id, item.id, Number(e.target.value))}
                           onFocus={(e) => e.target.select()}
                         />
                         <span className={`text-[10px] font-black ${item.checked ? 'text-gray-300' : 'text-purple-400'}`}>{item.unit}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-4 bg-gray-50 mt-auto">
                 <button 
                   onClick={() => onSendToShopping(group.items.filter(i => i.checked))}
                   className="w-full bg-purple-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   🚀 Envoyer aux courses ({group.items.filter(i => i.checked).length})
                 </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-800">Supprimer la liste ?</h3>
            <p className="text-gray-500 font-medium">Cette action est irréversible. Voulez-vous continuer ?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all">Annuler</button>
              <button 
                onClick={() => {
                  setGroups(groups.filter(g => g.id !== confirmDeleteId));
                  setConfirmDeleteId(null);
                }} 
                className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVEL ALIMENT */}
      {showNewFoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🧩</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Aliment à classer</h3>
              <p className="text-gray-500 font-medium mb-6 text-xs">
                L'article <span className="text-amber-600 font-black">"{newItemName}"</span> n'est pas encore enregistré.
              </p>

              <div className="space-y-3 text-left">
                {/* Mode Créer nouveau */}
                <button
                  type="button"
                  onClick={() => setSelectedMatchMode('__NEW__')}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    selectedMatchMode === '__NEW__'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">✨</span>
                    <div>
                      <p className="font-black text-xs">Créer « {newItemName} »</p>
                      <p className="text-[10px] text-gray-500">Ajouter comme nouvel aliment dans vos réglages</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedMatchMode === '__NEW__' ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300'
                  }`}>
                    {selectedMatchMode === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                  </div>
                </button>

                {/* Suggestions existantes */}
                {similarSuggestions.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                      Ou utiliser un aliment existant :
                    </p>
                    <div className="space-y-1.5">
                      {similarSuggestions.map(sug => {
                        const isSug = selectedMatchMode === sug;
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setSelectedMatchMode(sug)}
                            className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                              isSug
                                ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs'
                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🔄</span>
                              <p className="font-black text-xs">Utiliser : « <span className="text-amber-700">{sug}</span> »</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSug ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300'
                            }`}>
                              {isSug && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Choix catégorie si __NEW__ */}
                {selectedMatchMode === '__NEW__' && (
                  <div className="space-y-1 pt-2 animate-fadeIn">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Choix de la catégorie</label>
                    <select
                      value={newFoodCategory}
                      onChange={(e) => setNewFoodCategory(e.target.value)}
                      className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 text-xs focus:border-amber-500 transition-all outline-none cursor-pointer"
                    >
                      {foodCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowNewFoodModal(false)}
                className="flex-1 p-4 font-black text-gray-500 hover:text-gray-700 transition-colors text-xs"
              >
                Annuler
              </button>
              <button 
                onClick={confirmNewFood}
                className="flex-1 bg-amber-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all transform active:scale-95 text-xs"
              >
                {selectedMatchMode === '__NEW__' ? "Valider" : "Utiliser cet aliment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Planning: React.FC<{ 
  mealPlan: Record<string, MealPlanDay>; 
  recipes: Recipe[]; 
  updateMealPlan: (d: string, t: 'lunch' | 'dinner' | 'extra', s: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', r: string | undefined, index?: number) => void;
  updateDietMealPlan: (d: string, m: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe' | 'servings', itemIdOrValue: string | number | undefined) => void;
  onMergeToShopping: (items: ShoppingListItem[]) => void;
  sentMeals: Set<string>;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  settings: UserSettings;
  dietItems: DietItem[];
  dietServings: number;
  setDietServings: React.Dispatch<React.SetStateAction<number>>;
  dietRecipes?: DietRecipe[];
}> = ({ mealPlan, recipes, updateMealPlan, updateDietMealPlan, onMergeToShopping, sentMeals, setSentMeals, settings, dietItems, dietServings, setDietServings, dietRecipes = [] }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [planningViewMode, setPlanningViewMode] = useState<'recipes' | 'regime'>(() => settings.defaultPlanningTab || 'recipes');
  
  // State for "Rentrer Déjeuner / Dîner" Modal
  const [showRentrerMealModal, setShowRentrerMealModal] = useState(false);
  const [rentrerMealDayKey, setRentrerMealDayKey] = useState<string | null>(null);
  const [rentrerMealType, setRentrerMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [rentrerMealServings, setRentrerMealServings] = useState<number>(2.5);
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);
  const [selectedStarches, setSelectedStarches] = useState<string[]>([]);
  const [selectedDesserts, setSelectedDesserts] = useState<string[]>([]);

  const handleOpenRentrerMeal = (dayKey: string, mealType: 'lunch' | 'dinner') => {
    setRentrerMealDayKey(dayKey);
    setRentrerMealType(mealType);
    const dayPlan = mealPlan[dayKey] || {};
    const currentMeal = mealType === 'lunch' ? dayPlan.dietLunch || {} : dayPlan.dietDinner || {};

    const parseSlot = (val?: string) => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];

    setSelectedProteins(parseSlot(currentMeal.protein));
    setSelectedVegetables(parseSlot(currentMeal.vegetable));
    setSelectedStarches(parseSlot(currentMeal.starch));
    setSelectedDesserts(parseSlot(currentMeal.dessert));
    const defaultServings = getDefaultDietServings(dayKey, mealType, settings);
    setRentrerMealServings(currentMeal.servings ?? defaultServings);
    setShowRentrerMealModal(true);
  };

  const handleRemoveDietItemDirect = (dayKey: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert', idOrName: string) => {
    const dayPlan = mealPlan[dayKey] || {};
    const currentMeal = mealType === 'lunch' ? dayPlan.dietLunch || {} : dayPlan.dietDinner || {};
    const currentVal = currentMeal[slot] || '';
    const ids = currentVal.split(',').map(s => s.trim()).filter(Boolean);
    const updatedIds = ids.filter(id => id !== idOrName && id.toLowerCase() !== idOrName.toLowerCase());
    updateDietMealPlan(dayKey, mealType, slot, updatedIds.length > 0 ? updatedIds.join(',') : undefined);
  };

  const handleSaveRentrerMeal = () => {
    if (!rentrerMealDayKey) return;
    
    updateDietMealPlan(
      rentrerMealDayKey,
      rentrerMealType,
      'protein',
      selectedProteins.length > 0 ? selectedProteins.join(',') : undefined
    );
    updateDietMealPlan(
      rentrerMealDayKey,
      rentrerMealType,
      'vegetable',
      selectedVegetables.length > 0 ? selectedVegetables.join(',') : undefined
    );
    updateDietMealPlan(
      rentrerMealDayKey,
      rentrerMealType,
      'starch',
      selectedStarches.length > 0 ? selectedStarches.join(',') : undefined
    );
    updateDietMealPlan(
      rentrerMealDayKey,
      rentrerMealType,
      'dessert',
      selectedDesserts.length > 0 ? selectedDesserts.join(',') : undefined
    );
    const defaultServings = getDefaultDietServings(rentrerMealDayKey, rentrerMealType, settings);
    updateDietMealPlan(
      rentrerMealDayKey,
      rentrerMealType,
      'servings',
      rentrerMealServings === defaultServings ? undefined : rentrerMealServings
    );

    setShowRentrerMealModal(false);
    setRentrerMealDayKey(null);
  };
  
  useEffect(() => {
    if (settings.defaultPlanningTab) {
      setPlanningViewMode(settings.defaultPlanningTab);
    }
  }, [settings.defaultPlanningTab]);
  
  const getStartOfWeek = (date: Date, startDay: number) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day - startDay + 7) % 7;
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const [baseDate, setBaseDate] = useState(() => {
    const start = getStartOfWeek(new Date(), settings.startDay ?? 6);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    return start;
  });

  useEffect(() => {
    setBaseDate(prev => getStartOfWeek(prev, settings.startDay ?? 6));
  }, [settings.startDay]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return d;
  });

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => a.title.localeCompare(b.title));
  }, [recipes]);

  const proteinOptions = useMemo(() => {
    return (dietItems || [])
      .filter(i => i.category === 'Protéines')
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      .map(i => {
        const scaledWeight = formatScaledWeight(i.weight, dietServings, 2.5);
        return { id: i.id, title: `${i.name}${scaledWeight ? ' (' + scaledWeight + ')' : ''}` };
      });
  }, [dietItems, dietServings]);

  const vegetableOptions = useMemo(() => {
    return (dietItems || [])
      .filter(i => i.category === 'Légumes')
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      .map(i => {
        const scaledWeight = formatScaledWeight(i.weight, dietServings, 2.5);
        return { id: i.id, title: `${i.name}${scaledWeight ? ' (' + scaledWeight + ')' : ''}` };
      });
  }, [dietItems, dietServings]);

  const starchOptions = useMemo(() => {
    return (dietItems || [])
      .filter(i => i.category === 'Féculents')
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      .map(i => {
        const scaledWeight = formatScaledWeight(i.weight, dietServings, 2.5);
        return { id: i.id, title: `${i.name}${scaledWeight ? ' (' + scaledWeight + ')' : ''}` };
      });
  }, [dietItems, dietServings]);

  const dietRecipeOptions = useMemo(() => {
    return (dietRecipes || []).map(dr => {
      return { id: dr.id, title: dr.name };
    });
  }, [dietRecipes]);

  const handleSendDietRecipe = (date: string, mealType: 'dietLunch' | 'dietDinner', recipeId: string) => {
    const dr = (dietRecipes || []).find(r => r.id === recipeId);
    if (!dr) return;

    const mealKey = `${date}-${mealType}-dietRecipe`;
    if (sentMeals.has(mealKey)) return;

    const baseServings = dr.servings || 2.5;
    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(date, mealType === 'dietLunch' ? 'lunch' : 'dinner', settings);

    let itemsToSend: ShoppingListItem[] = [];

    if (dr.items && dr.items.length > 0) {
      itemsToSend = dr.items.map(item => {
        let amount = 1;
        let unit = 'g';
        if (item.weight && typeof item.weight === 'string') {
          const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
          const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
          if (match) {
            amount = parseFloat(match[1].replace(',', '.')) || 1;
            if (match[2]) unit = match[2].trim();
          } else {
            unit = item.weight.trim();
          }
        }
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          amount,
          unit,
          checked: false
        };
      });
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
      itemsToSend = [{
        id: Math.random().toString(36).substr(2, 9),
        name: `${dr.name} (${scaledIng})`,
        amount: 1,
        unit: 'portion',
        checked: false
      }];
    } else {
      itemsToSend = [{
        id: Math.random().toString(36).substr(2, 9),
        name: dr.name,
        amount: 1,
        unit: 'portion',
        checked: false
      }];
    }

    onMergeToShopping(itemsToSend);
    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  const handleSendRecipe = (date: string, type: 'lunch' | 'dinner', slot: 'recipe1' | 'recipe2', recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const mealKey = `${date}-${type}-${slot}`;
    if (sentMeals.has(mealKey)) return;

    const items: ShoppingListItem[] = recipe.ingredients.map(ing => ({
      id: Math.random().toString(36).substr(2, 9),
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      checked: false
    }));
    
    onMergeToShopping(items);
    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  const handleSendDietItem = (date: string, mealType: 'dietLunch' | 'dietDinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert', itemId: string) => {
    const item = (dietItems || []).find(i => i.id === itemId);
    if (!item) return;

    const mealKey = `${date}-${mealType}-${slot}`;
    if (sentMeals.has(mealKey)) return;

    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(date, mealType === 'dietLunch' ? 'lunch' : 'dinner', settings);

    let amount = 1;
    let unit = 'g';
    if (item.weight) {
      const scaledStr = formatScaledWeight(item.weight, currentServings, 2.5);
      const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
      if (match) {
        amount = parseFloat(match[1].replace(',', '.')) || 1;
        if (match[2]) unit = match[2].trim();
      } else {
        unit = item.weight.trim();
      }
    }

    onMergeToShopping([{
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      amount,
      unit,
      checked: false
    }]);

    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  // NOUVELLE FONCTION : TOUT ENVOYER AUX COURSES (RECETTES + RÉGIME)
  const handleSendAll = () => {
    let allItems: any[] = [];
    const newSentMeals = new Set(sentMeals);
    let addedCount = 0;

    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key];
      if (!plan) return;

      // 1. Recettes
      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;

        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) {
            const recipe = recipes.find((r: any) => r.id === recipeId);
            if (recipe) {
              const items = recipe.ingredients.map((ing: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                checked: false
              }));
              allItems = [...allItems, ...items];
              newSentMeals.add(`${key}-${type}-${slot}`);
              addedCount++;
            }
          }
        });
      });

      // 2. Régime - Déjeuner
      const dietLunch = plan.dietLunch;
      if (dietLunch) {
        const lunchServings = dietLunch.servings ?? getDefaultDietServings(d, 'lunch', settings);
        (['protein', 'vegetable', 'starch', 'dessert'] as const).forEach(slot => {
          const itemId = dietLunch[slot];
          const mealKey = `${key}-dietLunch-${slot}`;
          if (itemId && !sentMeals.has(mealKey)) {
            const item = (dietItems || []).find(i => i.id === itemId);
            if (item) {
              let amount = 1;
              let unit = 'g';
              if (item.weight) {
                const scaledStr = formatScaledWeight(item.weight, lunchServings, 2.5);
                const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                if (match) {
                  amount = parseFloat(match[1].replace(',', '.')) || 1;
                  if (match[2]) unit = match[2].trim();
                } else {
                  unit = item.weight.trim();
                }
              }
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: item.name,
                amount,
                unit,
                checked: false
              });
              newSentMeals.add(mealKey);
              addedCount++;
            }
          }
        });

        if (dietLunch.dietRecipe && !sentMeals.has(`${key}-dietLunch-dietRecipe`)) {
          const dr = (dietRecipes || []).find(r => r.id === dietLunch.dietRecipe);
          if (dr) {
            const baseServings = dr.servings || 2.5;
            const currentServings = lunchServings;
            if (dr.items && dr.items.length > 0) {
              dr.items.forEach(item => {
                let amount = 1;
                let unit = 'g';
                if (item.weight && typeof item.weight === 'string') {
                  const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
              });
            } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
              const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: `${dr.name} (${scaledIng})`,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            } else {
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: dr.name,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            }
            newSentMeals.add(`${key}-dietLunch-dietRecipe`);
            addedCount++;
          }
        }
      }

      // 3. Régime - Dîner
      const dietDinner = plan.dietDinner;
      if (dietDinner) {
        const dinnerServings = dietDinner.servings ?? getDefaultDietServings(d, 'dinner', settings);
        (['protein', 'vegetable', 'starch', 'dessert'] as const).forEach(slot => {
          const itemId = dietDinner[slot];
          const mealKey = `${key}-dietDinner-${slot}`;
          if (itemId && !sentMeals.has(mealKey)) {
            const item = (dietItems || []).find(i => i.id === itemId);
            if (item) {
              let amount = 1;
              let unit = 'g';
              if (item.weight && typeof item.weight === 'string') {
                const scaledStr = formatScaledWeight(item.weight, dinnerServings, 2.5);
                const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                if (match) {
                  amount = parseFloat(match[1].replace(',', '.')) || 1;
                  if (match[2]) unit = match[2].trim();
                } else {
                  unit = item.weight.trim();
                }
              }
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: item.name,
                amount,
                unit,
                checked: false
              });
              newSentMeals.add(mealKey);
              addedCount++;
            }
          }
        });

        if (dietDinner.dietRecipe && !sentMeals.has(`${key}-dietDinner-dietRecipe`)) {
          const dr = (dietRecipes || []).find(r => r.id === dietDinner.dietRecipe);
          if (dr) {
            const baseServings = dr.servings || 2.5;
            const currentServings = dinnerServings;
            if (dr.items && dr.items.length > 0) {
              dr.items.forEach(item => {
                let amount = 1;
                let unit = 'g';
                if (item.weight && typeof item.weight === 'string') {
                  const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
              });
            } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
              const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: `${dr.name} (${scaledIng})`,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            } else {
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: dr.name,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            }
            newSentMeals.add(`${key}-dietDinner-dietRecipe`);
            addedCount++;
          }
        }
      }

      // 4. Extras: Viennoiseries & Sauces (dimanche)
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) {
              const recipe = recipes.find((r: any) => r.id === recipeId);
              if (recipe) {
                const items = recipe.ingredients.map((ing: any) => ({
                  id: Math.random().toString(36).substr(2, 9),
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                  checked: false
                }));
                allItems = [...allItems, ...items];
                newSentMeals.add(`${key}-${slot}-${index}`);
                addedCount++;
              }
            }
          });
        });
      }
    });

    if (addedCount > 0) {
      // Cumul/Agrégation des quantités pour les aliments présents plusieurs fois dans la semaine
      const aggregatedItems: ShoppingListItem[] = [];
      allItems.forEach(newItem => {
        const existing = aggregatedItems.find(
          i => i.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() && i.unit.toLowerCase().trim() === newItem.unit.toLowerCase().trim()
        );
        if (existing) {
          existing.amount = Math.round((existing.amount + newItem.amount) * 100) / 100;
        } else {
          aggregatedItems.push({ ...newItem });
        }
      });

      onMergeToShopping(aggregatedItems);
      setSentMeals(newSentMeals);
      alert(`${addedCount} élément(s) envoyé(s) aux courses !`);
    } else {
      alert("Tous les éléments de cette semaine ont déjà été envoyés.");
    }
    setShowSummary(false);
  };

  const unsentCount = useMemo(() => {
    let count = 0;
    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key];
      if (!plan) return;

      // Recettes
      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;
        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) count++;
        });
      });

      // Régime
      const dietLunch = plan.dietLunch;
      if (dietLunch) {
        (['protein', 'vegetable', 'starch', 'dietRecipe'] as const).forEach(slot => {
          if (dietLunch[slot] && !sentMeals.has(`${key}-dietLunch-${slot}`)) count++;
        });
      }
      const dietDinner = plan.dietDinner;
      if (dietDinner) {
        (['protein', 'vegetable', 'starch', 'dietRecipe'] as const).forEach(slot => {
          if (dietDinner[slot] && !sentMeals.has(`${key}-dietDinner-${slot}`)) count++;
        });
      }

      // Extras
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) count++;
          });
        });
      }
    });
    return count;
  }, [days, mealPlan, sentMeals]);

  const changeWeek = (offset: number) => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + (offset * 7));
    setBaseDate(next);
  };

  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `< du ${fmt(start)} au ${fmt(end)} >`;
  };

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      <header className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-violet-50 p-2 rounded-2xl border border-violet-100">
              <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600">
                <EXT_ICONS.ArrowLeft />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-violet-600 min-w-[180px] text-center">
                {formatWeekRange(baseDate)}
              </span>
              <button onClick={() => changeWeek(1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600">
                <EXT_ICONS.ArrowRight />
              </button>
            </div>
            {unsentCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-black px-3 py-2 rounded-full shadow-lg">
                {unsentCount}
              </div>
            )}
          </div>


        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Mon Planning</h2>
          <p className="font-bold text-purple-400 text-sm">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* SÉLECTEUR 2 POSITIONS SOUS LA DATE */}
          <div className="flex justify-center pt-1">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-xs">
              <button
                onClick={() => setPlanningViewMode('recipes')}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  planningViewMode === 'recipes'
                    ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <EXT_ICONS.Book />
                <span>Recettes</span>
              </button>
              <button
                onClick={() => setPlanningViewMode('regime')}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  planningViewMode === 'regime'
                    ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>🥗</span>
                <span>Régime</span>
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowSummary(true)} 
          className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-purple-100 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 justify-self-end"
        >
          <EXT_ICONS.Cart />
          <span>Générer Courses</span>
        </button>
      </header>

      {planningViewMode === 'recipes' ? (
        /* MODE RECETTES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map(d => {
            const key = formatDateKey(d);
            const dayPlan = mealPlan[key] || {};

            return (
              <div key={key} className="bg-white p-6 border rounded-[32px] shadow-sm hover:shadow-md transition-all border-gray-100">
                <p className="text-center font-black text-sm uppercase tracking-widest text-purple-600 mb-4 border-b pb-2">
                  {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="space-y-4">
                  {(['lunch', 'dinner'] as const).map(type => (
                    <div key={type} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {type === 'lunch' ? 'Déjeuner' : 'Dîner'}
                      </label>
                      <div className="space-y-2 pl-2 border-l-2 border-purple-100">
                        {(['recipe1', 'recipe2'] as const).map((slot, idx) => (
                          <div key={slot} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest ml-1">
                                Recette {idx + 1}
                              </span>
                              {dayPlan[type]?.[slot] && sentMeals.has(`${key}-${type}-${slot}`) && (
                                <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                              )}
                            </div>
                            <SearchableSelect
                              options={sortedRecipes}
                              value={dayPlan[type]?.[slot] || ''}
                              onChange={value => updateMealPlan(key, type, slot, value || undefined)}
                              placeholder="Vide"
                              selectedClassName="text-blue-600 font-bold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {(() => {
            const sunday = days[6];
            const key = formatDateKey(sunday);
            return (
              <>
                {/* Viennoiserie Card */}
                <div className="bg-white p-6 border border-pink-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-center font-black text-sm uppercase tracking-widest text-pink-500 mb-4 border-b border-pink-50 pb-2">
                    Viennoiseries et Gâteaux
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                          {mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) && (
                            <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                          )}
                        </div>
                        <select 
                          className={`w-full text-[10px] font-bold bg-pink-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.viennoiseries?.[i] ? 'text-blue-600' : ''} ${mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-pink-200'}`}
                          value={mealPlan[key]?.viennoiseries?.[i] || ''}
                          onChange={e => updateMealPlan(key, 'extra', 'viennoiseries', e.target.value || undefined, i)}
                        >
                          <option value="">Vide</option>
                          {sortedRecipes.filter(r => r.category === 'Viennoiserie' || r.category === 'Gâteaux').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sauce Card */}
                <div className="bg-white p-6 border border-blue-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-center font-black text-sm uppercase tracking-widest text-blue-500 mb-4 border-b border-blue-50 pb-2">
                    Sauces et Coulis
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                          {mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) && (
                            <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                          )}
                        </div>
                        <select 
                          className={`w-full text-[10px] font-bold bg-blue-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.sauces?.[i] ? 'text-blue-600' : ''} ${mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-blue-200'}`}
                          value={mealPlan[key]?.sauces?.[i] || ''}
                          onChange={e => updateMealPlan(key, 'extra', 'sauces', e.target.value || undefined, i)}
                        >
                          <option value="">Vide</option>
                          {sortedRecipes.filter(r => r.category === 'Sauce' || r.category === 'Coulis').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* MODE RÉGIME : TABLEAU RÉGIME (Jour | Déjeuner | Dîner) */
        <div className="space-y-6">
          <div className="bg-white border rounded-[32px] shadow-sm overflow-hidden border-gray-100 p-4 md:p-6">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[140px_1fr_1fr] gap-4 bg-purple-50/80 p-4 rounded-2xl border border-purple-100 mb-4 font-black text-xs uppercase tracking-wider text-purple-900 text-center shadow-xs">
              <div>Jour</div>
              <div>Déjeuner</div>
              <div>Dîner</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {days.map((d, dayIdx) => {
                const key = formatDateKey(d);
                const dayPlan = mealPlan[key] || {};
                const dayNameRaw = d.toLocaleDateString('fr-FR', { weekday: 'long' });
                const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
                const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

                const getCategoryStyle = (cat: string) => {
                  const normalized = (cat || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  if (normalized.includes('dessert') || normalized.includes('fruit') || normalized.includes('laitier') || normalized.includes('sucre') || normalized.includes('yaourt') || normalized.includes('compote') || normalized.includes('gateau') || normalized.includes('douceur') || normalized.includes('viennoiserie')) {
                    return 'bg-pink-50 border-pink-200 text-pink-600';
                  }
                  if (normalized.includes('prot') || normalized.includes('viande') || normalized.includes('poisson') || normalized.includes('charcuterie') || normalized.includes('oeuf') || normalized.includes('tofu')) {
                    return 'bg-red-50 border-red-200 text-red-600';
                  }
                  if (normalized.includes('legum') || normalized.includes('vegetable')) {
                    return 'bg-green-50 border-green-200 text-green-600';
                  }
                  if (normalized.includes('fecul') || normalized.includes('starch') || normalized.includes('pain') || normalized.includes('cereale') || normalized.includes('riz') || normalized.includes('pate')) {
                    return 'bg-amber-50 border-amber-200 text-amber-700';
                  }
                  return 'bg-pink-50 border-pink-200 text-pink-600';
                };

                const inferDietCategory = (nameOrPart: string): string => {
                  const lower = (nameOrPart || '').toLowerCase();
                  if (/yaourt|fromage blanc|fruit|pomme|banane|compote|dessert|fraise|kiwi|orange|poire|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|crème|creme|flan|chocolat|miel|sucre|tarte|gâteau|gateau|mousse|glace|sorbet/i.test(lower)) return 'Desserts';
                  const matchedDiet = (dietItems || []).find(di => lower.includes(di.name.toLowerCase()) || di.name.toLowerCase().includes(lower));
                  if (matchedDiet && matchedDiet.category) return matchedDiet.category;
                  const matchedPortion = (settings.foodPortions || []).find(fp => lower.includes(fp.name.toLowerCase()) || fp.name.toLowerCase().includes(lower));
                  if (matchedPortion && matchedPortion.category) return matchedPortion.category;

                  if (/poulet|boeuf|bœuf|veau|porc|dinde|jambon|poisson|saumon|thon|cabillaud|colin|oeuf|œuf|tofu|steak|viande|crevette|canard/i.test(lower)) return 'Protéines';
                  if (/haricot|courgette|tomate|carotte|brocoli|salade|épinard|epinard|poivron|champignon|poireau|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri/i.test(lower)) return 'Légumes';
                  if (/riz|pâte|pate|pomme de terre|patate|quinoa|boulgour|semoule|pain|lentille|pois chiche|avoine|fécule|fecule|blé|ble|maïs|mais|gnocchi/i.test(lower)) return 'Féculents';
                  return 'Desserts';
                };

                const getDietMealItems = (mealTypeKey: 'dietLunch' | 'dietDinner') => {
                  const mObj = dayPlan[mealTypeKey];
                  const mealServings = mObj?.servings ?? getDefaultDietServings(d, mealTypeKey === 'dietLunch' ? 'lunch' : 'dinner', settings);
                  if (!mObj) return [];
                  const res: { text: string; category: string }[] = [];

                  const processSlot = (slotValue: string | undefined, defaultCategory: string) => {
                    if (!slotValue) return;
                    const ids = slotValue.split(',').map(s => s.trim()).filter(Boolean);
                    ids.forEach(id => {
                      const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
                      if (item) {
                        const scaledWeight = formatScaledWeight(item.weight, mealServings, 2.5);
                        res.push({
                          text: `${item.name}${scaledWeight ? ' ' + scaledWeight : ''}`,
                          category: defaultCategory === 'Desserts' ? 'Desserts' : (item.category || defaultCategory)
                        });
                      } else {
                        // Fallback
                        res.push({
                          text: id,
                          category: defaultCategory
                        });
                      }
                    });
                  };

                  processSlot(mObj.protein, 'Protéines');
                  processSlot(mObj.vegetable, 'Légumes');
                  processSlot(mObj.starch, 'Féculents');
                  processSlot(mObj.dessert, 'Desserts');
                  if (mObj.dietRecipe) {
                    const dr = (dietRecipes || []).find(r => r.id === mObj.dietRecipe);
                    if (dr) {
                      const baseServings = dr.servings || 2.5;
                      if (dr.items && dr.items.length > 0) {
                        dr.items.forEach(item => {
                          const cat = item.category || inferDietCategory(item.name);
                          const scaledWeight = formatScaledWeight(item.weight, mealServings, baseServings);
                          res.push({
                            text: `${item.name}${scaledWeight ? ' ' + scaledWeight : ''}`,
                            category: cat
                          });
                        });
                      } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                        const parts = dr.ingredients.split(/[+\n,;]/).map(p => p.trim()).filter(Boolean);
                        if (parts.length > 0) {
                          parts.forEach(part => {
                            const cat = inferDietCategory(part);
                            const scaledPart = scaleTextQuantity(part, mealServings, baseServings);
                            res.push({
                              text: scaledPart,
                              category: cat
                            });
                          });
                        } else {
                          res.push({
                            text: dr.name,
                            category: 'Recette'
                          });
                        }
                      } else {
                        res.push({
                          text: dr.name,
                          category: 'Recette'
                        });
                      }
                    }
                  }
                  return res;
                };

                const lunchSummary = getDietMealItems('dietLunch');
                const dinnerSummary = getDietMealItems('dietDinner');

                return (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr] gap-4 p-4 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50/40 transition-all shadow-2xs items-start">
                    {/* Colonne Jour */}
                    <div className="flex flex-col items-center justify-center bg-blue-50/80 border border-blue-100 text-blue-900 py-3 px-3 rounded-2xl text-center h-full min-h-[90px] shadow-2xs">
                      <span className="font-black text-sm uppercase tracking-wide text-blue-800">{dayName}</span>
                      <span className="text-[11px] font-bold text-blue-500 mt-1">{formattedDate}</span>
                    </div>

                    {/* Colonne Déjeuner */}
                    <div className="space-y-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                            Déjeuner
                          </span>
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                            <span className="text-[11px] font-black text-purple-700 whitespace-nowrap flex items-center gap-1">
                              <span>👥</span> <span>Pers. :</span>
                            </span>
                            <select
                              value={dayPlan.dietLunch?.servings ?? getDefaultDietServings(d, 'lunch', settings)}
                              onChange={(e) => updateDietMealPlan(key, 'lunch', 'servings', parseFloat(e.target.value))}
                              className="bg-transparent font-black text-xs text-purple-900 outline-none cursor-pointer"
                            >
                              {DIET_PERSON_OPTIONS.map(val => (
                                <option key={val} value={val}>
                                  {val.toString().replace('.', ',')} pers.
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenRentrerMeal(key, 'lunch')}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 px-3 rounded-xl text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ml-auto"
                        >
                          <span>📝</span>
                          <span>Rentrer Déjeuner</span>
                        </button>
                      </div>
                      
                      {/* Résumé d'aliments du Déjeuner */}
                      {lunchSummary.length > 0 ? (
                        <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 font-bold text-xs text-blue-950 flex flex-wrap items-center gap-1.5 shadow-2xs">
                          {lunchSummary.map((itemObj, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-blue-400 font-black px-0.5">+</span>}
                              <span className={`px-2 py-0.5 rounded-lg border font-black text-[11px] ${getCategoryStyle(itemObj.category)}`}>
                                {itemObj.text}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic font-medium">Aucun aliment sélectionné</div>
                      )}

                      {/* Sélecteurs Déjeuner */}
                      <div className="grid grid-cols-1 gap-2 pt-1 border-t border-gray-100">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                            <span>🍳</span> Recette Régime
                          </span>
                          <SearchableSelect
                            options={dietRecipeOptions}
                            value={dayPlan.dietLunch?.dietRecipe || ''}
                            onChange={value => updateDietMealPlan(key, 'lunch', 'dietRecipe', value || undefined)}
                            placeholder="Sélectionner Recette..."
                            selectedClassName="text-blue-600 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Colonne Dîner */}
                    <div className="space-y-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                            Dîner
                          </span>
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                            <span className="text-[11px] font-black text-purple-700 whitespace-nowrap flex items-center gap-1">
                              <span>👥</span> <span>Pers. :</span>
                            </span>
                            <select
                              value={dayPlan.dietDinner?.servings ?? getDefaultDietServings(d, 'dinner', settings)}
                              onChange={(e) => updateDietMealPlan(key, 'dinner', 'servings', parseFloat(e.target.value))}
                              className="bg-transparent font-black text-xs text-purple-900 outline-none cursor-pointer"
                            >
                              {DIET_PERSON_OPTIONS.map(val => (
                                <option key={val} value={val}>
                                  {val.toString().replace('.', ',')} pers.
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenRentrerMeal(key, 'dinner')}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 px-3 rounded-xl text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ml-auto"
                        >
                          <span>📝</span>
                          <span>Rentrer Dîner</span>
                        </button>
                      </div>

                      {/* Résumé d'aliments du Dîner */}
                      {dinnerSummary.length > 0 ? (
                        <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 font-bold text-xs text-blue-950 flex flex-wrap items-center gap-1.5 shadow-2xs">
                          {dinnerSummary.map((itemObj, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-blue-400 font-black px-0.5">+</span>}
                              <span className={`px-2 py-0.5 rounded-lg border font-black text-[11px] ${getCategoryStyle(itemObj.category)}`}>
                                {itemObj.text}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic font-medium">Aucun aliment sélectionné</div>
                      )}

                      {/* Sélecteurs Dîner */}
                      <div className="grid grid-cols-1 gap-2 pt-1 border-t border-gray-100">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                            <span>🍳</span> Recette Régime
                          </span>
                          <SearchableSelect
                            options={dietRecipeOptions}
                            value={dayPlan.dietDinner?.dietRecipe || ''}
                            onChange={value => updateDietMealPlan(key, 'dinner', 'dietRecipe', value || undefined)}
                            placeholder="Sélectionner Recette..."
                            selectedClassName="text-blue-600 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Viennoiseries et Sauces en bas pour le mode régime */}
          {(() => {
            const sunday = days[6];
            const key = formatDateKey(sunday);
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Viennoiserie Card */}
                <div className="bg-white p-6 border border-pink-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-center font-black text-sm uppercase tracking-widest text-pink-500 mb-4 border-b border-pink-50 pb-2">
                    Viennoiseries et Gâteaux
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                          {mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) && (
                            <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                          )}
                        </div>
                        <select 
                          className={`w-full text-[10px] font-bold bg-pink-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.viennoiseries?.[i] ? 'text-blue-600' : ''} ${mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-pink-200'}`}
                          value={mealPlan[key]?.viennoiseries?.[i] || ''}
                          onChange={e => updateMealPlan(key, 'extra', 'viennoiseries', e.target.value || undefined, i)}
                        >
                          <option value="">Vide</option>
                          {sortedRecipes.filter(r => r.category === 'Viennoiserie' || r.category === 'Gâteaux').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sauce Card */}
                <div className="bg-white p-6 border border-blue-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                  <p className="text-center font-black text-sm uppercase tracking-widest text-blue-500 mb-4 border-b border-blue-50 pb-2">
                    Sauces et Coulis
                  </p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                          {mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) && (
                            <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                          )}
                        </div>
                        <select 
                          className={`w-full text-[10px] font-bold bg-blue-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.sauces?.[i] ? 'text-blue-600' : ''} ${mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-blue-200'}`}
                          value={mealPlan[key]?.sauces?.[i] || ''}
                          onChange={e => updateMealPlan(key, 'extra', 'sauces', e.target.value || undefined, i)}
                        >
                          <option value="">Vide</option>
                          {sortedRecipes.filter(r => r.category === 'Sauce' || r.category === 'Coulis').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL RENTRER DÉJEUNER / DÎNER */}
      {showRentrerMealModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-purple-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between shrink-0 gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-950 flex items-center gap-2">
                    <span>{rentrerMealType === 'lunch' ? '🥗' : '🍲'}</span>
                    <span>{rentrerMealType === 'lunch' ? 'Rentrer Déjeuner' : 'Rentrer Dîner'}</span>
                  </h3>
                  <p className="text-xs text-purple-700 font-bold mt-0.5">
                    Sélectionnez un ou plusieurs aliments dans chaque colonne
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-purple-200 shadow-2xs">
                  <span className="text-xs font-black text-purple-700 flex items-center gap-1">
                    <span>👥</span> <span>Pers. :</span>
                  </span>
                  <select
                    value={rentrerMealServings}
                    onChange={(e) => setRentrerMealServings(parseFloat(e.target.value))}
                    className="bg-transparent font-black text-sm text-purple-950 outline-none cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} pers.
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRentrerMealModal(false)}
                className="w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-100 font-black flex items-center justify-center text-lg border border-purple-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - 4 Columns */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Column 1: Protéines */}
              <div className="bg-red-50/30 border border-red-100 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-red-200/60 pb-2">
                  <span className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🥩</span> Protéines
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                    {dietItems.filter(i => i.category === 'Protéines').length + selectedProteins.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length} aliments
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Aliments enregistrés */}
                  {dietItems
                    .filter(i => i.category === 'Protéines')
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                    .map(item => {
                      const isChecked = selectedProteins.includes(item.id) || selectedProteins.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-red-100/90 border-red-300 text-red-950 font-black shadow-2xs'
                              : 'bg-white border-red-100/60 hover:bg-red-50/50 text-gray-700 font-bold'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedProteins(prev =>
                                prev.includes(item.id) || prev.includes(item.name)
                                  ? prev.filter(id => id !== item.id && id !== item.name)
                                  : [...prev, item.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 shrink-0"
                          />
                          <span className="text-xs flex-1">
                            {item.name} {scaledWeight ? <span className="text-[11px] opacity-80">({scaledWeight})</span> : null}
                          </span>
                        </label>
                      );
                    })}

                  {/* Aliments sélectionnés mais plus dans la liste de référence (permet de les décocher) */}
                  {selectedProteins
                    .filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase()))
                    .map(orphanedId => (
                      <label
                        key={orphanedId}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer bg-red-100/90 border-red-300 text-red-950 font-black shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setSelectedProteins(prev => prev.filter(id => id !== orphanedId));
                          }}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 shrink-0"
                        />
                        <span className="text-xs flex-1 flex items-center justify-between">
                          <span>{orphanedId}</span>
                          <span className="text-[10px] text-red-600 font-bold ml-1">(Supprimer)</span>
                        </span>
                      </label>
                    ))}

                  {dietItems.filter(i => i.category === 'Protéines').length === 0 && selectedProteins.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Aucun aliment protéiné enregistré</p>
                  )}
                </div>
              </div>

              {/* Column 2: Légumes */}
              <div className="bg-green-50/30 border border-green-100 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-green-200/60 pb-2">
                  <span className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🥦</span> Légumes
                  </span>
                  <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                    {dietItems.filter(i => i.category === 'Légumes').length + selectedVegetables.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length} aliments
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Aliments enregistrés */}
                  {dietItems
                    .filter(i => i.category === 'Légumes')
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                    .map(item => {
                      const isChecked = selectedVegetables.includes(item.id) || selectedVegetables.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-green-100/90 border-green-300 text-green-950 font-black shadow-2xs'
                              : 'bg-white border-green-100/60 hover:bg-green-50/50 text-gray-700 font-bold'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedVegetables(prev =>
                                prev.includes(item.id) || prev.includes(item.name)
                                  ? prev.filter(id => id !== item.id && id !== item.name)
                                  : [...prev, item.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-green-600 focus:ring-green-500 cursor-pointer accent-green-600 shrink-0"
                          />
                          <span className="text-xs flex-1">
                            {item.name} {scaledWeight ? <span className="text-[11px] opacity-80">({scaledWeight})</span> : null}
                          </span>
                        </label>
                      );
                    })}

                  {/* Aliments sélectionnés mais plus dans la liste de référence */}
                  {selectedVegetables
                    .filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase()))
                    .map(orphanedId => (
                      <label
                        key={orphanedId}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer bg-green-100/90 border-green-300 text-green-950 font-black shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setSelectedVegetables(prev => prev.filter(id => id !== orphanedId));
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 cursor-pointer accent-green-600 shrink-0"
                        />
                        <span className="text-xs flex-1 flex items-center justify-between">
                          <span>{orphanedId}</span>
                          <span className="text-[10px] text-green-700 font-bold ml-1">(Supprimer)</span>
                        </span>
                      </label>
                    ))}

                  {dietItems.filter(i => i.category === 'Légumes').length === 0 && selectedVegetables.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Aucun légume enregistré</p>
                  )}
                </div>
              </div>

              {/* Column 3: Féculents */}
              <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🥔</span> Féculents
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    {dietItems.filter(i => i.category === 'Féculents').length + selectedStarches.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length} aliments
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Aliments enregistrés */}
                  {dietItems
                    .filter(i => i.category === 'Féculents')
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                    .map(item => {
                      const isChecked = selectedStarches.includes(item.id) || selectedStarches.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-black shadow-2xs'
                              : 'bg-white border-amber-100/60 hover:bg-amber-50/50 text-gray-700 font-bold'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedStarches(prev =>
                                prev.includes(item.id) || prev.includes(item.name)
                                  ? prev.filter(id => id !== item.id && id !== item.name)
                                  : [...prev, item.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600 shrink-0"
                          />
                          <span className="text-xs flex-1">
                            {item.name} {scaledWeight ? <span className="text-[11px] opacity-80">({scaledWeight})</span> : null}
                          </span>
                        </label>
                      );
                    })}

                  {/* Aliments sélectionnés mais plus dans la liste de référence */}
                  {selectedStarches
                    .filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase()))
                    .map(orphanedId => (
                      <label
                        key={orphanedId}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer bg-amber-100/90 border-amber-300 text-amber-950 font-black shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setSelectedStarches(prev => prev.filter(id => id !== orphanedId));
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600 shrink-0"
                        />
                        <span className="text-xs flex-1 flex items-center justify-between">
                          <span>{orphanedId}</span>
                          <span className="text-[10px] text-amber-800 font-bold ml-1">(Supprimer)</span>
                        </span>
                      </label>
                    ))}

                  {dietItems.filter(i => i.category === 'Féculents').length === 0 && selectedStarches.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Aucun féculent enregistré</p>
                  )}
                </div>
              </div>

              {/* Column 4: Desserts */}
              <div className="bg-pink-50/30 border border-pink-100 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-pink-200/60 pb-2">
                  <span className="text-xs font-black text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🍨</span> Desserts
                  </span>
                  <span className="text-[10px] bg-pink-100 text-pink-900 font-bold px-2 py-0.5 rounded-full">
                    {dietItems.filter(i => i.category === 'Desserts').length + selectedDesserts.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length} aliments
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Aliments enregistrés */}
                  {dietItems
                    .filter(i => i.category === 'Desserts')
                    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                    .map(item => {
                      const isChecked = selectedDesserts.includes(item.id) || selectedDesserts.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-pink-100/90 border-pink-300 text-pink-950 font-black shadow-2xs'
                              : 'bg-white border-pink-100/60 hover:bg-pink-50/50 text-gray-700 font-bold'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedDesserts(prev =>
                                prev.includes(item.id) || prev.includes(item.name)
                                  ? prev.filter(id => id !== item.id && id !== item.name)
                                  : [...prev, item.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer accent-pink-600 shrink-0"
                          />
                          <span className="text-xs flex-1">
                            {item.name} {scaledWeight ? <span className="text-[11px] opacity-80">({scaledWeight})</span> : null}
                          </span>
                        </label>
                      );
                    })}

                  {/* Aliments sélectionnés mais plus dans la liste de référence */}
                  {selectedDesserts
                    .filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase()))
                    .map(orphanedId => (
                      <label
                        key={orphanedId}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer bg-pink-100/90 border-pink-300 text-pink-950 font-black shadow-2xs"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setSelectedDesserts(prev => prev.filter(id => id !== orphanedId));
                          }}
                          className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer accent-pink-600 shrink-0"
                        />
                        <span className="text-xs flex-1 flex items-center justify-between">
                          <span>{orphanedId}</span>
                          <span className="text-[10px] text-pink-700 font-bold ml-1">(Supprimer)</span>
                        </span>
                      </label>
                    ))}

                  {dietItems.filter(i => i.category === 'Desserts').length === 0 && selectedDesserts.filter(id => !dietItems.some(i => i.id === id || i.name.toLowerCase() === id.toLowerCase())).length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Aucun dessert enregistré</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedProteins([]);
                  setSelectedVegetables([]);
                  setSelectedStarches([]);
                  setSelectedDesserts([]);
                }}
                className="px-5 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>✕</span>
                <span>Décocher</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRentrerMealModal(false)}
                  className="px-5 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-black text-xs transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveRentrerMeal}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-200 transition-all active:scale-95 cursor-pointer"
                >
                  {rentrerMealType === 'lunch' ? 'Valider Déjeuner' : 'Valider Dîner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉCAPITULATIF PLANNING */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl space-y-8 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800">Recettes au Planning</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 bg-violet-50 p-1.5 rounded-xl border border-violet-100">
                    <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-violet-100 rounded-lg text-violet-600">
                      <EXT_ICONS.ArrowLeft />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 min-w-[140px] text-center">
                      {formatWeekRange(baseDate)}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-1 hover:bg-violet-100 rounded-lg text-violet-600">
                      <EXT_ICONS.ArrowRight />
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Recettes a envoyer</span>
                    <span className="text-sm font-black text-red-500">{unsentCount}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200">×</button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {days.map(d => {
                const dateStr = formatDateKey(d);
                const plan = mealPlan[dateStr];
                if (!plan) return null;

                const hasRecipes = (['lunch', 'dinner'] as const).some(type => 
                  (['recipe1', 'recipe2'] as const).some(slot => plan[type]?.[slot])
                ) || plan.viennoiseries?.some(v => v) || plan.sauces?.some(s => s);

                const hasDiet = (['dietLunch', 'dietDinner'] as const).some(mKey => {
                  const dObj = plan[mKey as 'dietLunch' | 'dietDinner'];
                  return dObj && (['protein', 'vegetable', 'starch', 'dietRecipe'] as const).some(s => dObj[s]);
                });

                if (!hasRecipes && !hasDiet) return null;

                return (
                  <div key={dateStr} className="space-y-3">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest border-b pb-1">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
                    <div className="space-y-4">
                      {/* Recettes */}
                      {(['lunch', 'dinner'] as const).map(type => {
                        const meal = plan[type];
                        if (!meal) return null;
                        const hasMeal = (['recipe1', 'recipe2'] as const).some(slot => meal[slot]);
                        if (!hasMeal) return null;

                        return (
                          <div key={type} className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-gray-400 block ml-2">{type === 'lunch' ? 'Recettes Midi' : 'Recettes Soir'}</span>
                            <div className="space-y-2">
                              {(['recipe1', 'recipe2'] as const).map((slot, idx) => {
                                const recipeId = meal[slot];
                                if (!recipeId) return null;
                                const r = recipes.find(rec => rec.id === recipeId);
                                if (!r) return null;

                                return (
                                  <div key={slot} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[7px] font-black uppercase text-purple-400 block mb-0.5">Recette {idx + 1}</span>
                                      <span className="font-black text-blue-600 text-sm truncate block">{r.title}</span>
                                    </div>
                                    {sentMeals.has(`${dateStr}-${type}-${slot}`) ? (
                                      <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                        <EXT_ICONS.Check /> Envoyé
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleSendRecipe(dateStr, type, slot, r.id)} 
                                        className="bg-purple-600 text-white p-2 rounded-xl hover:scale-105 transition-all shadow-sm shrink-0"
                                        title="Envoyer cette recette aux courses"
                                      >
                                        <EXT_ICONS.Cart />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Régime */}
                      {(['dietLunch', 'dietDinner'] as const).map(mealTypeKey => {
                        const dietObj = plan[mealTypeKey];
                        if (!dietObj) return null;

                        const hasDietItems = (['protein', 'vegetable', 'starch', 'dietRecipe'] as const).some(s => dietObj[s]);
                        if (!hasDietItems) return null;

                        const label = mealTypeKey === 'dietLunch' ? 'Régime Déjeuner' : 'Régime Dîner';

                        return (
                          <div key={mealTypeKey} className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-amber-600 block ml-2">{label}</span>
                            <div className="space-y-2">
                              {(['protein', 'vegetable', 'starch', 'dessert'] as const).map(slot => {
                                const itemId = dietObj[slot];
                                if (!itemId) return null;
                                const item = (dietItems || []).find(i => i.id === itemId);
                                if (!item) return null;

                                const scaledWeight = formatScaledWeight(item.weight, dietServings, 2.5);
                                const mealKey = `${dateStr}-${mealTypeKey}-${slot}`;
                                const isSent = sentMeals.has(mealKey);
                                const slotName = slot === 'protein' ? 'Protéines' : slot === 'vegetable' ? 'Légumes' : slot === 'starch' ? 'Féculents' : 'Desserts';

                                return (
                                  <div key={slot} className="flex justify-between items-center p-3 bg-amber-50/30 rounded-2xl border border-amber-100">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[7px] font-black uppercase text-amber-600 block mb-0.5">{slotName}</span>
                                      <span className="font-black text-gray-800 text-sm truncate block">
                                        {item.name} {scaledWeight ? `(${scaledWeight})` : ''}
                                      </span>
                                    </div>
                                    {isSent ? (
                                      <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                        <EXT_ICONS.Check /> Envoyé
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleSendDietItem(dateStr, mealTypeKey, slot, item.id)} 
                                        className="bg-amber-600 text-white p-2 rounded-xl hover:scale-105 transition-all shadow-sm shrink-0"
                                        title="Envoyer cet aliment aux courses"
                                      >
                                        <EXT_ICONS.Cart />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {dietObj.dietRecipe && (() => {
                                const dr = (dietRecipes || []).find(r => r.id === dietObj.dietRecipe);
                                if (!dr) return null;
                                const mealKey = `${dateStr}-${mealTypeKey}-dietRecipe`;
                                const isSent = sentMeals.has(mealKey);
                                return (
                                  <div key="dietRecipe" className="flex justify-between items-center p-3 bg-blue-50/30 rounded-2xl border border-blue-100">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[7px] font-black uppercase text-blue-600 block mb-0.5">Recette Régime</span>
                                      <span className="font-black text-blue-700 text-sm truncate block">
                                        {dr.name}
                                      </span>
                                    </div>
                                    {isSent ? (
                                      <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                        <EXT_ICONS.Check /> Envoyé
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleSendDietRecipe(dateStr, mealTypeKey, dr.id)} 
                                        className="bg-blue-600 text-white p-2 rounded-xl hover:scale-105 transition-all shadow-sm shrink-0"
                                        title="Envoyer cette recette régime aux courses"
                                      >
                                        <EXT_ICONS.Cart />
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}

                      {/* Extras in Summary */}
                      {(['viennoiseries', 'sauces'] as const).map(slot => {
                        const recipeIds = plan[slot] || [];
                        return recipeIds.map((recipeId, index) => {
                          if (!recipeId) return null;
                          const r = recipes.find(rec => rec.id === recipeId);
                          if (!r) return null;

                          return (
                            <div key={`${slot}-${index}`} className={`flex justify-between items-center p-3 rounded-2xl border ${slot === 'viennoiseries' ? 'bg-pink-50 border-pink-100' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex-1 min-w-0">
                                <span className={`text-[7px] font-black uppercase block mb-0.5 ${slot === 'viennoiseries' ? 'text-pink-400' : 'text-blue-400'}`}>{slot === 'viennoiseries' ? 'Viennoiserie et Gâteau' : 'Sauce et Coulis'} #{index + 1}</span>
                                <span className="font-black text-blue-600 text-sm truncate block">{r.title}</span>
                              </div>
                              {sentMeals.has(`${dateStr}-${slot}-${index}`) ? (
                                <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                  <EXT_ICONS.Check /> Envoyé
                                </span>
                              ) : (
                                <button 
                                  onClick={() => {
                                    const items = r.ingredients.map(ing => ({
                                      id: Math.random().toString(36).substr(2, 9),
                                      name: ing.name,
                                      amount: ing.amount,
                                      unit: ing.unit,
                                      checked: false
                                    }));
                                    onMergeToShopping(items);
                                    setSentMeals(prev => new Set(prev).add(`${dateStr}-${slot}-${index}`));
                                  }} 
                                  className={`p-1.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${slot === 'viennoiseries' ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                >
                                  Envoyer
                                </button>
                              )}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LES DEUX BOUTONS : FERMER ET TOUT ENVOYER */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowSummary(false)} className="w-full p-4 bg-gray-100 text-gray-700 rounded-3xl font-black transition-all hover:bg-gray-200">Fermer</button>
              <button onClick={handleSendAll} className="w-full p-4 bg-purple-600 text-white rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">🚀 Tout envoyer aux courses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingView: React.FC<{ 
  list: ShoppingListItem[]; 
  setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; 
  settings: UserSettings;
  foodPortions: FoodPortion[];
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  reserveItems: ShoppingListItem[];
  setReserveItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  pantryGroups: PantryGroup[];
  setPantryGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
}> = ({ list, setList, settings, foodPortions, foodCategories, onAddFoodToSettings, reserveItems, setReserveItems, pantryGroups, setPantryGroups }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [checkedSummaryItems, setCheckedSummaryItems] = useState<Set<string>>(new Set());
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Épicerie');
  const [selectedMatchModeShopping, setSelectedMatchModeShopping] = useState<string>('__NEW__');

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const allPortionNamesShopping = useMemo(() => {
    return (foodPortions || []).map(fp => fp.name.trim()).filter(Boolean);
  }, [foodPortions]);

  const similarShoppingSuggestions = useMemo(() => {
    if (!newItemName) return [];
    return findSimilarDietFoods(newItemName, allPortionNamesShopping);
  }, [newItemName, allPortionNamesShopping]);

  const toggle = (id: string) => setList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setList(prev => prev.filter(i => i.id !== id));
  
  const updateAmount = (id: string, newAmount: number) => {
    setList(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));
  };

  const updateReserveAmount = (id: string, newAmount: number) => {
    setReserveItems(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    const unit = newItemUnit;

    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const normalizedInput = normalize(name);
    const existing = foodPortions.find(fp => normalize(fp.name) === normalizedInput);

    if (!existing) {
      setSelectedMatchModeShopping('__NEW__');
      setShowNewFoodModal(true);
      return;
    }

    onAddFoodToSettings(name, unit, existing.category || 'Épicerie');

    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: newItemAmount,
      unit,
      checked: false
    };
    setList(prev => [item, ...prev]);
    setNewItemName('');
    setNewItemAmount(1);
  };

  const confirmNewFood = () => {
    let nameToAdd = newItemName.trim();
    let categoryToAdd = newFoodCategory;

    if (selectedMatchModeShopping !== '__NEW__' && selectedMatchModeShopping) {
      nameToAdd = selectedMatchModeShopping;
      const existing = foodPortions.find(fp => fp.name.toLowerCase() === selectedMatchModeShopping.toLowerCase());
      if (existing) categoryToAdd = existing.category || 'Épicerie';
    } else {
      onAddFoodToSettings(nameToAdd, newItemUnit, categoryToAdd);
    }

    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: nameToAdd,
      amount: newItemAmount,
      unit: newItemUnit,
      checked: false
    };
    setList(prev => [item, ...prev]);
    setNewItemName('');
    setNewItemAmount(1);
    setSelectedMatchModeShopping('__NEW__');
    setShowNewFoodModal(false);
  };

  useEffect(() => {
    const portions = foodPortions || [];
    const match = portions.find(p => p.name.toLowerCase() === newItemName.toLowerCase());
    if (match) setNewItemUnit(match.unit);
  }, [newItemName, foodPortions]);

  // Tri alphabétique automatique pour la liste de courses
  const sortedShoppingList = useMemo(() => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const consolidatedList = useMemo(() => {
    const map = new Map<string, ShoppingListItem>();
    (list || []).forEach(item => {
      const key = `${item.name.toLowerCase()}_${item.unit.toLowerCase()}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.amount += item.amount;
      } else {
        map.set(key, { ...item, id: Math.random().toString(36).substr(2, 9) });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const toggleSummaryCheck = (id: string) => {
    const next = new Set(checkedSummaryItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedSummaryItems(next);
  };

  const groupedConsolidatedList = useMemo(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    consolidatedList.forEach(item => {
      const portion = foodPortions.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      const cat = portion?.category || 'Autres';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [consolidatedList, foodPortions]);

  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 px-2 relative transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="sticky top-0 z-30 bg-purple-50/95 backdrop-blur-sm py-4 -mx-2 px-4 sm:px-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Liste de courses</h2>
            <p className="text-sm font-bold text-purple-400 mt-1 uppercase tracking-widest">
              {(list || []).filter(i => !i.checked).length}/{(list || []).length} articles en attente
            </p>
          </div>
          <button 
            onClick={() => setConfirmClearAll(true)} 
            className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            Tout effacer
          </button>
        </div>
      </div>

      {/* Manual Add Form */}
      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ajout rapide</p>
          <button 
            onClick={() => setShowReserveOnSide(!showReserveOnSide)}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${showReserveOnSide ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50'}`}
          >
            {showReserveOnSide ? 'Cacher la réserve' : 'Voir la réserve'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              type="text" 
              list="food-suggestions-shopping"
              placeholder="Ex: Beurre, Farine..."
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-purple-200"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddItem()}
            />
            <datalist id="food-suggestions-shopping">
              {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
            </datalist>
          </div>
          <div className="flex gap-2">
            <input type="number" className="w-20 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-black text-center text-purple-600 outline-none" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
            <select className="w-24 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-500 outline-none cursor-pointer" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
              <option value="boite">boite</option>
              <option value="C.à C">C.à C</option>
              <option value="C.à S">C.à S</option>
              <option value="cl">cl</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pièce">pc.</option>
              <option value="tranche">tr.</option>
              <option value="unité">u.</option>
            </select>
            <button onClick={handleAddItem} className="bg-purple-600 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${showReserveOnSide ? 'lg:flex-row' : ''} gap-8`}>
        {/* Main Shopping List */}
        <div className="flex-1 bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
          {(list || []).length === 0 ? (
            <div className="p-20 text-center text-gray-300 italic font-medium">Liste vide.</div>
          ) : (
            sortedShoppingList.map(i => (
              <div key={i.id} className={`p-5 flex gap-5 items-center transition-all ${i.checked ? 'bg-green-50/20' : ''}`}>
                <div onClick={() => toggle(i.id)} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                  {i.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <p className={`flex-1 font-bold text-lg ${i.checked ? 'line-through text-gray-300' : 'text-gray-800'}`}>{i.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input 
                    type="number"
                    className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                    value={i.amount}
                    onChange={(e) => updateAmount(i.id, Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                  />
                  <span className={`text-[10px] font-black ${i.checked ? 'text-gray-300' : 'text-purple-400'}`}>{i.unit}</span>
                </div>
                <button onClick={() => remove(i.id)} className="text-gray-200 hover:text-red-400 transition-colors font-bold text-xl ml-2">×</button>
              </div>
            ))
          )}
        </div>

        {/* Side Reserve List */}
        {showReserveOnSide && (
          <div className="w-full lg:w-80 bg-white border border-purple-50 rounded-[40px] shadow-sm flex flex-col animate-slideInRight h-fit max-h-[600px] overflow-hidden">
            <div className="p-6 bg-purple-50/30 border-b border-purple-50">
              <h3 className="text-lg font-black text-purple-600 uppercase tracking-tight">Ma Réserve</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Consultation rapide</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
              {(reserveItems || []).length === 0 ? (
                <div className="p-8 text-center text-gray-300 italic text-sm">Réserve vide.</div>
              ) : (
                [...reserveItems].sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-purple-50/20 transition-colors">
                    <span className="font-bold text-gray-700 text-sm flex-1">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input 
                        type="number"
                        className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                        value={item.amount}
                        onChange={(e) => updateReserveAmount(item.id, Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="text-[10px] font-black text-purple-400">{item.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(list || []).length > 0 && !showSummary && (
        <div className="fixed bottom-24 left-0 right-0 p-6 md:relative md:bottom-0 md:p-0 flex justify-center z-40">
          <button onClick={() => { setCheckedSummaryItems(new Set()); setShowSummary(true); }} className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-green-100 hover:scale-105 transition-all active:scale-95">
             🚀 Valider la Pré liste
          </button>
        </div>
      )}

      {/* MODAL RÉCAPITULATIF FINAL */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-10 pb-24">
             <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-4 pb-8 flex justify-between items-center border-b -mx-6 px-6">
               <div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">Liste de courses finale</h2>
                 <p className="text-sm font-bold text-green-600 mt-1 uppercase tracking-widest">
                   {checkedSummaryItems.size}/{consolidatedList.length} articles validés
                 </p>
               </div>
               <button onClick={() => setShowSummary(false)} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-all">×</button>
             </header>

             <div className="space-y-8">
                {(settings.foodCategories || FOOD_CATEGORIES).map(cat => {
                  const items = groupedConsolidatedList[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest border-b border-purple-100 pb-2 px-2">{cat}</h3>
                      <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                        {items.map(item => (
                          <div key={item.id} className="p-6 flex items-center transition-all">
                            <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                               {checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`flex-1 font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span>
                            <span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>{item.amount} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Autres catégories */}
                {groupedConsolidatedList['Autres'] && groupedConsolidatedList['Autres'].length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 px-2">Autres</h3>
                    <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                      {groupedConsolidatedList['Autres'].map(item => (
                        <div key={item.id} className="p-6 flex items-center transition-all">
                          <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                             {checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`flex-1 font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span>
                          <span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>{item.amount} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="pt-8 space-y-4">
                <button 
                  onClick={() => {
                    setList([]);
                    setPantryGroups(prev => prev.map(g => ({
                      ...g,
                      items: g.items.map(i => ({ ...i, checked: false }))
                    })));
                    setShowSummary(false);
                  }} 
                  className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  🚀 Supprimer la liste & la pré liste
                </button>
                <button 
                  onClick={() => setShowSummary(false)} 
                  className="w-full bg-gray-100 text-gray-500 p-6 rounded-3xl font-black hover:bg-gray-200 transition-all"
                >
                  Revenir à ma pré liste
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION TOUT EFFACER */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-800">Vider toute la liste ?</h3>
            <p className="text-gray-500 font-medium">Cette action supprimera tous les articles de votre liste de courses.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmClearAll(false)} className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all">Annuler</button>
              <button 
                onClick={() => {
                  setList([]);
                  setConfirmClearAll(false);
                }} 
                className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVEL ALIMENT (Ajout rapide) */}
      {showNewFoodModal && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-slideUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">✨</div>
            <h3 className="text-xl font-black text-gray-800">Aliment à classer</h3>
            <p className="text-gray-500 font-medium text-xs">
              L'article <span className="text-purple-600 font-bold">"{newItemName}"</span> n'est pas encore enregistré.
            </p>

            <div className="space-y-3 text-left">
              {/* Mode Créer nouveau */}
              <button
                type="button"
                onClick={() => setSelectedMatchModeShopping('__NEW__')}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectedMatchModeShopping === '__NEW__'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✨</span>
                  <div>
                    <p className="font-black text-xs">Créer « {newItemName} »</p>
                    <p className="text-[10px] text-gray-500">Ajouter comme nouvel aliment dans vos réglages</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedMatchModeShopping === '__NEW__' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                }`}>
                  {selectedMatchModeShopping === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                </div>
              </button>

              {/* Suggestions existantes */}
              {similarShoppingSuggestions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                    Ou utiliser un aliment existant :
                  </p>
                  <div className="space-y-1.5">
                    {similarShoppingSuggestions.map(sug => {
                      const isSug = selectedMatchModeShopping === sug;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setSelectedMatchModeShopping(sug)}
                          className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSug
                              ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🔄</span>
                            <p className="font-black text-xs">Utiliser : « <span className="text-purple-700">{sug}</span> »</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSug ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                          }`}>
                            {isSug && <span className="text-[10px] font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Choix de la catégorie si __NEW__ */}
              {selectedMatchModeShopping === '__NEW__' && (
                <div className="space-y-1 pt-2 animate-fadeIn">
                  <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">Choix de la catégorie</label>
                  <select 
                    className="w-full p-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                    value={newFoodCategory}
                    onChange={e => setNewFoodCategory(e.target.value)}
                  >
                    {foodCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewFoodModal(false)} className="flex-1 p-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs active:scale-95 transition-all">
                Annuler
              </button>
              <button 
                onClick={confirmNewFood} 
                className="flex-1 p-3.5 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-100 active:scale-95 transition-all"
              >
                {selectedMatchModeShopping === '__NEW__' ? "Ajouter" : "Utiliser cet aliment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings: React.FC<{ 
  settings: UserSettings; 
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  exportToJSON: () => void;
  importFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportToExcel: () => void;
  importFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportPlanningToJSON: () => void;
  importPlanningFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportDietItemsToExcel: () => void;
  importDietItemsFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportDietPlanningToJSON: () => void;
  importDietPlanningFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportDietRecipesToJSON: () => void;
  importDietRecipesFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sentMeals: Set<string>;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  recipes?: Recipe[];
  dietRecipes?: DietRecipe[];
  pantryGroups?: PantryGroup[];
  reserveItems?: ShoppingListItem[];
}> = ({ 
  settings, 
  setSettings, 
  exportToJSON, 
  importFromJSON, 
  exportToExcel, 
  importFromExcel, 
  exportPlanningToJSON, 
  importPlanningFromJSON, 
  exportDietItemsToExcel, 
  importDietItemsFromExcel, 
  exportDietPlanningToJSON, 
  importDietPlanningFromJSON, 
  exportDietRecipesToJSON, 
  importDietRecipesFromJSON, 
  sentMeals, 
  setSentMeals,
  recipes = [],
  dietRecipes = [],
  pantryGroups = [],
  reserveItems = []
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<string>('none');
  const [newCategoryFoodNames, setNewCategoryFoodNames] = useState<Record<string, string>>({});
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedUncategorized, setExpandedUncategorized] = useState(false);
  const [showSecoursForm, setShowSecoursForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEditFoodForm, setShowEditFoodForm] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [futureCategory, setFutureCategory] = useState<string>('none');
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showResetAppModal, setShowResetAppModal] = useState(false);
  const [showDeleteFoodModal, setShowDeleteFoodModal] = useState(false);
  const [lastEditedFoodName, setLastEditedFoodName] = useState('');
  const [lastEditedCategoryName, setLastEditedCategoryName] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodName, setAddFoodName] = useState('');
  const [addFoodCategory, setAddFoodCategory] = useState<string>('none');

  const foodToDelete = useMemo(() => {
    if (!selectedFoodId) return null;
    return (settings.foodPortions || []).find(f => f.id === selectedFoodId) || null;
  }, [settings.foodPortions, selectedFoodId]);

  const foodUsages = useMemo(() => {
    if (!foodToDelete) return { recipes: [], dietRecipes: [], recurring: [], reserve: [], total: 0 };
    const foodName = foodToDelete.name;

    const isMatch = (targetText: string) => {
      if (!targetText) return false;
      const cleanTarget = targetText.trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanFood = foodName.trim().toLowerCase().replace(/\s+/g, ' ');
      return cleanTarget === cleanFood;
    };

    const matchedRecipes = recipes.filter(r => 
      (r.ingredients || []).some(ing => ing.name && isMatch(ing.name))
    );

    const matchedDietRecipes = dietRecipes.filter(dr => {
      const hasInItems = (dr.items || []).some(item => item.name && isMatch(item.name));
      const hasInIngredients = dr.ingredients 
        ? dr.ingredients.split(/[,;\n]/).some(part => isMatch(part))
        : false;
      return hasInItems || hasInIngredients;
    });

    const matchedRecurring: { groupName: string; itemName: string }[] = [];
    pantryGroups.forEach(g => {
      (g.items || []).forEach(item => {
        if (item.name && isMatch(item.name)) {
          matchedRecurring.push({ groupName: g.name, itemName: item.name });
        }
      });
    });

    const matchedReserve = reserveItems.filter(item => item.name && isMatch(item.name));

    const total = matchedRecipes.length + matchedDietRecipes.length + matchedRecurring.length + matchedReserve.length;

    return {
      recipes: matchedRecipes,
      dietRecipes: matchedDietRecipes,
      recurring: matchedRecurring,
      reserve: matchedReserve,
      total
    };
  }, [foodToDelete, recipes, dietRecipes, pantryGroups, reserveItems]);

  const addFoodSuggestions = useMemo(() => {
    if (!addFoodName.trim()) return [];
    const existingNames = (settings.foodPortions || []).map(fp => fp.name.trim()).filter(Boolean);
    return findSimilarDietFoods(addFoodName, existingNames);
  }, [addFoodName, settings.foodPortions]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState('');
  const [secoursBaseDate, setSecoursBaseDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 6 ? 0 : day + 1);
    const saturday = new Date(d.setDate(diff));
    saturday.setHours(0, 0, 0, 0);
    return saturday;
  });

  const formatWeekRange = (date: Date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const f = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `du ${f(start)} au ${f(end)}`;
  };

  const handleResetWeek = () => {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(secoursBaseDate);
      d.setDate(secoursBaseDate.getDate() + i);
      return formatDateKey(d);
    });

    setSentMeals(prev => {
      const next = new Set(prev);
      for (const mealKey of prev) {
        if (weekDates.some(date => mealKey.startsWith(date))) {
          next.delete(mealKey);
        }
      }
      return next;
    });
    setShowResetConfirm(false);
    setShowSecoursForm(false);
    alert("Envois réinitialisés pour cette semaine !");
  };

  const handleDeleteFood = () => {
    if (!selectedFoodId) return;
    setShowDeleteFoodModal(true);
  };

  const confirmDeleteFood = () => {
    if (!selectedFoodId) return;
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).filter(f => f.id !== selectedFoodId)
    }));

    setShowDeleteFoodModal(false);
    setShowEditFoodForm(false);
    setSelectedFoodId('');
    setFutureCategory('none');
  };

  const handleCategoryChange = () => {
    const food = (settings.foodPortions || []).find(f => f.id === selectedFoodId);
    if (!food) return;

    const catName = futureCategory === 'none' ? undefined : futureCategory;
    
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).map(f => 
        f.id === selectedFoodId ? { ...f, category: catName } : f
      )
    }));

    setLastEditedFoodName(food.name);
    setLastEditedCategoryName(futureCategory === 'none' ? 'Sans catégorie' : futureCategory);
    setShowEditSuccessModal(true);
    setShowEditFoodForm(false);
    setSelectedFoodId('');
    setFutureCategory('none');
  };

  const handleAddNewFood = () => {
    if (!addFoodName.trim()) return;
    setSettings(prev => ({
      ...prev,
      foodPortions: [...(prev.foodPortions || []), {
        id: Math.random().toString(36).substr(2, 9),
        name: addFoodName.trim(),
        amount: 1,
        unit: 'g',
        category: addFoodCategory === 'none' ? undefined : addFoodCategory
      }].sort((a,b) => a.name.localeCompare(b.name))
    }));
    setAddFoodName('');
    setAddFoodCategory('none');
    setShowAddFoodModal(false);
  };

  const handleAddNewCategory = () => {
    if (!addCategoryName.trim()) return;
    setSettings(prev => ({
      ...prev,
      foodCategories: [...(prev.foodCategories || FOOD_CATEGORIES), addCategoryName.trim()]
    }));
    setAddCategoryName('');
    setShowAddCategoryModal(false);
  };

  const currentCategories = settings.foodCategories || FOOD_CATEGORIES;

  const toggleSection = (id: string) => setActiveSection(activeSection === id ? null : id);

  const startEditFood = (food: FoodPortion) => {
    setEditingFoodId(food.id);
    setEditingName(food.name);
  };

  const saveFoodName = (id: string) => {
    if (!editingName.trim()) return;
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).map(f => f.id === id ? { ...f, name: editingName.trim() } : f)
    }));
    setEditingFoodId(null);
  };

  const startEditCategory = (cat: string) => {
    setEditingCategoryId(cat);
    setEditingCategoryName(cat);
  };

  const saveCategoryName = (oldName: string) => {
    const newName = editingCategoryName.trim();
    if (!newName || newName === oldName) {
      setEditingCategoryId(null);
      return;
    }

    setSettings(prev => {
      const updatedCategories = (prev.foodCategories || FOOD_CATEGORIES).map(c => c === oldName ? newName : c);
      const updatedPortions = (prev.foodPortions || []).map(p => p.category === oldName ? { ...p, category: newName } : p);
      return { ...prev, foodCategories: updatedCategories, foodPortions: updatedPortions };
    });
    setEditingCategoryId(null);
  };

  const assignCategory = (foodId: string, category: string) => {
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).map(f => f.id === foodId ? { ...f, category: category === 'none' ? undefined : category } : f)
    }));
  };

  const toggleCategoryExpand = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const addFoodToCategory = (category: string) => {
    const name = newCategoryFoodNames[category]?.trim();
    if (!name) return;
    
    setSettings(prev => ({
      ...prev,
      foodPortions: [...(prev.foodPortions || []), { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        amount: 1, 
        unit: 'g',
        category 
      }]
    }));
    
    setNewCategoryFoodNames(prev => ({ ...prev, [category]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-black text-gray-800 text-center tracking-tight mb-8">Réglages</h2>
      
      <div className="space-y-4">
        {/* SECTION PARAMÈTRES */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all">
          <button onClick={() => toggleSection('params')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all text-left">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">⚙️</div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Paramètres</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configuration</p>
              </div>
            </div>
            <svg className={`w-6 h-6 text-gray-300 transition-transform ${activeSection === 'params' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {activeSection === 'params' && (
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-12 animate-slideDown">
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-800">Par quelle journée voulez vous commencer votre semaine ?</label>
                <select 
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-white font-bold outline-none"
                  value={settings.startDay ?? 1}
                  onChange={e => setSettings(prev => ({ ...prev, startDay: parseInt(e.target.value) }))}
                >
                  <option value={0}>Dimanche</option>
                  <option value={1}>Lundi</option>
                  <option value={2}>Mardi</option>
                  <option value={3}>Mercredi</option>
                  <option value={4}>Jeudi</option>
                  <option value={5}>Vendredi</option>
                  <option value={6}>Samedi</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-800">Quelle semaine voulez vous afficher par défaut dans planning ?</label>
                <select 
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-white font-bold outline-none"
                  value={settings.defaultWeek ?? 'current'}
                  onChange={e => setSettings(prev => ({ ...prev, defaultWeek: e.target.value as 'current' | 'next' }))}
                >
                  <option value="current">Semaine actuelle</option>
                  <option value="next">Semaine prochaine</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-800">Quelle page voulez-vous afficher par défaut dans l'onglet Recettes ?</label>
                <select 
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-white font-bold outline-none"
                  value={settings.defaultRecipesTab ?? 'recipes'}
                  onChange={e => setSettings(prev => ({ ...prev, defaultRecipesTab: e.target.value as 'recipes' | 'regime' }))}
                >
                  <option value="recipes">Recettes</option>
                  <option value="regime">Régime</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-800">Quelle page voulez-vous afficher par défaut dans l'onglet Planning ?</label>
                <select 
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-white font-bold outline-none"
                  value={settings.defaultPlanningTab ?? 'recipes'}
                  onChange={e => setSettings(prev => ({ ...prev, defaultPlanningTab: e.target.value as 'recipes' | 'regime' }))}
                >
                  <option value="recipes">Recettes</option>
                  <option value="regime">Régime</option>
                </select>
              </div>

              {/* 1. Personnes par défaut dans Planning régime */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <label className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <span>👥</span>
                  <span>Combien de personnes par défaut dans Planning régime pour déjeuner et dîner ?</span>
                </label>
                <div className="flex items-center gap-3 bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs">
                  <span className="text-xs font-black text-purple-700 whitespace-nowrap flex items-center gap-1.5">
                    <span>👥</span> <span>Personne :</span>
                  </span>
                  <select 
                    className="flex-1 bg-transparent font-black text-sm text-gray-800 outline-none cursor-pointer"
                    value={settings.dietServingsDefault ?? 2.5}
                    onChange={e => setSettings(prev => ({ ...prev, dietServingsDefault: parseFloat(e.target.value) }))}
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} {val > 1 ? 'personnes' : 'personne'} {val === 2.5 ? '(par défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Sélection des jours déjeuner pour changer le nombre de personnes par défaut */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <label className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <span>🥗</span>
                  <span>Sélection des jours déjeuner pour changer le nombre de personnes par défaut ?</span>
                </label>
                <div className="flex items-center gap-3 bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs">
                  <span className="text-xs font-black text-purple-700 whitespace-nowrap flex items-center gap-1.5">
                    <span>👥</span> <span>Personne :</span>
                  </span>
                  <select 
                    className="flex-1 bg-transparent font-black text-sm text-gray-800 outline-none cursor-pointer"
                    value={settings.dietLunchCustomServings ?? 1}
                    onChange={e => setSettings(prev => ({ ...prev, dietLunchCustomServings: parseFloat(e.target.value) }))}
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} {val > 1 ? 'personnes' : 'personne'} {val === 1 ? '(par défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider">
                    Jours de la semaine :
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK_CONFIG.map(day => {
                      const selectedDays = settings.dietLunchCustomDays ?? [1, 2, 3, 4, 5];
                      const isChecked = selectedDays.includes(day.id);
                      return (
                        <label 
                          key={day.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-purple-50 border-purple-200 text-purple-900 shadow-2xs' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                            checked={isChecked}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...selectedDays, day.id]
                                : selectedDays.filter(id => id !== day.id);
                              setSettings(prev => ({ ...prev, dietLunchCustomDays: newDays }));
                            }}
                          />
                          <span>{day.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold italic">
                    Pour les jours décochés, la valeur par défaut de la question 1 ({settings.dietServingsDefault ?? 2.5} pers.) sera appliquée.
                  </p>
                </div>
              </div>

              {/* 3. Sélection des jours dîner pour changer le nombre de personnes par défaut */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <label className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <span>🍲</span>
                  <span>Sélection des jours dîner pour changer le nombre de personnes par défaut ?</span>
                </label>
                <div className="flex items-center gap-3 bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs">
                  <span className="text-xs font-black text-purple-700 whitespace-nowrap flex items-center gap-1.5">
                    <span>👥</span> <span>Personne :</span>
                  </span>
                  <select 
                    className="flex-1 bg-transparent font-black text-sm text-gray-800 outline-none cursor-pointer"
                    value={settings.dietDinnerCustomServings ?? 2.5}
                    onChange={e => setSettings(prev => ({ ...prev, dietDinnerCustomServings: parseFloat(e.target.value) }))}
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} {val > 1 ? 'personnes' : 'personne'} {val === 2.5 ? '(par défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-wider">
                    Jours de la semaine :
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK_CONFIG.map(day => {
                      const selectedDays = settings.dietDinnerCustomDays ?? [];
                      const isChecked = selectedDays.includes(day.id);
                      return (
                        <label 
                          key={day.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-purple-50 border-purple-200 text-purple-900 shadow-2xs' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                            checked={isChecked}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...selectedDays, day.id]
                                : selectedDays.filter(id => id !== day.id);
                              setSettings(prev => ({ ...prev, dietDinnerCustomDays: newDays }));
                            }}
                          />
                          <span>{day.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold italic">
                    Pour les jours décochés, la valeur par défaut de la question 1 ({settings.dietServingsDefault ?? 2.5} pers.) sera appliquée.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION ALIMENTS */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all">
          <button onClick={() => toggleSection('food')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all text-left">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">🍎</div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Aliments</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Noms uniquement</p>
              </div>
            </div>
            <svg className={`w-6 h-6 text-gray-300 transition-transform ${activeSection === 'food' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {activeSection === 'food' && (
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-12 animate-slideDown">
              {/* Modifier un aliment section */}
              <div className="space-y-4">
                <button 
                  onClick={() => setShowEditFoodForm(!showEditFoodForm)}
                  className="w-full bg-white text-purple-600 p-4 rounded-2xl font-black border-2 border-purple-100 hover:bg-purple-50 transition-all shadow-sm flex items-center justify-center gap-3"
                >
                  <EXT_ICONS.Edit />
                  Modifier ou supprimer un aliment
                </button>

                <button 
                  onClick={() => setShowAddFoodModal(true)}
                  className="w-full bg-white text-blue-600 p-4 rounded-2xl font-black border-2 border-blue-100 hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-3"
                >
                  <span>➕</span>
                  Ajouter un aliment
                </button>

                <button 
                  onClick={() => setShowAddCategoryModal(true)}
                  className="w-full bg-white text-green-600 p-4 rounded-2xl font-black border-2 border-green-100 hover:bg-green-50 transition-all shadow-sm flex items-center justify-center gap-3"
                >
                  <span>📁</span>
                  Ajouter une catégorie
                </button>

                {showEditFoodForm && (
                  <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Nom de l'aliment</label>
                        <select 
                          className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none mt-1"
                          value={selectedFoodId}
                          onChange={e => setSelectedFoodId(e.target.value)}
                        >
                          <option value="">Sélectionner un aliment...</option>
                          {(settings.foodPortions || []).sort((a,b) => a.name.localeCompare(b.name)).map(f => (
                            <option key={f.id} value={f.id}>{f.name} [{f.category || 'Sans catégorie'}]</option>
                          ))}
                        </select>
                      </div>

                      {selectedFoodId && (
                        <div className="animate-fadeIn">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Catégorie actuelle</label>
                          <div className="p-4 bg-gray-100 rounded-2xl font-bold text-gray-600 mt-1">
                            {(settings.foodPortions || []).find(f => f.id === selectedFoodId)?.category || 'Sans catégorie'}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Catégorie futur</label>
                        <select 
                          className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none mt-1"
                          value={futureCategory}
                          onChange={e => setFutureCategory(e.target.value)}
                        >
                          <option value="none">Sans catégorie</option>
                          {currentCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setShowEditFoodForm(false); setSelectedFoodId(''); setFutureCategory('none'); }} 
                          className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleCategoryChange}
                          disabled={!selectedFoodId}
                          className={`flex-1 p-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 ${selectedFoodId ? 'bg-purple-600 text-white shadow-purple-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          Changement de catégories
                        </button>
                      </div>
                      {selectedFoodId && (
                        <button
                          onClick={handleDeleteFood}
                          className="w-full p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-black hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <EXT_ICONS.Trash />
                          <span>Supprimer l'aliment</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Aliments List (Uncategorized) */}
              <div className="space-y-6">
                <button 
                  onClick={() => setExpandedUncategorized(!expandedUncategorized)}
                  className="w-full flex items-center justify-between text-sm font-black text-gray-400 uppercase tracking-widest border-b pb-2 hover:text-gray-600 transition-colors"
                >
                  <span>Aliments sans catégorie</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedUncategorized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {expandedUncategorized && (
                  <div className="space-y-6 animate-slideDown">
                    <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-3xl border border-purple-100">
                      <input className="flex-1 p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Nom..." value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                      <select 
                        className="p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:border-purple-200"
                        value={newFoodCategory}
                        onChange={e => setNewFoodCategory(e.target.value)}
                      >
                        <option value="none">Sans catégorie</option>
                        {currentCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          if(!newFoodName.trim()) return;
                          setSettings({ ...settings, foodPortions: [...(settings.foodPortions || []), { 
                            id: Math.random().toString(36).substr(2, 9), 
                            name: newFoodName.trim(), 
                            amount: 1, 
                            unit: 'g',
                            category: newFoodCategory === 'none' ? undefined : newFoodCategory
                          }] });
                          setNewFoodName('');
                          setNewFoodCategory('none');
                        }} 
                        className="bg-purple-600 text-white px-8 rounded-2xl font-black shadow-lg"
                      >
                        Ajouter
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(settings.foodPortions || [])
                        .filter(p => !p.category)
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(p => (
                        <div key={p.id} className="flex flex-col gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                          <div className="flex items-center gap-4">
                            {editingFoodId === p.id ? (
                              <div className="flex-1 flex gap-2">
                                <input 
                                  className="flex-1 p-2 border border-purple-200 rounded-lg outline-none font-bold text-gray-700 bg-purple-50"
                                  value={editingName}
                                  onChange={e => setEditingName(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && saveFoodName(p.id)}
                                  autoFocus
                                />
                                <button onClick={() => saveFoodName(p.id)} className="bg-green-500 text-white p-2 rounded-lg"><EXT_ICONS.Check /></button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 font-bold text-gray-700">{p.name}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => startEditFood(p)} className="text-gray-300 hover:text-purple-600 transition-colors p-2" title="Modifier"><EXT_ICONS.Edit /></button>
                                  <button onClick={() => setSettings({ ...settings, foodPortions: (settings.foodPortions || []).filter(x => x.id !== p.id) })} className="text-red-400 font-bold text-xl hover:scale-110 transition-transform p-2">×</button>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie :</span>
                            <select 
                              className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-purple-200"
                              value="none"
                              onChange={(e) => assignCategory(p.id, e.target.value)}
                            >
                              <option value="none">Sélectionner...</option>
                              {currentCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Categorized Lists */}
              {currentCategories.map(cat => (
                <div key={cat} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    {editingCategoryId === cat ? (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input 
                          className="flex-1 p-2 border border-purple-200 rounded-lg outline-none font-bold text-purple-700 bg-purple-50"
                          value={editingCategoryName}
                          onChange={e => setEditingCategoryName(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && saveCategoryName(cat)}
                          autoFocus
                        />
                        <button onClick={() => saveCategoryName(cat)} className="bg-green-500 text-white p-2 rounded-lg"><EXT_ICONS.Check /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest">{cat}</h4>
                          <button onClick={() => startEditCategory(cat)} className="text-gray-300 hover:text-purple-600 transition-colors" title="Modifier le nom de la catégorie">
                            <EXT_ICONS.Edit />
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleCategoryExpand(cat)}
                          className="text-purple-300 hover:text-purple-600 transition-colors p-2"
                        >
                          <svg className={`w-5 h-5 transition-transform ${expandedCategories.has(cat) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {expandedCategories.has(cat) && (
                    <div className="space-y-6 animate-slideDown">
                      <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-3xl border border-purple-100">
                        <input 
                          className="flex-1 p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" 
                          placeholder={`Ajouter dans ${cat}...`} 
                          value={newCategoryFoodNames[cat] || ''} 
                          onChange={e => setNewCategoryFoodNames(prev => ({ ...prev, [cat]: e.target.value }))} 
                          onKeyPress={e => e.key === 'Enter' && addFoodToCategory(cat)}
                        />
                        <button 
                          onClick={() => addFoodToCategory(cat)} 
                          className="bg-purple-600 text-white px-8 rounded-2xl font-black shadow-lg"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(settings.foodPortions || [])
                          .filter(p => p.category === cat)
                          .sort((a,b) => a.name.localeCompare(b.name))
                          .map(p => (
                          <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                            {editingFoodId === p.id ? (
                              <div className="flex-1 flex gap-2">
                                <input 
                                  className="flex-1 p-2 border border-purple-200 rounded-lg outline-none font-bold text-gray-700 bg-purple-50"
                                  value={editingName}
                                  onChange={e => setEditingName(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && saveFoodName(p.id)}
                                  autoFocus
                                />
                                <button onClick={() => saveFoodName(p.id)} className="bg-green-500 text-white p-2 rounded-lg"><EXT_ICONS.Check /></button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 font-bold text-gray-700">{p.name}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => startEditFood(p)} className="text-gray-300 hover:text-purple-600 transition-colors p-2" title="Modifier"><EXT_ICONS.Edit /></button>
                                  <button onClick={() => setSettings({ ...settings, foodPortions: (settings.foodPortions || []).filter(x => x.id !== p.id) })} className="text-red-400 font-bold text-xl hover:scale-110 transition-transform p-2">×</button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION DONNÉES & SYNC */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all">
          <button onClick={() => toggleSection('data')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all text-left">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🔄</div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Données & Synchronisation</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Exportations et Imports</p>
              </div>
            </div>
            <svg className={`w-6 h-6 text-gray-300 transition-transform ${activeSection === 'data' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {activeSection === 'data' && (
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-6 animate-slideDown">
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest border-b pb-2">Sauvegarde complète (JSON)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportToJSON} className="bg-purple-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-purple-100 hover:scale-[1.02] transition-all">Exporter (JSON)</button>
                <label className="bg-white text-purple-600 p-6 rounded-3xl font-black border-2 border-dashed border-purple-100 cursor-pointer hover:bg-purple-50 transition-all text-center">
                  Importer (JSON)
                  <input type="file" accept=".json" className="hidden" onChange={importFromJSON} />
                </label>
              </div>

              <p className="text-xs font-black text-green-600 uppercase tracking-widest border-b pb-2 mt-6">Stocks & Listes (Excel)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportToExcel} className="bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-green-100 hover:scale-[1.02] transition-all">Exporter Excel (Récurrents + Réserve + Aliments)</button>
                <label className="bg-white text-green-600 p-6 rounded-3xl font-black border-2 border-dashed border-green-100 cursor-pointer hover:bg-green-50 transition-all text-center">
                  Importer Excel
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importFromExcel} />
                </label>
              </div>

              <p className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2 mt-6">Planning (JSON)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportPlanningToJSON} className="bg-blue-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all">Exporter Planning (JSON)</button>
                <label className="bg-white text-blue-600 p-6 rounded-3xl font-black border-2 border-dashed border-blue-100 cursor-pointer hover:bg-blue-50 transition-all text-center">
                  Importer Planning (JSON)
                  <input type="file" accept=".json" className="hidden" onChange={importPlanningFromJSON} />
                </label>
              </div>

              <p className="text-xs font-black text-amber-600 uppercase tracking-widest border-b pb-2 mt-6">Aliments Régime (EXCEL)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportDietItemsToExcel} className="bg-amber-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-amber-100 hover:scale-[1.02] transition-all">Exporter Aliments Régime (EXCEL)</button>
                <label className="bg-white text-amber-600 p-6 rounded-3xl font-black border-2 border-dashed border-amber-100 cursor-pointer hover:bg-amber-50 transition-all text-center">
                  Importer Aliments Régime (EXCEL)
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importDietItemsFromExcel} />
                </label>
              </div>

              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b pb-2 mt-6">Planning Régime (JSON)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportDietPlanningToJSON} className="bg-emerald-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-emerald-100 hover:scale-[1.02] transition-all">Exporter Planning Régime (JSON)</button>
                <label className="bg-white text-emerald-600 p-6 rounded-3xl font-black border-2 border-dashed border-emerald-100 cursor-pointer hover:bg-emerald-50 transition-all text-center">
                  Importer Planning Régime (JSON)
                  <input type="file" accept=".json" className="hidden" onChange={importDietPlanningFromJSON} />
                </label>
              </div>

              <p className="text-xs font-black text-teal-600 uppercase tracking-widest border-b pb-2 mt-6">Recettes Régime (JSON)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportDietRecipesToJSON} className="bg-teal-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-teal-100 hover:scale-[1.02] transition-all">Exporter Recettes Régime (JSON)</button>
                <label className="bg-white text-teal-600 p-6 rounded-3xl font-black border-2 border-dashed border-teal-100 cursor-pointer hover:bg-teal-50 transition-all text-center">
                  Importer Recettes Régime (JSON)
                  <input type="file" accept=".json" className="hidden" onChange={importDietRecipesFromJSON} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SECTION SECOURS */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all">
          <button onClick={() => toggleSection('secours')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all text-left">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl">🆘</div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Secours</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Réinitialisations & Dépannage</p>
              </div>
            </div>
            <svg className={`w-6 h-6 text-gray-300 transition-transform ${activeSection === 'secours' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {activeSection === 'secours' && (
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-6 animate-slideDown">
              {!showSecoursForm ? (
                <button 
                  onClick={() => setShowSecoursForm(true)} 
                  className="w-full bg-white text-red-600 p-6 rounded-3xl font-black border-2 border-red-100 hover:bg-red-50 transition-all shadow-sm"
                >
                  Réinitialiser une semaine
                </button>
              ) : (
                <div className="bg-white p-8 rounded-[32px] border border-red-100 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-red-50 pb-4">
                    <h4 className="text-lg font-black text-red-600">Réinitialiser une semaine</h4>
                    <button onClick={() => setShowSecoursForm(false)} className="text-gray-400 hover:text-gray-600">×</button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center">Sélectionner la semaine</p>
                    <div className="flex items-center justify-center gap-6">
                      <button 
                        onClick={() => setSecoursBaseDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                        className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-all"
                      >
                        <EXT_ICONS.ArrowLeft />
                      </button>
                      <div className="bg-purple-50 px-6 py-3 rounded-2xl border border-purple-100">
                        <span className="font-black text-purple-700 text-lg">{formatWeekRange(secoursBaseDate)}</span>
                      </div>
                      <button 
                        onClick={() => setSecoursBaseDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                        className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-all"
                      >
                        <EXT_ICONS.ArrowRight />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full bg-red-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                  >
                    réinitialiser la semaine
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8 animate-scaleUp">
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black text-gray-800">Confirmation</h3>
                <p className="text-gray-500 font-medium">voulez vous réinitialiser l'envois des recettes à la liste de courses ?</p>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest">{formatWeekRange(secoursBaseDate)}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 p-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all">Annuler</button>
                <button onClick={handleResetWeek} className="flex-1 p-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:scale-105 transition-all">Confirmer</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditSuccessModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-6 text-center animate-scaleUp">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-green-600 mx-auto">
              <EXT_ICONS.Check />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-800">Succès !</h3>
              <p className="text-gray-500 font-medium">
                L' aliment <span className="text-purple-600 font-bold">"{lastEditedFoodName}"</span> a bien été placer dans la catégorie <span className="text-purple-600 font-bold">"{lastEditedCategoryName}"</span>
              </p>
            </div>
            <button 
              onClick={() => setShowEditSuccessModal(false)} 
              className="w-full p-5 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDATION POUR LA SUPPRESSION D'UN ALIMENT */}
      {showDeleteFoodModal && foodToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-purple-100 max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <EXT_ICONS.Trash />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Confirmation de suppression</h3>
                  <p className="text-xs font-bold text-gray-500">Aliment : <span className="text-purple-600">{foodToDelete.name}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setShowDeleteFoodModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold hover:bg-gray-200 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {foodUsages.total > 0 ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 leading-relaxed">
                    ⚠️ Cet aliment est actuellement utilisé dans <strong>{foodUsages.total}</strong> élément(s) de votre application :
                  </div>

                  {foodUsages.recipes.length > 0 && (
                    <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        📖 Recettes ({foodUsages.recipes.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {foodUsages.recipes.map(r => (
                          <span key={r.id} className="text-[11px] font-bold bg-white text-purple-800 px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                            {r.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {foodUsages.dietRecipes.length > 0 && (
                    <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        🥗 Recettes Régime ({foodUsages.dietRecipes.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {foodUsages.dietRecipes.map(dr => (
                          <span key={dr.id} className="text-[11px] font-bold bg-white text-purple-800 px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                            {dr.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {foodUsages.recurring.length > 0 && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                        🔄 Récurrents ({foodUsages.recurring.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {foodUsages.recurring.map((rec, idx) => (
                          <span key={idx} className="text-[11px] font-bold bg-white text-indigo-800 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm">
                            {rec.itemName} <span className="text-indigo-400 font-normal">({rec.groupName})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {foodUsages.reserve.length > 0 && (
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        📦 Réserve ({foodUsages.reserve.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {foodUsages.reserve.map(item => (
                          <span key={item.id} className="text-[11px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm">
                            {item.name} {item.amount ? `(${item.amount} ${item.unit || ''})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2">
                  <span>✅</span>
                  <span>Cet aliment n'est actuellement utilisé dans aucune recette, ni dans les récurrents ou la réserve.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDeleteFoodModal(false)}
                className="flex-1 p-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteFood}
                className="flex-1 p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <EXT_ICONS.Trash />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-8">
        <button onClick={() => setShowResetAppModal(true)} className="w-full py-6 border-2 border-red-50 text-red-400 font-black rounded-[40px] hover:bg-red-50 transition-all">Réinitialiser l'application</button>
      </div>

      {/* MODAL CONFIRMATION RÉINITIALISATION APPLI */}
      {showResetAppModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8 animate-scaleUp text-center">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Réinitialiser l'application ?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Êtes-vous sûr de vouloir effacer toutes vos données (recettes, planning, réserves et réglages) ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setShowResetAppModal(false)} 
                className="flex-1 p-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }} 
                className="flex-1 p-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ALIMENT */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl">🍎</div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Ajouter un aliment</h3>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed">Saisissez le nom et la catégorie du nouvel aliment.</p>
              
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Nom de l'aliment</label>
                  <input 
                    type="text"
                    value={addFoodName}
                    onChange={(e) => setAddFoodName(e.target.value)}
                    placeholder="Ex: Pommes de terre..."
                    className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-blue-500 transition-all outline-none"
                  />
                  {addFoodSuggestions.length > 0 && (
                    <div className="pt-1 bg-blue-50/70 p-3 rounded-2xl border border-blue-100 space-y-1">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">
                        🔄 Aliments déjà enregistrés proches :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {addFoodSuggestions.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setAddFoodName(sug)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-800 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Catégorie</label>
                  <select
                    value={addFoodCategory}
                    onChange={(e) => setAddFoodCategory(e.target.value)}
                    className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="none">Sans catégorie</option>
                    {currentCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setShowAddFoodModal(false)}
                className="flex-1 p-6 font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddNewFood}
                className="flex-1 bg-blue-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT CATÉGORIE */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl">📂</div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Nouvelle catégorie</h3>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed">Comment voulez-vous nommer cette nouvelle catégorie ?</p>
              
              <div className="space-y-4 text-left">
                <label className="text-xs font-black text-green-400 uppercase tracking-widest ml-1">Nom de la catégorie</label>
                <input 
                  type="text"
                  value={addCategoryName}
                  onChange={(e) => setAddCategoryName(e.target.value)}
                  placeholder="Ex: Surgelés, Bio..."
                  className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 focus:border-green-500 transition-all outline-none"
                />
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setShowAddCategoryModal(false)}
                className="flex-1 p-6 font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddNewCategory}
                className="flex-1 bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform active:scale-95"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Notice: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="text-center space-y-4">
        <h2 className="text-4xl font-black text-gray-800 tracking-tight">Notice d'utilisation</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto">
          Bienvenue dans votre assistant de gestion de cuisine. Voici un guide détaillé pour maîtriser toutes les fonctionnalités de l'application.
        </p>
      </header>

      <div className="grid gap-6">
        {/* RECETTES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-xl">📖</div>
            <h3 className="text-2xl font-black text-gray-800">Recettes</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            C'est votre bibliothèque culinaire. Vous pouvez y enregistrer toutes vos recettes favorites.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Ajouter</span> : Créez une nouvelle recette avec titre, catégorie, temps, ingrédients et étapes.</li>
            <li><span className="font-bold text-gray-700">Modifier</span> : Ajustez vos recettes existantes à tout moment.</li>
            <li><span className="font-bold text-gray-700">Portions</span> : Dans la fiche recette, ajustez le nombre de portions. Les quantités d'ingrédients s'adaptent automatiquement !</li>
            <li><span className="font-bold text-gray-700">Planning</span> : Programmez une recette directement dans votre calendrier depuis sa fiche détaillée.</li>
          </ul>
        </section>

        {/* RECHERCHE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-xl">🔍</div>
            <h3 className="text-2xl font-black text-gray-800">Recherche</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Trouvez rapidement l'inspiration parmi vos recettes enregistrées. Filtrez par nom ou par catégorie pour gagner du temps.
          </p>
        </section>

        {/* PLANNING */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl">📅</div>
            <h3 className="text-2xl font-black text-gray-800">Planning</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Organisez vos repas de la semaine pour une gestion optimale.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Midi & Soir</span> : Deux emplacements par repas pour plus de flexibilité.</li>
            <li><span className="font-bold text-gray-700">Extras</span> : Un espace dédié pour les viennoiseries, gâteaux, sauces et coulis.</li>
            <li><span className="font-bold text-gray-700">Courses</span> : Envoyez les ingrédients d'un repas planifié directement vers votre liste de courses en un clic.</li>
          </ul>
        </section>

        {/* RÉCURRENTS */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-xl">🔄</div>
            <h3 className="text-2xl font-black text-gray-800">Récurrents</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Gérez vos listes de courses habituelles (ex: "Petit déjeuner", "Produits d'entretien").
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Listes</span> : Créez des groupes de produits thématiques.</li>
            <li><span className="font-bold text-gray-700">Envoi rapide</span> : Cochez les produits manquants et cliquez sur "Envoyer aux courses" pour les ajouter à votre pré-liste.</li>
          </ul>
        </section>

        {/* EN RÉSERVE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-xl">📦</div>
            <h3 className="text-2xl font-black text-gray-800">En réserve</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Gardez un œil sur vos stocks actuels. Idéal pour savoir ce qu'il vous reste dans le congélateur ou le cellier avant de faire vos courses.
          </p>
        </section>

        {/* LISTE DE COURSES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-xl">🛒</div>
            <h3 className="text-2xl font-black text-gray-800">Liste de courses (Pré-liste)</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            C'est ici que vous préparez vos achats. Les articles proviennent du planning, des récurrents ou d'ajouts manuels.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Réserve latérale</span> : Consultez votre réserve tout en faisant votre liste pour éviter les doublons.</li>
            <li><span className="font-bold text-gray-700">Validation</span> : Une fois votre pré-liste terminée, cliquez sur "Valider la Pré liste" pour générer la liste finale.</li>
          </ul>
        </section>

        {/* LISTE FINALE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl">🚀</div>
            <h3 className="text-2xl font-black text-gray-800">Liste de courses finale</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Le récapitulatif optimisé pour le magasin. Les articles sont automatiquement triés par catégories (Légumes, Viandes, Épicerie...) pour un parcours efficace en rayon.
          </p>
        </section>

        {/* RÉGLAGES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl">⚙️</div>
            <h3 className="text-2xl font-black text-gray-800">Réglages</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Configurez votre application selon vos besoins.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Catégories</span> : Personnalisez les rayons de votre magasin.</li>
            <li><span className="font-bold text-gray-700">Portions</span> : Définissez vos portions habituelles pour chaque aliment.</li>
            <li><span className="font-bold text-gray-700">Excel / JSON</span> : Exportez vos données pour les consulter sur ordinateur ou importez-les pour changer d'appareil.</li>
            <li className="font-bold text-gray-700">Pensez a tous enregistrer avec vos 3 fichiers les fichiers se trouve dans OneDrive &gt; Fichiers &gt; Documents &gt; Pour IA &gt; Appli repas courses &gt; Doc transfert</li>
          </ul>
        </section>
      </div>
    </div>
  );
};