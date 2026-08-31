import { SearchableSelect } from '../components/SearchableSelect';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion, PortionRule, DietItem, DietCategory, DietRecipe, DietRecipeItem } from '../types';
import { CATEGORIES, DIETARY_OPTIONS, FOOD_CATEGORIES } from '../../constants';

// Extend ICONS
export const ICONS = {
  Book: () => <span>📖</span>,
  Search: () => <span>🔍</span>,
  Calendar: () => <span>📅</span>,
  Cart: () => <span>🛒</span>,
  Settings: () => <span>⚙️</span>
};

export const EXT_ICONS = {
  ...ICONS,
  Recurring: () => <span>🔄</span>,
  Box: () => <span>📦</span>,
  Info: () => <span>ℹ️</span>,
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

export const MASTER_RECIPE_UNITS = [
  'boite(s)',
  'c.à.c',
  'c.à.s',
  'cl',
  'cuillère(s)',
  'g',
  'kg',
  'l',
  'ml',
  'œufs',
  'pièce(s)',
  'pincée(s)',
  'portion(s)',
  'pot(s)',
  'tranche(s)'
];

export const MASTER_PORTION_UNITS = [
  'barquette(s)',
  'bocal(aux)',
  'boîte(s)',
  'boite(s)',
  'bouteille(s)',
  'brique(s)',
  'cl',
  'filet(s)',
  'g',
  'kg',
  'l',
  'ml',
  'œufs',
  'pack(s)',
  'paquet(s)',
  'pièce(s)',
  'plaquette(s)',
  'plateau(x)',
  'portion(s)',
  'pot(s)',
  'sachet(s)',
  'tranche(s)'
];

export const MASTER_UNITS = MASTER_RECIPE_UNITS;

export const getAvailableRecipeUnits = (settings?: UserSettings): string[] => {
  const custom = settings?.customWeightUnits || [];
  const combined = [...MASTER_RECIPE_UNITS, ...custom];
  const seen = new Set<string>();
  const res: string[] = [];
  for (const u of combined) {
    if (u && typeof u === 'string' && u.trim() && !seen.has(u.trim())) {
      seen.add(u.trim());
      res.push(u.trim());
    }
  }
  res.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return res;
};

export const getAvailablePortionUnits = (settings?: UserSettings): string[] => {
  if (settings?.portionUnitsList && settings.portionUnitsList.length > 0) {
    const seen = new Set<string>();
    const res: string[] = [];
    for (const u of settings.portionUnitsList) {
      if (u && typeof u === 'string' && u.trim() && !seen.has(u.trim())) {
        seen.add(u.trim());
        res.push(u.trim());
      }
    }
    res.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    return res;
  }
  const custom = settings?.customPortionUnits || [];
  const combined = [...MASTER_PORTION_UNITS, ...custom];
  const seen = new Set<string>();
  const res: string[] = [];
  for (const u of combined) {
    if (u && typeof u === 'string' && u.trim() && !seen.has(u.trim())) {
      seen.add(u.trim());
      res.push(u.trim());
    }
  }
  res.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return res;
};

export const getAvailableUnits = (settings?: UserSettings): string[] => {
  return getAvailableRecipeUnits(settings);
};

export const DEFAULT_DIET_ROUNDING_UNITS: string[] = ['pot(s)', 'pièce(s)'];

export const getRoundingUnitsList = (settings?: UserSettings): string[] => {
  const portionUnits = getAvailablePortionUnits(settings);
  const recipeUnits = getAvailableRecipeUnits(settings);
  const combined = Array.from(new Set([
    'pot(s)',
    'pièce(s)',
    'œufs',
    'tranche(s)',
    'portion(s)',
    'sachet(s)',
    'boîte(s)',
    'barquette(s)',
    'bouteille(s)',
    'brique(s)',
    'pack(s)',
    'paquet(s)',
    'plaquette(s)',
    'plateau(x)',
    'bocal(aux)',
    'filet(s)',
    'gousse(s)',
    'capsule(s)',
    'pain(s)',
    'tablette(s)',
    'rouleau(x)',
    ...portionUnits,
    ...recipeUnits,
    ...MASTER_PORTION_UNITS,
    ...MASTER_RECIPE_UNITS
  ]));
  combined.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return combined;
};

export const parseWeightAndUnit = (rawWeight: string = '', customUnits: string[] = []): { value: string; unit: string } => {
  if (!rawWeight || !rawWeight.trim()) return { value: '100', unit: 'g' };
  const trimmed = rawWeight.trim();
  const match = trimmed.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
  if (match) {
    const val = match[1].replace(',', '.');
    let rawUnit = match[2]?.trim() || 'g';
    const allUnits = Array.from(new Set([...MASTER_UNITS, ...customUnits]));
    const foundUnit = allUnits.find(u => 
      u.toLowerCase() === rawUnit.toLowerCase() || 
      u.toLowerCase().startsWith(rawUnit.toLowerCase()) ||
      (rawUnit.toLowerCase().startsWith('pi') && u.includes('pièce')) ||
      (rawUnit.toLowerCase().startsWith('port') && u.includes('portion')) ||
      (rawUnit.toLowerCase().startsWith('c') && u.includes('c.à'))
    ) || rawUnit || 'g';
    return { value: val, unit: foundUnit };
  }
  return { value: '100', unit: 'g' };
};

export const UNIT_CONVERSIONS: Record<string, { dimension: 'mass' | 'volume'; factorToBase: number }> = {
  // Masse (base = g)
  'g': { dimension: 'mass', factorToBase: 1 },
  'gr': { dimension: 'mass', factorToBase: 1 },
  'gramme': { dimension: 'mass', factorToBase: 1 },
  'grammes': { dimension: 'mass', factorToBase: 1 },
  'kg': { dimension: 'mass', factorToBase: 1000 },
  'kilo': { dimension: 'mass', factorToBase: 1000 },
  'kilos': { dimension: 'mass', factorToBase: 1000 },
  'kilogramme': { dimension: 'mass', factorToBase: 1000 },
  'kilogrammes': { dimension: 'mass', factorToBase: 1000 },
  'mg': { dimension: 'mass', factorToBase: 0.001 },
  'milligramme': { dimension: 'mass', factorToBase: 0.001 },
  'milligrammes': { dimension: 'mass', factorToBase: 0.001 },

  // Volume (base = ml)
  'ml': { dimension: 'volume', factorToBase: 1 },
  'millilitre': { dimension: 'volume', factorToBase: 1 },
  'millilitres': { dimension: 'volume', factorToBase: 1 },
  'cl': { dimension: 'volume', factorToBase: 10 },
  'centilitre': { dimension: 'volume', factorToBase: 10 },
  'centilitres': { dimension: 'volume', factorToBase: 10 },
  'dl': { dimension: 'volume', factorToBase: 100 },
  'decilitre': { dimension: 'volume', factorToBase: 100 },
  'décilitre': { dimension: 'volume', factorToBase: 100 },
  'decilitres': { dimension: 'volume', factorToBase: 100 },
  'décilitres': { dimension: 'volume', factorToBase: 100 },
  'l': { dimension: 'volume', factorToBase: 1000 },
  'litre': { dimension: 'volume', factorToBase: 1000 },
  'litres': { dimension: 'volume', factorToBase: 1000 },
};

export const getUnitDimension = (unit: string): { dimension: 'mass' | 'volume'; factorToBase: number } | null => {
  if (!unit) return null;
  const clean = unit.trim().toLowerCase().replace(/\./g, '');
  return UNIT_CONVERSIONS[clean] || null;
};

export const convertUnitAmount = (amount: number, fromUnit: string, toUnit: string): number | null => {
  if (isNaN(amount)) return null;
  const normFrom = fromUnit.trim().toLowerCase().replace(/\./g, '');
  const normTo = toUnit.trim().toLowerCase().replace(/\./g, '');
  if (normFrom === normTo) return amount;

  const fromInfo = UNIT_CONVERSIONS[normFrom];
  const toInfo = UNIT_CONVERSIONS[normTo];

  if (fromInfo && toInfo && fromInfo.dimension === toInfo.dimension) {
    const baseValue = amount * fromInfo.factorToBase;
    return baseValue / toInfo.factorToBase;
  }
  return null;
};

interface PantryGroup {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

export const formatTotalTime = (minutes: number) => {
  if (minutes > 59) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')} h ${mins.toString().padStart(2, '0')} min`;
  }
  return `${minutes} min`;
};

export const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getStartOfWeek = (date: Date, startDay: number = 6): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - startDay + 7) % 7;
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

