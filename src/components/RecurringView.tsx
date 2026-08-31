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

export const RecurringView: React.FC<{ 
  groups: PantryGroup[]; 
  setGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
  foodPortions: FoodPortion[];
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  onSendToShopping: (items: ShoppingListItem[]) => void;
  settings?: UserSettings;
}> = ({ groups, setGroups, foodPortions, foodCategories, onAddFoodToSettings, onSendToShopping, settings }) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [tempItems, setTempItems] = useState<ShoppingListItem[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Sans catégorie');
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

    onAddFoodToSettings(name, unit, existing.category || 'Sans catégorie');
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
      if (existing) categoryToAdd = existing.category || 'Sans catégorie';
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
                     {getAvailableUnits(settings).map(unit => (
                       <option key={unit} value={unit}>{unit}</option>
                     ))}
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
                           className="w-20 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
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

