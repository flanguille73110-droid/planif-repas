import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion, PortionRule, DietItem, DietCategory, DietRecipe, DietRecipeItem, PantryGroup } from './src/types';
import { CATEGORIES, DIETARY_OPTIONS, FOOD_CATEGORIES } from './constants';
import { SearchableSelect } from './src/components/SearchableSelect';
import {
  ICONS, EXT_ICONS, MASTER_RECIPE_UNITS, MASTER_PORTION_UNITS, MASTER_UNITS,
  getAvailableRecipeUnits, getAvailablePortionUnits, getAvailableUnits,
  DEFAULT_DIET_ROUNDING_UNITS, getRoundingUnitsList, parseWeightAndUnit,
  UNIT_CONVERSIONS, getUnitDimension, convertUnitAmount, formatTotalTime,
  formatDateKey, getStartOfWeek, DEFAULT_DIET_ITEMS, DIET_PERSON_OPTIONS,
  DAYS_OF_WEEK_CONFIG, getDayOfWeekFromDateOrString, getDefaultDietServings,
  DIET_BADGE_COLORS, getDietBadgeColor, roundShoppingAmount, isUnitInRoundingList,
  isDiscreteDietUnit, roundDiscreteAmount, scaleTextQuantity, getSlotOccupantInfo,
  formatScaledWeight, normalizeDietFoodName, getDietFoodStem, levenshteinDist,
  findSimilarDietFoods, resolveDietFoodCategory, detectSettingsCategoryFromFoodName,
  getPortionRules,
  formatPortionConvertedDisplay
} from './src/utils/helpers';