export const DEFAULT_DIET_ITEMS: DietItem[] = [
  // Protéines (Rouge)
  { id: 'p1', name: 'Blanc de poulet', category: 'Protéines', weight: '150 g' },
  { id: 'p2', name: 'Pavé de saumon', category: 'Protéines', weight: '140 g' },
  { id: 'p3', name: 'Steak haché 5%', category: 'Protéines', weight: '125 g' },
  { id: 'p4', name: 'Œufs entiers', category: 'Protéines', weight: '2 pièces' },
  { id: 'p5', name: 'Thon au naturel', category: 'Protéines', weight: '130 g' },
  { id: 'p6', name: 'Filet de cabillaud / colin', category: 'Protéines', weight: '160 g' },
  { id: 'p7', name: 'Tofu ferme', category: 'Protéines', weight: '150 g' },
  // Légumes (Verte)
  { id: 'l1', name: 'Courgettes', category: 'Légumes', weight: '200 g' },
  { id: 'l2', name: 'Haricots verts', category: 'Légumes', weight: '200 g' },
  { id: 'l3', name: 'Brocolis', category: 'Légumes', weight: '200 g' },
  { id: 'l4', name: 'Tomates', category: 'Légumes', weight: '150 g' },
  { id: 'l5', name: 'Épinards', category: 'Légumes', weight: '200 g' },
  { id: 'l6', name: 'Carottes', category: 'Légumes', weight: '150 g' },
  { id: 'l7', name: 'Poivrons', category: 'Légumes', weight: '150 g' },
  // Féculents (Jaune foncé)
  { id: 'f1', name: 'Riz complet / basmati cuit', category: 'Féculents', weight: '120 g' },
  { id: 'f2', name: 'Pâtes complètes cuites', category: 'Féculents', weight: '120 g' },
  { id: 'f3', name: 'Pommes de terre vapeur', category: 'Féculents', weight: '150 g' },
  { id: 'f4', name: 'Patate douce', category: 'Féculents', weight: '150 g' },
  { id: 'f5', name: 'Quinoa cuit', category: 'Féculents', weight: '120 g' },
  { id: 'f6', name: 'Lentilles cuites', category: 'Féculents', weight: '130 g' },
  { id: 'f7', name: 'Flocons d\'avoine', category: 'Féculents', weight: '40 g' },
  // Desserts (Fruits, yaourts...)
  { id: 'd1', name: 'Pomme', category: 'Desserts', weight: '1 pièce (150 g)' },
  { id: 'd2', name: 'Banane', category: 'Desserts', weight: '1 pièce (120 g)' },
  { id: 'd3', name: 'Yaourt nature', category: 'Desserts', weight: '1 pot (125 g)' },
  { id: 'd4', name: 'Fromage blanc 0%', category: 'Desserts', weight: '100 g' },
  { id: 'd5', name: 'Compote sans sucre', category: 'Desserts', weight: '100 g' },
  { id: 'd6', name: 'Fruits rouges / Fraises', category: 'Desserts', weight: '150 g' },
  { id: 'd7', name: 'Kiwi', category: 'Desserts', weight: '2 pièces' },
];

