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
import { SupabaseStatus, StorageMode } from '../utils/supabaseClient';

// --- Components ---

export const Navbar: React.FC<{ 
  activeTab: AppTab; 
  setActiveTab: (t: AppTab) => void; 
  onQuickBackup: () => void;
  storageMode?: StorageMode;
  supabaseStatus?: SupabaseStatus;
  onOpenStorageSettings?: () => void;
}> = ({ 
  activeTab, 
  setActiveTab, 
  onQuickBackup,
  storageMode = 'localstorage',
  supabaseStatus = 'local',
  onOpenStorageSettings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('culina_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false; // Default false (déplié par défaut)
  });

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('culina_sidebar_collapsed', JSON.stringify(nextValue));
  };

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipes', label: 'Recettes', icon: <EXT_ICONS.Book /> },
    { id: 'search', label: 'Recherche', icon: <EXT_ICONS.Search /> },
    { id: 'planning', label: 'Planning', icon: <EXT_ICONS.Calendar /> },
    { id: 'recurring', label: "Récurrents", icon: <EXT_ICONS.Recurring /> },
    { id: 'reserve', label: "En réserve", icon: <EXT_ICONS.Box /> },
    { id: 'shopping', label: 'Courses', icon: <EXT_ICONS.Cart /> },
    { id: 'settings', label: 'Réglages', icon: <EXT_ICONS.Settings /> },
    { id: 'notice', label: 'Notice', icon: <EXT_ICONS.Info /> },
  ];

  const handleBadgeClick = () => {
    if (onOpenStorageSettings) {
      onOpenStorageSettings();
    } else {
      setActiveTab('settings');
    }
  };

  // Rendu du badge de statut de stockage (Gris pour LocalStorage, Vert pour Supabase connecté, Rouge pour Supabase déconnecté)
  const renderStorageBadge = (isMobile = false) => {
    const isSupabase = storageMode === 'supabase';
    const isConnected = supabaseStatus === 'connected';
    const isConnecting = supabaseStatus === 'connecting';

    let badgeBg = 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
    let dotColor = 'bg-gray-400';
    let statusLabel = 'LocalStorage';
    let tooltip = 'Stockage local actif (LocalStorage)';

    if (isSupabase) {
      if (isConnected) {
        badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
        dotColor = 'bg-emerald-500 animate-pulse';
        statusLabel = 'Supabase Connecté';
        tooltip = 'Supabase en ligne et synchronisé (Vert)';
      } else if (isConnecting) {
        badgeBg = 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
        dotColor = 'bg-amber-500 animate-pulse';
        statusLabel = 'Supabase...';
        tooltip = 'Connexion à Supabase en cours...';
      } else {
        badgeBg = 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200';
        dotColor = 'bg-rose-500';
        statusLabel = 'Supabase Déconnecté';
        tooltip = 'Supabase déconnecté ou erreur de clé / réseau (Rouge)';
      }
    }

    if (isMobile) {
      return (
        <button
          type="button"
          onClick={handleBadgeClick}
          title={tooltip}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer shrink-0 shadow-2xs ${badgeBg}`}
        >
          <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
          <span className="truncate max-w-[80px]">
            {isSupabase ? (isConnected ? 'Supabase' : 'Déconnecté') : 'Local'}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleBadgeClick}
        title={tooltip}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer shadow-2xs ${badgeBg} ${isCollapsed ? 'p-2' : ''}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`}></span>
        {!isCollapsed && (
          <span className="truncate tracking-tight">{statusLabel}</span>
        )}
      </button>
    );
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 md:sticky md:top-0 md:h-screen md:flex-col md:border-t-0 md:bg-purple-100/50 md:p-4 z-50 overflow-x-auto no-scrollbar md:relative transition-all duration-300 ${isCollapsed ? 'md:w-20' : 'md:w-52'}`}>
      {/* Bouton de repliage pour tablette/desktop */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="hidden md:flex absolute top-6 left-3 w-6 h-6 rounded-full bg-purple-600 text-white items-center justify-center shadow-md border border-purple-400 hover:bg-purple-700 hover:scale-110 transition-all cursor-pointer z-[100] text-[10px] font-black"
        title={isCollapsed ? "Déplier la barre de navigation" : "Replier la barre de navigation"}
      >
        {isCollapsed ? "❯" : "❮"}
      </button>

      <div className={`hidden md:block mb-4 text-2xl font-black text-purple-600 px-4 max-w-full text-center ${isCollapsed ? 'truncate' : ''}`}>
        {isCollapsed ? "🍳" : (
          <div className="leading-none space-y-1">
            <div>Gestion</div>
            <div className="text-xl text-purple-500 font-bold">cuisine</div>
          </div>
        )}
      </div>

      {/* Badge de stockage pour Desktop (dans l'encadré principal de la barre de navigation) */}
      <div className="hidden md:block mb-4">
        {renderStorageBadge(false)}
      </div>

      <div className="flex md:flex-col w-full justify-around md:gap-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            title={tab.label}
            className={`flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 ${activeTab === tab.id ? 'text-purple-600 bg-purple-50 md:bg-purple-600 md:text-white shadow-sm' : 'text-gray-400 hover:bg-purple-50/50'}`}
          >
            {tab.icon} 
            <span className={`text-[10px] md:text-sm font-bold whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}

        {/* Badge de stockage pour mobile intégré dans la barre */}
        <div className="flex md:hidden items-center justify-center">
          {renderStorageBadge(true)}
        </div>

        <button 
          onClick={onQuickBackup}
          className="flex flex-col items-center md:flex-row md:gap-4 p-2 md:px-4 md:py-3 rounded-xl transition-all shrink-0 text-blue-600 hover:bg-blue-50 border-2 border-transparent md:mt-4 md:border-blue-100 md:bg-white"
          title="Sauvegarde rapide"
        >
          <span>💾</span>
          <span className={`text-[10px] md:text-xs font-black whitespace-nowrap uppercase tracking-widest ${isCollapsed ? 'md:hidden' : ''}`}>
            Sauvegarde
          </span>
        </button>
      </div>
    </nav>
  );
};
