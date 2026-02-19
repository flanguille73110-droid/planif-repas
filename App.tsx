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
    setSettings(prev => {
      const portions = prev.foodPortions || [];
      const exists = portions.some(p => p.name.toLowerCase() === name.toLowerCase().trim());
      if (exists) return prev;
      const newPortion: FoodPortion = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        amount: 1,
        unit: unit
      };
      return { ...prev, foodPortions: [...portions, newPortion] };
    });
  };

  const exportToJSON = () => {
    const data = { recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestion_course_backup.json`;
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
    if (!XLSX) {
      alert("La bibliothèque d'export Excel n'est pas chargée.");
      return;
    }
    const workbook = XLSX.utils.book_new();
    const recurringData = pantryGroups.flatMap(group => 
      group.items.map(item => ({ Liste: group.name, Article: item.name, Quantité: item.amount, Unité: item.unit }))
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recurringData), "Récurrents");
    const reserveData = reserveItems.map(item => ({ Article: item.name, Quantité: item.amount, Unité: item.unit }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reserveData), "reserves");
    XLSX.writeFile(workbook, "gestion_course_stocks.xlsx");
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
              group.items.push({ id: Math.random().toString(36).substr(2, 9), name: itemName, amount: amount, unit: unit, checked: false });
            });
            return updatedGroups;
          });
        }
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
              const exists = updatedReserve.find(i => i.name.toLowerCase() === itemName.toLowerCase());
              if (!exists) {
                updatedReserve.push({ id: Math.random().toString(36).substr(2, 9), name: itemName, amount: amount, unit: unit, checked: false });
              }
            });
            return updatedReserve.sort((a, b) => a.name.localeCompare(b.name));
          });
        }
        alert("Données Excel importées !");
      } catch (err) { alert("Erreur lors de la lecture du fichier Excel."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-20 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'recipes' && (
          <RecipeBook recipes={recipes} addRecipe={addRecipe} onAddToShopping={(ings) => mergeToShoppingList(ings.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false })))} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />
        )}
        {activeTab === 'search' && (
          <RecipeSearch recipes={recipes} addRecipe={addRecipe} onAddToShopping={(ings) => mergeToShoppingList(ings.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false })))} updateMealPlan={updateMealPlan} foodPortions={settings.foodPortions} setSentMeals={setSentMeals} />
        )}
        {activeTab === 'planning' && (
          <Planning mealPlan={mealPlan} recipes={recipes} updateMealPlan={updateMealPlan} onMergeToShopping={mergeToShoppingList} sentMeals={sentMeals} setSentMeals={setSentMeals} />
        )}
        {activeTab === 'recurring' && (
          <RecurringView groups={pantryGroups} setGroups={setPantryGroups} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} onSendToShopping={(items) => { mergeToShoppingList(items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) }))); setActiveTab('shopping'); }} />
        )}
        {activeTab === 'reserve' && (
          <InStockView items={reserveItems} setItems={setReserveItems} foodPortions={settings.foodPortions} onAddFoodToSettings={handleQuickAddFoodToSettings} />
        )}
        {activeTab === 'shopping' && (
          <ShoppingView list={shoppingList} setList={setShoppingList} settings={settings} foodPortions={settings.foodPortions || []} onAddFoodToSettings={handleQuickAddFoodToSettings} reserveItems={reserveItems} />
        )}
        {activeTab === 'settings' && (
          <Settings settings={settings} setSettings={setSettings} exportToJSON={exportToJSON} importFromJSON={importFromJSON} exportToExcel={exportToExcel} importFromExcel={importFromExcel} />
        )}
      </main>
    </div>
  );
}

const Navbar: React.FC<{ activeTab: AppTab; setActiveTab: (t: AppTab) => void }> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipes', label: 'Recettes', icon: <EXT_ICONS.Book /> },
    { id: 'search', label: 'Recherche', icon: <EXT_ICONS.Search /> },
    { id: 'planning', label: 'Planning', icon: <EXT_ICONS.Calendar /> },
    { id: 'recurring', label: "Récurrents", icon: <EXT_ICONS.Recurring /> },
    { id: 'reserve', label: "En réserve", icon: <EXT_ICONS.Box /> },
    { id: 'shopping', label: 'Panier', icon: <EXT_ICONS.Cart /> },
    { id: 'settings', label: 'Réglages', icon: <EXT_ICONS.Settings /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:sticky md:top-0 md:h-screen md:flex-col md:w-64 md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto md:overflow-y-auto no-scrollbar">
      <div className="hidden md:block mb-8 text-2xl font-black text-purple-600 px-4">Gestion Course</div>
      <div className="flex md:flex-col w-full justify-around md:justify-start md:gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 ${activeTab === tab.id ? 'text-purple-600 bg-purple-50 md:bg-purple-600 md:text-white shadow-sm' : 'text-gray-400 hover:bg-purple-50/50'}`}>
            {tab.icon} <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const InStockView: React.FC<{ items: ShoppingListItem[]; setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; foodPortions: FoodPortion[]; onAddFoodToSettings: (name: string, unit: string) => void; }> = ({ items, setItems, foodPortions, onAddFoodToSettings }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');
  const addItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit);
    const item: ShoppingListItem = { id: Math.random().toString(36).substr(2, 9), name: newItemName.trim(), amount: newItemAmount, unit: newItemUnit, checked: false };
    setItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      <header><h2 className="text-3xl font-black text-gray-800 tracking-tight text-center sm:text-left">En Réserve</h2><p className="text-sm font-bold text-purple-400 mt-1 text-center sm:text-left uppercase tracking-widest">Gérer votre stock à la maison</p></header>
      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative"><input type="text" list="stock-food-suggestions" placeholder="Ex: Pâtes..." className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addItem()} /><datalist id="stock-food-suggestions">{foodPortions.map(fp => <option key={fp.id} value={fp.name} />)}</datalist></div>
          <div className="sm:col-span-2"><input type="number" className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-black text-center text-purple-600 outline-none" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} onFocus={e => e.target.select()} /></div>
          <div className="sm:col-span-2"><select className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-500 outline-none cursor-pointer" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}><option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option></select></div>
          <button onClick={addItem} className="sm:col-span-2 bg-purple-600 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all">Ajouter</button>
        </div>
      </div>
      <div className="bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
        {items.length === 0 ? <div className="p-20 text-center text-gray-300 italic font-medium">Réserve vide.</div> : items.sort((a,b)=>a.name.localeCompare(b.name)).map(i => (
          <div key={i.id} className="p-5 flex gap-5 items-center group">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
            <p className="flex-1 font-bold text-lg text-gray-800">{i.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" className="w-20 p-2 text-center font-black text-sm bg-purple-50 text-purple-600 rounded-xl outline-none" value={i.amount} onChange={(e) => setItems(items.map(x => x.id === i.id ? { ...x, amount: Number(e.target.value) } : x))} onFocus={e => e.target.select()} />
              <span className="text-[10px] font-black text-purple-400 w-12">{i.unit}</span>
            </div>
            <button onClick={() => setItems(items.filter(x => x.id !== i.id))} className="text-gray-200 hover:text-red-400 font-bold text-xl ml-2 opacity-0 group-hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecipeBook: React.FC<{ recipes: Recipe[]; addRecipe: (r: Recipe) => void; onAddToShopping: (ings: Ingredient[], title: string) => void; foodPortions: FoodPortion[]; onAddFoodToSettings: (name: string, unit: string) => void; updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void; setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>; }> = ({ recipes, addRecipe, onAddToShopping, foodPortions, onAddFoodToSettings, updateMealPlan, setSentMeals }) => {
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const filtered = (recipes || []).filter(r => (selectedCat === 'Tous' || r.category === selectedCat) && (r.title || "").toLowerCase().includes(filter.toLowerCase()));
  if (isAdding) return <RecipeForm onSave={(r) => { addRecipe(r); setIsAdding(false); setEditingRecipe(null); }} onCancel={() => { setIsAdding(false); setEditingRecipe(null); }} foodPortions={foodPortions} onAddFoodToSettings={onAddFoodToSettings} initialData={editingRecipe || undefined} />;
  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-3xl font-black text-gray-800 tracking-tight">Recettes</h2><p className="text-xs font-black uppercase text-purple-600 mt-2">Ma Bibliothèque</p></div>
        <button onClick={() => { setEditingRecipe(null); setIsAdding(true); }} className="bg-purple-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg">Ajouter</button>
      </header>
      <div className="flex flex-col sm:flex-row gap-4"><input type="text" placeholder="Rechercher..." className="flex-1 p-4 rounded-2xl border border-purple-100 bg-white outline-none" value={filter} onChange={e => setFilter(e.target.value)} /><select className="p-4 rounded-2xl border border-purple-100 bg-white font-bold" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}><option>Tous</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full py-20 text-center text-gray-300 italic">Aucune recette.</div> : filtered.map(r => (
          <div key={r.id} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative">
            <div className="aspect-video bg-purple-50 relative">{r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>}<button onClick={(e) => { e.stopPropagation(); setEditingRecipe(r); setIsAdding(true); }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-purple-600 opacity-0 group-hover:opacity-100 transition-all"><EXT_ICONS.Edit /></button></div>
            <div className="p-6"><span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span><h3 className="text-xl font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3></div>
          </div>
        ))}
      </div>
      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
};

const RecipeDetail: React.FC<{ recipe: Recipe; onClose: () => void; onAddToShopping: (ings: Ingredient[], title: string) => void; updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void; setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>; }> = ({ recipe, onClose, onAddToShopping, updateMealPlan, setSentMeals }) => {
  const [servings, setServings] = useState(recipe.servings || 4);
  const [planDate, setPlanDate] = useState('');
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const ratio = servings / (recipe.servings || 4);
  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-fadeIn p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{recipe.title}</h2>
            <div className="bg-white p-6 rounded-[32px] border border-purple-50 space-y-4 shadow-sm">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Planifier</p>
              <div className="flex flex-col sm:flex-row gap-3"><input type="date" className="flex-1 p-3 border rounded-2xl outline-none" value={planDate} onChange={e => setPlanDate(e.target.value)} /><select className="p-3 border rounded-2xl" value={mealType} onChange={e => setMealType(e.target.value as any)}><option value="lunch">Midi</option><option value="dinner">Soir</option></select></div>
              <button onClick={() => { if(!planDate) return alert("Date !"); updateMealPlan(planDate, mealType, recipe.id); alert("Fait"); }} className="w-full bg-purple-50 text-purple-600 p-4 rounded-2xl font-black text-xs uppercase border border-purple-100">📅 Programmer</button>
            </div>
            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-3xl"><span className="font-black text-sm text-purple-600">Portions :</span><button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 bg-white rounded-lg">-</button><span className="font-black w-8 text-center">{servings}</span><button onClick={() => setServings(s => s + 1)} className="w-8 h-8 bg-white rounded-lg">+</button></div>
            <div className="space-y-3">
              <button onClick={() => onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title)} className="w-full bg-purple-600 text-white p-5 rounded-3xl font-black shadow-lg">🚀 Envoyer aux courses</button>
              <button onClick={() => { if(!planDate) return alert("Date !"); updateMealPlan(planDate, mealType, recipe.id); onAddToShopping((recipe.ingredients || []).map(i => ({ ...i, amount: i.amount * ratio })), recipe.title); setSentMeals(prev => new Set(prev).add(`${planDate}-${mealType}`)); onClose(); }} className="w-full bg-green-600 text-white p-5 rounded-3xl font-black shadow-lg">✅ Programmer & Envoyer</button>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-[32px] space-y-6">
            <h3 className="text-xl font-black">Ingrédients</h3>
            <ul className="space-y-3">{(recipe.ingredients || []).map((ing, i) => (<li key={i} className="flex justify-between border-b pb-2"><span className="font-medium text-gray-600">{ing.name}</span><span className="font-black text-purple-600">{Math.round(ing.amount * ratio * 100) / 100} {ing.unit}</span></li>))}</ul>
          </div>
        </div>
        <div className="space-y-4">{(recipe.instructions || []).map((step, i) => (<div key={i} className="p-4 bg-white rounded-2xl border font-medium text-gray-600">{step}</div>))}</div>
      </div>
    </div>
  );
};