export const DIET_PERSON_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export const DAYS_OF_WEEK_CONFIG = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
  { id: 0, label: 'Dimanche' },
];

export const getDayOfWeekFromDateOrString = (dateInput: string | Date): number => {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).getDay();
    }
    return new Date(dateInput).getDay();
  }
  return dateInput.getDay();
};

export const getDefaultDietServings = (
  dateInput: string | Date,
  mealType: 'lunch' | 'dinner' | 'dietLunch' | 'dietDinner',
  settings?: UserSettings
): number => {
  const dayOfWeek = getDayOfWeekFromDateOrString(dateInput);
  const baseDefault = settings?.dietServingsDefault ?? 2.5;

  const isLunch = mealType === 'lunch' || mealType === 'dietLunch';
  if (isLunch) {
    const customDays = settings?.dietLunchCustomDays ?? [1, 2, 3, 4, 5];
    const customServings = settings?.dietLunchCustomServings ?? 1;
    if (customDays.includes(dayOfWeek)) {
      return customServings;
    }
    return baseDefault;
  } else {
    const customDays = settings?.dietDinnerCustomDays ?? [];
    const customServings = settings?.dietDinnerCustomServings ?? 2.5;
    if (customDays.includes(dayOfWeek)) {
      return customServings;
    }
    return baseDefault;
  }
};

export const DIET_BADGE_COLORS: Record<string, { label: string; bg: string; text: string; border: string; circle: string }> = {
  green: { label: 'Vert', bg: 'bg-green-100/90', text: 'text-green-950', border: 'border-green-300', circle: 'bg-green-500' },
  blue: { label: 'Bleu', bg: 'bg-blue-100/90', text: 'text-blue-950', border: 'border-blue-300', circle: 'bg-blue-500' },
  purple: { label: 'Violet', bg: 'bg-purple-100/90', text: 'text-purple-950', border: 'border-purple-300', circle: 'bg-purple-500' },
  orange: { label: 'Orange', bg: 'bg-orange-100/90', text: 'text-orange-950', border: 'border-orange-300', circle: 'bg-orange-500' },
  pink: { label: 'Rose', bg: 'bg-pink-100/90', text: 'text-pink-950', border: 'border-pink-300', circle: 'bg-pink-500' },
  yellow: { label: 'Jaune', bg: 'bg-amber-100/90', text: 'text-amber-950', border: 'border-amber-300', circle: 'bg-amber-500' },
  red: { label: 'Rouge', bg: 'bg-red-100/90', text: 'text-red-950', border: 'border-red-300', circle: 'bg-red-500' },
  gray: { label: 'Gris', bg: 'bg-gray-200/90', text: 'text-gray-950', border: 'border-gray-300', circle: 'bg-gray-500' },
};

export const getDietBadgeColor = (
  dateInput: string | Date,
  mealType: 'lunch' | 'dinner',
  settings?: UserSettings
): { bg: string; text: string; border: string } => {
  const dayOfWeek = getDayOfWeekFromDateOrString(dateInput);
  let colorKey = settings?.dietServingsDefaultColor || 'green';

  if (mealType === 'lunch') {
    const customDays = settings?.dietLunchCustomDays ?? [1, 2, 3, 4, 5];
    if (customDays.includes(dayOfWeek)) {
      colorKey = settings?.dietLunchCustomColor || 'green';
    }
  } else {
    const customDays = settings?.dietDinnerCustomDays ?? [];
    if (customDays.includes(dayOfWeek)) {
      colorKey = settings?.dietDinnerCustomColor || 'green';
    }
  }

  const style = DIET_BADGE_COLORS[colorKey] || DIET_BADGE_COLORS.green;
  return { bg: style.bg, text: style.text, border: style.border };
};

