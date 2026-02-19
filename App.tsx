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
  )
};

interface PantryGroup {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

// --- Primary Components ---

const Navbar: React.FC<{ activeTab: AppTab; setActiveTab: (t: AppTab) => void }> = ({ activeTab, setActiveTab }) => {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:relative md:flex-col md:w-64 md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto no-scrollbar">
      <div className="hidden md:block mb-8 text-2xl font-black text-purple-600 px-4">CulinaShare</div>
      <div className="flex md:flex-col w-full justify-around md:gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 ${activeTab === tab.id ? 'text-purple-600 bg-purple-50 md:bg-purple-600 md:text-white shadow-sm' : 'text-gray-400 hover:bg-purple-50/50'}`}>
            {tab.icon} <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const InStockView: React.FC<{
  items: ShoppingListItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
}> = ({ items, setItems, foodPortions, onAddFoodToSettings }) => {
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
              <option value="tranche">tr.</option>
              <option value="paquet">paq.</option>
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
                  className="w-16 p-2 text-center font-black text-sm bg-purple-50 text-purple-600 rounded-xl outline-none border border-transparent hover:border-purple-200"
                  value={i.amount}
                  onChange={(e) => updateAmount(i.id, Number(e.target.value))}
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

// --- Main App Component ---

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
      return { ...defaultSettings, ...parsed, foodPortions: parsed.foodPortions || defaultSettings.foodPortions };
    } catch (e) { return defaultSettings; }
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
    setMealPlan(prev => ({ ...prev, [date]: { ...prev[date], [type]: recipeId } }));
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
    setSettings(prev => {
      const portions = prev.foodPortions || [];
      if (portions.some(p => p.name.toLowerCase() === name.toLowerCase().trim())) return prev;
      return { ...prev, foodPortions: [...portions, { id: Math.random().toString(36).substr(2, 9), name: name.trim(), amount: 1, unit }] };
    });
  };

