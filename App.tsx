import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion } from './types';
import { ICONS, CATEGORIES, DIETARY_OPTIONS } from './constants';

// Extend ICONS
const EXT_ICONS = {
  ...ICONS,
  Recurring: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
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
  )
};

interface PantryGroup {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

// --- Helper Functions ---
const formatTotalTime = (minutes: number) => {
  if (minutes > 59) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')} h ${mins.toString().padStart(2, '0')} min`;
  }
  return `${minutes} min`;
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('recipes');
  
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('culina_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [mealPlan, setMealPlan] = useState<Record<string, { lunch?: string; dinner?: string }>>(() => {
    const saved = localStorage.getItem('culina_plan_v2');
    return saved ? JSON.parse(saved) : {};
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
      dietaryRestrictions: [],
      foodPortions: [
        { id: '1', name: 'Pâtes', amount: 1, unit: 'g' },
        { id: '2', name: 'Riz', amount: 1, unit: 'g' }
      ],
      servingsDefault: 1,
      language: 'fr'
    };
    
    if (!saved) return defaultSettings;
    
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        foodPortions: parsed.foodPortions || defaultSettings.foodPortions
      };
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('culina_recipes', JSON.stringify(recipes));
    localStorage.setItem('culina_plan_v2', JSON.stringify(mealPlan));
    localStorage.setItem('culina_settings', JSON.stringify(settings));
    localStorage.setItem('culina_shopping', JSON.stringify(shoppingList));
    localStorage.setItem('culina_pantry_v3', JSON.stringify(pantryGroups));
    localStorage.setItem('culina_reserve', JSON.stringify(reserveItems));
    localStorage.setItem('culina_sent_meals', JSON.stringify(Array.from(sentMeals)));
  }, [recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems, sentMeals]);

  // Helper function to sync food names to settings
  const syncFoodsToSettings = useCallback((items: { name: string; unit?: string }[]) => {
    setSettings(prev => {
      const currentPortions = prev.foodPortions || [];
      const newPortions = [...currentPortions];
      let changed = false;

      items.forEach(item => {
        if (!item.name || !item.name.trim()) return;
        const exists = newPortions.some(p => p.name.toLowerCase() === item.name.toLowerCase().trim());
        if (!exists) {
          newPortions.push({
            id: Math.random().toString(36).substr(2, 9),
            name: item.name.trim(),
            amount: 1,
            unit: item.unit || 'unité'
          });
          changed = true;
        }
      });

      return changed ? { ...prev, foodPortions: newPortions } : prev;
    });
  }, []);

  const addRecipe = (r: Recipe) => setRecipes(prev => {
    const index = prev.findIndex(item => item.id === r.id);
    if (index > -1) {
      const updated = [...prev];
      updated[index] = r;
      return updated;
    }
    return [...prev, r];
  });
  
  const updateMealPlan = (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => {
    setMealPlan(prev => ({
      ...prev,
      [date]: { ...prev[date], [type]: recipeId }
    }));
    const mealKey = `${date}-${type}`;
    if (sentMeals.has(mealKey)) {
      const next = new Set(sentMeals);
      next.delete(mealKey);
      setSentMeals(next);
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

  const handleQuickAddFoodToSettings = (name: string, unit: string = 'g') => {
    syncFoodsToSettings([{ name, unit }]);
  };

  const exportToJSON = () => {
    const data = { recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestion_courses_backup.json`;
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
        
        // Sync imported items to settings
        const itemsToSync: { name: string; unit?: string }[] = [];
        if (data.pantryGroups) data.pantryGroups.forEach((g: PantryGroup) => g.items.forEach(i => itemsToSync.push(i)));
        if (data.reserveItems) data.reserveItems.forEach((i: ShoppingListItem) => itemsToSync.push(i));
        if (data.recipes) data.recipes.forEach((r: Recipe) => r.ingredients.forEach(i => itemsToSync.push(i)));
        syncFoodsToSettings(itemsToSync);

        alert("Données importées avec succès !");
      } catch (err) { alert("Erreur lors de l'importation."); }
    };
    reader.readAsText(file);
  };

  const exportToExcel = () => {
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

    XLSX.writeFile(workbook, "gestion_courses_stocks.xlsx");
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
        const itemsToSync: { name: string; unit?: string }[] = [];
        
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
              
              itemsToSync.push({ name: itemName, unit: unit });

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
              
              itemsToSync.push({ name: itemName, unit: unit });

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

        // Final sync of all imported names to settings
        syncFoodsToSettings(itemsToSync);
        alert("Données Excel importées !");
      } catch (err) {
        alert("Erreur lors de l'importation.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-20 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'recipes' && (
          <RecipeBook 
            recipes={recipes} 
            addRecipe={addRecipe} 
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
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            updateMealPlan={updateMealPlan}
            setSentMeals={setSentMeals}
          />
        )}
        {activeTab === 'search' && (
          <RecipeSearch 
            recipes={recipes} 
            addRecipe={addRecipe} 
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
            foodPortions={settings.foodPortions}
            setSentMeals={setSentMeals}
          />
        )}
        {activeTab === 'planning' && (
          <Planning 
            mealPlan={mealPlan} 
            recipes={recipes} 
            updateMealPlan={updateMealPlan} 
            onMergeToShopping={mergeToShoppingList}
            sentMeals={sentMeals}
            setSentMeals={setSentMeals}
          />
        )}
        {activeTab === 'recurring' && (
          <RecurringView 
            groups={pantryGroups} 
            setGroups={setPantryGroups} 
            foodPortions={settings.foodPortions} 
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            onSendToShopping={(items) => {
              const itemsToTransfer = items.filter(i => !i.checked);
              if (itemsToTransfer.length > 0) {
                mergeToShoppingList(itemsToTransfer.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) })));
                setActiveTab('shopping');
              }
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
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            reserveItems={reserveItems}
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
          />
        )}
      </main>
    </div>
  );
}

// --- Components ---

function Navbar({ activeTab, setActiveTab }: { activeTab: AppTab; setActiveTab: (t: AppTab) => void }) {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipes', label: 'Recettes', icon: <EXT_ICONS.Book /> },
    { id: 'search', label: 'Recherche', icon: <EXT_ICONS.Search /> },
    { id: 'planning', label: 'Planning', icon: <EXT_ICONS.Calendar /> },
    { id: 'recurring', label: "Récurrents", icon: <EXT_ICONS.Recurring /> },
    { id: 'reserve', label: "En réserve", icon: <EXT_ICONS.Box /> },
    { id: 'shopping', label: 'Courses', icon: <EXT_ICONS.Cart /> },
    { id: 'settings', label: 'Réglages', icon: <EXT_ICONS.Settings /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:sticky md:top-0 md:h-screen md:flex-col md:w-64 md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto no-scrollbar">
      <div className="hidden md:block mb-8 text-2xl font-black text-purple-600 px-4">Gestion Courses</div>
      <div className="flex md:flex-col w-full justify-around md:gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 ${activeTab === tab.id ? 'text-purple-600 bg-purple-50 md:bg-purple-600 md:text-white shadow-sm' : 'text-gray-400 hover:bg-purple-50/50'}`}>
            {tab.icon} <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function InStockView({ items, setItems, foodPortions, onAddFoodToSettings }: {
  items: ShoppingListItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
}) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const addItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit);
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
              onFocus={(e) => e.target.select()}
              onChange={e => setNewItemAmount(Number(e.target.value))} 
            />
          </div>
          <div className="sm:col-span-2">
            <select 
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-500 outline-none cursor-pointer" 
              value={newItemUnit} 
              onChange={e => setNewItemUnit(e.target.value)}
            >
              <option value="unité">u.</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="pièce">pc.</option>
              <option value="paquet">paq.</option>
              <option value="tranche">tr.</option>
              <option value="C.à S">C.à S</option>
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
}

function RecipeBook({ recipes, addRecipe, onAddToShopping, foodPortions, onAddFoodToSettings, updateMealPlan, setSentMeals }: { 
  recipes: Recipe[]; 
  addRecipe: (r: Recipe) => void; 
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  const filtered = (recipes || []).filter(r => 
    (selectedCat === 'Tous' || r.category === selectedCat) && 
    (r.title || "").toLowerCase().includes(filter.toLowerCase())
  );

  const handleEdit = (e: React.MouseEvent, r: Recipe) => {
    e.stopPropagation();
    setEditingRecipe(r);
    setIsAdding(true);
  };

  if (isAdding) return (
    <RecipeForm 
      onSave={(r) => { addRecipe(r); setIsAdding(false); setEditingRecipe(null); }} 
      onCancel={() => { setIsAdding(false); setEditingRecipe(null); }} 
      foodPortions={foodPortions} 
      onAddFoodToSettings={onAddFoodToSettings}
      initialData={editingRecipe || undefined}
    />
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Recettes</h2>
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
              <div className="aspect-video bg-purple-50 relative">
                {r.imageUrl ? (
                  <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                </div>
                <button onClick={(e) => handleEdit(e, r)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-purple-600 opacity-0 group-hover:opacity-100 transition-all shadow-md">
                  <EXT_ICONS.Edit />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span>
                  <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">⏲️ {formatTotalTime(r.prepTime + r.cookTime)}</span>
                </div>
                <h3 className="text-xl font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
}

function RecipeDetail({ recipe, onClose, onAddToShopping, updateMealPlan, setSentMeals }: { 
  recipe: Recipe; 
  onClose: () => void; 
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [servings, setServings] = useState(recipe.servings || 4);
  const [planDate, setPlanDate] = useState('');
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const ratio = servings / (recipe.servings || 4);

  const handlePlan = () => {
    if (!planDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    updateMealPlan(planDate, mealType, recipe.id);
    alert(`Recette programmée pour le ${planDate} (${mealType === 'lunch' ? 'Midi' : 'Soir'})`);
  };

  const handlePlanAndSend = () => {
    if (!planDate) {
      alert("Veuillez choisir une date pour le planning.");
      return;
    }
    updateMealPlan(planDate, mealType, recipe.id);
    onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title);
    setSentMeals(prev => new Set(prev).add(`${planDate}-${mealType}`));
    alert(`Recette planifiée et ingrédients envoyés !`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-fadeIn p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{recipe.title}</h2>
              <div className="flex gap-2">
                {recipe.tags?.includes('TM7') && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-sm">TM7</span>}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-purple-50 space-y-4 shadow-sm">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Planifier au menu</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="date" 
                  className="flex-1 p-3 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-200" 
                  value={planDate} 
                  onChange={e => setPlanDate(e.target.value)} 
                />
                <select className="p-3 border border-gray-100 rounded-2xl font-bold outline-none cursor-pointer bg-gray-50" value={mealType} onChange={e => setMealType(e.target.value as any)}>
                  <option value="lunch">Midi</option>
                  <option value="dinner">Soir</option>
                </select>
              </div>
              <button onClick={handlePlan} className="w-full bg-purple-50 text-purple-600 p-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all">📅 Programmer au planning</button>
            </div>

            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-3xl">
              <span className="font-black text-sm text-purple-600">Portions :</span>
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 bg-white rounded-lg font-black">-</button>
              <span className="font-black w-8 text-center">{servings}</span>
              <button onClick={() => setServings(s => s + 1)} className="w-8 h-8 bg-white rounded-lg font-black">+</button>
            </div>

            <div className="space-y-3">
              <button onClick={() => onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title)} className="w-full bg-purple-600 text-white p-5 rounded-3xl font-black shadow-lg shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">🚀 Envoyer aux courses</button>
              <button onClick={handlePlanAndSend} className="w-full bg-green-600 text-white p-5 rounded-3xl font-black shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">✅ Programmer & Envoyer</button>
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
    </div>
  );
}

function RecipeForm({ onSave, onCancel, foodPortions, onAddFoodToSettings, initialData }: { 
  onSave: (r: Recipe) => void; 
  onCancel: () => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  initialData?: Recipe;
}) {
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

  const totalTime = (formData.prepTime || 0) + (formData.cookTime || 0);

  const addPendingIngredient = () => {
    if (!pendingIng.name.trim()) return;
    onAddFoodToSettings(pendingIng.name, pendingIng.unit);
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ...pendingIng }]
    }));
    setPendingIng({ name: '', amount: 1, unit: 'g' });
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
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[40px] shadow-2xl space-y-10 animate-slideUp">
      <h3 className="text-4xl font-black text-gray-900 tracking-tight">{initialData ? 'Modifier la Recette' : 'Nouvelle Recette'}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Titre de la recette</label>
            <input className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-purple-200" placeholder="Ex: Gratin de courgettes..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 transition-all">
            <input type="checkbox" id="tm7" className="w-5 h-5 accent-green-600 rounded cursor-pointer" checked={tm7Checked} onChange={e => setTm7Checked(e.target.checked)} />
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
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">⏲️ Préparation (min)</label>
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.prepTime} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, prepTime: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">🔥 Cuisson (min)</label>
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.cookTime} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, cookTime: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-green-400 uppercase tracking-widest ml-2">⌛ Temps Total</label>
              <div className="w-full p-4 border border-green-50 rounded-2xl bg-green-50 font-black text-green-600 flex items-center justify-center">
                {formatTotalTime(totalTime)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">👥 Pour (pers.)</label>
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.servings} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, servings: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Aliments nécessaires</label>
            <div className="grid grid-cols-12 gap-3 bg-white p-4 border border-purple-100 rounded-[28px] shadow-sm">
              <input type="number" placeholder="Qté" className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-black text-xs outline-none focus:ring-2 focus:ring-purple-200 transition-all" value={pendingIng.amount} onFocus={(e) => e.target.select()} onChange={e => setPendingIng({ ...pendingIng, amount: Number(e.target.value) })} />
              <select className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-[10px] outline-none" value={pendingIng.unit} onChange={e => setPendingIng({ ...pendingIng, unit: e.target.value })}>
                <option value="unité">u.</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="C.à S">C.à S</option>
                <option value="C.à C">C.à C</option>
              </select>
              <div className="col-span-6 relative">
                <input list="recipe-food-suggestions" className="w-full p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-xs outline-none focus:ring-2 focus:ring-purple-200 transition-all" placeholder="Nom aliment..." value={pendingIng.name} onChange={e => setPendingIng({ ...pendingIng, name: e.target.value })} onKeyPress={e => e.key === 'Enter' && addPendingIngredient()} />
                <datalist id="recipe-food-suggestions">{(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}</datalist>
              </div>
              <button onClick={addPendingIngredient} className="col-span-12 mt-3 bg-purple-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 active:scale-95 transition-all">Ajouter à la liste</button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-t border-gray-50 pt-4">
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
                    <button onClick={() => editIngredient(idx)} className="text-blue-400 hover:text-blue-600 transition-colors p-2" title="Modifier"><EXT_ICONS.Edit /></button>
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
         <button onClick={() => {
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
           }} className="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-100 active:scale-95 transition-all">{initialData ? 'Mettre à jour' : 'Enregistrer la recette'}</button>
      </div>
    </div>
  );
}

function RecipeSearch({ recipes, addRecipe, onAddToShopping, updateMealPlan, foodPortions, setSentMeals }: { 
  recipes: Recipe[]; 
  addRecipe: (r: Recipe) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void;
  foodPortions: FoodPortion[];
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputIng, setInputIng] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recipe[]>([]);
  const [appliance, setAppliance] = useState('Standard');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  const handleSearch = () => {
    setLoading(true);
    const matches = recipes.filter(r => {
      if (appliance === 'Thermomix TM7' && !r.tags?.includes('TM7')) return false;
      if (ingredients.length === 0) return true;
      return ingredients.some(searchIng => 
        r.ingredients.some(ri => ri.name.toLowerCase().includes(searchIng.toLowerCase()))
      );
    });
    setResults(matches);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black text-center text-gray-800 tracking-tight">Recherche par Ingrédients</h2>
      <div className="bg-white p-8 border border-purple-50 rounded-[40px] shadow-sm space-y-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Votre matériel</p>
          <div className="flex gap-2 flex-wrap">
            {['Standard', 'Thermomix TM7'].map(a => (
              <button key={a} onClick={() => setAppliance(a)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${appliance === a ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' : 'bg-white text-gray-400 border-gray-100 border-purple-200'}`}>{a}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ingrédients à disposition</p>
          <div className="flex gap-2 flex-wrap min-h-[40px]">{(ingredients || []).map(i => <span key={i} className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-100 flex items-center gap-2">{i} <button onClick={() => setIngredients(ingredients.filter(x => x !== i))} className="hover:text-red-500 transition-colors">×</button></span>)}</div>
          <div className="flex gap-2">
            <input list="food-suggestions-search" className="flex-1 border-gray-100 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-200 font-bold" placeholder="Ajouter un ingrédient..." value={inputIng} onChange={e => setInputIng(e.target.value)} onKeyPress={e => e.key === 'Enter' && (inputIng && (setIngredients([...ingredients, inputIng]), setInputIng('')))} />
            <datalist id="food-suggestions-search">{(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}</datalist>
            <button onClick={() => { if(inputIng) {setIngredients([...ingredients, inputIng]); setInputIng('');} }} className="bg-gray-800 text-white px-6 rounded-2xl font-bold transition-all active:scale-95">Ajouter</button>
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-3xl font-black shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95">{loading ? 'Recherche...' : 'Rechercher dans ma bibliothèque'}</button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
           {results.map(r => (
              <div key={r.id} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative">
                 <div className="aspect-video bg-purple-50 relative">
                   {r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.title} /> : <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>}
                   <div className="absolute top-4 left-4">{r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}</div>
                 </div>
                 <div className="p-4"><span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span><h3 className="text-sm font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3></div>
              </div>
           ))}
        </div>
      )}
      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
}

function RecurringView({ groups, setGroups, foodPortions, onAddFoodToSettings, onSendToShopping }: { 
  groups: PantryGroup[]; 
  setGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  onSendToShopping: (items: ShoppingListItem[]) => void;
}) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [tempItems, setTempItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const addTempItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit);
    const item: ShoppingListItem = { id: Math.random().toString(36).substr(2, 9), name: newItemName.trim(), amount: newItemAmount, unit: newItemUnit, checked: false };
    setTempItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
  };

  const validateList = () => {
    if (!newListName.trim() || tempItems.length === 0) { alert("Veuillez remplir les champs."); return; }
    const sortedItems = [...tempItems].sort((a, b) => a.name.localeCompare(b.name));
    if (editingGroupId) { setGroups(groups.map(g => g.id === editingGroupId ? { ...g, name: newListName.trim(), items: sortedItems } : g)); }
    else { setGroups([...groups, { id: Math.random().toString(36).substr(2, 9), name: newListName.trim(), items: sortedItems }]); }
    setNewListName(''); setTempItems([]); setEditingGroupId(null); setIsAddingList(false);
  };

  const onDragStart = (e: React.DragEvent, itemId: string, sourceGroupId: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, sourceGroupId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault(); setDragOverGroupId(null);
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
          if (g.id === sourceGroupId) return { ...g, items: g.items.filter(i => i.id !== itemId) };
          if (g.id === targetGroupId) return { ...g, items: [...g.items, itemToMove].sort((a, b) => a.name.localeCompare(b.name)) };
          return g;
        });
      });
    } catch (err) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-32 px-2 relative">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Récurrents</h2>
        {!isAddingList && <button onClick={() => { setEditingGroupId(null); setNewListName(''); setTempItems([]); setIsAddingList(true); }} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 transition-all">Ajouter une liste</button>}
      </header>

      {isAddingList && (
        <div className="bg-white p-8 md:p-10 rounded-[40px] border-2 border-purple-100 shadow-2xl space-y-8 animate-slideDown">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <input type="text" className="text-2xl font-black text-gray-800 outline-none border-b-2 border-transparent focus:border-purple-200 bg-transparent placeholder-gray-300 w-full sm:w-2/3" placeholder="NOM DE LA LISTE..." value={newListName} onChange={e => setNewListName(e.target.value)} />
             <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={() => setIsAddingList(false)} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">Annuler</button>
               <button onClick={validateList} className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg shadow-green-100">Valider</button>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-purple-50/50 p-4 rounded-3xl">
              <div className="sm:col-span-5 relative">
                <input list="pantry-suggestions" className="w-full p-4 rounded-2xl border border-gray-100 font-bold outline-none" placeholder="Rechercher article..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addTempItem()} />
                <datalist id="pantry-suggestions">
                  {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
                </datalist>
              </div>
              <input type="number" className="sm:col-span-2 p-4 rounded-2xl border border-gray-100 font-black text-center text-purple-600" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
              <select className="sm:col-span-3 p-4 rounded-2xl border border-gray-100 font-bold" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
                <option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option>
              </select>
              <button onClick={addTempItem} className="sm:col-span-2 bg-purple-600 text-white p-4 rounded-2xl font-black">Ajouter</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tempItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 animate-slideUp">
                <span className="font-bold text-gray-700">{item.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-black text-purple-600">{item.amount} {item.unit}</span>
                  <button onClick={() => setTempItems(prev => prev.filter(i => i.id !== item.id))} className="p-1 text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {groups.map(group => (
          <div key={group.id} onDragOver={e => { e.preventDefault(); setDragOverGroupId(group.id); }} onDragLeave={() => setDragOverGroupId(null)} onDrop={e => onDrop(e, group.id)} className={`bg-white rounded-[40px] border-2 transition-all shadow-sm overflow-hidden flex flex-col animate-slideUp ${dragOverGroupId === group.id ? 'border-purple-400 scale-[1.02]' : 'border-gray-100'}`}>
             <div className="p-6 bg-purple-50/30 flex justify-between items-center border-b">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-gray-800 uppercase">{group.name}</h3>
                  <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-lg border border-purple-200 shadow-sm">
                    {group.items.filter(i => !i.checked).length}/{group.items.length}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onSendToShopping(group.items)} className="text-purple-600 p-2"><EXT_ICONS.Cart /></button>
                  <button onClick={() => { setEditingGroupId(group.id); setNewListName(group.name); setTempItems(group.items); setIsAddingList(true); }} className="text-purple-600 p-2"><EXT_ICONS.Edit /></button>
                  <button onClick={() => setConfirmDeleteId(group.id)} className="text-gray-300 p-2 hover:text-red-500">×</button>
                </div>
             </div>
             <div className="p-6 divide-y">
                {group.items.slice().sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                  <div key={item.id} draggable="true" onDragStart={e => onDragStart(e, item.id, group.id)} onContextMenu={e => e.preventDefault()} style={{ WebkitTouchCallout: 'none', touchAction: 'none' }} className={`py-4 flex gap-4 items-center cursor-grab active:cursor-grabbing hover:bg-purple-50/50 px-2 rounded-xl transition-all select-none ${item.checked ? 'opacity-60' : ''}`}>
                    <div onClick={() => setGroups(groups.map(g => g.id === group.id ? { ...g, items: g.items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i) } : g))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>{item.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}</div>
                    <span className={`flex-1 font-bold ${item.checked ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                    <input type="number" className="w-12 p-1 text-center font-black text-xs bg-purple-50 rounded-lg outline-none" value={item.amount} onChange={e => setGroups(groups.map(g => g.id === group.id ? { ...g, items: g.items.map(i => i.id === item.id ? { ...i, amount: Number(e.target.value) } : i) } : g))} onFocus={e => e.target.select()} />
                    <span className="text-[10px] font-black text-purple-400">{item.unit}</span>
                  </div>
                ))}
             </div>
             <button onClick={() => onSendToShopping(group.items)} className="m-4 p-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase">🚀 Envoyer aux courses</button>
          </div>
        ))}
      </div>
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl text-center animate-slideUp">
            <h3 className="text-xl font-black">Supprimer la liste ?</h3>
            <div className="flex gap-3 pt-6">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-black">Annuler</button>
              <button onClick={() => { setGroups(groups.filter(g => g.id !== confirmDeleteId)); setConfirmDeleteId(null); }} className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Planning({ mealPlan, recipes, updateMealPlan, onMergeToShopping, sentMeals, setSentMeals }: { 
  mealPlan: Record<string, { lunch?: string; dinner?: string }>; 
  recipes: Recipe[]; 
  updateMealPlan: (d: string, t: 'lunch' | 'dinner', r: string | undefined) => void;
  onMergeToShopping: (items: ShoppingListItem[]) => void;
  sentMeals: Set<string>;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [showSummary, setShowSummary] = useState(false);
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff));
  });
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + i); return d; });

  const handleSendRecipe = (date: string, type: 'lunch' | 'dinner', recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const items: ShoppingListItem[] = recipe.ingredients.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false }));
    onMergeToShopping(items); setSentMeals(prev => new Set(prev).add(`${date}-${type}`));
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-black">Mon Planning</h2>
        <div className="flex items-center gap-4 bg-purple-50 p-2 rounded-2xl">
          <button onClick={() => setBaseDate(new Date(baseDate.setDate(baseDate.getDate() - 7)))} className="p-2"><EXT_ICONS.ArrowLeft /></button>
          <span className="text-xs font-black uppercase tracking-widest">Semaine en cours</span>
          <button onClick={() => setBaseDate(new Date(baseDate.setDate(baseDate.getDate() + 7)))} className="p-2"><EXT_ICONS.ArrowRight /></button>
        </div>
        <button onClick={() => setShowSummary(true)} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Générer Courses</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map(d => {
          const key = d.toISOString().split('T')[0];
          return (
            <div key={key} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-center font-black text-sm uppercase text-purple-600 mb-4">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
              <div className="space-y-4">
                {(['lunch', 'dinner'] as const).map(type => (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-gray-400">{type === 'lunch' ? 'Déjeuner' : 'Dîner'}</label>{sentMeals.has(`${key}-${type}`) && <span className="text-green-500"><EXT_ICONS.Check /></span>}</div>
                    <select className="w-full text-xs font-bold bg-gray-50 p-3 rounded-xl border-transparent focus:border-purple-200 outline-none" value={mealPlan[key]?.[type] || ''} onChange={e => updateMealPlan(key, type, e.target.value || undefined)}>
                      <option value="">Vide</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl space-y-8 flex flex-col max-h-[90vh] overflow-hidden">
            <h3 className="text-2xl font-black">Résumé du Planning</h3>
            <div className="overflow-y-auto space-y-6">
              {days.map(d => {
                const key = d.toISOString().split('T')[0];
                const plan = mealPlan[key];
                if (!plan?.lunch && !plan?.dinner) return null;
                return (
                  <div key={key} className="space-y-2">
                    <p className="text-[10px] font-black text-purple-400 uppercase border-b">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
                    {plan.lunch && <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center"><span className="font-bold">{recipes.find(r => r.id === plan.lunch)?.title} (Midi)</span>{sentMeals.has(`${key}-lunch`) ? <span className="text-green-600 font-black">✓</span> : <button onClick={() => handleSendRecipe(key, 'lunch', plan.lunch!)} className="text-purple-600 font-black">🚀 Envoyer</button>}</div>}
                    {plan.dinner && <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center"><span className="font-bold">{recipes.find(r => r.id === plan.dinner)?.title} (Soir)</span>{sentMeals.has(`${key}-dinner`) ? <span className="text-green-600 font-black">✓</span> : <button onClick={() => handleSendRecipe(key, 'dinner', plan.dinner!)} className="text-purple-600 font-black">🚀 Envoyer</button>}</div>}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowSummary(false)} className="w-full p-4 bg-gray-100 rounded-3xl font-black">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingView({ list, setList, settings, foodPortions, onAddFoodToSettings, reserveItems }: { 
  list: ShoppingListItem[]; 
  setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; 
  settings: UserSettings;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  reserveItems: ShoppingListItem[];
}) {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');
  
  // State for summary checkboxes
  const [checkedSummaryItems, setCheckedSummaryItems] = useState<Set<string>>(new Set());

  const consolidatedList = useMemo(() => {
    const map = new Map<string, ShoppingListItem>();
    list.forEach(item => {
      const key = `${item.name.toLowerCase()}_${item.unit.toLowerCase()}`;
      if (map.has(key)) map.get(key)!.amount += item.amount;
      else map.set(key, { ...item, id: Math.random().toString(36).substr(2, 9) });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit);
    setList(prev => [{ id: Math.random().toString(36).substr(2, 9), name: newItemName.trim(), amount: newItemAmount, unit: newItemUnit, checked: false }, ...prev]);
    setNewItemName(''); setNewItemAmount(1);
  };

  const toggleSummaryCheck = (id: string) => {
    const next = new Set(checkedSummaryItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedSummaryItems(next);
  };

  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 px-2 relative transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex justify-between items-end">
        <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Gestion Courses</h2></div>
        <button onClick={() => setConfirmClearAll(true)} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Tout effacer</button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ajout rapide</p>
          <button onClick={() => setShowReserveOnSide(!showReserveOnSide)} className="text-[10px] font-black uppercase text-purple-600 border border-purple-100 px-4 py-2 rounded-xl">{showReserveOnSide ? 'Cacher la réserve' : 'Voir la réserve'}</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input list="food-suggestions-shopping" className="flex-1 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Aliment..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddItem()} />
          <datalist id="food-suggestions-shopping">
            {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
          </datalist>
          <div className="flex gap-2">
            <input type="number" className="w-20 p-3.5 border border-gray-100 rounded-2xl font-black text-center text-purple-600" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
            <select className="w-24 p-3.5 border border-gray-100 rounded-2xl font-bold" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}><option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option></select>
            <button onClick={handleAddItem} className="bg-purple-600 text-white p-3.5 rounded-2xl font-black active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${showReserveOnSide ? 'lg:flex-row' : ''} gap-8`}>
        <div className="flex-1 bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
          {list.slice().sort((a,b) => a.name.localeCompare(b.name)).map(i => (
            <div key={i.id} className="p-5 flex gap-5 items-center">
              <div onClick={() => setList(list.map(x => x.id === i.id ? { ...x, checked: !x.checked } : x))} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>{i.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}</div>
              <p className={`flex-1 font-bold text-lg ${i.checked ? 'line-through text-gray-300' : 'text-gray-800'}`}>{i.name}</p>
              <input type="number" className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none" value={i.amount} onChange={e => setList(list.map(x => x.id === i.id ? { ...x, amount: Number(e.target.value) } : x))} />
              <button onClick={() => setList(list.filter(x => x.id !== i.id))} className="text-gray-200 font-bold text-xl ml-2">×</button>
            </div>
          ))}
        </div>
        {showReserveOnSide && (
          <div className="w-full lg:w-80 bg-white border border-purple-50 rounded-[40px] shadow-sm flex flex-col h-fit max-h-[600px] overflow-hidden">
            <div className="p-6 bg-purple-50/30 border-b"><h3 className="text-lg font-black text-purple-600 uppercase">Ma Réserve</h3></div>
            <div className="overflow-y-auto p-4 space-y-3">{reserveItems.slice().sort((a,b) => a.name.localeCompare(b.name)).map(item => <div key={item.id} className="flex justify-between items-center text-sm font-bold text-gray-700"><span>{item.name}</span><span className="text-[10px] bg-purple-50 px-2 py-1 rounded-lg">{item.amount} {item.unit}</span></div>)}</div>
          </div>
        )}
      </div>

      {list.length > 0 && <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-40"><button onClick={() => { setCheckedSummaryItems(new Set()); setShowSummary(true); }} className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl">🚀 Consolider & Finaliser</button></div>}

      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-10">
             <header className="flex justify-between items-center border-b pb-8">
               <div className="flex items-center gap-4">
                 <h2 className="text-4xl font-black">Récapitulatif</h2>
                 <span className="bg-purple-100 text-purple-600 text-xl font-black px-3 py-1 rounded-2xl border border-purple-200 shadow-sm">
                   {consolidatedList.filter(item => !checkedSummaryItems.has(item.id)).length}/{consolidatedList.length}
                 </span>
               </div>
               <button onClick={() => setShowSummary(false)} className="p-4 bg-gray-100 rounded-full">×</button>
             </header>
             <div className="bg-white rounded-[40px] border border-gray-100 divide-y overflow-hidden shadow-sm">
                {consolidatedList.map(item => (
                  <div key={item.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                        {checkedSummaryItems.has(item.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>
                      {item.amount} {item.unit}
                    </span>
                  </div>
                ))}
             </div>
             <button onClick={() => { setList([]); setShowSummary(false); }} className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-xl">🚀 Valider & Vider la liste</button>
          </div>
        </div>
      )}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl text-center animate-slideUp">
            <h3 className="text-xl font-black">Vider toute la liste ?</h3>
            <div className="flex gap-3 pt-6"><button onClick={() => setConfirmClearAll(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-black">Annuler</button><button onClick={() => { setList([]); setConfirmClearAll(false); }} className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black">Tout effacer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Settings({ settings, setSettings, exportToJSON, importFromJSON, exportToExcel, importFromExcel }: { 
  settings: UserSettings; 
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  exportToJSON: () => void;
  importFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportToExcel: () => void;
  importFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>('food');
  const [newFoodName, setNewFoodName] = useState('');
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const saveFoodName = (id: string) => {
    if (!editingName.trim()) return;
    setSettings(prev => ({ ...prev, foodPortions: (prev.foodPortions || []).map(f => f.id === id ? { ...f, name: editingName.trim() } : f) }));
    setEditingFoodId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-black text-gray-800 text-center tracking-tight mb-8">Réglages</h2>
      <div className="space-y-4">
        <div className="bg-white rounded-[32px] overflow-hidden border shadow-sm">
          <button onClick={() => setActiveSection(activeSection === 'food' ? null : 'food')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all">
            <div className="flex items-center gap-6"><div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">🍎</div><div><h3 className="text-xl font-black">Aliments</h3></div></div>
            <svg className={`w-6 h-6 transition-transform ${activeSection === 'food' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {activeSection === 'food' && (
            <div className="p-8 bg-gray-50/50 border-t space-y-8 animate-slideDown">
              <div className="flex gap-4 bg-white p-6 rounded-3xl border border-purple-100">
                <input className="flex-1 p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Nom..." value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                <button onClick={() => { if(!newFoodName.trim()) return; setSettings({ ...settings, foodPortions: [...(settings.foodPortions || []), { id: Math.random().toString(36).substr(2, 9), name: newFoodName.trim(), amount: 1, unit: 'g' }] }); setNewFoodName(''); }} className="bg-purple-600 text-white px-8 rounded-2xl font-black">Ajouter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(settings.foodPortions || []).slice().sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                    {editingFoodId === p.id ? (
                      <div className="flex-1 flex gap-2"><input className="flex-1 p-2 border border-purple-200 rounded-lg outline-none font-bold text-gray-700 bg-purple-50" value={editingName} onChange={e => setEditingName(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveFoodName(p.id)} autoFocus /><button onClick={() => saveFoodName(p.id)} className="bg-green-500 text-white p-2 rounded-lg"><EXT_ICONS.Check /></button></div>
                    ) : (
                      <><span className="flex-1 font-bold text-gray-700">{p.name}</span><div className="flex gap-2"><button onClick={() => { setEditingFoodId(p.id); setEditingName(p.name); }} className="text-gray-300 hover:text-purple-600 p-2"><EXT_ICONS.Edit /></button><button onClick={() => setSettings({ ...settings, foodPortions: (settings.foodPortions || []).filter(x => x.id !== p.id) })} className="text-red-400 font-bold text-xl p-2">×</button></div></>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden border shadow-sm">
          <button onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')} className="w-full p-8 flex items-center justify-between hover:bg-purple-50/30 transition-all">
            <div className="flex items-center gap-6"><div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🔄</div><div><h3 className="text-xl font-black">Données & Synchronisation</h3></div></div>
            <svg className={`w-6 h-6 transition-transform ${activeSection === 'data' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {activeSection === 'data' && (
            <div className="p-8 bg-gray-50/50 border-t space-y-6 animate-slideDown">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportToJSON} className="bg-purple-600 text-white p-6 rounded-3xl font-black shadow-lg">Exporter (JSON)</button>
                <label className="bg-white text-purple-600 p-6 rounded-3xl font-black border-2 border-dashed border-purple-100 cursor-pointer text-center">Importer (JSON)<input type="file" accept=".json" className="hidden" onChange={importFromJSON} /></label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={exportToExcel} className="bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg">Exporter Excel</button>
                <label className="bg-white text-green-600 p-6 rounded-3xl font-black border-2 border-dashed border-green-100 cursor-pointer text-center">Importer Excel<input type="file" accept=".xlsx, .xls" className="hidden" onChange={importFromExcel} /></label>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pt-8"><button onClick={() => confirm('Effacer vos données ?') && (localStorage.clear(), window.location.reload())} className="w-full py-6 border-2 border-red-50 text-red-400 font-black rounded-[40px] hover:bg-red-50 transition-all">Réinitialiser l'application</button></div>
    </div>
  );
}
