import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion } from './types';
import { CATEGORIES, DIETARY_OPTIONS, FOOD_CATEGORIES } from './constants';

// Extend ICONS
const ICONS = {
  Book: () => <span>📖</span>,
  Search: () => <span>🔍</span>,
  Calendar: () => <span>📅</span>,
  Cart: () => <span>🛒</span>,
  Settings: () => <span>⚙️</span>
};

const EXT_ICONS = {
  ...ICONS,
  Recurring: () => <span>🔄</span>,
  Box: () => <span>📦</span>,
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
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
};

interface PantryGroup {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

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
  
  const [mealPlan, setMealPlan] = useState<Record<string, MealPlanDay>>(() => {
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
      foodCategories: FOOD_CATEGORIES,
      foodPortions: [
        { id: '1', name: 'Pomme', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '2', name: 'Banane', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '3', name: 'Carotte', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '4', name: 'Tomate', amount: 1, unit: 'g', category: 'Fruit et légumes' },
        { id: '5', name: 'Poulet', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '6', name: 'Bœuf', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '7', name: 'Saumon', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '8', name: 'Colin', amount: 1, unit: 'g', category: 'Viandes et poissons' },
        { id: '9', name: 'Jambon', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '10', name: 'Salami', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '11', name: 'Chorizo', amount: 1, unit: 'g', category: 'Charcuterie' },
        { id: '12', name: 'Salade de pâtes', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '13', name: 'Quiche', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '14', name: 'Pizza', amount: 1, unit: 'g', category: 'Traiteurs' },
        { id: '15', name: 'Baguette', amount: 1, unit: 'g', category: 'Pain' },
        { id: '16', name: 'Pain de mie', amount: 1, unit: 'g', category: 'Pain' },
        { id: '17', name: 'Pain complet', amount: 1, unit: 'g', category: 'Pain' },
        { id: '18', name: 'Yaourt nature', amount: 1, unit: 'g', category: 'Yaourts' },
        { id: '19', name: 'Yaourt aux fruits', amount: 1, unit: 'g', category: 'Yaourts' },
        { id: '20', name: 'Emmental', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '21', name: 'Camembert', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '22', name: 'Chèvre', amount: 1, unit: 'g', category: 'Fromage' },
        { id: '23', name: 'Lait', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '24', name: 'Beurre', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '25', name: 'Œufs', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '26', name: 'Crème fraîche', amount: 1, unit: 'g', category: 'Crèmerie et œufs' },
        { id: '27', name: 'Frites', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '28', name: 'Petits pois', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '29', name: 'Glace', amount: 1, unit: 'g', category: 'Surgelés' },
        { id: '30', name: 'Sucre', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '31', name: 'Chocolat', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '32', name: 'Biscuits', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '33', name: 'Farine', amount: 1, unit: 'g', category: 'Épicerie Sucrées' },
        { id: '34', name: 'Sel', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '35', name: 'Pâtes', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '36', name: 'Riz', amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '37', name: "Huile d'olive", amount: 1, unit: 'g', category: 'Épicerie salées' },
        { id: '38', name: 'Eau', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '39', name: "Jus d'orange", amount: 1, unit: 'g', category: 'Boissons' },
        { id: '40', name: 'Soda', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '41', name: 'Café', amount: 1, unit: 'g', category: 'Boissons' },
        { id: '42', name: 'Savon', amount: 1, unit: 'g', category: 'Hygiène et entretien' },
        { id: '43', name: 'Lessive', amount: 1, unit: 'g', category: 'Hygiène et entretien' },
        { id: '44', name: 'Papier toilette', amount: 1, unit: 'g', category: 'Hygiène et entretien' }
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

  const addRecipe = (r: Recipe) => setRecipes(prev => {
    const index = prev.findIndex(item => item.id === r.id);
    let updated;
    if (index > -1) {
      updated = [...prev];
      updated[index] = r;
    } else {
      updated = [...prev, r];
    }
    return updated.sort((a, b) => a.title.localeCompare(b.title));
  });

  const deleteRecipe = (id: string) => setRecipes(prev => prev.filter(r => r.id !== id));
  
  const updateMealPlan = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => {
    setMealPlan(prev => {
      const day = prev[date] || {};
      if (mealType === 'extra') {
        const field = slot === 'viennoiseries' ? 'viennoiseries' : 'sauces';
        const currentArray = day[field] || [];
        const newArray = [...currentArray];
        if (index !== undefined) {
          newArray[index] = recipeId || '';
        }
        return {
          ...prev,
          [date]: {
            ...day,
            [field]: newArray
          }
        };
      }
      const meal = day[mealType as 'lunch' | 'dinner'] || {};
      return {
        ...prev,
        [date]: {
          ...day,
          [mealType as 'lunch' | 'dinner']: {
            ...meal,
            [slot as 'recipe1' | 'recipe2']: recipeId
          }
        }
      };
    });
    const mealKey = mealType === 'extra' ? `${date}-${slot}-${index}` : `${date}-${mealType}-${slot}`;
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

    // Sheet 3: Aliments
    const foodData = (settings.foodPortions || []).map(item => ({
      Aliment: item.name,
      Catégorie: item.category || "Sans catégorie"
    }));
    const wsFood = XLSX.utils.json_to_sheet(foodData);
    XLSX.utils.book_append_sheet(workbook, wsFood, "Aliments");

    XLSX.writeFile(workbook, "culinashare_stocks.xlsx");
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

        // Process Aliments
        if (wb.SheetNames.includes("Aliments")) {
          const ws = wb.Sheets["Aliments"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          setSettings(prev => {
            const updatedFoodPortions = [...(prev.foodPortions || [])];
            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || "").toString().trim();
              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || "").toString().trim();
              if (!foodName) return;
              
              const exists = updatedFoodPortions.find(f => f.name.toLowerCase() === foodName.toLowerCase());
              if (!exists) {
                updatedFoodPortions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: foodName,
                  amount: 1,
                  unit: 'g',
                  category: category === "Sans catégorie" ? undefined : category
                });
              } else if (category && category !== "Sans catégorie") {
                // Update category if it exists but was empty or different
                exists.category = category;
              }
            });
            return { ...prev, foodPortions: updatedFoodPortions };
          });
        }

        alert("Données Excel importées !");
      } catch (err) {
        alert("Erreur lors de la lecture du fichier Excel.");
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
            mealPlan={mealPlan}
            addRecipe={addRecipe} 
            deleteRecipe={deleteRecipe}
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
            mealPlan={mealPlan}
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
              mergeToShoppingList(items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) })));
              setActiveTab('shopping');
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
            setReserveItems={setReserveItems}
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:sticky md:top-0 md:h-screen md:flex-col md:w-64 md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto no-scrollbar">
      <div className="hidden md:block mb-8 text-2xl font-black text-purple-600 px-4">Gestion cuisine</div>
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

