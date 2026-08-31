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

export const RecipeDetail: React.FC<{ 
  recipe: Recipe; 
  recipes: Recipe[];
  mealPlan: Record<string, MealPlanDay>;
  onClose: () => void; 
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit?: (recipe: Recipe) => void;
  dietRecipes?: DietRecipe[];
  dietItems?: DietItem[];
}> = ({ recipe, recipes, mealPlan, onClose, onAddToShopping, updateMealPlan, setSentMeals, onEdit, dietRecipes = [], dietItems = [] }) => {
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
    if (mealType === 'extra') {
      const existingId = mealPlan[planDate]?.[slotType as 'viennoiseries' | 'sauces']?.[extraIndex];
      if (existingId && existingId !== recipe.id) {
        const existing = recipes.find(r => r.id === existingId);
        setConflict({ existingRecipeTitle: existing?.title || 'Inconnue' });
        return true;
      }
      return false;
    }
    const occupant = getSlotOccupantInfo(mealPlan[planDate], mealType, recipes, dietRecipes, dietItems, recipe.id, false);
    if (occupant) {
      setConflict({ existingRecipeTitle: `${occupant.title} (${occupant.type})` });
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
                      {(['lunch', 'dinner'] as const).map(type => {
                        const occupant = getSlotOccupantInfo(mealPlan[dateStr], type, recipes, dietRecipes, dietItems, recipe.id, false);
                        const isCurrentRecipe = mealPlan[dateStr]?.[type]?.recipe1 === recipe.id || mealPlan[dateStr]?.[type]?.recipe2 === recipe.id;
                        const isOccupied = !isCurrentRecipe && !!occupant;

                        return (
                          <button
                            key={type}
                            disabled={isOccupied && !isCurrentRecipe}
                            onClick={() => {
                              if (isCurrentRecipe) return;
                              updateMealPlan(dateStr, type, 'recipe1', recipe.id);
                              setShowAvailability(false);
                            }}
                            className={`w-full p-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1
                              ${isCurrentRecipe ? 'bg-green-100 border-green-200 text-green-700 cursor-default' : 
                                isOccupied ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' : 
                                type === 'lunch' ? 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50 hover:scale-[1.02] shadow-sm cursor-pointer' :
                                'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-[1.02] shadow-sm cursor-pointer'}
                            `}
                          >
                            <span>{type === 'lunch' ? '☀️ Midi' : '🌙 Soir'}</span>
                            <span className="truncate max-w-[120px] text-[8px]">
                              {isCurrentRecipe ? 'Déjà ici' : isOccupied ? `${occupant?.title} (Non disponible)` : 'Disponible'}
                            </span>
                          </button>
                        );
                      })}
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

