import { RecipeForm } from './RecipeForm';
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
export const normalizeSearchText = (text: string) => {
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

export const isWordMatch = (targetWord: string, queryWord: string): boolean => {
  if (!targetWord || !queryWord) return false;
  return targetWord === queryWord;
};

export const doesTargetMatchQuery = (targetText: string, query: string) => {
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

export const countRecipeMatches = (r: Recipe, searchTerms: string[], appliance: string, searchMode: 'ingredients' | 'recipes' = 'ingredients'): number => {
  if (appliance === 'Thermomix TM7' && !r.tags?.includes('TM7')) return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    if (searchMode === 'ingredients') {
      const matchesIng = (r.ingredients || []).some(ri => {
        const ingName = ri.name || '';
        return doesTargetMatchQuery(ingName, term);
      });
      if (matchesIng) {
        score++;
      }
    } else {
      const matchesTitle = doesTargetMatchQuery(r.title || '', term) || normalizeSearchText(r.title || '').includes(normalizeSearchText(term));
      if (matchesTitle) {
        score++;
      }
    }
  }
  return score;
};

export const countDietRecipeMatches = (dr: DietRecipe, searchTerms: string[], appliance: string, searchMode: 'ingredients' | 'recipes' = 'ingredients'): number => {
  if (appliance === 'Thermomix TM7') return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    if (searchMode === 'ingredients') {
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
    } else {
      const matchesName = doesTargetMatchQuery(dr.name || '', term) || normalizeSearchText(dr.name || '').includes(normalizeSearchText(term));
      if (matchesName) {
        score++;
      }
    }
  }
  return score;
};

export const doesRecipeMatchTerms = (r: Recipe, searchTerms: string[], appliance: string) => {
  return countRecipeMatches(r, searchTerms, appliance) > 0;
};

export const doesDietRecipeMatchTerms = (dr: DietRecipe, searchTerms: string[], appliance: string) => {
  return countDietRecipeMatches(dr, searchTerms, appliance) > 0;
};