// --- InStockView (En réserve) ---

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

      {/* Manual Add Form */}
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
              <option value="boite">boite</option>
              <option value="C.à S">C.à S</option>
              <option value="cl">cl</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="paquet">paq.</option>
              <option value="pièce">pc.</option>
              <option value="tranche">tr.</option>
              <option value="unité">u.</option>
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
};

const RecipeBook: React.FC<{ 
  recipes: Recipe[]; 
  mealPlan: Record<string, MealPlanDay>;
  addRecipe: (r: Recipe) => void; 
  deleteRecipe: (id: string) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ recipes, mealPlan, addRecipe, deleteRecipe, onAddToShopping, foodPortions, onAddFoodToSettings, updateMealPlan, setSentMeals }) => {
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  const filtered = (recipes || []).filter(r => 
    (selectedCat === 'Tous' || r.category === selectedCat) && 
    (r.title || "").toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const handleEdit = (e: React.MouseEvent, r: Recipe) => {
    e.stopPropagation();
    setEditingRecipe(r);
    setIsAdding(true);
  };

  if (isAdding) return (
    <RecipeForm 
      onSave={(r) => { addRecipe(r); setIsAdding(false); setEditingRecipe(null); }} 
      onDelete={(id) => { deleteRecipe(id); setIsAdding(false); setEditingRecipe(null); }}
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

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} recipes={recipes} mealPlan={mealPlan} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
};

const RecipeDetail: React.FC<{ 
  recipe: Recipe; 
  recipes: Recipe[];
  mealPlan: Record<string, MealPlanDay>;
  onClose: () => void; 
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ recipe, recipes, mealPlan, onClose, onAddToShopping, updateMealPlan, setSentMeals }) => {
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
    let existingId: string | undefined;
    if (mealType === 'extra') {
      existingId = mealPlan[planDate]?.[slotType as 'viennoiseries' | 'sauces']?.[extraIndex];
    } else {
      existingId = mealPlan[planDate]?.[mealType as 'lunch' | 'dinner']?.[slotType as 'recipe1' | 'recipe2'];
    }
    if (existingId && existingId !== recipe.id) {
      const existing = recipes.find(r => r.id === existingId);
      setConflict({ existingRecipeTitle: existing?.title || 'Inconnue' });
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
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">{recipe.title}</h2>
              <div className="flex gap-2">
                {recipe.tags?.includes('TM7') && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-sm">TM7</span>}
              </div>
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

            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-3xl">
              <span className="font-black text-sm text-purple-600">Portions :</span>
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-8 h-8 bg-white rounded-lg font-black">-</button>
              <span className="font-black w-8 text-center">{servings}</span>
              <button onClick={() => setServings(s => s + 1)} className="w-8 h-8 bg-white rounded-lg font-black">+</button>
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
                  const dateStr = d.toISOString().split('T')[0];
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/50 p-4 rounded-[32px] border border-gray-100 space-y-3">
                      <p className="text-[10px] font-black text-center uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      {(['lunch', 'dinner'] as const).map(type => 
                        (['recipe1', 'recipe2'] as const).map(slot => {
                          const existingId = mealPlan[dateStr]?.[type]?.[slot];
                          const isOccupied = !!existingId;
                          const isCurrentRecipe = existingId === recipe.id;

                          return (
                            <button
                              key={`${type}-${slot}`}
                              disabled={isOccupied && !isCurrentRecipe}
                              onClick={() => {
                                if (isCurrentRecipe) return;
                                updateMealPlan(dateStr, type, slot, recipe.id);
                                setShowAvailability(false);
                              }}
                              className={`w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1
                                ${isCurrentRecipe ? 'bg-green-100 border-green-200 text-green-600 cursor-default' : 
                                  isOccupied ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50' : 
                                  type === 'lunch' ? 'bg-white border-pink-100 text-pink-500 hover:bg-pink-50 hover:scale-[1.02] shadow-sm' :
                                  'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-[1.02] shadow-sm'}
                              `}
                            >
                              <span>{type === 'lunch' ? 'Midi' : 'Soir'} {slot === 'recipe1' ? '1' : '2'}</span>
                              {isCurrentRecipe ? 'Déjà ici' : isOccupied ? 'Occupé' : 'Disponible'}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
              
              {(() => {
                const isAlreadyInWeek = Array.from({ length: 7 }, (_, j) => {
                  const dj = new Date(availabilityWeekDate);
                  dj.setDate(availabilityWeekDate.getDate() + j);
                  const djStr = dj.toISOString().split('T')[0];
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

const RecipeForm: React.FC<{ 
  onSave: (r: Recipe) => void; 
  onDelete?: (id: string) => void;
  onCancel: () => void;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  initialData?: Recipe;
}> = ({ onSave, onDelete, onCancel, foodPortions, onAddFoodToSettings, initialData }) => {
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
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">⏲️ Préparation (min)</label>
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.prepTime} onChange={e => setFormData({ ...formData, prepTime: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">🔥 Cuisson (min)</label>
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.cookTime} onChange={e => setFormData({ ...formData, cookTime: Number(e.target.value) })} />
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
              <input type="number" className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black text-purple-600 outline-none" value={formData.servings} onChange={e => setFormData({ ...formData, servings: Number(e.target.value) })} />
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
                className="col-span-3 p-3.5 border border-gray-100 rounded-xl bg-gray-50 font-bold text-[10px] outline-none" 
                value={pendingIng.unit} 
                onChange={e => setPendingIng({ ...pendingIng, unit: e.target.value })}
              >
                <option value="boite">boite</option>
                <option value="C.à C">C.à C</option>
                <option value="C.à S">C.à S</option>
                <option value="cl">cl</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="unité">u.</option>
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
                  {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
                </datalist>
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

const RecipeSearch: React.FC<{ 
  recipes: Recipe[]; 
  mealPlan: Record<string, MealPlanDay>;
  addRecipe: (r: Recipe) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  foodPortions: FoodPortion[];
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ recipes, mealPlan, addRecipe, onAddToShopping, updateMealPlan, foodPortions, setSentMeals }) => {
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

  const appliances = ['Standard', 'Thermomix TM7'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black text-center text-gray-800 tracking-tight">Recherche par Ingrédients</h2>
      
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
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ingrédients à disposition</p>
          <div className="flex gap-2 flex-wrap min-h-[40px]">{(ingredients || []).map(i => <span key={i} className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-100 flex items-center gap-2">{i} <button onClick={() => setIngredients(ingredients.filter(x => x !== i))} className="hover:text-red-500 transition-colors">×</button></span>)}</div>
          <div className="flex gap-2">
            <input 
              list="food-suggestions-search"
              className="flex-1 border-gray-100 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-200 font-bold" 
              placeholder="Ajouter un ingrédient..." 
              value={inputIng} 
              onChange={e => setInputIng(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && (inputIng && (setIngredients([...ingredients, inputIng]), setInputIng('')))} 
            />
            <datalist id="food-suggestions-search">
              {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
            </datalist>
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
                   {r.imageUrl ? (
                     <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.title} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>
                   )}
                   <div className="absolute top-4 left-4">
                     {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                   </div>
                 </div>
                 <div className="p-4">
                   <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span>
                   <h3 className="text-sm font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3>
                 </div>
              </div>
           ))}
        </div>
      )}

      {results.length === 0 && !loading && ingredients.length > 0 && (
        <p className="text-center text-gray-400 italic">Aucune recette ne correspond à ces ingrédients dans votre bibliothèque.</p>
      )}

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} recipes={recipes} mealPlan={mealPlan} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} />}
    </div>
  );
};

const RecurringView: React.FC<{ 
  groups: PantryGroup[]; 
  setGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  onSendToShopping: (items: ShoppingListItem[]) => void;
}> = ({ groups, setGroups, foodPortions, onAddFoodToSettings, onSendToShopping }) => {
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
    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      amount: newItemAmount,
      unit: newItemUnit,
      checked: false
    };
    // Trier automatiquement lors de l'ajout
    setTempItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemAmount(1);
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
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Récurrents</h2>
        {!isAddingList && (
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
                     <option value="boite">boite</option>
                     <option value="C.à S">C.à S</option>
                     <option value="cl">cl</option>
                     <option value="g">g</option>
                     <option value="kg">kg</option>
                     <option value="L">L</option>
                     <option value="ml">ml</option>
                     <option value="unité">u.</option>
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
                      {group.items.filter(i => !i.checked).length}/{group.items.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSendToShopping(group.items.filter(i => !i.checked))}
                      className="text-purple-600 p-2 hover:bg-purple-100 rounded-xl transition-all"
                      title="Envoyer les articles non cochés aux courses"
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
                           className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
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
                   onClick={() => onSendToShopping(group.items.filter(i => !i.checked))}
                   className="w-full bg-purple-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   🚀 Envoyer aux courses ({group.items.filter(i => !i.checked).length})
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
    </div>
  );
};

const Planning: React.FC<{ 
  mealPlan: Record<string, MealPlanDay>; 
  recipes: Recipe[]; 
  updateMealPlan: (d: string, t: 'lunch' | 'dinner' | 'extra', s: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', r: string | undefined, index?: number) => void;
  onMergeToShopping: (items: ShoppingListItem[]) => void;
  sentMeals: Set<string>;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ mealPlan, recipes, updateMealPlan, onMergeToShopping, sentMeals, setSentMeals }) => {
  const [showSummary, setShowSummary] = useState(false);
  
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    // Start on Saturday (6)
    const diff = d.getDate() - (day === 6 ? 0 : day + 1);
    return new Date(d.setDate(diff));
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return d;
  });

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => a.title.localeCompare(b.title));
  }, [recipes]);

  const handleSendRecipe = (date: string, type: 'lunch' | 'dinner', slot: 'recipe1' | 'recipe2', recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const mealKey = `${date}-${type}-${slot}`;
    if (sentMeals.has(mealKey)) return;

    const items: ShoppingListItem[] = recipe.ingredients.map(ing => ({
      id: Math.random().toString(36).substr(2, 9),
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      checked: false
    }));
    
    onMergeToShopping(items);
    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  // NOUVELLE FONCTION : TOUT ENVOYER AUX COURSES
  const handleSendAll = () => {
    let allItems: any[] = [];
    const newSentMeals = new Set(sentMeals);
    let addedCount = 0;

    days.forEach(d => {
      const key = d.toISOString().split('T')[0];
      const plan = mealPlan[key];
      if (!plan) return;

      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;

        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) {
            const recipe = recipes.find((r: any) => r.id === recipeId);
            if (recipe) {
              const items = recipe.ingredients.map((ing: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: ing.amount,
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

      // Extras: Viennoiseries & Sauces (only for Sunday to avoid duplicates in week)
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) {
              const recipe = recipes.find((r: any) => r.id === recipeId);
              if (recipe) {
                const items = recipe.ingredients.map((ing: any) => ({
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

    if (addedCount > 0) {
      onMergeToShopping(allItems);
      setSentMeals(newSentMeals);
      alert(`${addedCount} repas envoyé(s) aux courses !`);
    } else {
      alert("Tous les repas de cette semaine ont déjà été envoyés.");
    }
    setShowSummary(false); // Ferme la fenêtre après l'envoi
  };

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

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Mon Planning</h2>
          <div className="flex items-center gap-4 mt-2 bg-purple-50 p-2 rounded-2xl border border-purple-100">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-purple-100 rounded-xl transition-all text-purple-600">
              <EXT_ICONS.ArrowLeft />
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 min-w-[180px] text-center">
              {formatWeekRange(baseDate)}
            </span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-purple-100 rounded-xl transition-all text-purple-600">
              <EXT_ICONS.ArrowRight />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowSummary(true)} 
          className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-purple-100 w-full sm:w-auto"
        >
          Générer Courses
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map(d => {
          const key = d.toISOString().split('T')[0];
          return (
            <div key={key} className={`bg-white p-6 border rounded-[32px] shadow-sm hover:shadow-md transition-all ${((mealPlan[key]?.lunch && sentMeals.has(`${key}-lunch`)) || (mealPlan[key]?.dinner && sentMeals.has(`${key}-dinner`))) ? 'border-green-100 bg-green-50/10' : 'border-gray-100'}`}>
              <p className="text-center font-black text-sm uppercase tracking-widest text-purple-600 mb-4 border-b pb-2">
                {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-4">
                {(['lunch', 'dinner'] as const).map(type => (
                  <div key={type} className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      {type === 'lunch' ? 'Déjeuner' : 'Dîner'}
                    </label>
                    <div className="space-y-2 pl-2 border-l-2 border-purple-100">
                      {(['recipe1', 'recipe2'] as const).map((slot, idx) => (
                        <div key={slot} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest ml-1">
                              Recette {idx + 1}
                            </span>
                            {mealPlan[key]?.[type]?.[slot] && sentMeals.has(`${key}-${type}-${slot}`) && (
                              <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                            )}
                          </div>
                          <select 
                            className={`w-full text-[10px] font-bold bg-gray-50 p-2 rounded-xl border transition-all ${mealPlan[key]?.[type]?.[slot] && sentMeals.has(`${key}-${type}-${slot}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-purple-200'}`}
                            value={mealPlan[key]?.[type]?.[slot] || ''}
                            onChange={e => updateMealPlan(key, type, slot, e.target.value || undefined)}
                          >
                            <option value="">Vide</option>
                            {sortedRecipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {(() => {
          const sunday = days[6];
          const key = sunday.toISOString().split('T')[0];
          return (
            <>
              {/* Viennoiserie Card */}
              <div className="bg-white p-6 border border-pink-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                <p className="text-center font-black text-sm uppercase tracking-widest text-pink-500 mb-4 border-b border-pink-50 pb-2">
                  Viennoiseries et Gâteaux
                </p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                        {mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) && (
                          <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                        )}
                      </div>
                      <select 
                        className={`w-full text-[10px] font-bold bg-pink-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.viennoiseries?.[i] && sentMeals.has(`${key}-viennoiseries-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-pink-200'}`}
                        value={mealPlan[key]?.viennoiseries?.[i] || ''}
                        onChange={e => updateMealPlan(key, 'extra', 'viennoiseries', e.target.value || undefined, i)}
                      >
                        <option value="">Vide</option>
                        {sortedRecipes.filter(r => r.category === 'Viennoiserie' || r.category === 'Gâteaux').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sauce Card */}
              <div className="bg-white p-6 border border-blue-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                <p className="text-center font-black text-sm uppercase tracking-widest text-blue-500 mb-4 border-b border-blue-50 pb-2">
                  Sauces et Coulis
                </p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">#{i + 1}</span>
                        {mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) && (
                          <span className="text-green-500 scale-75"><EXT_ICONS.Check /></span>
                        )}
                      </div>
                      <select 
                        className={`w-full text-[10px] font-bold bg-blue-50/30 p-2 rounded-xl border transition-all ${mealPlan[key]?.sauces?.[i] && sentMeals.has(`${key}-sauces-${i}`) ? 'border-green-400 ring-1 ring-green-100' : 'border-transparent focus:border-blue-200'}`}
                        value={mealPlan[key]?.sauces?.[i] || ''}
                        onChange={e => updateMealPlan(key, 'extra', 'sauces', e.target.value || undefined, i)}
                      >
                        <option value="">Vide</option>
                        {sortedRecipes.filter(r => r.category === 'Sauce' || r.category === 'Coulis').map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* MODAL RÉCAPITULATIF PLANNING */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl space-y-8 animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800">Recettes au Planning</h3>
                <div className="flex items-center gap-2 mt-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
                    <EXT_ICONS.ArrowLeft />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[140px] text-center">
                    {formatWeekRange(baseDate)}
                  </span>
                  <button onClick={() => changeWeek(1)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
                    <EXT_ICONS.ArrowRight />
                  </button>
                </div>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200">×</button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {days.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const plan = mealPlan[dateStr];
                if (!plan) return null;

                const hasAny = (['lunch', 'dinner'] as const).some(type => 
                  (['recipe1', 'recipe2'] as const).some(slot => plan[type]?.[slot])
                ) || plan.viennoiseries?.some(v => v) || plan.sauces?.some(s => s);
                if (!hasAny) return null;

                return (
                  <div key={dateStr} className="space-y-3">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest border-b pb-1">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}</p>
                    <div className="space-y-4">
                      {(['lunch', 'dinner'] as const).map(type => {
                        const meal = plan[type];
                        if (!meal) return null;
                        const hasMeal = (['recipe1', 'recipe2'] as const).some(slot => meal[slot]);
                        if (!hasMeal) return null;

                        return (
                          <div key={type} className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-gray-400 block ml-2">{type === 'lunch' ? 'Midi' : 'Soir'}</span>
                            <div className="space-y-2">
                              {(['recipe1', 'recipe2'] as const).map((slot, idx) => {
                                const recipeId = meal[slot];
                                if (!recipeId) return null;
                                const r = recipes.find(rec => rec.id === recipeId);
                                if (!r) return null;

                                return (
                                  <div key={slot} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[7px] font-black uppercase text-purple-400 block mb-0.5">Recette {idx + 1}</span>
                                      <span className="font-bold text-gray-700 text-sm truncate block">{r.title}</span>
                                    </div>
                                    {sentMeals.has(`${dateStr}-${type}-${slot}`) ? (
                                      <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                        <EXT_ICONS.Check /> Envoyé
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => handleSendRecipe(dateStr, type, slot, r.id)} 
                                        className="bg-purple-600 text-white p-2 rounded-xl hover:scale-105 transition-all shadow-sm shrink-0"
                                      >
                                        <EXT_ICONS.Cart />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Extras in Summary */}
                      {(['viennoiseries', 'sauces'] as const).map(slot => {
                        const recipeIds = plan[slot] || [];
                        return recipeIds.map((recipeId, index) => {
                          if (!recipeId) return null;
                          const r = recipes.find(rec => rec.id === recipeId);
                          if (!r) return null;

                          return (
                            <div key={`${slot}-${index}`} className={`flex justify-between items-center p-3 rounded-2xl border ${slot === 'viennoiseries' ? 'bg-pink-50 border-pink-100' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex-1 min-w-0">
                                <span className={`text-[7px] font-black uppercase block mb-0.5 ${slot === 'viennoiseries' ? 'text-pink-400' : 'text-blue-400'}`}>{slot === 'viennoiseries' ? 'Viennoiserie et Gâteau' : 'Sauce et Coulis'} #{index + 1}</span>
                                <span className="font-bold text-gray-700 text-sm truncate block">{r.title}</span>
                              </div>
                              {sentMeals.has(`${dateStr}-${slot}-${index}`) ? (
                                <span className="bg-green-100 text-green-600 p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black shrink-0">
                                  <EXT_ICONS.Check /> Envoyé
                                </span>
                              ) : (
                                <button 
                                  onClick={() => {
                                    const items = r.ingredients.map(ing => ({
                                      id: Math.random().toString(36).substr(2, 9),
                                      name: ing.name,
                                      amount: ing.amount,
                                      unit: ing.unit,
                                      checked: false
                                    }));
                                    onMergeToShopping(items);
                                    setSentMeals(prev => new Set(prev).add(`${dateStr}-${slot}-${index}`));
                                  }} 
                                  className={`p-1.5 rounded-xl text-[10px] font-black transition-all shrink-0 ${slot === 'viennoiseries' ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                >
                                  Envoyer
                                </button>
                              )}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LES DEUX BOUTONS : FERMER ET TOUT ENVOYER */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowSummary(false)} className="w-full p-4 bg-gray-100 text-gray-700 rounded-3xl font-black transition-all hover:bg-gray-200">Fermer</button>
              <button onClick={handleSendAll} className="w-full p-4 bg-purple-600 text-white rounded-3xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">🚀 Tout envoyer aux courses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingView: React.FC<{ 
  list: ShoppingListItem[]; 
  setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; 
  settings: UserSettings;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string) => void;
  reserveItems: ShoppingListItem[];
  setReserveItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
}> = ({ list, setList, settings, foodPortions, onAddFoodToSettings, reserveItems, setReserveItems }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [checkedSummaryItems, setCheckedSummaryItems] = useState<Set<string>>(new Set());
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const toggle = (id: string) => setList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setList(prev => prev.filter(i => i.id !== id));
  
  const updateAmount = (id: string, newAmount: number) => {
    setList(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));
  };

  const updateReserveAmount = (id: string, newAmount: number) => {
    setReserveItems(prev => prev.map(i => i.id === id ? { ...i, amount: newAmount } : i));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    const unit = newItemUnit;

    onAddFoodToSettings(name, unit);

    const item: ShoppingListItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: newItemAmount,
      unit,
      checked: false
    };
    setList(prev => [item, ...prev]);
    setNewItemName('');
    setNewItemAmount(1);
  };

  useEffect(() => {
    const portions = foodPortions || [];
    const match = portions.find(p => p.name.toLowerCase() === newItemName.toLowerCase());
    if (match) setNewItemUnit(match.unit);
  }, [newItemName, foodPortions]);

  // Tri alphabétique automatique pour la liste de courses
  const sortedShoppingList = useMemo(() => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const consolidatedList = useMemo(() => {
    const map = new Map<string, ShoppingListItem>();
    (list || []).forEach(item => {
      const key = `${item.name.toLowerCase()}_${item.unit.toLowerCase()}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.amount += item.amount;
      } else {
        map.set(key, { ...item, id: Math.random().toString(36).substr(2, 9) });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  const toggleSummaryCheck = (id: string) => {
    const next = new Set(checkedSummaryItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedSummaryItems(next);
  };

  const groupedConsolidatedList = useMemo(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    consolidatedList.forEach(item => {
      const portion = foodPortions.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      const cat = portion?.category || 'Autres';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [consolidatedList, foodPortions]);

  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 px-2 relative transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="sticky top-0 z-30 bg-purple-50/95 backdrop-blur-sm py-4 -mx-2 px-4 sm:px-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Gestion Courses</h2>
            <p className="text-sm font-bold text-purple-400 mt-1 uppercase tracking-widest">
              {(list || []).filter(i => !i.checked).length}/{(list || []).length} articles en attente
            </p>
          </div>
          <button 
            onClick={() => setConfirmClearAll(true)} 
            className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            Tout effacer
          </button>
        </div>
      </div>

      {/* Manual Add Form */}
      <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Ajout rapide</p>
          <button 
            onClick={() => setShowReserveOnSide(!showReserveOnSide)}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${showReserveOnSide ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50'}`}
          >
            {showReserveOnSide ? 'Cacher la réserve' : 'Voir la réserve'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              type="text" 
              list="food-suggestions-shopping"
              placeholder="Ex: Beurre, Farine..."
              className="w-full p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-purple-200"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddItem()}
            />
            <datalist id="food-suggestions-shopping">
              {(foodPortions || []).map(fp => <option key={fp.id} value={fp.name} />)}
            </datalist>
          </div>
          <div className="flex gap-2">
            <input type="number" className="w-20 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-black text-center text-purple-600 outline-none" value={newItemAmount} onChange={e => setNewItemAmount(Number(e.target.value))} />
            <select className="w-24 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-500 outline-none cursor-pointer" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
              <option value="boite">boite</option>
              <option value="C.à C">C.à C</option>
              <option value="C.à S">C.à S</option>
              <option value="cl">cl</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pièce">pc.</option>
              <option value="tranche">tr.</option>
              <option value="unité">u.</option>
            </select>
            <button onClick={handleAddItem} className="bg-purple-600 text-white p-3.5 rounded-2xl font-black shadow-lg shadow-purple-100 active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${showReserveOnSide ? 'lg:flex-row' : ''} gap-8`}>
        {/* Main Shopping List */}
        <div className="flex-1 bg-white border border-gray-50 rounded-[40px] divide-y divide-gray-50 shadow-sm overflow-hidden">
          {(list || []).length === 0 ? (
            <div className="p-20 text-center text-gray-300 italic font-medium">Liste vide.</div>
          ) : (
            sortedShoppingList.map(i => (
              <div key={i.id} className={`p-5 flex gap-5 items-center transition-all ${i.checked ? 'bg-green-50/20' : ''}`}>
                <div onClick={() => toggle(i.id)} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                  {i.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <p className={`flex-1 font-bold text-lg ${i.checked ? 'line-through text-gray-300' : 'text-gray-800'}`}>{i.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input 
                    type="number"
                    className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                    value={i.amount}
                    onChange={(e) => updateAmount(i.id, Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                  />
                  <span className={`text-[10px] font-black ${i.checked ? 'text-gray-300' : 'text-purple-400'}`}>{i.unit}</span>
                </div>
                <button onClick={() => remove(i.id)} className="text-gray-200 hover:text-red-400 transition-colors font-bold text-xl ml-2">×</button>
              </div>
            ))
          )}
        </div>

        {/* Side Reserve List */}
        {showReserveOnSide && (
          <div className="w-full lg:w-80 bg-white border border-purple-50 rounded-[40px] shadow-sm flex flex-col animate-slideInRight h-fit max-h-[600px] overflow-hidden">
            <div className="p-6 bg-purple-50/30 border-b border-purple-50">
              <h3 className="text-lg font-black text-purple-600 uppercase tracking-tight">Ma Réserve</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Consultation rapide</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
              {(reserveItems || []).length === 0 ? (
                <div className="p-8 text-center text-gray-300 italic text-sm">Réserve vide.</div>
              ) : (
                [...reserveItems].sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-purple-50/20 transition-colors">
                    <span className="font-bold text-gray-700 text-sm flex-1">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input 
                        type="number"
                        className="w-12 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                        value={item.amount}
                        onChange={(e) => updateReserveAmount(item.id, Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="text-[10px] font-black text-purple-400">{item.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(list || []).length > 0 && !showSummary && (
        <div className="fixed bottom-24 left-0 right-0 p-6 md:relative md:bottom-0 md:p-0 flex justify-center z-40">
          <button onClick={() => { setCheckedSummaryItems(new Set()); setShowSummary(true); }} className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-green-100 hover:scale-105 transition-all active:scale-95">
             🚀 Consolider & Finaliser
          </button>
        </div>
      )}

      {/* MODAL RÉCAPITULATIF FINAL */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-10 pb-24">
             <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-4 pb-8 flex justify-between items-center border-b -mx-6 px-6">
               <div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">Récapitulatif</h2>
                 <p className="text-sm font-bold text-green-600 mt-1 uppercase tracking-widest">
                   {checkedSummaryItems.size}/{consolidatedList.length} articles validés
                 </p>
               </div>
               <button onClick={() => setShowSummary(false)} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-all">×</button>
             </header>

             <div className="space-y-8">
                {(settings.foodCategories || FOOD_CATEGORIES).map(cat => {
                  const items = groupedConsolidatedList[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest border-b border-purple-100 pb-2 px-2">{cat}</h3>
                      <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                        {items.map(item => (
                          <div key={item.id} className="p-6 flex items-center transition-all">
                            <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                               {checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`flex-1 font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span>
                            <span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>{item.amount} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Autres catégories */}
                {groupedConsolidatedList['Autres'] && groupedConsolidatedList['Autres'].length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 px-2">Autres</h3>
                    <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                      {groupedConsolidatedList['Autres'].map(item => (
                        <div key={item.id} className="p-6 flex items-center transition-all">
                          <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                             {checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`flex-1 font-bold text-xl ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span>
                          <span className={`font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>{item.amount} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="pt-8 space-y-4">
                <button 
                  onClick={() => {
                    setList([]);
                    setShowSummary(false);
                  }} 
                  className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  🚀 Vider la liste
                </button>
                <button 
                  onClick={() => setShowSummary(false)} 
                  className="w-full bg-gray-100 text-gray-500 p-6 rounded-3xl font-black hover:bg-gray-200 transition-all"
                >
                  Revenir à ma liste
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION TOUT EFFACER */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-sm w-full shadow-2xl space-y-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-800">Vider toute la liste ?</h3>
            <p className="text-gray-500 font-medium">Cette action supprimera tous les articles de votre liste de courses.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmClearAll(false)} className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-all">Annuler</button>
              <button 
                onClick={() => {
                  setList([]);
                  setConfirmClearAll(false);
                }} 
                className="flex-1 p-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings: React.FC<{ 
  settings: UserSettings; 
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  exportToJSON: () => void;
  importFromJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportToExcel: () => void;
  importFromExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ settings, setSettings, exportToJSON, importFromJSON, exportToExcel, importFromExcel }) => {
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

  const currentCategories = settings.foodCategories || FOOD_CATEGORIES;

  const toggleSection = (id: string) => setActiveSection(activeSection === id ? null : id);

  const startEditFood = (food: FoodPortion) => {
    setEditingFoodId(food.id);
    setEditingName(food.name);
  };

  const saveFoodName = (id: string) => {
    if (!editingName.trim()) return;
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).map(f => f.id === id ? { ...f, name: editingName.trim() } : f)
    }));
    setEditingFoodId(null);
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
    setSettings(prev => ({
      ...prev,
      foodPortions: (prev.foodPortions || []).map(f => f.id === foodId ? { ...f, category: category === 'none' ? undefined : category } : f)
    }));
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
    
    setSettings(prev => ({
      ...prev,
      foodPortions: [...(prev.foodPortions || []), { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        amount: 1, 
        unit: 'g',
        category 
      }]
    }));
    
    setNewCategoryFoodNames(prev => ({ ...prev, [category]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-black text-gray-800 text-center tracking-tight mb-8">Réglages</h2>
      
      <div className="space-y-4">
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
                            category: newFoodCategory === 'none' ? undefined : newFoodCategory
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
                        .filter(p => !p.category)
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
                              value="none"
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
                          <div key={p.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
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
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-8">
        <button onClick={() => confirm('Effacer vos données ?') && (localStorage.clear(), window.location.reload())} className="w-full py-6 border-2 border-red-50 text-red-400 font-black rounded-[40px] hover:bg-red-50 transition-all">Réinitialiser l'application</button>
      </div>
    </div>
  );
};