const RecipeForm: React.FC<{ onSave: (r: Recipe) => void; onCancel: () => void; foodPortions: FoodPortion[]; onAddFoodToSettings: (name: string, unit: string) => void; initialData?: Recipe; }> = ({ onSave, onCancel, foodPortions, onAddFoodToSettings, initialData }) => {
  const [formData, setFormData] = useState<Partial<Recipe>>(initialData || { title: '', servings: 4, category: CATEGORIES[1], ingredients: [], instructions: [''], prepTime: 15, cookTime: 20, tags: [] });
  const [tm7, setTm7] = useState(initialData?.tags?.includes('TM7') || false);
  const [pending, setPending] = useState<Ingredient>({ name: '', amount: 1, unit: 'g' });
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[40px] shadow-2xl space-y-10 animate-slideUp">
      <h3 className="text-4xl font-black">{initialData ? 'Modifier' : 'Nouveau'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <input className="w-full p-4 border rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Titre..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl"><input type="checkbox" checked={tm7} onChange={e => setTm7(e.target.checked)} /><label className="text-sm font-black text-green-600 uppercase">Appareil TM7</label></div>
          <select className="w-full p-4 border rounded-2xl" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          <div className="grid grid-cols-2 gap-4"><input type="number" className="p-4 border rounded-2xl" value={formData.prepTime} onChange={e => setFormData({ ...formData, prepTime: Number(e.target.value) })} /><input type="number" className="p-4 border rounded-2xl" value={formData.cookTime} onChange={e => setFormData({ ...formData, cookTime: Number(e.target.value) })} /></div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-3 bg-white p-4 border rounded-[28px]">
            <input type="number" className="col-span-3 p-2 border rounded-xl" value={pending.amount} onChange={e => setPending({ ...pending, amount: Number(e.target.value) })} onFocus={e => e.target.select()} />
            <select className="col-span-3 p-2 border rounded-xl" value={pending.unit} onChange={e => setPending({ ...pending, unit: e.target.value })}><option value="g">g</option><option value="kg">kg</option><option value="unité">u.</option><option value="ml">ml</option><option value="L">L</option></select>
            <input list="f-s" className="col-span-6 p-2 border rounded-xl" value={pending.name} onChange={e => setPending({ ...pending, name: e.target.value })} /><datalist id="f-s">{foodPortions.map(f => <option key={f.id} value={f.name} />)}</datalist>
            <button onClick={() => { if(!pending.name) return; onAddFoodToSettings(pending.name, pending.unit); setFormData(f => ({ ...f, ingredients: [...(f.ingredients || []), { ...pending }] })); setPending({ name: '', amount: 1, unit: 'g' }); }} className="col-span-12 mt-3 bg-purple-600 text-white p-3 rounded-xl font-black">Ajouter</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">{(formData.ingredients || []).map((ing, i) => (<div key={i} className="flex justify-between p-3 bg-gray-50 rounded-xl"><span className="font-black text-purple-600 text-xs w-20">{ing.amount} {ing.unit}</span><span className="font-bold">{ing.name}</span><button onClick={() => setFormData(f => ({ ...f, ingredients: f.ingredients?.filter((_, idx) => idx !== i) }))} className="text-red-400">×</button></div>))}</div>
        </div>
      </div>
      <div className="flex gap-4 border-t pt-8"><button onClick={onCancel} className="flex-1 p-5 bg-gray-100 rounded-2xl font-black">Annuler</button><button onClick={() => { if(!formData.title) return alert("Titre !"); const tags = tm7 ? [...(formData.tags || []).filter(t => t !== 'TM7'), 'TM7'] : (formData.tags || []).filter(t => t !== 'TM7'); onSave({ ...formData as Recipe, id: formData.id || Math.random().toString(36).substr(2, 9), tags, instructions: formData.instructions || ['Mélanger.'] }); }} className="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black shadow-xl">Enregistrer</button></div>
    </div>
  );
};

