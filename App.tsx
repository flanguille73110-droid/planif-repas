import { SearchableSelect } from './src/components/SearchableSelect';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe, MealPlanDay, ShoppingListItem, AppTab, UserSettings, Ingredient, FoodPortion, PortionRule, DietItem, DietCategory, DietRecipe, DietRecipeItem } from './src/types';
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

const formatTotalTime = (minutes: number) => {
  if (minutes > 59) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')} h ${mins.toString().padStart(2, '0')} min`;
  }
  return `${minutes} min`;
};

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date, startDay: number = 6): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - startDay + 7) % 7;
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

const DEFAULT_DIET_ITEMS: DietItem[] = [
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

const DIET_PERSON_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const DAYS_OF_WEEK_CONFIG = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
  { id: 0, label: 'Dimanche' },
];

const getDayOfWeekFromDateOrString = (dateInput: string | Date): number => {
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

const getDefaultDietServings = (
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

const DIET_BADGE_COLORS: Record<string, { label: string; bg: string; text: string; border: string; circle: string }> = {
  green: { label: 'Vert', bg: 'bg-green-100/90', text: 'text-green-950', border: 'border-green-300', circle: 'bg-green-500' },
  blue: { label: 'Bleu', bg: 'bg-blue-100/90', text: 'text-blue-950', border: 'border-blue-300', circle: 'bg-blue-500' },
  purple: { label: 'Violet', bg: 'bg-purple-100/90', text: 'text-purple-950', border: 'border-purple-300', circle: 'bg-purple-500' },
  orange: { label: 'Orange', bg: 'bg-orange-100/90', text: 'text-orange-950', border: 'border-orange-300', circle: 'bg-orange-500' },
  pink: { label: 'Rose', bg: 'bg-pink-100/90', text: 'text-pink-950', border: 'border-pink-300', circle: 'bg-pink-500' },
  yellow: { label: 'Jaune', bg: 'bg-amber-100/90', text: 'text-amber-950', border: 'border-amber-300', circle: 'bg-amber-500' },
  red: { label: 'Rouge', bg: 'bg-red-100/90', text: 'text-red-950', border: 'border-red-300', circle: 'bg-red-500' },
  gray: { label: 'Gris', bg: 'bg-gray-200/90', text: 'text-gray-950', border: 'border-gray-300', circle: 'bg-gray-500' },
};

const getDietBadgeColor = (
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

const roundShoppingAmount = (amount: number, unit?: string): number => {
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

const isUnitInRoundingList = (unitStr?: string, allowedUnits: string[] = DEFAULT_DIET_ROUNDING_UNITS): boolean => {
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

const isDiscreteDietUnit = (unitStr?: string, settings?: UserSettings): boolean => {
  const allowed = settings?.dietRoundingUnits && settings.dietRoundingUnits.length > 0
    ? settings.dietRoundingUnits
    : DEFAULT_DIET_ROUNDING_UNITS;
  return isUnitInRoundingList(unitStr, allowed);
};

const roundDiscreteAmount = (val: number, mode: 'nearest' | 'ceil' = 'nearest'): number => {
  if (mode === 'ceil') {
    return Math.ceil(val);
  }
  return Math.round(val);
};

const scaleTextQuantity = (text: string, servings: number, baseServings: number = 2.5, settings?: UserSettings, roundWeightItem?: boolean): string => {
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



const formatScaledWeight = (rawWeight: string, servings: number, baseServings: number = 2.5, settings?: UserSettings, roundWeightItem?: boolean): string => {
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

const normalizeDietFoodName = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
};

const getDietFoodStem = (word: string): string => {
  if (word.length > 3) {
    if (word.endsWith('s') || word.endsWith('x')) {
      return word.slice(0, -1);
    }
  }
  return word;
};

const levenshteinDist = (a: string, b: string): number => {
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

const findSimilarDietFoods = (query: string, allExistingFoods: string[]): string[] => {
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

const resolveDietFoodCategory = (
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

const detectSettingsCategoryFromFoodName = (
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

  const [showReviewNewFoodsModal, setShowReviewNewFoodsModal] = useState(false);
  const [pendingNewFoodsToReview, setPendingNewFoodsToReview] = useState<{name: string, category?: string, settingsCategory?: string, weight?: string, recipeName?: string}[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedMatchMode, setSelectedMatchMode] = useState<string>('__NEW__');
  const [reviewedReplacements, setReviewedReplacements] = useState<Record<string, string>>({});
  const [reviewedWeightOverrides, setReviewedWeightOverrides] = useState<Record<string, string>>({});
  const [reviewedNewFoods, setReviewedNewFoods] = useState<{name: string, dietCat: string, setCat: string, weight?: string}[]>([]);
  const [reviewedDietItemsToAdd, setReviewedDietItemsToAdd] = useState<{name: string, dietCat: string, weight?: string}[]>([]);
  const [reviewDietCat, setReviewDietCat] = useState<DietCategory>('Légumes');
  const [reviewSetCat, setReviewSetCat] = useState<string>('');
  const [reviewWeightValue, setReviewWeightValue] = useState<string>('100');
  const [reviewWeightUnit, setReviewWeightUnit] = useState<string>('g');
  const [pendingDietRecipes, setPendingDietRecipes] = useState<DietRecipe[]>([]);

  const [dietItems, setDietItems] = useState<DietItem[]>(() => {
    const saved = localStorage.getItem('culina_diet_items_v1');
    if (!saved) return [];
    try {
      const parsed: DietItem[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (showReviewNewFoodsModal && pendingNewFoodsToReview.length > 0 && currentReviewIndex < pendingNewFoodsToReview.length) {
      const food = pendingNewFoodsToReview[currentReviewIndex];
      if (selectedMatchMode === '__NEW__') {
        const parsed = parseWeightAndUnit(food.weight || '');
        setReviewWeightValue(parsed.value);
        setReviewWeightUnit(parsed.unit);
      } else {
        const existing = dietItems.find(d => d.name.toLowerCase() === selectedMatchMode.toLowerCase());
        if (existing && existing.weight) {
          const existingParsed = parseWeightAndUnit(existing.weight);
          const importedParsed = parseWeightAndUnit(food.weight || '');
          if (existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase()) {
            setReviewWeightValue(existingParsed.value);
            setReviewWeightUnit(existingParsed.unit);
          } else {
            setReviewWeightValue(importedParsed.value);
            setReviewWeightUnit(importedParsed.unit);
          }
        } else {
          const parsed = parseWeightAndUnit(food.weight || '');
          setReviewWeightValue(parsed.value);
          setReviewWeightUnit(parsed.unit);
        }
      }
    }
  }, [showReviewNewFoodsModal, currentReviewIndex, selectedMatchMode, dietItems, pendingNewFoodsToReview]);

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
      servings: 4,
      dietaryRestrictions: [],
      foodCategories: FOOD_CATEGORIES,
      foodPortions: [],
      servingsDefault: 1,
      language: 'fr',
      defaultRecipesTab: 'recipes',
      defaultPlanningTab: 'recipes',
      dietServingsDefault: 2.5,
      dietLunchCustomServings: 1,
      dietLunchCustomDays: [1, 2, 3, 4, 5],
      dietDinnerCustomServings: 2.5,
      dietDinnerCustomDays: [],
      dietServingsDefaultColor: 'green',
      dietLunchCustomColor: 'green',
      dietDinnerCustomColor: 'green',
      dietRoundDiscreteUnits: true,
      dietRoundingMode: 'nearest',
      dietRoundingUnits: DEFAULT_DIET_ROUNDING_UNITS
    };
    
    if (!saved) return defaultSettings;
    
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        dietServingsDefault: parsed.dietServingsDefault ?? defaultSettings.dietServingsDefault,
        dietLunchCustomServings: parsed.dietLunchCustomServings ?? defaultSettings.dietLunchCustomServings,
        dietLunchCustomDays: parsed.dietLunchCustomDays ?? defaultSettings.dietLunchCustomDays,
        dietDinnerCustomServings: parsed.dietDinnerCustomServings ?? defaultSettings.dietDinnerCustomServings,
        dietDinnerCustomDays: parsed.dietDinnerCustomDays ?? defaultSettings.dietDinnerCustomDays,
        dietServingsDefaultColor: parsed.dietServingsDefaultColor ?? 'green',
        dietLunchCustomColor: parsed.dietLunchCustomColor ?? 'green',
        dietDinnerCustomColor: parsed.dietDinnerCustomColor ?? 'green',
        dietRoundDiscreteUnits: parsed.dietRoundDiscreteUnits ?? true,
        dietRoundingMode: parsed.dietRoundingMode ?? 'nearest',
        dietRoundingUnits: Array.isArray(parsed.dietRoundingUnits) ? parsed.dietRoundingUnits : DEFAULT_DIET_ROUNDING_UNITS,
        foodPortions: parsed.foodPortions || defaultSettings.foodPortions
      };
    } catch (e) {
      return defaultSettings;
    }
  });

  
  const [baseDate, setBaseDate] = useState(() => {
    const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    return start;
  });

  useEffect(() => {
    const start = getStartOfWeek(new Date(), settings.startDay ?? 1);
    if (settings.defaultWeek === 'next') {
      start.setDate(start.getDate() + 7);
    }
    setBaseDate(start);
  }, [settings.startDay, settings.defaultWeek]);

  const [dietServings, setDietServings] = useState<number>(() => {
    const saved = localStorage.getItem('culina_diet_servings');
    return saved ? parseFloat(saved) || 2.5 : 2.5;
  });

  const [dietRecipes, setDietRecipes] = useState<DietRecipe[]>(() => {
    const saved = localStorage.getItem('culina_diet_recipes_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [unclassifiedFoodsQueue, setUnclassifiedFoodsQueue] = useState<{ id: string; name: string; unit: string; category: string }[]>([]);
  const [showUnclassifiedFoodsModal, setShowUnclassifiedFoodsModal] = useState(false);

  const checkAndPromptMissingFoodPortions = useCallback((items: { name: string; unit?: string; category?: string }[], customPortions?: FoodPortion[]) => {
    const portions = customPortions || settings.foodPortions || [];
    const missingItems: { id: string; name: string; unit: string; category: string }[] = [];
    const seen = new Set<string>();

    items.forEach(item => {
      const trimmed = (item.name || '').trim();
      if (!trimmed) return;
      const norm = trimmed.toLowerCase();
      if (seen.has(norm)) return;
      seen.add(norm);

      const exists = portions.some(p => p.name.trim().toLowerCase() === norm);
      if (!exists) {
        const guessedCat = item.category || detectSettingsCategoryFromFoodName(trimmed);
        const parsedUnit = item.unit ? parseWeightAndUnit(`1 ${item.unit}`).unit : 'g';
        missingItems.push({
          id: Math.random().toString(36).substr(2, 9),
          name: trimmed,
          unit: parsedUnit,
          category: guessedCat
        });
      }
    });

    if (missingItems.length > 0) {
      setUnclassifiedFoodsQueue(missingItems);
      setShowUnclassifiedFoodsModal(true);
    }
  }, [settings.foodPortions]);

  const handleSaveUnclassifiedFoods = () => {
    setSettings(prev => {
      const currentPortions = prev.foodPortions || [];
      const currentCategories = prev.foodCategories || FOOD_CATEGORIES;
      const newPortions = [...currentPortions];
      const newCategories = [...currentCategories];

      unclassifiedFoodsQueue.forEach(item => {
        const norm = item.name.trim().toLowerCase();
        if (!newPortions.some(p => p.name.trim().toLowerCase() === norm)) {
          newPortions.push({
            id: Math.random().toString(36).substr(2, 9),
            name: item.name.trim(),
            amount: 1,
            unit: item.unit || 'g',
            category: item.category || undefined,
            baseAmount: 1,
            baseUnit: 'portion(s)',
            purchaseAmount: 1,
            purchaseUnit: 'pièce(s)'
          });
          if (item.category && !newCategories.includes(item.category)) {
            newCategories.push(item.category);
          }
        }
      });

      return {
        ...prev,
        foodPortions: newPortions,
        foodCategories: newCategories
      };
    });

    setShowUnclassifiedFoodsModal(false);
    setUnclassifiedFoodsQueue([]);
  };

  const [showQuickBackupModal, setShowQuickBackupModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('culina_recipes', JSON.stringify(recipes));
    localStorage.setItem('culina_plan_v2', JSON.stringify(mealPlan));
    localStorage.setItem('culina_settings', JSON.stringify(settings));
    localStorage.setItem('culina_shopping', JSON.stringify(shoppingList));
    localStorage.setItem('culina_pantry_v3', JSON.stringify(pantryGroups));
    localStorage.setItem('culina_reserve', JSON.stringify(reserveItems));
    localStorage.setItem('culina_sent_meals', JSON.stringify(Array.from(sentMeals)));
    localStorage.setItem('culina_diet_items_v1', JSON.stringify(dietItems));
    localStorage.setItem('culina_diet_servings', dietServings.toString());
    localStorage.setItem('culina_diet_recipes_v1', JSON.stringify(dietRecipes));
  }, [recipes, mealPlan, settings, shoppingList, pantryGroups, reserveItems, sentMeals, dietItems, dietServings, dietRecipes]);

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
      const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const updatedDay = { ...day };

      if (recipeId) {
        // Clear any old diet meal on this slot to enforce strictly 1 meal per slot
        delete updatedDay[targetDietKey];
        updatedDay[mealType as 'lunch' | 'dinner'] = {
          recipe1: slot === 'recipe1' ? recipeId : undefined,
          recipe2: slot === 'recipe2' ? recipeId : undefined
        };
      } else {
        const updatedMeal = { ...meal, [slot as 'recipe1' | 'recipe2']: undefined };
        if (!updatedMeal.recipe1 && !updatedMeal.recipe2) {
          delete updatedDay[mealType as 'lunch' | 'dinner'];
        } else {
          updatedDay[mealType as 'lunch' | 'dinner'] = updatedMeal;
        }
      }

      return {
        ...prev,
        [date]: updatedDay
      };
    });
    const mealKey = mealType === 'extra' ? `${date}-${slot}-${index}` : `${date}-${mealType}-${slot}`;
    if (sentMeals.has(mealKey)) {
      const next = new Set(sentMeals);
      next.delete(mealKey);
      setSentMeals(next);
    }
  };

  const updateDietMealPlan = (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe' | 'servings', itemIdOrValue: string | number | undefined) => {
    setMealPlan(prev => {
      const day = prev[date] || {};
      const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const dietObj = (mealType === 'lunch' ? day.dietLunch : day.dietDinner) || {};
      const updatedDay = { ...day };

      // If assigning a diet recipe or diet items (other than just changing servings count), clear classic recipes on that slot
      if (itemIdOrValue && slot !== 'servings') {
        delete updatedDay[mealType];
        if (slot === 'dietRecipe') {
          // Setting a dedicated diet recipe clears individual custom items
          const newDietObj: any = { servings: dietObj.servings, dietRecipe: itemIdOrValue };
          updatedDay[targetKey] = newDietObj;
        } else {
          // Setting custom items clears any dedicated diet recipe
          const newDietObj: any = { ...dietObj, dietRecipe: undefined, [slot]: itemIdOrValue };
          updatedDay[targetKey] = newDietObj;
        }
      } else if (!itemIdOrValue && slot !== 'servings') {
        const newDietObj: any = { ...dietObj, [slot]: undefined };
        if (!newDietObj.protein && !newDietObj.vegetable && !newDietObj.starch && !newDietObj.dessert && !newDietObj.dietRecipe) {
          delete updatedDay[targetKey];
        } else {
          updatedDay[targetKey] = newDietObj;
        }
      } else {
        updatedDay[targetKey] = { ...dietObj, [slot]: itemIdOrValue };
      }

      return {
        ...prev,
        [date]: updatedDay
      };
    });

    const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
    setSentMeals(prev => {
      const wholeMealKey = `${date}-${targetKey}`;
      const slotKey = `${date}-${targetKey}-${slot}`;
      const hasAny = prev.has(wholeMealKey) || prev.has(slotKey) || 
        prev.has(`${date}-${targetKey}-protein`) || 
        prev.has(`${date}-${targetKey}-vegetable`) || 
        prev.has(`${date}-${targetKey}-starch`) || 
        prev.has(`${date}-${targetKey}-dessert`) || 
        prev.has(`${date}-${targetKey}-dietRecipe`);
      if (!hasAny) return prev;

      const next = new Set(prev);
      next.delete(wholeMealKey);
      next.delete(slotKey);
      next.delete(`${date}-${targetKey}-protein`);
      next.delete(`${date}-${targetKey}-vegetable`);
      next.delete(`${date}-${targetKey}-starch`);
      next.delete(`${date}-${targetKey}-dessert`);
      next.delete(`${date}-${targetKey}-dietRecipe`);
      return next;
    });
  };

  const mergeToShoppingList = useCallback((newItems: ShoppingListItem[]) => {
    setShoppingList(currentList => {
      const updatedList = [...currentList];
      newItems.forEach(newItem => {
        const roundedNewAmount = roundShoppingAmount(newItem.amount, newItem.unit);
        const existingIndex = updatedList.findIndex(
          item => item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() && 
            (item.unit.toLowerCase().trim() === newItem.unit.toLowerCase().trim() ||
             convertUnitAmount(1, item.unit, newItem.unit) !== null)
        );
        if (existingIndex > -1 && !updatedList[existingIndex].checked) {
          const targetUnit = updatedList[existingIndex].unit;
          const convertedNewAmount = convertUnitAmount(roundedNewAmount, newItem.unit, targetUnit);
          if (convertedNewAmount !== null) {
            updatedList[existingIndex].amount = roundShoppingAmount(updatedList[existingIndex].amount + convertedNewAmount, targetUnit);
          } else {
            updatedList[existingIndex].amount = roundShoppingAmount(updatedList[existingIndex].amount + roundedNewAmount, targetUnit);
          }
        } else {
          updatedList.push({
            ...newItem,
            amount: roundedNewAmount
          });
        }
      });
      return updatedList;
    });

    checkAndPromptMissingFoodPortions(newItems);
  }, [checkAndPromptMissingFoodPortions]);

  const handleQuickAddFoodToSettings = (name: string, unit: string = 'g', category: string = '') => {
    setSettings(prev => {
      const portions = prev.foodPortions || [];
      const trimmedName = name.trim();
      const existingIndex = portions.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      const currentCategories = prev.foodCategories || FOOD_CATEGORIES;
      const resolvedCategory = category && category !== 'Épicerie' && category !== 'Sans catégorie' && currentCategories.includes(category) ? category : undefined;

      if (existingIndex > -1) {
        const updatedPortions = [...portions];
        updatedPortions[existingIndex] = {
          ...updatedPortions[existingIndex],
          category: resolvedCategory || updatedPortions[existingIndex].category
        };
        return { ...prev, foodPortions: updatedPortions };
      }
      const newPortion: FoodPortion = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        amount: 1,
        unit: unit,
        category: resolvedCategory,
        baseAmount: 1,
        baseUnit: 'portion(s)',
        purchaseAmount: 1,
        purchaseUnit: 'pièce(s)'
      };
      return { ...prev, foodPortions: [...portions, newPortion] };
    });
  };

  const exportToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      recipes,
      mealPlan,
      settings: {
        ...settings,
        foodPortions: settings.foodPortions || [],
        customWeightUnits: settings.customWeightUnits || [],
        customPortionUnits: settings.customPortionUnits || [],
        portionUnitsList: settings.portionUnitsList || []
      },
      shoppingList,
      pantryGroups,
      reserveItems,
      sentMeals: Array.from(sentMeals),
      dietItems,
      dietRecipes,
      dietServings,
      foodPortions: settings.foodPortions || [],
      customWeightUnits: settings.customWeightUnits || [],
      customPortionUnits: settings.customPortionUnits || [],
      portionUnitsList: settings.portionUnitsList || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_backup_${today}.json`;
    a.click();
  };

  const importFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!data) {
          alert("Fichier JSON vide ou invalide.");
          return;
        }

        let importedRecipes = undefined;
        let importedDietRecipes = undefined;
        let importedMealPlan = undefined;
        let importedShoppingList = undefined;
        let importedPantryGroups = undefined;
        let importedReserveItems = undefined;
        let importedDietItems = undefined;
        let importedSentMeals = undefined;
        let importedDietServings = undefined;
        let incomingSettings: any = {};

        if (Array.isArray(data)) {
          if (data.length > 0) {
            const first = data[0];
            if (first && (first.ingredients && typeof first.ingredients === 'string' || first.items)) {
              importedDietRecipes = data;
            } else {
              importedRecipes = data;
            }
          } else {
            importedRecipes = [];
          }
        } else {
          importedRecipes = data.recipes;
          importedDietRecipes = data.dietRecipes;
          importedMealPlan = data.mealPlan;
          importedShoppingList = data.shoppingList;
          importedPantryGroups = data.pantryGroups;
          importedReserveItems = data.reserveItems;
          importedDietItems = data.dietItems;
          importedSentMeals = data.sentMeals;
          importedDietServings = data.dietServings;
          incomingSettings = data.settings || {};
        }

        // 1. Appliquer les états et sauvegarder de manière synchrone pour garantir la persistance immédiate
        if (importedRecipes && Array.isArray(importedRecipes)) {
          setRecipes(importedRecipes);
          localStorage.setItem('culina_recipes', JSON.stringify(importedRecipes));
        }
        if (importedMealPlan) {
          setMealPlan(importedMealPlan);
          localStorage.setItem('culina_plan_v2', JSON.stringify(importedMealPlan));
        }
        if (importedShoppingList && Array.isArray(importedShoppingList)) {
          setShoppingList(importedShoppingList);
          localStorage.setItem('culina_shopping', JSON.stringify(importedShoppingList));
        }
        if (importedPantryGroups && Array.isArray(importedPantryGroups)) {
          setPantryGroups(importedPantryGroups);
          localStorage.setItem('culina_pantry_v3', JSON.stringify(importedPantryGroups));
        }
        if (importedReserveItems && Array.isArray(importedReserveItems)) {
          setReserveItems(importedReserveItems);
          localStorage.setItem('culina_reserve', JSON.stringify(importedReserveItems));
        }
        if (importedDietItems && Array.isArray(importedDietItems)) {
          setDietItems(importedDietItems);
          localStorage.setItem('culina_diet_items_v1', JSON.stringify(importedDietItems));
        }
        if (importedDietRecipes && Array.isArray(importedDietRecipes)) {
          setDietRecipes(importedDietRecipes);
          localStorage.setItem('culina_diet_recipes_v1', JSON.stringify(importedDietRecipes));
        }
        if (importedSentMeals && Array.isArray(importedSentMeals)) {
          setSentMeals(new Set(importedSentMeals));
          localStorage.setItem('culina_sent_meals', JSON.stringify(importedSentMeals));
        }
        if (importedDietServings !== undefined) {
          const parsedServings = parseFloat(importedDietServings) || 2.5;
          setDietServings(parsedServings);
          localStorage.setItem('culina_diet_servings', parsedServings.toString());
        }

        // 2. Traitement sécurisé des paramètres (Settings)
        const incomingFoodPortions = (Array.isArray(data.foodPortions) && data.foodPortions.length > 0)
          ? data.foodPortions
          : (Array.isArray(incomingSettings.foodPortions) ? incomingSettings.foodPortions : null);
        const incomingCustomWeightUnits = Array.isArray(data.customWeightUnits)
          ? data.customWeightUnits
          : (Array.isArray(incomingSettings.customWeightUnits) ? incomingSettings.customWeightUnits : null);
        const incomingCustomPortionUnits = Array.isArray(data.customPortionUnits)
          ? data.customPortionUnits
          : (Array.isArray(incomingSettings.customPortionUnits) ? incomingSettings.customPortionUnits : null);
        const incomingPortionUnitsList = Array.isArray(data.portionUnitsList)
          ? data.portionUnitsList
          : (Array.isArray(incomingSettings.portionUnitsList) ? incomingSettings.portionUnitsList : null);

        setSettings(prev => {
          const finalSettings = {
            ...prev,
            ...incomingSettings,
            foodCategories: incomingSettings.foodCategories && incomingSettings.foodCategories.length > 0
              ? incomingSettings.foodCategories
              : (prev.foodCategories || FOOD_CATEGORIES),
            foodPortions: incomingFoodPortions !== null
              ? incomingFoodPortions
              : (prev.foodPortions || []),
            customWeightUnits: incomingCustomWeightUnits !== null
              ? incomingCustomWeightUnits
              : (prev.customWeightUnits || []),
            customPortionUnits: incomingCustomPortionUnits !== null
              ? incomingCustomPortionUnits
              : (prev.customPortionUnits || []),
            portionUnitsList: incomingPortionUnitsList !== null
              ? incomingPortionUnitsList
              : (prev.portionUnitsList || [])
          };
          localStorage.setItem('culina_settings', JSON.stringify(finalSettings));
          return finalSettings;
        });

        // 3. Traiter les portions manquantes éventuelles
        const importedFoods: { name: string; unit?: string; category?: string }[] = [];
        const finalRecipes = importedRecipes || recipes;
        const finalDietRecipes = importedDietRecipes || dietRecipes;
        const finalShoppingList = importedShoppingList || shoppingList;
        const finalDietItems = importedDietItems || dietItems;

        if (Array.isArray(finalShoppingList)) {
          finalShoppingList.forEach((i: any) => i.name && importedFoods.push({ name: i.name, unit: i.unit, category: i.category }));
        }
        if (Array.isArray(finalDietItems)) {
          finalDietItems.forEach((i: any) => i.name && importedFoods.push({ name: i.name, category: i.settingsCategory || i.category }));
        }
        if (Array.isArray(finalRecipes)) {
          finalRecipes.forEach((r: any) => {
            if (Array.isArray(r.ingredients)) {
              r.ingredients.forEach((ing: any) => ing.name && importedFoods.push({ name: ing.name, unit: ing.unit }));
            }
          });
        }
        if (Array.isArray(finalDietRecipes)) {
          finalDietRecipes.forEach((r: any) => {
            if (Array.isArray(r.items)) {
              r.items.forEach((item: any) => item.name && importedFoods.push({ name: item.name, unit: item.unit, category: item.category }));
            }
          });
        }
        const targetPortions = incomingFoodPortions || data.foodPortions || incomingSettings.foodPortions || settings.foodPortions;
        checkAndPromptMissingFoodPortions(importedFoods, targetPortions);

        alert("Données importées avec succès !");
      } catch (err: any) {
        console.error("Erreur d'importation globale:", err);
        alert("Erreur lors de l'importation : " + (err?.message || err || "Format de fichier non supporté"));
      }
    };
    reader.readAsText(file);
  };

  const exportPlanningToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      mealPlan,
      sentMeals: Array.from(sentMeals)
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_planning_${today}.json`;
    a.click();
  };

  const importPlanningFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data && typeof data === 'object' && ('mealPlan' in data || 'sentMeals' in data)) {
          if (data.mealPlan) setMealPlan(data.mealPlan);
          if (Array.isArray(data.sentMeals)) setSentMeals(new Set(data.sentMeals));
        } else {
          setMealPlan(data);
        }
        alert("Planning importé avec succès !");
      } catch (err) { alert("Erreur lors de l'importation du planning."); }
    };
    reader.readAsText(file);
  };

  const exportDietPlanningToJSON = () => {
    const today = formatDateKey(new Date());
    const dietPlanData: Record<string, { dietLunch?: { protein?: string; vegetable?: string; starch?: string; dessert?: string }; dietDinner?: { protein?: string; vegetable?: string; starch?: string; dessert?: string } }> = {};

    Object.entries(mealPlan).forEach(([dateStr, dayPlan]) => {
      const plan = dayPlan as MealPlanDay;
      if (plan?.dietLunch || plan?.dietDinner) {
        const getSlotName = (itemId?: string) => {
          if (!itemId) return undefined;
          const found = dietItems.find(i => i.id === itemId);
          return found ? found.name : itemId;
        };

        const lunch = plan.dietLunch ? {
          protein: getSlotName(plan.dietLunch.protein),
          vegetable: getSlotName(plan.dietLunch.vegetable),
          starch: getSlotName(plan.dietLunch.starch),
          dairy: getSlotName(plan.dietLunch.dairy),
          dessert: getSlotName(plan.dietLunch.dessert)
        } : undefined;

        const dinner = plan.dietDinner ? {
          protein: getSlotName(plan.dietDinner.protein),
          vegetable: getSlotName(plan.dietDinner.vegetable),
          starch: getSlotName(plan.dietDinner.starch),
          dairy: getSlotName(plan.dietDinner.dairy),
          dessert: getSlotName(plan.dietDinner.dessert)
        } : undefined;

        if (lunch || dinner) {
          dietPlanData[dateStr] = {};
          if (lunch) dietPlanData[dateStr].dietLunch = lunch;
          if (dinner) dietPlanData[dateStr].dietDinner = dinner;
        }
      }
    });

    const data = {
      type: "culinashare_diet_planning",
      dietPlan: dietPlanData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_planning_regime_${today}.json`;
    a.click();
  };

  const importDietPlanningFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!raw) {
          alert("Fichier JSON invalide.");
          return;
        }

        const sourceData = raw.dietPlan || raw.mealPlan || raw;
        if (typeof sourceData !== 'object') {
          alert("Format du fichier JSON non reconnu.");
          return;
        }

        let updatedMealPlan = { ...mealPlan };
        let currentDietItems = [...dietItems];
        let itemsAddedCount = 0;

        setSettings(prevSet => {
          const currentPortions = prevSet.foodPortions || [];
          const currentCategories = prevSet.foodCategories || FOOD_CATEGORIES;
          let changed = false;
          const newPortions = [...currentPortions];
          let newCategories = [...currentCategories];

          const resolveDietItemId = (val?: string, categoryDefault: DietCategory = 'Protéines'): string | undefined => {
            if (!val || typeof val !== 'string' || !val.trim()) return undefined;
            const trimmed = val.trim();
            
            let found = currentDietItems.find(i => i.id === trimmed);
            if (found) return found.id;

            found = currentDietItems.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
            if (found) return found.id;

            const newId = Math.random().toString(36).substr(2, 9);
            const newItem: DietItem = {
              id: newId,
              name: trimmed,
              category: categoryDefault,
              weight: '100 g'
            };
            currentDietItems.push(newItem);
            itemsAddedCount++;

            const norm = trimmed.toLowerCase();
            if (!newPortions.some(p => p.name.trim().toLowerCase() === norm)) {
              const cat = detectSettingsCategoryFromFoodName(trimmed, categoryDefault);
              newPortions.push({
                id: Math.random().toString(36).substr(2, 9),
                name: trimmed,
                amount: 1,
                unit: 'g',
                category: cat
              });
              if (!newCategories.includes(cat)) {
                newCategories.push(cat);
              }
              changed = true;
            }

            return newId;
          };

          Object.entries(sourceData).forEach(([dateStr, planObj]: [string, any]) => {
            if (!planObj || typeof planObj !== 'object') return;

            const dietLunch = planObj.dietLunch || planObj.lunch;
            const dietDinner = planObj.dietDinner || planObj.dinner;

            const newLunch = dietLunch ? {
              protein: resolveDietItemId(dietLunch.protein, 'Protéines'),
              vegetable: resolveDietItemId(dietLunch.vegetable, 'Légumes'),
              starch: resolveDietItemId(dietLunch.starch, 'Féculents'),
              dairy: resolveDietItemId(dietLunch.dairy, 'Laitage'),
              dessert: resolveDietItemId(dietLunch.dessert, 'Desserts')
            } : undefined;

            const newDinner = dietDinner ? {
              protein: resolveDietItemId(dietDinner.protein, 'Protéines'),
              vegetable: resolveDietItemId(dietDinner.vegetable, 'Légumes'),
              starch: resolveDietItemId(dietDinner.starch, 'Féculents'),
              dairy: resolveDietItemId(dietDinner.dairy, 'Laitage'),
              dessert: resolveDietItemId(dietDinner.dessert, 'Desserts')
            } : undefined;

            updatedMealPlan[dateStr] = {
              ...updatedMealPlan[dateStr],
              ...(newLunch ? { dietLunch: newLunch } : {}),
              ...(newDinner ? { dietDinner: newDinner } : {})
            };
          });

          return changed ? { ...prevSet, foodPortions: newPortions, foodCategories: newCategories } : prevSet;
        });

        setMealPlan(updatedMealPlan);
        setDietItems(currentDietItems);

        let msg = "Planning Régime (JSON) importé avec succès !";
        if (itemsAddedCount > 0) {
          msg += `\n${itemsAddedCount} nouveau(x) aliment(s) ajouté(s) automatiquement aux Aliments Régime.`;
        }
        alert(msg);
      } catch (err) {
        alert("Erreur lors de l'importation du planning régime.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportDietRecipesToJSON = () => {
    const today = formatDateKey(new Date());
    const data = {
      type: "culinashare_diet_recipes",
      dietRecipes: dietRecipes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culinashare_recettes_regime_${today}.json`;
    a.click();
  };

  const importDietRecipesFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!raw) {
          alert("Fichier JSON invalide.");
          return;
        }

        const list = Array.isArray(raw) ? raw : (raw.dietRecipes || raw.recipes || []);
        if (!Array.isArray(list) || list.length === 0) {
          alert("Aucune recette régime trouvée dans le fichier JSON.");
          return;
        }

        let addedCount = 0;
        let extractedItems: { name: string, category?: string, weight?: string, recipeName?: string }[] = [];
        const newRecipes: DietRecipe[] = [];
        
        // Ensure we know the existing ones to avoid dupes in the recipe list itself
        const existingIds = new Set(dietRecipes.map(r => r.id));
        const existingNames = new Set(dietRecipes.map(r => r.name.trim().toLowerCase()));

        list.forEach((item: any) => {
          if (!item || !item.name || typeof item.name !== 'string') return;
          const trimmedName = item.name.trim();
          if (!trimmedName) return;

          if (existingNames.has(trimmedName.toLowerCase())) return;

          const newRecipe: DietRecipe = {
            id: item.id && !existingIds.has(item.id) ? item.id : Math.random().toString(36).substr(2, 9),
            name: trimmedName,
            ingredients: typeof item.ingredients === 'string' ? item.ingredients : (Array.isArray(item.ingredients) ? item.ingredients.map((i: any) => typeof i === 'string' ? i : (i?.name || '')).join(' + ') : (item.ingredients ? String(item.ingredients) : '')),
            servings: typeof item.servings === 'number' ? item.servings : 2.5,
            items: Array.isArray(item.items) ? item.items : []
          };

          const recipeItems: DietRecipeItem[] = [];
          if (Array.isArray(item.items) && item.items.length > 0) {
            item.items.forEach((i: any) => {
              if (i && i.name && typeof i.name === 'string') {
                const trName = i.name.trim();
                if (trName) {
                  recipeItems.push({ name: trName, category: i.category, weight: i.weight || '' });
                  extractedItems.push({ name: trName, category: i.category, weight: i.weight || '', recipeName: trimmedName });
                }
              }
            });
          } else if (typeof newRecipe.ingredients === 'string' && newRecipe.ingredients.trim()) {
            const rawParts = newRecipe.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
            rawParts.forEach((part: string) => {
              const trimmed = part.trim();
              const match = trimmed.match(/^(.*?)(?:\s*\(|\s+)([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)\)?$/i);
              const ingName = match ? match[1].replace(/[:\-]$/, '').trim() : trimmed.replace(/\(.*?\)/g, '').trim();
              const ingWeight = match ? match[2].trim() : '';
              if (ingName) {
                recipeItems.push({ name: ingName, weight: ingWeight });
                extractedItems.push({ name: ingName, weight: ingWeight, recipeName: trimmedName });
              }
            });
          }

          if (newRecipe.items.length === 0 && recipeItems.length > 0) {
            newRecipe.items = recipeItems;
          }

          newRecipes.push(newRecipe);
          existingNames.add(trimmedName.toLowerCase());
          addedCount++;
        });

        if (addedCount === 0) {
          alert("Aucune nouvelle recette régime trouvée à importer.");
          return;
        }

        const existingDietItemMap = new Map<string, DietItem>(dietItems.map(d => [d.name.trim().toLowerCase(), d]));
        const existingNamesInSettings = new Set(
          (settings.foodPortions || []).map(p => p.name.trim().toLowerCase())
        );

        const newFoods: typeof extractedItems = [];
        const seenNew = new Set<string>();

        extractedItems.forEach(ex => {
          const nLow = ex.name.trim().toLowerCase();
          const existingDietItem = existingDietItemMap.get(nLow);
          const isKnownInBoth = existingDietItem && existingNamesInSettings.has(nLow);

          let hasUnitMismatch = false;
          if (existingDietItem && existingDietItem.weight && ex.weight) {
            const existingParsed = parseWeightAndUnit(existingDietItem.weight);
            const importedParsed = parseWeightAndUnit(ex.weight);
            if (existingParsed.unit && importedParsed.unit && existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase()) {
              hasUnitMismatch = true;
            }
          }

          if (!isKnownInBoth || hasUnitMismatch) {
            const key = `${ex.recipeName || ''}_${nLow}`;
            if (!seenNew.has(key)) {
              seenNew.add(key);
              newFoods.push(ex);
            }
          }
        });

        if (newFoods.length > 0) {
          setPendingDietRecipes(newRecipes);
          setPendingNewFoodsToReview(newFoods);
          setCurrentReviewIndex(0);

          const firstFood = newFoods[0];
          const existingInDietFirst = dietItems.find(d => d.name.toLowerCase() === firstFood.name.toLowerCase());
          if (existingInDietFirst) {
            setSelectedMatchMode(existingInDietFirst.name);
          } else {
            setSelectedMatchMode('__NEW__');
          }

          setReviewedReplacements({});
          setReviewedWeightOverrides({});
          setReviewedNewFoods([]);

          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : (existingInDietFirst?.category || 'Légumes'));
          
          const initialSetCat = detectSettingsCategoryFromFoodName(firstFood.name, firstFood.category);
          setReviewSetCat(initialSetCat);

          setShowReviewNewFoodsModal(true);
        } else {
          setDietRecipes(prev => [...prev, ...newRecipes]);
          alert(`Recettes Régime importées avec succès !\n${addedCount} recette(s) ajoutée(s).`);
        }

      } catch (err) {
        alert("Erreur lors de l'importation des recettes régime.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportDietItemsToExcel = () => {
    const today = formatDateKey(new Date());
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("La bibliothèque d'export Excel n'est pas chargée.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const dietData = dietItems.map(item => {
      const settingsPortion = settings.foodPortions?.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      return {
        "Aliments": item.name,
        "Poids": item.weight || "100 g",
        "Personnes": 2.5,
        "Catégorie (Régime)": item.category || "Protéines",
        "Catégorie (Réglages)": settingsPortion?.category || item.category || "Protéines"
      };
    });

    const ws = XLSX.utils.json_to_sheet(dietData);
    XLSX.utils.book_append_sheet(workbook, ws, "Aliments Régime");

    XLSX.writeFile(workbook, `culina_aliments_regime_${today}.xlsx`);
  };

  const importDietItemsFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    const file = e.target.files?.[0];
    if (!file || !XLSX) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const firstSheetName = wb.SheetNames[0];
        const sheetName = wb.SheetNames.includes("Aliments Régime") ? "Aliments Régime" : firstSheetName;
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          alert("Aucune feuille trouvée dans le fichier Excel.");
          return;
        }

        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          alert("Aucun aliment trouvé dans le fichier Excel.");
          return;
        }

        const itemsToImport = data.map((row: any) => {
          const keys = Object.keys(row);
          // Colonne A: Aliments
          const rawName = row["Aliments"] || row["aliments"] || row["ALIMENTS"] || row["Aliment"] || row["aliment"] || (keys[0] ? row[keys[0]] : "");
          // Colonne B: Poids
          const rawWeight = row["Poids"] || row["poids"] || row["POIDS"] || (keys[1] ? row[keys[1]] : "") || "100 g";
          
          // Colonne Personnes:
          const personsValue = row["Personnes"] || row["personnes"] || row["PERSONNES"] || row["Personne"] || row["personne"] || row["Nb personnes"] || row["Nombre de personnes"] || row["Nb Personnes"] || row["Nombre de Personnes"];
          let parsedPersons = 2.5;
          if (personsValue !== undefined && personsValue !== null && personsValue !== "") {
            const p = parseFloat(String(personsValue).replace(',', '.'));
            if (!isNaN(p) && p > 0) {
              parsedPersons = p;
            }
          }

          const strWeight = rawWeight ? String(rawWeight).trim() : "100 g";
          const normalizedWeight = parsedPersons !== 2.5 ? scaleTextQuantity(strWeight, 2.5, parsedPersons) : strWeight;

          // Colonne C / D: Catégories
          const rawDietCategory = row["Catégorie (Régime)"] || row["Categorie (Regime)"] || row["Catégorie Régime"] || row["Catégories"] || row["Catégorie"] || row["catégorie"];
          let finalDietCategory = rawDietCategory;
          if (!finalDietCategory) {
            const dietKey = keys.find(k => /régime|regime/i.test(k));
            if (dietKey) {
              finalDietCategory = row[dietKey];
            } else if (personsValue !== undefined) {
              finalDietCategory = keys[3] ? row[keys[3]] : "";
            } else {
              finalDietCategory = keys[2] ? row[keys[2]] : "";
            }
          }

          const rawSettingsCategory = row["Catégorie (Réglages)"] || row["Categorie (Reglages)"] || row["Catégorie Réglages"] || row["Catégories (Réglages)"];
          let finalSettingsCategory = rawSettingsCategory;
          if (!finalSettingsCategory) {
            const setKey = keys.find(k => /réglages|reglages/i.test(k));
            if (setKey) {
              finalSettingsCategory = row[setKey];
            } else if (personsValue !== undefined) {
              finalSettingsCategory = keys[4] ? row[keys[4]] : "";
            } else {
              finalSettingsCategory = keys[3] ? row[keys[3]] : "";
            }
          }

          return {
            name: rawName ? String(rawName).trim() : "",
            weight: normalizedWeight || "100 g",
            dietCategory: finalDietCategory ? String(finalDietCategory).trim() : "Protéines",
            settingsCategory: finalSettingsCategory ? String(finalSettingsCategory).trim() : (finalDietCategory ? String(finalDietCategory).trim() : "Protéines")
          };
        }).filter(item => item.name.length > 0);

        if (itemsToImport.length === 0) {
          alert("Aucun aliment valide trouvé dans le fichier Excel.");
          return;
        }

        const existingNamesInDiet = new Set(dietItems.map(d => d.name.trim().toLowerCase()));
        const existingNamesInSettings = new Set((settings.foodPortions || []).map(p => p.name.trim().toLowerCase()));

        const itemsToReview = itemsToImport
          .filter(item => {
            const normName = item.name.trim().toLowerCase();
            const inDiet = existingNamesInDiet.has(normName);
            const inSettings = existingNamesInSettings.has(normName);
            // Règle 1 : Présent dans les 2 listes -> Ignorer (rien ne se passe, évite les doublons)
            // Règle 2 & 3 : Absent de 1 ou des 2 listes -> À valider via le modal
            return !(inDiet && inSettings);
          })
          .map(item => ({
            name: item.name,
            category: item.dietCategory,
            settingsCategory: item.settingsCategory,
            weight: item.weight
          }));

        if (itemsToReview.length > 0) {
          setPendingDietRecipes([]);
          setPendingNewFoodsToReview(itemsToReview);
          setCurrentReviewIndex(0);
          setSelectedMatchMode('__NEW__');
          setReviewedReplacements({});
          setReviewedNewFoods([]);
          setReviewedDietItemsToAdd([]);

          const firstFood = itemsToReview[0];
          const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
          setReviewDietCat((firstFood.category && defaultDietCats.includes(firstFood.category)) ? firstFood.category as DietCategory : 'Légumes');

          const initialSetCat = detectSettingsCategoryFromFoodName(firstFood.name, firstFood.settingsCategory || firstFood.category);
          setReviewSetCat(initialSetCat);

          setShowReviewNewFoodsModal(true);
        } else {
          alert("Tous les aliments de ce fichier Excel sont déjà présents dans vos 2 listes (Recettes Régime et Réglages Aliments).");
        }
      } catch (err) {
        alert("Erreur lors de l'importation du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportToExcel = () => {
    const today = formatDateKey(new Date());
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

    // Sheet 4: Portions (toutes les règles détaillées)
    const portionsData: any[] = [];
    (settings.foodPortions || []).forEach(item => {
      const rules = getPortionRules(item);
      rules.forEach(r => {
        portionsData.push({
          "Aliment": item.name || '',
          "Catégorie": item.category || "Sans catégorie",
          "Quantité base": r.baseAmount || 1,
          "Unité base": r.baseUnit || 'portion(s)',
          "Quantité achat": r.purchaseAmount || 1,
          "Unité achat": r.purchaseUnit || 'pièce(s)',
          "Seuil min": r.minThreshold || ''
        });
      });
    });
    const wsPortions = XLSX.utils.json_to_sheet(portionsData);
    XLSX.utils.book_append_sheet(workbook, wsPortions, "Portions");

    // Sheet 5: Unités Recettes
    const recipeUnitsData = getAvailableRecipeUnits(settings).map(u => ({
      "Unité": u,
      "Type": (settings.customWeightUnits || []).includes(u) ? "Personnalisée" : "Standard"
    }));
    const wsRecipeUnits = XLSX.utils.json_to_sheet(recipeUnitsData);
    XLSX.utils.book_append_sheet(workbook, wsRecipeUnits, "Unités Recettes");

    // Sheet 6: Unités Portions
    const portionUnitsData = getAvailablePortionUnits(settings).map(u => ({
      "Unité": u,
      "Type": (settings.customPortionUnits || []).includes(u) ? "Personnalisée" : "Standard"
    }));
    const wsPortionUnits = XLSX.utils.json_to_sheet(portionUnitsData);
    XLSX.utils.book_append_sheet(workbook, wsPortionUnits, "Unités Portions");

    XLSX.writeFile(workbook, `culinashare_stocks_${today}.xlsx`);
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

        // Process Unités Recettes
        const recipeUnitsSheet = wb.SheetNames.find((s: string) => 
          (s.toLowerCase().includes("unit") && s.toLowerCase().includes("recette")) ||
          s.toLowerCase() === "unités" || s.toLowerCase() === "unites"
        );
        let customRecipeUnitsFromExcel: string[] = [];
        if (recipeUnitsSheet) {
          const ws = wb.Sheets[recipeUnitsSheet];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const unitName = (row["Unité"] || row["unité"] || row["Unite"] || row["unite"] || row["Unit"] || row["unit"] || "").toString().trim();
            const type = (row["Type"] || row["type"] || "").toString().trim().toLowerCase();
            if (unitName) {
              if (type.includes("personnalis") || !MASTER_RECIPE_UNITS.includes(unitName)) {
                if (!customRecipeUnitsFromExcel.includes(unitName)) {
                  customRecipeUnitsFromExcel.push(unitName);
                }
              }
            }
          });
        }

        // Process Unités Portions
        const portionUnitsSheet = wb.SheetNames.find((s: string) => 
          s.toLowerCase().includes("unit") && s.toLowerCase().includes("portion")
        );
        let customPortionUnitsFromExcel: string[] = [];
        let portionUnitsListFromExcel: string[] = [];
        if (portionUnitsSheet) {
          const ws = wb.Sheets[portionUnitsSheet];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const unitName = (row["Unité"] || row["unité"] || row["Unite"] || row["unite"] || row["Unit"] || row["unit"] || "").toString().trim();
            const type = (row["Type"] || row["type"] || "").toString().trim().toLowerCase();
            if (unitName) {
              if (!portionUnitsListFromExcel.includes(unitName)) {
                portionUnitsListFromExcel.push(unitName);
              }
              if (type.includes("personnalis") || !MASTER_PORTION_UNITS.includes(unitName)) {
                if (!customPortionUnitsFromExcel.includes(unitName)) {
                  customPortionUnitsFromExcel.push(unitName);
                }
              }
            }
          });
        }

        // Process Portions and Aliments sheets
        const portionSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("portion") && !s.toLowerCase().includes("unit"));
        const alimentSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("aliment") && !s.toLowerCase().includes("unit"));

        setSettings(prev => {
          let updatedFoodPortions = [...(prev.foodPortions || [])];
          let updatedCustomWeightUnits = [...(prev.customWeightUnits || [])];
          let updatedCustomPortionUnits = [...(prev.customPortionUnits || [])];
          let updatedPortionUnitsList = prev.portionUnitsList ? [...prev.portionUnitsList] : undefined;

          // Merge custom recipe units
          customRecipeUnitsFromExcel.forEach(u => {
            if (!updatedCustomWeightUnits.includes(u)) {
              updatedCustomWeightUnits.push(u);
            }
          });

          // Merge portion units
          if (portionUnitsListFromExcel.length > 0) {
            updatedPortionUnitsList = Array.from(new Set([...(updatedPortionUnitsList || MASTER_PORTION_UNITS), ...portionUnitsListFromExcel]));
          }
          customPortionUnitsFromExcel.forEach(u => {
            if (!updatedCustomPortionUnits.includes(u)) {
              updatedCustomPortionUnits.push(u);
            }
          });

          // If Aliments sheet present, process names and categories
          if (alimentSheetName) {
            const ws = wb.Sheets[alimentSheetName];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || row.Article || row.article || "").toString().trim();
              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || "").toString().trim();
              if (!foodName) return;
              const exists = updatedFoodPortions.find(f => f.name.toLowerCase() === foodName.toLowerCase());
              if (!exists) {
                updatedFoodPortions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: foodName,
                  amount: 1,
                  unit: 'portion(s)',
                  category: category && category !== "Sans catégorie" ? category : undefined,
                  baseAmount: 1,
                  baseUnit: 'portion(s)',
                  purchaseAmount: 1,
                  purchaseUnit: 'pièce(s)'
                });
              } else if (category && category !== "Sans catégorie") {
                exists.category = category;
              }
            });
          }

          // If Portions sheet present, process all detailed rules
          if (portionSheetName) {
            const ws = wb.Sheets[portionSheetName];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            const foodsMap = new Map<string, { name: string; category: string; rules: PortionRule[] }>();

            data.forEach(row => {
              const foodName = (row.Aliment || row.aliment || row.ALIMENT || row.Name || row.name || row.Article || row.article || "").toString().trim();
              if (!foodName) return;

              const category = (row.Catégorie || row.catégorie || row.CATEGORIE || row.Category || row.category || "").toString().trim();
              const baseAmountRaw = row["Quantité base"] ?? row["quantité base"] ?? row.baseAmount ?? row["Quantité Base"] ?? row.amount ?? row.Quantité ?? 1;
              const baseAmount = Number(baseAmountRaw);
              const baseUnit = (row["Unité base"] || row["unité base"] || row.baseUnit || row["Unité Base"] || row.unit || row.Unité || "portion(s)").toString().trim();
              const purchaseAmountRaw = row["Quantité achat"] ?? row["quantité achat"] ?? row.purchaseAmount ?? row["Quantité Achat"] ?? 1;
              const purchaseAmount = Number(purchaseAmountRaw);
              const purchaseUnit = (row["Unité achat"] || row["unité achat"] || row.purchaseUnit || row["Unité Achat"] || "pièce(s)").toString().trim();
              const minThresholdRaw = row["Seuil min"] ?? row["seuil min"] ?? row["Seuil Min"] ?? row["Seuil"] ?? row.minThreshold ?? row.threshold;
              const minThresholdNum = Number(minThresholdRaw);
              const minThreshold = !isNaN(minThresholdNum) && minThresholdNum > 0 ? minThresholdNum : undefined;

              const key = foodName.toLowerCase();
              const rule: PortionRule = {
                id: Math.random().toString(36).substr(2, 9),
                baseAmount: isNaN(baseAmount) || baseAmount <= 0 ? 1 : baseAmount,
                baseUnit: baseUnit || 'portion(s)',
                purchaseAmount: isNaN(purchaseAmount) || purchaseAmount <= 0 ? 1 : purchaseAmount,
                purchaseUnit: purchaseUnit || 'pièce(s)',
                minThreshold: minThreshold
              };

              if (!foodsMap.has(key)) {
                foodsMap.set(key, {
                  name: foodName,
                  category: category && category !== "Sans catégorie" && category !== "Épicerie" ? category : undefined,
                  rules: [rule]
                });
              } else {
                const existingEntry = foodsMap.get(key)!;
                if (category && category !== "Sans catégorie") existingEntry.category = category;
                const dupIdx = existingEntry.rules.findIndex(r => 
                  r.baseUnit.toLowerCase() === rule.baseUnit.toLowerCase() && 
                  r.baseAmount === rule.baseAmount && 
                  r.purchaseUnit.toLowerCase() === rule.purchaseUnit.toLowerCase()
                );
                if (dupIdx >= 0) {
                  existingEntry.rules[dupIdx] = rule;
                } else {
                  existingEntry.rules.push(rule);
                }
              }
            });

            foodsMap.forEach(entry => {
              const idx = updatedFoodPortions.findIndex(p => p.name.trim().toLowerCase() === entry.name.toLowerCase());
              const firstRule = entry.rules[0] || {
                id: Math.random().toString(36).substr(2, 9),
                baseAmount: 1,
                baseUnit: 'portion(s)',
                purchaseAmount: 1,
                purchaseUnit: 'pièce(s)',
                minThreshold: undefined
              };

              const updatedItem: FoodPortion = {
                id: idx >= 0 ? updatedFoodPortions[idx].id : Math.random().toString(36).substr(2, 9),
                name: entry.name,
                category: entry.category || (idx >= 0 ? updatedFoodPortions[idx].category : undefined),
                baseAmount: firstRule.baseAmount,
                baseUnit: firstRule.baseUnit,
                purchaseAmount: firstRule.purchaseAmount,
                purchaseUnit: firstRule.purchaseUnit,
                amount: firstRule.baseAmount,
                unit: firstRule.baseUnit,
                rules: entry.rules
              };

              if (idx >= 0) {
                updatedFoodPortions[idx] = updatedItem;
              } else {
                updatedFoodPortions.push(updatedItem);
              }
            });
          }

          return {
            ...prev,
            foodPortions: updatedFoodPortions,
            customWeightUnits: updatedCustomWeightUnits,
            customPortionUnits: updatedCustomPortionUnits,
            portionUnitsList: updatedPortionUnitsList
          };
        });

        const importedExcelFoods: { name: string; category?: string; unit?: string }[] = [];
        if (wb.SheetNames.includes("Récurrents")) {
          const ws = wb.Sheets["Récurrents"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const itemName = (row.Article || row.article || row.ARTICLE || "").toString().trim();
            if (itemName) importedExcelFoods.push({ name: itemName, unit: (row.Unité || row.unité || row.UNITE || "unité").toString() });
          });
        }
        if (wb.SheetNames.includes("reserves")) {
          const ws = wb.Sheets["reserves"];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          data.forEach(row => {
            const itemName = (row.Article || row.article || row.ARTICLE || "").toString().trim();
            if (itemName) importedExcelFoods.push({ name: itemName, unit: (row.Unité || row.unité || row.UNITE || "unité").toString() });
          });
        }
        checkAndPromptMissingFoodPortions(importedExcelFoods);

        alert("Données Excel importées !");
      } catch (err) {
        alert("Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  const handleQuickBackup = () => {
    exportToJSON();
    setShowQuickBackupModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-20 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onQuickBackup={handleQuickBackup} />
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
            foodCategories={settings.foodCategories || ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre']}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            onRemoveFoodFromSettings={(foodName) => {
              setSettings(prev => ({
                ...prev,
                foodPortions: (prev.foodPortions || []).filter(
                  p => p.name.trim().toLowerCase() !== foodName.trim().toLowerCase()
                )
              }));
            }}
            updateMealPlan={updateMealPlan}
            updateDietMealPlan={updateDietMealPlan}
            setSentMeals={setSentMeals}
            dietItems={dietItems}
            setDietItems={setDietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
            dietRecipes={dietRecipes}
            setDietRecipes={setDietRecipes}
            defaultTab={settings.defaultRecipesTab || 'recipes'}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {activeTab === 'search' && (
          <RecipeSearch 
            recipes={recipes} 
            dietRecipes={dietRecipes}
            setDietRecipes={setDietRecipes}
            dietItems={dietItems}
            setDietItems={setDietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
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
            updateMealPlan={updateMealPlan} 
            updateDietMealPlan={updateDietMealPlan}
            foodPortions={settings.foodPortions || []}
            foodCategories={settings.foodCategories || FOOD_CATEGORIES}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            setSentMeals={setSentMeals}
            settings={settings}
          />
        )}
        {activeTab === 'planning' && (
          <Planning 
            mealPlan={mealPlan} 
            recipes={recipes} 
            updateMealPlan={updateMealPlan} 
            updateDietMealPlan={updateDietMealPlan}
            onMergeToShopping={mergeToShoppingList}
            sentMeals={sentMeals}
            setSentMeals={setSentMeals}
            settings={settings}
            dietItems={dietItems}
            dietServings={dietServings}
            setDietServings={setDietServings}
            dietRecipes={dietRecipes}
          
            baseDate={baseDate}
            setBaseDate={setBaseDate}
          />
        )}
        {activeTab === 'recurring' && (
          <RecurringView 
            groups={pantryGroups} 
            setGroups={setPantryGroups} 
            foodPortions={settings.foodPortions} 
            foodCategories={settings.foodCategories}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            onSendToShopping={(items) => {
              mergeToShoppingList(items.map(i => ({ ...i, checked: false, id: Math.random().toString(36).substr(2, 9) })));
              setActiveTab('shopping');
            }}
            settings={settings}
          />
        )}
        {activeTab === 'reserve' && (
          <InStockView 
            items={reserveItems}
            setItems={setReserveItems}
            foodPortions={settings.foodPortions}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            settings={settings}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingView 
            list={shoppingList} 
            setList={setShoppingList} 
            settings={settings}
            setSettings={setSettings}
            foodPortions={settings.foodPortions || []}
            foodCategories={settings.foodCategories || ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre']}
            onAddFoodToSettings={handleQuickAddFoodToSettings}
            reserveItems={reserveItems}
            setReserveItems={setReserveItems}
            pantryGroups={pantryGroups}
            setPantryGroups={setPantryGroups}
            dietItems={dietItems}
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
            exportPlanningToJSON={exportPlanningToJSON}
            importPlanningFromJSON={importPlanningFromJSON}
            exportDietItemsToExcel={exportDietItemsToExcel}
            importDietItemsFromExcel={importDietItemsFromExcel}
            exportDietPlanningToJSON={exportDietPlanningToJSON}
            importDietPlanningFromJSON={importDietPlanningFromJSON}
            exportDietRecipesToJSON={exportDietRecipesToJSON}
            importDietRecipesFromJSON={importDietRecipesFromJSON}
            sentMeals={sentMeals}
            setSentMeals={setSentMeals}
            recipes={recipes}
            dietRecipes={dietRecipes}
            pantryGroups={pantryGroups}
            reserveItems={reserveItems}
            baseDate={baseDate}
          />
        )}
        {activeTab === 'notice' && (
          <Notice />
        )}
      </main>

      {/* MODAL NOUVEAUX ALIMENTS À CLASSER DANS RÉGLAGES */}
      {showUnclassifiedFoodsModal && unclassifiedFoodsQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white relative">
              <button 
                onClick={() => {
                  setShowUnclassifiedFoodsModal(false);
                  setUnclassifiedFoodsQueue([]);
                }}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📁</span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Nouveaux aliments détectés
                </h3>
              </div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium leading-relaxed">
                {unclassifiedFoodsQueue.length === 1 
                  ? "Cet aliment n'est pas encore enregistré dans vos Réglages > Aliments. Choisissez sa catégorie :"
                  : `Ces ${unclassifiedFoodsQueue.length} aliments ne sont pas encore enregistrés dans vos Réglages > Aliments. Choisissez leur catégorie :`
                }
              </p>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
              {unclassifiedFoodsQueue.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {item.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                        Catégorie Réglages
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnclassifiedFoodsQueue(prev => prev.map(q => q.id === item.id ? { ...q, category: val } : q));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        {(settings.foodCategories || FOOD_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                        Unité
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnclassifiedFoodsQueue(prev => prev.map(q => q.id === item.id ? { ...q, unit: val } : q));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {getAvailableUnits(settings).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnclassifiedFoodsModal(false);
                  setUnclassifiedFoodsQueue([]);
                }}
                className="px-5 py-3 rounded-2xl font-black text-xs text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Ignorer
              </button>
              <button
                onClick={handleSaveUnclassifiedFoods}
                className="px-6 py-3 rounded-2xl font-black text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Enregistrer dans Réglages</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REVIEW NOUVEAUX ALIMENTS (IMPORT RECETTES RÉGIME) */}
      {showReviewNewFoodsModal && pendingNewFoodsToReview.length > 0 && currentReviewIndex < pendingNewFoodsToReview.length && (() => {
        const currentFood = pendingNewFoodsToReview[currentReviewIndex];
        
        // Collect all unique existing food names
        const allExistingFoodNamesList: string[] = [];
        const seenNames = new Set<string>();
        (dietItems || []).forEach(d => {
          if (d.name && d.name.trim() && !seenNames.has(d.name.trim().toLowerCase())) {
            seenNames.add(d.name.trim().toLowerCase());
            allExistingFoodNamesList.push(d.name.trim());
          }
        });
        (settings.foodPortions || []).forEach(p => {
          if (p.name && p.name.trim() && !seenNames.has(p.name.trim().toLowerCase())) {
            seenNames.add(p.name.trim().toLowerCase());
            allExistingFoodNamesList.push(p.name.trim());
          }
        });
        allExistingFoodNamesList.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

        const similarSuggestions = findSimilarDietFoods(currentFood.name, allExistingFoodNamesList);
        const isNewSelected = selectedMatchMode === '__NEW__';

        const handleConfirmCurrent = () => {
          const updatedReplacements = { ...reviewedReplacements };
          const updatedWeightOverrides = { ...reviewedWeightOverrides };
          const updatedNewFoods = [...reviewedNewFoods];
          const updatedDietItemsToAdd = [...reviewedDietItemsToAdd];

          const finalWeight = `${reviewWeightValue.trim()} ${reviewWeightUnit.trim()}`.trim();

          if (currentFood.recipeName) {
            updatedWeightOverrides[`${currentFood.recipeName}_${currentFood.name}`] = finalWeight;
            if (!isNewSelected) {
              updatedWeightOverrides[`${currentFood.recipeName}_${selectedMatchMode}`] = finalWeight;
            }
          }
          updatedWeightOverrides[currentFood.name] = finalWeight;
          if (!isNewSelected) {
            updatedWeightOverrides[selectedMatchMode] = finalWeight;
          }
          setReviewedWeightOverrides(updatedWeightOverrides);

          if (isNewSelected) {
            updatedNewFoods.push({
              name: currentFood.name,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat,
              setCat: reviewSetCat
            });
            setReviewedNewFoods(updatedNewFoods);
            updatedDietItemsToAdd.push({
              name: currentFood.name,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat
            });
          } else {
            updatedReplacements[currentFood.name] = selectedMatchMode;
            setReviewedReplacements(updatedReplacements);
            updatedDietItemsToAdd.push({
              name: selectedMatchMode,
              weight: finalWeight || currentFood.weight,
              dietCat: reviewDietCat
            });
          }
          setReviewedDietItemsToAdd(updatedDietItemsToAdd);

          if (currentReviewIndex + 1 < pendingNewFoodsToReview.length) {
            const nextIdx = currentReviewIndex + 1;
            setCurrentReviewIndex(nextIdx);
            const nextFood = pendingNewFoodsToReview[nextIdx];
            const existingInDietNext = dietItems.find(d => d.name.toLowerCase() === nextFood.name.toLowerCase());
            if (existingInDietNext) {
              setSelectedMatchMode(existingInDietNext.name);
            } else {
              setSelectedMatchMode('__NEW__');
            }

            const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
            setReviewDietCat((nextFood.category && defaultDietCats.includes(nextFood.category)) ? nextFood.category as DietCategory : (existingInDietNext?.category || 'Légumes'));
            const nextSetCat = detectSettingsCategoryFromFoodName(nextFood.name, nextFood.category || (nextFood as any).settingsCategory);
            setReviewSetCat(nextSetCat);
          } else {
            // Finalize import!
            // 1. Apply replacements & per-recipe weight overrides to recipes
            const finalRecipes = pendingDietRecipes.map(recipe => {
              const updatedRecipe = { ...recipe };
              
              if (Array.isArray(updatedRecipe.items) && updatedRecipe.items.length > 0) {
                updatedRecipe.items = updatedRecipe.items.map(it => {
                  const rep = updatedReplacements[it.name];
                  const targetName = rep || it.name;
                  const keyRecipeOld = `${recipe.name}_${it.name}`;
                  const keyRecipeNew = `${recipe.name}_${targetName}`;
                  const weightOverride = updatedWeightOverrides[keyRecipeOld] || updatedWeightOverrides[keyRecipeNew] || updatedWeightOverrides[it.name] || updatedWeightOverrides[targetName];

                  return {
                    ...it,
                    name: targetName,
                    weight: weightOverride || it.weight
                  };
                });
                updatedRecipe.ingredients = updatedRecipe.items.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ');
              } else if (typeof updatedRecipe.ingredients === 'string') {
                let ingStr = updatedRecipe.ingredients;
                Object.entries(updatedReplacements).forEach(([oldName, newName]) => {
                  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(^|\\s|\\+|\\,|\\()${escaped}(\\s|\\+|\\,|\\)|$)`, 'gi');
                  ingStr = ingStr.replace(regex, `$1${newName}$2`);
                });

                Object.entries(updatedWeightOverrides).forEach(([key, newWeight]) => {
                  if (key.startsWith(`${recipe.name}_`)) {
                    const foodName = key.replace(`${recipe.name}_`, '');
                    const itemInRecipe = (recipe.items || []).find(i => i.name === foodName);
                    if (itemInRecipe && itemInRecipe.weight && ingStr.includes(itemInRecipe.weight)) {
                      ingStr = ingStr.replace(itemInRecipe.weight, newWeight);
                    }
                  }
                });

                updatedRecipe.ingredients = ingStr;
              }

              return updatedRecipe;
            });

            // 2. Add/register all reviewed diet items (both new & mapped from settings) into dietItems (Recettes > Catégories Régime)
            if (updatedDietItemsToAdd.length > 0) {
              setDietItems(prevDiet => {
                const currentDietNames = new Set(prevDiet.map(d => d.name.trim().toLowerCase()));
                const toAdd: DietItem[] = [];
                updatedDietItemsToAdd.forEach(ex => {
                  const nLow = ex.name.trim().toLowerCase();
                  if (!currentDietNames.has(nLow)) {
                    toAdd.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: ex.name.trim(),
                      category: ex.dietCat as DietCategory,
                      weight: ex.weight || ''
                    });
                    currentDietNames.add(nLow);
                  }
                });
                return toAdd.length > 0 ? [...prevDiet, ...toAdd] : prevDiet;
              });
            }

            // 3. Add missing foods to Settings > Aliments
            const allFoodsForSet = [
              ...updatedNewFoods.map(f => ({ name: f.name, cat: f.setCat })),
              ...updatedDietItemsToAdd.map(f => ({ name: f.name, cat: detectSettingsCategoryFromFoodName(f.name, f.dietCat) }))
            ];

            if (allFoodsForSet.length > 0) {
              setSettings(prevSet => {
                const currentPortions = prevSet.foodPortions || [];
                const currentCategories = prevSet.foodCategories || [];
                let changed = false;
                const newPortions = [...currentPortions];
                let newCategories = [...currentCategories];
                
                allFoodsForSet.forEach(ex => {
                  const nLow = ex.name.trim().toLowerCase();
                  if (nLow && !newPortions.some(p => p.name.trim().toLowerCase() === nLow)) {
                    newPortions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: ex.name.trim(),
                      amount: 1,
                      unit: 'g',
                      category: ex.cat && ex.cat !== 'Épicerie' && ex.cat !== 'Sans catégorie' ? ex.cat : undefined,
                      baseAmount: 1,
                      baseUnit: 'portion(s)',
                      purchaseAmount: 1,
                      purchaseUnit: 'pièce(s)'
                    });
                    changed = true;
                  }
                  if (ex.cat && ex.cat !== 'Épicerie' && ex.cat !== 'Sans catégorie' && !newCategories.includes(ex.cat)) {
                    newCategories.push(ex.cat);
                    changed = true;
                  }
                });
                return changed ? { ...prevSet, foodPortions: newPortions, foodCategories: newCategories } : prevSet;
              });
            }

            // 4. Save recipes
            setDietRecipes(prev => [...prev, ...finalRecipes]);
            setShowReviewNewFoodsModal(false);
            setPendingNewFoodsToReview([]);
            setPendingDietRecipes([]);
            setCurrentReviewIndex(0);
            setSelectedMatchMode('__NEW__');
            setReviewedReplacements({});
            setReviewedWeightOverrides({});
            setReviewedNewFoods([]);
            setReviewedDietItemsToAdd([]);

            const newCreatedCount = updatedNewFoods.length;
            const totalAddedDiet = updatedDietItemsToAdd.length;

            if (pendingDietRecipes.length > 0) {
              alert(`Importation réussie !\n- ${finalRecipes.length} recette(s) régime ajoutée(s).\n- ${totalAddedDiet} aliment(s) enregistré(s) dans Recettes > Catégories Régime.\n- ${newCreatedCount} nouvel(aux) aliment(s) créé(s) dans Réglages > Aliments.`);
            } else {
              alert(`Importation des aliments régime réussie !\n- ${totalAddedDiet} aliment(s) enregistré(s) dans Recettes > Catégories Régime.\n- ${newCreatedCount} nouvel(aux) aliment(s) créé(s) dans Réglages > Aliments.`);
            }
          }
        };

        const handleCancel = () => {
          setShowReviewNewFoodsModal(false);
          setPendingNewFoodsToReview([]);
          setPendingDietRecipes([]);
          setCurrentReviewIndex(0);
          setSelectedMatchMode('__NEW__');
          setReviewedReplacements({});
          setReviewedWeightOverrides({});
          setReviewedNewFoods([]);
          setReviewedDietItemsToAdd([]);
        };

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
              <div className="p-6 sm:p-8 text-center overflow-y-auto flex-1 custom-scrollbar">
                <div className="w-14 h-14 rounded-3xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                  🔎
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                  Aliment à valider
                </h3>
                <p className="text-sm font-bold text-gray-500 mb-5">
                  Aliment {currentReviewIndex + 1} sur {pendingNewFoodsToReview.length}
                </p>

                {/* Box aliment détecté & recette concernée */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left border border-gray-200/80 shadow-2xs space-y-2">
                  {currentFood.recipeName && (
                    <div className="flex items-center gap-2 bg-purple-100/80 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-black">
                      <span>📖</span>
                      <span>Recette concernée : « {currentFood.recipeName} »</span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                      Aliment à valider :
                    </p>
                    <p className="text-xl font-black text-purple-800 flex items-center gap-2 flex-wrap">
                      <span>🥗</span>
                      <span>« {currentFood.name} »</span>
                      {currentFood.weight && (
                        <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                          Quantité importée : {currentFood.weight}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Choix : Nouveau ou Aliments ressemblants existants */}
                <div className="space-y-4 text-left">
                  <p className="text-xs font-black text-gray-700 uppercase tracking-wider pl-1">
                    Que souhaitez-vous faire ?
                  </p>

                  <div className="space-y-2">
                    {/* Option 1: Nouveau */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatchMode('__NEW__');
                        const defaultDietCats = ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'];
                        setReviewDietCat((currentFood.category && defaultDietCats.includes(currentFood.category)) ? currentFood.category as DietCategory : 'Légumes');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isNewSelected
                          ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="font-black text-sm">
                            Nouveau : Créer « {currentFood.name} »
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            Ajouter cet aliment à vos listes avec les catégories choisies
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isNewSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                      }`}>
                        {isNewSelected && <span className="text-xs font-black">✓</span>}
                      </div>
                    </button>

                    {/* Suggestions d'aliments ressemblants */}
                    {similarSuggestions.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-black text-gray-600 uppercase tracking-wider pl-1 mb-2">
                          Aliments existants ressemblants :
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {similarSuggestions.map(sug => {
                            const isSugSelected = selectedMatchMode === sug;
                            return (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => {
                                  setSelectedMatchMode(sug);
                                  const bestCat = resolveDietFoodCategory(sug, currentFood.category, dietItems, settings.foodPortions);
                                  if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(bestCat)) {
                                    setReviewDietCat(bestCat as DietCategory);
                                  }
                                }}
                                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                                  isSugSelected
                                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-sm'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-base">🔄</span>
                                  <div>
                                    <p className="font-black text-sm">
                                      Utiliser : « <span className="text-purple-700 font-black">{sug}</span> »
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-500">
                                      Remplacera « {currentFood.name} » par « {sug} » dans la recette
                                    </p>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSugSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                                }`}>
                                  {isSugSelected && <span className="text-xs font-black">✓</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Autre aliment existant dropdown */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider pl-1 mb-1.5">
                        Ou choisir un autre aliment enregistré :
                      </label>
                      <select
                        value={!isNewSelected && !similarSuggestions.includes(selectedMatchMode) ? selectedMatchMode : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const val = e.target.value;
                            setSelectedMatchMode(val);
                            const bestCat = resolveDietFoodCategory(val, currentFood.category, dietItems, settings.foodPortions);
                            if (bestCat && ['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(bestCat)) {
                              setReviewDietCat(bestCat as DietCategory);
                            }
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        <option value="">-- Parcourir tous les aliments enregistrés --</option>
                        {allExistingFoodNamesList.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Choix des catégories : Nouveau vs Existant */}
                  {isNewSelected ? (
                    <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3 mt-3 animate-fadeIn">
                      <p className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span>Catégories pour le nouvel aliment « {currentFood.name} » :</span>
                      </p>

                      <div>
                        <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                          Catégorie Régime (Colonnes)
                        </label>
                        <select
                          value={reviewDietCat}
                          onChange={(e) => setReviewDietCat(e.target.value as DietCategory)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          <option value="Protéines">Protéines</option>
                          <option value="Légumes">Légumes</option>
                          <option value="Féculents">Féculents</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                          Catégorie Réglages (Liste de courses)
                        </label>
                        <select
                          value={reviewSetCat}
                          onChange={(e) => setReviewSetCat(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                        >
                          {(settings.foodCategories || []).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3 animate-fadeIn">
                      <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200 flex items-center gap-2.5 text-green-900 text-xs font-bold">
                        <span className="text-base">✅</span>
                        <span>
                          La recette sera importée en remplaçant <strong>« {currentFood.name} »</strong> par <strong>« {selectedMatchMode} »</strong>.
                        </span>
                      </div>

                      <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                        <p className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                          <span>🏷️</span>
                          <span>Catégorie Régime pour l'aliment « {selectedMatchMode} » :</span>
                        </p>

                        <div>
                          <label className="block text-[11px] font-black text-gray-700 mb-1 uppercase tracking-wider pl-1">
                            Catégorie Régime (Colonnes)
                          </label>
                          <select
                            value={reviewDietCat}
                            onChange={(e) => setReviewDietCat(e.target.value as DietCategory)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                          >
                            <option value="Protéines">Protéines</option>
                            <option value="Légumes">Légumes</option>
                            <option value="Féculents">Féculents</option>
                            <option value="Desserts">Desserts</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Champ Poids / Quantité et Unité pour l'import */}
                  {(() => {
                    const importedParsed = parseWeightAndUnit(currentFood.weight || '');
                    const existingDietItem = !isNewSelected ? dietItems.find(d => d.name.toLowerCase() === selectedMatchMode.toLowerCase()) : dietItems.find(d => d.name.toLowerCase() === currentFood.name.toLowerCase());
                    const existingWeightStr = existingDietItem ? existingDietItem.weight : '';
                    const existingParsed = parseWeightAndUnit(existingWeightStr);
                    const isUnitMismatch = existingWeightStr && importedParsed.unit && existingParsed.unit && existingParsed.unit.toLowerCase() !== importedParsed.unit.toLowerCase();

                    return (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 mt-3">
                        <p className="text-xs font-black text-gray-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>⚖️</span>
                            <span>Quantité & Unité pour cette recette :</span>
                          </span>
                        </p>

                        {isUnitMismatch && (
                          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold space-y-1.5 animate-fadeIn">
                            <div className="flex items-center gap-1.5 text-amber-800 font-black">
                              <span>⚠️</span>
                              <span>Différence d'unité détectée !</span>
                            </div>
                            <p className="text-[11px] font-medium text-amber-800 leading-snug">
                              {currentFood.recipeName ? (
                                <>Dans la recette <strong>« {currentFood.recipeName} »</strong>, cet aliment est indiqué avec <strong>« {currentFood.weight} »</strong>.</>
                              ) : (
                                <>La valeur importée est <strong>« {currentFood.weight} »</strong>.</>
                              )}
                              <br />
                              L'unité de référence dans vos Catégories Régime est en <strong>« {existingParsed.unit} »</strong> ({existingDietItem?.name} : {existingWeightStr}).
                            </p>
                            <p className="text-[11px] font-black text-amber-900">
                              Ajustez la valeur en <strong>{reviewWeightUnit || existingParsed.unit}</strong> à appliquer spécifiquement pour la recette {currentFood.recipeName ? `« ${currentFood.recipeName} »` : 'importée'} :
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-2">
                          <input 
                            type="text"
                            value={reviewWeightValue}
                            onChange={(e) => setReviewWeightValue(e.target.value)}
                            placeholder="Ex: 100, 1, 2..."
                            className="col-span-7 bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          <select
                            value={reviewWeightUnit}
                            onChange={(e) => setReviewWeightUnit(e.target.value)}
                            className="col-span-5 bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                          >
                            {getAvailableUnits(settings).map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm cursor-pointer"
                  >
                    Annuler l'import
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCurrent}
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{currentReviewIndex + 1 < pendingNewFoodsToReview.length ? "Valider et Suivant" : "Terminer l'import"}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL CONFIRMATION SAUVEGARDE RAPIDE */}
      {showQuickBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl">✅</div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Sauvegarde terminée !</h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Le fichier JSON de sauvegarde complète (culinashare_backup_...) a été téléchargé avec succès.
              </p>
              <button 
                onClick={() => setShowQuickBackupModal(false)}
                className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform active:scale-95"
              >
                Génial !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Components ---

const Navbar: React.FC<{ activeTab: AppTab; setActiveTab: (t: AppTab) => void; onQuickBackup: () => void }> = ({ activeTab, setActiveTab, onQuickBackup }) => {
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

      <div className={`hidden md:block mb-8 text-2xl font-black text-purple-600 px-4 max-w-full text-center ${isCollapsed ? 'truncate' : ''}`}>
        {isCollapsed ? "🍳" : (
          <div className="leading-none space-y-1">
            <div>Gestion</div>
            <div className="text-xl text-purple-500 font-bold">cuisine</div>
          </div>
        )}
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

// --- InStockView (En réserve) ---

const InStockView: React.FC<{
  items: ShoppingListItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  foodPortions: FoodPortion[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  settings?: UserSettings;
}> = ({ items, setItems, foodPortions, onAddFoodToSettings, settings }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const addItem = () => {
    if (!newItemName.trim()) return;
    onAddFoodToSettings(newItemName.trim(), newItemUnit, 'Sans catégorie');
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
              {getAvailableUnits(settings).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
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
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  onRemoveFoodFromSettings?: (name: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  updateDietMealPlan?: (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe', itemId: string | undefined) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  dietItems: DietItem[];
  setDietItems: React.Dispatch<React.SetStateAction<DietItem[]>>;
  dietServings: number;
  setDietServings: React.Dispatch<React.SetStateAction<number>>;
  dietRecipes?: DietRecipe[];
  setDietRecipes?: React.Dispatch<React.SetStateAction<DietRecipe[]>>;
  defaultTab?: 'all' | 'recipes' | 'regime';
  settings: UserSettings;
  setSettings?: React.Dispatch<React.SetStateAction<UserSettings>>;
}> = ({ recipes, mealPlan, addRecipe, deleteRecipe, onAddToShopping, foodPortions, foodCategories, onAddFoodToSettings, onRemoveFoodFromSettings, updateMealPlan, updateDietMealPlan, setSentMeals, dietItems, setDietItems, dietServings, setDietServings, dietRecipes = [], setDietRecipes, defaultTab = 'recipes', settings, setSettings }) => {
  const DIET_RECIPE_UNITS = getAvailableUnits(settings);
  const [viewMode, setViewMode] = useState<'all' | 'recipes' | 'regime' | 'categories_regime'>(() => (defaultTab as any) || 'recipes');

  useEffect(() => {
    setViewMode(defaultTab);
  }, [defaultTab]);
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Diet planning modal state
  const [planningDietRecipe, setPlanningDietRecipe] = useState<DietRecipe | null>(null);
  const [dietPlanDate, setDietPlanDate] = useState<string>(() => formatDateKey(new Date()));
  const [dietPlanMealType, setDietPlanMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [dietPlanServings, setDietPlanServings] = useState<number>(2.5);
  const [showDietAvailability, setShowDietAvailability] = useState(false);
  const [dietAvailabilityWeekDate, setDietAvailabilityWeekDate] = useState(() => {
    const d = new Date();
    const startDay = settings.startDay ?? 1;
    const day = d.getDay();
    const diff = (day - startDay + 7) % 7;
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  const handleProgrammerAuPlanningRegime = () => {
    if (!planningDietRecipe) return;
    if (!dietPlanDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    const conflict = getSlotOccupantInfo(mealPlan[dietPlanDate], dietPlanMealType, recipes, dietRecipes, dietItems, planningDietRecipe.id, true);
    if (conflict) {
      const mealLabel = dietPlanMealType === 'lunch' ? 'Midi (Déjeuner)' : 'Soir (Dîner)';
      const confirmed = window.confirm(`Le créneau du ${dietPlanDate} (${mealLabel}) contient déjà « ${conflict.title} » (${conflict.type}).\n\nVoulez-vous le remplacer par « ${planningDietRecipe.name} » ?`);
      if (!confirmed) return;
    }
    if (updateDietMealPlan) {
      updateDietMealPlan(dietPlanDate, dietPlanMealType, 'dietRecipe', planningDietRecipe.id);
    }
    if (setDietServings && dietPlanServings) {
      setDietServings(dietPlanServings);
    }
    const mealLabel = dietPlanMealType === 'lunch' ? 'Déjeuner' : 'Dîner';
    alert(`Recette régime « ${planningDietRecipe.name} » programmée au planning pour le ${dietPlanDate} (${mealLabel}) pour ${dietPlanServings.toString().replace('.', ',')} pers. !`);
    setPlanningDietRecipe(null);
  };

  // Diet modal state
  const [showDietModal, setShowDietModal] = useState(false);
  const [showRoundingSettingsModal, setShowRoundingSettingsModal] = useState(false);
  const [dietToDelete, setDietToDelete] = useState<DietItem | null>(null);
  const [editingDietItem, setEditingDietItem] = useState<DietItem | null>(null);
  const [dietFormName, setDietFormName] = useState('');
  const [dietFormCategory, setDietFormCategory] = useState<DietCategory>('Protéines');
  const [dietFormSettingsCategory, setDietFormSettingsCategory] = useState<string>('Protéines');
  const [dietFormWeightValue, setDietFormWeightValue] = useState('100');
  const [dietFormWeightUnit, setDietFormWeightUnit] = useState('g');
  const [dietFormRoundWeight, setDietFormRoundWeight] = useState<boolean>(true);
  const [dietSearch, setDietSearch] = useState('');
  const [dietModalServings, setDietModalServings] = useState<number>(2.5);

  // Diet recipe modal state
  const [showDietRecipeModal, setShowDietRecipeModal] = useState(false);
  const [dietRecipeToDelete, setDietRecipeToDelete] = useState<DietRecipe | null>(null);
  const [editingDietRecipe, setEditingDietRecipe] = useState<DietRecipe | null>(null);
  const [dietRecipeFormName, setDietRecipeFormName] = useState('');
  const [dietRecipeFormIngredients, setDietRecipeFormIngredients] = useState('');
  const [dietRecipeFormServings, setDietRecipeFormServings] = useState<number>(2.5);

  // Bulk delete diet recipes state
  const [showDeleteDietRecipesModal, setShowDeleteDietRecipesModal] = useState(false);
  const [selectedDietRecipesToDelete, setSelectedDietRecipesToDelete] = useState<Set<string>>(new Set());
  const [showConfirmBulkDeleteDietRecipes, setShowConfirmBulkDeleteDietRecipes] = useState(false);

  // Diet recipe ingredients list state
  const [dietRecipeItems, setDietRecipeItems] = useState<DietRecipeItem[]>([]);
  const [selectedFoodCategoryFilter, setSelectedFoodCategoryFilter] = useState<string>('Toutes');
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodWeight, setSelectedFoodWeight] = useState<string>('');
  const [selectedFoodUnit, setSelectedFoodUnit] = useState<string>('g');
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [editingIngredientName, setEditingIngredientName] = useState<string>('');
  const [editingIngredientWeight, setEditingIngredientWeight] = useState<string>('');
  const [editingIngredientUnit, setEditingIngredientUnit] = useState<string>('g');

  // New Food modal state
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [pendingNewFoodName, setPendingNewFoodName] = useState('');
  const [pendingNewFoodWeight, setPendingNewFoodWeight] = useState('');
  const [newFoodRecipeDietCat, setNewFoodRecipeDietCat] = useState<string>('Légumes');
  const [newFoodSettingsCat, setNewFoodSettingsCat] = useState<string>('Légumes');
  const [selectedMatchModeDiet, setSelectedMatchModeDiet] = useState<string>('__NEW__');

  const allExistingFoodNamesList = useMemo(() => {
    const set = new Set<string>();
    dietItems.forEach(i => set.add(i.name.trim()));
    (foodPortions || []).forEach(fp => set.add(fp.name.trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [dietItems, foodPortions]);

  const pendingDietSimilarSuggestions = useMemo(() => {
    if (!pendingNewFoodName) return [];
    return findSimilarDietFoods(pendingNewFoodName, allExistingFoodNamesList);
  }, [pendingNewFoodName, allExistingFoodNamesList]);

  const dietModalNameSuggestions = useMemo(() => {
    if (!dietFormName || editingDietItem) return [];
    return findSimilarDietFoods(dietFormName, allExistingFoodNamesList);
  }, [dietFormName, editingDietItem, allExistingFoodNamesList]);

  // Manage category batch modal state
  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [manageCategory, setManageCategory] = useState<DietCategory>('Protéines');
  const [selectedCategoryItemIds, setSelectedCategoryItemIds] = useState<string[]>([]);

  const handleOpenManageCategory = (category: DietCategory) => {
    setManageCategory(category);
    setSelectedCategoryItemIds([]);
    setShowManageCategoryModal(true);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedCategoryItemIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllCategoryItems = (categoryItems: DietItem[]) => {
    const categoryIds = categoryItems.map(i => i.id);
    const allSelected = categoryIds.length > 0 && categoryIds.every(id => selectedCategoryItemIds.includes(id));
    if (allSelected) {
      setSelectedCategoryItemIds(prev => prev.filter(id => !categoryIds.includes(id)));
    } else {
      setSelectedCategoryItemIds(prev => Array.from(new Set([...prev, ...categoryIds])));
    }
  };

  const handleDeleteSelectedCategoryItems = () => {
    if (selectedCategoryItemIds.length === 0) return;
    setDietItems(prev => prev.filter(item => !selectedCategoryItemIds.includes(item.id)));
    setSelectedCategoryItemIds([]);
  };

  const availableSettingsCategories = useMemo(() => {
    const cats = foodCategories && foodCategories.length > 0 
      ? foodCategories 
      : ['Légumes', 'Fruits', 'Viandes', 'Poissons', 'Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Boulangerie', 'Hygiène', 'Autre'];
    return Array.from(new Set(cats));
  }, [foodCategories]);

  // Combined existing foods list for selector
  const allExistingFoodsList = useMemo(() => {
    const map = new Map<string, { name: string; category: string; source: 'régime' | 'recettes' }>();

    dietItems.forEach(item => {
      map.set(item.name.toLowerCase().trim(), {
        name: item.name,
        category: `Régime: ${item.category}`,
        source: 'régime'
      });
    });

    (foodPortions || []).forEach(fp => {
      const key = fp.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: fp.name,
          category: `Recettes: ${fp.category || 'Sans catégorie'}`,
          source: 'recettes'
        });
      }
    });

    return Array.from(map.values());
  }, [dietItems, foodPortions]);

  const filteredFoodsForSelection = useMemo(() => {
    if (!selectedFoodCategoryFilter || selectedFoodCategoryFilter === 'Toutes') {
      return allExistingFoodsList;
    }
    return allExistingFoodsList.filter(f => f.category === selectedFoodCategoryFilter);
  }, [allExistingFoodsList, selectedFoodCategoryFilter]);

  const resolveDietFoodCategory = useCallback((foodName: string, directCat?: string): DietCategory | 'Autre' => {
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
  }, [dietItems, foodPortions]);

  const handleOpenAddDietRecipe = () => {
    setEditingDietRecipe(null);
    setDietRecipeFormName('');
    setDietRecipeFormIngredients('');
    setDietRecipeFormServings(dietServings || 2.5);
    setDietRecipeItems([]);
    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedFoodCategoryFilter('Toutes');
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
    setShowDietRecipeModal(true);
  };

  const handleOpenEditDietRecipe = (dr: DietRecipe) => {
    setEditingDietRecipe(dr);
    setDietRecipeFormName(dr.name);
    setDietRecipeFormIngredients(typeof dr.ingredients === 'string' ? dr.ingredients : String(dr.ingredients || ''));
    setDietRecipeFormServings(dr.servings || 2.5);
    
    if (dr.items && dr.items.length > 0) {
      setDietRecipeItems(dr.items);
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const parts = dr.ingredients.split('+').map(p => {
        const trimmed = p.trim();
        const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
        if (match) {
          return { name: match[1].trim(), weight: match[2].trim() };
        }
        return { name: trimmed, weight: '' };
      }).filter(i => i.name);
      setDietRecipeItems(parts);
    } else {
      setDietRecipeItems([]);
    }

    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedFoodCategoryFilter('Toutes');
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
    setShowDietRecipeModal(true);
  };

  const handleAddIngredientToRecipe = () => {
    const trimmedName = selectedFoodName.trim();
    if (!trimmedName) {
      alert("Veuillez saisir ou choisir un nom d'aliment.");
      return;
    }

    const rawWeight = selectedFoodWeight.trim();
    let trimmedWeight = '';
    if (rawWeight) {
      if (rawWeight.toLowerCase().endsWith(selectedFoodUnit.toLowerCase()) || /[a-z]/i.test(rawWeight)) {
        trimmedWeight = rawWeight;
      } else {
        trimmedWeight = `${rawWeight} ${selectedFoodUnit}`;
      }
    }

    // Check if food exists in dietItems or foodPortions
    const existsInDiet = dietItems.some(i => i.name.toLowerCase() === trimmedName.toLowerCase());
    const existsInSettings = (foodPortions || []).some(fp => fp.name.toLowerCase() === trimmedName.toLowerCase());

    if (existsInDiet || existsInSettings) {
      // Existing food -> add directly
      const matched = allExistingFoodsList.find(f => f.name.toLowerCase() === trimmedName.toLowerCase());
      const rawCat = matched ? matched.category.replace(/^(Régime:\s*|Recettes:\s*)/i, '').trim() : undefined;
      setDietRecipeItems(prev => [...prev, { name: matched ? matched.name : trimmedName, weight: trimmedWeight, category: rawCat }]);
      setSelectedFoodName('');
      setSelectedFoodWeight('');
      setSelectedFoodUnit('g');
    } else {
      // New food -> open "Nouveau aliment" modal
      setPendingNewFoodName(trimmedName);
      setPendingNewFoodWeight(trimmedWeight);
      setNewFoodRecipeDietCat('Légumes');
      setNewFoodSettingsCat(availableSettingsCategories[0] || 'Légumes');
      setSelectedMatchModeDiet('__NEW__');
      setShowNewFoodModal(true);
    }
  };

  const handleConfirmNewFood = () => {
    const weightVal = pendingNewFoodWeight.trim();

    if (selectedMatchModeDiet !== '__NEW__' && selectedMatchModeDiet) {
      const matchedDiet = dietItems.find(di => di.name.toLowerCase() === selectedMatchModeDiet.toLowerCase());
      const matchedPortion = (foodPortions || []).find(fp => fp.name.toLowerCase() === selectedMatchModeDiet.toLowerCase());
      const rawCat = matchedDiet ? matchedDiet.category : matchedPortion ? matchedPortion.category : undefined;

      setDietRecipeItems(prev => [...prev, { name: selectedMatchModeDiet, weight: weightVal, category: rawCat }]);
      setSelectedFoodName('');
      setSelectedFoodWeight('');
      setSelectedFoodUnit('g');
      setSelectedMatchModeDiet('__NEW__');
      setShowNewFoodModal(false);
      return;
    }

    if (!pendingNewFoodName.trim()) return;

    const trimmedName = pendingNewFoodName.trim();

    // Add to dietItems if a diet category was chosen
    if (['Protéines', 'Légumes', 'Féculents', 'Laitage', 'Desserts'].includes(newFoodRecipeDietCat)) {
      const newDietItem: DietItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        category: newFoodRecipeDietCat as DietCategory,
        weight: weightVal || '100 g'
      };
      setDietItems(prev => [...prev, newDietItem]);
    }

    // Add to settings/foodPortions via onAddFoodToSettings
    if (onAddFoodToSettings) {
      onAddFoodToSettings(trimmedName, 'g', newFoodSettingsCat);
    }

    // Add to recipe items list
    setDietRecipeItems(prev => [...prev, { name: trimmedName, weight: weightVal, category: newFoodSettingsCat }]);

    // Reset and close
    setSelectedFoodName('');
    setSelectedFoodWeight('');
    setSelectedFoodUnit('g');
    setSelectedMatchModeDiet('__NEW__');
    setShowNewFoodModal(false);
  };

  const handleStartEditIngredient = (index: number) => {
    const item = dietRecipeItems[index];
    if (!item) return;
    setEditingIngredientIndex(index);
    setEditingIngredientName(item.name || '');
    const rawWeight = item.weight || '';
    const match = rawWeight.match(/^([0-9.,]+)\s*(.*)$/);
    if (match && match[2] && DIET_RECIPE_UNITS.includes(match[2].trim())) {
      setEditingIngredientWeight(match[1]);
      setEditingIngredientUnit(match[2].trim());
    } else if (match && match[2]) {
      setEditingIngredientWeight(match[1]);
      setEditingIngredientUnit(match[2].trim());
    } else {
      setEditingIngredientWeight(rawWeight);
      setEditingIngredientUnit('g');
    }
  };

  const handleSaveEditedIngredient = (index: number) => {
    if (!editingIngredientName.trim()) {
      alert("Veuillez saisir un nom d'aliment.");
      return;
    }
    const rawWeight = editingIngredientWeight.trim();
    let combinedWeight = '';
    if (rawWeight) {
      if (rawWeight.toLowerCase().endsWith(editingIngredientUnit.toLowerCase()) || /[a-z]/i.test(rawWeight)) {
        combinedWeight = rawWeight;
      } else {
        combinedWeight = `${rawWeight} ${editingIngredientUnit}`;
      }
    }
    setDietRecipeItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name: editingIngredientName.trim(), weight: combinedWeight } : item
    ));
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
  };

  const handleCancelEditIngredient = () => {
    setEditingIngredientIndex(null);
    setEditingIngredientName('');
    setEditingIngredientWeight('');
    setEditingIngredientUnit('g');
  };

  const handleRemoveIngredientFromRecipe = (index: number) => {
    if (editingIngredientIndex === index) {
      handleCancelEditIngredient();
    }
    setDietRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDietRecipe = () => {
    if (!dietRecipeFormName.trim()) {
      alert("Veuillez saisir le nom de la recette.");
      return;
    }

    const formattedIngredients = dietRecipeItems.length > 0
      ? dietRecipeItems.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ')
      : (typeof dietRecipeFormIngredients === 'string' ? dietRecipeFormIngredients.trim() : String(dietRecipeFormIngredients || '').trim());

    if (setDietRecipes) {
      if (editingDietRecipe) {
        setDietRecipes(prev => prev.map(r => r.id === editingDietRecipe.id ? {
          ...r,
          name: dietRecipeFormName.trim(),
          ingredients: formattedIngredients,
          servings: dietRecipeFormServings,
          items: dietRecipeItems
        } : r));
      } else {
        const newRecipe: DietRecipe = {
          id: Math.random().toString(36).substr(2, 9),
          name: dietRecipeFormName.trim(),
          ingredients: formattedIngredients,
          servings: dietRecipeFormServings,
          items: dietRecipeItems
        };
        setDietRecipes(prev => [...prev, newRecipe]);
      }
    }
    setShowDietRecipeModal(false);
  };

  const handleDeleteDietRecipe = (dr: DietRecipe) => {
    setDietRecipeToDelete(dr);
  };

  const filtered = (recipes || []).filter(r => 
    (selectedCat === 'Tous' || r.category === selectedCat) && 
    (r.title || "").toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const sortedDietRecipes = useMemo(() => {
    return [...(dietRecipes || [])].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    );
  }, [dietRecipes]);

  const filteredDietRecipes = useMemo(() => {
    return sortedDietRecipes.filter(dr => {
      const term = filter.trim().toLowerCase();
      if (!term) return true;
      const nameMatch = (dr.name || '').toLowerCase().includes(term);
      const ingMatch = typeof dr.ingredients === 'string'
        ? dr.ingredients.toLowerCase().includes(term)
        : (dr.items || []).some(i => (i.name || '').toLowerCase().includes(term));
      return nameMatch || ingMatch;
    });
  }, [sortedDietRecipes, filter]);

  type CombinedRecipeItem = 
    | { type: 'classic'; recipe: Recipe; title: string }
    | { type: 'diet'; dietRecipe: DietRecipe; title: string };

  const allSortedRecipes = useMemo(() => {
    const classics: CombinedRecipeItem[] = filtered.map(r => ({
      type: 'classic',
      recipe: r,
      title: r.title || ''
    }));
    const diets: CombinedRecipeItem[] = filteredDietRecipes.map(dr => ({
      type: 'diet',
      dietRecipe: dr,
      title: dr.name || ''
    }));
    return [...classics, ...diets].sort((a, b) => 
      a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' })
    );
  }, [filtered, filteredDietRecipes]);

  const handleEdit = (e: React.MouseEvent, r: Recipe) => {
    e.stopPropagation();
    setEditingRecipe(r);
    setIsAdding(true);
  };

  const handleOpenAddDiet = (defaultCat: DietCategory = 'Protéines') => {
    setEditingDietItem(null);
    setDietFormName('');
    setDietFormCategory(defaultCat);
    const initialSettingsCat = availableSettingsCategories.includes(defaultCat)
      ? defaultCat
      : (availableSettingsCategories[0] || 'Protéines');
    setDietFormSettingsCategory(initialSettingsCat);
    setDietFormWeightValue('100');
    setDietFormWeightUnit('g');
    setDietFormRoundWeight(true);
    setDietModalServings(2.5);
    setShowDietModal(true);
  };

  const handleOpenEditDiet = (item: DietItem) => {
    setEditingDietItem(item);
    setDietFormName(item.name);
    setDietFormCategory(item.category);

    const existingPortion = foodPortions?.find(p => p.name.toLowerCase() === item.name.toLowerCase().trim());
    if (existingPortion && existingPortion.category) {
      setDietFormSettingsCategory(existingPortion.category);
    } else {
      const initialSettingsCat = availableSettingsCategories.includes(item.category)
        ? item.category
        : (availableSettingsCategories[0] || 'Protéines');
      setDietFormSettingsCategory(initialSettingsCat);
    }

    const parsed = parseWeightAndUnit(item.weight);
    setDietFormWeightValue(parsed.value);
    setDietFormWeightUnit(parsed.unit);
    setDietFormRoundWeight(item.roundWeight !== false);
    setDietModalServings(2.5);
    setShowDietModal(true);
  };

  const handleDeleteDiet = (item: DietItem) => {
    setDietToDelete(item);
  };

  const handleSaveDietItem = () => {
    if (!dietFormName.trim()) {
      alert("Veuillez saisir le nom de l'aliment.");
      return;
    }
    const valStr = dietFormWeightValue.trim() || '100';
    const unitStr = dietFormWeightUnit.trim() || 'g';
    const fullWeight = `${valStr} ${unitStr}`;

    const normalizedWeight = formatScaledWeight(fullWeight, 2.5, dietModalServings, settings, dietFormRoundWeight);

    if (editingDietItem) {
      setDietItems(prev => prev.map(item => item.id === editingDietItem.id ? {
        ...item,
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight,
        roundWeight: dietFormRoundWeight
      } : item));
    } else {
      const newItem: DietItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: dietFormName.trim(),
        category: dietFormCategory,
        weight: normalizedWeight,
        roundWeight: dietFormRoundWeight
      };
      setDietItems(prev => [...prev, newItem]);
    }

    // Enregistrer dans Réglages, Aliments par rapport à Catégories (Réglages)
    if (onAddFoodToSettings) {
      onAddFoodToSettings(dietFormName.trim(), unitStr, dietFormSettingsCategory);
    }

    setShowDietModal(false);
    setEditingDietItem(null);
    setDietFormName('');
    setDietFormWeightValue('100');
    setDietFormWeightUnit('g');
    setDietModalServings(2.5);
  };

  const filteredDietItems = useMemo(() => {
    if (!dietSearch.trim()) return dietItems;
    return dietItems.filter(item => item.name.toLowerCase().includes(dietSearch.toLowerCase().trim()));
  }, [dietItems, dietSearch]);

  const proteins = useMemo(() => filteredDietItems.filter(i => i.category === 'Protéines').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const vegetables = useMemo(() => filteredDietItems.filter(i => i.category === 'Légumes').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const starches = useMemo(() => filteredDietItems.filter(i => i.category === 'Féculents').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const dairies = useMemo(() => filteredDietItems.filter(i => i.category === 'Laitage').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);
  const desserts = useMemo(() => filteredDietItems.filter(i => i.category === 'Desserts').sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })), [filteredDietItems]);

  if (isAdding) return (
    <RecipeForm 
      onSave={(r) => { addRecipe(r); setIsAdding(false); setEditingRecipe(null); }} 
      onDelete={(id) => { deleteRecipe(id); setIsAdding(false); setEditingRecipe(null); }}
      onCancel={() => { setIsAdding(false); setEditingRecipe(null); }} 
      foodPortions={foodPortions} 
      onAddFoodToSettings={onAddFoodToSettings}
      initialData={editingRecipe || undefined}
      foodCategories={foodCategories}
      settings={settings}
    />
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SÉLECTEUR 4 POSITIONS TOUT EN HAUT : TOUTES / RECETTES / RÉGIME / CATÉGORIES RÉGIME */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-xl sm:max-w-2xl lg:max-w-3xl overflow-x-auto">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'all'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📚</span>
            <span>Toutes les recettes</span>
          </button>
          <button
            onClick={() => setViewMode('recipes')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'recipes'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <EXT_ICONS.Book />
            <span>Recettes</span>
          </button>
          <button
            onClick={() => setViewMode('regime')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'regime'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🥗</span>
            <span>Régime</span>
          </button>
          <button
            onClick={() => setViewMode('categories_regime')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              viewMode === 'categories_regime'
                ? 'bg-white text-purple-600 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📂</span>
            <span>Catégories Régime</span>
          </button>
        </div>
      </div>

      {/* VUE 0 : TOUTES LES RECETTES (CLASSIQUES + RÉGIME) */}
      {viewMode === 'all' && (
        <div className="space-y-6 animate-fadeIn">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Toutes les recettes</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100 shadow-sm">
                  {filtered.length + filteredDietRecipes.length} recettes ({filtered.length} classique{filtered.length > 1 ? 's' : ''}, {filteredDietRecipes.length} régime{filteredDietRecipes.length > 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Regroupement de l'ensemble des recettes classiques et régime
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => { setEditingRecipe(null); setIsAdding(true); }} className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-100 text-sm">
                + Recette Classique
              </button>
              <button onClick={handleOpenAddDietRecipe} className="bg-purple-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-2xl font-bold hover:bg-purple-100 transition-all shadow-sm text-sm">
                + Recette Régime
              </button>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Rechercher dans toutes les recettes..." className="flex-1 p-4 rounded-2xl border border-purple-100 bg-white shadow-sm outline-none focus:ring-2 focus:ring-purple-300 font-medium" value={filter} onChange={e => setFilter(e.target.value)} />
            <select className="p-4 rounded-2xl border border-purple-100 bg-white font-bold outline-none cursor-pointer" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
              <option>Tous</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSortedRecipes.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-300 italic font-medium">Aucune recette trouvée.</div>
            ) : (
              allSortedRecipes.map(item => {
                if (item.type === 'classic') {
                  const r = item.recipe;
                  return (
                    <div key={`classic-${r.id}`} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative flex flex-col justify-between">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                Classique • {r.category}
                              </span>
                              {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">⏲️ {formatTotalTime(r.prepTime + r.cookTime)}</span>
                          </div>
                          <button onClick={(e) => handleEdit(e, r)} className="bg-purple-50 p-2 rounded-xl text-purple-600 hover:bg-purple-100 transition-all shadow-sm" title="Modifier">
                            <EXT_ICONS.Edit />
                          </button>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 break-words group-hover:text-purple-700 transition-colors">{r.title}</h3>
                      </div>
                      <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-50 text-xs font-black text-purple-600">
                        <span>📅 Voir / Programmer</span>
                        <span className="text-gray-300 group-hover:text-purple-600 transition-colors">→</span>
                      </div>
                    </div>
                  );
                } else {
                  const dr = item.dietRecipe;
                  const baseServings = dr.servings || 2.5;
                  const currentServings = dietServings || 2.5;

                  let itemsToDisplay: { name: string; weight: string; category?: string }[] = [];
                  if (dr.items && dr.items.length > 0) {
                    itemsToDisplay = dr.items.map(item => ({
                      name: item.name,
                      weight: item.weight || '',
                      category: item.category
                    }));
                  } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                    const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
                    itemsToDisplay = rawParts.map(part => {
                      const trimmed = part.trim();
                      const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
                      if (match) return { name: match[1].trim(), weight: match[2].trim() };
                      return { name: trimmed, weight: '' };
                    });
                  }

                  return (
                    <div 
                      key={`diet-${dr.id}`} 
                      onClick={() => {
                        setPlanningDietRecipe(dr);
                        setDietPlanDate(formatDateKey(new Date()));
                        setDietPlanMealType('lunch');
                        setDietPlanServings(dr.servings || 2.5);
                        setShowDietAvailability(false);
                      }}
                      className="bg-purple-50/40 border border-purple-100 rounded-[32px] p-6 flex flex-col justify-between space-y-4 hover:shadow-xl hover:border-purple-300 transition-all group cursor-pointer"
                      title="Cliquer pour planifier au régime"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-lg uppercase tracking-wider w-fit">
                              🥗 Régime
                            </span>
                            <h4 className="font-black text-gray-800 text-lg leading-snug group-hover:text-purple-700 transition-colors">{dr.name}</h4>
                          </div>
                          <span className="shrink-0 bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200">
                            👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-gray-700 bg-white p-3 rounded-xl border border-purple-50 mt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {itemsToDisplay.map((item, idx) => {
                              let text = item.weight ? `${item.name} ${scaleTextQuantity(item.weight, currentServings, baseServings)}`.trim() : scaleTextQuantity(item.name || '', currentServings, baseServings);
                              const cat = resolveDietFoodCategory(item.name, item.category);
                              let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                              if (cat === 'Protéines') colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                              else if (cat === 'Légumes') colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                              else if (cat === 'Féculents') colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                              else if (cat === 'Desserts') colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';

                              return (
                                <span key={idx} className={`px-2 py-0.5 border rounded-lg text-[10px] font-black ${colorClass}`}>
                                  {text}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-purple-100/60">
                        <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                          <span>📅</span>
                          <span>Planifier au régime</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                            title="Modifier"
                          >
                            <EXT_ICONS.Edit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Supprimer"
                          >
                            <EXT_ICONS.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>
      )}

      {/* VUE 1 : RECETTES */}
      {viewMode === 'recipes' && (
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
        </div>
      )}

      {/* VUE 2 : RÉGIME (RECETTES RÉGIME) */}
      {viewMode === 'regime' && (
        <div className="space-y-6 animate-fadeIn">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Recettes Régime</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100">
                  {dietRecipes.length} recettes
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Portions calculées pour {dietServings} personne{dietServings > 1 ? 's' : ''} (base 2.5 pers.)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-100 shadow-sm">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                  <span>👥</span> Personnes :
                </span>
                <select
                  value={dietServings}
                  onChange={(e) => setDietServings(parseFloat(e.target.value))}
                  className="bg-white border border-purple-200 rounded-xl px-3 py-1 font-black text-sm text-purple-900 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer shadow-sm"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddDietRecipe}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="text-lg leading-none">+</span>
                <span>Ajouter une recette régime</span>
              </button>
              <button
                onClick={() => {
                  setSelectedDietRecipesToDelete(new Set());
                  setShowDeleteDietRecipesModal(true);
                }}
                className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-2xl font-black shadow-sm hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <EXT_ICONS.Trash />
                <span>Supprimer des recettes</span>
              </button>
            </div>
          </header>

          <div className="bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {sortedDietRecipes.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-400 italic font-medium">
                  Aucune recette régime enregistrée.
                </div>
              ) : (
                sortedDietRecipes.map((dr) => {
                  const baseServings = dr.servings || 2.5;
                  const currentServings = dietServings || 2.5;

                  let displayIngredients: React.ReactNode = null;
                  type ItemToDisplay = { name: string; weight: string; category?: string };
                  let itemsToDisplay: ItemToDisplay[] = [];

                  if (dr.items && dr.items.length > 0) {
                    itemsToDisplay = dr.items.map(item => ({
                      name: item.name,
                      weight: item.weight || '',
                      category: item.category
                    }));
                  } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                    const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
                    itemsToDisplay = rawParts.map(part => {
                      const trimmed = part.trim();
                      const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
                      if (match) {
                        return { name: match[1].trim(), weight: match[2].trim() };
                      }
                      return { name: trimmed, weight: '' };
                    });
                  }

                  if (itemsToDisplay.length > 0) {
                    const categoryOrderMap: Record<string, number> = {
                      'Protéines': 0,
                      'Légumes': 1,
                      'Féculents': 2,
                      'Laitage': 3,
                      'Desserts': 4
                    };
                    itemsToDisplay.sort((a, b) => {
                      const catA = resolveDietFoodCategory(a.name, a.category);
                      const catB = resolveDietFoodCategory(b.name, b.category);
                      const orderA = categoryOrderMap[catA] !== undefined ? categoryOrderMap[catA] : 99;
                      const orderB = categoryOrderMap[catB] !== undefined ? categoryOrderMap[catB] : 99;
                      return orderA - orderB;
                    });

                    displayIngredients = (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {itemsToDisplay.map((item, idx) => {
                          let text = '';
                          if (item.weight && typeof item.weight === 'string' && item.weight.trim()) {
                            const scaledW = scaleTextQuantity(item.weight, currentServings, baseServings);
                            text = `${item.name} ${scaledW}`.trim();
                          } else {
                            text = scaleTextQuantity(item.name || '', currentServings, baseServings);
                          }
                          
                          const cat = resolveDietFoodCategory(item.name, item.category);

                          let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                          if (cat === 'Protéines') {
                            colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                          } else if (cat === 'Légumes') {
                            colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                          } else if (cat === 'Féculents') {
                            colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                          } else if (cat === 'Laitage') {
                            colorClass = 'text-gray-800 bg-gray-100 border-gray-300';
                          } else if (cat === 'Desserts') {
                            colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';
                          }

                          return (
                            <span 
                              key={idx} 
                              className={`px-2.5 py-1 border rounded-xl text-[11px] font-black tracking-wide shadow-xs ${colorClass}`}
                              title={`Catégorie : ${cat}`}
                            >
                              {text}
                            </span>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={dr.id} 
                      onClick={() => {
                        setPlanningDietRecipe(dr);
                        setDietPlanDate(formatDateKey(new Date()));
                        setDietPlanMealType('lunch');
                        setDietPlanServings(dr.servings || 2.5);
                        setShowDietAvailability(false);
                      }}
                      className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:shadow-md hover:border-purple-300 transition-all group cursor-pointer"
                      title="Cliquer pour planifier au planning régime"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-black text-gray-800 text-base leading-snug group-hover:text-purple-700 transition-colors">{dr.name}</h4>
                          <span className="shrink-0 bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200" title={`Portions ajustées pour ${currentServings} pers. (Base créations: ${baseServings}p)`}>
                            👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-700 bg-white p-3 rounded-xl border border-purple-50 mt-2 whitespace-pre-wrap leading-relaxed">
                          {displayIngredients || (typeof dr.ingredients === 'string' ? dr.ingredients : '') || "Aucun aliment renseigné."}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-purple-100/60 opacity-90 group-hover:opacity-100">
                        <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                          <span>📅</span>
                          <span>Planifier</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                            title="Modifier"
                          >
                            <EXT_ICONS.Edit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDietRecipe(dr);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Supprimer"
                          >
                            <EXT_ICONS.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VUE 3 : CATÉGORIES RÉGIME */}
      {viewMode === 'categories_regime' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER RÉGIME & PORTIONS */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-purple-100 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Régime & Portions</h2>
                <span className="text-xs font-black bg-purple-50 px-2.5 py-1 rounded-xl text-purple-600 border border-purple-100">
                  {dietItems.length} aliments
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Portions calculées pour {dietServings} personne{dietServings > 1 ? 's' : ''} (base 2.5 pers.)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-100 shadow-sm">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                  <span>👥</span> Personnes :
                </span>
                <select
                  value={dietServings}
                  onChange={(e) => setDietServings(parseFloat(e.target.value))}
                  className="bg-white border border-purple-200 rounded-xl px-3 py-1 font-black text-sm text-purple-900 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer shadow-sm"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Filtrer les aliments..."
                value={dietSearch}
                onChange={(e) => setDietSearch(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-purple-200 flex-1 md:w-48"
              />
              <button 
                onClick={() => setShowRoundingSettingsModal(true)} 
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                title="Configurer l'arrondi des unités indivisibles (pots, pièces, œufs, etc.)"
              >
                <span>⚙️</span>
                <span>Gérer les arrondis</span>
              </button>
              <button 
                onClick={() => handleOpenAddDiet('Protéines')} 
                className="bg-purple-600 text-white px-6 py-2.5 rounded-2xl font-black shadow-lg shadow-purple-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                <span>Ajouter un aliment</span>
              </button>
            </div>
          </header>

          {/* 4 COLONNES : PROTÉINES / LÉGUMES / FÉCULENTS / DESSERTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
            
            {/* COLONNE 1 : PROTÉINES */}
            <div className="bg-white rounded-[32px] border-2 border-red-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-red-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥩</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Protéines</h3>
                    <p className="text-[10px] text-red-100 font-bold uppercase tracking-wider">Viandes, poissons, œufs, tofu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {proteins.length}
                  </span>
                </div>
              </div>

              <div className="bg-red-50/60 border-b border-red-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Protéines')}
                  className="bg-white hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Protéines"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-red-50/80 border-b border-red-100 text-xs font-black text-red-800 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-red-50">
                {proteins.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-red-50/40 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-red-100 text-red-800 font-black text-xs px-2.5 py-1 rounded-xl border border-red-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {proteins.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Protéines.
                  </div>
                )}
              </div>

              <div className="p-3 bg-red-50/40 border-t border-red-100">
                <button
                  onClick={() => handleOpenAddDiet('Protéines')}
                  className="w-full py-2 px-3 text-xs font-black text-red-700 hover:bg-red-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter une protéine</span>
                </button>
              </div>
            </div>

            {/* COLONNE 2 : LÉGUMES */}
            <div className="bg-white rounded-[32px] border-2 border-green-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-green-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥦</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Légumes</h3>
                    <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider">Légumes crus & cuits</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {vegetables.length}
                  </span>
                </div>
              </div>

              <div className="bg-green-50/60 border-b border-green-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Légumes')}
                  className="bg-white hover:bg-green-100 text-green-600 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Légumes"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-green-50/80 border-b border-green-100 text-xs font-black text-green-800 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-green-50">
                {vegetables.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-green-50/40 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-green-100 text-green-800 font-black text-xs px-2.5 py-1 rounded-xl border border-green-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {vegetables.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Légumes.
                  </div>
                )}
              </div>

              <div className="p-3 bg-green-50/40 border-t border-green-100">
                <button
                  onClick={() => handleOpenAddDiet('Légumes')}
                  className="w-full py-2 px-3 text-xs font-black text-green-700 hover:bg-green-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un légume</span>
                </button>
              </div>
            </div>

            {/* COLONNE 3 : FÉCULENTS */}
            <div className="bg-white rounded-[32px] border-2 border-amber-300 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥔</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Féculents</h3>
                    <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">Riz, pâtes, tubercules, céréales</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {starches.length}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50/60 border-b border-amber-200 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Féculents')}
                  className="bg-white hover:bg-amber-100 text-amber-600 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Féculents"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-amber-50/90 border-b border-amber-200 text-xs font-black text-amber-900 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-amber-50">
                {starches.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-amber-50/50 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-xl border border-amber-300" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {starches.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Féculents.
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50/40 border-t border-amber-200">
                <button
                  onClick={() => handleOpenAddDiet('Féculents')}
                  className="w-full py-2 px-3 text-xs font-black text-amber-800 hover:bg-amber-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un féculent</span>
                </button>
              </div>
            </div>

            {/* COLONNE 4 : LAITAGE */}
            <div className="bg-white rounded-[32px] border-2 border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-white text-gray-800 p-5 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥛</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-gray-800">Laitage</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Yaourts, laits, fromages blancs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-black border border-gray-200">
                    {dairies.length}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50/60 border-b border-gray-200 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Laitage')}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Laitage"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-gray-50/90 border-b border-gray-200 text-xs font-black text-gray-700 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-100">
                {dairies.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-gray-100 text-gray-800 font-black text-xs px-2.5 py-1 rounded-xl border border-gray-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {dairies.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Laitage.
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50/40 border-t border-gray-200">
                <button
                  onClick={() => handleOpenAddDiet('Laitage')}
                  className="w-full py-2 px-3 text-xs font-black text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un laitage</span>
                </button>
              </div>
            </div>

            {/* COLONNE 4 : DESSERTS */}
            <div className="bg-white rounded-[32px] border-2 border-pink-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="bg-pink-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍨</span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Desserts</h3>
                    <p className="text-[10px] text-pink-100 font-bold uppercase tracking-wider">Fruits, yaourts, compotes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                    {desserts.length}
                  </span>
                </div>
              </div>

              <div className="bg-pink-50/60 border-b border-pink-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={() => handleOpenManageCategory('Desserts')}
                  className="bg-white hover:bg-pink-100 text-pink-600 border border-pink-200 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  title="Modifier et gérer les aliments Desserts"
                >
                  <EXT_ICONS.Edit />
                  <span>Modifier</span>
                </button>
              </div>

              <div className="grid grid-cols-12 px-5 py-3 bg-pink-50/90 border-b border-pink-100 text-xs font-black text-pink-900 uppercase tracking-wider">
                <div className="col-span-7">Nom</div>
                <div className="col-span-4 text-right">Poids ({dietServings}p)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-pink-50">
                {desserts.map(item => (
                  <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-pink-50/50 transition-colors group">
                    <div className="col-span-7 font-bold text-gray-800 text-sm truncate pr-2" title={item.name}>
                      {item.name}
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="inline-block bg-pink-100 text-pink-900 font-black text-xs px-2.5 py-1 rounded-xl border border-pink-200" title={`Base (2.5 pers.): ${item.weight}`}>
                        {formatScaledWeight(item.weight, dietServings, 2.5, settings, item.roundWeight)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditDiet(item)}
                        className="text-gray-400 hover:text-purple-600 p-0.5"
                        title="Modifier"
                      >
                        <EXT_ICONS.Edit />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiet(item)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        title="Supprimer"
                      >
                        <EXT_ICONS.Trash />
                      </button>
                    </div>
                  </div>
                ))}
                {desserts.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-gray-400 italic">
                    Aucun aliment dans Desserts.
                  </div>
                )}
              </div>

              <div className="p-3 bg-pink-50/40 border-t border-pink-100">
                <button
                  onClick={() => handleOpenAddDiet('Desserts')}
                  className="w-full py-2 px-3 text-xs font-black text-pink-700 hover:bg-pink-100/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un dessert</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL GÉRER LES ARRONDIS */}
      {showRoundingSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            <div className="p-6 sm:p-8 text-center border-b border-gray-100 shrink-0 bg-purple-50/50">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                ⚙️
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                Gérer les arrondis
              </h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">
                Régime & portions des unités indivisibles
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Option 1 : Activation de l'arrondi et sélection des unités */}
              <div className="bg-purple-50/40 p-4 sm:p-5 rounded-2xl border border-purple-100 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dietRoundDiscreteUnits ?? true}
                    onChange={(e) => {
                      if (setSettings) {
                        setSettings(prev => ({ ...prev, dietRoundDiscreteUnits: e.target.checked }));
                      }
                    }}
                    className="w-5 h-5 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-black text-gray-800 block">
                      Arrondir les unités indivisibles à l'entier
                    </span>
                    <span className="text-xs text-gray-500 font-medium block mt-0.5">
                      Cochez les unités que vous souhaitez arrondir à l'entier lorsqu'elles sont multipliées.
                    </span>
                  </div>
                </label>

                {(settings.dietRoundDiscreteUnits ?? true) && (
                  <div className="pt-2 border-t border-purple-100/80 space-y-2">
                    <p className="text-xs font-black text-purple-900 uppercase tracking-wider">
                      Unités à prendre en compte :
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      {getRoundingUnitsList(settings).map(unit => {
                        const selectedUnits = settings.dietRoundingUnits && settings.dietRoundingUnits.length > 0
                          ? settings.dietRoundingUnits
                          : DEFAULT_DIET_ROUNDING_UNITS;
                        const isChecked = selectedUnits.includes(unit);

                        return (
                          <label key={unit} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50/60 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (setSettings) {
                                  const updated = e.target.checked
                                    ? [...selectedUnits, unit]
                                    : selectedUnits.filter(u => u !== unit);
                                  setSettings(prev => ({ ...prev, dietRoundingUnits: updated }));
                                }
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
                )}
              </div>

              {/* Option 2 : Mode d'arrondi */}
              <div className={`space-y-3 transition-opacity ${(settings.dietRoundDiscreteUnits ?? true) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                  Méthode d'arrondi :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      (settings.dietRoundingMode || 'nearest') === 'nearest'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietRoundingMode"
                      value="nearest"
                      checked={(settings.dietRoundingMode || 'nearest') === 'nearest'}
                      onChange={() => {
                        if (setSettings) {
                          setSettings(prev => ({ ...prev, dietRoundingMode: 'nearest' }));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-black block">Arrondi au plus proche</span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        Arrondi standard (ex: 1,2 → 1 pot ; 1,6 → 2 pots)
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      settings.dietRoundingMode === 'ceil'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietRoundingMode"
                      value="ceil"
                      checked={settings.dietRoundingMode === 'ceil'}
                      onChange={() => {
                        if (setSettings) {
                          setSettings(prev => ({ ...prev, dietRoundingMode: 'ceil' }));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-black block">Arrondi supérieur</span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        Toujours à l'entier supérieur (ex: 1,2 → 2 pots)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRoundingSettingsModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Fermer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRIMER DES RECETTES RÉGIME */}
      {showDeleteDietRecipesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center border-b border-gray-100 shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                <EXT_ICONS.Trash />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                Supprimer des recettes
              </h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">
                Sélectionnez les recettes que vous souhaitez supprimer.
              </p>
            </div>

            {sortedDietRecipes.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-500">
                  {selectedDietRecipesToDelete.size} / {sortedDietRecipes.length} sélectionnée(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDietRecipesToDelete(new Set(sortedDietRecipes.map(r => r.id)));
                    }}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
                  >
                    Cocher tous
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDietRecipesToDelete(new Set());
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Décocher tous
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-2">
              {sortedDietRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic font-medium">Aucune recette enregistrée.</div>
              ) : (
                sortedDietRecipes.map(recipe => (
                  <label key={recipe.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-red-600 rounded-lg border-gray-300 focus:ring-red-500"
                      checked={selectedDietRecipesToDelete.has(recipe.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedDietRecipesToDelete);
                        if (e.target.checked) newSet.add(recipe.id);
                        else newSet.delete(recipe.id);
                        setSelectedDietRecipesToDelete(newSet);
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{recipe.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{recipe.ingredients}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-gray-100 shrink-0 flex gap-3">
              <button 
                onClick={() => setShowDeleteDietRecipesModal(false)} 
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm"
              >
                Annuler
              </button>
              {selectedDietRecipesToDelete.size > 0 && (
                <button 
                  onClick={() => setShowConfirmBulkDeleteDietRecipes(true)} 
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-colors shadow-lg shadow-red-200 text-sm animate-fadeIn"
                >
                  Supprimer ({selectedDietRecipesToDelete.size})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION EN MASSE */}
      {showConfirmBulkDeleteDietRecipes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
                ⚠️
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Êtes-vous sûr ?</h3>
              <p className="text-gray-500 font-medium mb-8">
                Vous êtes sur le point de supprimer <strong className="text-gray-800">{selectedDietRecipesToDelete.size} recette(s)</strong>. Cette action est irréversible.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmBulkDeleteDietRecipes(false)} 
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    setDietRecipes(prev => prev.filter(r => !selectedDietRecipesToDelete.has(r.id)));
                    setShowConfirmBulkDeleteDietRecipes(false);
                    setShowDeleteDietRecipesModal(false);
                    setSelectedDietRecipesToDelete(new Set());
                  }} 
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER / MODIFIER UNE RECETTE RÉGIME */}
      {showDietRecipeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🍳
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                {editingDietRecipe ? "Modifier la recette régime" : "Ajouter une recette régime"}
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Renseignez le nom, les aliments nécessaires et le nombre de personnes.
              </p>

              <div className="space-y-5 text-left">
                {/* Champ Nom de la recette */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de la recette
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Omelette espagnole légère"
                    value={dietRecipeFormName}
                    onChange={(e) => setDietRecipeFormName(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Section Aliments nécessaires (Choix par catégories + poids + liste) */}
                <div className="bg-purple-50/50 p-4 sm:p-5 rounded-3xl border border-purple-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🥗</span> Aliments nécessaires
                    </label>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg">
                      {dietRecipeItems.length} aliment(s)
                    </span>
                  </div>

                  {/* Filtre par catégorie (Recettes / Régime) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                      Filtrer par catégorie
                    </label>
                    <select
                      value={selectedFoodCategoryFilter}
                      onChange={(e) => setSelectedFoodCategoryFilter(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-white font-semibold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    >
                      <option value="Toutes">Toutes les catégories (Recettes & Régime)</option>
                      <option value="Régime: Protéines">Régime: Protéines 🥩</option>
                      <option value="Régime: Légumes">Régime: Légumes 🥦</option>
                      <option value="Régime: Féculents">Régime: Féculents 🥔</option>
                      <option value="Régime: Laitage">Régime: Laitage 🥛</option>
                      <option value="Régime: Desserts">Régime: Desserts 🍨</option>
                      {availableSettingsCategories.map(cat => (
                        <option key={cat} value={`Recettes: ${cat}`}>
                          Recettes: {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Champs sélection/saisie d'un aliment + poids + unité */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    {/* Choix ou nom de l'aliment */}
                    <div className="sm:col-span-6">
                      <input 
                        type="text"
                        list="diet-foods-suggestions"
                        placeholder="Choisir ou taper un aliment..."
                        value={selectedFoodName}
                        onChange={(e) => setSelectedFoodName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <datalist id="diet-foods-suggestions">
                        {filteredFoodsForSelection.map((item, idx) => (
                          <option key={`${item.name}-${idx}`} value={item.name}>
                            {item.category}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Poids / Quantité */}
                    <div className="sm:col-span-3">
                      <input 
                        type="text"
                        placeholder="Ex: 100"
                        value={selectedFoodWeight}
                        onChange={(e) => setSelectedFoodWeight(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    {/* Unité */}
                    <div className="sm:col-span-3">
                      <select
                        value={selectedFoodUnit}
                        onChange={(e) => setSelectedFoodUnit(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {DIET_RECIPE_UNITS.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredientToRecipe}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>+ Ajouter cet aliment à la recette</span>
                  </button>

                  {/* Liste des aliments enregistrés dans la recette avec nom et poids */}
                  <div className="pt-2">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-2">
                      Aliments enregistrés dans la recette :
                    </p>
                    {dietRecipeItems.length === 0 ? (
                      <div className="text-center py-4 bg-white/70 rounded-2xl border border-dashed border-purple-100 text-xs text-gray-400 italic font-medium">
                        Aucun aliment ajouté pour l'instant. Choisissez un aliment ci-dessus.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {dietRecipeItems.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between shadow-xs hover:border-purple-200 transition-all"
                          >
                            {editingIngredientIndex === index ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editingIngredientName}
                                  onChange={(e) => setEditingIngredientName(e.target.value)}
                                  placeholder="Nom de l'aliment"
                                  className="flex-1 w-full sm:w-auto p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <input
                                  type="text"
                                  value={editingIngredientWeight}
                                  onChange={(e) => setEditingIngredientWeight(e.target.value)}
                                  placeholder="Poids"
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-medium text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <select
                                  value={editingIngredientUnit}
                                  onChange={(e) => setEditingIngredientUnit(e.target.value)}
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                                >
                                  {DIET_RECIPE_UNITS.map(unit => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedIngredient(index)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                                    title="Valider la modification"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditIngredient}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  {(() => {
                                    const itemCat = resolveDietFoodCategory(item.name, item.category);
                                    let catBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                    let dotClass = 'bg-purple-500';
                                    if (itemCat === 'Protéines') {
                                      catBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                                      dotClass = 'bg-red-500';
                                    } else if (itemCat === 'Légumes') {
                                      catBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                      dotClass = 'bg-emerald-500';
                                    } else if (itemCat === 'Féculents') {
                                      catBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                      dotClass = 'bg-amber-500';
                                    } else if (itemCat === 'Desserts') {
                                      catBadgeClass = 'bg-pink-50 text-pink-700 border-pink-200';
                                      dotClass = 'bg-pink-500';
                                    }

                                    return (
                                      <>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                        <span className="font-bold text-gray-800 text-xs truncate">{item.name}</span>
                                        {item.weight && (
                                          <span className="bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                                            {item.weight}
                                          </span>
                                        )}
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${catBadgeClass}`}>
                                          {itemCat}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditIngredient(index)}
                                    className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                                    title="Modifier cet aliment"
                                  >
                                    <EXT_ICONS.Edit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIngredientFromRecipe(index)}
                                    className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                    title="Retirer cet aliment"
                                  >
                                    <EXT_ICONS.Trash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Pour (pers.) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <span>👥</span> Pour (pers.)
                  </label>
                  <select
                    value={dietRecipeFormServings}
                    onChange={(e) => setDietRecipeFormServings(parseFloat(e.target.value))}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOUTONS ANNULER ET ENREGISTRER LA RECETTE */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowDietRecipeModal(false)}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveDietRecipe}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-sm active:scale-95"
                >
                  Enregistrer la recette
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU ALIMENT */}
      {showNewFoodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
                ✨
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                Aliment à classer
              </h3>
              <p className="text-gray-500 font-medium mb-5 text-xs">
                L'aliment <span className="font-bold text-purple-700">"{pendingNewFoodName}"</span> n'est pas encore enregistré.
              </p>

              <div className="space-y-3 text-left">
                {/* Mode Créer nouveau */}
                <button
                  type="button"
                  onClick={() => setSelectedMatchModeDiet('__NEW__')}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    selectedMatchModeDiet === '__NEW__'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">✨</span>
                    <div>
                      <p className="font-black text-xs">Créer « {pendingNewFoodName} »</p>
                      <p className="text-[10px] text-gray-500">Ajouter comme nouvel aliment dans l'application</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedMatchModeDiet === '__NEW__' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                  }`}>
                    {selectedMatchModeDiet === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                  </div>
                </button>

                {/* Suggestions existantes */}
                {pendingDietSimilarSuggestions.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                      Ou utiliser un aliment existant :
                    </p>
                    <div className="space-y-1.5">
                      {pendingDietSimilarSuggestions.map(sug => {
                        const isSug = selectedMatchModeDiet === sug;
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setSelectedMatchModeDiet(sug)}
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

                {/* Champs si __NEW__ */}
                {selectedMatchModeDiet === '__NEW__' && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Nom de l'aliment
                      </label>
                      <input
                        type="text"
                        value={pendingNewFoodName}
                        onChange={(e) => setPendingNewFoodName(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Catégorie dans régime
                      </label>
                      <select
                        value={newFoodRecipeDietCat}
                        onChange={(e) => setNewFoodRecipeDietCat(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="Protéines">Régime: Protéines 🥩</option>
                        <option value="Légumes">Régime: Légumes 🥦</option>
                        <option value="Féculents">Régime: Féculents 🥔</option>
                        <option value="Laitage">Régime: Laitage 🥛</option>
                        <option value="Desserts">Régime: Desserts 🍨</option>
                        <option value="Recette (Général)">Recette (Général) 🍲</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">
                        Catégorie dans Réglages
                      </label>
                      <select
                        value={newFoodSettingsCat}
                        onChange={(e) => setNewFoodSettingsCat(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {availableSettingsCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons Annuler et Valider */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewFoodModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNewFood}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 text-xs active:scale-95"
                >
                  {selectedMatchModeDiet === '__NEW__' ? "Ajouter l'aliment" : "Utiliser cet aliment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER / MODIFIER UN ALIMENT */}
      {showDietModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center overflow-y-auto flex-1 overscroll-contain">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm ${
                dietFormCategory === 'Protéines' ? 'bg-red-100 text-red-600 border border-red-200' :
                dietFormCategory === 'Légumes' ? 'bg-green-100 text-green-600 border border-green-200' :
                dietFormCategory === 'Féculents' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                dietFormCategory === 'Laitage' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                'bg-pink-100 text-pink-700 border border-pink-200'
              }`}>
                {dietFormCategory === 'Protéines' ? '🥩' : dietFormCategory === 'Légumes' ? '🥦' : dietFormCategory === 'Féculents' ? '🥔' : dietFormCategory === 'Laitage' ? '🥛' : '🍨'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                {editingDietItem ? "Modifier l'aliment" : "Ajouter un aliment"}
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Indiquez le nom, la catégorie et le poids selon le nombre de personnes souhaité.
              </p>

              <div className="space-y-4 sm:space-y-5 text-left">
                {/* Champ Nom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de l'aliment
                  </label>
                  <input 
                    type="text"
                    value={dietFormName}
                    onChange={(e) => setDietFormName(e.target.value)}
                    placeholder="Ex: Blanc de poulet, Brocolis, Pomme, Yaourt..."
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                    autoFocus
                  />
                  {dietModalNameSuggestions.length > 0 && (
                    <div className="pt-1 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 space-y-1">
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                        🔄 Aliments déjà enregistrés proches :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {dietModalNameSuggestions.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setDietFormName(sug)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-800 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Champ Catégorie (Régime) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Catégorie (Régime)
                  </label>
                  <select
                    value={dietFormCategory}
                    onChange={(e) => setDietFormCategory(e.target.value as DietCategory)}
                    className={`w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer ${
                      dietFormCategory === 'Protéines' ? 'text-red-600' :
                      dietFormCategory === 'Légumes' ? 'text-emerald-600' :
                      dietFormCategory === 'Féculents' ? 'text-amber-600' :
                      'text-pink-600'
                    }`}
                  >
                    <option value="Protéines" className="text-red-600 font-bold">Protéines</option>
                    <option value="Légumes" className="text-emerald-600 font-bold">Légumes</option>
                    <option value="Féculents" className="text-amber-600 font-bold">Féculents</option>
                    <option value="Laitage" className="text-gray-800 font-bold">Laitage</option>
                    <option value="Desserts" className="text-pink-600 font-bold">Desserts</option>
                  </select>
                </div>

                {/* Champ Catégories (Réglages) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Catégories (Réglages)
                  </label>
                  <select
                    value={dietFormSettingsCategory}
                    onChange={(e) => setDietFormSettingsCategory(e.target.value)}
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    {availableSettingsCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champ Nombre de personnes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span>Nombre de personnes</span>
                    <span className="text-[10px] text-gray-400 font-semibold normal-case">Portion de référence</span>
                  </label>
                  <select
                    value={dietModalServings}
                    onChange={(e) => {
                      const newServings = parseFloat(e.target.value);
                      if (dietFormWeightValue.trim()) {
                        setDietFormWeightValue(prev => {
                          const full = `${prev} ${dietFormWeightUnit}`;
                          const scaled = formatScaledWeight(full, newServings, dietModalServings);
                          const parsed = parseWeightAndUnit(scaled);
                          return parsed.value;
                        });
                      }
                      setDietModalServings(newServings);
                    }}
                    className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} personne{val > 1 ? 's' : ''} {val === 2.5 ? '(Défaut 2,5)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champ Poids / Quantité et Unité */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Poids / Portion (pour {dietModalServings.toString().replace('.', ',')} pers.)
                  </label>
                  <div className="grid grid-cols-12 gap-2">
                    <input 
                      type="text"
                      value={dietFormWeightValue}
                      onChange={(e) => setDietFormWeightValue(e.target.value)}
                      placeholder="Ex: 150, 2, 1..."
                      className="col-span-7 p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveDietItem()}
                    />
                    <select
                      value={dietFormWeightUnit}
                      onChange={(e) => setDietFormWeightUnit(e.target.value)}
                      className="col-span-5 p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                    >
                      {getAvailableUnits(settings).map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2 ml-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={dietFormRoundWeight}
                        onChange={(e) => setDietFormRoundWeight(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <span className="text-xs font-bold text-gray-700">
                        Arrondir le poids
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100 shrink-0">
              <button 
                onClick={() => { setShowDietModal(false); setEditingDietItem(null); }}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveDietItem}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95"
              >
                {editingDietItem ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDATION SUPPRESSION ALIMENT RÉGIME */}
      {dietToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🗑️
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Supprimer cet aliment ?
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm leading-relaxed">
                Voulez-vous vraiment supprimer <span className="font-black text-gray-800">« {dietToDelete.name} »</span> de votre régime ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDietToDelete(null)}
                  className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    setDietItems(prev => prev.filter(i => i.id !== dietToDelete.id));
                    if (onRemoveFoodFromSettings) {
                      onRemoveFoodFromSettings(dietToDelete.name);
                    }
                    setDietToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDATION SUPPRESSION RECETTE RÉGIME */}
      {dietRecipeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🗑️
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Supprimer cette recette ?
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm leading-relaxed">
                Voulez-vous vraiment supprimer <span className="font-black text-gray-800">« {dietRecipeToDelete.name} »</span> de vos recettes régime ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDietRecipeToDelete(null)}
                  className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    if (setDietRecipes) {
                      setDietRecipes(prev => prev.filter(r => r.id !== dietRecipeToDelete.id));
                    }
                    setDietRecipeToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER ET GÉRER LES ALIMENTS DE LA CATÉGORIE */}
      {showManageCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col">
            {/* En-tête de la modal */}
            <div className={`p-6 text-white flex items-center justify-between ${
              manageCategory === 'Protéines' ? 'bg-red-600' : 
              manageCategory === 'Légumes' ? 'bg-green-600' : 
              manageCategory === 'Féculents' ? 'bg-amber-600' : 
              manageCategory === 'Laitage' ? 'bg-white text-gray-900 border-b border-gray-200' : 
              'bg-pink-600'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {manageCategory === 'Protéines' ? '🥩' : 
                   manageCategory === 'Légumes' ? '🥦' : 
                   manageCategory === 'Féculents' ? '🥔' : 
                   manageCategory === 'Laitage' ? '🥛' : '🍨'}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Gérer la catégorie {manageCategory}
                  </h3>
                  <p className="text-xs opacity-90 font-medium">
                    Liste complète des aliments ({dietItems.filter(i => i.category === manageCategory).length})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowManageCategoryModal(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Corps de la modal avec liste complète */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              {(() => {
                const categoryItems = dietItems.filter(i => i.category === manageCategory);
                const allSelected = categoryItems.length > 0 && categoryItems.every(i => selectedCategoryItemIds.includes(i.id));

                if (categoryItems.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 italic font-medium">
                      Aucun aliment trouvé dans la catégorie {manageCategory}.
                    </div>
                  );
                }

                return (
                  <>
                    {/* Barre d'outils haut de liste : Tout sélectionner + Bouton Supprimer */}
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                        <input 
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleToggleSelectAllCategoryItems(categoryItems)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                        />
                        <span>Tout sélectionner ({categoryItems.length})</span>
                      </label>

                      {selectedCategoryItemIds.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedCategoryItems}
                          className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-200 active:scale-95 cursor-pointer animate-fadeIn"
                        >
                          <EXT_ICONS.Trash />
                          <span>Supprimer ({selectedCategoryItemIds.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Liste des aliments avec cases à cocher */}
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                      {categoryItems.map((item) => {
                        const isChecked = selectedCategoryItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleSelectItem(item.id)}
                            className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors select-none ${
                              isChecked ? 'bg-red-50/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectItem(item.id);
                                }}
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-400 cursor-pointer"
                              />
                              <span className={`text-sm font-bold ${isChecked ? 'text-red-900' : 'text-gray-800'}`}>
                                {item.name}
                              </span>
                            </div>
                            <span className="text-xs font-black text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl">
                              {item.weight}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Pied de la modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowManageCategoryModal(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFIER AU PLANNING RÉGIME */}
      {planningDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* En-tête de la modale */}
            <div className="p-6 sm:p-7 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-purple-200 shrink-0">
                  🍳
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                    Planifier au planning régime
                  </h3>
                  <p className="text-xs font-bold text-purple-700 truncate">
                    « {planningDietRecipe.name} »
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {/* Bouton Les disponibilités au-dessus de la date */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowDietAvailability(true)}
                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 p-3.5 rounded-2xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Voir les disponibilités de la semaine"
                >
                  <span>💗</span>
                  <span>Les disponibilités</span>
                </button>
              </div>

              {/* Champ Date */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>📅</span> Date
                </label>
                <input 
                  type="date"
                  value={dietPlanDate}
                  onChange={(e) => setDietPlanDate(e.target.value)}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Liste déroulante : Déjeuner / Dîner */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>🍽️</span> Repas
                </label>
                <select
                  value={dietPlanMealType}
                  onChange={(e) => setDietPlanMealType(e.target.value as 'lunch' | 'dinner')}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="lunch">Déjeuner</option>
                  <option value="dinner">Dîner</option>
                </select>
              </div>

              {/* Sélecteur de personnes : par défaut 2.5 pers */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>👥</span> Nombre de personnes
                </label>
                <select
                  value={dietPlanServings}
                  onChange={(e) => setDietPlanServings(parseFloat(e.target.value))}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pied de modal avec boutons */}
            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setPlanningDietRecipe(null)}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={handleProgrammerAuPlanningRegime}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                Programmer au planning régime
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPONIBILITÉS DE LA SEMAINE RÉGIME */}
      {showDietAvailability && planningDietRecipe && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="p-6 md:p-7 border-b flex justify-between items-center bg-pink-50/40">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-pink-500">💗</span> Les disponibilités (Planning Régime)
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  « {planningDietRecipe.name} » • Cliquez sur un créneau pour le sélectionner
                </p>
              </div>
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg transition-all cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() - 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine précédente"
                >
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-gray-700 min-w-[220px] text-center">
                  Semaine du {dietAvailabilityWeekDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() + 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine suivante"
                >
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(dietAvailabilityWeekDate);
                  d.setDate(dietAvailabilityWeekDate.getDate() + i);
                  const dateStr = formatDateKey(d);
                  const dayPlan = mealPlan[dateStr];
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/80 p-3.5 rounded-[24px] border border-gray-100 space-y-2.5">
                      <p className="text-[11px] font-black text-center uppercase tracking-widest text-gray-500 border-b border-gray-200/60 pb-2">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      {(['lunch', 'dinner'] as const).map(mType => {
                        const mKey = mType === 'lunch' ? 'dietLunch' : 'dietDinner';
                        const dietMeal = dayPlan?.[mKey];
                        const existingDietRecipeId = dietMeal?.dietRecipe;
                        const isCurrentRecipe = existingDietRecipeId === planningDietRecipe.id;
                        const hasDietRecipe = !!existingDietRecipeId;
                        const hasAliments = !!(dietMeal?.protein || dietMeal?.vegetable || dietMeal?.starch || dietMeal?.dairy || dietMeal?.dessert);

                        const classicId = dayPlan?.[mType]?.recipe1 || dayPlan?.[mType]?.recipe2;
                        const classicRecipe = classicId ? recipes.find(r => r.id === classicId) : null;
                        const hasClassicRecipe = !!classicId;

                        const isOccupied = hasDietRecipe || hasAliments || hasClassicRecipe;

                        let occupantLabel = 'Disponible';
                        if (isCurrentRecipe) {
                          occupantLabel = 'Déjà ici';
                        } else if (hasDietRecipe) {
                          const existingDr = dietRecipes.find(r => r.id === existingDietRecipeId);
                          occupantLabel = existingDr ? existingDr.name : 'Recette planifiée';
                        } else if (hasAliments) {
                          occupantLabel = 'Aliments choisis';
                        } else if (hasClassicRecipe) {
                          occupantLabel = classicRecipe ? `${classicRecipe.title} (Non disponible)` : 'Non disponible (Classique)';
                        }

                        const isSelected = dietPlanDate === dateStr && dietPlanMealType === mType;
                        const isDisabled = isOccupied && !isCurrentRecipe;

                        return (
                          <button
                            key={mType}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType(mType);
                              setShowDietAvailability(false);
                            }}
                            className={`w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-1 
                              ${isDisabled ? 'opacity-60 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                              ${!isDisabled && isSelected ? 'ring-2 ring-purple-600 bg-purple-100 border-purple-300 text-purple-900 scale-105 shadow-md' :
                                isCurrentRecipe ? 'bg-green-100 border-green-300 text-green-700' :
                                isOccupied ? 'bg-amber-50/90 border-amber-200 text-amber-800' :
                                mType === 'lunch' ? 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50 hover:scale-[1.02] shadow-xs' :
                                'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-[1.02] shadow-xs'
                              }
                            `}
                          >
                            <span className="font-extrabold">{mType === 'lunch' ? 'Midi (Déjeuner)' : 'Soir (Dîner)'}</span>
                            <span className="text-[9px] font-bold truncate max-w-full">{occupantLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingRecipe && <RecipeDetail recipe={viewingRecipe} recipes={recipes} mealPlan={mealPlan} onClose={() => setViewingRecipe(null)} onAddToShopping={onAddToShopping} updateMealPlan={updateMealPlan} setSentMeals={setSentMeals} dietRecipes={dietRecipes} dietItems={dietItems} />}
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

const RecipeForm: React.FC<{ 
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

const normalizeSearchText = (text: string) => {
  return (text || '')
    .toLowerCase()
    .replace(/é/g, '___e_acute___')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/___e_acute___/g, 'é')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9é\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isWordMatch = (targetWord: string, queryWord: string): boolean => {
  if (!targetWord || !queryWord) return false;
  return targetWord === queryWord;
};

const doesTargetMatchQuery = (targetText: string, query: string) => {
  const normTarget = normalizeSearchText(targetText);
  const normQuery = normalizeSearchText(query);
  if (!normTarget || !normQuery) return false;

  const targetWords = normTarget.split(/\s+/).filter(Boolean);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return false;

  return queryTokens.every(qTok => 
    targetWords.some(tWord => isWordMatch(tWord, qTok))
  );
};

const countRecipeMatches = (r: Recipe, searchTerms: string[], appliance: string, searchMode: 'ingredients' | 'recipes' = 'ingredients'): number => {
  if (appliance === 'Thermomix TM7' && !r.tags?.includes('TM7')) return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    if (searchMode === 'ingredients') {
      const matchesIng = (r.ingredients || []).some(ri => {
        const ingName = ri.name || '';
        return doesTargetMatchQuery(ingName, term);
      });
      if (matchesIng) {
        score++;
      }
    } else {
      const matchesTitle = doesTargetMatchQuery(r.title || '', term) || normalizeSearchText(r.title || '').includes(normalizeSearchText(term));
      if (matchesTitle) {
        score++;
      }
    }
  }
  return score;
};

const countDietRecipeMatches = (dr: DietRecipe, searchTerms: string[], appliance: string, searchMode: 'ingredients' | 'recipes' = 'ingredients'): number => {
  if (appliance === 'Thermomix TM7') return 0;
  if (searchTerms.length === 0) return 0;

  let score = 0;
  for (const term of searchTerms) {
    if (searchMode === 'ingredients') {
      let matched = false;
      if (dr.items && dr.items.length > 0) {
        if (dr.items.some(item => doesTargetMatchQuery(item.name || '', term))) {
          matched = true;
        }
      }
      if (!matched && dr.ingredients && typeof dr.ingredients === 'string') {
        if (doesTargetMatchQuery(dr.ingredients, term)) {
          matched = true;
        }
      }
      if (matched) {
        score++;
      }
    } else {
      const matchesName = doesTargetMatchQuery(dr.name || '', term) || normalizeSearchText(dr.name || '').includes(normalizeSearchText(term));
      if (matchesName) {
        score++;
      }
    }
  }
  return score;
};

const doesRecipeMatchTerms = (r: Recipe, searchTerms: string[], appliance: string) => {
  return countRecipeMatches(r, searchTerms, appliance) > 0;
};

const doesDietRecipeMatchTerms = (dr: DietRecipe, searchTerms: string[], appliance: string) => {
  return countDietRecipeMatches(dr, searchTerms, appliance) > 0;
};

const RecipeSearch: React.FC<{ 
  recipes: Recipe[]; 
  dietRecipes?: DietRecipe[];
  setDietRecipes?: React.Dispatch<React.SetStateAction<DietRecipe[]>>;
  dietItems?: DietItem[];
  setDietItems?: React.Dispatch<React.SetStateAction<DietItem[]>>;
  dietServings?: number;
  setDietServings?: React.Dispatch<React.SetStateAction<number>>;
  mealPlan: Record<string, MealPlanDay>;
  addRecipe: (r: Recipe) => void;
  deleteRecipe?: (id: string) => void;
  onAddToShopping: (ings: Ingredient[], title: string) => void;
  updateMealPlan: (date: string, type: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => void;
  updateDietMealPlan?: (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe', itemId: string | undefined) => void;
  foodPortions: FoodPortion[];
  foodCategories?: string[];
  onAddFoodToSettings?: (name: string, unit: string, category?: string) => void;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  settings?: UserSettings;
}> = ({ 
  recipes, 
  dietRecipes = [], 
  setDietRecipes,
  dietItems = [], 
  setDietItems,
  dietServings = 2.5, 
  setDietServings, 
  mealPlan, 
  addRecipe, 
  deleteRecipe,
  onAddToShopping, 
  updateMealPlan, 
  updateDietMealPlan, 
  foodPortions, 
  foodCategories = FOOD_CATEGORIES,
  onAddFoodToSettings,
  setSentMeals, 
  settings 
}) => {
  const [searchMode, setSearchMode] = useState<'ingredients' | 'recipes'>('ingredients');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputIng, setInputIng] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliance, setAppliance] = useState('Standard');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Classic recipe editing state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Diet recipe editing state
  const [editingDietRecipe, setEditingDietRecipe] = useState<DietRecipe | null>(null);
  const [editDietRecipeName, setEditDietRecipeName] = useState('');
  const [editDietRecipeServings, setEditDietRecipeServings] = useState(2.5);
  const [editDietRecipeItems, setEditDietRecipeItems] = useState<{ name: string; weight: string; unit?: string; category?: string }[]>([]);
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('Toutes');
  const [editSelectedFoodName, setEditSelectedFoodName] = useState('');
  const [editSelectedFoodWeight, setEditSelectedFoodWeight] = useState('100');
  const [editSelectedFoodUnit, setEditSelectedFoodUnit] = useState('g');
  const [editingIngredientIdx, setEditingIngredientIdx] = useState<number | null>(null);
  const [editingIngName, setEditingIngName] = useState('');
  const [editingIngWeight, setEditingIngWeight] = useState('');
  const [editingIngUnit, setEditingIngUnit] = useState('g');
  const [showDeleteDietConfirm, setShowDeleteDietConfirm] = useState(false);

  // Diet planning modal state in search
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [planningDietRecipe, setPlanningDietRecipe] = useState<DietRecipe | null>(null);
  const [dietPlanDate, setDietPlanDate] = useState<string>(() => formatDateKey(new Date()));
  const [dietPlanMealType, setDietPlanMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [dietPlanServings, setDietPlanServings] = useState<number>(dietServings || 2.5);
  const [showDietAvailability, setShowDietAvailability] = useState(false);
  const [dietAvailabilityWeekDate, setDietAvailabilityWeekDate] = useState(() => {
    const d = new Date();
    const startDay = settings?.startDay ?? 1;
    const day = d.getDay();
    const diff = (day - startDay + 7) % 7;
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  const DIET_UNITS_LIST = getAvailableUnits(settings);

  const handleOpenEditDietRecipe = (dr: DietRecipe) => {
    setEditingDietRecipe(dr);
    setEditDietRecipeName(dr.name || '');
    setEditDietRecipeServings(dr.servings || 2.5);
    setShowDeleteDietConfirm(false);
    setEditingIngredientIdx(null);
    setEditSelectedFoodName('');
    setEditSelectedFoodWeight('100');
    setEditSelectedFoodUnit('g');
    setEditSelectedCategory('Toutes');

    let items: { name: string; weight: string; unit?: string; category?: string }[] = [];
    if (dr.items && dr.items.length > 0) {
      items = dr.items.map(item => {
        const rawW = item.weight || '';
        const match = rawW.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
        if (match) {
          return {
            name: item.name,
            weight: match[1],
            unit: match[2]?.trim() || 'g',
            category: item.category
          };
        }
        return {
          name: item.name,
          weight: rawW,
          unit: 'g',
          category: item.category
        };
      });
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
      items = rawParts.map(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(.*?)\s+([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-ZÀ-ÿ\.\/]+)?$/i);
        if (match) {
          return {
            name: match[1].trim(),
            weight: match[2].trim(),
            unit: match[3]?.trim() || 'g'
          };
        }
        return { name: trimmed, weight: '', unit: '' };
      });
    }
    setEditDietRecipeItems(items);
  };

  const handleAddEditIngredient = () => {
    const trimmed = editSelectedFoodName.trim();
    if (!trimmed) {
      alert("Veuillez saisir ou choisir un aliment.");
      return;
    }
    const weightVal = editSelectedFoodWeight.trim() || '100';
    const unitVal = editSelectedFoodUnit || 'g';
    const cat = resolveDietFoodCategory(trimmed, undefined, dietItems, foodPortions);

    setEditDietRecipeItems(prev => [
      ...prev,
      {
        name: trimmed,
        weight: weightVal,
        unit: unitVal,
        category: cat
      }
    ]);
    setEditSelectedFoodName('');
    setEditSelectedFoodWeight('100');
  };

  const handleStartInlineEditIngredient = (index: number) => {
    const item = editDietRecipeItems[index];
    if (!item) return;
    setEditingIngredientIdx(index);
    setEditingIngName(item.name);
    setEditingIngWeight(item.weight || '');
    setEditingIngUnit(item.unit || 'g');
  };

  const handleSaveInlineEditIngredient = (index: number) => {
    const trimmed = editingIngName.trim();
    if (!trimmed) return;
    const cat = resolveDietFoodCategory(trimmed, undefined, dietItems, foodPortions);
    setEditDietRecipeItems(prev => {
      const next = [...prev];
      next[index] = {
        name: trimmed,
        weight: editingIngWeight.trim(),
        unit: editingIngUnit,
        category: cat
      };
      return next;
    });
    setEditingIngredientIdx(null);
  };

  const handleRemoveEditIngredient = (index: number) => {
    setEditDietRecipeItems(prev => prev.filter((_, i) => i !== index));
    if (editingIngredientIdx === index) {
      setEditingIngredientIdx(null);
    }
  };

  const handleSaveDietRecipe = () => {
    if (!editingDietRecipe || !setDietRecipes) return;
    const trimmedName = editDietRecipeName.trim();
    if (!trimmedName) {
      alert("Veuillez donner un nom à la recette régime.");
      return;
    }

    const itemsFormatted = editDietRecipeItems.map(item => ({
      name: item.name,
      weight: item.weight ? `${item.weight} ${item.unit || 'g'}`.trim() : '',
      category: item.category
    }));

    const ingredientsString = itemsFormatted.map(i => i.weight ? `${i.name} ${i.weight}` : i.name).join(' + ');

    const updatedRecipe: DietRecipe = {
      ...editingDietRecipe,
      name: trimmedName,
      servings: editDietRecipeServings || 2.5,
      items: itemsFormatted,
      ingredients: ingredientsString
    };

    setDietRecipes(prev => prev.map(dr => dr.id === updatedRecipe.id ? updatedRecipe : dr));
    setEditingDietRecipe(null);
  };

  const handleDeleteDietRecipe = () => {
    if (!editingDietRecipe || !setDietRecipes) return;
    setDietRecipes(prev => prev.filter(dr => dr.id !== editingDietRecipe.id));
    setEditingDietRecipe(null);
    setShowDeleteDietConfirm(false);
  };

  const handleProgrammerAuPlanningRegime = () => {
    if (!planningDietRecipe) return;
    if (!dietPlanDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    const conflict = getSlotOccupantInfo(mealPlan[dietPlanDate], dietPlanMealType, recipes, dietRecipes, dietItems, planningDietRecipe.id, true);
    if (conflict) {
      const mealLabel = dietPlanMealType === 'lunch' ? 'Midi (Déjeuner)' : 'Soir (Dîner)';
      const confirmed = window.confirm(`Le créneau du ${dietPlanDate} (${mealLabel}) contient déjà « ${conflict.title} » (${conflict.type}).\n\nVoulez-vous le remplacer par « ${planningDietRecipe.name} » ?`);
      if (!confirmed) return;
    }
    if (updateDietMealPlan) {
      updateDietMealPlan(dietPlanDate, dietPlanMealType, 'dietRecipe', planningDietRecipe.id);
    }
    if (setDietServings && dietPlanServings) {
      setDietServings(dietPlanServings);
    }
    const mealLabel = dietPlanMealType === 'lunch' ? 'Déjeuner' : 'Dîner';
    alert(`Recette régime « ${planningDietRecipe.name} » programmée au planning pour le ${dietPlanDate} (${mealLabel}) pour ${dietPlanServings.toString().replace('.', ',')} pers. !`);
    setPlanningDietRecipe(null);
  };

  const activeSearchTerms = useMemo(() => {
    const list = [...ingredients];
    const trimmedInput = inputIng.trim();
    if (trimmedInput && !list.some(item => item.toLowerCase() === trimmedInput.toLowerCase())) {
      list.push(trimmedInput);
    }
    return list.filter(Boolean);
  }, [ingredients, inputIng]);

  const results = useMemo(() => {
    if (activeSearchTerms.length === 0) return [];
    return recipes
      .map(r => ({ recipe: r, score: countRecipeMatches(r, activeSearchTerms, appliance, searchMode) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.title || '').localeCompare(b.recipe.title || ''))
      .map(item => item.recipe);
  }, [recipes, activeSearchTerms, appliance, searchMode]);

  const dietResults = useMemo(() => {
    if (activeSearchTerms.length === 0) return [];
    return (dietRecipes || [])
      .map(dr => ({ recipe: dr, score: countDietRecipeMatches(dr, activeSearchTerms, appliance, searchMode) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.recipe.name || '').localeCompare(b.recipe.name || ''))
      .map(item => item.recipe);
  }, [dietRecipes, activeSearchTerms, appliance, searchMode]);

  const handleSearch = () => {
    if (inputIng.trim()) {
      const trimmed = inputIng.trim();
      if (!ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
        setIngredients([...ingredients, trimmed]);
      }
      setInputIng('');
    }
  };

  const appliances = ['Standard', 'Thermomix TM7'];

  const allFoodSuggestions = useMemo(() => {
    if (searchMode === 'recipes') {
      const list: string[] = [];
      recipes.forEach(r => { if (r.title) list.push(r.title); });
      (dietRecipes || []).forEach(dr => { if (dr.name) list.push(dr.name); });
      return Array.from(new Set(list)).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }
    const list: string[] = [];
    (foodPortions || []).forEach(fp => { if (fp.name) list.push(fp.name); });
    (dietItems || []).forEach(di => { if (di.name) list.push(di.name); });
    return Array.from(new Set(list)).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [searchMode, recipes, dietRecipes, foodPortions, dietItems]);

  const matchingFoodSuggestions = useMemo(() => {
    if (!inputIng.trim()) return allFoodSuggestions;
    const term = inputIng.trim();
    return allFoodSuggestions.filter(name => 
      doesTargetMatchQuery(name, term) || name.toLowerCase().includes(term.toLowerCase())
    );
  }, [inputIng, allFoodSuggestions]);

  const filteredDietFoodSuggestions = useMemo(() => {
    let list: string[] = [];
    if (editSelectedCategory === 'Toutes') {
      list = allFoodSuggestions;
    } else {
      const catDietNames = (dietItems || []).filter(di => {
        const cat = resolveDietFoodCategory(di.name, di.category, dietItems, foodPortions);
        return cat === editSelectedCategory;
      }).map(di => di.name);

      const catPortionNames = (foodPortions || []).filter(fp => {
        const cat = resolveDietFoodCategory(fp.name, fp.category, dietItems, foodPortions);
        return cat === editSelectedCategory;
      }).map(fp => fp.name);

      list = Array.from(new Set([...catDietNames, ...catPortionNames]));
    }
    return list.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [editSelectedCategory, allFoodSuggestions, dietItems, foodPortions]);

  const totalFound = results.length + dietResults.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <h2 className="text-3xl font-black text-center text-gray-800 tracking-tight">Recherche par :</h2>
        <div className="bg-purple-100/80 p-1 rounded-2xl flex items-center gap-1 border border-purple-200 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setSearchMode('ingredients')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              searchMode === 'ingredients'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-800 hover:bg-purple-200/60'
            }`}
          >
            🥕 Ingrédients
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('recipes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              searchMode === 'recipes'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-800 hover:bg-purple-200/60'
            }`}
          >
            📖 Recettes
          </button>
        </div>
      </div>
      
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
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">
            {searchMode === 'ingredients' ? 'Ingrédients à disposition' : 'Mots-clés / Noms recherchés'}
          </p>
          <div className="flex gap-2 flex-wrap min-h-[40px]">
            {(ingredients || []).map(i => (
              <span key={i} className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-100 flex items-center gap-2">
                {i} <button onClick={() => setIngredients(ingredients.filter(x => x !== i))} className="hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
          
          <div className="relative">
            <div className="flex gap-2">
              <input 
                type="text"
                list="food-suggestions-search"
                className="flex-1 border-gray-100 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-200 font-bold" 
                placeholder={searchMode === 'ingredients' ? "Ajouter un ingrédient..." : "Ajouter un nom de recette (ex: salade, omelette)..."} 
                value={inputIng} 
                onChange={e => {
                  setInputIng(e.target.value);
                  setShowSearchSuggestions(true);
                }} 
                onFocus={() => setShowSearchSuggestions(true)}
                onKeyPress={e => e.key === 'Enter' && (inputIng.trim() && (setIngredients([...ingredients, inputIng.trim()]), setInputIng(''), setShowSearchSuggestions(false)))} 
              />
              <datalist id="food-suggestions-search">
                {allFoodSuggestions.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={() => setShowSearchSuggestions(!showSearchSuggestions)}
                className="px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title={`Afficher la liste des ${searchMode === 'ingredients' ? 'aliments' : 'recettes'} (15 visibles)`}
              >
                <span>📋</span>
                <span className="hidden sm:inline">15 visibles</span>
                <span>{showSearchSuggestions ? '▲' : '▼'}</span>
              </button>

              <button 
                onClick={() => { 
                  if(inputIng.trim()) { 
                    setIngredients([...ingredients, inputIng.trim()]); 
                    setInputIng(''); 
                    setShowSearchSuggestions(false);
                  } 
                }} 
                className="bg-gray-800 text-white px-6 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer"
              >
                Ajouter
              </button>
            </div>

            {/* LISTE DÉROULANTE INTERACTIVE - 15 VISIBLES */}
            {showSearchSuggestions && matchingFoodSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-purple-200 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
                <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                  <span className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{searchMode === 'ingredients' ? '🥗' : '📖'}</span> Liste des {searchMode === 'ingredients' ? 'aliments' : 'recettes'} ({matchingFoodSuggestions.length} disponible{matchingFoodSuggestions.length > 1 ? 's' : ''} — 15 visibles) :
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowSearchSuggestions(false)}
                    className="text-xs font-bold text-gray-500 hover:text-purple-800 px-2.5 py-1 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    ✕ Fermer
                  </button>
                </div>
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                  {matchingFoodSuggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!ingredients.some(i => i.toLowerCase() === name.toLowerCase())) {
                          setIngredients([...ingredients, name]);
                        }
                        setInputIng('');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-purple-100/80 hover:text-purple-900 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{name}</span>
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        + Ajouter
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-3xl font-black shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95">
          {loading ? 'Recherche...' : 'Rechercher dans ma bibliothèque & recettes régimes'}
        </button>
      </div>

      {/* RÉSULTATS : RECETTES CLASSIQUES */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Recettes Classiques</h3>
            <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-0.5 rounded-full">
              {results.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {results.map(r => (
              <div key={r.id} onClick={() => setViewingRecipe(r)} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative">
                <div className="aspect-video bg-purple-50 relative">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-200"><EXT_ICONS.Book /></div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
                    {r.tags?.includes('TM7') && <span className="bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">TM7</span>}
                    {activeSearchTerms.length > 1 && (
                      <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {countRecipeMatches(r, activeSearchTerms, appliance, searchMode)}/{activeSearchTerms.length} {searchMode === 'ingredients' ? 'ingr.' : 'mot(s)'}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRecipe(r);
                      }}
                      className="p-2 bg-white/90 hover:bg-white text-purple-700 hover:text-purple-900 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      title="Modifier la recette"
                    >
                      <EXT_ICONS.Edit />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{r.category}</span>
                    <h3 className="text-sm font-black text-gray-800 mt-1 line-clamp-1">{r.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRecipe(r);
                    }}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                    title="Modifier la recette"
                  >
                    <EXT_ICONS.Edit />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RÉSULTATS : RECETTES RÉGIME */}
      {dietResults.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <span>🥗</span>
              <span>Recettes Régime</span>
            </h3>
            <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-0.5 rounded-full">
              {dietResults.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
            {dietResults.map(dr => {
              const currentServings = dietServings || 2.5;
              const baseServings = dr.servings || 2.5;

              type ItemToDisplay = { name: string; weight: string; category?: string };
              let itemsToDisplay: ItemToDisplay[] = [];

              if (dr.items && dr.items.length > 0) {
                itemsToDisplay = dr.items.map(item => ({
                  name: item.name,
                  weight: item.weight || '',
                  category: item.category
                }));
              } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
                const rawParts = dr.ingredients.split(/\s*\+\s*|\s*,\s*|\n+/).filter(Boolean);
                itemsToDisplay = rawParts.map(part => {
                  const trimmed = part.trim();
                  const match = trimmed.match(/^(.*?)\s+([0-9]+(?:\.[0-9]+)?\s*(?:g|kg|cl|ml|cuillères|c\.à\.s|c\.à\.c|œufs|pièces)?)$/i);
                  if (match) {
                    return { name: match[1].trim(), weight: match[2].trim() };
                  }
                  return { name: trimmed, weight: '' };
                });
              }

              let displayIngredients: React.ReactNode = null;
              if (itemsToDisplay.length > 0) {
                const categoryOrderMap: Record<string, number> = {
                  'Protéines': 0,
                  'Légumes': 1,
                  'Féculents': 2,
                  'Laitage': 3,
                  'Desserts': 4
                };
                itemsToDisplay.sort((a, b) => {
                  const catA = resolveDietFoodCategory(a.name, a.category, dietItems, foodPortions);
                  const catB = resolveDietFoodCategory(b.name, b.category, dietItems, foodPortions);
                  const orderA = categoryOrderMap[catA] !== undefined ? categoryOrderMap[catA] : 99;
                  const orderB = categoryOrderMap[catB] !== undefined ? categoryOrderMap[catB] : 99;
                  return orderA - orderB;
                });

                displayIngredients = (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {itemsToDisplay.map((item, idx) => {
                      let text = '';
                      if (item.weight && typeof item.weight === 'string' && item.weight.trim()) {
                        const scaledW = scaleTextQuantity(item.weight, currentServings, baseServings);
                        text = `${item.name} ${scaledW}`.trim();
                      } else {
                        text = scaleTextQuantity(item.name || '', currentServings, baseServings);
                      }
                      
                      const cat = resolveDietFoodCategory(item.name, item.category, dietItems, foodPortions);

                      let colorClass = 'text-purple-800 bg-purple-100/90 border-purple-200';
                      if (cat === 'Protéines') {
                        colorClass = 'text-red-700 bg-red-100/90 border-red-200';
                      } else if (cat === 'Légumes') {
                        colorClass = 'text-emerald-700 bg-emerald-100/90 border-emerald-200';
                      } else if (cat === 'Féculents') {
                        colorClass = 'text-amber-800 bg-amber-100/90 border-amber-300';
                      } else if (cat === 'Laitage') {
                        colorClass = 'text-gray-800 bg-gray-100 border-gray-300';
                      } else if (cat === 'Desserts') {
                        colorClass = 'text-pink-700 bg-pink-100/90 border-pink-200';
                      }

                      return (
                        <span 
                          key={idx} 
                          className={`px-2.5 py-1 border rounded-xl text-[11px] font-black tracking-wide shadow-xs ${colorClass}`}
                          title={`Catégorie : ${cat}`}
                        >
                          {text}
                        </span>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div 
                  key={dr.id} 
                  onClick={() => {
                    setPlanningDietRecipe(dr);
                    setDietPlanDate(formatDateKey(new Date()));
                    setDietPlanMealType('lunch');
                    setDietPlanServings(dr.servings || 2.5);
                    setShowDietAvailability(false);
                  }}
                  className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-purple-100 hover:shadow-xl transition-all cursor-pointer group relative flex flex-col justify-between p-5 space-y-3"
                  title="Cliquer pour programmer au planning régime"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                        Régime
                      </span>
                      <div className="flex items-center gap-1.5">
                        {activeSearchTerms.length > 1 && (
                          <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shrink-0">
                            {countDietRecipeMatches(dr, activeSearchTerms, appliance)}/{activeSearchTerms.length} ingr.
                          </span>
                        )}
                        <span className="bg-purple-100 text-purple-800 font-black text-[10px] px-2 py-0.5 rounded-lg border border-purple-200 shrink-0">
                          👥 {currentServings === baseServings ? `${baseServings} pers.` : `${currentServings} pers.`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDietRecipe(dr);
                          }}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 rounded-lg border border-purple-200 transition-colors shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                          title="Modifier la recette régime (aliments, poids, etc.)"
                        >
                          <EXT_ICONS.Edit />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-1">{dr.name}</h3>
                    <div className="text-xs font-medium text-gray-700 bg-purple-50/40 p-3 rounded-xl border border-purple-50 mt-2.5 whitespace-pre-wrap leading-relaxed">
                      {displayIngredients || (typeof dr.ingredients === 'string' ? dr.ingredients : '') || "Aucun aliment renseigné."}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-purple-50">
                    <span className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                      <span>📅</span>
                      <span>Planifier</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDietRecipe(dr);
                      }}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline"
                    >
                      <EXT_ICONS.Edit />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalFound === 0 && activeSearchTerms.length > 0 && (
        <p className="text-center text-gray-400 italic py-6">Aucune recette ne correspond à ces ingrédients dans votre bibliothèque ou dans vos recettes régimes.</p>
      )}

      {activeSearchTerms.length === 0 && (
        <p className="text-center text-gray-400 italic py-6">Commencez à taper un ingrédient ou sélectionnez-en un pour voir les recettes correspondantes.</p>
      )}

      {/* MODAL FICHE RECETTE CLASSIQUE */}
      {viewingRecipe && (
        <RecipeDetail 
          recipe={viewingRecipe} 
          recipes={recipes} 
          mealPlan={mealPlan} 
          onClose={() => setViewingRecipe(null)} 
          onAddToShopping={onAddToShopping} 
          updateMealPlan={updateMealPlan} 
          setSentMeals={setSentMeals}
          dietRecipes={dietRecipes}
          dietItems={dietItems}
          onEdit={(r) => {
            setViewingRecipe(null);
            setEditingRecipe(r);
          }}
        />
      )}

      {/* MODAL MODIFIER RECETTE CLASSIQUE */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[40px] bg-white custom-scrollbar">
            <RecipeForm 
              initialData={editingRecipe}
              foodPortions={foodPortions}
              foodCategories={foodCategories}
              onAddFoodToSettings={(name, unit, cat) => {
                if (onAddFoodToSettings) {
                  onAddFoodToSettings(name, unit, cat);
                }
              }}
              onSave={(updated) => {
                addRecipe(updated);
                setEditingRecipe(null);
                if (viewingRecipe && viewingRecipe.id === updated.id) {
                  setViewingRecipe(updated);
                }
              }}
              onDelete={(id) => {
                if (deleteRecipe) deleteRecipe(id);
                setEditingRecipe(null);
                if (viewingRecipe && viewingRecipe.id === id) {
                  setViewingRecipe(null);
                }
              }}
              onCancel={() => setEditingRecipe(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL MODIFIER RECETTE RÉGIME */}
      {editingDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl animate-scaleUp custom-scrollbar">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                🍳
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                Modifier la recette régime
              </h3>
              <p className="text-gray-500 font-medium mb-6 text-xs sm:text-sm">
                Modifiez le nom, les aliments, quantités ou poids de votre recette.
              </p>

              <div className="space-y-5 text-left">
                {/* Champ Nom de la recette */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Nom de la recette
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Omelette espagnole légère"
                    value={editDietRecipeName}
                    onChange={(e) => setEditDietRecipeName(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Section Aliments nécessaires (Choix par catégories + poids + liste) */}
                <div className="space-y-3 bg-purple-50/40 p-4 sm:p-5 rounded-3xl border border-purple-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🥗</span> Aliments et Poids de la recette
                    </label>
                    <span className="text-[10px] font-bold text-purple-500 bg-purple-100/80 px-2 py-0.5 rounded-full">
                      {editDietRecipeItems.length} aliment(s)
                    </span>
                  </div>

                  {/* Filtre par catégorie pour la sélection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      Filtrer les suggestions :
                    </label>
                    <select
                      value={editSelectedCategory}
                      onChange={(e) => setEditSelectedCategory(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white font-bold text-gray-700 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                    >
                      <option value="Toutes">Toutes les catégories</option>
                      <option value="Protéines">Régime: Protéines 🥩</option>
                      <option value="Légumes">Régime: Légumes 🥦</option>
                      <option value="Féculents">Régime: Féculents 🥔</option>
                      <option value="Laitage">Régime: Laitage 🥛</option>
                      <option value="Desserts">Régime: Desserts 🍨</option>
                    </select>
                  </div>

                  {/* Champs sélection/saisie d'un aliment + poids + unité */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    {/* Choix ou nom de l'aliment */}
                    <div className="sm:col-span-6">
                      <input 
                        type="text"
                        list="search-edit-diet-foods-suggestions"
                        placeholder="Choisir ou taper un aliment..."
                        value={editSelectedFoodName}
                        onChange={(e) => setEditSelectedFoodName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <datalist id="search-edit-diet-foods-suggestions">
                        {filteredDietFoodSuggestions.map((item, idx) => (
                          <option key={`${item}-${idx}`} value={item} />
                        ))}
                      </datalist>
                    </div>

                    {/* Poids / Quantité */}
                    <div className="sm:col-span-3">
                      <input 
                        type="text"
                        placeholder="Poids (ex: 100)"
                        value={editSelectedFoodWeight}
                        onChange={(e) => setEditSelectedFoodWeight(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    {/* Unité */}
                    <div className="sm:col-span-3">
                      <select
                        value={editSelectedFoodUnit}
                        onChange={(e) => setEditSelectedFoodUnit(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white font-bold text-gray-800 text-xs outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                      >
                        {DIET_UNITS_LIST.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditIngredient}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>+ Ajouter cet aliment à la recette</span>
                  </button>

                  {/* Liste des aliments enregistrés dans la recette avec nom et poids */}
                  <div className="pt-2">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-2">
                      Aliments dans cette recette :
                    </p>
                    {editDietRecipeItems.length === 0 ? (
                      <div className="text-center py-4 bg-white/70 rounded-2xl border border-dashed border-purple-100 text-xs text-gray-400 italic font-medium">
                        Aucun aliment. Choisissez un aliment ci-dessus pour l'ajouter.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {editDietRecipeItems.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between shadow-xs hover:border-purple-200 transition-all"
                          >
                            {editingIngredientIdx === index ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editingIngName}
                                  onChange={(e) => setEditingIngName(e.target.value)}
                                  placeholder="Nom de l'aliment"
                                  className="flex-1 w-full sm:w-auto p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <input
                                  type="text"
                                  value={editingIngWeight}
                                  onChange={(e) => setEditingIngWeight(e.target.value)}
                                  placeholder="Poids"
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-medium text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <select
                                  value={editingIngUnit}
                                  onChange={(e) => setEditingIngUnit(e.target.value)}
                                  className="w-full sm:w-20 p-2 border border-purple-300 rounded-lg text-xs font-bold text-gray-800 bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                                >
                                  {DIET_UNITS_LIST.map(unit => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineEditIngredient(index)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                                    title="Valider"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingIngredientIdx(null)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  {(() => {
                                    const itemCat = resolveDietFoodCategory(item.name, item.category, dietItems, foodPortions);
                                    let catBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                    let dotClass = 'bg-purple-500';
                                    if (itemCat === 'Protéines') {
                                      catBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                                      dotClass = 'bg-red-500';
                                    } else if (itemCat === 'Légumes') {
                                      catBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                      dotClass = 'bg-emerald-500';
                                    } else if (itemCat === 'Féculents') {
                                      catBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                      dotClass = 'bg-amber-500';
                                    } else if (itemCat === 'Desserts') {
                                      catBadgeClass = 'bg-pink-50 text-pink-700 border-pink-200';
                                      dotClass = 'bg-pink-500';
                                    }

                                    return (
                                      <>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                        <span className="font-bold text-gray-800 text-xs truncate">
                                          {item.name}
                                        </span>
                                        {item.weight && (
                                          <span className="font-black text-purple-700 text-xs shrink-0 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                            {item.weight} {item.unit || ''}
                                          </span>
                                        )}
                                        {itemCat !== 'Autre' && (
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-block ${catBadgeClass}`}>
                                            {itemCat}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartInlineEditIngredient(index)}
                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Modifier le poids ou le nom"
                                  >
                                    <EXT_ICONS.Edit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditIngredient(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer cet aliment"
                                  >
                                    <EXT_ICONS.Trash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Nombre de personnes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1">
                    Portions de référence (Nombre de personnes)
                  </label>
                  <select
                    value={editDietRecipeServings}
                    onChange={(e) => setEditDietRecipeServings(parseFloat(e.target.value))}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all text-sm cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>
                        {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowDeleteDietConfirm(true)} 
                  className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <EXT_ICONS.Trash />
                  <span>Supprimer</span>
                </button>
                <div className="flex-1 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingDietRecipe(null)} 
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-xs sm:text-sm"
                  >
                    Annuler
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveDietRecipe} 
                    className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-200 active:scale-95 text-xs sm:text-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION RECETTE RÉGIME */}
      {showDeleteDietConfirm && editingDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[220] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h4 className="text-xl font-black text-gray-800">Supprimer cette recette régime ?</h4>
            <p className="text-gray-500 text-sm">
              Êtes-vous sûr de vouloir supprimer la recette « <strong className="text-gray-800">{editingDietRecipe.name}</strong> » ?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteDietConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Non, annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteDietRecipe}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-red-200"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFIER AU PLANNING RÉGIME DEPUIS LA RECHERCHE */}
      {planningDietRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 sm:p-7 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-purple-200 shrink-0">
                  🍳
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                    Planifier au planning régime
                  </h3>
                  <p className="text-xs font-bold text-purple-700 truncate">
                    « {planningDietRecipe.name} »
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <button 
                  type="button"
                  onClick={() => setShowDietAvailability(true)}
                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 p-3.5 rounded-2xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Voir les disponibilités de la semaine"
                >
                  <span>💗</span>
                  <span>Les disponibilités</span>
                </button>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>📅</span> Date
                </label>
                <input 
                  type="date"
                  value={dietPlanDate}
                  onChange={(e) => setDietPlanDate(e.target.value)}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>🍽️</span> Repas
                </label>
                <select
                  value={dietPlanMealType}
                  onChange={(e) => setDietPlanMealType(e.target.value as 'lunch' | 'dinner')}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  <option value="lunch">Déjeuner</option>
                  <option value="dinner">Dîner</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <span>👥</span> Nombre de personnes
                </label>
                <select
                  value={dietPlanServings}
                  onChange={(e) => setDietPlanServings(parseFloat(e.target.value))}
                  className="w-full p-3.5 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-purple-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {DIET_PERSON_OPTIONS.map(val => (
                    <option key={val} value={val}>
                      {val.toString().replace('.', ',')} pers. {val === 2.5 ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 flex gap-3 sm:gap-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setPlanningDietRecipe(null)}
                className="flex-1 p-3.5 sm:p-4 rounded-2xl font-black text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={handleProgrammerAuPlanningRegime}
                className="flex-1 bg-purple-600 text-white p-3.5 sm:p-4 rounded-2xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                Programmer au planning régime
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPONIBILITÉS DE LA SEMAINE RÉGIME */}
      {showDietAvailability && planningDietRecipe && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="p-6 md:p-7 border-b flex justify-between items-center bg-pink-50/40">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-pink-500">💗</span> Les disponibilités (Planning Régime)
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  « {planningDietRecipe.name} » • Cliquez sur un créneau pour le sélectionner
                </p>
              </div>
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg transition-all cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() - 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine précédente"
                >
                  <EXT_ICONS.ArrowLeft />
                </button>
                <span className="text-sm font-black uppercase tracking-widest text-gray-700 min-w-[220px] text-center">
                  Semaine du {dietAvailabilityWeekDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button 
                  onClick={() => {
                    const next = new Date(dietAvailabilityWeekDate);
                    next.setDate(dietAvailabilityWeekDate.getDate() + 7);
                    setDietAvailabilityWeekDate(next);
                  }}
                  className="p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-purple-600 cursor-pointer"
                  title="Semaine suivante"
                >
                  <EXT_ICONS.ArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(dietAvailabilityWeekDate);
                  d.setDate(dietAvailabilityWeekDate.getDate() + i);
                  const dateStr = formatDateKey(d);
                  const dayPlan = mealPlan[dateStr];
                  
                  return (
                    <div key={dateStr} className="bg-gray-50/80 p-3.5 rounded-[24px] border border-gray-100 space-y-2.5">
                      <div className="text-center pb-2 border-b border-gray-200/60">
                        <span className="text-xs font-black text-gray-800 uppercase block">
                          {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600">
                          {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      {/* Créneau Déjeuner */}
                      {(() => {
                        const classicLunchId = dayPlan?.lunch?.recipe1 || dayPlan?.lunch?.recipe2;
                        const classicLunch = classicLunchId ? recipes.find(r => r.id === classicLunchId) : null;
                        const hasDietLunch = !!(dayPlan?.dietLunch?.dietRecipe || dayPlan?.dietLunch?.protein || dayPlan?.dietLunch?.vegetable || dayPlan?.dietLunch?.starch || dayPlan?.dietLunch?.dairy || dayPlan?.dietLunch?.dessert);
                        const isLunchOccupied = hasDietLunch || !!classicLunchId;

                        return (
                          <button
                            onClick={() => {
                              if (isLunchOccupied) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType('lunch');
                              setShowDietAvailability(false);
                            }}
                            disabled={isLunchOccupied}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                              isLunchOccupied
                                ? 'bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-green-200 hover:bg-green-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-gray-700 uppercase">Déjeuner</span>
                              {classicLunchId ? (
                                <span className="text-[8px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded">Non disponible</span>
                              ) : hasDietLunch ? (
                                <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                              ) : (
                                <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                              {classicLunchId
                                ? `${classicLunch?.title || 'Recette classique'} (Non disponible)`
                                : dayPlan?.dietLunch?.dietRecipe
                                ? (dietRecipes.find(r => r.id === dayPlan?.dietLunch?.dietRecipe)?.name || 'Recette régime')
                                : [
                                    dayPlan?.dietLunch?.protein && (dietItems.find(x => x.id === dayPlan?.dietLunch?.protein)?.name || dayPlan?.dietLunch?.protein),
                                    dayPlan?.dietLunch?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietLunch?.vegetable)?.name || dayPlan?.dietLunch?.vegetable),
                                    dayPlan?.dietLunch?.starch && (dietItems.find(x => x.id === dayPlan?.dietLunch?.starch)?.name || dayPlan?.dietLunch?.starch),
                                    dayPlan?.dietLunch?.dairy && (dietItems.find(x => x.id === dayPlan?.dietLunch?.dairy)?.name || dayPlan?.dietLunch?.dairy),
                                    dayPlan?.dietLunch?.dessert && (dietItems.find(x => x.id === dayPlan?.dietLunch?.dessert)?.name || dayPlan?.dietLunch?.dessert)
                                  ].filter(Boolean).join(' • ') || 'Créneau vide'
                              }
                            </p>
                          </button>
                        );
                      })()}

                      {/* Créneau Dîner */}
                      {(() => {
                        const classicDinnerId = dayPlan?.dinner?.recipe1 || dayPlan?.dinner?.recipe2;
                        const classicDinner = classicDinnerId ? recipes.find(r => r.id === classicDinnerId) : null;
                        const hasDietDinner = !!(dayPlan?.dietDinner?.dietRecipe || dayPlan?.dietDinner?.protein || dayPlan?.dietDinner?.vegetable || dayPlan?.dietDinner?.starch || dayPlan?.dietDinner?.dairy || dayPlan?.dietDinner?.dessert);
                        const isDinnerOccupied = hasDietDinner || !!classicDinnerId;

                        return (
                          <button
                            onClick={() => {
                              if (isDinnerOccupied) return;
                              setDietPlanDate(dateStr);
                              setDietPlanMealType('dinner');
                              setShowDietAvailability(false);
                            }}
                            disabled={isDinnerOccupied}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                              isDinnerOccupied
                                ? 'bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-green-200 hover:bg-green-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-gray-700 uppercase">Dîner</span>
                              {classicDinnerId ? (
                                <span className="text-[8px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded">Non disponible</span>
                              ) : hasDietDinner ? (
                                <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded">Occupé</span>
                              ) : (
                                <span className="text-[8px] font-black bg-green-100 text-green-700 px-1.5 py-0.2 rounded">Libre</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-600 line-clamp-2">
                              {classicDinnerId
                                ? `${classicDinner?.title || 'Recette classique'} (Non disponible)`
                                : dayPlan?.dietDinner?.dietRecipe
                                ? (dietRecipes.find(r => r.id === dayPlan?.dietDinner?.dietRecipe)?.name || 'Recette régime')
                                : [
                                    dayPlan?.dietDinner?.protein && (dietItems.find(x => x.id === dayPlan?.dietDinner?.protein)?.name || dayPlan?.dietDinner?.protein),
                                    dayPlan?.dietDinner?.vegetable && (dietItems.find(x => x.id === dayPlan?.dietDinner?.vegetable)?.name || dayPlan?.dietDinner?.vegetable),
                                    dayPlan?.dietDinner?.starch && (dietItems.find(x => x.id === dayPlan?.dietDinner?.starch)?.name || dayPlan?.dietDinner?.starch),
                                    dayPlan?.dietDinner?.dairy && (dietItems.find(x => x.id === dayPlan?.dietDinner?.dairy)?.name || dayPlan?.dietDinner?.dairy),
                                    dayPlan?.dietDinner?.dessert && (dietItems.find(x => x.id === dayPlan?.dietDinner?.dessert)?.name || dayPlan?.dietDinner?.dessert)
                                  ].filter(Boolean).join(' • ') || 'Créneau vide'
                              }
                            </p>
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-50 border-t flex justify-end">
              <button 
                onClick={() => setShowDietAvailability(false)} 
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecurringView: React.FC<{ 
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

const Planning: React.FC<{ 
  mealPlan: Record<string, MealPlanDay>; 
  recipes: Recipe[]; 
  updateMealPlan: (d: string, t: 'lunch' | 'dinner' | 'extra', s: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', r: string | undefined, index?: number) => void;
  updateDietMealPlan: (d: string, m: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe' | 'servings', itemIdOrValue: string | number | undefined) => void;
  onMergeToShopping: (items: ShoppingListItem[]) => void;
  sentMeals: Set<string>;
  setSentMeals: React.Dispatch<React.SetStateAction<Set<string>>>;
  settings: UserSettings;
  dietItems: DietItem[];
  dietServings: number;
  setDietServings: React.Dispatch<React.SetStateAction<number>>;
  dietRecipes?: DietRecipe[];
  baseDate: Date;
  setBaseDate: React.Dispatch<React.SetStateAction<Date>>;}> = ({ mealPlan, recipes, updateMealPlan, updateDietMealPlan, onMergeToShopping, sentMeals, setSentMeals, settings, dietItems, dietServings, setDietServings, dietRecipes = [] , baseDate, setBaseDate}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [planningFilter, setPlanningFilter] = useState<'all' | 'recipes' | 'regime'>('all');
  
  // State for "Rentrer Déjeuner / Dîner" Modal
  const [showRentrerMealModal, setShowRentrerMealModal] = useState(false);
  const [rentrerMealDayKey, setRentrerMealDayKey] = useState<string | null>(null);
  const [rentrerMealType, setRentrerMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [rentrerMealServings, setRentrerMealServings] = useState<number>(2.5);
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedVegetables, setSelectedVegetables] = useState<string[]>([]);
  const [selectedStarches, setSelectedStarches] = useState<string[]>([]);
  const [selectedDairies, setSelectedDairies] = useState<string[]>([]);
  const [selectedDesserts, setSelectedDesserts] = useState<string[]>([]);

  const handleOpenRentrerMeal = (dayKey: string, mealType: 'lunch' | 'dinner') => {
    setRentrerMealDayKey(dayKey);
    setRentrerMealType(mealType);
    const dayPlan = mealPlan[dayKey] || {};
    const currentMeal = mealType === 'lunch' ? dayPlan.dietLunch || {} : dayPlan.dietDinner || {};

    const parseSlot = (val?: string) => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];

    setSelectedProteins(parseSlot(currentMeal.protein));
    setSelectedVegetables(parseSlot(currentMeal.vegetable));
    setSelectedStarches(parseSlot(currentMeal.starch));
    setSelectedDairies(parseSlot(currentMeal.dairy));
    setSelectedDesserts(parseSlot(currentMeal.dessert));
    const defaultServings = getDefaultDietServings(dayKey, mealType, settings);
    setRentrerMealServings(currentMeal.servings ?? defaultServings);
    setShowRentrerMealModal(true);
  };

  const handleRemoveDietItemDirect = (dayKey: string, mealType: 'lunch' | 'dinner', category: 'protein' | 'vegetable' | 'starch' | 'dairy' | 'dessert', itemId: string) => {
    const dayPlan = mealPlan[dayKey] || {};
    const currentMeal = mealType === 'lunch' ? dayPlan.dietLunch || {} : dayPlan.dietDinner || {};
    const currentVal = currentMeal[category] || '';
    const ids = currentVal.split(',').map(s => s.trim()).filter(Boolean);
    const newIds = ids.filter(id => id !== itemId && id.toLowerCase() !== itemId.toLowerCase());
    updateDietMealPlan(dayKey, mealType, category, newIds.length > 0 ? newIds.join(',') : undefined);
  };

  const handleSaveRentrerMeal = () => {
    if (!rentrerMealDayKey) return;
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'protein', selectedProteins.length > 0 ? selectedProteins.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'vegetable', selectedVegetables.length > 0 ? selectedVegetables.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'starch', selectedStarches.length > 0 ? selectedStarches.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'dairy', selectedDairies.length > 0 ? selectedDairies.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'dessert', selectedDesserts.length > 0 ? selectedDesserts.join(',') : undefined);
    updateDietMealPlan(rentrerMealDayKey, rentrerMealType, 'servings', rentrerMealServings);
    setShowRentrerMealModal(false);
  };

  

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
  }, [recipes]);

  const classicRecipeOptions = useMemo(() => {
    return sortedRecipes.map(r => ({
      id: r.id,
      title: r.title,
      badge: "Classique"
    }));
  }, [sortedRecipes]);

  const dietRecipeOptions = useMemo(() => {
    return (dietRecipes || []).map(dr => ({
      id: dr.id,
      title: dr.name,
      badge: "Régime"
    }));
  }, [dietRecipes]);

  // Combined options for recipe selector in unified calendar
  const allRecipeOptions = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    // Classic recipes
    sortedRecipes.forEach(r => {
      list.push({
        id: `classic:${r.id}`,
        title: `${r.title} (Classique)`
      });
    });
    // Diet recipes
    (dietRecipes || []).forEach(dr => {
      list.push({
        id: `diet:${dr.id}`,
        title: `${dr.name} (Régime)`
      });
    });
    return list;
  }, [sortedRecipes, dietRecipes]);

  const handleSelectMeal = (dateKey: string, mealType: 'lunch' | 'dinner', rawValue?: string) => {
    if (!rawValue) {
      updateMealPlan(dateKey, mealType, 'recipe1', undefined);
      updateMealPlan(dateKey, mealType, 'recipe2', undefined);
      updateDietMealPlan(dateKey, mealType, 'dietRecipe', undefined);
      updateDietMealPlan(dateKey, mealType, 'protein', undefined);
      updateDietMealPlan(dateKey, mealType, 'vegetable', undefined);
      updateDietMealPlan(dateKey, mealType, 'starch', undefined);
      updateDietMealPlan(dateKey, mealType, 'dessert', undefined);
      return;
    }

    if (rawValue.startsWith('classic:')) {
      const classicId = rawValue.replace('classic:', '');
      updateMealPlan(dateKey, mealType, 'recipe1', classicId);
    } else if (rawValue.startsWith('diet:')) {
      const dietId = rawValue.replace('diet:', '');
      updateDietMealPlan(dateKey, mealType, 'dietRecipe', dietId);
    } else {
      const isDiet = (dietRecipes || []).some(dr => dr.id === rawValue);
      if (isDiet) {
        updateDietMealPlan(dateKey, mealType, 'dietRecipe', rawValue);
      } else {
        updateMealPlan(dateKey, mealType, 'recipe1', rawValue);
      }
    }
  };

  const handleSendRecipe = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string, index?: number) => {
    const r = recipes.find(rec => rec.id === recipeId);
    if (!r) return;
    let ratio = 1;
    if (mealType === 'lunch' || mealType === 'dinner') {
      const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const dayDate = new Date(date);
      const currentServings = mealPlan[date]?.[targetKey]?.servings ?? getDefaultDietServings(dayDate, mealType, settings);
      const baseRecipeServings = r.servings || 1;
      if (baseRecipeServings > 0) {
        ratio = currentServings / baseRecipeServings;
      }
    }
    const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
      id: Math.random().toString(36).substr(2, 9),
      name: ing.name,
      amount: typeof ing.amount === 'number' ? Math.round(ing.amount * ratio * 100) / 100 : ing.amount,
      unit: ing.unit,
      checked: false
    }));
    onMergeToShopping(items);
    const mealKey = mealType === 'extra' ? `${date}-${slot}-${index}` : `${date}-${mealType}-${slot}`;
    setSentMeals(prev => new Set(prev).add(mealKey));
  };

  const handleSendDietRecipe = (date: string, mealType: 'dietLunch' | 'dietDinner', dietRecipeId: string) => {
    const dr = (dietRecipes || []).find(r => r.id === dietRecipeId);
    if (!dr) return;

    const targetKey = mealType === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(date);
    const baseServings = dr.servings || 2.5;
    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(dayDate, targetKey, settings);

    const items: ShoppingListItem[] = [];
    if (dr.items && dr.items.length > 0) {
      dr.items.forEach(item => {
        let amount = 1;
        let unit = 'g';
        if (item.weight && typeof item.weight === 'string') {
          const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
          const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
          if (match) {
            amount = parseFloat(match[1].replace(',', '.')) || 1;
            if (match[2]) unit = match[2].trim();
          } else {
            unit = item.weight.trim();
          }
        }
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          amount,
          unit,
          checked: false
        });
      });
    } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
      const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
      items.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `${dr.name} (${scaledIng})`,
        amount: 1,
        unit: 'portion',
        checked: false
      });
    } else {
      items.push({
        id: Math.random().toString(36).substr(2, 9),
        name: dr.name,
        amount: 1,
        unit: 'portion',
        checked: false
      });
    }

    if (items.length > 0) {
      onMergeToShopping(items);
      const mealKey = `${date}-${mealType}-dietRecipe`;
      setSentMeals(prev => new Set(prev).add(mealKey));
    }
  };

  const handleSendDietItem = (date: string, mealType: 'dietLunch' | 'dietDinner', slot: 'protein' | 'vegetable' | 'starch' | 'dairy' | 'dessert', itemIdString: string) => {
    if (!itemIdString) return;
    const targetKey = mealType === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(date);
    const currentServings = mealPlan[date]?.[mealType]?.servings ?? getDefaultDietServings(dayDate, targetKey, settings);

    const ids = itemIdString.split(',').map(s => s.trim()).filter(Boolean);
    const items: ShoppingListItem[] = [];

    ids.forEach(itemId => {
      const item = (dietItems || []).find(i => i.id === itemId || i.name.toLowerCase() === itemId.toLowerCase());
      if (item) {
        let amount = 1;
        let unit = 'g';
        if (item.weight) {
          const scaledStr = formatScaledWeight(item.weight, currentServings, 2.5);
          const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
          if (match) {
            amount = parseFloat(match[1].replace(',', '.')) || 1;
            if (match[2]) unit = match[2].trim();
          } else {
            unit = item.weight.trim();
          }
        }
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          amount,
          unit,
          checked: false
        });
      } else {
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          name: itemId,
          amount: 1,
          unit: 'portion',
          checked: false
        });
      }
    });

    if (items.length > 0) {
      onMergeToShopping(items);
      const mealKey = `${date}-${mealType}-${slot}`;
      setSentMeals(prev => new Set(prev).add(mealKey));
    }
  };

  const isDietMealSent = (date: string, mealType: 'dietLunch' | 'dietDinner') => {
    const wholeKey = `${date}-${mealType}`;
    if (sentMeals.has(wholeKey)) return true;
    const plan = mealPlan[date]?.[mealType];
    if (!plan) return false;
    if (plan.dietRecipe) {
      return sentMeals.has(`${date}-${mealType}-dietRecipe`);
    }
    const slots = (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).filter(s => !!plan[s]);
    if (slots.length === 0) return false;
    return slots.every(s => sentMeals.has(`${date}-${mealType}-${s}`));
  };

  const handleSendWeekToShopping = () => {
    let allItems: ShoppingListItem[] = [];
    const newSentMeals = new Set(sentMeals);
    let addedCount = 0;

    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key] || {};

      // 1. Recettes Classiques
      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;
        const targetKey = type === 'lunch' ? 'dietLunch' : 'dietDinner';
        const currentServings = plan[targetKey]?.servings ?? getDefaultDietServings(d, type, settings);
        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) {
            const r = recipes.find(rec => rec.id === recipeId);
            if (r) {
              const baseRecipeServings = r.servings || 1;
              const ratio = baseRecipeServings > 0 ? currentServings / baseRecipeServings : 1;
              const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ing.name,
                amount: typeof ing.amount === 'number' ? Math.round(ing.amount * ratio * 100) / 100 : ing.amount,
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

      // 2. Régime - Déjeuner
      const dietLunch = plan.dietLunch;
      if (dietLunch) {
        const lunchServings = dietLunch.servings ?? getDefaultDietServings(d, 'lunch', settings);
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          const slotVal = dietLunch[slot];
          const mealKey = `${key}-dietLunch-${slot}`;
          if (slotVal && !sentMeals.has(mealKey)) {
            const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
            ids.forEach(id => {
              const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
              if (item) {
                let amount = 1;
                let unit = 'g';
                if (item.weight) {
                  const scaledStr = formatScaledWeight(item.weight, lunchServings, 2.5);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
                addedCount++;
              } else {
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: id,
                  amount: 1,
                  unit: 'portion',
                  checked: false
                });
                addedCount++;
              }
            });
            newSentMeals.add(mealKey);
          }
        });

        if (dietLunch.dietRecipe && !sentMeals.has(`${key}-dietLunch-dietRecipe`)) {
          const dr = (dietRecipes || []).find(r => r.id === dietLunch.dietRecipe);
          if (dr) {
            const baseServings = dr.servings || 2.5;
            const currentServings = lunchServings;
            if (dr.items && dr.items.length > 0) {
              dr.items.forEach(item => {
                let amount = 1;
                let unit = 'g';
                if (item.weight && typeof item.weight === 'string') {
                  const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
              });
            } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
              const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: `${dr.name} (${scaledIng})`,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            } else {
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: dr.name,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            }
            newSentMeals.add(`${key}-dietLunch-dietRecipe`);
            addedCount++;
          }
        }
      }

      // 3. Régime - Dîner
      const dietDinner = plan.dietDinner;
      if (dietDinner) {
        const dinnerServings = dietDinner.servings ?? getDefaultDietServings(d, 'dinner', settings);
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          const slotVal = dietDinner[slot];
          const mealKey = `${key}-dietDinner-${slot}`;
          if (slotVal && !sentMeals.has(mealKey)) {
            const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
            ids.forEach(id => {
              const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
              if (item) {
                let amount = 1;
                let unit = 'g';
                if (item.weight) {
                  const scaledStr = formatScaledWeight(item.weight, dinnerServings, 2.5);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
                addedCount++;
              } else {
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: id,
                  amount: 1,
                  unit: 'portion',
                  checked: false
                });
                addedCount++;
              }
            });
            newSentMeals.add(mealKey);
          }
        });

        if (dietDinner.dietRecipe && !sentMeals.has(`${key}-dietDinner-dietRecipe`)) {
          const dr = (dietRecipes || []).find(r => r.id === dietDinner.dietRecipe);
          if (dr) {
            const baseServings = dr.servings || 2.5;
            const currentServings = dinnerServings;
            if (dr.items && dr.items.length > 0) {
              dr.items.forEach(item => {
                let amount = 1;
                let unit = 'g';
                if (item.weight && typeof item.weight === 'string') {
                  const scaledStr = scaleTextQuantity(item.weight, currentServings, baseServings);
                  const match = scaledStr.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
                  if (match) {
                    amount = parseFloat(match[1].replace(',', '.')) || 1;
                    if (match[2]) unit = match[2].trim();
                  } else {
                    unit = item.weight.trim();
                  }
                }
                allItems.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: item.name,
                  amount,
                  unit,
                  checked: false
                });
              });
            } else if (dr.ingredients && typeof dr.ingredients === 'string' && dr.ingredients.trim()) {
              const scaledIng = scaleTextQuantity(dr.ingredients, currentServings, baseServings);
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: `${dr.name} (${scaledIng})`,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            } else {
              allItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: dr.name,
                amount: 1,
                unit: 'portion',
                checked: false
              });
            }
            newSentMeals.add(`${key}-dietDinner-dietRecipe`);
            addedCount++;
          }
        }
      }

      // 4. Extras
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) {
              const r = recipes.find(rec => rec.id === recipeId);
              if (r) {
                const items: ShoppingListItem[] = (r.ingredients || []).map(ing => ({
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

    if (allItems.length > 0) {
      onMergeToShopping(allItems);
      setSentMeals(newSentMeals);
      alert(`🛒 ${addedCount} repas/éléments de la semaine envoyés aux courses avec succès !`);
    } else {
      alert("Tous les repas de cette semaine sont déjà envoyés aux courses ou aucun repas n'est planifié.");
    }
  };

  const unsentCount = useMemo(() => {
    let count = 0;
    days.forEach(d => {
      const key = formatDateKey(d);
      const plan = mealPlan[key];
      if (!plan) return;

      // Recettes Classiques
      (['lunch', 'dinner'] as const).forEach(type => {
        const meal = plan[type];
        if (!meal) return;
        (['recipe1', 'recipe2'] as const).forEach(slot => {
          const recipeId = meal[slot];
          if (recipeId && !sentMeals.has(`${key}-${type}-${slot}`)) count++;
        });
      });

      // Régime
      const dietLunch = plan.dietLunch;
      if (dietLunch) {
        if (dietLunch.dietRecipe && !sentMeals.has(`${key}-dietLunch-dietRecipe`)) count++;
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          if (dietLunch[slot] && !sentMeals.has(`${key}-dietLunch-${slot}`)) count++;
        });
      }
      const dietDinner = plan.dietDinner;
      if (dietDinner) {
        if (dietDinner.dietRecipe && !sentMeals.has(`${key}-dietDinner-dietRecipe`)) count++;
        (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
          if (dietDinner[slot] && !sentMeals.has(`${key}-dietDinner-${slot}`)) count++;
        });
      }

      // Extras
      if (d.getDay() === 0) {
        (['viennoiseries', 'sauces'] as const).forEach(slot => {
          const recipeIds = plan[slot] || [];
          recipeIds.forEach((recipeId, index) => {
            if (recipeId && !sentMeals.has(`${key}-${slot}-${index}`)) count++;
          });
        });
      }
    });
    return count;
  }, [days, mealPlan, sentMeals]);

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

  const handleSendAll = () => {
    handleSendWeekToShopping();
    setShowSummary(false);
  };

  const getCategorySortOrder = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return 1;
    if (c.includes("légume") || c.includes("vegetable")) return 2;
    if (c.includes("féculent") || c.includes("starch")) return 3;
    if (c.includes("laitage") || c.includes("dairy")) return 4;
    if (c.includes("dessert") || c.includes("déssert")) return 5;
    return 6;
  };

  const getDietItemsSummary = (dayKey: string, targetKey: 'dietLunch' | 'dietDinner') => {
    const plan = mealPlan[dayKey]?.[targetKey];
    if (!plan) return [];
    const mealType = targetKey === 'dietLunch' ? 'lunch' : 'dinner';
    const dayDate = new Date(dayKey);
    const currentServings = plan.servings ?? getDefaultDietServings(dayDate, mealType, settings);

    const result: { category: string; text: string; id: string }[] = [];

    (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
      const slotVal = plan[slot];
      if (!slotVal) return;
      const ids = slotVal.split(',').map(s => s.trim()).filter(Boolean);
      ids.forEach(id => {
        const item = (dietItems || []).find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
        const name = item ? item.name : id;
        const scaledWeight = item?.weight ? formatScaledWeight(item.weight, currentServings, 2.5) : '';
        result.push({
          category: slot,
          text: `${name}${scaledWeight ? ` (${scaledWeight})` : ''}`,
          id: item ? item.id : id
        });
      });
    });

    return result.sort((a, b) => getCategorySortOrder(a.category) - getCategorySortOrder(b.category));
  };

  const getCategoryBadgeClass = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (c.includes("légume") || c.includes("vegetable")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (c.includes("féculent") || c.includes("starch")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (c.includes("laitage") || c.includes("dairy")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (c.includes("dessert") || c.includes("déssert")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  const getCategoryIcon = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("protéine") || c.includes("protein")) return "🥩";
    if (c.includes("légume") || c.includes("vegetable")) return "🥦";
    if (c.includes("féculent") || c.includes("starch")) return "🍚";
    if (c.includes("laitage") || c.includes("dairy")) return "🥛";
    if (c.includes("dessert") || c.includes("déssert")) return "🍎";
    return "🥗";
  };

  const resolveDietCategory = (name: string, itemCat?: string): string => {
    if (itemCat) {
      const c = itemCat.toLowerCase();
      if (c.includes("protéine") || c.includes("protein")) return "Protéines";
      if (c.includes("légume") || c.includes("vegetable")) return "Légumes";
      if (c.includes("féculent") || c.includes("starch")) return "Féculents";
      if (c.includes("dessert") || c.includes("déssert")) return "Desserts";
    }
    if (!name) return "Protéines";
    const n = name.toLowerCase();
    const matched = (dietItems || []).find(di => di.name.toLowerCase() === n || n.includes(di.name.toLowerCase()));
    if (matched?.category) {
      return matched.category;
    }
    if (/poulet|boeuf|bœuf|poisson|oeuf|œuf|steak|saumon|thon|jambon|dinde|veau|porc|crevette|viande|protein|protéine|tofu|seitan|colin|cabillaud|canard/.test(n)) return "Protéines";
    if (/courgette|carotte|salade|tomate|haricot|légume|legume|vegetable|épinard|epinard|brocoli|concombre|poivron|champignon|chou|aubergine|asperge|radis|poireau|céleri/.test(n)) return "Légumes";
    if (/riz|pâte|pate|pomme de terre|féculent|feculent|starch|pain|semoule|quinoa|lentille|mais|maïs|patate|boulgour|avoine|ble|blé/.test(n)) return "Féculents";
    if (/yaourt|fruit|compote|dessert|pomme|banane|chocolat|fromage blanc|fraise|gâteau|gateau|orange|poire|pêche|peche|kiwi|citron|laitage/.test(n)) return "Desserts";
    return "Protéines";
  };

  const getDietRecipeCategoryItems = (dr: DietRecipe, currentServings?: number) => {
    const list: { name: string; weight: string; category: string }[] = [];
    const baseServings = dr.servings || 2.5;
    if (dr.items && dr.items.length > 0) {
      dr.items.forEach(item => {
        const cat = resolveDietCategory(item.name, item.category);
        const scaledWeight = (item.weight && currentServings) 
          ? formatScaledWeight(item.weight, currentServings, baseServings)
          : (item.weight || "");
        list.push({
          name: item.name,
          weight: scaledWeight,
          category: cat
        });
      });
    } else if (dr.ingredients && typeof dr.ingredients === "string") {
      const parts = dr.ingredients.split(/[\+\,]/).map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        const cat = resolveDietCategory(part);
        list.push({
          name: part,
          weight: "",
          category: cat
        });
      });
    }
    return list.sort((a, b) => getCategorySortOrder(a.category) - getCategorySortOrder(b.category));
  };

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      <header className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-violet-50 p-2 rounded-2xl border border-violet-100 shadow-xs">
              <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600 cursor-pointer">
                <EXT_ICONS.ArrowLeft />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-violet-700 min-w-[180px] text-center">
                {formatWeekRange(baseDate)}
              </span>
              <button onClick={() => changeWeek(1)} className="p-2 hover:bg-violet-100 rounded-xl transition-all text-violet-600 cursor-pointer">
                <EXT_ICONS.ArrowRight />
              </button>
            </div>
            {unsentCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-black px-3 py-2 rounded-full shadow-md animate-pulse">
                {unsentCount}
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Mon Planning</h2>
          <p className="font-bold text-purple-500 text-xs uppercase tracking-wider">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* SÉLECTEUR DE FILTRE RAPIDE */}
          <div className="flex justify-center pt-1">
            <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 border border-gray-200/90 shadow-inner w-full max-w-xs">
              <button
                onClick={() => setPlanningFilter('all')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'all'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>📅</span>
                <span>Tous</span>
              </button>
              <button
                onClick={() => setPlanningFilter('recipes')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'recipes'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <EXT_ICONS.Book />
                <span>Classiques</span>
              </button>
              <button
                onClick={() => setPlanningFilter('regime')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  planningFilter === 'regime'
                    ? 'bg-white text-purple-700 shadow-xs scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>🥗</span>
                <span>Régime</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <button 
            onClick={handleSendWeekToShopping}
            className="bg-purple-600 text-white py-3.5 px-4 rounded-2xl font-black shadow-md shadow-purple-100 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 text-xs cursor-pointer"
          >
            <EXT_ICONS.Cart />
            <span>Tout envoyer</span>
          </button>
          <button 
            onClick={() => setShowSummary(true)} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 px-4 rounded-2xl font-black border border-gray-200 transition-all flex items-center gap-2 active:scale-95 text-xs cursor-pointer"
          >
            <span>📋 Résumé</span>
          </button>
        </div>
      </header>

      {/* CALENDRIER HEBDOMADAIRE UNIFIÉ */}
      <div className="space-y-4">
        {days.map(d => {
          const key = formatDateKey(d);
          const dayPlan = mealPlan[key] || {};

          // Check for meals in each slot
          const renderMealSlot = (mealType: 'lunch' | 'dinner', mealLabel: string, icon: string) => {
            const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
            const classicId = dayPlan[mealType]?.recipe1 || dayPlan[mealType]?.recipe2;
            const classicRecipe = classicId ? recipes.find(r => r.id === classicId) : null;
            const isClassicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;

            const dietRecipeId = dayPlan[targetDietKey]?.dietRecipe;
            const dietRecipe = dietRecipeId ? (dietRecipes || []).find(r => r.id === dietRecipeId) : null;
            const isDietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;

            const dietSummary = getDietItemsSummary(key, targetDietKey);
            const isDietComposedSent = isDietMealSent(key, targetDietKey);

            const dietServingsVal = dayPlan[targetDietKey]?.servings ?? getDefaultDietServings(d, mealType, settings);

            const hasAnyMeal = !!classicId || !!dietRecipeId || dietSummary.length > 0;

            // Filter check
            if (planningFilter === 'recipes' && !classicId && (dietRecipeId || dietSummary.length > 0)) {
              return (
                <div className="opacity-40 p-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                  {icon} {mealLabel} : Repas Régime planifié
                </div>
              );
            }
            if (planningFilter === 'regime' && classicId) {
              return (
                <div className="opacity-40 p-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                  {icon} {mealLabel} : Recette Classique planifiée
                </div>
              );
            }

            const dietRecipeCategoryItems = dietRecipe ? getDietRecipeCategoryItems(dietRecipe, dietServingsVal) : [];

            const isSlotSentLocal = (() => {
              if (!hasAnyMeal) return false;
              const classicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;
              const dietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;
              const dietComposedSent = dietSummary.length > 0 ? isDietMealSent(key, targetDietKey) : false;
              
              let allSent = true;
              if (classicId && !classicSent) allSent = false;
              if (dietRecipeId && !dietRecipeSent) allSent = false;
              if (dietSummary.length > 0 && !dietComposedSent) allSent = false;
              
              return allSent;
            })();

            const slotBgClass = !hasAnyMeal
              ? 'bg-white border-gray-100'
              : isSlotSentLocal
                ? 'bg-green-50/70 border-green-200'
                : 'bg-purple-50/50 border-purple-200';

            return (
              <div className={`space-y-3 p-3.5 rounded-2xl border transition-all ${slotBgClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{icon}</span> <span>{mealLabel}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* SÉLECTEUR DE NOMBRE DE PERSONNES POUR CE REPAS */}
                    {(() => {
                      const badgeColor = getDietBadgeColor(d, mealType, settings);
                      return (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border shadow-2xs text-xs font-black transition-colors duration-300 ${badgeColor.bg} ${badgeColor.border} ${badgeColor.text}`} title="Nombre de personnes pour ce repas">
                          <span className="text-xs">👥</span>
                          <select
                            value={dietServingsVal}
                            onChange={e => updateDietMealPlan(key, mealType, 'servings', parseFloat(e.target.value))}
                            className={`bg-transparent font-black text-xs outline-none cursor-pointer ${badgeColor.text}`}
                          >
                            {DIET_PERSON_OPTIONS.map(val => (
                              <option key={val} value={val}>
                                {val.toString().replace('.', ',')} pers.
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {hasAnyMeal && (
                      <button
                        type="button"
                        onClick={() => handleSelectMeal(key, mealType, undefined)}
                        className="text-gray-400 hover:text-red-500 font-bold text-[11px] px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                        title="Vider ce repas"
                      >
                        <span>✕</span> <span>Vider</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CHAMPS DE SÉLECTION & BOUTON RENTRER ALIMENTS */}
                <div className="space-y-2">
                  {/* LIGNE 1 : CHAMP LISTE RECETTES RÉGIME */}
                  <div>
                    <SearchableSelect
                      options={dietRecipeOptions}
                      value={dietRecipeId}
                      onChange={val => {
                        if (!val) {
                          updateDietMealPlan(key, mealType, 'dietRecipe', undefined);
                        } else {
                          updateDietMealPlan(key, mealType, 'dietRecipe', val);
                        }
                      }}
                      placeholder="Recette régime..."
                      buttonClassName={dietRecipeId ? "bg-purple-50 border-purple-200 text-purple-900 font-black text-sm py-3 px-4 h-11 flex items-center justify-between" : "bg-white border-gray-200 text-gray-600 text-sm py-3 px-4 h-11 flex items-center justify-between"}
                    />
                  </div>

                  {/* LIGNE 2 : CHAMP LISTE RECETTES CLASSIQUE */}
                  <div>
                    <SearchableSelect
                      options={classicRecipeOptions}
                      value={classicId}
                      onChange={val => {
                        if (!val) {
                          updateMealPlan(key, mealType, 'recipe1', undefined);
                          updateMealPlan(key, mealType, 'recipe2', undefined);
                        } else {
                          updateMealPlan(key, mealType, 'recipe1', val);
                        }
                      }}
                      placeholder="Recette classique..."
                      buttonClassName={classicId ? "bg-blue-50 border-blue-200 text-blue-900 font-black text-sm py-3 px-4 h-11 flex items-center justify-between" : "bg-white border-gray-200 text-gray-600 text-sm py-3 px-4 h-11 flex items-center justify-between"}
                    />
                  </div>

                  {/* LIGNE 3 : BOUTON 🥗 + Rentrer Aliments Régime */}
                  <button
                    type="button"
                    onClick={() => handleOpenRentrerMeal(key, mealType)}
                    className="w-full text-xs font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 py-2 px-3 rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <span>🥗</span>
                    <span>+ Rentrer Aliments Régime</span>
                  </button>
                </div>

                {/* AFFICHAGE RECETTE CLASSIQUE SÉLECTIONNÉE */}
                {classicId && (
                  <div className={`p-3 rounded-2xl border transition-all ${isClassicSent ? 'bg-green-50/70 border-green-200' : 'bg-blue-50/50 border-blue-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>📖</span> <span>{classicRecipe?.title || 'Recette Classique'}</span>
                          <span className="text-[10px] text-blue-700 font-bold">({dietServingsVal.toString().replace('.', ',')} pers.)</span>
                        </span>
                        {isClassicSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                      </div>
                      {!isClassicSent && (
                        <button
                          type="button"
                          onClick={() => handleSendRecipe(key, mealType, 'recipe1', classicId)}
                          className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <EXT_ICONS.Cart />
                          <span>Envoyer</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* AFFICHAGE RECETTE RÉGIME SÉLECTIONNÉE & ALIMENTS AVEC COULEURS DE CATÉGORIES */}
                {dietRecipeId && dietRecipe && (
                  <div className={`p-3 rounded-2xl border transition-all ${isDietRecipeSent ? 'bg-green-50/70 border-green-200' : 'bg-purple-50/50 border-purple-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>🥗</span> <span>Recette Régime : {dietRecipe.name}</span>
                          <span className="text-[10px] text-purple-700 font-bold">({dietServingsVal.toString().replace('.', ',')} pers.)</span>
                        </span>
                        {isDietRecipeSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                      </div>
                      {!isDietRecipeSent && (
                        <button
                          type="button"
                          onClick={() => handleSendDietRecipe(key, targetDietKey, dietRecipeId)}
                          className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <EXT_ICONS.Cart />
                          <span>Envoyer</span>
                        </button>
                      )}
                    </div>

                    {/* ALIMENTS DE LA RECETTE RÉGIME AVEC LEURS COULEURS DE CATÉGORIES */}
                    {dietRecipeCategoryItems.length > 0 && (
                      <div className="bg-white/90 border border-purple-100 rounded-xl p-2 flex flex-wrap gap-1.5">
                        {dietRecipeCategoryItems.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 ${getCategoryBadgeClass(item.category)}`}
                          >
                            <span>{getCategoryIcon(item.category)}</span>
                            <span>{item.name}{item.weight ? ` (${item.weight})` : ''}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AFFICHAGE ALIMENTS RÉGIME COMPOSÉS SELECTIONNÉS (MENU RÉGIME) AVEC LEURS COULEURS DE CATÉGORIES */}
                {dietSummary.length > 0 && (
                  <div className={`p-3 rounded-2xl border transition-all ${isDietComposedSent ? 'bg-green-50/70 border-green-200' : 'bg-pink-50/50 border-pink-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-pink-800 bg-pink-100 border border-pink-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>🥗</span> <span>Aliments Régime</span>
                        </span>
                        {isDietComposedSent && (
                          <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <EXT_ICONS.Check /> <span>Envoyé</span>
                          </span>
                        )}
                        {(() => {
                          const badgeColor = getDietBadgeColor(d, mealType, settings);
                          return (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-colors duration-300 ${badgeColor.bg} ${badgeColor.border} ${badgeColor.text}`}>
                              <span>👥</span>
                              <select
                                value={dietServingsVal}
                                onChange={e => updateDietMealPlan(key, mealType, 'servings', parseFloat(e.target.value))}
                                className={`bg-transparent font-black text-[10px] outline-none cursor-pointer ${badgeColor.text}`}
                              >
                                {DIET_PERSON_OPTIONS.map(val => (
                                  <option key={val} value={val}>{val.toString().replace('.', ',')} pers.</option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-1">
                        {!isDietComposedSent && (
                          <button
                            type="button"
                            onClick={() => {
                              (['protein', 'vegetable', 'starch', 'dairy', 'dessert'] as const).forEach(slot => {
                                if (dayPlan[targetDietKey]?.[slot]) {
                                  handleSendDietItem(key, targetDietKey, slot, dayPlan[targetDietKey]![slot]!);
                                }
                              });
                            }}
                            className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <EXT_ICONS.Cart />
                            <span>Envoyer</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ALIMENTS COMPOSÉS AVEC COULEURS DE CATÉGORIES */}
                    <div className="bg-white/90 border border-pink-100 rounded-xl p-2 flex flex-wrap gap-1.5">
                      {dietSummary.map((itemObj, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 ${getCategoryBadgeClass(itemObj.category)}`}
                        >
                          <span>{getCategoryIcon(itemObj.category)}</span>
                          <span>{itemObj.text}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDietItemDirect(key, mealType, itemObj.category as any, itemObj.id)}
                            className="text-gray-400 hover:text-red-600 font-black text-[9px] cursor-pointer ml-0.5"
                            title="Retirer cet aliment"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          };

          const isSlotSent = (mealType: 'lunch' | 'dinner') => {
            const targetDietKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
            const classicId = dayPlan[mealType]?.recipe1 || dayPlan[mealType]?.recipe2;
            const dietRecipeId = dayPlan[targetDietKey]?.dietRecipe;
            const dietSummary = getDietItemsSummary(key, targetDietKey);
            
            const classicSent = classicId ? (sentMeals.has(`${key}-${mealType}-recipe1`) || sentMeals.has(`${key}-${mealType}-recipe2`)) : false;
            const dietRecipeSent = dietRecipeId ? sentMeals.has(`${key}-${targetDietKey}-dietRecipe`) : false;
            const dietComposedSent = dietSummary.length > 0 ? isDietMealSent(key, targetDietKey) : false;
            
            const hasPlanned = !!classicId || !!dietRecipeId || dietSummary.length > 0;
            if (!hasPlanned) return false;
            
            let allSent = true;
            if (classicId && !classicSent) allSent = false;
            if (dietRecipeId && !dietRecipeSent) allSent = false;
            if (dietSummary.length > 0 && !dietComposedSent) allSent = false;
            
            return allSent;
          };

          const isLunchSent = isSlotSent('lunch');
          const isDinnerSent = isSlotSent('dinner');

          return (
            <div key={key} className="bg-white p-4 sm:p-5 border rounded-[28px] shadow-xs hover:shadow-md transition-all border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
              <div className="md:w-28 h-14 md:h-auto md:self-stretch shrink-0 flex flex-col justify-center border border-gray-100 pb-0 pr-0 relative overflow-hidden rounded-xl md:border-y-0 md:border-l-0 md:border-r z-0">
                {/* Partie haute (Déjeuner) en vert */}
                <div className={`absolute top-0 left-0 right-0 h-1/2 z-0 transition-all duration-300 ${isLunchSent ? 'bg-green-100/70 border-b border-green-200/40' : 'bg-transparent'}`} />
                {/* Partie basse (Dîner) en vert */}
                <div className={`absolute bottom-0 left-0 right-0 h-1/2 z-0 transition-all duration-300 ${isDinnerSent ? 'bg-green-100/70' : 'bg-transparent'}`} />
                
                <div className="relative z-10 flex flex-col justify-center items-center md:items-start text-center md:text-left px-2.5">
                  <span className={`font-black text-xs uppercase tracking-wider leading-tight transition-colors duration-300 ${isLunchSent || isDinnerSent ? 'text-green-800' : 'text-purple-700'}`}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 leading-tight transition-colors duration-300 ${isLunchSent || isDinnerSent ? 'text-green-600/90' : 'text-gray-400'}`}>
                    {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {renderMealSlot('lunch', 'Déjeuner', '☀️')}
              </div>
              <div className="flex-1 min-w-0">
                {renderMealSlot('dinner', 'Dîner', '🌙')}
              </div>
            </div>
          );
        })}
      </div>

      {/* EXTRAS DIMANCHE */}
      {(() => {
        const sunday = days.find(d => d.getDay() === 0);
        if (!sunday) return null;
        const key = formatDateKey(sunday);
        const dayPlan = mealPlan[key] || {};

        return (
          <div className="bg-white p-6 border rounded-[32px] shadow-xs border-gray-100 space-y-6">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>🧁</span>
              <span>Extras du Dimanche (Viennoiseries, Sauces & Coulis)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIENNOISERIES */}
              <div className="space-y-3 bg-amber-50/40 p-5 rounded-2xl border border-amber-100">
                <label className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🥐</span> <span>Viennoiseries & Gâteaux</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(idx => {
                    const recipeId = dayPlan.viennoiseries?.[idx];
                    const isSent = recipeId ? sentMeals.has(`${key}-viennoiseries-${idx}`) : false;

                    return (
                      <div key={idx} className="space-y-1 bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-amber-700 uppercase">Slot {idx + 1}</span>
                          {isSent && (
                            <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <EXT_ICONS.Check /> Courses
                            </span>
                          )}
                        </div>
                        <SearchableSelect
                          options={sortedRecipes.filter(r => r.category === 'Viennoiserie' || r.category === 'Gâteaux').map(r => ({ id: r.id, title: r.title }))}
                          value={recipeId}
                          onChange={val => updateMealPlan(key, 'extra', 'viennoiseries', val, idx)}
                          placeholder="Choisir..."
                        />
                        {recipeId && !isSent && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendRecipe(key, 'extra', 'viennoiseries', recipeId, idx)}
                              className="text-[9px] font-black text-amber-800 hover:text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <EXT_ICONS.Cart /> <span>Envoyer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAUCES & COULIS */}
              <div className="space-y-3 bg-red-50/40 p-5 rounded-2xl border border-red-100">
                <label className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🥫</span> <span>Sauces & Coulis</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(idx => {
                    const recipeId = dayPlan.sauces?.[idx];
                    const isSent = recipeId ? sentMeals.has(`${key}-sauces-${idx}`) : false;

                    return (
                      <div key={idx} className="space-y-1 bg-white p-3 rounded-xl border border-red-200/60 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-red-700 uppercase">Slot {idx + 1}</span>
                          {isSent && (
                            <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <EXT_ICONS.Check /> Courses
                            </span>
                          )}
                        </div>
                        <SearchableSelect
                          options={sortedRecipes.filter(r => r.category === 'Sauce' || r.category === 'Coulis').map(r => ({ id: r.id, title: r.title }))}
                          value={recipeId}
                          onChange={val => updateMealPlan(key, 'extra', 'sauces', val, idx)}
                          placeholder="Choisir..."
                        />
                        {recipeId && !isSent && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendRecipe(key, 'extra', 'sauces', recipeId, idx)}
                              className="text-[9px] font-black text-red-800 hover:text-red-950 bg-red-100/70 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <EXT_ICONS.Cart /> <span>Envoyer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL "RENTRER DÉJEUNER / DÎNER" (ALIMENTS RÉGIME COMPOSÉS) */}
      {showRentrerMealModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[40px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-purple-50/40">
              <div>
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span>🥗</span>
                  <span>{rentrerMealType === 'lunch' ? 'Composer le Déjeuner' : 'Composer le Dîner'}</span>
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  {rentrerMealDayKey && new Date(rentrerMealDayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-2xl border border-purple-200 shadow-2xs">
                  <span className="text-xs font-black text-purple-700">Portions :</span>
                  <select
                    value={rentrerMealServings}
                    onChange={e => setRentrerMealServings(parseFloat(e.target.value))}
                    className="bg-transparent font-black text-sm text-purple-900 outline-none cursor-pointer"
                  >
                    {DIET_PERSON_OPTIONS.map(val => (
                      <option key={val} value={val}>{val.toString().replace('.', ',')} pers.</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowRentrerMealModal(false)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-500 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* PROTÉINES */}
                <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-xs font-black text-rose-800 uppercase tracking-widest">🥩 Protéines</span>
                    <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-full">{selectedProteins.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Protéines' || i.category === 'Viandes' || i.category === 'Poissons').map(item => {
                      const isChecked = selectedProteins.includes(item.id) || selectedProteins.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedProteins(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-rose-600 text-white border-rose-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-rose-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-rose-100' : 'text-rose-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LÉGUMES */}
                <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">🥦 Légumes</span>
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full">{selectedVegetables.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Légumes' || i.category === 'Crudités').map(item => {
                      const isChecked = selectedVegetables.includes(item.id) || selectedVegetables.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedVegetables(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-emerald-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-emerald-100' : 'text-emerald-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FÉCULENTS */}
                <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">🍚 Féculents</span>
                    <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-full">{selectedStarches.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Féculents' || i.category === 'Pains et Céréales').map(item => {
                      const isChecked = selectedStarches.includes(item.id) || selectedStarches.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedStarches(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-amber-600 text-white border-amber-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-amber-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-amber-100' : 'text-amber-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LAITAGE */}
                <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="text-xs font-black text-blue-800 uppercase tracking-widest">🥛 Laitage</span>
                    <span className="text-[10px] font-black bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded-full">{selectedDairies.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {(dietItems || []).filter(i => i.category === 'Laitage' || i.category === 'Laitages' || i.category === 'Produits Laitiers').map(item => {
                      const isChecked = selectedDairies.includes(item.id) || selectedDairies.includes(item.name);
                      const scaledWeight = formatScaledWeight(item.weight, rentrerMealServings, 2.5);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedDairies(prev => 
                              isChecked ? prev.filter(x => x !== item.id && x !== item.name) : [...prev, item.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked ? 'bg-blue-600 text-white border-blue-700 shadow-2xs' : 'bg-white text-gray-700 border-gray-100 hover:bg-blue-50'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {scaledWeight && <span className={`text-[10px] font-black shrink-0 ${isChecked ? 'text-blue-100' : 'text-blue-600'}`}>{scaledWeight}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DESSERTS */}
                <div className="bg-purple-50/40 border border-purple-100 p-4 roundex��ko$I� ���Wnc�9��|֋U��Ś�n��d�,�����A2�"3r""�h6� }���.���t��f!�)��+ܷ#����	2��3"�du��v�P��𧹹�������t��b
��yo���	q����Ҩ(^E��I�0��HRƣ�7��e����E�����4��� ˇq�;?&�|�ƽŅ29�-y[�v�c��2>+{g9��e� ��	M��=�ꦓI��"&eߓ�Q�4�E�Z������ȳ�(�,�c峴���09���>8-/A�vO&g���]29�-��H�M��x�;��ik����xP�Cѝ~�����p��ԛ̆�;l|���{�VHv�iv
�Ѵ�� &(��A���A��I�[L�E{����/������&)Ls;!O�H�De|����ɓ'dNi3����$������GѤ�脵_x�D� %I���x�>�'�i2�S�zZW?v�՚\c a�Qe�� J����踄f�|�;Z"����VD�/�(݉�@ȢK��w���q9�Ǥ�~0-�l�N������eE��|êkU���i2x��ݩ��q�c�=��,YY�h���`�ggX���4�"?���@�����~���"�~e��9��
rj�]�;���Lzj�	�� �KbR�,"iI�d�^%Q$�dt0͋�g��ϟVO��9E��	Zuz�Y�>|,��!P��3X���$�I��9����w���HbVU3w檀�.]?b�K�����T�	TT<�*d�+�x ��q���� ��u���� �s0�5�e��00ϳ�L �/;�*<ě�I�If��}&�{5JG�1�(��V���2w�"~դ���֛<+�d\������e�">��� ��d�)�|p�(�(ɓf9��f���T$�\�2�J5@�L2dC�ů�lZ��Շ�����8�t��y���(�S�l���Y؂�>�N�#�
��}�E�]g�z8�2�2Hc�;��-�*'��R�Ҥ$����Iz+W��U�g�Of���i��M�(G�a�D'��z�>����<�|n4tx��ہ��8����DҘlǓ�h�0�
&�������������_���ow޾���<��!ۛo�w�y�Nv6_�o��$?�p�( �w��Q�9�G%�:+29�2.�+~
,sia'�B{��
�w�gH���0��F��	�5��	�q�0�[cc��]��J���
e�\B���)��
'U;��d8D����Y�7P{N��eO�v�o'�q9��掠��΀�.9�/{��C���6bSr���l�R��ڏ7�z�˭�ׯv�Q^�yO*�l
���>�aL҈�ģ(�~i����r�y,�6AWMX�gr��,F|
S᪷��_����4$�
wa������j&&=�ߓS,\�ʘ{.N4V�hpO��B�\>K}�XK���S9 b~�:�߷{��.��j�v��^����n�|�fp^etV[xA����Q2���ʦ����\@pn#\���3 A�#�穟��<m�}��[t �at^P}��/�3��@�S�R�� ����=�HԬ�$�xBF ����{��}7rH�w0{Ghv@�J�=ӉH/`W{
`�~�/O�y<H&�"j���POy���E�C��Vi��D}��C�PU��H	�9��/�x<����fJ�i�#��$�l�?ϲ4PWT�MZ]{�W�e}|^�:�z��zL�C��Q��!�4�� .i�סT�*���'�{��!/k�b�&�69��{6'��y��U�& 5�ً��36hh�=w���o�u���=P�U2�f�#Hb/��fg �#���P� -�8��� D�gW�����W�ۚ�m�j�8%Q�c��9
�LR�L����o)8i�ކ�!J��[}����7��/���U<��P���0���WD���������mx�����x��]�G;���yøĝjч�~��\H=J�{�����M2/���@�� �,�LX���+�x�6h
m}��Z� R&%�ya�s�� .�x���o�!�.�n��7��vw8���w��S�4��Q�0#Z� M���?�ί>��j��ht �����1�  �Z�/�u�O<�r�i���%O)ަ�7Ӣ�j��ڱ �0���꒭i���*�5�T�����t
a	�Y���쿏�Q���qK}-�*~ZI��J:BQ����G�.���9���d�,T�o�]����J}�(&�Q
꽌�SXW�IV\} ���q�:���>��������o�/2W�Z��V�S*M�aR��5�L���ݶPT09ʾo�ꏿ������� Oq`|�����h=��T�2r�$S�$SqX\��ם|OBk�HU��Ī�Ī
���bC�?E�J���&X5��̫�kr����B�v@�%Jk=4
,�l4eٱ�ЏB<���k��|��Y���
������4��F��f��f ��f(��?�
�鉑� ���g� [\T�l�#
0���'�|�M�����x�>nOS��?����Y6��U����l�臓~N��X�a��IA��/tO ^4:�ᬜ3=�v�'�L�p�}|MӲ���4���G0�*֠^�-AB$_U���De��y��M�h�E�7h086�2���ي���O��0�U��d�{���1��U���J<D@��v{I�?\㓲��[р-)&)@�'b�*)�n���� �S�b"�uU�<Ts_����	 �o���ab�*�z���k� Q>˓�d����D*��8��tm��9�>��;�,�4�7��6��i��PTֆbȁ��	a��P�P�I+�gF����W8^�r���fx������,>%�>|s��o���	�06Ф�B��'��݊Q\�+r�8$��p�_��_~��I��2����[�.Hy�b���`�����7D��w]�[" eU"�FBU������W|5Ѳ�lhrd|��)�Ec�6*�by n�D��$��.D�-��/h�Y�ÿ�SDex
���	�<�c�&1eh@	��Ø��X����G�w �@�rdA�ͨL���D'�sH��I�\���IB^}�
Qz7�s���
^m��Ǉ�h�{�a�5�\B��B��T�_%밒}^u{���a���
��6W'T�h�Ln�>��u�<Ҋ�����˺M#�шC@�|Cۑn�3w\rP=�ށ�\�N�BМʐ�ݛ��I�u�m
���a
¥���C�:�rT�&�(�y�	@����}��3�-�9��N�꫶���SVAlN��O���ê�xMf�$_�,�q[�Yz�]�P��*wi��RB���tPk�Ga��$ ���X�b��ֱ�Ռ~b�4!�4G��I�@��cN4�z��A-]�O���[��1�7gz�F�,�$�`uڤ>
g�Dέ��?͡I�������k�e�S��y���I�ͷ2�R�_��~&W
�ή�?�/H�tBˬ�`b��	&�&�{�����IڑD��t���(��U�����5(՗�gX�TK89J������>xv9 ��c��m�( hZ:-�;��6'O# �I��Z���,���K��@
��H��F��v���َ��89 ��N�dP_�v�tS��q<�Ü�0�
�w�IQ�QEƨ�Q���
�bT�bT�+� Bǐ��4m���E<,��[>����^��O�0�R�e��O&P��Llֳ+���4_�O�\���?g!9�4U#ϼ�
ܔ�������2*���8I۴���gRU�!�Vq�fYެ��:7c*N ���������Jv;5�� v��IY\X ���%��=��ڵ]�����*����Q�Dk[��*qUn(E�B0U�#0H
��,��#oik�f�.[|b�B��8��P�h�y�WfL�
��q�/j5�K�j��v���QBwR��=�Y����*�wR��b�������AͲ�Rt�W a0H�X��T]���/��$�0�9E�=�%|���%H���f%�(tk�D���#�hi�5�ԉ�[�3��Z$Lܪ�K��]�B���fQ���?��D%ʧF˗�wrq,V�ȸ��e>��Zs �|���@ayfa����]ŝ�l2j�E����8����/P}�&�%r��7�:��?E\���Y�(�*���N\� ��Sa��[�ښ���@%��m�;���'��>mֈ^T�I��^|�`�a�1�˾e���K�f;����~d@��� 1f�}�%C�|��s'1=�����x��vm�Be�&�� �5��ި7��#G���ZX32^̑8��.א�]P�
\�������5�kMK�7]�]t]c�]{�]�m؄6��Þ�ܵyQ�8-b
~ૄ�=�s�0�~�������VS��S#�p���P3�[[k��S	�^sA�
P���$ø�B
h����J^ŧ84*��CO��b�r��e�}e�#�j��M��ىƨ�.�>��9��|���z�u��#Z8_���}���_��S{���(I��Y�#D*ԬX��:��iX������cXb"҆@�i�1�h�-�?g=�T�^&V����<�Q~�V��\�G���C1:X=�Ý�1��9kYq]f!��x7Joǃ,>�X.��K������
��[CV㦙�lmi�ȣ�4�uP� �K�)�mJF�25�c&Ј�0�TC���ߩ9]2�t4�?�> ��K�G�%a�|�p�g�x�uHJ<)⽤�MN�B�_��%��.O'�8�Ԝ��q�(,+�n�H�T�b�4�p�[^ J��G_5�*0\auِi;i-2��&�{Ѹ^4��U�Ͱ?��Z=�K�xW�*	��2k�� ��0J93nY.MY����+<<�A��z�P�M��#jb��bb8L��d �Ř玹M�!;u��D~�:���1�D����z��YK��M��o��=�s�p�Z�l�]��z���7�BT����:@����S 2Ep8���Ð@H����<�_�M~����w�5�[�����'�Ii�~Ӥ��O��%�M��g4�~�D9��M�߂�?�YO�M��CZK(�Z�y�����'ML�R������ɧ�O���d�� ��,�"c]FM��A�倃��U�P9b}	|���;?X`�)>��3ΩN.N ��k�	Y��A�%������<�2�����%�(t�Et^~�-2�$E�v��$[^�/%mTC$�i��y�01�|��"kH�x��:{�>���(��X���qF���-U���q�嬃NՖ�1
o�D��}��\�\$��	K�ȾlGB�+�����#�iC�+j!�}���壕p�j�jU��	)��u��aޟ"�M)S���:��Q�
-&�����2����C�!Xݒ�.����ɐ;�S1����l�b�le�.�-*��U�2��gV�_ ��ө7y������_ͨ��iE7˚^���'k�[	�W�۷-h/tL쇝i��)I��	UF�d�2���bL9^����-$�[ZG��RĶ�F=�nj�M��)m,��2=�a��T�X;[B��bW(��<�b�'Rf�Ůf���t���t�4)���	��/j��:Z{��	�?}E{�VVбi%~������5�ǢS0�#�������=2��������-Z9����a��z�hw��աrƇ�nξ����8/ۭ/Т#��&���xN���H��/]�3�{TY���QB�e��7���߲�u��#3��vyȷ ���06Jv�TS4�K���V�U|���%�(e�4�ƞ"mr�;</�0��R0�"~�fQ�f�:Ԣ�M6N�u���)���r�f
��E��9�kbJ2�	��*?C`Q��L��E���e�o:�����R����I-�������4SH�Ⳋh �͚#/h�~:A2�� �xo�y9&��/���9>�~��jI|��V��~e�p�Ï:0�Y��
l�M�y�>�J6'*C��h6�yJ�;��R���!��6�VZ���b���fb���ņLqv�8C��޲xd�uL𣉆;�I�X�:�[B��4��82�!���7�n��Ro�OV	=�<��L�VA��[��|�oՇ}�@r'�P������lTc��ڤ>~[#���5'G���8�U�{�6u�z����>n���+|��Y�cr���QO17���N����᥍��7f��p���v����5��:��v�k�/���\��{��ռZ
�U�g�k�h6�t��{���=�gnz�E��i� ŞfY)�dȲ�y�S/{��;�N��0;œ�h|��c�b,w���b���Ar�&Yy|��Y+�9��9���I1���.�G����k�\��.����k���5�s�s�}�4��d�{(���O�$-���%T&5�x�~ÖmQz�Z-b�A��*�P��]F��ВD��1��Fȝ�K��!�u�_m��;��EÜ.r�6�"�5V��e-��Q�W�MQ�;�MF��c7���=�@ *i��׷ِ[ ����0?�dLK~@rj#�6c� ϑ���`��WE6��̾,����zl�&�x<��*w����%~�\^Z%ENc����'��*�h��¨����"&Jt� �M�����gY�{�g���J�B���y
�.�#��^}�[d&�(ʇ-k�DSUZo9�k��a+�J��
OsXNϓ4֪x7���8*��<�R���h	
����g��d�S��y6��:6u4���	,�ǿ�}�bk<���i�`mv�.t�ԯ&�3K�Y�0���2�����L@�o��<��4P6�n�6M���s?�YD]���2U-��[�nAV�9�]LS�l��q �ic9��n�xLF~>�V�*Hg����w�+��.��r(������`>�̴:�N9��MZ�
��h�N��5T�����=�����֙��!S����:��B�Kإ�@AStR;L��F�^��z?�7%y6��¡�8�	w�Kk�u
�Hh���:Tf���"k�FK4"*�n"QN��K�$;��P���*$p
z̧���(0�$�H�ۼ��Q{F=�%!e�nx:՜��l{�iQ3O�0�0Gle����g��j�t*ESݗ���!�!�2Uu�|�V��[QΝ�m;&�p!�ƍE
n$�PL�eY%��\����oѓ�;/�wv7��|�z{w���/߾���i�O:؊UӰR��j���|����K�%���LQZ��
kW���L�N�b<Y\W�  ��<�<��� ���Xh7��H���{C��]Ԭ��>i�W<\O�����լ�κ�D�+��u%�p�o����*{��|,.�u��-n�u}�M��%�4%d����.�0� �r��gJ���w�e.��e)�����"{p>�=���2ZPC�yS!&"a��T!D�45� �-�#����A�.�I�x��S��2�\��9T?2_�_l��|�+^�h�����u�GV�^pM�����v�Յܬ�J�!Z8)뻛�x���)4u/��#Mz�<���b;:E�fd�e�<}�>���AW�����ύ�����rA�b]����b��v��dL#%Y���╙j������*G�g@�+�Q�y0uG޹`z#�d�_l=�;#�* �V�N7k�ヿ�5f���kXWY[Re�ֺM��Ҳ)�4�拏�f�P��4���S lr��
�eyt!�R�˳¨�O��0�-��ϩ�1#yUb��Z6��H��Uu 3���Ӻ|��/��+i/u��N�)�}0�*�k���`�0V�ꯒ��4Q�ǉ
���Tf�d�3�K�p�_t�&�=fHQo40�\:S/���N��+��L �b��w��DnW�&PHH,��s���v�b�����!��i.����}w���R>�$:~��#��&:��C!t� Թ���X���m�5AC�t��[��d�ǭ�AO2����R+IPI��	�*C+y�Ø��	�W��B��u�I8�S�gό3���>���+��,��|��㭎���s�}�-yKD�w�04$S/�[Ր�Q�\Z7ϣ�jG�yE�A��AD�X�	f������u�Z �?.�6,0�z�d�	Gl��l����d�Ws��Pt>6iFnu�G�k�U"T��7�����tۘ������E3�e�x��i묑@�T�B}��D�cs��	
�`�
ju�����UA�I1>\�e����{hgru@�a�]�V<��4^��QZc�a�4:�.�G�#��h
~�{���,������t0��CA����.T�M˶�;��
j�%w1�����@�I;�sۭ ���,�UY�ބ��x�Y^���AM�4�A�	�qcv�(���ӳYN�𔙗���'Q:�yt+��<JSiŀ��`R/�Q����⹞ߗ3U��be�L�������Y0ݶ
	c�C=���z��z���X���L���f;��ܙ�K��h8�_���������pW&y ŧYX�k���b45�(���F�8�;���EL�N�o;F*<'LF���� �"�<�r���b�䏹a�4�܆��/ɍ�DP� OͻS�h����#4YN3V�f�o�$(g&AH��.�p��^��o(�X�e�u��xz#���C�<�
X�i�mT�۶�����Ҟ�R�w)�y-!9 �	��p!�Z�eDz߱Lbp�rpk�C�f��F;����Y`���`�쬎�u������DK`}|Ko��]�O1��}|�ꪳ.�l��|6@	�?�&и.��w��e������*k9�������w@Z0u�mk*��s���3�x$�Iz(z�=��>���d���7��@�]���M4�⚆QC�m�q�?~3կ�6R{�|��tp#]����<7�6�m�/�;:g�F;+w�Z\�`��
Ŗ���~#�n���
h�D�w)���ݲʅ礱Q�9K�5�rʙ��i�_���:d_�[������<
}��N�]u��J�@-�Č�����aꗐ�k���A�o,�*N[I8{sR%?�l�Y�u��R8-�)M*˽��YUH�(������0�UUĕ9
%?2��yQ�I���ew�W���+�<
�^�J��T;�PB�[KcF�(��M*��4O1������R
�x���YP�l,�h,��F�c��Y�\.���u$�*w!�;�Gn�#�����T�(js��"VI�W��׏�Q�U9�b�\��@_�w�9f�0�1E|HԸ[���]�A�C:퇆P)Q�sv#c���P���L���J�BEy
�2�����*FQ����1Yp�>7�l���-�+a�}SBg����F(	J���.^A���&��!��f�i�"V�l���d~b
�DG���JC�jMs�8� �� �Շ�/3�)Z�Z}ӃY�>J��Y[����O7����i!50�f���
 ��en�d�@�"z:��BRg,=2��SS
ꄁ�]Q�9�Q[T�!7S�꿪��Fj��
�mn�=�DRo3픒�ƚ:
<	����J����Y��5�֘�8�>I�(�c�~�]�4nOW�]-������qwik���k5Q�j�� �k��q�ky�������@��ʪpO�_0�@���B�[Gyl#`a*�m(5C[�L<�"h�]b0F�ca}ܥ����X5���,�i����r,Y���+�a�D��!%��U�L�鎫n�Wm�H��۱]���8Gڜ�'�yb��8:��P�plѴ̠.���d�S\�3�9��B炇s�PG�j�7�X���z�܎���'��E�V4�2c�lr
�+9��S�>��F�D�l��V��P�ds�� ��x��qMm�,�|�U�c��-v	k��j�K�x� �tt��z'�mJ��5��Ft'n�)k��Uc�,ɻ���P޲��3��p���u[3Fl�@��X��ORk_'���sZஹ2^���i� �x+�m"y�)�ʳ�3:̫-<W�h�Լ��{���>�`謳��h@4���d���֥#�˘��_*棷PC�&����-426I��g|jHTC��@j��L�>}R7(�2��\*�����k��U4q-����Z�.�!ƀ���r��1U�%T9���0��%�.�\��7o#B�<��ٗ�=m��=�y�kx}� ��>>��]��72��z�����n-#��d��J��wC���&k�����Ҩ(p��\���P,!�6����R��a4���dr�[^"���ԔF�U7݋ҔyD�l�ɧ�]U�)�Eg���ݳt����%x�|w�����[H���9P�Io�|
�����d�OҸwwa��]z��0���4�#29ﭐ�;=^!�h{�Z��n�0���WSh��w��q�B��x<�
���;�/�u�0g���w\B��w���@����9���q�Z{aI�珗�&&N0N� �!��haT��t2����)�CQ���	�0e2Mc���v�r���S	�2-@�K��9����y��)aS0��rrM`Fa2�ǲ5��Ӳ*k�,o��?O.��f "ӹ\��m��-.L�������g9 ��p�r��"CI|��D<��(�^D�f�>�g >��<K����b�.���Лd	M.��av��g��Wzﶌ��X���x������/�x��xs���h���B��3_���lޮ9��|�M��>s�\<�u�'Af�g�� C��j�fSzK:�ټ�1^����9��i�T�<G˝��_H*`��1 
���I�[^B������ɑȎ`+�#�7M�꒷�i4.<M����W�<�@�M||��'ÐLVRǊ��1��8�����&�"��ொ>�4�ʹ9��2`�:l��;�6����L[�����m��S�G~��~���"K��Kc��^>���pA"���1
��7|e{�6kI�Ⴕ�1��Ֆ�	�#��Y�PG����*ZVvzꁆ:q���y�J>��d�K�G��A
�Kh=>��ư���Λ���8w�����w4�J
-���
��b7B��ڋb<vw��Mf���ڢ��\�|m��G�ݠ�����M/���6��7��P��qֶ*��ftP!&VM�+'U�K?�&t��{rq��	�8\�~	]����{3�|DE"?�2�d��-c�n�/�s!æ:2�,�Y�+S����Kg"�ŕ��Vn���~��%I��C�[���Fv��������v�����D�)��}Ycϳlv�/p����ƺ���?3b��O��Z\�H��/�	Y��[k���#��޽��La1P�,�<{�]�Jm0�I|�yv���@`�H7�'Qy�� D�'-�햖������dX?i-�����Kd�d���A��/WZ�� ٓ���I|��d{� =�ܐr޹KJB��Аɒ�Xj�U�)q2�6�'<�Zw{+T$�:�W�s�CdS�&��)�>N��xl�9�&�QCL�ڛ�� t(mU	�C�Q<L�#�C�a��Lm5��Ce�qa�rG�����F|���輝pO�D隹V_gM�?���q�C	FBٕ�R��]"��]ski���^(�!&�� �fi���;���X�7SG��G�K������4��ْg,v �N[���*�&>[�E�h����Y\r��[�H�E�V�K����b�!��(�-��i��Eh�qZ1Jƽ�ނ#b�B����x�5W�A��0��cs9Ӊ2�otv.�:��6��L�%�'�
f�]?������:J�{LI�пR� C[�z�?�����շ��&x��x�U�V�*�g�@x�v��s
��֚#F���eu��v�~�{�򫾊cؼ�#�wo'C��q%�E���R3��u+��C۲E϶l���G?�i�X������ÅH�r|3���{�1%�Q'%�]�U>Ǒ�e9&���<��&�B���Ƣ.��tQ��p�:� ��lՌ
2C[�
�T���j�Pa:ZI{wl�iɮ��_�*T�4�M�)�2��J�\&u�J��jQ\{�s���@�C�Zj� �MSvG_�J�o�!
���-��zǽ=X�XA�|�;�GW�R�8p�ꐫ��� ��G�������eD��������T�6��"רbK�dx&9MKva�W#�E��� �~�-Yl�^1ȳ4=����£��5��F{	��>��N�3�֚�|`7A���������*���]�>)F�0[�Ks�+�V����,�_��4#�-��*�|ʹ�M���[�ćfĿ	B	�u���I������,S\[���mv�%P�Fn���:v�?W�li����:f�)]֘�*=�VZ&�v�[r㶢D�
�4>��ɑ9���h�*�L�7ϻ���� E|�|
 5�v��Jq��<F��#P@+���H���zC�Jj����bM6�/PE����qSd..ؚLG�i���	�����o;\{�_}`&����:��Y��g�/���/�_�}�Ic����;dg��֋����M|���v*Pý4U�5�!I2.����-�]��������`���F�V�3��`�yS噠�j����J�>Ԭ�,��Å��}K��pC��8�o'5R%��/�mO����8����#gJ���p�d�?k��-���)Z��T��4զ0fQ?&on��v̬�hp�᜼w����_��6�O���Đ��]��"&ޛ�/ɼi�*`������R�`���`�i\���Hp��' ���N�m<�)��-�
�l����U6�Μ�Q����]�;�'_`�I6=��F6z�y�A���!4�_ŀ��Q\� i�c�fh\*�',��G�ɘ�v:��l�4��{[@x�K�ص[��[��~@~X�}J�]�C`�E�h��]�vf!¦瞳��[^$b�V��RA_��-#�h��q�%w�%��I~&�k��c ʻf[�Ѽ0�8m��7�|�z ����U������!J�9igS9���^���y-�g`��dH�?��>��?��p���{A�<�=���zS�<�~of��DpO�f��9��$��ɟJ�gV�����VP�76�
�`x��?`�5��y ��
��d�( Wd"�@�uu|��	2ER�$)a[|w���Um>�����B�Ҡ�5�;*�����δ9ӟ��$c�ˢ%�K|�÷c�{�-��u��&�5V�(�?�
)iG8���6J���h�r��0�Ǫm��S���U5:�tQǬ%Q�,ݸJ�چRU
�Q�2)STk(R�����> ܮ>�	��cS����M?��>x���AJTX��=
/<}�{9G����O�4Do`3���*���FV�7Fc�<F�1��s�bX(��?�8+%Wq���*��,�\EG&�����>+�e�!޸(� S΁����rZ�ھF�j�ILB@1�'��!��N��\����f�X��?F�+N���U�]r��r�6��Y�$�5dM�a��<V&˺�IM[A#tZ@�=TY�|K}�G%�7UO%�͆T���p��M%�6�M%F��c`c-��^��I�ʤfH�yEu�k�: 'p�m
^�JS��@�H���չ�«����(�j�y
-�(�����~��M��T|��K���<U��A_26���:�
��'
�A�>�[��`�Ok�;2)���M@�R߅��P���h�zv�{�*ו�<�T���(�Z�����9��>�s�lg�&�b94Ň�*��hTR
�u�Z2�O�/�͸�,�@�9Z�ԪRʹ*Z��}���s5���ߖ*���߻�Z:ܦ�tr�mQ�Ǒsحizo�M-��S�v�˪Ԇ��T�x��˼�n�ro(.�e�x �&�@���_v���6跏���j��y�:9���H���{j��09<��@-�������:��A�'�	[��F��?8�]A�"m@�#��-/��N����k�m��"й/�.�4��$�!����氘d�a�V�,�J�
g�<Ƀ��
�c�*�V�r��O-�����[[���ٴq�ـ�Fh3��Ϧ��b;
R���Lƛ���ì]'k����|6��A�Q�X�9��>51r�+l��I6�����(.�(:�6�;�L�<;&�Hu�}f{�i�ߐ�6�7V)1þ&�̺�=EO����y]Fn'�\+
���0�&t��'��1�cq2DmZ�rw^6�j��vYeH��}�n� {\�^�>V9.iR�*誛:��O�ƪ��G#�Vkf*�R������~ԘQ���1�P�{�e�pO�_��Y\���]�SH��
3ɚc�� m	o��vb��
�3�f!�m�f߷,��c�<x4�1`ԭ��1Wl��g��%O� :�aW�ۂ���d2�-�x�����-�H�w���Ix��2' ����g¯�LN��x&f=M� mu�ŵ����l����y��M�;
�I���Q[X���-�K{4Lrd��șoȭ��zc�o7��l��}�����<�z����l������e�
Lh��ٯ��1��pq�.�����13�
�$\T�r�x����4�������sى����
D�2�]�����x���&A	����1	�x������r��	��D"��E�6��u��/�\3yt0�/��q��ɽq4jRO,?��?�	sC��>�	m�x }�S��lB� ��ӫm��GiX���`�;��𺓷�`�i_��j��_z5Za.�e���Y�V~�N��3��$���C�&�uG`��`G�(+���2�؄\���7e�̡M��k���"�W�8i�!h+|�yL?�C5;�pt=ض� ��Rh�"ݟ�b����]�h�Gg
���QS�f�(����LY��'���b�Y�M\BNѵ����O�P���s��{���Da�m��Ey�gQY��
z�?��v0����N7�mK�����H1V�R��l�>�b�nux(��F���E=Pk�U�l|9��?yr�Z�8��Rs��I<� ��42�W
����w�F�2?g�I��wGέ��������o�񭒣�&�(��~�!��Q�8��S{|�=�n�����J�1�eo(�:������~]p�F�I�2m��b�f��	o5ǭ�=���X�R5��W���P޺MXS��I<Nrt]F7V�l�~�|k������Wd���]������涮}���g��,��+�﵈�S�{}C�k��Au>�p�I>����tbԣg�|�Nj����Q�^����Tt���>�v�B��u�ve���Jx]�G,}x�4Z +����Q�^���xY\�?�{o�ؿ�����.,�����'����K���~��A��>|[^^�-��=\ῗ�+������
Y�G�����p�,�����Jh��R����o�־�Z�X�����Y݈K�Kht�B��(LÎaLN2<d��{뻎��p�cذ�ʾ#����G�+�4����ɻ>�؞B���R#����<|&�_�q,c�9�v�N���������/D��oW��z~������1�z�f6w����.pY=k����+͢?Q\lʟD���w���mP�u�#���X)�5)�8`shދ9NY�}
(��^˸��%L��s�
�/0d@��qy��o�����
;.�8}���%\Z��
h fb��'��/ �͎G���\��MQ!IW�5ڹO�&��Ồ��w%{�s�Yp?T��g��BKݹ��;vsq���F��!�cTW��^n|�c��U��u��A0b��_�31����%h��=i�~���b��xRׅ�͞d�(s�FGx���<v[%��(��Q�Fb{7Rݳޣ���?�H�.Q=}��x�}�����_[�����k\ؽ�@�5S��bZA+zY� ���Cl^���sQq�RM�Q�0�C@9�zJ�e[�=�� �pf��ƫ���bzTﮖ;�����Ϫ�OA�{����dc*^�nT���X=t�j4��{�s�\X=7�A��@�W��<��kt�Q˚�
B���R|�N�"��\��y�����+'U#0�c����9��m���P���9�}w=��>CzDE,-��'��^��\ i��H5jU*Y�߭-��Y	�R ��*�4~�w����>4�
nD{ �Y����/�ty�d���w8ꎵ����s�J�޽���l���c^��������Qk4���ul���{B���ؗ�9Yܞ�y�R�U��)RΪp�W�xv��5э��M��L������1^�����ƫU/4&�OI��i3)H�Rl9��dI'�f}{��շ�ۛ����y�zAwlu���Y�ҕA�Qe}oa�Y��E�^ju:`٩6�T38�����S���j&0�^��r�14tW��$2�?�k�QF�4�-}U�H�A*�D����S���Y���h�����`_\@m��?�����S�R���>�������]���������}3v��}�\���L+��
^FO���-���Mg��\����˧}f�!�9������3����g8]��Fw�ɩ��.TGSq��L�ϣ±I���Ũ�Ȃl��P��y��?���1z@m�
�F;���w�c������d�rok�ӡ`����\���R����1��1S��1?��p�������̈%N����g��1�4B j�eu��*�����\�aw�Ѽ�>CUQJ��51�*����I��~�����v��v�Kk��B�ͣ)���&�u7PH]�c�rQ��mV�X��Lh��j>:z�Q��${���9�<ꯢs�.���I�d�RU=K�jI�!�1�w�ӲVj|�_GЛ����?U�M���C�Ea��[�(���%��/(����T�H�6� �HY�!��B�&�S䚁EV�����A:� ܰ#J��悖�*����hJAפ0:����W	l�����l����l�Ĩ$��{�~1=(ʼ��%;]�'��3`���}��9���Eg�K �%���*Id�ls�ː���v_5 i++�n��V���y�W�/Z��2q�5+���c=���Į��3�q�8�F��xpb�1�T\}@U@el�{����L�.j��I%�	kz#�ܓӻ��t��O���r��<�c^���fd�&w@��j��Ӟ�L��*v$-��+��:실Ȏ֗6��_Bol��RD�:>��U�ԡ׃>���'8��S�	����^d�q�b2�A�
�?f�������8H�����l�1�}�
��r� �͔F���|k�~�'����W���jb�c?��ҁ8�3�Эq�}�ħ�rG'I�U/FYV�>��?f��/or�@�[�K�#$ض O9��`p��+-D	Z�*:���]��N�R��`�UV;�
�q5�ၕ��x�(�T�5lE��S2�$AJ�s ���Ty�֙��ⶇ����C=3#�3S�.[�Y��EZ=���;p��#d_f��䈡B�crWE*�Xy�>�1�k�6�� ��2k�"�X:��ףxЀ�͊���Tߝn���(����,8z%G(kpV��K��%"�R�S�U����L���C�I��9
���
Ln!pE�>��yRy�{����3�];��i	���t�Í'M�0>My1>��S7=�w���rE�2PS�ײ뻯*�v_��b9���^9�F�
�.&�D�����������)9�q���"�M�%�4F' /����K#��{��{f{�|C��-\���F_�\#�A8|AC#n�MXx+J�B��M,��ɱ8C5$��	s`��P��k=+��0*��冡�K֧׭��h*��O���vM
س�,�A�m�qQ1'
��>J	����r�Jc�
��v߿Q1Eq�n++�����׾g4��U�6�'�~��fR��v`�z�l�;��<�/���zR}j*i�S�j���,1r�P����zXf�
}���f����5wC��k��.؋6|�{�h�/�?^ql�������Ҙ���,v�\�[4��λ$��u���k�R,����o��E/�g�r�:�
*i�ls�[w��gUA�����h�/#sfƍ�����I�o+,��LY�U<��-�4�ߕ�G�x�8�T��$Y)k��z����7ͦ政9� ��hͭr�5������=Z�U�K9Ħ
�cc�Ɲ��Hs�����d�;��s�p;�9�����<���x��}��m_Kg`v��0jT� �>�F
*��TR��U{%�ci���9�xj6��>`)|�o�'w�Mu��p��K��*s�"��w�������~w����f7{�q	+����l�vE��[���,���QT��S
ln�r#h�07z^Ñ-�\�ؽ	�L�]�®[5��А��݀� ���@��!��f���|�}�1¹��}�f{sgG�v�ܩtt��ݦ�������`86@���5���`920g�@|̆�ꆍ�'��O`eAv�韃�w>���(Ŀ�4�5��	�����ȳ�:��W��R���/9z6M�$W�� 6e�������������2�*�Rz�Z?�������a�𦭮ƴ��0"��Wf��'zc�A{����FJ���>�����J�]�ݹZ�񿧑�E��.�
Y��C^V�Hu��[����DSÀ��6mV��or��������LL��'&�g�dx$E&�S���O�a1_h�V���nT�EsE5L��j���:X��q#gO��޵�2�'P� b́�KS����N��X�^��B��i2���׬�%ng��<�o=߂�2������\}���[_���|����o_�n���qԣQ�K�p�~��q��X]���m�)����q��1\�}�ş\����-]�}'�����tI�Kuf�lh�g���G��:c���ֈ ��I�5��=��I:-�me��R#]\����(��]����ᬪ��A��k�k�m�MN�{h7d���	�`4v7�-�`�hK���T6��1|e`��()�kƃH��LA_�j?�� 	:����=!��𳯘s���=�q
@v��Di���/�K�`�T��
+;�F��C�8�	8�,�V�X�y�sZ�$�R�N���w���\�\
n��3]��(�c��x�q���u��5��m]�B�3;,��0�K�D|�؋�w�w���w�3��Oa�oG� �y��3,l�v�T�&s���,��\&�q��Lw�J�ɞ�7��0�d�:?o�Y	���.�f�6<����ԇj�a�6���i���Dm1a4M�d�z�c�{#�5�,��F>���v�lyj<ǵ͖<>f��X�ۚ�X�2�ʁ7p�[u_�ca�a+����N�5���hҪm�d��=��/������*���t2Bea�R��/���rY��^#�[s���Gw����6���m�O4�2���5!7��I,�M�bwŽ�ʃR��ѭ�7hq+�G��ñ>�
���j5��=�����6�X�,�T�^e\�=9\olZo{Ȗ�NQ�_Ț��}�Q�&v�M�����YZ%F����QN���Z�t��Ǥ�K�Fk���C��v�GK�j���{3s�=ש����f=��jV
�֞��
��W��~5��%�K�qZ����ж��ƅ6Gה���b%�Pc�K�¿�ѵ�ażPH�-�+X�r��������ⒸԦI��PQ$�D+X
D<��������D�Z�Ik���X��(�ɓV4>���7%�i�5��������Z�̩�����?�u7�nV+��=�U<�f�:/�V� b�}k�P*�@(��z�����A���c���W�_1�r��@_�?��Ko���4. 2R��U=��] ��.L1���������wʋi�/k�O��D=u�7e^�s}���X+=��`��8�Z�����@_�_�ۣ�(*���j���\�r|��l�{�]o�]y��+����]
Gȏ� ��6C�rY
~���~p.�O��_} W:f1ـ�&�鈴�Di��0_e+s�����V��eߢ���{�� ��'�����Ĉ �=yhޥ�"|-�x�0�6C�q�v�z���:ʺc��Z�I�o��Xf%HZ�o�S5Q���\PabJu���c�����έݧO��Tӣ��'��]�7�?^1$�i��q�	�ԇ
��QO�i�O|�[Z�a������?���Z�jp����֚�khx~P��$I�5`�R3�&1M,l'��x�xHht�O�,��w6���w*ƍ(a��p ��N�a{�7y|�ħ$;�a�<�-C����~C`��.63bD�\�甗ooݦN��-̺20���u�U��Ϣ_��-5?�;�����7K���1r�ċ�#�/��*k�"�qciɉE�h�Ϟ�x�y���.��P7Nb}��ۈr�
fSC?E�D�`��cS���5�k�C�`�t	�'���G{bI�b'x� ��놎��tk�|Um�
����5�Nt_.ä@����ŝ ���W+�B�ji�/��+D�V3`!IIq�ּ�6�y|��v:i���I�Qa�������_�3���z�J���W�}c�E�N皟[u�z����e�:%���#���$ܼ|��ڻ�����,X��2*���\;r"�m'���R��D�6K�o�+�\��{�*��Շ�lT����0�gWz��� l�h4�O"�k2��$��YZ�]ϛLєϳ�y-E������l�Y��6�H�a�ţ8�ҡ�-!>�jy�������"X@�Y�8d7����־���Xs7���J�8�0���aq�/�n��=d JhZ�bbU��7�5�*��pu�W��Fָ�B�<��N.������R\�Za�%u�/�
���+nVm�U�&X�ٽ��^}��t~D=bI��/:�B�x��ZΉ��v�Ѵ;����<=�u]�5��޻ӜeGYe{,Ŗ��^�i7�`o��U��Ф��H�{�����ҕ9u��Y�Ϩ\��ǃ[��yMG&��~vv�[�äpi��H���ԓB-�B
��mK��D
���J����Rț�=�GhE�5^}��Qܔ��F�4YNR�a<�&�>��X+���$�91��L$�R�H�8�/�����RS��A������D뿯#Z;���&�H���
�N�S��$7�I��E��KQğQ�V��z*�3b�m�ޞ��(��|N�~+�01�f���\��ܰ���+�@�|��3�	�_�"��5_u
dҍ��JX��"�A�O1F�<;�mջ�=���qf��9G���aT�����Lp���7��XS����N_=��-�r��<��꫙�����Ǭ��7V�H�]>��f����W�v��|�������s���d�z���/Ǐ�+|�	����X�am
���v���y�j�0�9ɒ!~cD�'��V��<�������� ~�ݚQ�����p��[x�F�1�j$"�m��Y�[��+�&s����&�����X��A2���fy���Z@��H�*.
��	Y{$^~l��Z�s�çX��c�P������ ����/�DM���ʾ�1�����4|�:�@�/���>˄��t�?������B[�]kU�w}��s]y(�Y�T�o�h�m����讕rq�*lχ�VY����q�q�P�	j��{�]s�e�>�2Q�`�(&��K�h%�c;���n��)�PŴ�)�r�9�⣼�q|*��iE�Ի^
ށ�|��"�Ӊ�����5���BT�|0���Hë�"|�/.��a[���Ul
iśz�,��UIPm��
P�Rb,f'T�5:"
��ӫ:v����*q������
����*h��v�/J���F����J.��8`u�s�u�h���W�
���q�e
zb}Z�MU�'VW�;HDa�*�KO4�<�ї�u�⚥9\>�h��P�C
�w�$�24�8���<6��s#��Rpڙ¶�`A�
X����db�c��W�BK�!Y��^]l(�d1�����I�Xm�gپ�~�����uG�'V)�cY6/e�ʺ�V�+�*W&C��/�Q�ַ�xK��;�R��l3(..Nk;H�0ۇX�!Z��y�]�7��J/���<�u�R�����e����㖣���*r~]j`	�u�#$�+���X%��Cu����HC�?�D˘/Q�EA��%��Fx�3ScO�����S�sV� ���.�
�2�i�yL�<��)>�F>G��qZ}�iDH9�����5:� +g�.
��8�P�p|� �R�鳫�x���0�cj9$Q��Fq�9d�?t����-�:�Ģ�k��!Fj�!�1���be��bk,J�ѧja�[�B�ݎ�Ď5�bm��%s�R9����/&iR�����~3ޟ�ݘD9�P-�{GY���(ƧQ���K/4��j� G(�#>	�D����˽}*��Ju��C�A��t���LX�L�Jc�k�����B2-���0:u�a�.5
�P����(�����(�#�V3�XP���D��<H�|S�w��^�tޮ ��8m5{��
��v��jhd�Je����L!�c;:��k `ט�q^�3=�ĸa_��NY%��o^�I�cHY*/
�K�N?����}�eH;3Gv����4��4*pېX�^t�l���׾E˨(%D��ɠ4e*��j�j`�M|D������fD�8I�h*㣢
�ۀWX�d1i٘oq��:�K{{)��:xow���W7�'�Y:>vQ9�Mf"�S�l����=e}bU��JXuo�}�TF�G9&r����6���U��JƇUB/o��xN��rQ�ppGe0y?.Hm ��a%��q�x��$�*�:>P!Q�-�/?�K,k�}\�,M�0�p;b����w��V_�elC���V�H�>P	�v�_�ǘI6nt�`�VN��2��~X01����9V�� r��ƉT#RS�����2��13m�[
��:�$��x��$F�@��Y]E��yt�G���^�#�B+��i�Dۂ��mÍo�H�b�Y�
tiƶ
dG��*^i���
��t���e�
��༣�s9G[�� �C����^�gQ[�%�帲#����Pu7�ٍ48O15i\���4aI��4��Q�`=�dbu߀`NJ��&[&Ԁ�@n�Fju�h��aZ��|�U�laSO�k^CηZ�,�R���C.���F�`�=Ο	���u�s���$
�1ЊEq���i�S���aB�vGd]%�!zT/���m��;5L�`�1�tt��e���v�A֨�L�|u���Ά3ewZ��D�@ػ
Ȩ�����$�O�(����~S�2a0-�l���S(\@Z�L�l���	gW�_n`�$1�K
bNp�	�},�6l�
Ek]������z|�����F���i$��Y�Ts��q	"6y$x���L�A�tX��֦�t�3�I���fˊ����ukH,�H�[vt)���5i�g���	C��Ɂ✭��g�ό�����|�
������n��V���*�vq�4�����DC^Z�����=�������P���7L���\졥�C�u�#���n���{���X�g�����7G3�kFr34�L&r���^�Ԁ�snc�-�4Cη٭0NRG��)�;S_�KIyp��P����q��-u��,��,:Ǩm�#���a4MK��a�8>+u��
���V�ގ�[�|F������(��>F�yxʊ��ŀ]���=ENZ��H��6"��Z��Jk2���
��m4��'���Y:�-1�rlC{�1��;|�3�����g�qH{�u�	蜂I;���������.� &~�J�z��ƍe���H9��\K�g^|��
��ӋC�)�K�W�f���R3�����)|���nPS�]��]%�q��_vIb�����u*�����Àlb�~�	����ŕ���O7h�xh�ךRy�L���=v~U@��f�N=%��H���M�Rm�_'�1�!�� T�R7^�w�i���Z�`6��l͌�\���dIA�	P�o�D/\q�-��GQ2��e��s��60F-s&�6j��x�Ƃ��b��>R�
5�2ι��|"�\՘=3��9ߍ6�=�i��[��S'�Ɏu��!�
M��=*V��F��E�0�1���$�ÊJj�3*f���]�j���X���e�P��\`C�]�5_�P����:i������~c�ӵ��*0;'��
��c$��q��D�Ķ
��)�F��p_�;V��
�w�,�d� ���ve�P��q
���jU~���&��*M W']Vv�Ee��κ�xeM��r��RS�@�ص�����Cd<l�a(��PEd�q�)���"�nݔ\(���dt
� ��eT�s�TƬ�ظ|��/��5n/u�Cm{RE.rz����\%�z"ӊ��鉊I(�U|N�2orUV���Q���*�G��*��?b�A�G� s��Ҏ�t~"v��R{#M��-�U�M45ka��X��&���~�}-"�1�H��0���Gj��6-R5W�!E6��H�^z4�h��Sl�`^�����g_n��n������`��7�J�T�lpz�!�qr8H�"�WO�C���j���Q*<��H�4_a9��
'1J��PT�2�O���,���*��Jk��>Tm�㛞Q�4����Nb��<�Eh��W=�A�u�p'���Jt����Nir/c[BT��Sms�4��fxƶ����]���]"1�9nB�uR,��>^��H�-*,CqZM)ќ��X�1$E���X.b��4�lD��,a���"�3a�Yj��:�y��OFwU���#J�"����q��aq�Ekb??S2(8���  ���}[o#G�����0a4)��ҽTr�Ybժ[%i%�{��J�)*m2��$U*k�.z����OclЃ�.��/
���G��?aΉKfdfDd$/����i�H�%2"����X�J�M�gS3�a�&����<)`
���9�K�d�X<9E/����TN���a6������M%/����(�ھ��O)�J򎓷�l�Q���(����+m&qF�Xʽ�-	�SKgJ>�t�5���S�=qM=u��t`�����b���ן������a����I���BC_�'�VN����-�́Y]��VZʙ���(U�6g�~��B�P	��~j�r��;Z��!_ǈP�ߐ�5:8�WC��P$��H�]�ֱu�x.�m��w<�V�Yv�O���~���D�==7��ƚ,_tH���k��U6�����+,��jh�ZG���������z����c��4M��´Eec;F��������y|�8J�ٶa�6Y���qd\DM�J�[?����V�9�Ӎ�3W
���ܚ��������?X�A�2�p�4�no�����#�.#b�2k�1`����a)���_��_��5J�tT��oؓ������!�u9�~%����$v�����>1��G��-KM�)Ka�����Ҩ._�2=��%�����?1���{�ws���!�0�쥹��y��U�W/�ȩ��<���^Au!��&s7��Uv�� �xR�'�dq����򕟿j}��=�ЍP���4�������gO*K�zRy���<��=$���*������i��<����s
���k8�>d����GX���U�߆���{��1�k����t\����Ġ�~��`��n����6�q�_,o�o�B�kY�2S(���&�$��Ta���.�lA�>Yy3Qk����w�^?ۀU����@��?4����6�l�k�	��j�jcf�+q����s',u�\�� J\�|��#wP꒕��]�U�A�WGN�x��=�VzL���+#=AU2�9�֋
��D[��SP�XZ}�#�yD(�b�`.�}RKңt��l�`'J���4�uT���q�W
�]F�}Z�$7�a�כ�k{���-;W�e;��%��Н����{W�Z:'t�������},��bc>Ĳu'S�&h���/N��̇F�(���=�����Mg�1 ��v����/�3o�̷��X��7�X��~��aȞl�� &"��Ǜ.c�,��?XS�(Oe��gƦ�����[A��s}�����Єs�kt�l�5�����)���-{�$˺�[y��3�7�������`�o}pM{����o����%3,��G����-�\R�f�����:��ޓycAv䘥��.<�ی�!�\����T����s#�i'p,�P5��8��qx�������KÚ�-g�1�ym4�^�Y��u���q�sQI`&���,�΢�O!d�N1�R���T�'��R��5��g��J7r�ַ	Wsdm��BF0��%�!��]�I'h~�����?�-�{�)�&-���i�BTAZ���^!�E ��h܊QbOzJ�ȝ4��?���W��'��ln?k|�����sIj�֝%͏g��\۟�t��t�MtVb�Q�<M�K��p]�� ;d�p�6t��f���X�']Hvn�V&���v<D.Gռ�j���u�*�7��4�!^�{٬�����/��b��"�~��?qTd>Ec������K㓀��{%]�Sd�n��]����n��5K���_"g�T�h���6;.<dCO��M7���h;��5�١c�����
�b�$�@ߋ�w;��8VEH�.m��n�z���Б��;��r��{�^E&jyw�7�̆`����HJ�����P����̣nMMf<v;�Q��sx�k�����,�EkξҽƜ�/��K]�i]�`��ᆌ(7դD�%򣀷��8q�\�(�=�3�����`��6v�]O>.�nK��Рi�f��7G��?��'�Ə�S�=�yFe�y���/��0���TEc���Ϡ-}�0Kg��,Y�%+�g��maV--���S��fg �>�.U�e�Tn���f���)�g��2�'S��ҁ��?˷�b���Y�4o�ӐkV�JA;�����ϏR�T-��-�\)�(M���,E�p�Ц��'��^l�
pbrh̏Rӆ��4h�����u_��"]V�x��O.���O�ERsgL�?@��qڎ����q{a�L�����ǅ׮�)^��i�.3����QR��ǭ�o-�E���Pt|O.h�-lD����@��a���}_�;Z�潾�F����#;f�A�̄Y�`ܡ��
iR	�������f����,v����x���n�V��-i�u��:�~��Ft֍4g���{OQ{�=x�0瀞dD[��{o�k��s�w�ݼsN�o�w.�N���w�ݻ��L��Lֱ��%ww�ݻ��ͺ����'�=���Gܳ����n�������#��������#��|�s���n)#��^qYQqQ�l��P:�6#E'���o��g��Z���Z!���@w��`�zk?��<�x�E�	�6�鉫|��vA�W_�Δ���&a����H3ETi^�N��l?E������	*k����h7:��6|2����X0��)��"s1=��hB�.�lN#B5lY
��+�aY+���v0㎪MLj��|��N����i4K�A��<K�~X��ҩ��{n�5͌����rLE0}�t����3����sdt�>������@Ƨ��|E{[��@MP
�{��]����_G����tͳ �jF��^[/���U�vY�$��<(J|�,8Jgn
�,&���-Ÿz�>)��/����)��#HJ���oń+�\��m�%nh!��k	�kȅ?JFI�˘)���l�- ��iK��n~�G^���6��N��ϩ����Zg����z����K�u��x��b���\=�:�޳OP%:2k�z�
?��y�V��
M|vp1N�y�핅�D��Sl�N;1S��&Y�M�TFvJ@j\&�@>���(k�����&��b+�#m1��0Kec��Ȏ��^R�2,��a�	��ш��Fv�GqL��P�-ɇѠeG����{�����G��
�{���	��A����#*���YF��UU[���&�Rk~�_oD~?^��P�jU�m����] ���z��N&݅�Iy�kb�� �Id�X>V�&����7���`��U�q,��KI}!�Z4{O�R�j\׬�g6tZ^`fS>S���lgV�|m�@E����:�V�v֖3���ד����M��[�v�e4�b���%?�� �&8����o9a[��:��a��6�Ag#�O�FfG�ۿ���/���|^����kb�ke����g�Un��@JsM����^�q�x/��%�Y���Y��{��Aoxz� ��l�F�h髵?)��)����t���!c�o��<o��)��؜��}BdL� ����~>M��͎ׅg���^ХA��.>�Ӎ���|g�{k��ȡ@�z���O�An�1��mQ��pV������lS�w��7J� ϠwrF�&5�B�M�bFK]�u�D�Ͱ���2�ɽ�2n����Ov��v 'A�z�kPS腰|�B*Ĝآ�V��/�ҍ�@�G��[xċC�����ͷ���n��)B���R��؎�41��z���~u�+��׿��6K�bS��5�O6�e�A�^e�e��l����@:_�֘�$"�X?x�ap�n4ݼ�aX�ˬ�e��V�^�E���M&��G����t4q�}��XUBh����ܪԔA(�̙%��'V9���)_/.�I�@�t��`*0u�
��aW�Ď<���(��p�Z]>��G��h����몄�4�g\�>A<��p��l^L�W�w�Q'����F`����Rξ����{x�A�C�l��E�B�ˇ��'>�Vv��n����x���]���[zF>l�^������������\�M�93���Y�S� ٴ�br��le��!�ts����ৌ�z�n��f�e�f�[�r�Xo�=�I����:h*��r�h3]�$�S.����3H��jQ���p��݂�d��cF�.u��
�t;T�`i_SrmM^2
<n�x]p0u��Z͙%'��fq�Mx�d_��\����מX\K{��S1oQ��x��+� +���.bS��=��[�����㙇��/sUT���g����q=���D$Q�Xޮ���E������lE���f�q���8�����V	n�t���G��a_�Dڰb<��� �fL{ӡf��M�oA�O���ʘZV�,����h���b��Hm�J��T�h�5U8UF41��Q
�O=�Ũ
7+���Řy?O4�)+�L<�
7s�͓4�tZ^i�O}�{,����Wq����
�4u�TTPS���9+�3�¡�h�`�#���������ѦK>i���[G�O=�t�[���փ�WƤ]��Y[�RQ;u@�yOa�T����N�����,�rX�ǦSO4�k]gX1�V�I#m�M�t�u|6r���mu��cdl"u�A�V����{5�ȧ[3��Áޙ�+&;��f��I� ��yx�Ļ�b������۪��^�f�F�[r G��T��F�XNe*��e��6ܼ���V<%��s!��
�k�����~��'�8*��-д8
�E�G#U)�}:љ
��Q�E��ݠ*��V�����H�;�OD���GR{�se���m͔���gE��[6.`�ZX�%�������2�Y�2B���F�@z's�*�l���L�2^�(��A6s)Q,?U����74�π���!Z��[�i�V}���i.�ӿ���dˤt$X��1�$��4K�B(��|�O*{A�^�W�Z���P�PO����K~��zF\hye��I\,�;��:�(6���S�3��X_��^cZ^z����*ҥ�f��%���;Ҧ��A��q��M.J���q3Kd��z�o-�w���V~�
`|	P���L=� ��-ΒGp/��mIQ�2/\p����c¾�<,�ӮΚc����� h.��Br>�m�܉��#4�f<��S_�Q�تԢ����h��?B�.Cqc�)&������E����Q���d������]�bn�МԱ[>˿Ӳ�Znr�UH��:Y��>����վ��E�!�z���䚂�=)©���Y��7A��3K:�T(�ht��ѥE�M��ŜveW��_@v\bHV��Ȝ�5�(��(���]{�=,�1١�պ�l�w�Y�(�@D89���+|�hqU^_j$7��V�7���� t���ҭ#71
��b"r�ݘ���Z�a���Yx�
4���J1����i����
�Ֆ8D(�5�lR�
Bx̀l.$��I���dex
�ځ�<�6��_"����Z/�@��%ɥ ��V��#�TD]Fjy���Fo���$�к�[^�9
,ݯ������JEM�"�)��+6����[lb<�`��7��FE;�X�[��
����(��⡑F��z���ku���gɳ�K)I�i`�d� ]��-�"�����i��~��#�̒R��p[+r��ej ��h塌�ţ����s��#�����[�?����[��^�DC�S�l���T��n�|�:�u���(H����>z�ے�Γ���\�e
�*��Q��`��wZ��V�zkUn�eTo{�;�XX�m��m��6h��Aܐ�m`2&��<��Йi��5�3�
�qENR{
J	eI:@�5�x,Ss�:�R�S�ysB���8ۋ48�b��d���<м1�K�s���a�)�}i��̈́���lIa��&�&�_�yS �KgE1�1u,�]�²3*X���O0'9�B�� �,�gND_�(��1w.մC�qr����G�o3f=�&5����r����oa�]*��>zi�ZL�#�]���c��]5�B)��M�|F��1)���6j�À9���4G�g���[n���
rD���1�'�9@�	QINn�/�D �.u7�P�
C���L(�L0�΅�F
HM!$5ݠT���U`���,��6�)� �
���R�v��[��F�޾xU� .�����Q��8��s&˺�,�x�Ѻ���T�Z�q���c��ք�[��-� �M@�|�)5wz0�٧�������7��qD~@��fo�
�Jn9}��J��5GJ��O�	�����ڍp����ga�{��su�ɍ�7v�f���N?GwB�n�7��;�2{�i@(�8iM{�$�A��
e���m;!V��^g�G�v���ͨ����L��1�s�v?��Y[Q�˸���ȹ
�R��B}~��of��FL�NσS�T���©����m)2"2�v�X�t�o*�m�S�U�.�[��Q9cK�^�I��i���,�H*�G�4�l]��wC��bG	��m='�\^G����{̣�ֶ���۹2�OV�L� �,��б����s�������
�]�SԮ�A(2�t����LtX��TB'�$�\t��Y��X�
_������t߇snMR��%F�V#J�ݎNrs2*5HX�#C<~-h��I!�Ӓ�17-A��	�by�����=��O!��ؽ��&^;hFidI�#��AY�OШĒ���Ԓ���\�cЋ+M�Mp�b�����i�#Y♺%	��g�2�K�HE�#˚�,�JF�LH���HI�3	�~�i	!y#ܴ �Ng":t�nM��@D0��Fj�_pD�ח���J=�[�L:�{�膞0�h�y�D�~�1~e���_�)#��x�<��mdG����i:��؜߄W���a�%��i{x���ݻ�����������|���!ߌ���*}�eO
k���j�
����T:���5�}E���p��y��z�S�#�s��'��Y�٤;8=w�yM��,hi�Œ���3���3����>3���٧6�4C~Hj���+��V7m�oy9��+x��l5"OQ�7��YBu�<��ih�f��(�F�@/r�0�֠����|��kkY���5��R�f�uJf�a�Ăj�KVׁz��v|��(=���:C�]fo2�gM����QQ�[��}��=�LLK��tO���6;'���t7�"�[u	��\Z^�ʛL3�+d�$�sk�=��|җx��H�g��%�#Hk���).��%M����V�ކ��$Cu3�W��) *�J7�(���.���@?K�-�PD�K@V�<�6�X_�
�PAy��[-J��dsU��l�����k����`(T���P-]�.�v�BYQO�R1�Ȉf��`��}��Z�L�i)��x��j�J�4�1����gm����.��|�bn�|1�lُYnL�U�l��V�0bZu���F�Ηe��݃��a88R�XgZz�e�Zb[�ھ�Y8'a��Ή%k�ث݋9,�QyE�f9�|��|�
�E��|�;O����ݹ����5���T_[Ym.�W�����Ź����C�P��8��g�d�9W�~[ZZ�[��>Z�/՗W��ݥ��2YX���S}��"Yb7"K_h밵������¤�|A�Fg��ry���H��u[ޠ[�8��D9�Qu�������p��AN���#�u%!|��Rq� �����
`�2�'YE�BDaU�u+�;�J�
�������g�6�q"
cUH�¦*�0�ka#���l���/b��:q��A��FE
I��; t&-rVe��@��O��V^�$Is:���,t$k�|�Vy֊[d�ǈ����\5G��U��VS4&��Ɩ}e�r	�ѪG�u���V��Cr�>^�����>��jF~`
���6�r\W�\j�\�S�d���ժ�ӊTV="��$a+Xj<�iy�"g�LL��e&+�1iFH��oo���pswg{�
�_��Mr����qtD놪/���w,E)L:,���S�n�!.���
1F�U3\�:+���>z4~�1I�*�c��Q��	�4dܧB/(��a��N��gQg��N�
������ٜ��c}���u]6U\\�>��(���a�2p��\&���O�rd���R�5��T9�ZgVj��/u~5k�пହ�Sg
�M��.�l�s��,���ӷ��Mn�T���o�%�8��5URs��B�3��zK�E�ݨ���R7�"UD5��0�]�S��x���:��N����@&��:-��B�� s�xm��꛿��d���D�a�Š�AJ�>�5�7rӃ۞�:Kgx��֢�������`�2�]/������z����3�&֠d�����DKRC�i�>bM�+����Y��)�
پ�)�|���~�dS���s�C)*�kq�^�NO���zE���%�a!0�FZ�f��8�B��[_Y�6O#�8RX7�@��ċ��E�-�S�3��a�%���J������)R�3ugIS�5��,9���̫�FN��!68��<��%1�n����F'�_���e�Ya���;CE����j�q�x�������$>�֔��/'��f��u4���7�����ީl���mO�^>SRt�����J�IiH�(�Ғ)S�x�
�&��5��!�d�Bzė-C�p�(rML�59�J�#�m�o֨�ȗ�w�o���*9$��K��|���\�,H��W�gk�kK������5��|���������c�Z`!;�&�4��,�=�wi6��� ]�!'Ӻn%R4��K3�T�2��J�w��*�NrGH�R��R8����#�|�b��Z��,���������Me<ǉt�8��m4� 1�*4�����6�cFo"|L�d��:Le�j���c�����ϭI�a�9���I=+��T�U%��̧3'���D����T�NU��eg-U��R�^Ow������˝����ݝ#������N6���Ɇ���;�ϥj"o&�}�t����fB)��.��,���y��-�yG#��-<����w�9�
�-d��A'�B➞҈{!�#�:"-��W�R���Uٳ��Py��A�AK��\�c�Pw�B�7�N:n=��,b��,'�D�r��4�҄���j
�PY�4%�]89��-������&l�����z&w��v��s�8-չ�
�i%r-*Չ1'?�S�9����Ǻ��M֢��2JQ+�ߘ�r'N��V�K�\Fo��}���a�Z	+!��' 5!���?��:�/K&�7^���5g�+n��XP�W�/���B�^9�N�j
�������+R
� �����7]�1�s�F���*�:}�x�j<�J��tC�� ��V׭pkފgOB�A���K.�k�!wb�4.��A����@
�6}�^W�R�Ͷ�gO��\�O����FRP�U-��S���T��y=�A��X#9V��������Tl�ث����V��Oo�P�w��%�q�A�5��t�
q��m{Q5?���lUb����֛jr�*�	�Ѡ]�G�8-�zY�^f�wF��v�6 y�S&ExPƼ��$�m,?����DҒ�-�.�Ok�v�.	��`��292ME��`ʋ�s܎�WQ}��hK긠D�q����ӥ�M�s�J�rC���n}Q�_x��I�p���}{M�US����m6��
��tI����JZ�T���or��PPtٽqC��@�﹯l���Mӱ��ż�!��;5���dU��ww�lm7���4ȃ��>�y����s��Zۂ�� ֣�����Nߙ�9���0��R5]��R�]�@�f�iG���Bf+��:�8��8O<,y]��x���y���:7 {�?U8E*K�Gy�jU�0���,���p�0���ݓ����͎�����G������b�bJK���a����U���t{<���k���0M(%'� �+���A������7"���{�濧���vS�z�`:P
?��Ւֲ�45MvD�x K��<��+;_���o�Ŕ��½44n�y��ymM�s��X��Q�됨광�2z���kT[gY�}�}_�z�����uQ%�
�^�&��'�2
T AV�*��s=T��n*� �w�B#Q�O�M_Ͱ�������q�����$��@B%#�kYtFCh�J�RYLwh/�7��^8�ܵ8fVz�|��7����Ơ��dڿ��X,UN����^�Ϭo�J��J�x���4�6ډ��Ƶ��k�}R1��NW�W�^^)��g2;������������Ua9�$5�P�Fh:���rF_�Fy����cW�N�����#���f+faD[DLCb5��`.���=Z��7�P���^�}�\_�`m-�ј;l��6{���<ѕ<�Iӵ������mJ��-a숭]#4�N�.��:�	��Be�.K?�=`���Gmt�k�B)Hy;�?!�x0}.!��BsӨ�eԪ:��1_���C�d W�o�� ��|>��k�0I�;�3�S��X�R�2�o4$&��^��t�sVY0%�Y6)Q9�#� L�BY4j#�Y�*]ɐ�r��"[*b �JQY%��Q�nk+�}+��N��_
�\�s�7�w&aU7�:�i��N�F�P�cָ�
�9���N�zϚ՞p�ĺ=7�-�����b������O� ��L��� �5q M�Γ'9�RW�x�kA,6��B�S^`��t(���	���ފ��Rj3>��a	9(���z��f���H�'�N.�wD�Hm����3~�h�m�M%�L<�w@AKc0�L���;����a(�t�!�2&�Z�M��,���&R�B���5��&�U)PJ���J��/�I��e�
����/�$��`:�(�.����w/I%~��H��A�z� 뎘��T�g��O6+i�ƛLJ�y��qHvG����G�z���}D��y�~?ʪ/���h��F��/t�0_��9a
ư�%�~ӎyL{ �6�c���U	m���A�AH�p�e��*��;�L�uJjl�A#U��b���UɲGYY���o���_���ɄP�ȩ+��XE ��x-ZC�u�A�*{B��w�T�>ü�/��m���
�z!������藠�������XI{	�m8RJR���K�d���;�`xS����MU��hW�>��b[b�D7��``6�eFK2�
�
��:BQ!x���J}F�B^�f�R��b$��l�ûjg��K�ј�����se������D�U���U�^��Ϫ�B ���}���_����m�-NE��R�`�.鼴� H���+��Z╙	��C�����HM ��s��{T� �P��eΈp��ߠC�)h�1
B���O��ɤ�O�,"���@��/?x`�~ӽ����n���L��6ha�(��tA?
�N��	9tw�Ty�;	�6�dI���� *5]b���]}O��-TFI�ı�����&��ـ�0$2�I����S���VՓ��\c��p�,��@��0��E:*���enb��m�nU3���z��&���[密�&�c������u�Ǟ�������⊶X5IWƞ�8�WU�y��gJM�&��Fc5���I�W�
3	��ŢlZ,�<kB��S@�:l{��iؘ}���{.�5��V�j�D�7O�P��-�ͮHG�B�Hǔ�1�<R�+��*�J�g��W�X���S$�H��܈r�L[E~�J;�Z��n�eQw=��ț�`F`�����KL���TT铵1	ǊbfXy	Φv��.�L�AN�X���좟���O� �GS1�9I?KEl0^�E/��$�{~�3 ^�^Gu5��k��Ш�4�o�lvO&���Q�uQ�P����������S*#�2k�%f1�F&�=����$z��ڤ�Enף�^	>�����f�e5�"�Jtj�U9	]糹W0�(�mE��M�8��I�������[;s��<�z��N�J�͊ZU�D,�p�wB��
�mxk
m ENNʆR�%V���6�xRyN5�8:�����(���'5=�.c�% �E������3@�	��Q&#�M>
/
|�aJ��k����Z c'w���U�:�(
6�^Y�P�D"��h��Z���m$?CeH�o9a���{�NHħ����mmطw~�i��EHQ�gS�;jv�Щ\���16Ć��7d��6�
0�k8�2�y&l�,�����<���BTt9�Zh���t�qH^�5x`?�)��ԥ:�p���-e���Ugx���U9x��_L2x����b�S���C��%�����1�'ż䂈;*��5xo�dC�B
��,r�U`j���ի�Or�ĥ	e$J�AqJ���u��VV�������$6�l2����,%�o��?s_��n }U��q
�9wc�0ñ`��>��;Kz��3`�DN���ϒSw�u:�mk<n�� wo<�e� �߶��l�"���e�&�r-�@;EJ#�!{����6��Ju
T��,#A�K�����E̗���=�t~[�w,���Z;B*��@wf��d��������������WQ})��"u�`F��1u!�d�l"�x�� d��Gb)^����Q�y��*�y&���VM�[��N6�3���;�9�"5���P��:#���B����l|I�,��>t�������T��d���1�OO`9�� Rs��xM����5F�i ���?o��}#��/E�m5�T�}�5�ոW�����&�U�S9F��8U�h˷[8�V��.]��ft�T�?.���������Sn��I��	�1�VR�5v��E��_
�*�eK��1U��*�Rda{���ʆ&n���WR}̱��*���a0ʡ��Bɷ���
��xR%��Ke�̬��֭��V���Z�5�Z�-�ݚ/�f@=1�
d-�P�
 ,]!��m�Q�5G��I;q�:
)1S��z�Y�@p$��e�K��1�~��w�~\��W�2�����t�ɡ4R�E��D�I��ew;c��0O�#�{�2FM�������c2Tm��||��;}Yg��)@�kbE!3�XSܳE�����V�v��?�\�Qn��`C����
�wm����@��7��B�� �)��6��9�u�ꇴe*oQ�F)�"za>�HLOuT�K�!�\��t���zvYY�*0�U��P_8ll5��Sט��2X1��EOF�f۾�Ay^b�)���ɖ����î/G5�����z���'+e�Dn��4�f�h{�O����φ� �r_��0�1�t<K7ƍ˂O�� ��J��fD��A�[��x��EM*��@?�ZnFi����=�[Ў����́lĝ �:0����b✻M�5
���!�^4KRu2n� ���P� �4�E<;�&�7e���1�s�
Ø����x�N2�m�N��k���3K>.�>	]V���ɮ���0DQ����괜^�<d� �ʜw�~ޖ9y��0���]��b�[�˛}�����~+Ĥ����L"��	#vs����#\���%�4�K����p�\'ز<��?��<3�,��4A�y2^:=�S��u�� ���^�P�>���S��G�8��0���E|�i�����h9�n��n����={K6Y}��d���첄�Lm��mP�����������u@;d;�����]�I��)���ky��(�$���.�n��s�h���,�ҡP�t���*�c���X�p{� �����[�аQ�>Q��e{Zj���:�t�����4��灺dT
�<x�!Y���r���EP`ĲC_.�8fJ�^�&E́Q���˭�����E�B�1�'�~:6��m/���s�d-t{�qKr�x�j����r��y1NX���X�#܊0V�й~e�β�]��9��۰�=6=�R`]set|�F*��� � {E3Ҏ�u|�+3����A"�C�	BВ/�:U�� ��#��]�I���T~�8��m�P_Æ�G��=��DH���X	�$q�
���^e�+���"�E��&�T�t�V���B���7�^�Х��$4�=��8�ȅZ+~�F�s�=Y��#>LdB��[ww��귵����q-�Ϩ�qn&��v�
A� f3Sw6�GL�9<�=.�X

�8a�kr�H50j������,��a"-q7���)��wUr�}���vY0�Ѡ�\=���`�Pހ�"���;J���s��S�Z�ः�q��:s�x�-��J��6p1��>�sIɯ���Cp��Qs	�G}$Ls�����h��q��;{��o������o��;�JM�k�R
h��� �x����R��봝��3����ɺ���~ȴ�X�.�9袁������/{^��z�>#�m���;qO0	�%�$��W�s�a=��|���7uN��&�����W(����=��	�5��b#�̗
�7
<���
$Oy��m��#ְ_V�����Q$|_q��l�Rju5	��;���������䃹��`R��c�:�rh��P��.�tN��F�.�cA��:�Q�M�.A��&��h�
ǻD:�hhX|�Yn��f����n�|�A��y*΢�������G��kg�}����PB ��x����x�D3�	�	  �� ���