export const roundShoppingAmount = (amount: number, unit?: string): number => {
  if (isNaN(amount) || amount <= 0) return amount;
  const u = (unit || '').toLowerCase().trim();
  // Uniquement pour les unités de poids et volume: g, kg, ml, cl
  if (u === 'g' || u === 'grammes' || u === 'gr' || u === 'g.' || u === 'ml' || u === 'cl') {
    return Math.ceil(amount / 5) * 5;
  }
  if (u === 'kg' || u === 'kilo' || u === 'kilos' || u === 'kg.') {
    // Si en kg et avec décimales, on peut soit convertir en g -> multiple de 5 -> rediviser par 1000, 
    // ou si c'est un montant décimal de kg, ex: 0.122 kg -> 0.125 kg (multiple de 0.005 kg = 5g)
    const inGrams = amount * 1000;
    const roundedGrams = Math.ceil(inGrams / 5) * 5;
    return Math.round((roundedGrams / 1000) * 10000) / 10000;
  }
  if (!Number.isInteger(amount)) {
    return Math.round(amount * 100) / 100;
  }
  return amount;
};

export const isUnitInRoundingList = (unitStr?: string, allowedUnits: string[] = DEFAULT_DIET_ROUNDING_UNITS): boolean => {
  if (!unitStr) return false;
  const clean = unitStr.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return allowedUnits.some(allowed => {
    const cleanAllowed = allowed.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (clean === cleanAllowed) return true;
    const baseStem = cleanAllowed.replace(/\(s\)|\(x\)/g, '').replace(/s$|x$/g, '').trim();
    const unitStem = clean.replace(/\(s\)|\(x\)/g, '').replace(/s$|x$/g, '').trim();
    if (unitStem && baseStem && (unitStem === baseStem || clean.startsWith(baseStem) || cleanAllowed.startsWith(unitStem))) {
      return true;
    }
    return false;
  });
};

export const isDiscreteDietUnit = (unitStr?: string, settings?: UserSettings): boolean => {
  const allowed = settings?.dietRoundingUnits && settings.dietRoundingUnits.length > 0
    ? settings.dietRoundingUnits
    : DEFAULT_DIET_ROUNDING_UNITS;
  return isUnitInRoundingList(unitStr, allowed);
};

export const roundDiscreteAmount = (val: number, mode: 'nearest' | 'ceil' = 'nearest'): number => {
  if (mode === 'ceil') {
    return Math.ceil(val);
  }
  return Math.round(val);
};

export const scaleTextQuantity = (text: string, servings: number, baseServings: number = 2.5, settings?: UserSettings, roundWeightItem?: boolean): string => {
  if (!text || typeof text !== 'string') return typeof text === 'number' ? String(text) : '';
  if (!baseServings || servings === baseServings) return text;
  const ratio = servings / baseServings;
  const roundDiscrete = settings ? (settings.dietRoundDiscreteUnits ?? true) : true;
  const roundingMode = settings?.dietRoundingMode || 'nearest';
  const allowedUnits = settings?.dietRoundingUnits && settings.dietRoundingUnits.length > 0
    ? settings.dietRoundingUnits
    : DEFAULT_DIET_ROUNDING_UNITS;
  const shouldRoundThisItem = roundWeightItem !== false;

  // Pattern pour détecter un nombre suivi de son unité textuelle (ex: "3 pots", "2 pièces", "150 g")
  return text.replace(/([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-ZÀ-ÿ().\s]+)?/g, (fullMatch, numPart, unitPart) => {
    const num = parseFloat(numPart.replace(',', '.'));
    if (isNaN(num)) return fullMatch;
    const scaled = num * ratio;
    const unitTrimmed = (unitPart || '').trim();

    if (roundDiscrete && shouldRoundThisItem && unitTrimmed && isUnitInRoundingList(unitTrimmed, allowedUnits)) {
      const roundedVal = roundDiscreteAmount(scaled, roundingMode);
      return unitPart ? `${roundedVal} ${unitTrimmed}` : `${roundedVal}`;
    }

    const rounded = Math.round(scaled * 10) / 10;
    const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.0', '');
    return unitPart ? `${formatted} ${unitTrimmed}` : `${formatted}`;
  });
};

export interface MealSlotConflictInfo {
  title: string;
  type: 'Classique' | 'Régime';
  id?: string;
}