const RecipeSearch: React.FC<{ recipes: Recipe[]; addRecipe: (r: Recipe) => void; onAddToShopping: (ings: Ingredient[], title: string) => void; updateMealPlan: (date: string, type: 'lunch' | 'dinner', recipeId: string | undefined) => void; foodPortions: FoodPortion[]; setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>; }> = ({ recipes, addRecipe, onAddToShopping, updateMealPlan, foodPortions, setSentMeals }) => {
  const [ings, setIngs] = useState<string[]>([]);
  const [inp, setInp] = useState('');
  const [res, setRes] = useState<Recipe[]>([]);
  const [app, setApp] = useState('Standard');
  const [view, setView] = useState<Recipe | null>(null);
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black text-center">Recherche par Ingrédients</h2>
      <div className="bg-white p-8 border rounded-[40px] shadow-sm space-y-8">
        <div className="flex gap-2">{(['Standard', 'Thermomix TM7']).map(a => (<button key={a} onClick={() => setApp(a)} className={`px-4 py-2 rounded-xl text-xs font-black border ${app === a ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-400 border-purple-200'}`}>{a}</button>))}</div>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">{ings.map(i => <span key={i} className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2">{i} <button onClick={() => setIngs(ings.filter(x => x !== i))}>×</button></span>)}</div>
          <div className="flex gap-2"><input list="s-f-s" className="flex-1 border p-4 rounded-2xl outline-none font-bold" placeholder="Ajouter..." value={inp} onChange={e => setInp(e.target.value)} onKeyPress={e => e.key === 'Enter' && (inp && (setIngs([...ings, inp]), setInp('')))} /><datalist id="s-f-s">{foodPortions.map(fp => <option key={fp.id} value={fp.name} />)}</datalist><button onClick={() => { if(inp) {setIngs([...ings, inp]); setInp('');} }} className="bg-gray-800 text-white px-6 rounded-2xl font-bold">Ajouter</button></div>
        </div>
        <button onClick={() => setRes(recipes.filter(r => (app === 'Thermomix TM7' ? r.tags?.includes('TM7') : true) && (ings.length === 0 || ings.some(search => r.ingredients.some(ri => ri.name.toLowerCase().includes(search.toLowerCase()))))))} className="w-full bg-purple-600 text-white py-5 rounded-3xl font-black shadow-xl">Rechercher</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{res.map(r => (<div key={r.id} onClick={() => setView(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border hover:shadow-xl cursor-pointer group relative"><div className="aspect-video bg-purple-50 relative">{r.imageUrl ? <img src={r.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>}</div><div className="p-4"><span className="text-[10px] font-black text-purple-400 uppercase">{r.category}</span><h3 className="text-sm font-black mt-1">{r.title}</h3></div></div>))}</div>
      {view && <RecipeDetail recipe={view} onClose={() => setView(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
};

const RecurringView: React.FC<{ groups: PantryGroup[]; setGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>; foodPortions: FoodPortion[]; onAddFoodToSettings: (name: string, unit: string) => void; onSendToShopping: (items: ShoppingListItem[]) => void; }> = ({ groups, setGroups, foodPortions, onAddFoodToSettings, onSendToShopping }) => {
  const [isAdd, setIsAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [lName, setLName] = useState('');
  const [tItems, setTItems] = useState<ShoppingListItem[]>([]);
  const [niName, setNiName] = useState('');
  const [niAmt, setNiAmt] = useState(1);
  const [niUnit, setNiUnit] = useState('unité');

  const handleEditGroup = (group: PantryGroup) => {
    setEditId(group.id);
    setLName(group.name);
    setTItems([...group.items]);
    setIsAdd(true);
  };

  const updateItemAmount = (groupId: string, itemId: string, amount: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? {
      ...g,
      items: g.items.map(i => i.id === itemId ? { ...i, amount } : i)
    } : g));
  };

  const addT = () => { if (!niName.trim()) return; onAddFoodToSettings(niName.trim(), niUnit); setTItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: niName.trim(), amount: niAmt, unit: niUnit, checked: false }].sort((a,b)=>a.name.localeCompare(b.name))); setNiName(''); setNiAmt(1); };
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-32 relative">
      <header className="flex justify-between items-center"><h2 className="text-3xl font-black">Récurrents</h2>{!isAdd && <button onClick={() => { setEditId(null); setLName(''); setTItems([]); setIsAdd(true); }} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Ajouter une liste</button>}</header>
      {isAdd && (
        <div className="bg-white p-8 rounded-[40px] border shadow-2xl space-y-8 animate-slideDown">
          <div className="flex flex-col sm:flex-row justify-between gap-4"><input className="text-2xl font-black flex-1 border-b outline-none" placeholder="NOM..." value={lName} onChange={e => setLName(e.target.value)} /><div className="flex gap-2"><button onClick={() => setIsAdd(false)} className="px-6 py-3 bg-gray-100 rounded-xl font-bold">Annuler</button><button onClick={() => { if(!lName || tItems.length===0) return; if(editId) setGroups(groups.map(g => g.id === editId ? { ...g, name: lName, items: tItems } : g)); else setGroups([...groups, { id: Math.random().toString(36).substr(2, 9), name: lName, items: tItems }]); setIsAdd(false); }} className="px-6 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg">Valider</button></div></div>
          <div className="bg-purple-50 p-6 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5"><input list="p-s" className="w-full p-4 rounded-2xl border font-bold outline-none" placeholder="Article..." value={niName} onChange={e => setNiName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addT()} /><datalist id="p-s">{foodPortions.map(fp => <option key={fp.id} value={fp.name} />)}</datalist></div>
              <div className="sm:col-span-2"><input type="number" className="w-full p-4 rounded-2xl border font-black text-center text-purple-600 outline-none" value={niAmt} onChange={e => setNiAmt(Number(e.target.value))} onFocus={e => e.target.select()} /></div>
              <div className="sm:col-span-3"><select className="w-full p-4 rounded-2xl border font-bold" value={niUnit} onChange={e => setNiUnit(e.target.value)}><option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option></select></div>
              <button onClick={addT} className="sm:col-span-2 bg-purple-600 text-white p-4 rounded-2xl font-black active:scale-95">Ajouter</button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">{tItems.map(item => (<div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border animate-slideUp"><span className="font-bold">{item.name}</span><div className="flex items-center gap-4"><span className="font-black text-purple-600 text-xs bg-purple-50 px-3 py-1 rounded-lg">{item.amount} {item.unit}</span><button onClick={() => setTItems(tItems.filter(i => i.id !== item.id))} className="text-red-400">×</button></div></div>))}</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{groups.map(group => (
        <div key={group.id} className="bg-white rounded-[40px] border shadow-sm flex flex-col animate-slideUp overflow-hidden">
          <div className="p-6 bg-purple-50/30 flex justify-between items-center border-b"><h3>{group.name}</h3><div className="flex gap-2"><button onClick={() => handleEditGroup(group)} className="text-purple-600"><EXT_ICONS.Edit /></button><button onClick={() => setGroups(groups.filter(g => g.id !== group.id))} className="text-red-300">×</button></div></div>
          <div className="p-6 divide-y">{group.items.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(item => (<div key={item.id} className="py-4 flex gap-4 items-center"><div onClick={() => setGroups(groups.map(g => g.id === group.id ? { ...g, items: g.items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i) } : g))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-100'}`}>{item.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}</div><span className={`flex-1 font-bold ${item.checked ? 'line-through text-gray-300' : ''}`}>{item.name}</span><div className="flex items-center gap-1.5"><input type="number" className="w-16 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none" value={item.amount} onChange={(e) => updateItemAmount(group.id, item.id, Number(e.target.value))} onFocus={e => e.target.select()} /><span className="text-[10px] font-black">{item.unit}</span></div></div>))}</div>
          <div className="p-4 bg-gray-50 mt-auto"><button onClick={() => onSendToShopping(group.items)} className="w-full bg-white text-purple-600 py-3 rounded-2xl font-black text-xs uppercase border border-purple-100 hover:bg-purple-600 hover:text-white transition-all shadow-sm">🚀 Envoyer aux courses</button></div>
        </div>
      ))}</div>
    </div>
  );
};

const Planning: React.FC<{ mealPlan: Record<string, { lunch?: string; dinner?: string }>; recipes: Recipe[]; updateMealPlan: (d: string, t: 'lunch' | 'dinner', r: string | undefined) => void; onMergeToShopping: (items: ShoppingListItem[]) => void; sentMeals: Set<string>; setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>; }> = ({ mealPlan, recipes, updateMealPlan, onMergeToShopping, sentMeals, setSentMeals }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [baseDate, setBaseDate] = useState(() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); });
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + i); return d; });
  const handleSendRecipe = (date: string, type: 'lunch' | 'dinner', recipeId: string) => { const recipe = recipes.find(r => r.id === recipeId); if (!recipe) return; const mealKey = `${date}-${type}`; if (sentMeals.has(mealKey)) return; onMergeToShopping(recipe.ingredients.map(ing => ({ id: Math.random().toString(36).substr(2, 9), name: ing.name, amount: ing.amount, unit: ing.unit, checked: false }))); setSentMeals(prev => new Set(prev).add(mealKey)); };
  return (
    <div className="space-y-8 animate-fadeIn pb-20 relative">
      <header className="flex justify-between items-center"><div><h2 className="text-3xl font-black">Planning</h2><div className="flex gap-4 items-center bg-purple-50 p-2 rounded-2xl border"><button onClick={() => setBaseDate(d => new Date(d.setDate(d.getDate()-7)))} className="text-purple-600"><EXT_ICONS.ArrowLeft /></button><span className="text-xs font-black uppercase">Semaine du {baseDate.toLocaleDateString()}</span><button onClick={() => setBaseDate(d => new Date(d.setDate(d.getDate()+7)))} className="text-purple-600"><EXT_ICONS.ArrowRight /></button></div></div><button onClick={() => setShowSummary(true)} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Générer Courses</button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{days.map(d => {
        const key = d.toISOString().split('T')[0];
        return (
          <div key={key} className={`bg-white p-6 border rounded-[32px] shadow-sm ${((mealPlan[key]?.lunch && sentMeals.has(`${key}-lunch`)) || (mealPlan[key]?.dinner && sentMeals.has(`${key}-dinner`))) ? 'border-green-100 bg-green-50/10' : ''}`}>
            <p className="text-center font-black text-sm uppercase text-purple-600 mb-4 border-b pb-2">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
            <div className="space-y-4">
              <div className="space-y-1"><div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-gray-400">Midi</label>{mealPlan[key]?.lunch && sentMeals.has(`${key}-lunch`) && <span className="text-green-500"><EXT_ICONS.Check /></span>}</div><select className="w-full text-xs font-bold bg-gray-50 p-3 rounded-xl outline-none" value={mealPlan[key]?.lunch || ''} onChange={e => updateMealPlan(key, 'lunch', e.target.value || undefined)}><option value="">Vide</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
              <div className="space-y-1"><div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-gray-400">Soir</label>{mealPlan[key]?.dinner && sentMeals.has(`${key}-dinner`) && <span className="text-green-500"><EXT_ICONS.Check /></span>}</div><select className="w-full text-xs font-bold bg-gray-50 p-3 rounded-xl outline-none" value={mealPlan[key]?.dinner || ''} onChange={e => updateMealPlan(key, 'dinner', e.target.value || undefined)}><option value="">Vide</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
            </div>
          </div>
        );
      })}</div>
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl space-y-8 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center"><h3>Menu de la Semaine</h3><button onClick={() => setShowSummary(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200">×</button></div>
            <div className="overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {days.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const plan = mealPlan[dateStr];
                if (!plan?.lunch && !plan?.dinner) return null;
                return (
                  <div key={dateStr} className="space-y-3">
                    <p className="text-[10px] font-black text-purple-400 uppercase border-b pb-1">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
                    <div className="space-y-2">
                      {plan.lunch && recipes.find(r => r.id === plan.lunch) && (<div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border"><div><span className="text-[8px] font-black uppercase text-gray-400 block">Midi</span><span className="font-bold">{recipes.find(r => r.id === plan.lunch)?.title}</span></div>{sentMeals.has(`${dateStr}-lunch`) ? <span className="text-green-600 text-xs font-black">Envoyé</span> : <button onClick={() => handleSendRecipe(dateStr, 'lunch', plan.lunch!)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black">Envoyer</button>}</div>)}
                      {plan.dinner && recipes.find(r => r.id === plan.dinner) && (<div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border"><div><span className="text-[8px] font-black uppercase text-gray-400 block">Soir</span><span className="font-bold">{recipes.find(r => r.id === plan.dinner)?.title}</span></div>{sentMeals.has(`${dateStr}-dinner`) ? <span className="text-green-600 text-xs font-black">Envoyé</span> : <button onClick={() => handleSendRecipe(dateStr, 'dinner', plan.dinner!)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black">Envoyer</button>}</div>)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 pt-4 border-t"><button onClick={() => setShowSummary(false)} className="flex-1 p-5 bg-gray-100 rounded-3xl font-black">Fermer</button><button onClick={() => { days.forEach(d => { const k = d.toISOString().split('T')[0]; ['lunch', 'dinner'].forEach(t => { const rId = mealPlan[k]?.[t as any]; if(rId) handleSendRecipe(k, t as any, rId); }); }); alert("Tout au panier !"); setShowSummary(false); }} className="flex-1 p-5 bg-purple-600 text-white rounded-3xl font-black shadow-xl">Tout envoyer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingView: React.FC<{ list: ShoppingListItem[]; setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; settings: UserSettings; foodPortions: FoodPortion[]; onAddFoodToSettings: (name: string, unit: string) => void; reserveItems: ShoppingListItem[]; }> = ({ list, setList, settings, foodPortions, onAddFoodToSettings, reserveItems }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [checkedSummaryItems, setCheckedSummaryItems] = useState<Set<string>>(new Set());
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  const [niN, setNiN] = useState('');
  const [niA, setNiA] = useState(1);
  const [niU, setNiU] = useState('unité');
  const sorted = useMemo(() => [...list].sort((a, b) => a.name.localeCompare(b.name)), [list]);
  const consolidated = useMemo(() => { const map = new Map<string, ShoppingListItem>(); (list || []).forEach(i => { const k = `${i.name.toLowerCase()}_${i.unit.toLowerCase()}`; if (map.has(k)) map.get(k)!.amount += i.amount; else map.set(k, { ...i, id: Math.random().toString(36).substr(2, 9) }); }); return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name)); }, [list]);
  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex justify-between items-end px-2 sm:px-0"><div><h2 className="text-3xl font-black text-gray-800">Panier</h2><p className="text-sm font-bold text-purple-400 mt-1 uppercase">{(list || []).filter(i => !i.checked).length} en attente</p></div><button onClick={() => setConfirmClearAll(true)} className="text-[10px] font-black text-red-400 uppercase">Tout effacer</button></div>
      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center"><p className="text-[10px] font-black text-purple-400 uppercase ml-2">Ajout rapide</p><button onClick={() => setShowReserveOnSide(!showReserveOnSide)} className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all border ${showReserveOnSide ? 'bg-purple-600 text-white' : 'text-purple-600 border-purple-100'}`}>{showReserveOnSide ? 'Cacher réserve' : 'Voir réserve'}</button></div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><input list="s-v-f" placeholder="Ex: Beurre..." className="w-full p-3.5 border rounded-2xl bg-gray-50 font-bold outline-none" value={niN} onChange={e => setNiN(e.target.value)} onKeyPress={e => e.key === 'Enter' && (onAddFoodToSettings(niN, niU), setList([{ id: Math.random().toString(36).substr(2, 9), name: niN.trim(), amount: niA, unit: niU, checked: false }, ...list]), setNiN(''), setNiA(1))} /><datalist id="s-v-f">{foodPortions.map(fp => <option key={fp.id} value={fp.name} />)}</datalist></div>
          <div className="flex gap-2"><input type="number" className="w-24 p-3.5 border rounded-2xl bg-gray-50 font-black text-center text-purple-600 outline-none" value={niA} onChange={e => setNiA(Number(e.target.value))} onFocus={e => e.target.select()} /><select className="w-24 p-3.5 border rounded-2xl bg-gray-50 font-bold outline-none" value={niU} onChange={e => setNiU(e.target.value)}><option value="unité">u.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option></select><button onClick={() => { if(!niN) return; onAddFoodToSettings(niN, niU); setList([{ id: Math.random().toString(36).substr(2, 9), name: niN.trim(), amount: niA, unit: niU, checked: false }, ...list]); setNiN(''); setNiA(1); }} className="bg-purple-600 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95">+</button></div>
        </div>
      </div>
      <div className={`flex flex-col ${showReserveOnSide ? 'lg:flex-row' : ''} gap-8`}>
        <div className="flex-1 bg-white border rounded-[40px] divide-y shadow-sm overflow-hidden">{sorted.length === 0 ? <div className="p-20 text-center text-gray-300 italic">Panier vide.</div> : sorted.map(i => (
          <div key={i.id} className={`p-5 flex gap-5 items-center transition-all ${i.checked ? 'bg-green-50/20' : ''}`}>
            <div onClick={() => setList(list.map(x => x.id === i.id ? { ...x, checked: !x.checked } : x))} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100'}`}>{i.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}</div>
            <p className={`flex-1 font-bold text-lg ${i.checked ? 'line-through text-gray-300' : ''}`}>{i.name}</p>
            <div className="flex items-center gap-1.5 shrink-0"><input type="number" className="w-24 p-1 text-center font-black text-sm bg-purple-50 text-purple-600 rounded-lg outline-none" value={i.amount} onChange={(e) => setList(list.map(x => x.id === i.id ? { ...x, amount: Number(e.target.value) } : x))} onFocus={e => e.target.select()} /><span className={`text-[10px] font-black w-14 ${i.checked ? 'text-gray-300' : 'text-purple-400'}`}>{i.unit}</span></div>
            <button onClick={() => setList(list.filter(x => x.id !== i.id))} className="text-gray-200 hover:text-red-400 font-bold text-xl ml-2">×</button>
          </div>
        ))}</div>
        {showReserveOnSide && <div className="w-full lg:w-80 bg-white border border-purple-50 rounded-[40px] shadow-sm flex flex-col h-fit max-h-[600px] overflow-hidden"><div className="p-6 bg-purple-50/30 border-b border-purple-50"><h3 className="text-lg font-black text-purple-600 uppercase tracking-tight">Ma Réserve</h3></div><div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">{reserveItems.length === 0 ? <div className="p-8 text-center text-gray-300 italic text-sm">Vide.</div> : [...reserveItems].sort((a,b)=>a.name.localeCompare(b.name)).map(item => (<div key={item.id} className="p-4 flex justify-between items-center"><span className="font-bold text-sm text-gray-700">{item.name}</span><span className="text-[10px] font-black px-2 py-1 rounded-lg bg-purple-50 text-purple-600">{item.amount} {item.unit}</span></div>))}</div></div>}
      </div>
      {list.length > 0 && !showSummary && <div className="fixed bottom-24 left-0 right-0 p-6 md:relative md:bottom-0 md:p-0 flex justify-center z-40"><button onClick={() => setShowSummary(true)} className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">🚀 Consolider & Finaliser</button></div>}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-10 pb-24">
             <header className="flex justify-between items-center border-b pb-8"><h2 className="text-4xl font-black text-gray-900 tracking-tight">Récapitulatif</h2><button onClick={() => setShowSummary(false)} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-all">×</button></header>
             <div className="bg-white rounded-[40px] border divide-y shadow-sm">
                {consolidated.map(item => (<div key={item.id} className="p-6 flex items-center transition-all"><div onClick={() => { const n = new Set(checkedSummaryItems); if(n.has(item.id)) n.delete(item.id); else n.add(item.id); setCheckedSummaryItems(n); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>{checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}</div><span className={`flex-1 font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span><span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>{item.amount} {item.unit}</span></div>))}
             </div>
             <div className="pt-8 space-y-4"><button onClick={() => { setList([]); setShowSummary(false); }} className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">🚀 Valider & Vider mon panier</button><button onClick={() => setShowSummary(false)} className="w-full bg-gray-100 text-gray-500 p-6 rounded-3xl font-black hover:bg-gray-200 transition-all">Revenir à ma liste</button></div>
          </div>
        </div>
      )}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <h3 className="text-xl font-black">Vider toute la liste ?</h3>
            <div className="flex gap-3 pt-2"><button onClick={() => setConfirmClearAll(false)} className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black">Annuler</button><button onClick={() => { setList([]); setConfirmClearAll(false); }} className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black shadow-lg active:scale-95">Tout effacer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings: React.FC<{ settings: UserSettings; setSettings: React.Dispatch<React.SetStateAction<UserSettings>>; exportToJSON: () => void; importFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void; exportToExcel: () => void; importFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ settings, setSettings, exportToJSON, importFromJSON, exportToExcel, importFromExcel }) => {
  const [f, setF] = useState('');
  const [eI, setEI] = useState<string | null>(null);
  const [eN, setEN] = useState('');
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-black text-center mb-8">Réglages</h2>
      <div className="bg-white rounded-[32px] overflow-hidden border shadow-sm p-8 space-y-8">
        <h3 className="text-xl font-black flex items-center gap-4">🍎 Bibliothèque d'Aliments</h3>
        <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-6 rounded-3xl border">
          <input className="flex-1 p-4 border rounded-2xl bg-white font-bold outline-none" placeholder="Nom..." value={f} onChange={e => setF(e.target.value)} />
          <button onClick={() => { if(!f.trim()) return; setSettings({ ...settings, foodPortions: [...(settings.foodPortions || []), { id: Math.random().toString(36).substr(2, 9), name: f.trim(), amount: 1, unit: 'g' }] }); setF(''); }} className="bg-purple-600 text-white px-8 rounded-2xl font-black shadow-lg">Ajouter</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(settings.foodPortions || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
              {eI === p.id ? (<div className="flex-1 flex gap-2"><input className="flex-1 p-2 border rounded-lg font-bold" value={eN} onChange={e => setEN(e.target.value)} /><button onClick={() => { setSettings(prev => ({ ...prev, foodPortions: prev.foodPortions.map(x => x.id === p.id ? { ...x, name: eN.trim() } : x) })); setEI(null); }} className="text-green-500 font-bold">✓</button></div>) : (<><span className="flex-1 font-bold text-gray-700">{p.name}</span><div className="flex gap-2"><button onClick={() => { setEI(p.id); setEN(p.name); }} className="text-gray-300 hover:text-purple-600"><EXT_ICONS.Edit /></button><button onClick={() => setSettings({ ...settings, foodPortions: settings.foodPortions.filter(x => x.id !== p.id) })} className="text-red-400 font-bold text-xl">×</button></div></>)}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-[32px] border shadow-sm p-8 space-y-6">
        <h3 className="text-xl font-black">🔄 Données & Synchronisation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={exportToJSON} className="bg-purple-600 text-white p-6 rounded-3xl font-black shadow-lg">Exporter (JSON)</button>
          <label className="bg-white text-purple-600 p-6 rounded-3xl font-black border-2 border-dashed border-purple-100 cursor-pointer text-center">Importer (JSON)<input type="file" accept=".json" className="hidden" onChange={importFromJSON} /></label>
          <button onClick={exportToExcel} className="bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg">Exporter Excel (Stocks)</button>
          <label className="bg-white text-green-600 p-6 rounded-3xl font-black border-2 border-dashed border-green-100 cursor-pointer text-center">Importer Excel<input type="file" accept=".xlsx, .xls" className="hidden" onChange={importFromExcel} /></label>
        </div>
      </div>
      <div className="pt-8"><button onClick={() => confirm('Effacer vos données ?') && (localStorage.clear(), window.location.reload())} className="w-full py-6 border-2 border-red-50 text-red-400 font-black rounded-[40px] hover:bg-red-50 transition-all uppercase tracking-widest">Réinitialiser l'application</button></div>
    </div>
  );
}