  const exportToJSON = () => {
    const data = { recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_backup.json`;
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
        alert("Données importées avec succès !");
      } catch (err) { alert("Erreur lors de l'importation."); }
    };
    reader.readAsText(file);
  };

  const exportToExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return alert("Bibliothèque Excel manquante.");
    const workbook = XLSX.utils.book_new();
    
    // Onglet Récurrents
    const recurringData = pantryGroups.flatMap(group => 
      group.items.map(item => ({ Liste: group.name, Article: item.name, Quantité: item.amount, Unité: item.unit }))
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recurringData), "Récurrents");
    
    // Onglet Reserves
    const reserveData = reserveItems.map(item => ({ Article: item.name, Quantité: item.amount, Unité: item.unit }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reserveData), "reserves");
    
    XLSX.writeFile(workbook, "culinashare_stocks.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    const file = e.target.files?.[0];
    if (!file || !XLSX) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        
        // Import Récurrents
        if (wb.SheetNames.includes("Récurrents")) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets["Récurrents"]) as any[];
          setPantryGroups(prev => {
            const updated = [...prev];
            data.forEach(row => {
              const listName = (row.Liste || "Import").toString();
              const itemName = (row.Article || "").toString();
              if (!itemName) return;
              let group = updated.find(g => g.name.toLowerCase() === listName.toLowerCase());
              if (!group) { group = { id: Math.random().toString(36).substr(2, 9), name: listName, items: [] }; updated.push(group); }
              group.items.push({ id: Math.random().toString(36).substr(2, 9), name: itemName, amount: Number(row.Quantité || 1), unit: (row.Unité || "unité").toString(), checked: false });
            });
            return updated;
          });
        }
        
        // Import Reserves
        if (wb.SheetNames.includes("reserves")) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets["reserves"]) as any[];
          setReserveItems(prev => {
            const updated = [...prev];
            data.forEach(row => {
              const itemName = (row.Article || "").toString();
              if (!itemName || updated.some(i => i.name.toLowerCase() === itemName.toLowerCase())) return;
              updated.push({ id: Math.random().toString(36).substr(2, 9), name: itemName, amount: Number(row.Quantité || 1), unit: (row.Unité || "unité").toString(), checked: false });
            });
            return updated.sort((a, b) => a.name.localeCompare(b.name));
          });
        }
        alert("Import Excel réussi !");
      } catch (err) { alert("Erreur lors de l'import Excel."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-20 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'recipes' && <RecipeBook recipes={recipes} addRecipe={addRecipe} onAddToShopping={(ings) => mergeToShoppingList(ings.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false })))} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
        {activeTab === 'search' && <RecipeSearch recipes={recipes} addRecipe={addRecipe} onAddToShopping={(ings) => mergeToShoppingList(ings.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false })))} updateMealPlan={updateMealPlan} foodPortions={settings.foodPortions} setSentMeals={setSentMeals} />}
        {activeTab === 'planning' && <Planning mealPlan={mealPlan} recipes={recipes} updateMealPlan={updateMealPlan} onMergeToShopping={mergeToShoppingList} sentMeals={sentMeals} setSentMeals={setSentMeals} />}
        {activeTab === 'recurring' && <RecurringView groups={pantryGroups} setGroups={setPantryGroups} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} onSendToShopping={(items) => { mergeToShoppingList(items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) }))); setActiveTab('shopping'); }} />}
        {activeTab === 'reserve' && <InStockView items={reserveItems} setItems={setReserveItems} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} />}
        {activeTab === 'shopping' && <ShoppingView list={shoppingList} setList={setShoppingList} settings={settings} foodPortions={settings.foodPortions || []} onAddFoodToSettings={handleQuickAddFoodToSettings} reserveItems={reserveItems} />}
        {activeTab === 'settings' && <Settings settings={settings} setSettings={setSettings} exportToJSON={exportToJSON} importFromJSON={importFromJSON} exportToExcel={exportToExcel} importFromExcel={importFromExcel} />}
      </main>
    </div>
  );
}

// --- Specific Sub-components ---

const ShoppingView: React.FC<{ 
  list: ShoppingListItem[]; 
  setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; 
  settings: UserSettings;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  reserveItems: ShoppingListItem[];
}> = ({ list, setList, settings, foodPortions, onAddFoodToSettings, reserveItems }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const toggle = (id: string) => setList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setList(prev => prev.filter(i => i.id !== id));
  const updateAmount = (id: string, newAmount: number) => setList(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit);
    setList(prev => [{ id: Math.random().toString(36).substr(2, 9), name: newItemName.trim(), amount: newItemAmount, unit: newItemUnit, checked: false }, ...prev]);
    setNewItemName(''); setNewItemAmount(1);
  };

  const sortedList = useMemo(() => [...list].sort((a, b) => a.name.localeCompare(b.name)), [list]);

  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 px-2 relative transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Courses</h2>
          <p className="text-sm font-bold text-purple-400 mt-1 uppercase tracking-widest">{list.filter(i => !i.checked).length} articles</p>
        </div>
        <button onClick={() => setConfirmClearAll(true)} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Tout effacer</button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ajout rapide</p>
          <button onClick={() => setShowReserveOnSide(!showReserveOnSide)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${showReserveOnSide ? 'bg-purple-600 text-white' : 'text-purple-600 border-purple-100'}`}>
            {showReserveOnSide ? 'Cacher la réserve' : 'Voir la réserve'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input list="food-suggestions-shopping" className="flex-1 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Aliment..." value={newItemName} onChange={e => setNewItemName(e.target.value)} />
          <div className="flex gap-2">
            <input type="number" className="w-20 p-3.5 border border-gray-100 rounded-2xl text-center" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
            <select className="w-24 p-3.5 border border-gray-100 rounded-2xl" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
              <option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option>
            </select>
            <button onClick={handleAddItem} className="bg-purple-600 text-white p-3.5 rounded-2xl shadow-lg">+</button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${showReserveOnSide ? 'lg:flex-row' : ''} gap-8`}>
        <div className="flex-1 bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
          {sortedList.length === 0 ? <div className="p-20 text-center text-gray-300 italic">Liste vide.</div> : sortedList.map(i => (
            <div key={i.id} className={`p-5 flex gap-5 items-center ${i.checked ? 'bg-green-50/20' : ''}`}>
              <div onClick={() => toggle(i.id)} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                {i.checked && <EXT_ICONS.Check />}
              </div>
              <p className={`flex-1 font-bold text-lg ${i.checked ? 'line-through text-gray-300' : 'text-gray-800'}`}>{i.name}</p>
              <input type="number" className="w-12 p-1 text-center font-black text-xs bg-purple-50 rounded-lg" value={i.amount} onChange={(e) => updateAmount(i.id, Number(e.target.value))} />
              <button onClick={() => remove(i.id)} className="text-gray-200 hover:text-red-400 font-bold text-xl ml-2">×</button>
            </div>
          ))}
        </div>

        {showReserveOnSide && (
          <div className="w-full lg:w-80 bg-white border border-purple-50 rounded-[40px] shadow-sm flex flex-col h-fit max-h-[600px] overflow-hidden">
            <div className="p-6 bg-purple-50/30 border-b border-purple-50"><h3 className="text-lg font-black text-purple-600">Ma Réserve</h3></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
              {[...reserveItems].sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center"><span className="font-bold text-gray-700 text-sm">{item.name}</span><span className="text-[10px] font-black bg-purple-50 p-1 rounded">{item.amount} {item.unit}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmClearAll && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl space-y-6 text-center">
            <h3 className="text-xl font-black text-gray-800">Vider la liste ?</h3>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClearAll(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-black">Annuler</button>
              <button onClick={() => { setList([]); setConfirmClearAll(false); }} className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black">Vider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecipeBook = ({ recipes, addRecipe, onAddToShopping, foodPortions, onAddFoodToSettings, updateMealPlan, setSentMeals }) => {
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const filtered = recipes.filter(r => (selectedCat === 'Tous' || r.category === selectedCat) && r.title.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center"><h2 className="text-3xl font-black">Recettes</h2></header>
      <div className="flex gap-4"><input className="flex-1 p-4 rounded-2xl border" placeholder="Rechercher..." value={filter} onChange={e => setFilter(e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-[32px] p-6 border shadow-sm">
            <h3 className="text-xl font-black">{r.title}</h3>
            <p className="text-xs text-purple-400 font-bold uppercase">{r.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecipeSearch = ({ recipes, addRecipe, onAddToShopping, updateMealPlan, foodPortions, setSentMeals }) => {
  const [ings, setIngs] = useState<string[]>([]);
  return <div className="space-y-8"><h2 className="text-3xl font-black text-center">Recherche</h2></div>;
};

const Planning = ({ mealPlan, recipes, updateMealPlan, onMergeToShopping, sentMeals, setSentMeals }) => {
  return <div className="space-y-8"><h2 className="text-3xl font-black">Planning</h2></div>;
};

const RecurringView = ({ groups, setGroups, foodPortions, onAddFoodToSettings, onSendToShopping }) => {
  return <div className="space-y-8"><h2 className="text-3xl font-black">Récurrents</h2></div>;
};

const Settings = ({ settings, setSettings, exportToJSON, importFromJSON, exportToExcel, importFromExcel }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-center">Réglages</h2>
      <div className="bg-white p-8 rounded-[40px] border space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={exportToJSON} className="bg-purple-600 text-white p-4 rounded-2xl font-black">Export JSON</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white p-4 rounded-2xl font-black">Export Excel</button>
          <label className="border p-4 rounded-2xl text-center cursor-pointer">Import JSON <input type="file" className="hidden" onChange={importFromJSON} /></label>
          <label className="border p-4 rounded-2xl text-center cursor-pointer">Import Excel <input type="file" className="hidden" onChange={importFromExcel} /></label>
        </div>
      </div>
    </div>
  );
};
