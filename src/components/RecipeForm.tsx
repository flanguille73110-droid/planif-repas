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

export const RecipeForm: React.FC<{ 
  onSave: (r: Recipe) => void; 
  onDelete?: (id: string) => void;
  onCancel: () => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  initialData?: Recipe;
  foodCategories: string[];
  settings?: UserSettings;
}> = ({ onSave, onDelete, onCancel, foodPortions, onAddFoodToSettings, initialData, foodCategories, settings }) => {
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
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Sans catégorie');
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
      const cat = matched?.category || 'Sans catégorie';
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
                className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-[10px] outline-none cursor-pointer" 
                value={pendingIng.unit} 
                onChange={e => setPendingIng({ ...pendingIng, unit: e.target.value })}
              >
                {getAvailableUnits(settings).map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
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