export const getSlotOccupantInfo = (
  dayPlan: MealPlanDay | undefined,
  mealType: 'lunch' | 'dinner',
  recipes: Recipe[],
  dietRecipes: DietRecipe[] = [],
  dietItems: DietItem[] = [],
  currentRecipeId?: string,
  isDietRecipeTarget?: boolean
): MealSlotConflictInfo | null => {
  if (!dayPlan) return null;
  const classicId = dayPlan[mealType]?.recipe1 || dayPlan[mealType]?.recipe2;
  const dietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
  const dietObj = dayPlan[dietKey];
  const dietRecipeId = dietObj?.dietRecipe;
  const hasDietItems = !!(dietObj?.protein || dietObj?.vegetable || dietObj?.starch || dietObj?.dairy || dietObj?.dessert);

  if (isDietRecipeTarget) {
    if (dietRecipeId && dietRecipeId === currentRecipeId) return null;
  } else {
    if (classicId && (classicId === currentRecipeId)) return null;
  }

  if (classicId) {
    const r = recipes.find(rec => rec.id === classicId);
    return { title: r ? r.title : 'Recette classique', type: 'Classique', id: classicId };
  }
  if (dietRecipeId) {
    const dr = dietRecipes.find(rec => rec.id === dietRecipeId);
    return { title: dr ? dr.name : 'Recette régime', type: 'Régime', id: dietRecipeId };
  }
  if (hasDietItems) {
    return { title: 'Menu Régime (Aliments)', type: 'Régime' };
  }
  return null;
};



export const formatScaledWeight = (rawWeight: string, servings: number, baseServings: number = 2.5, settings?: UserSettings, roundWeightItem?: boolean): string => {
  if (!rawWeight) return '';
  if (servings === baseServings) return rawWeight;
  const ratio = servings / baseServings;
  const roundDiscrete = settings ? (settings.dietRoundDiscreteUnits ?? true) : true;
  const roundingMode = settings?.dietRoundingMode || 'nearest';
  const allowedUnits = settings?.dietRoundingUnits && settings.dietRoundingUnits.length > 0
    ? settings.dietRoundingUnits
    : DEFAULT_DIET_ROUNDING_UNITS;
  const shouldRoundThisItem = roundWeightItem !== false;

  const match = rawWeight.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
  if (match) {
    const numStr = match[1].replace(',', '.');
    const num = parseFloat(numStr);
    const unit = match[2]?.trim() || '';
    if (!isNaN(num)) {
      const scaled = num * ratio;
      if (roundDiscrete && shouldRoundThisItem && unit && isUnitInRoundingList(unit, allowedUnits)) {
        const roundedVal = roundDiscreteAmount(scaled, roundingMode);
        return unit ? `${roundedVal} ${unit}`.trim() : `${roundedVal}`;
      }
      const rounded = Math.round(scaled * 10) / 10;
      const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.0', '');
      return unit ? `${formatted} ${unit}`.trim() : `${formatted}`;
    }
  }
  return rawWeight;
};

export const normalizeDietFoodName = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
};

export const getDietFoodStem = (word: string): string => {
  if (word.length > 3) {
    if (word.endsWith('s') || word.endsWith('x')) {
      return word.slice(0, -1);
    }
  }
  return word;
};