import { Navbar } from './src/components/Navbar';
import { InStockView } from './src/components/InStockView';
import { RecipeBook } from './src/components/RecipeBook';
import { RecipeSearch } from './src/components/RecipeSearch';
import { RecurringView } from './src/components/RecurringView';
import { Planning } from './src/components/Planning';
import { ShoppingView } from './src/components/ShoppingView';
import { Settings } from './src/components/Settings';
import { Notice } from './src/components/Notice';

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
  const [pendingNewFoodsToReview, setPendingNewFoodsToReview] = useState<{name: string, category?: string, settingsCategory?: string, weight?: string, recipeName?: string}[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedMatchMode, setSelectedMatchMode] = useState<string>('__NEW__');
  const [reviewedReplacements, setReviewedReplacements] = useState<Record<string, string>>({});
  const [reviewedWeightOverrides, setReviewedWeightOverrides] = useState<Record<string, string>>({});
  const [reviewedNewFoods, setReviewedNewFoods] = useState<{name: string, dietCat: string, setCat: string, weight?: string}[]>([]);
  const [reviewedDietItemsToAdd, setReviewedDietItemsToAdd] = useState<{name: string, dietCat: string, weight?: string}[]>([]);
  const [reviewDietCat, setReviewDietCat] = useState<DietCategory>('Légumes');
  const [reviewSetCat, setReviewSetCat] = useState<string>('');
  const [reviewWeightValue, setReviewWeightValue] = useState<string>('100');
  const [reviewWeightUnit, setReviewWeightUnit] = useState<string>('g');
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

  useEffect(() => {
    if (showReviewNewFoodsModal && pendingNewFoodsToReview.length > 0 && currentReviewIndex < pendingNewFoodsToReview.length) {
      const food = pendingNewFoodsToReview[currentReviewIndex];
      if (selectedMatchMode === '__NEW__') {
        const parsed = parseWeightAndUnit(food.weight || '');
        setReviewWeightValue(parsed.value);
        setReviewWeightUnit(parsed.unit);
      } else {
        const existing = dietItems.find(d => d.name.toLowerCase() === selectedMatchMode.toLowerCase());
        if (existing && existing.weight) {
          const existingParsed = parseWeightAndUnit(existing.weight);
          const importedParsed = parseWeightAndUnit(food.weight || '');
          if (existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase()) {
            setReviewWeightValue(existingParsed.value);
            setReviewWeightUnit(existingParsed.unit);
          } else {
            setReviewWeightValue(importedParsed.value);
            setReviewWeightUnit(importedParsed.unit);
          }
        } else {
          const parsed = parseWeightAndUnit(food.weight || '');
          setReviewWeightValue(parsed.value);
          setReviewWeightUnit(parsed.unit);
        }
      }
    }
  }, [showReviewNewFoodsModal, currentReviewIndex, selectedMatchMode, dietItems, pendingNewFoodsToReview]);

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
      foodPortions: [],
      servingsDefault: 1,
      language: 'fr',
      defaultRecipesTab: 'recipes',
      defaultPlanningTab: 'recipes',
      dietServingsDefault: 2.5,
      dietLunchCustomServings: 1,
      dietLunchCustomDays: [1, 2, 3, 4, 5],
      dietDinnerCustomServings: 2.5,
      dietDinnerCustomDays: [],
      dietServingsDefaultColor: 'green',
      dietLunchCustomColor: 'green',
      dietDinnerCustomColor: 'green',
      dietRoundDiscreteUnits: true,
      dietRoundingMode: 'nearest',
      dietRoundingUnits: DEFAULT_DIET_ROUNDING_UNITS
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
        dietServingsDefaultColor: parsed.dietServingsDefaultColor ?? 'green',
        dietLunchCustomColor: parsed.dietLunchCustomColor ?? 'green',
        dietDinnerCustomColor: parsed.dietDinnerCustomColor ?? 'green',
        dietRoundDiscreteUnits: parsed.dietRoundDiscreteUnits ?? true,
        dietRoundingMode: parsed.dietRoundingMode ?? 'nearest',
        dietRoundingUnits: Array.isArray(parsed.dietRoundingUnits) ? parsed.dietRoundingUnits : DEFAULT_DIET_ROUNDING_UNITS,
        foodPortions: parsed.foodPortions || defaultSettings.foodPortions
      };
    } catch (e) {
      return defaultSettings;
    }
  });

  
  const [baseDate, setBaseDate] = useState(() => {
    const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    return start;
  });

  useEffect(() => {
    const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    setBaseDate(start);
  }, [settings.startDay, settings.defaultWeek]);

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

  const [unclassifiedFoodsQueue, setUnclassifiedFoodsQueue] = useState<{ id: string; name: string; unit: string; category: string }[]>([]);
  const [showUnclassifiedFoodsModal, setShowUnclassifiedFoodsModal] = useState(false);

  const checkAndPromptMissingFoodPortions = useCallback((items: { name: string; unit?: string; category?: string }[], customPortions?: FoodPortion[]) => {
    const portions = customPortions || settings.foodPortions || [];
    const missingItems: { id: string; name: string; unit: string; category: string }[] = [];
    const seen = new Set<string>();

    items.forEach(item => {
      const trimmed = (item.name || '').trim();
      if (!trimmed) return;
      const norm = trimmed.toLowerCase();
      if (seen.has(norm)) return;
      seen.add(norm);

      const exists = portions.some(p => p.name.trim().toLowerCase() === norm);
      if (!exists) {
        const guessedCat = item.category || detectSettingsCategoryFromFoodName(trimmed);
        const parsedUnit = item.unit ? parseWeightAndUnit(`1 ${item.unit}`).unit : 'g';
        missingItems.push({
          id: Math.random().toString(36).substr(2, 9),
          name: trimmed,
          unit: parsedUnit,
          category: guessedCat
        });
      }
    });

    if (missingItems.length > 0) {
      setUnclassifiedFoodsQueue(missingItems);
      setShowUnclassifiedFoodsModal(true);
    }
  }, [settings.foodPortions]);

  const handleSaveUnclassifiedFoods = () => {
    setSettings(prev => {
      const currentPortions = prev.foodPortions || [];
      const currentCategories = prev.foodCategories || FOOD_CATEGORIES;
      const newPortions = [...currentPortions];
      const newCategories = [...currentCategories];

      unclassifiedFoodsQueue.forEach(item => {
        const norm = item.name.trim().toLowerCase();
        if (!newPortions.some(p => p.name.trim().toLowerCase() === norm)) {
          newPortions.push({
            id: Math.random().toString(36).substr(2, 9),
            name: item.name.trim(),
            amount: 1,
            unit: item.unit || 'g',
            category: item.category || undefined,
            baseAmount: 1,
            baseUnit: 'portion(s)',
            purchaseAmount: 1,
            purchaseUnit: 'pièce(s)'
          });
          if (item.category && !newCategories.includes(item.category)) {
            newCategories.push(item.category);
          }
        }
      });

      return {
        ...prev,
        foodPortions: newPortions,
        foodCategories: newCategories
      };
    });

    setShowUnclassifiedFoodsModal(false);
    setUnclassifiedFoodsQueue([]);
  };

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
      const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const updatedDay = { ...day };

      if (recipeId) {
        // Clear any old diet meal on this slot to enforce strictly 1 meal per slot
        delete updatedDay[targetDietKey];
        updatedDay[mealType as 'lunch' | 'dinner'] = {
          recipe1: slot === 'recipe1' ? recipeId : undefined,
          recipe2: slot === 'recipe2' ? recipeId : undefined
        };
      } else {
        const updatedMeal = { ...meal, [slot as 'recipe1' | 'recipe2']: undefined };
        if (!updatedMeal.recipe1 && !updatedMeal.recipe2) {
          delete updatedDay[mealType as 'lunch' | 'dinner'];
        } else {
          updatedDay[mealType as 'lunch' | 'dinner'] = updatedMeal;
        }
      }

      return {
        ...prev,
        [date]: updatedDay
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
      const updatedDay = { ...day };

      // If assigning a diet recipe or diet items (other than just changing servings count), clear classic recipes on that slot
      if (itemIdOrValue && slot !== 'servings') {
        delete updatedDay[mealType];
        if (slot === 'dietRecipe') {
          // Setting a dedicated diet recipe clears individual custom items
          const newDietObj: any = { servings: dietObj.servings, dietRecipe: itemIdOrValue };
          updatedDay[targetKey] = newDietObj;
        } else {
          // Setting custom items clears any dedicated diet recipe
          const newDietObj: any = { ...dietObj, dietRecipe: undefined, [slot]: itemIdOrValue };
          updatedDay[targetKey] = newDietObj;
        }
      } else if (!itemIdOrValue && slot !== 'servings') {
        const newDietObj: any = { ...dietObj, [slot]: undefined };
        if (!newDietObj.protein && !newDietObj.vegetable && !newDietObj.starch && !newDietObj.dessert && !newDietObj.dietRecipe) {
          delete updatedDay[targetKey];
        } else {
          updatedDay[targetKey] = newDietObj;
        }
      } else {
        updatedDay[targetKey] = { ...dietObj, [slot]: itemIdOrValue };
      }

      return {
        ...prev,
        [date]: updatedDay
      };
    });

    const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
    setSentMeals(prev => {
      const wholeMealKey = `${date}-${targetKey}`;
      const slotKey = `${date}-${targetKey}-${slot}`;
      const hasAny = prev.has(wholeMealKey) || prev.has(slotKey) || 
        prev.has(`${date}-${targetKey}-protein`) || 
        prev.has(`${date}-${targetKey}-vegetable`) || 
        prev.has(`${date}-${targetKey}-starch`) || 
        prev.has(`${date}-${targetKey}-dessert`) || 
        prev.has(`${date}-${targetKey}-dietRecipe`);
      if (!hasAny) return prev;

      const next = new Set(prev);
      next.delete(wholeMealKey);
      next.delete(slotKey);
      next.delete(`${date}-${targetKey}-protein`);
      next.delete(`${date}-${targetKey}-vegetable`);
      next.delete(`${date}-${targetKey}-starch`);
      next.delete(`${date}-${targetKey}-dessert`);
      next.delete(`${date}-${targetKey}-dietRecipe`);
      return next;
    });
  };

  const mergeToShoppingList = useCallback((newItems: ShoppingListItem[]) => {
    setShoppingList(currentList => {
      const updatedList = [...currentList];
      newItems.forEach(newItem => {
        const roundedNewAmount = roundShoppingAmount(newItem.amount, newItem.unit);
        const existingIndex = updatedList.findIndex(
          item => item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() && 
            (item.unit.toLowerCase().trim() === newItem.unit.toLowerCase().trim() ||
             convertUnitAmount(1, item.unit, newItem.unit) !== null)
        );
        if (existingIndex > -1 && !updatedList[existingIndex].checked) {
          const targetUnit = updatedList[existingIndex].unit;
          const convertedNewAmount = convertUnitAmount(roundedNewAmount, newItem.unit, targetUnit);
          if (convertedNewAmount !== null) {
            updatedList[existingIndex].amount = roundShoppingAmount(updatedList[existingIndex].amount + convertedNewAmount, targetUnit);
          } else {
            updatedList[existingIndex].amount = roundShoppingAmount(updatedList[existingIndex].amount + roundedNewAmount, targetUnit);
          }
        } else {
          updatedList.push({
            ...newItem,
            amount: roundedNewAmount
          });
        }
      });
      return updatedList;
    });

    checkAndPromptMissingFoodPortions(newItems);
  }, [checkAndPromptMissingFoodPortions]);

  const handleQuickAddFoodToSettings = (name: string, unit: string = 'g', category: string = '') => {
    setSettings(prev => {
      const portions = prev.foodPortions || [];
      const trimmedName = name.trim();
      const existingIndex = portions.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      const currentCategories = prev.foodCategories || FOOD_CATEGORIES;
      const resolvedCategory = category && category !== 'Épicerie' && category !== 'Sans catégorie' && currentCategories.includes(category) ? category : undefined;

      if (existingIndex > -1) {
        const updatedPortions = [...portions];
        updatedPortions[existingIndex] = {
          ...updatedPortions[existingIndex],
          category: resolvedCategory || updatedPortions[existingIndex].category
        };
        return { ...prev, foodPortions: updatedPortions };
      }
      const newPortion: FoodPortion = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        amount: 1,
        unit: unit,
        category: resolvedCategory,
        baseAmount: 1,
        baseUnit: 'portion(s)',
        purchaseAmount: 1,
        purchaseUnit: 'pièce(s)'
      };
      return { ...prev, foodPortions: [...portions, newPortion] };
    });
  };

  const exportToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      recipes,
      mealPlan,
      settings: {
        ...settings,
        foodPortions: settings.foodPortions || [],
        customWeightUnits: settings.customWeightUnits || [],
        customPortionUnits: settings.customPortionUnits || [],
        portionUnitsList: settings.portionUnitsList || []
      },
      shoppingList,
      pantryGroups,
      reserveItems,
      sentMeals: Array.from(sentMeals),
      dietItems,
      dietRecipes,
      dietServings,
      foodPortions: settings.foodPortions || [],
      customWeightUnits: settings.customWeightUnits || [],
      customPortionUnits: settings.customPortionUnits || [],
      portionUnitsList: settings.portionUnitsList || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        if (!data) {
          alert("Fichier JSON vide ou invalide.");
          return;
        }

        let importedRecipes = undefined;
        let importedDietRecipes = undefined;
        let importedMealPlan = undefined;
        let importedShoppingList = undefined;
        let importedPantryGroups = undefined;
        let importedReserveItems = undefined;
        let importedDietItems = undefined;
        let importedSentMeals = undefined;
        let importedDietServings = undefined;
        let incomingSettings: any = {};

        if (Array.isArray(data)) {
          if (data.length > 0) {
            const first = data[0];
            if (first && (first.ingredients && typeof first.ingredients === 'string' || first.items)) {
              importedDietRecipes = data;
            } else {
              importedRecipes = data;
            }
          } else {
            importedRecipes = [];
          }
        } else {
          importedRecipes = data.recipes;
          importedDietRecipes = data.dietRecipes;
          importedMealPlan = data.mealPlan;
          importedShoppingList = data.shoppingList;
          importedPantryGroups = data.pantryGroups;
          importedReserveItems = data.reserveItems;
          importedDietItems = data.dietItems;
          importedSentMeals = data.sentMeals;
          importedDietServings = data.dietServings;
          incomingSettings = data.settings || {};
        }

        // 1. Appliquer les états et sauvegarder de manière synchrone pour garantir la persistance immédiate
        if (importedRecipes && Array.isArray(importedRecipes)) {
          setRecipes(importedRecipes);
          localStorage.setItem('culina_recipes', JSON.stringify(importedRecipes));
        }
        if (importedMealPlan) {
          setMealPlan(importedMealPlan);
          localStorage.setItem('culina_plan_v2', JSON.stringify(importedMealPlan));
        }
        if (importedShoppingList && Array.isArray(importedShoppingList)) {
          setShoppingList(importedShoppingList);
          localStorage.setItem('culina_shopping', JSON.stringify(importedShoppingList));
        }
        if (importedPantryGroups && Array.isArray(importedPantryGroups)) {
          setPantryGroups(importedPantryGroups);
          localStorage.setItem('culina_pantry_v3', JSON.stringify(importedPantryGroups));
        }
        if (importedReserveItems && Array.isArray(importedReserveItems)) {
          setReserveItems(importedReserveItems);
          localStorage.setItem('culina_reserve', JSON.stringify(importedReserveItems));
        }
        if (importedDietItems && Array.isArray(importedDietItems)) {
          setDietItems(importedDietItems);
          localStorage.setItem('culina_diet_items_v1', JSON.stringify(importedDietItems));
        }
        if (importedDietRecipes && Array.isArray(importedDietRecipes)) {
          setDietRecipes(importedDietRecipes);
          localStorage.setItem('culina_diet_recipes_v1', JSON.stringify(importedDietRecipes));
        }
        if (importedSentMeals && Array.isArray(importedSentMeals)) {
          setSentMeals(new Set(importedSentMeals));
          localStorage.setItem('culina_sent_meals', JSON.stringify(importedSentMeals));
        }
        if (importedDietServings !== undefined) {
          const parsedServings = parseFloat(importedDietServings) || 2.5;
          setDietServings(parsedServings);
          localStorage.setItem('culina_diet_servings', parsedServings.toString());
        }

        // 2. Traitement sécurisé des paramètres (Settings)
        const incomingFoodPortions = (Array.isArray(data.foodPortions) && data.foodPortions.length > 0)
          ? data.foodPortions
          : (Array.isArray(incomingSettings.foodPortions) ? incomingSettings.foodPortions : null);
        const incomingCustomWeightUnits = Array.isArray(data.customWeightUnits)
          ? data.customWeightUnits
          : (Array.isArray(incomingSettings.customWeightUnits) ? incomingSettings.customWeightUnits : null);
        const incomingCustomPortionUnits = Array.isArray(data.customPortionUnits)
          ? data.customPortionUnits
          : (Array.isArray(incomingSettings.customPortionUnits) ? incomingSettings.customPortionUnits : null);
        const incomingPortionUnitsList = Array.isArray(data.portionUnitsList)
          ? data.portionUnitsList
          : (Array.isArray(incomingSettings.portionUnitsList) ? incomingSettings.portionUnitsList : null);

        setSettings(prev => {
          const finalSettings = {
            ...prev,
            ...incomingSettings,
            foodCategories: incomingSettings.foodCategories && incomingSettings.foodCategories.length > 0
              ? incomingSettings.foodCategories
              : (prev.foodCategories || FOOD_CATEGORIES),
            foodPortions: incomingFoodPortions !== null
              ? incomingFoodPortions
              : (prev.foodPortions || []),
            customWeightUnits: incomingCustomWeightUnits !== null
              ? incomingCustomWeightUnits
              : (prev.customWeightUnits || []),
            customPortionUnits: incomingCustomPortionUnits !== null
              ? incomingCustomPortionUnits
              : (prev.customPortionUnits || []),
            portionUnitsList: incomingPortionUnitsList !== null
              ? incomingPortionUnitsList
              : (prev.portionUnitsList || [])
          };
          localStorage.setItem('culina_settings', JSON.stringify(finalSettings));
          return finalSettings;
        });

        // 3. Traiter les portions manquantes éventuelles
        const importedFoods: { name: string; unit?: string; category?: string }[] = [];
        const finalRecipes = importedRecipes || recipes;
        const finalDietRecipes = importedDietRecipes || dietRecipes;
        const finalShoppingList = importedShoppingList || shoppingList;
        const finalDietItems = importedDietItems || dietItems;

        if (Array.isArray(finalShoppingList)) {
          finalShoppingList.forEach((i: any) => i.name && importedFoods.push({ name: i.name, unit: i.unit, category: i.category }));
        }
        if (Array.isArray(finalDietItems)) {
          finalDietItems.forEach((i: any) => i.name && importedFoods.push({ name: i.name, category: i.settingsCategory || i.category }));
        }
        if (Array.isArray(finalRecipes)) {
          finalRecipes.forEach((r: any) => {
            if (Array.isArray(r.ingredients)) {
              r.ingredients.forEach((ing: any) => ing.name && importedFoods.push({ name: ing.name, unit: ing.unit }));
            }
          });
        }
        if (Array.isArray(finalDietRecipes)) {
          finalDietRecipes.forEach((r: any) => {
            if (Array.isArray(r.items)) {
              r.items.forEach((item: any) => item.name && importedFoods.push({ name: item.name, unit: item.unit, category: item.category }));
            }
          });
        }
        const targetPortions = incomingFoodPortions || data.foodPortions || incomingSettings.foodPortions || settings.foodPortions;
        checkAndPromptMissingFoodPortions(importedFoods, targetPortions);

        alert("Données importées avec succès !");
      } catch (err: any) {
        console.error("Erreur d'importation globale:", err);
        alert("Erreur lors de l'importation : " + (err?.message || err || "Format de fichier non supporté"));
      }
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
          dairy: getSlotName(plan.dietLunch.dairy),
          dessert: getSlotName(plan.dietLunch.dessert)
        } : undefined;

        const dinner = plan.dietDinner ? {
          protein: getSlotName(plan.dietDinner.protein),
          vegetable: getSlotName(plan.dietDinner.vegetable),
          starch: getSlotName(plan.dietDinner.starch),
          dairy: getSlotName(plan.dietDinner.dairy),
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

        setSettings(prevSet => {
          const currentPortions = prevSet.foodPortions || [];
          const currentCategories = prevSet.foodCategories || FOOD_CATEGORIES;
          let changed = false;
          const newPortions = [...currentPortions];
          let newCategories = [...currentCategories];

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

            const norm = trimmed.toLowerCase();
            if (!newPortions.some(p => p.name.trim().toLowerCase() === norm)) {
              const cat = detectSettingsCategoryFromFoodName(trimmed, categoryDefault);
              newPortions.push({
                id: Math.random().toString(36).substr(2, 9),
                name: trimmed,
                amount: 1,
                unit: 'g',
                category: cat
              });
              if (!newCategories.includes(cat)) {
                newCategories.push(cat);
              }
              changed = true;
            }

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
              dairy: resolveDietItemId(dietLunch.dairy, 'Laitage'),
              dessert: resolveDietItemId(dietLunch.dessert, 'Desserts')
            } : undefined;

            const newDinner = dietDinner ? {
              protein: resolveDietItemId(dietDinner.protein, 'Protéines'),
              vegetable: resolveDietItemId(dietDinner.vegetable, 'Légumes'),
              starch: resolveDietItemId(dietDinner.starch, 'Féculents'),
              dairy: resolveDietItemId(dietDinner.dairy, 'Laitage'),
              dessert: resolveDietItemId(dietDinner.dessert, 'Desserts')
            } : undefined;

            updatedMealPlan[dateStr] = {
              ...updatedMealPlan[dateStr],
              ...(newLunch ? { dietLunch: newLunch } : {}),
              ...(newDinner ? { dietDinner: newDinner } : {})
            };
          });

          return changed ? { ...prevSet, foodPortions: newPortions, foodCategories: newCategories } : prevSet;
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
        let extractedItems: { name: string, category?: string, weight?: string, recipeName?: string }[] = [];
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
                  extractedItems.push({ name: trName, category: i.category, weight: i.weight || '', recipeName: trimmedName });
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
                extractedItems.push({ name: ingName, weight: ingWeight, recipeName: trimmedName });
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

        const existingDietItemMap = new Map<string, DietItem>(dietItems.map(d => [d.name.trim().toLowerCase(), d]));
        const existingNamesInSettings = new Set(
          (settings.foodPortions || []).map(p => p.name.trim().toLowerCase())
        );

        const newFoods: typeof extractedItems = [];
        const seenNew = new Set<string>();

        extractedItems.forEach(ex => {
          const nLow = ex.name.trim().toLowerCase();
          const existingDietItem = existingDietItemMap.get(nLow);
          const isKnownInBoth = existingDietItem && existingNamesInSettings.has(nLow);

          let hasUnitMismatch = false;
          if (existingDietItem && existingDietItem.weight && ex.weight) {
            const existingParsed = parseWeightAndUnit(existingDietItem.weight);
            const importedParsed = parseWeightAndUnit(ex.weight);
            if (existingParsed.unit && importedParsed.unit && existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase()) {
              hasUnitMismatch = true;
            }
          }

          if (!isKnownInBoth || hasUnitMismatch) {
            const key = `${ex.recipeName || ''}_${nLow}`;
            if (!seenNew.has(key)) {
              seenNew.add(key);
              newFoods.push(ex);
            }
          }
        });

        if (newFoods.length > 0) {
          setPendingDietRecipes(newRecipes);
          setPendingNewFoodsToReview(newFoods);
          setCurrentReviewIndex(0);

          const firstFood = newFoods[0];
          const existingInDietFirst = dietItems.find(d => d.name.toLowerCase() === firstFood.name.toLowerCase());
          if (existingInDietFirst) {
            setSelectedMatchMode(existingInDietFirst.name);
          } else {
            setSelectedMatchMode('__NEW__');
          }

          setReviewedReplacements({});
          setReviewedWeightOverrides({});
          setReviewedNewFoods([]);

          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : (existingInDietFirst?.category || 'Légumes'));
          
          const initialSetCat = detectSettingsCategoryFromFoodName(firstFood.name, firstFood.category);
          setReviewSetCat(initialSetCat);

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
          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : 'Légumes');

          const initialSetCat = detectSettingsCategoryFromFoodName(firstFood.name, firstFood.settingsCategory || firstFood.category);
          setReviewSetCat(initialSetCat);

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

    // Sheet 4: Portions (toutes les règles détaillées)
    const portionsData: any[] = [];
    (settings.foodPortions || []).forEach(item => {
      const rules = getPortionRules(item);
      rules.forEach(r => {
        portionsData.push({
          "Aliment": item.name || '',
          "Catégorie": item.category || "Sans catégorie",
          "Quantité base": r.baseAmount || 1,
          "Unité base": r.baseUnit || 'portion(s)',
          "Quantité achat": r.purchaseAmount || 1,
          "Unité achat": r.purchaseUnit || 'pièce(s)',
          "Seuil min": r.minThreshold || ''
        });
      });
    });
    const wsPortions = XLSX.utils.json_to_sheet(portionsData);
    XLSX.utils.book_append_sheet(workbook, wsPortions, "Portions");

    // Sheet 5: Unités Recettes
    const recipeUnitsData = getAvailableRecipeUnits(settings).map(u => ({
      "Unité": u,
      "Type": (settings.customWeightUnits || []).includes(u) ? "Personnalisée" : "Standard"
    }));
    const wsRecipeUnits = XLSX.utils.json_to_sheet(recipeUnitsData);
    XLSX.utils.book_append_sheet(workbook, wsRecipeUnits, "Unités Recettes");

    // Sheet 6: Unités Portions
    const portionUnitsData = getAvailablePortionUnits(settings).map(u => ({
      "Unité": u,
      "Type": (settings.customPortionUnits || []).includes(u) ? "Personnalisée" : "Standard"
    }));
    const wsPortionUnits = XLSX.utils.json_to_sheet(portionUnitsData);
    XLSX.utils.book_append_sheet(workbook, wsPortionUnits, "Unités Portions");

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

        // Process Unités Recettes
        const recipeUnitsSheet = wb.SheetNames.find((s: string) => 
          (s.toLowerCase().includes("unit") && s.toLowerCase().includes("recette")) ||
          s.toLowerCase() === "unités" || s.toLowerCase() === "unites"
        );
        let customRecipeUnitsFromExcel: string[] = [];
        if (recipeUnitsSheet) {
          const ws = wb.Sheets[recipeUnitsSheet];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const unitName = (row["Unité"] || row["unité"] || row["Unite"] || row["unite"] || row["Unit"] || row["unit"] || "").toString().trim();
            const type = (row["Type"] || row["type"] || "").toString().trim().toLowerCase();
            if (unitName) {
              if (type.includes("personnalis") || !MASTER_RECIPE_UNITS.includes(unitName)) {
                if (!customRecipeUnitsFromExcel.includes(unitName)) {
                  customRecipeUnitsFromExcel.push(unitName);
                }
              }
            }
          });
        }

        // Process Unités Portions
        const portionUnitsSheet = wb.SheetNames.find((s: string) => 
          s.toLowerCase().includes("unit") && s.toLowerCase().includes("portion")
        );
        let customPortionUnitsFromExcel: string[] = [];
        let portionUnitsListFromExcel: string[] = [];
        if (portionUnitsSheet) {
          const ws = wb.Sheets[portionUnitsSheet];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const unitName = (row["Unité"] || row["unité"] || row["Unite"] || row["unite"] || row["Unit"] || row["unit"] || "").toString().trim();
            const type = (row["Type"] || row["type"] || "").toString().trim().toLowerCase();
            if (unitName) {
              if (!portionUnitsListFromExcel.includes(unitName)) {
                portionUnitsListFromExcel.push(unitName);
              }
              if (type.includes("personnalis") || !MASTER_PORTION_UNITS.includes(unitName)) {
                if (!customPortionUnitsFromExcel.includes(unitName)) {
                  customPortionUnitsFromExcel.push(unitName);
                }
              }
            }
          });
        }

        // Process Portions and Aliments sheets
        const portionSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("portion") && !s.toLowerCase().includes("unit"));
        const alimentSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("aliment") && !s.toLowerCase().includes("unit"));

        setSettings(prev => {
          let updatedFoodPortions = [...(prev.foodPortions || [])];
          let updatedCustomWeightUnits = [...(prev.customWeightUnits || [])];
          let updatedCustomPortionUnits = [...(prev.customPortionUnits || [])];
          let updatedPortionUnitsList = prev.portionUnitsList ? [...prev.portionUnitsList] : undefined;

          // Merge custom recipe units
          customRecipeUnitsFromExcel.forEach(u => {
            if (!updatedCustomWeightUnits.includes(u)) {
              updatedCustomWeightUnits.push(u);
            }
          });

          // Merge portion units
          if (portionUnitsListFromExcel.length > 0) {
            updatedPortionUnitsList = Array.from(new Set([...(updatedPortionUnitsList || MASTER_PORTION_UNITS), ...portionUnitsListFromExcel]));
          }
          customPortionUnitsFromExcel.forEach(u => {
            if (!updatedCustomPortionUnits.includes(u)) {
              updatedCustomPortionUnits.push(u);
            }
          });

          // If Aliments sheet present, process names and categories
          if (alimentSheetName) {
            const ws = wb.Sheets[alimentSheetName];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || row.Article || row.article || "").toString().trim();
              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || "").toString().trim();
              if (!foodName) return;
              const exists = updatedFoodPortions.find(f => f.name.toLowerCase() === foodName.toLowerCase());
              if (!exists) {
                updatedFoodPortions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: foodName,
                  amount: 1,
                  unit: 'portion(s)',
                  category: category && category !== "Sans catégorie" ? category : undefined,
                  baseAmount: 1,
                  baseUnit: 'portion(s)',
                  purchaseAmount: 1,
                  purchaseUnit: 'pièce(s)'
                });
              } else if (category && category !== "Sans catégorie") {
                exists.category = category;
              }
            });
          }

          // If Portions sheet present, process all detailed rules
          if (portionSheetName) {
            const ws = wb.Sheets[portionSheetName];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            const foodsMap = new Map<string, { name: string; category: string; rules: PortionRule[] }>();

            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || row.Name || row.name || row.Article || row.article || "").toString().trim();
              if (!foodName) return;

              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || row.Category || row.category || "").toString().trim();
              const baseAmountRaw = row["Quantité base"] ?? row["quantité base"] ?? row.baseAmount ?? row["Quantité Base"] ?? row.amount ?? row.Quantité ?? 1;
              const baseAmount = Number(baseAmountRaw);
              const baseUnit = (row["Unité base"] || row["unité base"] || row.baseUnit || row["Unité Base"] || row.unit || row.Unité || "portion(s)").toString().trim();
              const purchaseAmountRaw = row["Quantité achat"] ?? row["quantité achat"] ?? row.purchaseAmount ?? row["Quantité Achat"] ?? 1;
              const purchaseAmount = Number(purchaseAmountRaw);
              const purchaseUnit = (row["Unité achat"] || row["unité achat"] || row.purchaseUnit || row["Unité Achat"] || "pièce(s)").toString().trim();
              const minThresholdRaw = row["Seuil min"] ?? row["seuil min"] ?? row["Seuil Min"] ?? row["Seuil"] ?? row.minThreshold ?? row.threshold;
              const minThresholdNum = Number(minThresholdRaw);
              const minThreshold = !isNaN(minThresholdNum) && minThresholdNum > 0 ? minThresholdNum : undefined;

              const key = foodName.toLowerCase();
              const rule: PortionRule = {
                id: Math.random().toString(36).substr(2, 9),
                baseAmount: isNaN(baseAmount) || baseAmount <= 0 ? 1 : baseAmount,
                baseUnit: baseUnit || 'portion(s)',
                purchaseAmount: isNaN(purchaseAmount) || purchaseAmount <= 0 ? 1 : purchaseAmount,
                purchaseUnit: purchaseUnit || 'pièce(s)',
                minThreshold: minThreshold
              };

              if (!foodsMap.has(key)) {
                foodsMap.set(key, {
                  name: foodName,
                  category: category && category !== "Sans catégorie" && category !== "Épicerie" ? category : undefined,
                  rules: [rule]
                });
              } else {
                const existingEntry = foodsMap.get(key)!;
                if (category && category !== "Sans catégorie") existingEntry.category = category;
                const dupIdx = existingEntry.rules.findIndex(r => 
                  r.baseUnit.toLowerCase() === rule.baseUnit.toLowerCase() && 
                  r.baseAmount === rule.baseAmount && 
                  r.purchaseUnit.toLowerCase() === rule.purchaseUnit.toLowerCase()
                );
                if (dupIdx >= 0) {
                  existingEntry.rules[dupIdx] = rule;
                } else {
                  existingEntry.rules.push(rule);
                }
              }
            });

            foodsMap.forEach(entry => {
              const idx = updatedFoodPortions.findIndex(p => p.name.trim().toLowerCase() === entry.name.toLowerCase());
              const firstRule = entry.rules[0] || {
                id: Math.random().toString(36).substr(2, 9),
                baseAmount: 1,
                baseUnit: 'portion(s)',
                purchaseAmount: 1,
                purchaseUnit: 'pièce(s)',
                minThreshold: undefined
              };

              const updatedItem: FoodPortion = {
                id: idx >= 0 ? updatedFoodPortions[idx].id : Math.random().toString(36).substr(2, 9),
                name: entry.name,
                category: entry.category || (idx >= 0 ? updatedFoodPortions[idx].category : undefined),
                baseAmount: firstRule.baseAmount,
                baseUnit: firstRule.baseUnit,
                purchaseAmount: firstRule.purchaseAmount,
                purchaseUnit: firstRule.purchaseUnit,
                amount: firstRule.baseAmount,
                unit: firstRule.baseUnit,
                rules: entry.rules
              };

              if (idx >= 0) {
                updatedFoodPortions[idx] = updatedItem;
              } else {
                updatedFoodPortions.push(updatedItem);
              }
            });
          }

          return {
            ...prev,
            foodPortions: updatedFoodPortions,
            customWeightUnits: updatedCustomWeightUnits,
            customPortionUnits: updatedCustomPortionUnits,
            portionUnitsList: updatedPortionUnitsList
          };
        });

        const importedExcelFoods: { name: string; category?: string; unit?: string }[] = [];
        if (wb.SheetNames.includes("Récurrents")) {
          const ws = wb.Sheets["Récurrents"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const itemName = (row.Article || row.article || row.ARTICLE || "").toString().trim();
            if (itemName) importedExcelFoods.push({ name: itemName, unit: (row.Unité || row.unité || row.UNITE || "unité").toString() });
          });
        }
        if (wb.SheetNames.includes("reserves")) {
          const ws = wb.Sheets["reserves"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const itemName = (row.Article || row.article || row.ARTICLE || "").toString().trim();
            if (itemName) importedExcelFoods.push({ name: itemName, unit: (row.Unité || row.unité || row.UNITE || "unité").toString() });
          });
        }
        checkAndPromptMissingFoodPortions(importedExcelFoods);

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
            setSettings={setSettings}
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
          
            baseDate={baseDate}
            setBaseDate={setBaseDate}
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
            settings={settings}
          />
        )}
        {activeTab === 'reserve' && (
          <InStockView 
            items={reserveItems}
            setItems={setReserveItems}
            foodPortions={settings.foodPortions}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            settings={settings}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingView 
            list={shoppingList} 
            setList={setShoppingList} 
            settings={settings}
            setSettings={setSettings}
            foodPortions={settings.foodPortions || []}
            foodCategories={settings.foodCategories || ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre']}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            reserveItems={reserveItems}
            setReserveItems={setReserveItems}
            pantryGroups={pantryGroups}
            setPantryGroups={setPantryGroups}
            dietItems={dietItems}
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
            baseDate={baseDate}
          />
        )}
        {activeTab === 'notice' && (
          <Notice />
        )}
      </main>

      {/* MODAL NOUVEAUX ALIMENTS À CLASSER DANS RÉGLAGES */}
      {showUnclassifiedFoodsModal && unclassifiedFoodsQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white relative">
              <button 
                onClick={() => {
                  setShowUnclassifiedFoodsModal(false);
                  setUnclassifiedFoodsQueue([]);
                }}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📁</span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Nouveaux aliments détectés
                </h3>
              </div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium leading-relaxed">
                {unclassifiedFoodsQueue.length === 1 
                  ? "Cet aliment n'est pas encore enregistré dans vos Réglages > Aliments. Choisissez sa catégorie :"
                  : `Ces ${unclassifiedFoodsQueue.length} aliments ne sont pas encore enregistrés dans vos Réglages > Aliments. Choisissez leur catégorie :`
                }
              </p>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
              {unclassifiedFoodsQueue.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {item.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                        Catégorie Réglages
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnclassifiedFoodsQueue(prev => prev.map(q => q.id === item.id ? { ...q, category: val } : q));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        {(settings.foodCategories || FOOD_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                        Unité
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnclassifiedFoodsQueue(prev => prev.map(q => q.id === item.id ? { ...q, unit: val } : q));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {getAvailableUnits(settings).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnclassifiedFoodsModal(false);
                  setUnclassifiedFoodsQueue([]);
                }}
                className="px-5 py-3 rounded-2xl font-black text-xs text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Ignorer
              </button>
              <button
                onClick={handleSaveUnclassifiedFoods}
                className="px-6 py-3 rounded-2xl font-black text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Enregistrer dans Réglages</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          const updatedWeightOverrides = { ...reviewedWeightOverrides };
          const updatedNewFoods = [...reviewedNewFoods];
          const updatedDietItemsToAdd = [...reviewedDietItemsToAdd];

          const finalWeight = `${reviewWeightValue.trim()} ${reviewWeightUnit.trim()}`.trim();

          if (currentFood.recipeName) {
            updatedWeightOverrides[`${currentFood.recipeName}_${currentFood.name}`] = finalWeight;
            if (!isNewSelected) {
              updatedWeightOverrides[`${currentFood.recipeName}_${selectedMatchMode}`] = finalWeight;
            }
          }
          updatedWeightOverrides[currentFood.name] = finalWeight;
          if (!isNewSelected) {
            updatedWeightOverrides[selectedMatchMode] = finalWeight;
          }
          setReviewedWeightOverrides(updatedWeightOverrides);

          if (isNewSelected) {
            updatedNewFoods.push({
              name: currentFood.name,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat,
              setCat: reviewSetCat
            });
            setReviewedNewFoods(updatedNewFoods);
            updatedDietItemsToAdd.push({
              name: currentFood.name,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat
            });
          } else {
            updatedReplacements[currentFood.name] = selectedMatchMode;
            setReviewedReplacements(updatedReplacements);
            updatedDietItemsToAdd.push({
              name: selectedMatchMode,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat
            });
          }
          setReviewedDietItemsToAdd(updatedDietItemsToAdd);

          if (currentReviewIndex + 1 < pendingNewFoodsToReview.length) {
            const nextIdx = currentReviewIndex + 1;
            setCurrentReviewIndex(nextIdx);
            const nextFood = pendingNewFoodsToReview[nextIdx];
            const existingInDietNext = dietItems.find(d => d.name.toLowerCase() === nextFood.name.toLowerCase());
            if (existingInDietNext) {
              setSelectedMatchMode(existingInDietNext.name);
            } else {
              setSelectedMatchMode('__NEW__');
            }

            const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
            setReviewDietCat((nextFood.category && defaultDietCats.includes(nextFood.category)) ? nextFood.category as DietCategory : (existingInDietNext?.category || 'Légumes'));
            const nextSetCat = detectSettingsCategoryFromFoodName(nextFood.name, nextFood.category || (nextFood as any).settingsCategory);
            setReviewSetCat(nextSetCat);
          } else {
            // Finalize import!
            // 1. Apply replacements & per-recipe weight overrides to recipes
            const finalRecipes = pendingDietRecipes.map(recipe => {
              const updatedRecipe = { ...recipe };
              
              if (Array.isArray(updatedRecipe.items) && updatedRecipe.items.length > 0) {
                updatedRecipe.items = updatedRecipe.items.map(it => {
                  const rep = updatedReplacements[it.name];
                  const targetName = rep || it.name;
                  const keyRecipeOld = `${recipe.name}_${it.name}`;
                  const keyRecipeNew = `${recipe.name}_${targetName}`;
                  const weightOverride = updatedWeightOverrides[keyRecipeOld] || updatedWeightOverrides[keyRecipeNew] || updatedWeightOverrides[it.name] || updatedWeightOverrides[targetName];

                  return {
                    ...it,
                    name: targetName,
                    weight: weightOverride || it.weight
                  };
                });
                updatedRecipe.ingredients = updatedRecipe.items.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ');
              } else if (typeof updatedRecipe.ingredients === 'string') {
                let ingStr = updatedRecipe.ingredients;
                Object.entries(updatedReplacements).forEach(([oldName, newName]) => {
                  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(^|\\s|\\+|\\,|\\()${escaped}(\\s|\\+|\\,|\\)|$)`, 'gi');
                  ingStr = ingStr.replace(regex, `$1${newName}$2`);
                });

                Object.entries(updatedWeightOverrides).forEach(([key, newWeight]) => {
                  if (key.startsWith(`${recipe.name}_`)) {
                    const foodName = key.replace(`${recipe.name}_`, '');
                    const itemInRecipe = (recipe.items || []).find(i => i.name === foodName);
                    if (itemInRecipe && itemInRecipe.weight && ingStr.includes(itemInRecipe.weight)) {
                      ingStr = ingStr.replace(itemInRecipe.weight, newWeight);
                    }
                  }
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

            // 3. Add missing foods to Settings > Aliments
            const allFoodsForSet = [
              ...updatedNewFoods.map(f => ({ name: f.name, cat: f.setCat })),
              ...updatedDietItemsToAdd.map(f => ({ name: f.name, cat: detectSettingsCategoryFromFoodName(f.name, f.dietCat) }))
            ];

            if (allFoodsForSet.length > 0) {
              setSettings(prevSet => {
                const currentPortions = prevSet.foodPortions || [];
                const currentCategories = prevSet.foodCategories || [];
                let changed = false;
                const newPortions = [...currentPortions];
                let newCategories = [...currentCategories];
                
                allFoodsForSet.forEach(ex => {
                  const nLow = ex.name.trim().toLowerCase();
                  if (nLow && !newPortions.some(p => p.name.trim().toLowerCase() === nLow)) {
                    newPortions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: ex.name.trim(),
                      amount: 1,
                      unit: 'g',
                      category: ex.cat && ex.cat !== 'Épicerie' && ex.cat !== 'Sans catégorie' ? ex.cat : undefined,
                      baseAmount: 1,
                      baseUnit: 'portion(s)',
                      purchaseAmount: 1,
                      purchaseUnit: 'pièce(s)'
                    });
                    changed = true;
                  }
                  if (ex.cat && ex.cat !== 'Épicerie' && ex.cat !== 'Sans catégorie' && !newCategories.includes(ex.cat)) {
                    newCategories.push(ex.cat);
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
            setReviewedWeightOverrides({});
            setReviewedNewFoods([]);
            setReviewedDietItemsToAdd([]);

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
          setReviewedWeightOverrides({});
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

                {/* Box aliment détecté & recette concernée */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left border border-gray-200/80 shadow-2xs space-y-2">
                  {currentFood.recipeName && (
                    <div className="flex items-center gap-2 bg-purple-100/80 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-black">
                      <span>📖</span>
                      <span>Recette concernée : « {currentFood.recipeName} »</span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                      Aliment à valider :
                    </p>
                    <p className="text-xl font-black text-purple-800 flex items-center gap-2 flex-wrap">
                      <span>🥗</span>
                      <span>« {currentFood.name} »</span>
                      {currentFood.weight && (
                        <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                          Quantité importée : {currentFood.weight}
                        </span>
                      )}
                    </p>
                  </div>
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
                        const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
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
                                  if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(bestCat)) {
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
                            if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(bestCat)) {
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

                  {/* Champ Poids / Quantité et Unité pour l'import */}
                  {(() => {
                    const importedParsed = parseWeightAndUnit(currentFood.weight || '');
                    const existingDietItem = !isNewSelected ? dietItems.find(d => d.name.toLowerCase() === selectedMatchMode.toLowerCase()) : dietItems.find(d => d.name.toLowerCase() === currentFood.name.toLowerCase());
                    const existingWeightStr = existingDietItem ? existingDietItem.weight : '';
                    const existingParsed = parseWeightAndUnit(existingWeightStr);
                    const isUnitMismatch = existingWeightStr && importedParsed.unit && existingParsed.unit && existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase();

                    return (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 mt-3">
                        <p className="text-xs font-black text-gray-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>⚖️</span>
                            <span>Quantité & Unité pour cette recette :</span>
                          </span>
                        </p>

                        {isUnitMismatch && (
                          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold space-y-1.5 animate-fadeIn">
                            <div className="flex items-center gap-1.5 text-amber-800 font-black">
                              <span>⚠️</span>
                              <span>Différence d'unité détectée !</span>
                            </div>
                            <p className="text-[11px] font-medium text-amber-800 leading-snug">
                              {currentFood.recipeName ? (
                                <>Dans la recette <strong>« {currentFood.recipeName} »</strong>, cet aliment est indiqué avec <strong>« {currentFood.weight} »</strong>.</>
                              ) : (
                                <>La valeur importée est <strong>« {currentFood.weight} »</strong>.</>
                              )}
                              <br />
                              L'unité de référence dans vos Catégories Régime est en <strong>« {existingParsed.unit} »</strong> ({existingDietItem?.name} : {existingWeightStr}).
                            </p>
                            <p className="text-[11px] font-black text-amber-900">
                              Ajustez la valeur en <strong>{reviewWeightUnit || existingParsed.unit}</strong> à appliquer spécifiquement pour la recette {currentFood.recipeName ? `« ${currentFood.recipeName} »` : 'importée'} :
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-2">
                          <input 
                            type="text"
                            value={reviewWeightValue}
                            onChange={(e) => setReviewWeightValue(e.target.value)}
                            placeholder="Ex: 100, 1, 2..."
                            className="col-span-7 bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          <select
                            value={reviewWeightUnit}
                            onChange={(e) => setReviewWeightUnit(e.target.value)}
                            className="col-span-5 bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                          >
                            {getAvailableUnits(settings).map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
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

