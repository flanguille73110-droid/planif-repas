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
  findSimilarDietFoods, resolveDietFoodCategory, detectSettingsCategoryFromFoodName, getPortionRules, formatPortionConvertedDisplay
} from '../utils/helpers';
import { RecipeDetail } from './RecipeDetail';
import { RecipeForm } from './RecipeForm';
export const RecipeBook: React.FC<{ 
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
  defaultTab?: 'all' | 'recipes' | 'regime';
  settings: UserSettings;
  setSettings?: React.Dispatch<React.SetStateAction<UserSettings>>;
}> = ({ recipes, mealPlan, addRecipe, deleteRecipe, onAddToShopping, foodPortions, foodCategories, onAddFoodToSettings, onRemoveFoodFromSettings, updateMealPlan, updateDietMealPlan, setSentMeals, dietItems, setDietItems, dietServings, setDietServings, dietRecipes = [], setDietRecipes, defaultTab = 'recipes', settings, setSettings }) => {
  const DIET_RECIPE_UNITS = getAvailableUnits(settings);
  const [viewMode, setViewMode] = useState<'all' | 'recipes' | 'regime' | 'categories_regime'>(() => (defaultTab as any) || 'recipes');

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
    const conflict = getSlotOccupantInfo(mealPlan[dietPlanDate], dietPlanMealType, recipes, dietRecipes, dietItems, planningDietRecipe.id, true);
    if (conflict) {
      const mealLabel = dietPlanMealType === 'lunch' ? 'Midi (Déjeuner)' : 'Soir (Dîner)';
      const confirmed = window.confirm(`Le créneau du ${dietPlanDate} (${mealLabel}) contient déjà « ${conflict.title} » (${conflict.type}).\n\nVoulez-vous le remplacer par « ${planningDietRecipe.name} » ?`);
      if (!confirmed) return;
    }
    if (updateDietMealPlan) {
      updateDietMealPlan(dietPlanDate, dietPlanMealType, 'dietRecipe', planningDietRecipe.id);
    }
    if (setDietServings && dietPlanServings) {
      setDietServings(dietPlanServings);
    }
    const mealLabel = dietPlanMealType === 'lunch' ? 'Déjeuner' : 'Dîner';
    alert(`Recette régime « ${planningDietRecipe.name} » programmée au planning pour le ${dietPlanDate} (${mealLabel}) pour ${dietPlanServings.toString().replace('.', ',')} pers. !`);
    setPlanningDietRecipe(null);
  };

  // Diet modal state
  const [showDietModal, setShowDietModal] = useState(false);
  const [showRoundingSettingsModal, setShowRoundingSettingsModal] = useState(false);
  const [dietToDelete, setDietToDelete] = useState<DietItem | null>(null);
  const [editingDietItem, setEditingDietItem] = useState<DietItem | null>(null);
  const [dietFormName, setDietFormName] = useState('');
  const [dietFormCategory, setDietFormCategory] = useState<DietCategory>('Protéines');
  const [dietFormSettingsCategory, setDietFormSettingsCategory] = useState<string>('Protéines');
  const [dietFormWeightValue, setDietFormWeightValue] = useState('100');
  const [dietFormWeightUnit, setDietFormWeightUnit] = useState('g');
  const [dietFormRoundWeight, setDietFormRoundWeight] = useState<boolean>(true);
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
    if (catCandidate && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(catCandidate)) {
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
    if (/haricot|courgette|tomate|carotte|brocoli|salade|épinard|epinard|poivron|champignon|poireau|poireaux|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri|betterave|avocat|asperge|épinards|epinards|légume|legume|petits pois|artichaut|mâche|mache|roquette|endive|citrouille|potiron|butternut|courge/i.test(cleanName)) return 'Légumes';
    if (/riz|pâte|pate|coquillette|spaghetti|penne|tagliatelle|pomme de terre|pommes de terre|patate|patates|quinoa|boulgour|semoule|pain|lentille|pois chiche|avoine|fécule|fecule|blé|ble|maïs|mais|gnocchi|polenta|féculent|feculent|nouille|vermicelle/i.test(cleanName)) return 'Féculents';
    if (/yaourt|fromage blanc|compote|\bpommes?\b(?! de terre)|\bpoires?\b|banane|fruit|dessert|fraise|kiwi|orange|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|crème|creme|flan|chocolat|mousse|gâteau|gateau|tarte|sorbet|glace/i.test(cleanName)) return 'Desserts';

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
    if (['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(newFoodRecipeDietCat)) {
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

  const sortedDietRecipes = useMemo(() => {
    return [...(dietRecipes || [])].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    );
  }, [dietRecipes]);

  const filteredDietRecipes = useMemo(() => {
    return sortedDietRecipes.filter(dr => {
      const term = filter.trim().toLowerCase();
      if (!term) return true;
      const nameMatch = (dr.name || '').toLowerCase().includes(term);
      const ingMatch = typeof dr.ingredients === 'string'
        ? dr.ingredients.toLowerCase().includes(term)
        : (dr.items || []).some(i => (i.name || '').toLowerCase().includes(term));
      return nameMatch || ingMatch;
    });
  }, [sortedDietRecipes, filter]);

  type CombinedRecipeItem = 
    | { type: 'classic'; recipe: Recipe; title: string }
    | { type: 'diet'; dietRecipe: DietRecipe; title: string };

  const allSortedRecipes = useMemo(() => {
    const classics: CombinedRecipeItem[] = filtered.map(r => ({
      type: 'classic',
      recipe: r,
      title: r.title || ''
    }));
    const diets: CombinedRecipeItem[] = filteredDietRecipes.map(dr => ({
      type: 'diet',
      dietRecipe: dr,
      title: dr.name || ''
    }));
    return [...classics, ...diets].sort((a, b) => 
      a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' })
    );
  }, [filtered, filteredDietRecipes]);

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
    setDietFormWeightValue('100');
    setDietFormWeightUnit('g');
    setDietFormRoundWeight(true);
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

    const parsed = parseWeightAndUnit(item.weight);
    setDietFormWeightValue(parsed.value);
    setDietFormWeightUnit(parsed.unit);
    setDietFormRoundWeight(item.roundWeight !== false);
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
    const valStr = dietFormWeightValue.trim() || '100';
    const unitStr = dietFormWeightUnit.trim() || 'g';
    const fullWeight = `${valStr} ${unitStr}`;

    const normalizedWeight = formatScaledWeight(fullWeight, 2.5, dietModalServings, settings, dietFormRoundWeight);

    if (editingDietItem) {
      setDietItems(prev => prev.map(item => item.id === editingDietItem.id ? {
        ...item,
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight,
        roundWeight: dietFormRoundWeight
      } : item));
    } else {
      const newItem: DietItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight,
        roundWeight: dietFormRoundWeight
      };
      setDietItems(prev => [...prev, newItem]);
    }

    // Enregistrer dans Réglages, Aliments par rapport à Catégories (Réglages)
    if (onAddFoodToSettings) {
      onAddFoodToSettings(dietFormName.trim(), unitStr, dietFormSettingsCategory);
    }

    setShowDietModal(false);
    setEditingDietItem(null);
    setDietFormName('');
    setDietFormWeightValue('100');
    setDietFormWeightUnit('g');
    setDietModalServings(2.5);
  };

  const filteredDietItems = useMemo(() => {
    if (!dietSearch.trim()) return dietItems;
    return dietItems.filter(item => item.name.toLowerCase().includes(dietSearch.toLowerCase().trim()));
  }, [dietItems, dietSearch]);

  const proteins = useMemo(() => filteredDietItems.filter(i => i.category === 'Protéines').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const vegetables = useMemo(() => filteredDietItems.filter(i => i.category === 'Légumes').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const starches = useMemo(() => filteredDietItems.filter(i => i.category === 'Féculents').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const dairies = useMemo(() => filteredDietItems.filter(i => i.category === 'Laitage').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
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
      settings={settings}
    />
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SÉLECTEUR 4 POSITIONS TOUT EN HAUT : TOUTES / RECETTES / RÉGIME / CATÉGORIES RÉGIME */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-xl sm:max-w-2xl lg:max-w-3xl overflow-x-auto">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'all'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📚</span>
            <span>Toutes les recettes</span>
          </button>
          <button
            onClick={() => setViewMode('recipes')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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

      {/* VUE 0 : TOUTES LES RECETTES (CLASSIQUES + RÉGIME) */}
      {viewMode === 'all' && (
        <div className="space-y-6 animate-fadeIn">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Toutes les recettes</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100 shadow-sm">
                  {filtered.length + filteredDietRecipes.length} recettes ({filtered.length} classique{filtered.length > 1 ? 's' : ''}, {filteredDietRecipes.length} régime{filteredDietRecipes.length > 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Regroupement de l'ensemble des recettes classiques et régime
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => { setEditingRecipe(null); setIsAdding(true); }} className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-100 text-sm">
                + Recette Classique
              </button>
              <button onClick={handleOpenAddDietRecipe} className="bg-purple-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-2xl font-bold hover:bg-purple-100 transition-all shadow-sm text-sm">
                + Recette Régime
              </button>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Rechercher dans toutes les recettes..." className="flex-1 p-4 rounded-2xl border border-purple-100 bg-white shadow-sm outline-none focus:ring-2 focus:ring-purple-300 font-medium" value={filter} onChange={e => setFilter(e.target.value)} />
            <select className="p-4 rounded-2xl border border-purple-100 bg-white font-bold outline-none cursor-pointer" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
              <option>Tous</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSortedRecipes.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-300 italic font-medium">Aucune recette trouvée.</div>
            ) : (
              allSortedRecipes.map(item => {
                if (item.type === 'classic') {
                  const r = item.recipe;
                  return (
                    <div key={`classic-${r.id}`} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative flex flex-col justify-between">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                Classique • {r.category}
                              </span>
                              {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">⏲️ {formatTotalTime(r.prepTime + r.cookTime)}</span>
                          </div>
                          <button onClick={(e) => handleEdit(e, r)} className="bg-purple-50 p-2 rounded-xl text-purple-600 hover:bg-purple-100 transition-all shadow-sm" title="Modifier">
                            <EXT_ICONS.Edit />
                          </button>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 break-words group-hover:text-purple-700 transition-colors">{r.title}</h3>
                      </div>
                      <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-50 text-xs font-black text-purple-600">
                        <span>📅 Voir / Programmer</span>
                        <span className="text-gray-300 group-hover:text-purple-600 transition-colors">→</span>
                      </div>
                    </div>
                  );
                } else {
                  const dr = item.dietRecipe;
                  const baseServings = dr.servings || 2.5;
                  const currentServings = dietServings || 2.5;

                  let itemsToDisplay: { name: string; weight: string; category?: string }[] = [];
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
                      if (match) return { name: match[1].trim(), weight: match[2].trim() };
                      return { name: trimmed, weight: '' };
                    });
                  }

                  return (
                    <div 
                      key={`diet-${dr.id}`} 
                      onClick={() => {
                        setPlanningDietRecipe(dr);
                        setDietPlanDate(formatDateKey(new Date()));
                        setDietPlanMealType('lunch');
                        setDietPlanServings(dr.servings || 2.5);
                        setShowDietAvailability(false);
                      }}
                      className="bg-purple-50/40 border border-purple-100 rounded-[32px] p-6 flex flex-col justify-between space-y-4 hover:shadow-xl hover:border-purple-300 transition-all group cursor-pointer"
                      title="Cliquer pour planifier au régime"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-lg uppercase tracking-wider w-fit">
                              🥗 Régime
                            </span>
                            <h4 className="font-black text-gray-800 text-lg leading-snug group-hover:text-purple-700 transition-colors">{dr.name}</h4>
                          </div>
                          <span className="shrink-0 bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200">
                            👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-gray-700 bg-white p-3 rounded-xl border border-purple-50 mt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {itemsToDisplay.map((item, idx) => {
                              let text = item.weight ? `${item.name} ${scaleTextQuantity(item.weight, currentServings, baseServings)}`.trim() : scaleTextQuantity(item.name || '', currentServings, baseServings);
                              const cat = resolveDietFoodCategory(item.name, item.category);
                              let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                              if (cat === 'Protéines') colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                              else if (cat === 'Légumes') colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                              else if (cat === 'Féculents') colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                              else if (cat === 'Desserts') colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';

                              return (
                                <span key={idx} className={`px-2 py-0.5 border rounded-lg text-[10px] font-black ${colorClass}`}>
                                  {text}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-purple-100/60">
                        <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                          <span>📅</span>
                          <span>Planifier au régime</span>
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
                }
              })
            )}
          </div>
        </div>
      )}

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
              {sortedDietRecipes.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-400 italic font-medium">
                  Aucune recette régime enregistrée.
                </div>
              ) : (
                sortedDietRecipes.map((dr) => {
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
                    const categoryOrderMap: Record<string, number> = {
                      'Protéines': 0,
                      'Légumes': 1,
                      'Féculents': 2,
                      'Laitage': 3,
                      'Desserts': 4
                    };
                    itemsToDisplay.sort((a, b) => {
                      const catA = resolveDietFoodCategory(a.name, a.category);
                      const catB = resolveDietFoodCategory(b.name, b.category);
                      const orderA = categoryOrderMap[catA] !== undefined ? categoryOrderMap[catA] : 99;
                      const orderB = categoryOrderMap[catB] !== undefined ? categoryOrderMap[catB] : 99;
                      return orderA - orderB;
                    });

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
                          } else if (cat === 'Laitage') {
                            colorClass = 'text-gray-800 bg-gray-100 border-gray-300';
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
                onClick={() => setShowRoundingSettingsModal(true)} 
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                title="Configurer l'arrondi des unités indivisibles (pots, pièces, œufs, etc.)"
              >
                <span>⚙️</span>
                <span>Gérer les arrondis</span>
              </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
            
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
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
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
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
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
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
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

            {/* COLONNE 4 : LAITAGE */}
            <div className="bg-white rounded-[32px] border-2 border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-white text-gray-800 p-5 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥛</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-gray-800">Laitage</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Yaourts, laits, fromages blancs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-black border border-gray-200">
                    {dairies.length}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50/60 border-b border-gray-200 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Laitage')}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Laitage"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-gray-50/90 border-b border-gray-200 text-xs font-black text-gray-700 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-100">
                {dairies.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-gray-100 text-gray-800 font-black text-xs px-2.5 py-1 rounded-xl border border-gray-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
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
                {dairies.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Laitage.
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50/40 border-t border-gray-200">
                <button
                  onClick={() => handleOpenAddDiet('Laitage')}
                  className="w-full py-2 px-3 text-xs font-black text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un laitage</span>
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
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
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

      {/* MODAL GÉRER LES ARRONDIS */}
      {showRoundingSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            <div className="p-6 sm:p-8 text-center border-b border-gray-100 shrink-0 bg-purple-50/50">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                ⚙️
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                Gérer les arrondis
              </h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">
                Régime & portions des unités indivisibles
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Option 1 : Activation de l'arrondi et sélection des unités */}
              <div className="bg-purple-50/40 p-4 sm:p-5 rounded-2xl border border-purple-100 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dietRoundDiscreteUnits ?? true}
                    onChange={(e) => {
                      if (setSettings) {
                        setSettings(prev => ({ ...prev, dietRoundDiscreteUnits: e.target.checked }));
                      }
                    }}
                    className="w-5 h-5 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-black text-gray-800 block">
                      Arrondir les unités indivisibles à l'entier
                    </span>
                    <span className="text-xs text-gray-500 font-medium block mt-0.5">
                      Cochez les unités que vous souhaitez arrondir à l'entier lorsqu'elles sont multipliées.
                    </span>
                  </div>
                </label>

                {(settings.dietRoundDiscreteUnits ?? true) && (
                  <div className="pt-2 border-t border-purple-100/80 space-y-2">
                    <p className="text-xs font-black text-purple-900 uppercase tracking-wider">
                      Unités à prendre en compte :
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      {getRoundingUnitsList(settings).map(unit => {
                        const selectedUnits = settings.dietRoundingUnits && settings.dietRoundingUnits.length > 0
                          ? settings.dietRoundingUnits
                          : DEFAULT_DIET_ROUNDING_UNITS;
                        const isChecked = selectedUnits.includes(unit);

                        return (
                          <label key={unit} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50/60 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (setSettings) {
                                  const updated = e.target.checked
                                    ? [...selectedUnits, unit]
                                    : selectedUnits.filter(u => u !== unit);
                                  setSettings(prev => ({ ...prev, dietRoundingUnits: updated }));
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0"
                            />
                            <span className="text-xs font-bold text-gray-800 truncate" title={unit}>
                              {unit}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2 : Mode d'arrondi */}
              <div className={`space-y-3 transition-opacity ${(settings.dietRoundDiscreteUnits ?? true) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                  Méthode d'arrondi :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      (settings.dietRoundingMode || 'nearest') === 'nearest'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietRoundingMode"
                      value="nearest"
                      checked={(settings.dietRoundingMode || 'nearest') === 'nearest'}
                      onChange={() => {
                        if (setSettings) {
                          setSettings(prev => ({ ...prev, dietRoundingMode: 'nearest' }));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-black block">Arrondi au plus proche</span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        Arrondi standard (ex: 1,2 → 1 pot ; 1,6 → 2 pots)
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      settings.dietRoundingMode === 'ceil'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietRoundingMode"
                      value="ceil"
                      checked={settings.dietRoundingMode === 'ceil'}
                      onChange={() => {
                        if (setSettings) {
                          setSettings(prev => ({ ...prev, dietRoundingMode: 'ceil' }));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-black block">Arrondi supérieur</span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        Toujours à l'entier supérieur (ex: 1,2 → 2 pots)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRoundingSettingsModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Fermer & Enregistrer
              </button>
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

            {sortedDietRecipes.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-500">
                  {selectedDietRecipesToDelete.size} / {sortedDietRecipes.length} sélectionnée(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDietRecipesToDelete(new Set(sortedDietRecipes.map(r => r.id)));
                    }}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
                  >
                    Cocher tous
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDietRecipesToDelete(new Set());
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Décocher tous
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-2">
              {sortedDietRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic font-medium">Aucune recette enregistrée.</div>
              ) : (
                sortedDietRecipes.map(recipe => (
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
                      <option value="Régime: Laitage">Régime: Laitage 🥛</option>
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
                        <option value="Laitage">Régime: Laitage 🥛</option>
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
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center overflow-y-auto flex-1 overscroll-contain">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm ${
                dietFormCategory === 'Protéines' ? 'bg-red-100 text-red-600 border border-red-200' :
                dietFormCategory === 'Légumes' ? 'bg-green-100 text-green-600 border border-green-200' :
                dietFormCategory === 'Féculents' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                dietFormCategory === 'Laitage' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                'bg-pink-100 text-pink-700 border border-pink-200'
              }`}>
                {dietFormCategory === 'Protéines' ? '🥩' : dietFormCategory === 'Légumes' ? '🥦' : dietFormCategory === 'Féculents' ? '🥔' : dietFormCategory === 'Laitage' ? '🥛' : '🍨'}
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
                    <option value="Laitage" className="text-gray-800 font-bold">Laitage</option>
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
                      if (dietFormWeightValue.trim()) {
                        setDietFormWeightValue(prev => {
                          const full = `${prev} ${dietFormWeightUnit}`;
                          const scaled = formatScaledWeight(full, newServings, dietModalServings);
                          const parsed = parseWeightAndUnit(scaled);
                          return parsed.value;
                        });
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

                {/* Champ Poids / Quantité et Unité */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Poids / Portion (pour {dietModalServings.toString().replace('.', ',')} pers.)
                  </label>
                  <div className="grid grid-cols-12 gap-2">
                    <input 
                      type="text"
                      value={dietFormWeightValue}
                      onChange={(e) => setDietFormWeightValue(e.target.value)}
                      placeholder="Ex: 150, 2, 1..."
                      className="col-span-7 p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveDietItem()}
                    />
                    <select
                      value={dietFormWeightUnit}
                      onChange={(e) => setDietFormWeightUnit(e.target.value)}
                      className="col-span-5 p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                    >
                      {getAvailableUnits(settings).map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2 ml-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={dietFormRoundWeight}
                        onChange={(e) => setDietFormRoundWeight(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <span className="text-xs font-bold text-gray-700">
                        Arrondir le poids
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100 shrink-0">
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
              manageCategory === 'Laitage' ? 'bg-white text-gray-900 border-b border-gray-200' : 
              'bg-pink-600'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {manageCategory === 'Protéines' ? '🥩' : 
                   manageCategory === 'Légumes' ? '🥦' : 
                   manageCategory === 'Féculents' ? '🥔' : 
                   manageCategory === 'Laitage' ? '🥛' : '🍨'}
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
                        const hasAliments = !!(dietMeal?.protein || dietMeal?.vegetable || dietMeal?.starch || dietMeal?.dairy || dietMeal?.dessert);

                        const classicId = dayPlan?.[mType]?.recipe1 || dayPlan?.[mType]?.recipe2;
                        const classicRecipe = classicId ? recipes.find(r => r.id === classicId) : null;
                        const hasClassicRecipe = !!classicId;

                        const isOccupied = hasDietRecipe || hasAliments || hasClassicRecipe;

                        let occupantLabel = 'Disponible';
                        if (isCurrentRecipe) {
                          occupantLabel = 'Déjà ici';
                        } else if (hasDietRecipe) {
                          const existingDr = dietRecipes.find(r => r.id === existingDietRecipeId);
                          occupantLabel = existingDr ? existingDr.name : 'Recette planifiée';
                        } else if (hasAliments) {
                          occupantLabel = 'Aliments choisis';
                        } else if (hasClassicRecipe) {
                          occupantLabel = classicRecipe ? `${classicRecipe.title} (Non disponible)` : 'Non disponible (Classique)';
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

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} recipes={recipes} mealPlan={mealPlan} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} dietRecipes={dietRecipes} dietItems={dietItems} />}
    </div>
  );
};