export const levenshteinDist = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const findSimilarDietFoods = (query: string, allExistingFoods: string[]): string[] => {
  if (!query || !query.trim()) return [];
  const normQuery = normalizeDietFoodName(query);
  const stemQuery = getDietFoodStem(normQuery);
  const queryWords = normQuery.split(/\s+/).filter(w => w.length > 1 && !['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'et', 'en', 'a', 'd'].includes(w));
  const queryStems = queryWords.map(getDietFoodStem);

  const scored: { name: string; score: number }[] = [];
  const seen = new Set<string>();

  allExistingFoods.forEach(foodName => {
    if (!foodName || !foodName.trim()) return;
    const trimmed = foodName.trim();
    const normFood = normalizeDietFoodName(trimmed);
    if (seen.has(normFood)) return;
    seen.add(normFood);

    if (normFood === normQuery) {
      scored.push({ name: trimmed, score: 100 });
      return;
    }

    const stemFood = getDietFoodStem(normFood);
    if (stemFood === stemQuery || normFood === stemQuery || stemFood === normQuery) {
      scored.push({ name: trimmed, score: 95 });
      return;
    }

    let score = 0;

    if (normFood.includes(normQuery) || normQuery.includes(normFood)) {
      score += 60;
    } else if (normFood.includes(stemQuery) || stemFood.includes(stemQuery)) {
      score += 50;
    }

    const foodWords = normFood.split(/\s+/).filter(w => w.length > 1 && !['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'et', 'en', 'a', 'd'].includes(w));
    const foodStems = foodWords.map(getDietFoodStem);

    let matchingWordsCount = 0;
    queryStems.forEach(qs => {
      if (foodStems.some(fs => fs === qs || fs.includes(qs) || qs.includes(fs))) {
        matchingWordsCount++;
      }
    });

    if (matchingWordsCount > 0) {
      score += (matchingWordsCount / Math.max(queryStems.length, 1)) * 40;
    }

    const lenMax = Math.max(normQuery.length, normFood.length);
    if (lenMax <= 20) {
      const dist = levenshteinDist(normQuery, normFood);
      const simRatio = 1 - (dist / lenMax);
      if (simRatio >= 0.55) {
        score += simRatio * 35;
      }
    }

    if (score >= 30) {
      scored.push({ name: trimmed, score });
    }
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map(s => s.name);
};

export const resolveDietFoodCategory = (
  foodName: string, 
  directCat?: string, 
  dietItems: DietItem[] = [], 
  foodPortions: FoodPortion[] = []
): DietCategory | 'Autre' => {
  const catCandidate = directCat ? directCat.replace(/^(Régime:\s*|Recettes:\s*)/i, '').trim() : '';
  if (catCandidate && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(catCandidate)) {
    return catCandidate as DietCategory;
  }

  const cleanName = (foodName || '').trim().toLowerCase();
  if (!cleanName) return 'Autre';

  // 1. Exact match in dietItems
  const matchedDiet = dietItems.find(di => di.name.trim().toLowerCase() === cleanName);
  if (matchedDiet && matchedDiet.category) return matchedDiet.category;

  // 2. Partial match in dietItems
  const partialDiet = dietItems.find(di => {
    const dName = di.name.trim().toLowerCase();
    return cleanName.includes(dName) || dName.includes(cleanName);
  });
  if (partialDiet && partialDiet.category) return partialDiet.category;

  // 3. Match in foodPortions / settings
  const matchedPortion = (foodPortions || []).find(fp => fp.name.trim().toLowerCase() === cleanName);
  if (matchedPortion && matchedPortion.category) {
    const pCat = matchedPortion.category.toLowerCase();
    if (/viande|poisson|charcuterie|oeuf|œuf|prot|tofu|boucherie|traiteur/i.test(pCat)) return 'Protéines';
    if (/légume|legume|fruit et|maraîcher/i.test(pCat)) return 'Légumes';
    if (/féculent|feculent|pain|boulangerie|pâte|pate|riz|céréale|cereale/i.test(pCat)) return 'Féculents';
    if (/dessert|yaourt|sucrée|sucre|crèmerie|cremerie|fromage|douceur/i.test(pCat)) return 'Desserts';
  }

  // 4. Keyword heuristics
  if (/poulet|boeuf|bœuf|veau|porc|dinde|jambon|poisson|saumon|thon|cabillaud|colin|oeuf|œuf|tofu|steak|viande|crevette|canard|bacon|saucisse|dinde|lard|protéine|proteine|merlu|lieu|hareng|maquereau|sardine|haché|hache|cordon bleu|nugget|agneau/i.test(cleanName)) return 'Protéines';
  if (/haricot|courgette|tomate|carotte|brocoli|salade|épinard|epinard|poivron|champignon|poireau|poireaux|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri|betterave|avocat|asperge|épinards|epinards|légume|legume|petits pois|artichaut|mâche|mache|roquette|endive|citrouille|potiron|butternut|courge/i.test(cleanName)) return 'Légumes';
  if (/riz|pâte|pate|coquillette|spaghetti|penne|tagliatelle|pomme de terre|pommes de terre|patate|patates|quinoa|boulgour|semoule|pain|lentille|pois chiche|avoine|fécule|fecule|blé|ble|maïs|mais|gnocchi|polenta|féculent|feculent|nouille|vermicelle/i.test(cleanName)) return 'Féculents';
  if (/yaourt|fromage blanc|compote|\bpommes?\b(?! de terre)|\bpoires?\b|banane|fruit|dessert|fraise|kiwi|orange|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|crème|creme|flan|chocolat|mousse|gâteau|gateau|tarte|sorbet|glace/i.test(cleanName)) return 'Desserts';

  return 'Autre';
};

export const detectSettingsCategoryFromFoodName = (
  foodName: string,
  dietCat?: string
): string => {
  const cleanName = (foodName || '').trim().toLowerCase();
  if (!cleanName) return 'Épicerie salées';

  if (dietCat) {
    const normDiet = dietCat.trim().toLowerCase();
    if (normDiet.includes('légume') || normDiet.includes('legume')) return 'Fruit et légumes';
    if (normDiet.includes('protéine') || normDiet.includes('proteine')) return 'Viandes et poissons';
    if (normDiet.includes('féculent') || normDiet.includes('feculent')) return 'Épicerie salées';
    if (normDiet.includes('dessert')) {
      if (/pomme|banane|fraise|kiwi|orange|poire|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|fruit|citron|prune|figue/i.test(cleanName)) {
        return 'Fruit et légumes';
      }
      return 'Yaourts';
    }
  }

  if (/salade|tomate|carotte|courgette|haricot|brocoli|épinard|epinard|poivron|champignon|poireau|chou|concombre|aubergine|oignon|ail|échalote|echalote|radis|navet|céleri|celeri|betterave|avocat|asperge|poireaux|épinards|epinards|petits pois|artichaut|mâche|mache|roquette|endive|citrouille|potiron|butternut|courge|pomme|banane|fraise|kiwi|orange|poire|pêche|peche|abricot|framboise|mûre|myrtille|cerise|ananas|mangue|melon|pastèque|pasteque|raisin|fruit|citron|prune|figue|pamplemousse|clémentine|clementine|mandarine/i.test(cleanName)) {
    return 'Fruit et légumes';
  }

  if (/poulet|boeuf|bœuf|veau|porc|dinde|poisson|saumon|thon|cabillaud|colin|oeuf|œuf|tofu|steak|viande|crevette|canard|bacon|saucisse|merlu|lieu|hareng|maquereau|sardine|haché|hache|cordon bleu|nugget|agneau|escalope|filet|entrecôte|rôti|roti|pâté|pate|boucherie/i.test(cleanName)) {
    return 'Viandes et poissons';
  }

  if (/jambon|salami|chorizo|rosette|coppa|bacon|pâté|pate|rillettes|mortadelle|andouille|saucisson/i.test(cleanName)) {
    return 'Charcuterie';
  }

  if (/quiche|pizza|lasagne|traiteur|sandwich|wrap|taboulé|taboule/i.test(cleanName)) {
    return 'Traiteurs';
  }

  if (/pain|baguette|brioche|croissant|pain de mie|biscotte|ficelle|boule/i.test(cleanName)) {
    return 'Pain';
  }

  if (/yaourt|skyr|fromage blanc|petits suisse|petit suisse|flan|mousse|liégeois|liegeois/i.test(cleanName)) {
    return 'Yaourts';
  }

  if (/fromage|emmental|comté|comte|camembert|chèvre|chevre|mozzarella|parmesan|gruyère|gruyere|roquefort|brie|raclette|reblochon|feta/i.test(cleanName)) {
    return 'Fromage';
  }

  if (/lait|beurre|crème|creme|oeuf|œuf|margarine|crèmerie|cremerie/i.test(cleanName)) {
    return 'Crèmerie et œufs';
  }

  if (/surgelé|surgele|glace|sorbet|bâtonnet/i.test(cleanName)) {
    return 'Surgelés';
  }

  if (/chocolat|sucre|gâteau|gateau|biscuit|miel|confiture|bonbon|compote|céréales|cereales|pâte à tartiner|pate a tartiner/i.test(cleanName)) {
    return 'Épicerie Sucrées';
  }

  if (/soda|eau|jus|café|cafe|thé|the|bière|biere|vin|coca|sprite|fanta|boisson|sirop|icetea|oasis/i.test(cleanName)) {
    return 'Boissons';
  }

  if (/savon|lessive|papier|dentifrice|shampoing|éponge|eponge|nettoyant|javel|essuie-tout/i.test(cleanName)) {
    return 'Hygiène et entretien';
  }

  if (/riz|pâte|pate|semoule|quinoa|boulgour|lentille|pois chiche|farine|huile|vinaigre|sel|poivre|épice|epice|sauce|bouillon|conserve|boîte|boite|maïzena|maizena/i.test(cleanName)) {
    return 'Épicerie salées';
  }

  return 'Épicerie salées';
};



// Portion rule converters
export const getPortionRules = (fp: FoodPortion): PortionRule[] => {
  if (fp.rules && Array.isArray(fp.rules) && fp.rules.length > 0) {
    return fp.rules;
  }
  return [{
    id: 'default-rule',
    baseAmount: fp.baseAmount || fp.amount || 1,
    baseUnit: fp.baseUnit || fp.unit || 'portion(s)',
    purchaseAmount: fp.purchaseAmount || 1,
    purchaseUnit: fp.purchaseUnit || 'pièce(s)',
    minThreshold: undefined
  }];
};

export function formatPortionConvertedDisplay(
  itemName: string,
  itemAmount: number,
  itemUnit: string,
  foodPortions: FoodPortion[]
): { formatted: string; hasRule: boolean; purchaseAmount: number; purchaseUnit: string; originalText: string } {
  const normName = itemName.trim().toLowerCase();
  let fp = (foodPortions || []).find(p => p.name.trim().toLowerCase() === normName);
  if (!fp) {
    const normClean = normName.replace(/œ/g, 'oe').replace(/é|è|ê/g, 'e');
    fp = (foodPortions || []).find(p => {
      const pClean = p.name.trim().toLowerCase().replace(/œ/g, 'oe').replace(/é|è|ê/g, 'e');
      return pClean === normClean || pClean.includes(normClean) || normClean.includes(pClean);
    });
  }

  if (!fp) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const rules = getPortionRules(fp);
  if (!rules || rules.length === 0) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const cleanItemUnit = itemUnit.trim().toLowerCase().replace(/\./g, '');
  
  // Recherche et conversion de toutes les règles candidates compatibles avec l'unité de l'article
  interface CandidateTierRule {
    rule: PortionRule;
    effectiveAmountInBaseUnit: number;
    threshold: number;
  }

  const candidates: CandidateTierRule[] = [];
  rules.forEach(r => {
    const rBaseUnit = (r.baseUnit || 'portion(s)').trim();
    const cleanRBaseUnit = rBaseUnit.toLowerCase().replace(/\./g, '');
    let amtInBase: number | null = null;

    if (cleanItemUnit === cleanRBaseUnit) {
      amtInBase = itemAmount;
    } else {
      amtInBase = convertUnitAmount(itemAmount, itemUnit, rBaseUnit);
    }

    if (amtInBase !== null && amtInBase > 0) {
      const threshold = (typeof r.minThreshold === 'number' && !isNaN(r.minThreshold) && r.minThreshold > 0)
        ? r.minThreshold
        : (r.baseAmount || 1);
      candidates.push({
        rule: r,
        effectiveAmountInBaseUnit: amtInBase,
        threshold
      });
    }
  });

  if (candidates.length === 0) {
    // Si aucune conversion d'unité possible, repli sur la première règle
    const fallbackRule = rules[0];
    const threshold = (typeof fallbackRule.minThreshold === 'number' && !isNaN(fallbackRule.minThreshold) && fallbackRule.minThreshold > 0)
      ? fallbackRule.minThreshold
      : (fallbackRule.baseAmount || 1);
    candidates.push({
      rule: fallbackRule,
      effectiveAmountInBaseUnit: itemAmount,
      threshold
    });
  }

  // Filtrer les paliers qualifiés (où la quantité totale atteint ou dépasse le seuil)
  const qualifying = candidates.filter(c => c.effectiveAmountInBaseUnit >= c.threshold);

  let selectedCandidate: CandidateTierRule;
  if (qualifying.length > 0) {
    // On sélectionne le palier qualifié le plus élevé (seuil max ou baseAmount max)
    qualifying.sort((a, b) => b.threshold - a.threshold || (b.rule.baseAmount || 1) - (a.rule.baseAmount || 1));
    selectedCandidate = qualifying[0];
  } else {
    // Sinon on prend le plus petit palier de base
    candidates.sort((a, b) => a.threshold - b.threshold || (a.rule.baseAmount || 1) - (b.rule.baseAmount || 1));
    selectedCandidate = candidates[0];
  }

  const matchedRule = selectedCandidate.rule;
  const effectiveAmountInBaseRuleUnit = selectedCandidate.effectiveAmountInBaseUnit;
  const baseRuleAmount = matchedRule.baseAmount || 1;
  const baseRuleUnit = matchedRule.baseUnit || 'portion(s)';
  const purchaseRuleAmount = matchedRule.purchaseAmount || 1;
  const purchaseRuleUnit = matchedRule.purchaseUnit || 'pièce(s)';

  if (baseRuleAmount <= 0) {
    return {
      formatted: `${itemAmount} ${itemUnit}`,
      hasRule: false,
      purchaseAmount: itemAmount,
      purchaseUnit: itemUnit,
      originalText: `${itemAmount} ${itemUnit}`
    };
  }

  const ratio = effectiveAmountInBaseRuleUnit / baseRuleAmount;
  const totalPurchaseCount = Math.ceil(ratio) * purchaseRuleAmount;
  const fullPurchaseCount = Math.floor(ratio) * purchaseRuleAmount;
  const remainderBaseAmountInBaseRuleUnit = Math.round((effectiveAmountInBaseRuleUnit - (fullPurchaseCount / purchaseRuleAmount) * baseRuleAmount) * 1000) / 1000;

  let remainderDisplayAmount = remainderBaseAmountInBaseRuleUnit;
  let remainderDisplayUnit = baseRuleUnit;
  const backVal = convertUnitAmount(remainderBaseAmountInBaseRuleUnit, baseRuleUnit, itemUnit);
  if (backVal !== null) {
    remainderDisplayAmount = Math.round(backVal * 100) / 100;
    remainderDisplayUnit = itemUnit;
  }

  const formatUnit = (amt: number, u: string) => {
    let clean = u.trim();
    if (amt <= 1) {
      clean = clean.replace(/\(s\)/gi, '')
                   .replace(/\(x\)/gi, '')
                   .replace(/\(es\)/gi, '')
                   .replace(/\(e\)/gi, '');
    } else {
      clean = clean.replace(/\(s\)/gi, 's')
                   .replace(/\(x\)/gi, 'x')
                   .replace(/\(es\)/gi, 'es')
                   .replace(/\(e\)/gi, 'e');
    }
    return `${amt} ${clean.trim()}`;
  };

  let formatted = '';

  if (fullPurchaseCount === 0 || remainderBaseAmountInBaseRuleUnit <= 0.0001) {
    formatted = formatUnit(totalPurchaseCount, purchaseRuleUnit);
  } else {
    const totalText = formatUnit(totalPurchaseCount, purchaseRuleUnit);
    const fullText = formatUnit(fullPurchaseCount, purchaseRuleUnit);
    const remainderText = formatUnit(remainderDisplayAmount, remainderDisplayUnit);
    formatted = `${totalText} (${fullText} et ${remainderText})`;
  }

  return {
    formatted,
    hasRule: true,
    purchaseAmount: totalPurchaseCount,
    purchaseUnit: purchaseRuleUnit,
    originalText: `${itemAmount} ${itemUnit}`
  };
}