export const RecipeSearch: React.FC<{ 
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
  const [searchMode, setSearchMode] = useState<'ingredients' | 'recipes'>('ingredients');
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

  const DIET_UNITS_LIST = getAvailableUnits(settings);

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
      .map(r => ({ recipe: r, score: countRecipeMatches(r, activeSearchTerms, appliance, searchMode) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.title || '').localeCompare(b.recipe.title || ''))
      .map(item => item.recipe);
  }, [recipes, activeSearchTerms, appliance, searchMode]);

  const dietResults = useMemo(() => {
    if (activeSearchTerms.length === 0) return [];
    return (dietRecipes || [])
      .map(dr => ({ recipe: dr, score: countDietRecipeMatches(dr, activeSearchTerms, appliance, searchMode) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.name || '').localeCompare(b.recipe.name || ''))
      .map(item => item.recipe);
  }, [dietRecipes, activeSearchTerms, appliance, searchMode]);

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
    if (searchMode === 'recipes') {
      const list: string[] = [];
      recipes.forEach(r => { if (r.title) list.push(r.title); });
      (dietRecipes || []).forEach(dr => { if (dr.name) list.push(dr.name); });
      return Array.from(new Set(list)).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }
    const list: string[] = [];
    (foodPortions || []).forEach(fp => { if (fp.name) list.push(fp.name); });
    (dietItems || []).forEach(di => { if (di.name) list.push(di.name); });
    return Array.from(new Set(list)).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [searchMode, recipes, dietRecipes, foodPortions, dietItems]);

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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <h2 className="text-3xl font-black text-center text-gray-800 tracking-tight">Recherche par :</h2>
        <div className="bg-purple-100/80 p-1 rounded-2xl flex items-center gap-1 border border-purple-200 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setSearchMode('ingredients')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              searchMode === 'ingredients'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-800 hover:bg-purple-200/60'
            }`}
          >
            🥕 Ingrédients
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('recipes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              searchMode === 'recipes'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-800 hover:bg-purple-200/60'
            }`}
          >
            📖 Recettes
          </button>
        </div>
      </div>
      
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
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">
            {searchMode === 'ingredients' ? 'Ingrédients à disposition' : 'Mots-clés / Noms recherchés'}
          </p>
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
                placeholder={searchMode === 'ingredients' ? "Ajouter un ingrédient..." : "Ajouter un nom de recette (ex: salade, omelette)..."} 
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
                title={`Afficher la liste des ${searchMode === 'ingredients' ? 'aliments' : 'recettes'} (15 visibles)`}
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

            {/* LISTE DÉROULANTE INTERACTIVE - 15 VISIBLES */}
            {showSearchSuggestions && matchingFoodSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-purple-200 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
                <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                  <span className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{searchMode === 'ingredients' ? '🥗' : '📖'}</span> Liste des {searchMode === 'ingredients' ? 'aliments' : 'recettes'} ({matchingFoodSuggestions.length} disponible{matchingFoodSuggestions.length > 1 ? 's' : ''} — 15 visibles) :
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
                        {countRecipeMatches(r, activeSearchTerms, appliance, searchMode)}/{activeSearchTerms.length} {searchMode === 'ingredients' ? 'ingr.' : 'mot(s)'}
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
                const categoryOrderMap: Record<string, number> = {
                  'Protéines': 0,
                  'Légumes': 1,
                  'Féculents': 2,
                  'Laitage': 3,
                  'Desserts': 4
                };
                itemsToDisplay.sort((a, b) => {
                  const catA = resolveDietFoodCategory(a.name, a.category, dietItems, foodPortions);
                  const catB = resolveDietFoodCategory(b.name, b.category, dietItems, foodPortions);
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
                      
                      const cat = resolveDietFoodCategory(item.name, item.category, dietItems, foodPortions);

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
          dietRecipes={dietRecipes}
          dietItems={dietItems}
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
                      <option value="Laitage">Régime: Laitage 🥛</option>
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
                      {(() => {
                        const classicLunchId = dayPlan?.lunch?.recipe1 || dayPlan?.lunch?.recipe2;
                        const classicLunch = classicLunchId ? recipes.find(r => r.id === classicLunchId) : null;
                        const hasDietLunch = !!(dayPlan?.dietLunch?.dietRecipe || dayPlan?.dietLunch?.protein || dayPlan?.dietLunch?.vegetable || dayPlan?.dietLunch?.starch || dayPlan?.dietLunch?.dairy || dayPlan?.dietLunch?.dessert);
                        const isLunchOccupied = hasDietLunch || !!classicLunchId;

                        return (
                          <button
                            onClick={() => {
                              if (isLunchOccupied) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType('lunch');
                              setShowDietAvailability(false);
                            }}
                            disabled={isLunchOccupied}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                              isLunchOccupied
                                ? 'bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-green-200 hover:bg-green-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-gray-700 uppercase">Déjeuner</span>
                              {classicLunchId ? (
                                <span className="text-[8px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded">Non disponible</span>
                              ) : hasDietLunch ? (
                                <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                              ) : (
                                <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                              {classicLunchId
                                ? `${classicLunch?.title || 'Recette classique'} (Non disponible)`
                                : dayPlan?.dietLunch?.dietRecipe
                                ? (dietRecipes.find(r => r.id === dayPlan?.dietLunch?.dietRecipe)?.name || 'Recette régime')
                                : [
                                    dayPlan?.dietLunch?.protein && (dietItems.find(x => x.id === dayPlan?.dietLunch?.protein)?.name || dayPlan?.dietLunch?.protein),
                                    dayPlan?.dietLunch?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietLunch?.vegetable)?.name || dayPlan?.dietLunch?.vegetable),
                                    dayPlan?.dietLunch?.starch && (dietItems.find(x => x.id === dayPlan?.dietLunch?.starch)?.name || dayPlan?.dietLunch?.starch),
                                    dayPlan?.dietLunch?.dairy && (dietItems.find(x => x.id === dayPlan?.dietLunch?.dairy)?.name || dayPlan?.dietLunch?.dairy),
                                    dayPlan?.dietLunch?.dessert && (dietItems.find(x => x.id === dayPlan?.dietLunch?.dessert)?.name || dayPlan?.dietLunch?.dessert)
                                  ].filter(Boolean).join(' • ') || 'Créneau vide'
                              }
                            </p>
                          </button>
                        );
                      })()}

                      {/* Créneau Dîner */}
                      {(() => {
                        const classicDinnerId = dayPlan?.dinner?.recipe1 || dayPlan?.dinner?.recipe2;
                        const classicDinner = classicDinnerId ? recipes.find(r => r.id === classicDinnerId) : null;
                        const hasDietDinner = !!(dayPlan?.dietDinner?.dietRecipe || dayPlan?.dietDinner?.protein || dayPlan?.dietDinner?.vegetable || dayPlan?.dietDinner?.starch || dayPlan?.dietDinner?.dairy || dayPlan?.dietDinner?.dessert);
                        const isDinnerOccupied = hasDietDinner || !!classicDinnerId;

                        return (
                          <button
                            onClick={() => {
                              if (isDinnerOccupied) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType('dinner');
                              setShowDietAvailability(false);
                            }}
                            disabled={isDinnerOccupied}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                              isDinnerOccupied
                                ? 'bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-green-200 hover:bg-green-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-gray-700 uppercase">Dîner</span>
                              {classicDinnerId ? (
                                <span className="text-[8px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded">Non disponible</span>
                              ) : hasDietDinner ? (
                                <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                              ) : (
                                <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                              {classicDinnerId
                                ? `${classicDinner?.title || 'Recette classique'} (Non disponible)`
                                : dayPlan?.dietDinner?.dietRecipe
                                ? (dietRecipes.find(r => r.id === dayPlan?.dietDinner?.dietRecipe)?.name || 'Recette régime')
                                : [
                                    dayPlan?.dietDinner?.protein && (dietItems.find(x => x.id === dayPlan?.dietDinner?.protein)?.name || dayPlan?.dietDinner?.protein),
                                    dayPlan?.dietDinner?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietDinner?.vegetable)?.name || dayPlan?.dietDinner?.vegetable),
                                    dayPlan?.dietDinner?.starch && (dietItems.find(x => x.id === dayPlan?.dietDinner?.starch)?.name || dayPlan?.dietDinner?.starch),
                                    dayPlan?.dietDinner?.dairy && (dietItems.find(x => x.id === dayPlan?.dietDinner?.dairy)?.name || dayPlan?.dietDinner?.dairy),
                                    dayPlan?.dietDinner?.dessert && (dietItems.find(x => x.id === dayPlan?.dietDinner?.dessert)?.name || dayPlan?.dietDinner?.dessert)
                                  ].filter(Boolean).join(' • ') || 'Créneau vide'
                              }
                            </p>
                          </button>
                        );
                      })()}
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

