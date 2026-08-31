import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion, PortionRule, DietItem, DietCategory, DietRecipe, DietRecipeItem, PantryGroup } from '../types';
import { CATEGORIES, DIETARY_OPTIONS, FOOD_CATEGORIES } from '../../constants';
import { SearchableSelect } from './SearchableSelect';
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
  findSimilarDietFoods, resolveDietFoodCategory, detectSettingsCategoryFromFoodName
} from '../utils/helpers';

export const Planning: React.FC<{ 
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
  baseDate: Date;
  setBaseDate: React.Dispatch<React.SetStateAction<Date>>;}> = ({ mealPlan, recipes, updateMealPlan, updateDietMealPlan, onMergeToShopping, sentMeals, setSentMeals, settings, dietItems, dietServings, setDietServings, dietRecipes = [] , baseDate, setBaseDate}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [planningFilter, setPlanningFilter] = useState<'all' | 'recipes' | 'regime'>('all');
  
  // State for "Rentrer Déjeuner / Dîner" Modal
  const [showRentrerMealModal, setShowRentrerMealModal] = useState(false);
  const [rentrerMealDayKey, setRentrerMealDayKey] = useState<string | null>(null);
  const [rentrerMealType, setRentrerMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [rentrerMealServings, setRentrerMealServings] = useState<number>(2.5);
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);
  const [selectedStarches, setSelectedStarches] = useState<string[]>([]);
  const [selectedDairies, setSelectedDairies] = useState<string[]>([]);
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
    setSelectedDairies(parseSlot(currentMeal.dairy));
    setSelectedDesserts(parseSlot(currentMeal.dessert));
    const defaultServings = getDefaultDietServings(dayKey, mealType, settings);
    setRentrerMealServings(currentMeal.servings ?? defaultServings);
    setShowRentrerMealModal(true);
  };

  const handleRemoveDietItemDirect = (dayKey: string, mealType: 'lunch' | 'dinner', category: 'protein' | 'vegetable' | 'starch' | 'dairy' | 'dessert', itemId: string) => {
    const dayPlan = mealPlan[dayKey] || {};
    const currentMeal = mealType === 'lunch' ? dayPlan.dietLunch || {} : dayPlan.dietDinner || {};
    const currentVal = currentMeal[category] || '';
    const ids = currentVal.split(',').map(s => s.trim()).filter(Boolean);
    const newIds = ids.filter(id => id !== itemId && id.toLowerCase() !== itemId.toLowerCase());
    updateDietMealPlan(dayKey, mealType, category, newIds.length > 0 ? newIds.join(',') : undefined);
  };

  const handleSaveRentrerMeal = () => {
    if (!rentrerMealDayKey) return;
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'protein', selectedProteins.length > 0 ? selectedProteins.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'vegetable', selectedVegetables.length > 0 ? selectedVegetables.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'starch', selectedStarches.length > 0 ? selectedStarches.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'dairy', selectedDairies.length > 0 ? selectedDairies.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'dessert', selectedDesserts.length > 0 ? selectedDesserts.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'servings', rentrerMealServings);
    setShowRentrerMealModal(false);
  };

  

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
  }, [recipes]);

  const classicRecipeOptions = useMemo(() => {
    return sortedRecipes.map(r => ({
      id: r.id,
      title: r.title,
      badge: "Classique"
    }));
  }, [sortedRecipes]);

  const dietRecipeOptions = useMemo(() => {
    return (dietRecipes || []).map(dr => ({
      id: dr.id,
      title: dr.name,
      badge: "Régime"
    }));
  }, [dietRecipes]);

  // Combined options for recipe selector in unified calendar
  const allRecipeOptions = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    // Classic recipes
    sortedRecipes.forEach(r => {
      list.push({
        id: `classic:${r.id}`,
        title: `${r.title} (Classique)`
      });
    });
    // Diet recipes
    (dietRecipes || []).forEach(dr => {
      list.push({
        id: `diet:${dr.id}`,
        title: `${dr.name} (Régime)`
      });
    });
    return list;
  }, [sortedRecipes, dietRecipes]);

  const handleSelectMeal = (dateKey: string, mealType: 'lunch' | 'dinner', rawValue?: string) => {
    if (!rawValue) {
      updateMealPlan(dateKey, mealType, 'recipe1', undefined);
      updateMealPlan(dateKey, mealType, 'recipe2', undefined);
      updateDietMealPlan(dateKey, mealType, 'dietRecipe', undefined);
      updateDietMealPlan(dateKey, mealType, 'protein', undefined);
      updateDietMealPlan(dateKey, mealType, 'vegetable', undefined);
      updateDietMealPlan(dateKey, mealType, 'starch', undefined);
      updateDietMealPlan(dateKey, mealType, 'dessert', undefined);
      return;
    }

    if (rawValue.startsWith('classic:')) {
      const classicId = rawValue.replace('classic:', '');
      updateMealPlan(dateKey, mealType, 'recipe1', classicId);
    } else if (rawValue.startsWith('diet:')) {
      const dietId = rawValue.replace('diet:', '');
      updateDietMealPlan(dateKey, mealType, 'dietRecipe', dietId);
    } else {
      const isDiet = (dietRecipes || []).some(dr => dr.id === rawValue);
      if (isDiet) {
        updateDietMealPlan(dateKey, mealType, 'dietRecipe', rawValue);
      } else {
        updateMealPlan(dateKey, mealType, 'recipe1', rawValue);
      }
    }
  };

  const handleSendRecipe = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string, index?: number) => {
    const r = recipes.find(rec => rec.id === recipeId);
    if (!r) return;
    let ratio = 1;
    if (mealType === 'lunch' || mealType === 'dinner') {
      const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const dayDate = new Date(date);
      const currentServings = mealPlan[date]?.[targetKey]?.servings ?? getDefaultDietServings(dayDate, mealType, settings);
      const baseRecipeServings = r.servings || 1;
      if (baseRecipeServings > 0) {
        ratio = currentServings / baseRecipeServings;
      }
    }
    const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
      id: Math.random().toString(36).substr(2, 9),
      name: ing.name,
      amount: typeof ing.amount === 'number' ? Math.round(ing.amount * ratio * 100) / 100 : ing.amount,
      unit: ing.unit,
      checked: false
    }));
    onMergeToShopping(items);
    const mealKey = mealType === 'extra' ? `${date}-${slot}-${index}` : `${date}-${mealType}-${slot}`;
    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  const handleSendDietRecipe = (date: string, mealType: 'dietLunch' | 'dietDinner', dietRecipeId: string) => {
    const dr = (dietRecipes || []).find(r => r.id === dietRecipeId);
    if (!dr) return;

    const targetKey = mealType === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(date);
    const baseServings = dr.servings || 2.5;
    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(dayDate, targetKey, settings);

    const items: ShoppingListItem[] = [];
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
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          amount,
          unit,
          checked: false
        });
      });
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
      items.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `${dr.name} (${scaledIng})`,
        amount: 1,
        unit: 'portion',
        checked: false
      });
    } else {
      items.push({
        id: Math.random().toString(36).substr(2, 9),
        name: dr.name,
        amount: 1,
        unit: 'portion',
        checked: false
      });
    }

    if (items.length > 0) {
      onMergeToShopping(items);
      const mealKey = `${date}-${mealType}-dietRecipe`;
      setSentMeals(prev => new Set(prev).add(mealKey));
    }
  };

  const handleSendDietItem = (date: string, mealType: 'dietLunch' | 'dietDinner', slot: 'protein' | 'vegetable' | 'starch' | 'dairy' | 'dessert', itemIdString: string) => {
    if (!itemIdString) return;
    const targetKey = mealType === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(date);
    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(dayDate, targetKey, settings);

    const ids = itemIdString.split(',').map(s => s.trim()).filter(Boolean);
    const items: ShoppingListItem[] = [];

    ids.forEach(itemId => {
      const item = (dietItems || []).find(i => i.id === itemId || i.name.toLowerCase() === itemId.toLowerCase());
      if (item) {
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
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          amount,
          unit,
          checked: false
        });
      } else {
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: itemId,
          amount: 1,
          unit: 'portion',
          checked: false
        });
      }
    });

    if (items.length > 0) {
      onMergeToShopping(items);
      const mealKey = `${date}-${mealType}-${slot}`;
      setSentMeals(prev => new Set(prev).add(mealKey));
    }
  };

  const isDietMealSent = (date: string, mealType: 'dietLunch' | 'dietDinner') => {
    const wholeKey = `${date}-${mealType}`;
    if (sentMeals.has(wholeKey)) return true;
    const plan = mealPlan[date]?.[mealType];
    if (!plan) return false;
    if (plan.dietRecipe) {
      return sentMeals.has(`${date}-${mealType}-dietRecipe`);
    }
    const slots = (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).filter(s => !!plan[s]);
    if (slots.length === 0) return false;
    return slots.every(s => sentMeals.has(`${date}-${mealType}-${s}`));
  };

  const handleSendWeekToShopping = () => {
    let allItems: ShoppingListItem[] = [];
    const newSentMeals = new Set(sentMeals);
    let addedCount = 0;

    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key] || {};

      // 1. Recettes Classiques
      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;
        const targetKey = type === 'lunch' ? 'dietLunch' : 'dietDinner';
        const currentServings = plan[targetKey]?.servings ?? getDefaultDietServings(d, type, settings);
        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) {
            const r = recipes.find(rec => rec.id === recipeId);
            if (r) {
              const baseRecipeServings = r.servings || 1;
              const ratio = baseRecipeServings > 0 ? currentServings / baseRecipeServings : 1;
              const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: typeof ing.amount === 'number' ? Math.round(ing.amount * ratio * 100) / 100 : ing.amount,
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
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          const slotVal = dietLunch[slot];
          const mealKey = `${key}-dietLunch-${slot}`;
          if (slotVal && !sentMeals.has(mealKey)) {
            const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
            ids.forEach(id => {
              const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
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
                addedCount++;
              } else {
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: id,
                  amount: 1,
                  unit: 'portion',
                  checked: false
                });
                addedCount++;
              }
            });
            newSentMeals.add(mealKey);
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
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          const slotVal = dietDinner[slot];
          const mealKey = `${key}-dietDinner-${slot}`;
          if (slotVal && !sentMeals.has(mealKey)) {
            const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
            ids.forEach(id => {
              const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
              if (item) {
                let amount = 1;
                let unit = 'g';
                if (item.weight) {
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
                addedCount++;
              } else {
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: id,
                  amount: 1,
                  unit: 'portion',
                  checked: false
                });
                addedCount++;
              }
            });
            newSentMeals.add(mealKey);
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

      // 4. Extras
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) {
              const r = recipes.find(rec => rec.id === recipeId);
              if (r) {
                const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
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

    if (allItems.length > 0) {
      onMergeToShopping(allItems);
      setSentMeals(newSentMeals);
      alert(`🛒 ${addedCount} repas/éléments de la semaine envoyés aux courses avec succès !`);
    } else {
      alert("Tous les repas de cette semaine sont déjà envoyés aux courses ou aucun repas n'est planifié.");
    }
  };

  const unsentCount = useMemo(() => {
    let count = 0;
    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key];
      if (!plan) return;

      // Recettes Classiques
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
        if (dietLunch.dietRecipe && !sentMeals.has(`${key}-dietLunch-dietRecipe`)) count++;
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          if (dietLunch[slot] && !sentMeals.has(`${key}-dietLunch-${slot}`)) count++;
        });
      }
      const dietDinner = plan.dietDinner;
      if (dietDinner) {
        if (dietDinner.dietRecipe && !sentMeals.has(`${key}-dietDinner-dietRecipe`)) count++;
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
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

  const handleSendAll = () => {
    handleSendWeekToShopping();
    setShowSummary(false);
  };

  const getCategorySortOrder = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return 1;
    if (c.includes("légume") || c.includes("vegetable")) return 2;
    if (c.includes("féculent") || c.includes("starch")) return 3;
    if (c.includes("laitage") || c.includes("dairy")) return 4;
    if (c.includes("dessert") || c.includes("déssert")) return 5;
    return 6;
  };

  const getDietItemsSummary = (dayKey: string, targetKey: 'dietLunch' | 'dietDinner') => {
    const plan = mealPlan[dayKey]?.[targetKey];
    if (!plan) return [];
    const mealType = targetKey === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(dayKey);
    const currentServings = plan.servings ?? getDefaultDietServings(dayDate, mealType, settings);

    const result: { category: string; text: string; id: string }[] = [];

    (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
      const slotVal = plan[slot];
      if (!slotVal) return;
      const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
      ids.forEach(id => {
        const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
        const name = item ? item.name : id;
        const scaledWeight = item?.weight ? formatScaledWeight(item.weight, currentServings, 2.5) : '';
        result.push({
          category: slot,
          text: `${name}${scaledWeight ? ` (${scaledWeight})` : ''}`,
          id: item ? item.id : id
        });
      });
    });

    return result.sort((a, b) => getCategorySortOrder(a.category) - getCategorySortOrder(b.category));
  };

  const getCategoryBadgeClass = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (c.includes("légume") || c.includes("vegetable")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (c.includes("féculent") || c.includes("starch")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (c.includes("laitage") || c.includes("dairy")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (c.includes("dessert") || c.includes("déssert")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  const getCategoryIcon = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return "🥩";
    if (c.includes("légume") || c.includes("vegetable")) return "🥦";
    if (c.includes("féculent") || c.includes("starch")) return "🍚";
    if (c.includes("laitage") || c.includes("dairy")) return "🥛";
    if (c.includes("dessert") || c.includes("déssert")) return "🍎";
    return "🥗";
  };

  const resolveDietCategory = (name: string, itemCat?: string): string => {
    if (itemCat) {
      const c = itemCat.toLowerCase();
      if (c.includes("protéine") || c.includes("protein")) return "Protéines";
      if (c.includes("légume") || c.includes("vegetable")) return "Légumes";
      if (c.includes("féculent") || c.includes("starch")) return "Féculents";
      if (c.includes("dessert") || c.includes("déssert")) return "Desserts";
    }
    if (!name) return "Protéines";
    const n = name.toLowerCase();
    const matched = (dietItems || []).find(di => di.name.toLowerCase() === n || n.includes(di.name.toLowerCase()));
    if (matched?.category) {
      return matched.category;
    }
    if (/poulet|boeuf|bœuf|poisson|oeuf|œuf|steak|saumon|thon|jambon|dinde|veau|porc|crevette|viande|protein|protéine|tofu|seitan|colin|cabillaud|canard/.test(n)) return "Protéines";
    if (/courgette|carotte|salade|tomate|haricot|légume|legume|vegetable|épinard|epinard|brocoli|concombre|poivron|champignon|chou|aubergine|asperge|radis|poireau|céleri/.test(n)) return "Légumes";
    if (/riz|pâte|pate|pomme de terre|féculent|feculent|starch|pain|semoule|quinoa|lentille|mais|maïs|patate|boulgour|avoine|ble|blé/.test(n)) return "Féculents";
    if (/yaourt|fruit|compote|dessert|pomme|banane|chocolat|fromage blanc|fraise|gâteau|gateau|orange|poire|pêche|peche|kiwi|citron|laitage/.test(n)) return "Desserts";
    return "Protéines";
  };

  const getDietRecipeCategoryItems = (dr: DietRecipe, currentServings?: number) => {
    const list: { name: string; weight: string; category: string }[] = [];
    const baseServings = dr.servings || 2.5;
    if (dr.items && dr.items.length > 0) {
      dr.items.forEach(item => {
        const cat = resolveDietCategory(item.name, item.category);
        const scaledWeight = (item.weight && currentServings) 
          ? formatScaledWeight(item.weight, currentServings, baseServings)
          : (item.weight || "");
        list.push({
          name: item.name,
          weight: scaledWeight,
          category: cat
        });
      });
    } else if (dr.ingredients && typeof dr.ingredients === "string") {
      const parts = dr.ingredients.split(/[\+\,]/).map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        const cat = resolveDietCategory(part);
        list.push({
          name: part,
          weight: "",
          category: cat
        });
      });
    }
    return list.sort((a, b) => getCategorySortOrder(a.category) - getCategorySortOrder(b.category));
  };

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      <header className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-violet-50 p-2 rounded-2xl border border-violet-100 shadow-xs">
              <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600 cursor-pointer">
                <EXT_ICONS.ArrowLeft />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-violet-700 min-w-[180px] text-center">
                {formatWeekRange(baseDate)}
              </span>
              <button onClick={() => changeWeek(1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600 cursor-pointer">
                <EXT_ICONS.ArrowRight />
              </button>
            </div>
            {unsentCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-black px-3 py-2 rounded-full shadow-md animate-pulse">
                {unsentCount}
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Mon Planning</h2>
          <p className="font-bold text-purple-500 text-xs uppercase tracking-wider">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* SÉLECTEUR DE FILTRE RAPIDE */}
          <div className="flex justify-center pt-1">
            <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-xs">
              <button
                onClick={() => setPlanningFilter('all')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'all'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>📅</span>
                <span>Tous</span>
              </button>
              <button
                onClick={() => setPlanningFilter('recipes')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'recipes'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <EXT_ICONS.Book />
                <span>Classiques</span>
              </button>
              <button
                onClick={() => setPlanningFilter('regime')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'regime'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>🥗</span>
                <span>Régime</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <button 
            onClick={handleSendWeekToShopping}
            className="bg-purple-600 text-white py-3.5 px-4 rounded-2xl font-black shadow-md shadow-purple-100 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 text-xs cursor-pointer"
          >
            <EXT_ICONS.Cart />
            <span>Tout envoyer</span>
          </button>
          <button 
            onClick={() => setShowSummary(true)} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 px-4 rounded-2xl font-black border border-gray-200 transition-all flex items-center gap-2 active:scale-95 text-xs cursor-pointer"
          >
            <span>📋 Résumé</span>
          </button>
        </div>
      </header>

      {/* CALENDRIER HEBDOMADAIRE UNIFIÉ */}
      <div className="space-y-4">
        {days.map(d => {
          const key = formatDateKey(d);
          const dayPlan = mealPlan[key] || {};

          // Check for meals in each slot
          const renderMealSlot = (mealType: 'lunch' | 'dinner', mealLabel: string, icon: string) => {
            const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
            const classicId = dayPlan[mealType]?.recipe1 || dayPlan[mealType]?.recipe2;
            const classicRecipe = classicId ? recipes.find(r => r.id === classicId) : null;
            const isClassicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;

            const dietRecipeId = dayPlan[targetDietKey]?.dietRecipe;
            const dietRecipe = dietRecipeId ? (dietRecipes || []).find(r => r.id === dietRecipeId) : null;
            const isDietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;

            const dietSummary = getDietItemsSummary(key, targetDietKey);
            const isDietComposedSent = isDietMealSent(key, targetDietKey);

            const dietServingsVal = dayPlan[targetDietKey]?.servings ?? getDefaultDietServings(d, mealType, settings);

            const hasAnyMeal = !!classicId || !!dietRecipeId || dietSummary.length > 0;

            // Filter check
            if (planningFilter === 'recipes' && !classicId && (dietRecipeId || dietSummary.length > 0)) {
              return (
                <div className="opacity-40 p-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                  {icon} {mealLabel} : Repas Régime planifié
                </div>
              );
            }
            if (planningFilter === 'regime' && classicId) {
              return (
                <div className="opacity-40 p-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                  {icon} {mealLabel} : Recette Classique planifiée
                </div>
              );
            }

            const dietRecipeCategoryItems = dietRecipe ? getDietRecipeCategoryItems(dietRecipe, dietServingsVal) : [];

            const isSlotSentLocal = (() => {
              if (!hasAnyMeal) return false;
              const classicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;
              const dietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;
              const dietComposedSent = dietSummary.length > 0 ? isDietMealSent(key, targetDietKey) : false;
              
              let allSent = true;
              if (classicId && !classicSent) allSent = false;
              if (dietRecipeId && !dietRecipeSent) allSent = false;
              if (dietSummary.length > 0 && !dietComposedSent) allSent = false;
              
              return allSent;
            })();

            const slotBgClass = !hasAnyMeal
              ? 'bg-white border-gray-100'
              : isSlotSentLocal
                ? 'bg-green-50/70 border-green-200'
                : 'bg-purple-50/50 border-purple-200';

            return (
              <div className={`space-y-3 p-3.5 rounded-2xl border transition-all ${slotBgClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{icon}</span> <span>{mealLabel}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* SÉLECTEUR DE NOMBRE DE PERSONNES POUR CE REPAS */}
                    {(() => {
                      const badgeColor = getDietBadgeColor(d, mealType, settings);
                      return (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border shadow-2xs text-xs font-black transition-colors duration-300 ${badgeColor.bg} ${badgeColor.border} ${badgeColor.text}`} title="Nombre de personnes pour ce repas">
                          <span className="text-xs">👥</span>
                          <select
                            value={dietServingsVal}
                            onChange={e => updateDietMealPlan(key, mealType, 'servings', parseFloat(e.target.value))}
                            className={`bg-transparent font-black text-xs outline-none cursor-pointer ${badgeColor.text}`}
                          >
                            {DIET_PERSON_OPTIONS.map(val => (
                              <option key={val} value={val}>
                                {val.toString().replace('.', ',')} pers.
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {hasAnyMeal && (
                      <button
                        type="button"
                        onClick={() => handleSelectMeal(key, mealType, undefined)}
                        className="text-gray-400 hover:text-red-500 font-bold text-[11px] px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                        title="Vider ce repas"
                      >
                        <span>✕</span> <span>Vider</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CHAMPS DE SÉLECTION & BOUTON RENTRER ALIMENTS */}
                <div className="space-y-2">
                  {/* LIGNE 1 : CHAMP LISTE RECETTES RÉGIME */}
                  <div>
                    <SearchableSelect
                      options={dietRecipeOptions}
                      value={dietRecipeId}
                      onChange={val => {
                        if (!val) {
                          updateDietMealPlan(key, mealType, 'dietRecipe', undefined);
                        } else {
                          updateDietMealPlan(key, mealType, 'dietRecipe', val);
                        }
                      }}
                      placeholder="Recette régime..."
                      buttonClassName={dietRecipeId ? "bg-purple-50 border-purple-200 text-purple-900 font-black text-sm py-3 px-4 h-11 flex items-center justify-between" : "bg-white border-gray-200 text-gray-600 text-sm py-3 px-4 h-11 flex items-center justify-between"}
                    />
                  </div>

                  {/* LIGNE 2 : CHAMP LISTE RECETTES CLASSIQUE */}
                  <div>
                    <SearchableSelect
                      options={classicRecipeOptions}
                      value={classicId}
                      onChange={val => {
                        if (!val) {
                          updateMealPlan(key, mealType, 'recipe1', undefined);
                          updateMealPlan(key, mealType, 'recipe2', undefined);
                        } else {
                          updateMealPlan(key, mealType, 'recipe1', val);
                        }
                      }}
                      placeholder="Recette classique..."
                      buttonClassName={classicId ? "bg-blue-50 border-blue-200 text-blue-900 font-black text-sm py-3 px-4 h-11 flex items-center justify-between" : "bg-white border-gray-200 text-gray-600 text-sm py-3 px-4 h-11 flex items-center justify-between"}
                    />
                  </div>

                  {/* LIGNE 3 : BOUTON 🥗 + Rentrer Aliments Régime */}
                  <button
                    type="button"
                    onClick={() => handleOpenRentrerMeal(key, mealType)}
                    className="w-full text-xs font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 py-2 px-3 rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <span>🥗</span>
                    <span>+ Rentrer Aliments Régime</span>
                  </button>
                </div>

                {/* AFFICHAGE RECETTE CLASSIQUE SÉLECTIONNÉE */}
                {classicId && (
                  <div className={`p-3 rounded-2xl border transition-all ${isClassicSent ? 'bg-green-50/70 border-green-200' : 'bg-blue-50/50 border-blue-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>📖</span> <span>{classicRecipe?.title || 'Recette Classique'}</span>
                          <span className="text-[10px] text-blue-700 font-bold">({dietServingsVal.toString().replace('.', ',')} pers.)</span>
                        </span>
                        {isClassicSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                      </div>
                      {!isClassicSent && (
                        <button
                          type="button"
                          onClick={() => handleSendRecipe(key, mealType, 'recipe1', classicId)}
                          className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <EXT_ICONS.Cart />
                          <span>Envoyer</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* AFFICHAGE RECETTE RÉGIME SÉLECTIONNÉE & ALIMENTS AVEC COULEURS DE CATÉGORIES */}
                {dietRecipeId && dietRecipe && (
                  <div className={`p-3 rounded-2xl border transition-all ${isDietRecipeSent ? 'bg-green-50/70 border-green-200' : 'bg-purple-50/50 border-purple-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>🥗</span> <span>Recette Régime : {dietRecipe.name}</span>
                          <span className="text-[10px] text-purple-700 font-bold">({dietServingsVal.toString().replace('.', ',')} pers.)</span>
                        </span>
                        {isDietRecipeSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                      </div>
                      {!isDietRecipeSent && (
                        <button
                          type="button"
                          onClick={() => handleSendDietRecipe(key, targetDietKey, dietRecipeId)}
                          className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <EXT_ICONS.Cart />
                          <span>Envoyer</span>
                        </button>
                      )}
                    </div>

                    {/* ALIMENTS DE LA RECETTE RÉGIME AVEC LEURS COULEURS DE CATÉGORIES */}
                    {dietRecipeCategoryItems.length > 0 && (
                      <div className="bg-white/90 border border-purple-100 rounded-xl p-2 flex flex-wrap gap-1.5">
                        {dietRecipeCategoryItems.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 ${getCategoryBadgeClass(item.category)}`}
                          >
                            <span>{getCategoryIcon(item.category)}</span>
                            <span>{item.name}{item.weight ? ` (${item.weight})` : ''}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AFFICHAGE ALIMENTS RÉGIME COMPOSÉS SELECTIONNÉS (MENU RÉGIME) AVEC LEURS COULEURS DE CATÉGORIES */}
                {dietSummary.length > 0 && (
                  <div className={`p-3 rounded-2xl border transition-all ${isDietComposedSent ? 'bg-green-50/70 border-green-200' : 'bg-pink-50/50 border-pink-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-pink-800 bg-pink-100 border border-pink-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>🥗</span> <span>Aliments Régime</span>
                        </span>
                        {isDietComposedSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                        {(() => {
                          const badgeColor = getDietBadgeColor(d, mealType, settings);
                          return (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-colors duration-300 ${badgeColor.bg} ${badgeColor.border} ${badgeColor.text}`}>
                              <span>👥</span>
                              <select
                                value={dietServingsVal}
                                onChange={e => updateDietMealPlan(key, mealType, 'servings', parseFloat(e.target.value))}
                                className={`bg-transparent font-black text-[10px] outline-none cursor-pointer ${badgeColor.text}`}
                              >
                                {DIET_PERSON_OPTIONS.map(val => (
                                  <option key={val} value={val}>{val.toString().replace('.', ',')} pers.</option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-1">
                        {!isDietComposedSent && (
                          <button
                            type="button"
                            onClick={() => {
                              (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
                                if (dayPlan[targetDietKey]?.[slot]) {
                                  handleSendDietItem(key, targetDietKey, slot, dayPlan[targetDietKey]![slot]!);
                                }
                              });
                            }}
                            className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <EXT_ICONS.Cart />
                            <span>Envoyer</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ALIMENTS COMPOSÉS AVEC COULEURS DE CATÉGORIES */}
                    <div className="bg-white/90 border border-pink-100 rounded-xl p-2 flex flex-wrap gap-1.5">
                      {dietSummary.map((itemObj, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 ${getCategoryBadgeClass(itemObj.category)}`}
                        >
                          <span>{getCategoryIcon(itemObj.category)}</span>
                          <span>{itemObj.text}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDietItemDirect(key, mealType, itemObj.category as any, itemObj.id)}
                            className="text-gray-400 hover:text-red-600 font-black text-[9px] cursor-pointer ml-0.5"
                            title="Retirer cet aliment"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          };

          const isSlotSent = (mealType: 'lunch' | 'dinner') => {
            const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
            const classicId = dayPlan[mealType]?.recipe1 || dayPlan[mealType]?.recipe2;
            const dietRecipeId = dayPlan[targetDietKey]?.dietRecipe;
            const dietSummary = getDietItemsSummary(key, targetDietKey);
            
            const classicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;
            const dietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;
            const dietComposedSent = dietSummary.length > 0 ? isDietMealSent(key, targetDietKey) : false;
            
            const hasPlanned = !!classicId || !!dietRecipeId || dietSummary.length > 0;
            if (!hasPlanned) return false;
            
            let allSent = true;
            if (classicId && !classicSent) allSent = false;
            if (dietRecipeId && !dietRecipeSent) allSent = false;
            if (dietSummary.length > 0 && !dietComposedSent) allSent = false;
            
            return allSent;
          };

          const isLunchSent = isSlotSent('lunch');
          const isDinnerSent = isSlotSent('dinner');

          return (
            <div key={key} className="bg-white p-4 sm:p-5 border rounded-[28px] shadow-xs hover:shadow-md transition-all border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
              <div className="md:w-28 h-14 md:h-auto md:self-stretch shrink-0 flex flex-col justify-center border border-gray-100 pb-0 pr-0 relative overflow-hidden rounded-xl md:border-y-0 md:border-l-0 md:border-r z-0">
                {/* Partie haute (Déjeuner) en vert */}
                <div className={`absolute top-0 left-0 right-0 h-1/2 z-0 transition-all duration-300 ${isLunchSent ? 'bg-green-100/70 border-b border-green-200/40' : 'bg-transparent'}`} />
                {/* Partie basse (Dîner) en vert */}
                <div className={`absolute bottom-0 left-0 right-0 h-1/2 z-0 transition-all duration-300 ${isDinnerSent ? 'bg-green-100/70' : 'bg-transparent'}`} />
                
                <div className="relative z-10 flex flex-col justify-center items-center md:items-start text-center md:text-left px-2.5">
                  <span className={`font-black text-xs uppercase tracking-wider leading-tight transition-colors duration-300 ${isLunchSent || isDinnerSent ? 'text-green-800' : 'text-purple-700'}`}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 leading-tight transition-colors duration-300 ${isLunchSent || isDinnerSent ? 'text-green-600/90' : 'text-gray-400'}`}>
                    {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {renderMealSlot('lunch', 'Déjeuner', '☀️')}
              </div>
              <div className="flex-1 min-w-0">
                {renderMealSlot('dinner', 'Dîner', '🌙')}
              </div>
            </div>
          );
        })}
      </div>

      {/* EXTRAS DIMANCHE */}
      {(() => {
        const sunday = days.find(d => d.getDay() === 0);
        if (!sunday) return null;
        const key = formatDateKey(sunday);
        const dayPlan = mealPlan[key] || {};

        return (
          <div className="bg-white p-6 border rounded-[32px] shadow-xs border-gray-100 space-y-6">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>🧁</span>
              <span>Extras du Dimanche (Viennoiseries, Sauces & Coulis)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIENNOISERIES */}
              <div className="space-y-3 bg-amber-50/40 p-5 rounded-2xl border border-amber-100">
                <label className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🥐</span> <span>Viennoiseries & Gâteaux</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(idx => {
                    const recipeId = dayPlan.viennoiseries?.[idx];
                    const isSent = recipeId ? sentMeals.has(`${key}-viennoiseries-${idx}`) : false;

                    return (
                      <div key={idx} className="space-y-1 bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-amber-700 uppercase">Slot {idx + 1}</span>
                          {isSent && (
                            <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <EXT_ICONS.Check /> Courses
                            </span>
                          )}
                        </div>
                        <SearchableSelect
                          options={sortedRecipes.filter(r => r.category === 'Viennoiserie' || r.category === 'Gâteaux').map(r => ({ id: r.id, title: r.title }))}
                          value={recipeId}
                          onChange={val => updateMealPlan(key, 'extra', 'viennoiseries', val, idx)}
                          placeholder="Choisir..."
                        />
                        {recipeId && !isSent && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendRecipe(key, 'extra', 'viennoiseries', recipeId, idx)}
                              className="text-[9px] font-black text-amber-800 hover:text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <EXT_ICONS.Cart /> <span>Envoyer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAUCES & COULIS */}
              <div className="space-y-3 bg-red-50/40 p-5 rounded-2xl border border-red-100">
                <label className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🥫</span> <span>Sauces & Coulis</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(idx => {
                    const recipeId = dayPlan.sauces?.[idx];
                    const isSent = recipeId ? sentMeals.has(`${key}-sauces-${idx}`) : false;

                    return (
                      <div key={idx} className="space-y-1 bg-white p-3 rounded-xl border border-red-200/60 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-red-700 uppercase">Slot {idx + 1}</span>
                          {isSent && (
                            <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <EXT_ICONS.Check /> Courses
                            </span>
                          )}
                        </div>
                        <SearchableSelect
                          options={sortedRecipes.filter(r => r.category === 'Sauce' || r.category === 'Coulis').map(r => ({ id: r.id, title: r.title }))}
                          value={recipeId}
                          onChange={val => updateMealPlan(key, 'extra', 'sauces', val, idx)}
                          placeholder="Choisir..."
                        />
                        {recipeId && !isSent && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendRecipe(key, 'extra', 'sauces', recipeId, idx)}
                              className="text-[9px] font-black text-red-800 hover:text-red-950 bg-red-100/70 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <EXT_ICONS.Cart /> <span>Envoyer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL "RENTRER DÉJEUNER / DÎNER" (ALIMENTS RÉGIME COMPOSÉS) */}
      {showRentrerMealModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-purple-50/40">
              <div>
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span>🥗</span>
                  <span>{rentrerMealType === 'lunch' ? 'Composer le Déjeuner' : 'Composer le Dîner'}</span>
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {rentrerMealDayKey && new Date(rentrerMealDayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-2xl border border-purple-200 shadow-2xs">
                  <span className="text-xs font-black text-purple-700">Portions :</span>
                  <select
                    value={rentrerMealServings}
                    onChange={e => setRentrerMealServings(parseFloat(e.target.value))}
                    className="bg-transparent font-black text-sm text-purple-900 outline-none cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>{val.toString().replace('.', ',')} pers.</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowRentrerMealModal(false)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-500 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* PROTÉINES */}
                <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-xs font-black text-rose-800 uppercase tracking-widest">🥩 Protéines</span>
                    <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-full">{selectedProteins.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Protéines' || i.category === 'Viandes' || i.category === 'Poissons').map(item => {
                      const isChecked = selectedProteins.includes(item.id) || selectedProteins.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedProteins(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-rose-600 text-white border-rose-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-rose-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-rose-100' : 'text-rose-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LÉGUMES */}
                <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">🥦 Légumes</span>
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full">{selectedVegetables.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Légumes' || i.category === 'Crudités').map(item => {
                      const isChecked = selectedVegetables.includes(item.id) || selectedVegetables.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedVegetables(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-emerald-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-emerald-100' : 'text-emerald-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FÉCULENTS */}
                <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">🍚 Féculents</span>
                    <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-full">{selectedStarches.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Féculents' || i.category === 'Pains et Céréales').map(item => {
                      const isChecked = selectedStarches.includes(item.id) || selectedStarches.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedStarches(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-amber-600 text-white border-amber-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-amber-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-amber-100' : 'text-amber-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LAITAGE */}
                <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="text-xs font-black text-blue-800 uppercase tracking-widest">🥛 Laitage</span>
                    <span className="text-[10px] font-black bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded-full">{selectedDairies.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Laitage' || i.category === 'Laitages' || i.category === 'Produits Laitiers').map(item => {
                      const isChecked = selectedDairies.includes(item.id) || selectedDairies.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedDairies(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-blue-600 text-white border-blue-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-blue-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-blue-100' : 'text-blue-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DESSERTS */}
                <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="text-xs font-black text-purple-800 uppercase tracking-widest">🍎 Desserts</span>
                    <span className="text-[10px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded-full">{selectedDesserts.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Desserts' || i.category === 'Fruits' || i.category === 'Dessert').map(item => {
                      const isChecked = selectedDesserts.includes(item.id) || selectedDesserts.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedDesserts(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-purple-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-purple-100' : 'text-purple-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-4 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setSelectedProteins([]);
                  setSelectedVegetables([]);
                  setSelectedStarches([]);
                  setSelectedDairies([]);
                  setSelectedDesserts([]);
                }}
                className="text-xs font-black text-red-600 hover:text-red-800 p-2 cursor-pointer"
              >
                Tout désélectionner
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRentrerMealModal(false)}
                  className="px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveRentrerMeal}
                  className="px-8 py-3.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:bg-purple-700 transition-all cursor-pointer"
                >
                  Enregistrer le Repas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉSUMÉ DES REPAS DE LA SEMAINE */}
      {showSummary && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <div className="p-8 border-b flex justify-between items-center bg-purple-50/30">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <EXT_ICONS.Cart />
                <span>Résumé de la Semaine</span>
              </h3>
              <button onClick={() => setShowSummary(false)} className="p-4 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button onClick={() => changeWeek(-1)} className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer">
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-purple-600 min-w-[200px] text-center">
                  {formatWeekRange(baseDate)}
                </span>
                <button onClick={() => changeWeek(1)} className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer">
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              {days.map(d => {
                const dateStr = formatDateKey(d);
                const plan = mealPlan[dateStr];
                if (!plan) return null;

                const classicLunch = plan.lunch?.recipe1 || plan.lunch?.recipe2;
                const classicDinner = plan.dinner?.recipe1 || plan.dinner?.recipe2;
                const dietLunch = plan.dietLunch;
                const dietDinner = plan.dietDinner;
                const hasViennoiseries = (plan.viennoiseries || []).some(Boolean);
                const hasSauces = (plan.sauces || []).some(Boolean);

                const hasAnything = classicLunch || classicDinner || dietLunch || dietDinner || hasViennoiseries || hasSauces;
                if (!hasAnything) return null;

                return (
                  <div key={dateStr} className="space-y-3 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-xs font-black uppercase tracking-widest text-purple-600 border-b border-gray-100 pb-2">
                      {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>

                    {/* DÉJEUNER */}
                    {(classicLunch || dietLunch) && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-purple-200">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">☀️ Déjeuner</span>
                        {classicLunch && (() => {
                          const r = recipes.find(rec => rec.id === classicLunch);
                          const isSent = sentMeals.has(`${dateStr}-lunch-recipe1`) || sentMeals.has(`${dateStr}-lunch-recipe2`);
                          return (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-800">{r?.title || 'Recette'} <span className="text-[10px] text-blue-600 font-bold">(Classique)</span></span>
                              {isSent ? <span className="text-green-600 font-bold text-[10px]">✓ Envoyé</span> : <span className="text-amber-600 font-bold text-[10px]">En attente</span>}
                            </div>
                          );
                        })()}
                        {dietLunch?.dietRecipe && (() => {
                          const dr = (dietRecipes || []).find(r => r.id === dietLunch.dietRecipe);
                          const isSent = sentMeals.has(`${dateStr}-dietLunch-dietRecipe`);
                          return (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-purple-900">{dr?.name || 'Recette Régime'} <span className="text-[10px] text-purple-600 font-bold">(Régime)</span></span>
                              {isSent ? <span className="text-green-600 font-bold text-[10px]">✓ Envoyé</span> : <span className="text-amber-600 font-bold text-[10px]">En attente</span>}
                            </div>
                          );
                        })()}
                        {getDietItemsSummary(dateStr, 'dietLunch').length > 0 && (
                          <div className="text-[11px] text-gray-600 font-medium">
                            Menu composé : {getDietItemsSummary(dateStr, 'dietLunch').map(x => x.text).join(' • ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DÎNER */}
                    {(classicDinner || dietDinner) && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-indigo-200">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">🌙 Dîner</span>
                        {classicDinner && (() => {
                          const r = recipes.find(rec => rec.id === classicDinner);
                          const isSent = sentMeals.has(`${dateStr}-dinner-recipe1`) || sentMeals.has(`${dateStr}-dinner-recipe2`);
                          return (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-800">{r?.title || 'Recette'} <span className="text-[10px] text-blue-600 font-bold">(Classique)</span></span>
                              {isSent ? <span className="text-green-600 font-bold text-[10px]">✓ Envoyé</span> : <span className="text-amber-600 font-bold text-[10px]">En attente</span>}
                            </div>
                          );
                        })()}
                        {dietDinner?.dietRecipe && (() => {
                          const dr = (dietRecipes || []).find(r => r.id === dietDinner.dietRecipe);
                          const isSent = sentMeals.has(`${dateStr}-dietDinner-dietRecipe`);
                          return (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-purple-900">{dr?.name || 'Recette Régime'} <span className="text-[10px] text-purple-600 font-bold">(Régime)</span></span>
                              {isSent ? <span className="text-green-600 font-bold text-[10px]">✓ Envoyé</span> : <span className="text-amber-600 font-bold text-[10px]">En attente</span>}
                            </div>
                          );
                        })()}
                        {getDietItemsSummary(dateStr, 'dietDinner').length > 0 && (
                          <div className="text-[11px] text-gray-600 font-medium">
                            Menu composé : {getDietItemsSummary(dateStr, 'dietDinner').map(x => x.text).join(' • ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowSummary(false)} className="w-full p-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-black text-xs transition-all cursor-pointer">Fermer</button>
              <button onClick={handleSendAll} className="w-full p-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer">🚀 Tout envoyer aux courses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const getPortionRules = (fp: FoodPortion): PortionRule[] => {
  if (fp.rules && Array.isArray(fp.rules) && fp.rules.length > 0) {
    return fp.rules;
  }
  return [{
    id: 'default-rule',
    baseAmount: fp.baseAmount || fp.amount || 1,
    baseUnit: fp.baseUnit || fp.unit || 'portion(s)',
    purchaseAmount: fp.purchaseAmount || 1,
    purchaseUnit: fp.purchaseUnit || 'pièce(s)',
    minThreshold: undefined
  }];
};

export function formatPortionConvertedDisplay(
  itemName: string,
  itemAmount: number,
  itemUnit: string,
  foodPortions: FoodPortion[]
): { formatted: string; hasRule: boolean; purchaseAmount: number; purchaseUnit: string; originalText: string } {
  const normName = itemName.trim().toLowerCase();
  let fp = (foodPortions || []).find(p => p.name.trim().toLowerCase() === normName);
  if (!fp) {
    const normClean = normName.replace(/œ/g, 'oe').replace(/é|è|ê/g, 'e');
    fp = (foodPortions || []).find(p => {
      const pClean = p.name.trim().toLowerCase().replace(/œ/g, 'oe').replace(/é|è|ê/g, 'e');
      return pClean === normClean || pClean.includes(normClean) || normClean.includes(pClean);
    });
  }

  if (!fp) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const rules = getPortionRules(fp);
  if (!rules || rules.length === 0) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const cleanItemUnit = itemUnit.trim().toLowerCase().replace(/\./g, '');
  
  // Recherche et conversion de toutes les règles candidates compatibles avec l'unité de l'article
  interface CandidateTierRule {
    rule: PortionRule;
    effectiveAmountInBaseUnit: number;
    threshold: number;
  }

  const candidates: CandidateTierRule[] = [];
  rules.forEach(r => {
    const rBaseUnit = (r.baseUnit || 'portion(s)').trim();
    const cleanRBaseUnit = rBaseUnit.toLowerCase().replace(/\./g, '');
    let amtInBase: number | null = null;

    if (cleanItemUnit === cleanRBaseUnit) {
      amtInBase = itemAmount;
    } else {
      amtInBase = convertUnitAmount(itemAmount, itemUnit, rBaseUnit);
    }

    if (amtInBase !== null && amtInBase > 0) {
      const threshold = (typeof r.minThreshold === 'number' && !isNaN(r.minThreshold) && r.minThreshold > 0)
        ? r.minThreshold
        : (r.baseAmount || 1);
      candidates.push({
        rule: r,
        effectiveAmountInBaseUnit: amtInBase,
        threshold
      });
    }
  });

  if (candidates.length === 0) {
    // Si aucune conversion d'unité possible, repli sur la première règle
    const fallbackRule = rules[0];
    const threshold = (typeof fallbackRule.minThreshold === 'number' && !isNaN(fallbackRule.minThreshold) && fallbackRule.minThreshold > 0)
      ? fallbackRule.minThreshold
      : (fallbackRule.baseAmount || 1);
    candidates.push({
      rule: fallbackRule,
      effectiveAmountInBaseUnit: itemAmount,
      threshold
    });
  }

  // Filtrer les paliers qualifiés (où la quantité totale atteint ou dépasse le seuil)
  const qualifying = candidates.filter(c => c.effectiveAmountInBaseUnit >= c.threshold);

  let selectedCandidate: CandidateTierRule;
  if (qualifying.length > 0) {
    // On sélectionne le palier qualifié le plus élevé (seuil max ou baseAmount max)
    qualifying.sort((a, b) => b.threshold - a.threshold || (b.rule.baseAmount || 1) - (a.rule.baseAmount || 1));
    selectedCandidate = qualifying[0];
  } else {
    // Sinon on prend le plus petit palier de base
    candidates.sort((a, b) => a.threshold - b.threshold || (a.rule.baseAmount || 1) - (b.rule.baseAmount || 1));
    selectedCandidate = candidates[0];
  }

  const matchedRule = selectedCandidate.rule;
  const effectiveAmountInBaseRuleUnit = selectedCandidate.effectiveAmountInBaseUnit;
  const baseRuleAmount = matchedRule.baseAmount || 1;
  const baseRuleUnit = matchedRule.baseUnit || 'portion(s)';
  const purchaseRuleAmount = matchedRule.purchaseAmount || 1;
  const purchaseRuleUnit = matchedRule.purchaseUnit || 'pièce(s)';

  if (baseRuleAmount <= 0) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const ratio = effectiveAmountInBaseRuleUnit / baseRuleAmount;
  const totalPurchaseCount = Math.ceil(ratio) * purchaseRuleAmount;
  const fullPurchaseCount = Math.floor(ratio) * purchaseRuleAmount;
  const remainderBaseAmountInBaseRuleUnit = Math.round((effectiveAmountInBaseRuleUnit - (fullPurchaseCount / purchaseRuleAmount) * baseRuleAmount) * 1000) / 1000;

  let remainderDisplayAmount = remainderBaseAmountInBaseRuleUnit;
  let remainderDisplayUnit = baseRuleUnit;
  const backVal = convertUnitAmount(remainderBaseAmountInBaseRuleUnit, baseRuleUnit, itemUnit);
  if (backVal !== null) {
    remainderDisplayAmount = Math.round(backVal * 100) / 100;
    remainderDisplayUnit = itemUnit;
  }

  const formatUnit = (amt: number, u: string) => {
    let clean = u.trim();
    if (amt <= 1) {
      clean = clean.replace(/\(s\)/gi, '')
                   .replace(/\(x\)/gi, '')
                   .replace(/\(es\)/gi, '')
                   .replace(/\(e\)/gi, '');
    } else {
      clean = clean.replace(/\(s\)/gi, 's')
                   .replace(/\(x\)/gi, 'x')
                   .replace(/\(es\)/gi, 'es')
                   .replace(/\(e\)/gi, 'e');
    }
    return `${amt} ${clean.trim()}`;
  };

  let formatted = '';

  if (fullPurchaseCount === 0 || remainderBaseAmountInBaseRuleUnit <= 0.0001) {
    formatted = formatUnit(totalPurchaseCount, purchaseRuleUnit);
  } else {
    const totalText = formatUnit(totalPurchaseCount, purchaseRuleUnit);
    const fullText = formatUnit(fullPurchaseCount, purchaseRuleUnit);
    const remainderText = formatUnit(remainderDisplayAmount, remainderDisplayUnit);
    formatted = `${totalText} (${fullText} et ${remainderText})`;
  }

  return {
    formatted,
    hasRule: true,
    purchaseAmount: totalPurchaseCount,
    purchaseUnit: purchaseRuleUnit,
    originalText: `${itemAmount} ${itemUnit}`
  };
}

