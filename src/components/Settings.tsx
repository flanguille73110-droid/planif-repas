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

export const Settings: React.FC<{ 
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
  baseDate?: Date;
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
  reserveItems = [],
  baseDate
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
  const [editFoodSortType, setEditFoodSortType] = useState<'name' | 'category'>('name');
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
      const [showCategoryConflictModal, setShowCategoryConflictModal] = useState(false);
  const [categoryConflictData, setCategoryConflictData] = useState<{
    foodName: string;
    targetCategory: string;
    conflicts: string[];
    onConfirm?: () => void;
  } | null>(null);

  const checkCategoryConflict = (foodName: string, targetCategory: string | undefined, currentFoodId?: string) => {
    const targetLabel = targetCategory ? targetCategory : 'Sans catégorie';
    const targetFoods = (settings.foodPortions || []).filter(
      p => (currentFoodId ? p.id !== currentFoodId : true) && (targetCategory ? p.category === targetCategory : !p.category)
    );

    if (targetFoods.length === 0) {
      return { hasConflict: false, conflicts: [], targetLabel };
    }

    const targetFoodNames = targetFoods.map(p => p.name.trim()).filter(Boolean);
    const normInput = normalizeDietFoodName(foodName);

    const exactMatch = targetFoods.find(p => normalizeDietFoodName(p.name) === normInput);
    const similarMatches = findSimilarDietFoods(foodName, targetFoodNames);

    const allConflicts = new Set<string>();
    if (exactMatch) {
      allConflicts.add(exactMatch.name);
    }
    similarMatches.forEach(m => allConflicts.add(m));

    return {
      hasConflict: allConflicts.size > 0,
      conflicts: Array.from(allConflicts),
      targetLabel
    };
  };

  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const foodsInCategoryToDelete = useMemo(() => {
    if (!categoryToDelete) return [];
    return (settings.foodPortions || []).filter(p => p.category === categoryToDelete);
  }, [categoryToDelete, settings.foodPortions]);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState('');
  const [showUnitsConfigModal, setShowUnitsConfigModal] = useState(false);
  const [activeUnitTab, setActiveUnitTab] = useState<'recipes' | 'portions'>('recipes');
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<string | null>(null);
  const [editUnitInput, setEditUnitInput] = useState('');
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);

  const handleAddNewUnit = () => {
    const trimmed = newUnitInput.trim();
    if (!trimmed) return;
    const currentList = activeUnitTab === 'recipes' 
      ? getAvailableRecipeUnits(settings) 
      : getAvailablePortionUnits(settings);
    if (currentList.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      alert("Cette unité existe déjà dans cette liste !");
      return;
    }
    if (activeUnitTab === 'recipes') {
      setSettings(prev => ({
        ...prev,
        customWeightUnits: [...(prev.customWeightUnits || []), trimmed]
      }));
    } else {
      const currentList = getAvailablePortionUnits(settings);
      setSettings(prev => ({
        ...prev,
        portionUnitsList: [...currentList, trimmed],
        customPortionUnits: [...(prev.customPortionUnits || []), trimmed]
      }));
    }
    setNewUnitInput('');
    setShowAddUnitModal(false);
  };

  const handleStartEditUnit = (unit: string) => {
    setUnitToEdit(unit);
    setEditUnitInput(unit);
    setShowEditUnitModal(true);
  };

  const handleSaveEditUnit = () => {
    if (!unitToEdit) return;
    const trimmed = editUnitInput.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === unitToEdit.toLowerCase()) {
      setShowEditUnitModal(false);
      setUnitToEdit(null);
      setEditUnitInput('');
      return;
    }
    const currentList = activeUnitTab === 'recipes' 
      ? getAvailableRecipeUnits(settings) 
      : getAvailablePortionUnits(settings);
    if (currentList.some(u => u.toLowerCase() === trimmed.toLowerCase() && u.toLowerCase() !== unitToEdit.toLowerCase())) {
      alert("Cette unité existe déjà dans cette liste !");
      return;
    }
    if (activeUnitTab === 'recipes') {
      setSettings(prev => ({
        ...prev,
        customWeightUnits: (prev.customWeightUnits || []).map(u => u === unitToEdit ? trimmed : u)
      }));
    } else {
      const currentList = getAvailablePortionUnits(settings);
      const updatedList = currentList.map(u => u === unitToEdit ? trimmed : u);
      setSettings(prev => ({
        ...prev,
        portionUnitsList: updatedList,
        customPortionUnits: (prev.customPortionUnits || []).map(u => u === unitToEdit ? trimmed : u)
      }));
    }
    setShowEditUnitModal(false);
    setUnitToEdit(null);
    setEditUnitInput('');
  };

  const handleDeleteCustomUnit = (unitToRemove: string) => {
    if (activeUnitTab === 'recipes') {
      setSettings(prev => ({
        ...prev,
        customWeightUnits: (prev.customWeightUnits || []).filter(u => u !== unitToRemove)
      }));
    } else {
      const currentList = getAvailablePortionUnits(settings);
      setSettings(prev => ({
        ...prev,
        portionUnitsList: currentList.filter(u => u !== unitToRemove),
        customPortionUnits: (prev.customPortionUnits || []).filter(u => u !== unitToRemove)
      }));
    }
    setUnitToDelete(null);
  };
  const [secoursBaseDate, setSecoursBaseDate] = useState(() => {
    if (baseDate) return new Date(baseDate);
    const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    return start;
  });

  useEffect(() => {
    if (baseDate) {
      setSecoursBaseDate(new Date(baseDate));
    } else {
      setSecoursBaseDate(prev => getStartOfWeek(prev, settings.startDay ?? 1));
    }
  }, [settings.startDay, baseDate]);

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

    const doCategoryChange = () => {
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

    const conflictResult = checkCategoryConflict(food.name, catName, food.id);
    if (conflictResult.hasConflict) {
      setCategoryConflictData({
        foodName: food.name,
        targetCategory: conflictResult.targetLabel,
        conflicts: conflictResult.conflicts,
        onConfirm: doCategoryChange
      });
      setShowCategoryConflictModal(true);
      return;
    }

    doCategoryChange();
  };

  const handleAddNewFood = () => {
    if (!addFoodName.trim()) return;
    const targetCat = addFoodCategory === 'none' ? undefined : addFoodCategory;

    const doAddNewFood = () => {
      setSettings(prev => ({
        ...prev,
        foodPortions: [...(prev.foodPortions || []), {
          id: Math.random().toString(36).substr(2, 9),
          name: addFoodName.trim(),
          amount: 1,
          unit: 'g',
          category: targetCat,
          baseAmount: 1,
          baseUnit: 'portion(s)',
          purchaseAmount: 1,
          purchaseUnit: 'pièce(s)'
        }].sort((a,b) => a.name.localeCompare(b.name))
      }));
      setAddFoodName('');
      setAddFoodCategory('none');
      setShowAddFoodModal(false);
    };

    const conflictResult = checkCategoryConflict(addFoodName.trim(), targetCat);
    if (conflictResult.hasConflict) {
      setCategoryConflictData({
        foodName: addFoodName.trim(),
        targetCategory: conflictResult.targetLabel,
        conflicts: conflictResult.conflicts,
        onConfirm: doAddNewFood
      });
      setShowCategoryConflictModal(true);
      return;
    }

    doAddNewFood();
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
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const food = (settings.foodPortions || []).find(f => f.id === id);

    const doSaveName = () => {
      setSettings(prev => ({
        ...prev,
        foodPortions: (prev.foodPortions || []).map(f => f.id === id ? { ...f, name: trimmed } : f)
      }));
      setEditingFoodId(null);
    };

    if (food) {
      const conflictResult = checkCategoryConflict(trimmed, food.category, id);
      if (conflictResult.hasConflict) {
        setCategoryConflictData({
          foodName: trimmed,
          targetCategory: conflictResult.targetLabel,
          conflicts: conflictResult.conflicts,
          onConfirm: doSaveName
        });
        setShowCategoryConflictModal(true);
        return;
      }
    }

    doSaveName();
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
    const food = (settings.foodPortions || []).find(f => f.id === foodId);
    if (!food) return;

    const catName = category === 'none' ? undefined : category;

    const doAssignCategory = () => {
      setSettings(prev => ({
        ...prev,
        foodPortions: (prev.foodPortions || []).map(f => f.id === foodId ? { ...f, category: catName } : f)
      }));
    };

    const conflictResult = checkCategoryConflict(food.name, catName, food.id);
    if (conflictResult.hasConflict) {
      setCategoryConflictData({
        foodName: food.name,
        targetCategory: conflictResult.targetLabel,
        conflicts: conflictResult.conflicts,
        onConfirm: doAssignCategory
      });
      setShowCategoryConflictModal(true);
      return;
    }

    doAssignCategory();
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

    const doAddFoodToCategory = () => {
      setSettings(prev => ({
        ...prev,
        foodPortions: [...(prev.foodPortions || []), { 
          id: Math.random().toString(36).substr(2, 9), 
          name, 
          amount: 1, 
          unit: 'g',
          category,
          baseAmount: 1,
          baseUnit: 'portion(s)',
          purchaseAmount: 1,
          purchaseUnit: 'pièce(s)'
        }]
      }));
      setNewCategoryFoodNames(prev => ({ ...prev, [category]: '' }));
    };

    const conflictResult = checkCategoryConflict(name, category);
    if (conflictResult.hasConflict) {
      setCategoryConflictData({
        foodName: name,
        targetCategory: conflictResult.targetLabel,
        conflicts: conflictResult.conflicts,
        onConfirm: doAddFoodToCategory
      });
      setShowCategoryConflictModal(true);
      return;
    }

    doAddFoodToCategory();
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
                  <option value="all">Toutes les recettes</option>
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
                  <option value="all">Toutes les recettes</option>
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
                
                <div className="bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs space-y-2">
                  <span className="text-xs font-black text-gray-600 block">
                    🎨 Couleur du fond du badge "👥 Pers." (par défaut) :
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(DIET_BADGE_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, dietServingsDefaultColor: key }))}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                          (settings.dietServingsDefaultColor || 'green') === key
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-purple-500 shadow-2xs scale-105`
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.circle}`}></span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
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
                
                <div className="bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs space-y-2">
                  <span className="text-xs font-black text-gray-600 block">
                    🎨 Couleur du fond du badge "👥 Pers." (jours Déjeuner sélectionnés) :
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(DIET_BADGE_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, dietLunchCustomColor: key }))}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                          (settings.dietLunchCustomColor || 'green') === key
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-purple-500 shadow-2xs scale-105`
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.circle}`}></span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
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

                <div className="bg-white p-3.5 border border-gray-100 rounded-2xl shadow-2xs space-y-2">
                  <span className="text-xs font-black text-gray-600 block">
                    🎨 Couleur du fond du badge "👥 Pers." (jours Dîner sélectionnés) :
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(DIET_BADGE_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, dietDinnerCustomColor: key }))}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                          (settings.dietDinnerCustomColor || 'green') === key
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-purple-500 shadow-2xs scale-105`
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.circle}`}></span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
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

                {/* GESTION DES ARRONDIS DES UNITÉS INDIVISIBLES */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚙️</span>
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Gestion des arrondis (unités indivisibles) :
                    </h4>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.dietRoundDiscreteUnits ?? true}
                      onChange={(e) => setSettings(prev => ({ ...prev, dietRoundDiscreteUnits: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-black text-gray-800 block">
                        Arrondir les unités indivisibles (pots, pièces, œufs, tranches, etc.) à l'entier
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        Évite les décimales non fractionnables (ex: 1,2 pot devient 1 pot ou 2 pots selon le mode choisi).
                      </span>
                    </div>
                  </label>

                  {(settings.dietRoundDiscreteUnits ?? true) && (
                    <div className="pl-8 pt-1 space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
                          Unités à prendre en compte :
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                          {getRoundingUnitsList(settings).map(unit => {
                            const selectedUnits = settings.dietRoundingUnits && settings.dietRoundingUnits.length > 0
                              ? settings.dietRoundingUnits
                              : DEFAULT_DIET_ROUNDING_UNITS;
                            const isChecked = selectedUnits.includes(unit);

                            return (
                              <label key={unit} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...selectedUnits, unit]
                                      : selectedUnits.filter(u => u !== unit);
                                    setSettings(prev => ({ ...prev, dietRoundingUnits: updated }));
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

                      <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
                        Méthode d'arrondi :
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            (settings.dietRoundingMode || 'nearest') === 'nearest'
                              ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-200'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="settingsDietRoundingMode"
                            value="nearest"
                            checked={(settings.dietRoundingMode || 'nearest') === 'nearest'}
                            onChange={() => setSettings(prev => ({ ...prev, dietRoundingMode: 'nearest' }))}
                            className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-black block">Arrondi standard au plus proche</span>
                            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                              Ex: 1,2 → 1 pot ; 1,6 → 2 pots
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            settings.dietRoundingMode === 'ceil'
                              ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-200'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="settingsDietRoundingMode"
                            value="ceil"
                            checked={settings.dietRoundingMode === 'ceil'}
                            onChange={() => setSettings(prev => ({ ...prev, dietRoundingMode: 'ceil' }))}
                            className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-black block">Arrondi supérieur</span>
                            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                              Ex: 1,2 → 2 pots
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
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

                <button 
                  onClick={() => setShowUnitsConfigModal(true)}
                  className="w-full bg-white text-purple-600 p-4 rounded-2xl font-black border-2 border-purple-100 hover:bg-purple-50 transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>⚖️</span>
                  Unités de poids et mesures
                </button>

                {showEditFoodForm && (
                  <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Nom de l'aliment</label>
                          <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <button
                              type="button"
                              onClick={() => setEditFoodSortType('name')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                editFoodSortType === 'name'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              Tri Croissant
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditFoodSortType('category')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                editFoodSortType === 'category'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              Tri par Catégorie
                            </button>
                          </div>
                        </div>
                        <select 
                          className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none mt-1"
                          value={selectedFoodId}
                          onChange={e => setSelectedFoodId(e.target.value)}
                        >
                          <option value="">Sélectionner un aliment...</option>
                          {(() => {
                            const getCatName = (item: any) => {
                              if (!item.category) return 'Sans catégorie';
                              if (!currentCategories.includes(item.category)) return 'Sans catégorie';
                              return item.category;
                            };
                            const items = [...(settings.foodPortions || [])];
                            if (editFoodSortType === 'category') {
                              items.sort((a, b) => {
                                const catA = getCatName(a);
                                const catB = getCatName(b);
                                if (catA !== catB) {
                                  return catA.localeCompare(catB);
                                }
                                return a.name.localeCompare(b.name);
                              });
                            } else {
                              items.sort((a, b) => a.name.localeCompare(b.name));
                            }
                            return items.map(f => {
                              const displayedCatName = getCatName(f);
                              return (
                                <option key={f.id} value={f.id}>
                                  {f.name} [{displayedCatName}]
                                </option>
                              );
                            });
                          })()}
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
                            category: newFoodCategory === 'none' ? undefined : newFoodCategory,
                            baseAmount: 1,
                            baseUnit: 'portion(s)',
                            purchaseAmount: 1,
                            purchaseUnit: 'pièce(s)'
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
                        .filter(p => !p.category || !currentCategories.includes(p.category))
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
                              value={p.category && currentCategories.includes(p.category) ? p.category : 'none'}
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
                          <button onClick={() => { setCategoryToDelete(cat); setShowDeleteCategoryModal(true); }} className="text-gray-300 hover:text-red-500 transition-colors" title="Supprimer la catégorie">
                            <EXT_ICONS.Trash />
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
                                    <button onClick={() => startEditFood(p)} className="text-gray-300 hover:text-purple-600 transition-colors p-2" title="Modifier le nom"><EXT_ICONS.Edit /></button>
                                    <button onClick={() => setSettings({ ...settings, foodPortions: (settings.foodPortions || []).filter(x => x.id !== p.id) })} className="text-red-400 font-bold text-xl hover:scale-110 transition-transform p-2" title="Supprimer">×</button>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie :</span>
                              <select 
                                className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-purple-200"
                                value={p.category && currentCategories.includes(p.category) ? p.category : 'none'}
                                onChange={(e) => assignCategory(p.id, e.target.value)}
                              >
                                <option value="none">Sans catégorie</option>
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
                  onClick={() => {
                    if (baseDate) {
                      setSecoursBaseDate(new Date(baseDate));
                    } else {
                      const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
                      if (settings.defaultWeek === 'next') {
                        start.setDate(start.getDate() + 7);
                      }
                      setSecoursBaseDate(start);
                    }
                    setShowSecoursForm(true);
                  }} 
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

      {/* MODAL CONFLIT CATEGORIE / ALIMENT SIMILAIRE */}
      {showCategoryConflictModal && categoryConflictData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-black">
                ⚠️
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                Aliment similaire détecté
              </h3>
              <p className="text-gray-600 font-bold text-sm leading-relaxed">
                L'aliment <span className="text-purple-700 font-black">"{categoryConflictData.foodName}"</span> ressemble à un produit déjà présent dans la catégorie <span className="text-purple-700 font-black">"{categoryConflictData.targetCategory}"</span>.
              </p>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left text-xs font-bold text-amber-800 space-y-2">
                <span className="font-black block uppercase text-[10px] text-amber-600 tracking-wider">Aliment(s) similaire(s) déjà présent(s) :</span>
                {categoryConflictData.conflicts.map((conf, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-amber-900 font-black text-sm">
                    <span className="text-amber-500">•</span>
                    <span>{conf}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                S'il s'agit d'un produit différent, vous pouvez tout de même valider le changement.
              </p>
            </div>

            <div className="p-6 bg-gray-50 flex gap-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowCategoryConflictModal(false);
                  setCategoryConflictData(null);
                }}
                className="flex-1 p-5 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (categoryConflictData.onConfirm) {
                    categoryConflictData.onConfirm();
                  }
                  setShowCategoryConflictModal(false);
                  setCategoryConflictData(null);
                }}
                className="flex-1 bg-purple-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95 cursor-pointer"
              >
                Valider le changement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION CATÉGORIE */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-8 text-center space-y-4">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-3xl ${foodsInCategoryToDelete.length > 0 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                {foodsInCategoryToDelete.length > 0 ? "⚠️" : "🗑️"}
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {foodsInCategoryToDelete.length > 0 ? "Suppression interdite" : "Supprimer la catégorie ?"}
              </h3>
              {foodsInCategoryToDelete.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-600 font-bold text-sm leading-relaxed">
                    Impossible de supprimer la catégorie <span className="text-purple-700 font-black">"{categoryToDelete}"</span> car elle contient encore <span className="text-red-600 font-black">{foodsInCategoryToDelete.length} aliment(s)</span>.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left text-xs font-bold text-amber-800 max-h-40 overflow-y-auto space-y-1.5">
                    <span className="font-black block uppercase text-[10px] text-amber-600 tracking-wider">Aliments présents dans cette catégorie :</span>
                    {foodsInCategoryToDelete.map(f => (
                      <div key={f.id} className="flex items-center gap-2 text-amber-900">
                        <span className="text-amber-500">•</span>
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-400 leading-relaxed">
                    Pour pouvoir supprimer cette catégorie, vous devez d'abord réattribuer ou supprimer les aliments qui y sont rattachés.
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement la catégorie <span className="text-purple-700 font-black">"{categoryToDelete}"</span> ? Cette action est irréversible.
                </p>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex gap-4 border-t border-gray-100">
              {foodsInCategoryToDelete.length > 0 ? (
                <button
                  onClick={() => { setShowDeleteCategoryModal(false); setCategoryToDelete(null); }}
                  className="w-full bg-purple-600 text-white p-5 rounded-2xl font-black shadow-md hover:bg-purple-700 transition-all active:scale-95"
                >
                  Compris
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setShowDeleteCategoryModal(false); setCategoryToDelete(null); }}
                    className="flex-1 p-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        foodCategories: (prev.foodCategories || FOOD_CATEGORIES).filter(c => c !== categoryToDelete)
                      }));
                      setShowDeleteCategoryModal(false);
                      setCategoryToDelete(null);
                    }}
                    className="flex-1 bg-red-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                  >
                    Supprimer
                  </button>
                </>
              )}
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

      {/* MODAL CONFIGURER LES UNITÉS DE POIDS ET MESURES */}
      {showUnitsConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-fadeIn">
          <div className={`bg-white rounded-[40px] w-full ${activeUnitTab === 'portions' ? 'max-w-2xl' : 'max-w-xl'} overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col transition-all duration-200`}>
            <div className="p-8 pb-4 text-center border-b border-gray-100 shrink-0">
              <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">⚖️</div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Unités de poids et mesures</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Gérez les unités de mesure pour vos recettes et pour le paramétrage des portions.
              </p>
            </div>

            {/* Onglets sélecteurs de liste d'unités */}
            <div className="px-6 pt-4 pb-2 shrink-0">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveUnitTab('recipes')}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeUnitTab === 'recipes'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>🍳</span>
                  <span>Recettes & Ingrédients</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeUnitTab === 'recipes' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getAvailableRecipeUnits(settings).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUnitTab('portions')}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeUnitTab === 'portions'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>🛒</span>
                  <span>Portions & Équivalences</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeUnitTab === 'portions' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getAvailablePortionUnits(settings).length}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-xs text-purple-800 font-medium">
                {activeUnitTab === 'recipes' ? (
                  <span>
                    🍳 <strong>Unités Recettes & Aliments :</strong> Utilisées pour tous les ajouts et modifications d'ingrédients dans les recettes, aliments, menus et réserve.
                  </span>
                ) : (
                  <span>
                    🛒 <strong>Unités Portions (Courses) :</strong> Utilisées spécifiquement dans le modal <em>« Paramétrer les portions »</em> des courses (unités de base et unités d'achat).
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
                  Unités configurées ({activeUnitTab === 'recipes' ? getAvailableRecipeUnits(settings).length : getAvailablePortionUnits(settings).length})
                </span>
                <button 
                  onClick={() => {
                    setNewUnitInput('');
                    setShowAddUnitModal(true);
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>➕</span>
                  <span>Ajouter une unité</span>
                </button>
              </div>

              <div className={activeUnitTab === 'portions' ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-2 sm:grid-cols-3 gap-2.5"}>
                {(activeUnitTab === 'recipes' ? getAvailableRecipeUnits(settings) : getAvailablePortionUnits(settings)).map((unit) => {
                  const customList = activeUnitTab === 'recipes' ? (settings.customWeightUnits || []) : (settings.customPortionUnits || []);
                  const isCustom = customList.includes(unit);
                  return (
                    <div 
                      key={unit} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${isCustom ? 'bg-purple-50/80 border-purple-200 text-purple-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700 font-semibold'} text-xs`}
                    >
                      <span className={activeUnitTab === 'portions' ? "font-bold pr-1 flex-1 break-words leading-snug" : "truncate pr-1 font-bold flex-1"}>{unit}</span>
                      {isCustom ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleStartEditUnit(unit)}
                            className="text-gray-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                            title="Modifier cette unité"
                          >
                            <EXT_ICONS.Edit />
                          </button>
                          <button 
                            onClick={() => setUnitToDelete(unit)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="Supprimer cette unité personnalisée"
                          >
                            🗑️
                          </button>
                        </div>
                      ) : activeUnitTab === 'portions' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider shrink-0 bg-gray-200/60 px-1.5 py-0.5 rounded">Standard</span>
                          <button 
                            onClick={() => handleStartEditUnit(unit)}
                            className="text-gray-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                            title="Modifier cette unité standard"
                          >
                            <EXT_ICONS.Edit />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider shrink-0 bg-gray-200/60 px-1.5 py-0.5 rounded">Standard</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end border-t border-gray-100 shrink-0">
              <button 
                onClick={() => setShowUnitsConfigModal(false)}
                className="px-8 py-3.5 bg-gray-200 hover:bg-gray-300 rounded-2xl font-black text-xs text-gray-700 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER UNE UNITÉ */}
      {showEditUnitModal && unitToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[165] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">✏️</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Modifier l'unité</h3>
              <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                Modifiez le nom de l'unité <strong className="text-purple-700 font-bold">"{unitToEdit}"</strong> ({activeUnitTab === 'recipes' ? 'Recettes & Aliments' : 'Portions & Équivalences'}).
              </p>
              
              <div className="space-y-3 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">Nouveau nom de l'unité</label>
                <input 
                  type="text"
                  value={editUnitInput}
                  onChange={(e) => setEditUnitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEditUnit()}
                  placeholder={activeUnitTab === 'recipes' ? "Ex: tasse, pincée, sachet, feuille..." : "Ex: plaquette(s) de 24, carton, cageot..."}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button 
                onClick={() => {
                  setShowEditUnitModal(false);
                  setUnitToEdit(null);
                  setEditUnitInput('');
                }}
                className="flex-1 p-4 font-black text-xs uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveEditUnit}
                disabled={!editUnitInput.trim()}
                className="flex-1 bg-purple-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER UNE UNITÉ */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[160] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">⚖️</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                {activeUnitTab === 'recipes' ? "Ajouter une unité (Recettes)" : "Ajouter une unité (Portions / Courses)"}
              </h3>
              <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                {activeUnitTab === 'recipes' 
                  ? "Renseignez la nouvelle unité utilisable dans les recettes, aliments et menus."
                  : "Renseignez la nouvelle unité utilisable pour paramétrer les portions et achats de courses."}
              </p>
              
              <div className="space-y-3 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">Nom de l'unité</label>
                <input 
                  type="text"
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewUnit()}
                  placeholder={activeUnitTab === 'recipes' ? "Ex: tasse, pincée, sachet, feuille..." : "Ex: plaquette(s) de 24, carton, cageot..."}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button 
                onClick={() => {
                  setShowAddUnitModal(false);
                  setNewUnitInput('');
                }}
                className="flex-1 p-4 font-black text-xs uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddNewUnit}
                className="flex-1 bg-purple-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION UNITÉ */}
      {unitToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-xl">⚠️</div>
            <h3 className="text-lg font-black text-gray-900">Supprimer cette unité ?</h3>
            <p className="text-xs text-gray-500 font-medium">
              Voulez-vous vraiment retirer l'unité <strong className="text-gray-800">"{unitToDelete}"</strong> de la liste {activeUnitTab === 'recipes' ? 'Recettes' : 'Portions'} ?
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setUnitToDelete(null)}
                className="flex-1 p-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDeleteCustomUnit(unitToDelete)}
                className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all shadow-md cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

