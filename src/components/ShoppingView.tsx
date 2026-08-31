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
  findSimilarDietFoods, resolveDietFoodCategory, detectSettingsCategoryFromFoodName,
  getPortionRules,
  formatPortionConvertedDisplay
} from '../utils/helpers';

export const ShoppingView: React.FC<{ 
  list: ShoppingListItem[]; 
  setList: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>; 
  settings: UserSettings;
  setSettings?: React.Dispatch<React.SetStateAction<UserSettings>>;
  foodPortions: FoodPortion[];
  foodCategories: string[];
  onAddFoodToSettings: (name: string, unit: string, category: string) => void;
  reserveItems: ShoppingListItem[];
  setReserveItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  pantryGroups: PantryGroup[];
  setPantryGroups: React.Dispatch<React.SetStateAction<PantryGroup[]>>;
  dietItems?: DietItem[];
}> = ({ list, setList, settings, setSettings, foodPortions, foodCategories, onAddFoodToSettings, reserveItems, setReserveItems, pantryGroups, setPantryGroups, dietItems }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [checkedSummaryItems, setCheckedSummaryItems] = useState<Set<string>>(new Set());
  const [showReserveOnSide, setShowReserveOnSide] = useState(false);
  const [showNewFoodModal, setShowNewFoodModal] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState<string>(foodCategories[0] || 'Sans catégorie');
  const [selectedMatchModeShopping, setSelectedMatchModeShopping] = useState<string>('__NEW__');

  // Similar items grouping states
  const [similarGroups, setSimilarGroups] = useState<ShoppingListItem[][]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(-1);
  const [selectedTargetItem, setSelectedTargetItem] = useState<ShoppingListItem | null>(null);
  const [selectedTargetUnit, setSelectedTargetUnit] = useState<string>('');
  const [conversions, setConversions] = useState<Record<string, string>>({});
  const [excludedItemIds, setExcludedItemIds] = useState<Set<string>>(new Set());

  const toggleExcludeItem = (id: string) => {
    setExcludedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // If the excluded item was selected as the target, select another non-excluded item
        if (selectedTargetItem?.id === id) {
          const group = similarGroups[currentGroupIndex];
          const remaining = group.filter(item => item.id !== id && !next.has(item.id));
          if (remaining.length > 0) {
            setSelectedTargetItem(remaining[0]);
            setSelectedTargetUnit(remaining[0].unit);
          } else {
            setSelectedTargetItem(null);
          }
        }
      }
      return next;
    });
  };

  // Normalization and similar items logic
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .trim();
  };

  const getKeywords = (name: string): string[] => {
    const normalized = normalizeName(name);
    const stopWords = new Set([
      "de", "du", "des", "le", "la", "les", "un", "une", "et", "au", "aux", "en", "par", "pour", "sur", "dans", "avec", "sans", "d", "l",
      "frais", "fraiche", "fraiches", "cuit", "cuite", "cuits", "cuites", "cru", "crue", "crus", "crues", "bio", "maison", "petit", "petits", "grande", "grands"
    ]);
    return normalized
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word));
  };

  const findSimilarGroups = (items: ShoppingListItem[]): ShoppingListItem[][] => {
    const groups: ShoppingListItem[][] = [];
    const visited = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      if (visited.has(items[i].id)) continue;
      const currentKeywords = getKeywords(items[i].name);
      if (currentKeywords.length === 0) continue;

      const currentGroup: ShoppingListItem[] = [items[i]];
      const matchedIndices: number[] = [i];

      for (let j = i + 1; j < items.length; j++) {
        if (visited.has(items[j].id)) continue;
        const otherKeywords = getKeywords(items[j].name);
        
        const hasOverlap = currentKeywords.some(kw => otherKeywords.includes(kw));
        if (hasOverlap) {
          currentGroup.push(items[j]);
          matchedIndices.push(j);
        }
      }

      if (currentGroup.length > 1) {
        matchedIndices.forEach(idx => visited.add(items[idx].id));
        groups.push(currentGroup);
      }
    }
    return groups;
  };

  const handleValidatePreList = () => {
    const groups = findSimilarGroups(list);
    if (groups.length > 0) {
      setSimilarGroups(groups);
      setCurrentGroupIndex(0);
      const firstGroup = groups[0];
      setSelectedTargetItem(firstGroup[0]);
      setSelectedTargetUnit(firstGroup[0].unit);
      setConversions({});
      setExcludedItemIds(new Set());
    } else {
      setCheckedSummaryItems(new Set());
      setShowSummary(true);
    }
  };

  const handleValidateCurrentGroup = () => {
    const group = similarGroups[currentGroupIndex];
    const activeGroupItems = group.filter(item => !excludedItemIds.has(item.id));

    if (activeGroupItems.length <= 1) {
      // Nothing to group, transition to next group or finish
      const nextIndex = currentGroupIndex + 1;
      if (nextIndex < similarGroups.length) {
        setCurrentGroupIndex(nextIndex);
        const nextGroup = similarGroups[nextIndex];
        setSelectedTargetItem(nextGroup[0]);
        setSelectedTargetUnit(nextGroup[0].unit);
        setConversions({});
        setExcludedItemIds(new Set());
      } else {
        setSimilarGroups([]);
        setCurrentGroupIndex(-1);
        setCheckedSummaryItems(new Set());
        setShowSummary(true);
      }
      return;
    }

    if (!selectedTargetItem || excludedItemIds.has(selectedTargetItem.id)) {
      alert("Veuillez choisir un aliment à conserver parmi les aliments non exclus.");
      return;
    }

    let totalAmount = 0;
    for (const item of activeGroupItems) {
      if (item.unit !== selectedTargetUnit) {
        const valStr = conversions[item.id];
        if (!valStr || isNaN(parseFloat(valStr)) || parseFloat(valStr) <= 0) {
          alert(`Veuillez renseigner une valeur numérique valide pour : ${item.name} (${item.amount} ${item.unit}).`);
          return;
        }
      }
    }

    for (const item of activeGroupItems) {
      if (item.unit === selectedTargetUnit) {
        totalAmount += item.amount;
      } else {
        totalAmount += parseFloat(conversions[item.id]);
      }
    }

    const updatedList = list.map(item => {
      if (item.id === selectedTargetItem.id) {
        return {
          ...item,
          name: selectedTargetItem.name,
          amount: totalAmount,
          unit: selectedTargetUnit
        };
      }
      return item;
    }).filter(item => {
      if (excludedItemIds.has(item.id)) return true;
      if (item.id === selectedTargetItem.id) return true;
      return !group.some(g => g.id === item.id);
    });

    setList(updatedList);

    const nextIndex = currentGroupIndex + 1;
    if (nextIndex < similarGroups.length) {
      setCurrentGroupIndex(nextIndex);
      const nextGroup = similarGroups[nextIndex];
      setSelectedTargetItem(nextGroup[0]);
      setSelectedTargetUnit(nextGroup[0].unit);
      setConversions({});
      setExcludedItemIds(new Set());
    } else {
      setSimilarGroups([]);
      setCurrentGroupIndex(-1);
      setCheckedSummaryItems(new Set());
      setShowSummary(true);
    }
  };

  const handleSkipCurrentGroup = () => {
    const nextIndex = currentGroupIndex + 1;
    if (nextIndex < similarGroups.length) {
      setCurrentGroupIndex(nextIndex);
      const nextGroup = similarGroups[nextIndex];
      setSelectedTargetItem(nextGroup[0]);
      setSelectedTargetUnit(nextGroup[0].unit);
      setConversions({});
      setExcludedItemIds(new Set());
    } else {
      setSimilarGroups([]);
      setCurrentGroupIndex(-1);
      setCheckedSummaryItems(new Set());
      setShowSummary(true);
    }
  };

  const handleSkipAllGrouping = () => {
    setSimilarGroups([]);
    setCurrentGroupIndex(-1);
    setCheckedSummaryItems(new Set());
    setShowSummary(true);
  };

  // Portion configuration states
  const [showPortionsConfigModal, setShowPortionsConfigModal] = useState(false);
  const [portionSearchQuery, setPortionSearchQuery] = useState('');
  const [showPortionsExportImportModal, setShowPortionsExportImportModal] = useState(false);
  const [showClearAllPortionsModal, setShowClearAllPortionsModal] = useState(false);
  const [portionsImportStatus, setPortionsImportStatus] = useState<string | null>(null);
  const [showAddPortionFoodModal, setShowAddPortionFoodModal] = useState(false);
  const [portionFoodName, setPortionFoodName] = useState('');
  const [portionCategory, setPortionCategory] = useState<string>('Sans catégorie');
  const [portionRules, setPortionRules] = useState<PortionRule[]>([
    { id: '1', baseAmount: 7, baseUnit: 'portion(s)', purchaseAmount: 1, purchaseUnit: 'pièce(s)' }
  ]);
  const [portionToDelete, setPortionToDelete] = useState<FoodPortion | null>(null);

  const exportPortionsToExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("La bibliothèque Excel n'est pas disponible.");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Portions
    const portionsData: any[] = [];
    (foodPortions || []).forEach(item => {
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

    // Sheet 2: Unités Portions
    const portionUnitsData = getAvailablePortionUnits(settings).map(u => ({
      "Unité": u,
      "Type": (settings?.customPortionUnits || []).includes(u) ? "Personnalisée" : "Standard"
    }));
    const wsPortionUnits = XLSX.utils.json_to_sheet(portionUnitsData);
    XLSX.utils.book_append_sheet(workbook, wsPortionUnits, "Unités Portions");

    XLSX.writeFile(workbook, `culinashare_portions_${today}.xlsx`);
  };

  const importPortionsFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    const file = e.target.files?.[0];
    if (!file || !XLSX) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const sheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("portion") && !s.toLowerCase().includes("unit")) 
          || wb.SheetNames.find((s: string) => s.toLowerCase().includes("aliment") && !s.toLowerCase().includes("unit")) 
          || wb.SheetNames[0];

        if (!sheetName || !wb.Sheets[sheetName]) {
          alert("Aucune feuille de données valide trouvée dans le fichier Excel.");
          return;
        }

        // Process Unités Portions if present
        const portionUnitsSheet = wb.SheetNames.find((s: string) => 
          s.toLowerCase().includes("unit") && s.toLowerCase().includes("portion")
        );
        let customPortionUnitsFromExcel: string[] = [];
        let portionUnitsListFromExcel: string[] = [];
        if (portionUnitsSheet) {
          const wsUnits = wb.Sheets[portionUnitsSheet];
          const unitsData = XLSX.utils.sheet_to_json(wsUnits) as any[];
          unitsData.forEach(row => {
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

        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          alert("Le fichier Excel sélectionné est vide.");
          return;
        }

        let updatedCount = 0;

        if (setSettings) {
          setSettings(prev => {
            const current = [...(prev.foodPortions || [])];
            let updatedCustomPortionUnits = [...(prev.customPortionUnits || [])];
            let updatedPortionUnitsList = prev.portionUnitsList ? [...prev.portionUnitsList] : undefined;

            if (portionUnitsListFromExcel.length > 0) {
              updatedPortionUnitsList = Array.from(new Set([...(updatedPortionUnitsList || MASTER_PORTION_UNITS), ...portionUnitsListFromExcel]));
            }
            customPortionUnitsFromExcel.forEach(u => {
              if (!updatedCustomPortionUnits.includes(u)) {
                updatedCustomPortionUnits.push(u);
              }
            });

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
              const idx = current.findIndex(p => p.name.trim().toLowerCase() === entry.name.toLowerCase());
              const firstRule = entry.rules[0] || {
                id: Math.random().toString(36).substr(2, 9),
                baseAmount: 1,
                baseUnit: 'portion(s)',
                purchaseAmount: 1,
                purchaseUnit: 'pièce(s)',
                minThreshold: undefined
              };

              const updatedItem: FoodPortion = {
                id: idx >= 0 ? current[idx].id : Math.random().toString(36).substr(2, 9),
                name: entry.name,
                category: entry.category || (idx >= 0 ? current[idx].category : undefined),
                baseAmount: firstRule.baseAmount,
                baseUnit: firstRule.baseUnit,
                purchaseAmount: firstRule.purchaseAmount,
                purchaseUnit: firstRule.purchaseUnit,
                amount: firstRule.baseAmount,
                unit: firstRule.baseUnit,
                rules: entry.rules
              };

              if (idx >= 0) {
                current[idx] = updatedItem;
              } else {
                current.push(updatedItem);
              }
              updatedCount++;
            });

            return {
              ...prev,
              foodPortions: current,
              customPortionUnits: updatedCustomPortionUnits,
              portionUnitsList: updatedPortionUnitsList
            };
          });

          setPortionsImportStatus(`${updatedCount} aliment(s) et portions importé(s) / mis à jour avec succès !`);
          setTimeout(() => setPortionsImportStatus(null), 5000);
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const allAvailableFoods = useMemo(() => {
    const names = new Set<string>();
    (foodPortions || []).forEach(f => f.name && names.add(f.name.trim()));
    (dietItems || []).forEach(d => d.name && names.add(d.name.trim()));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [foodPortions, dietItems]);

  const configuredPortions = useMemo(() => {
    return (foodPortions || [])
      .filter(p => p.name && p.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [foodPortions]);

  const handleSelectFoodForPortion = (foodName: string) => {
    setPortionFoodName(foodName);
    const existing = (foodPortions || []).find(p => p.name.trim().toLowerCase() === foodName.trim().toLowerCase());
    if (existing) {
      const existingRules = getPortionRules(existing);
      setPortionRules(existingRules.map(r => ({ ...r, id: r.id || Math.random().toString(36).substr(2, 9), minThreshold: r.minThreshold })));
      setPortionCategory(existing.category || 'Sans catégorie');
    }
  };

  const handleAddRuleRow = () => {
    setPortionRules(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        baseAmount: 1,
        baseUnit: 'portion(s)',
        purchaseAmount: 1,
        purchaseUnit: 'pièce(s)',
        minThreshold: undefined
      }
    ]);
  };

  const handleRemoveRuleRow = (ruleId: string) => {
    if (portionRules.length <= 1) return;
    setPortionRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleUpdateRuleRow = (ruleId: string, field: keyof PortionRule, value: any) => {
    setPortionRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSavePortionRule = () => {
    if (!portionFoodName.trim()) return;
    const name = portionFoodName.trim();
    if (setSettings) {
      setSettings(prev => {
        const current = prev.foodPortions || [];
        const norm = name.toLowerCase();
        const idx = current.findIndex(p => p.name.trim().toLowerCase() === norm);

        const validRules: PortionRule[] = (portionRules.length > 0 ? portionRules : [{
          id: Math.random().toString(36).substr(2, 9),
          baseAmount: 1,
          baseUnit: 'portion(s)',
          purchaseAmount: 1,
          purchaseUnit: 'pièce(s)',
          minThreshold: undefined
        }]).map(r => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          baseAmount: isNaN(r.baseAmount) || r.baseAmount <= 0 ? 1 : Number(r.baseAmount),
          baseUnit: r.baseUnit || 'portion(s)',
          purchaseAmount: isNaN(r.purchaseAmount) || r.purchaseAmount <= 0 ? 1 : Number(r.purchaseAmount),
          purchaseUnit: r.purchaseUnit || 'pièce(s)',
          minThreshold: (r.minThreshold !== undefined && r.minThreshold !== null && !isNaN(Number(r.minThreshold)) && Number(r.minThreshold) > 0) ? Number(r.minThreshold) : undefined
        }));

        const firstRule = validRules[0];
        const updatedItem: FoodPortion = {
          id: idx >= 0 ? current[idx].id : Math.random().toString(36).substr(2, 9),
          name: name,
          amount: firstRule.baseAmount,
          unit: firstRule.baseUnit,
          category: portionCategory && portionCategory !== 'Épicerie' ? (portionCategory === 'Sans catégorie' ? undefined : portionCategory) : (idx >= 0 && current[idx].category ? current[idx].category : undefined),
          baseAmount: firstRule.baseAmount,
          baseUnit: firstRule.baseUnit,
          purchaseAmount: firstRule.purchaseAmount,
          purchaseUnit: firstRule.purchaseUnit,
          rules: validRules
        };

        let nextPortions = [...current];
        if (idx >= 0) {
          nextPortions[idx] = updatedItem;
        } else {
          nextPortions.push(updatedItem);
        }
        return { ...prev, foodPortions: nextPortions };
      });
    }
    setShowAddPortionFoodModal(false);
    setPortionFoodName('');
  };

  const handleDeletePortionRule = (foodId: string) => {
    if (setSettings) {
      setSettings(prev => ({
        ...prev,
        foodPortions: (prev.foodPortions || []).filter(p => p.id !== foodId)
      }));
    }
  };

  const handleClearAllPortions = () => {
    if (setSettings) {
      setSettings(prev => ({
        ...prev,
        foodPortions: []
      }));
    }
    setShowClearAllPortionsModal(false);
  };

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unité');

  const allPortionNamesShopping = useMemo(() => {
    return (foodPortions || []).map(fp => fp.name.trim()).filter(Boolean);
  }, [foodPortions]);

  const similarShoppingSuggestions = useMemo(() => {
    if (!newItemName) return [];
    return findSimilarDietFoods(newItemName, allPortionNamesShopping);
  }, [newItemName, allPortionNamesShopping]);

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

    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const normalizedInput = normalize(name);
    const existing = foodPortions.find(fp => normalize(fp.name) === normalizedInput);

    if (!existing) {
      setSelectedMatchModeShopping('__NEW__');
      setShowNewFoodModal(true);
      return;
    }

    onAddFoodToSettings(name, unit, existing.category || 'Sans catégorie');

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

  const confirmNewFood = () => {
    let nameToAdd = newItemName.trim();
    let categoryToAdd = newFoodCategory;

    if (selectedMatchModeShopping !== '__NEW__' && selectedMatchModeShopping) {
      nameToAdd = selectedMatchModeShopping;
      const existing = foodPortions.find(fp => fp.name.toLowerCase() === selectedMatchModeShopping.toLowerCase());
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
    setList(prev => [item, ...prev]);
    setNewItemName('');
    setNewItemAmount(1);
    setSelectedMatchModeShopping('__NEW__');
    setShowNewFoodModal(false);
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
    const listCopy: ShoppingListItem[] = [];
    (list || []).forEach(item => {
      const existing = listCopy.find(
        i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim() && 
          (i.unit.toLowerCase().trim() === item.unit.toLowerCase().trim() ||
           convertUnitAmount(1, i.unit, item.unit) !== null)
      );
      if (existing) {
        const converted = convertUnitAmount(item.amount, item.unit, existing.unit);
        if (converted !== null) {
          existing.amount = roundShoppingAmount(existing.amount + converted, existing.unit);
        } else {
          existing.amount = roundShoppingAmount(existing.amount + item.amount, existing.unit);
        }
      } else {
        listCopy.push({ ...item, amount: roundShoppingAmount(item.amount, item.unit), id: item.id || Math.random().toString(36).substr(2, 9) });
      }
    });
    return listCopy.sort((a, b) => a.name.localeCompare(b.name));
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
      const portion = (foodPortions || []).find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      const cat = portion?.category || detectSettingsCategoryFromFoodName(item.name);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [consolidatedList, foodPortions]);

  const summaryCategories = useMemo(() => {
    const defaultCats = settings.foodCategories || FOOD_CATEGORIES;
    const extraCats = Object.keys(groupedConsolidatedList).filter(c => !defaultCats.includes(c));
    return [...defaultCats, ...extraCats];
  }, [settings.foodCategories, groupedConsolidatedList]);

  return (
    <div className={`mx-auto space-y-8 animate-fadeIn pb-32 px-2 relative transition-all duration-300 ${showReserveOnSide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="sticky top-0 z-30 bg-purple-50/95 backdrop-blur-sm py-4 -mx-2 px-4 sm:px-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Liste de courses</h2>
            <p className="text-sm font-bold text-purple-400 mt-1 uppercase tracking-widest">
              {(list || []).filter(i => !i.checked).length}/{(list || []).length} articles en attente
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setShowPortionsConfigModal(true)} 
              className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>⚙️</span>
              <span>Paramétrer les portions</span>
            </button>
            <button 
              onClick={() => setConfirmClearAll(true)} 
              className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Tout effacer
            </button>
          </div>
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
              {getAvailableUnits(settings).map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
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
            sortedShoppingList.map(i => {
              const converted = formatPortionConvertedDisplay(i.name, i.amount, i.unit, foodPortions);
              return (
                <div key={i.id} className={`p-5 flex gap-5 items-center transition-all ${i.checked ? 'bg-green-50/20' : ''}`}>
                  <div onClick={() => toggle(i.id)} className={`w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${i.checked ? 'bg-green-500 border-green-500' : 'border-gray-100 bg-white'}`}>
                    {i.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg ${i.checked ? 'line-through text-gray-300' : 'text-gray-800'}`}>{i.name}</p>
                    {converted.hasRule && (
                      <p className="text-xs font-extrabold text-purple-600 mt-0.5 flex items-center gap-1">
                        <span>🛒 Équivalence :</span>
                        <span className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">{converted.formatted}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="number"
                      className="w-20 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
                      value={i.amount}
                      onChange={(e) => updateAmount(i.id, Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                    />
                    <span className={`text-[10px] font-black ${i.checked ? 'text-gray-300' : 'text-purple-400'}`}>{i.unit}</span>
                  </div>
                  <button onClick={() => remove(i.id)} className="text-gray-200 hover:text-red-400 transition-colors font-bold text-xl ml-2">×</button>
                </div>
              );
            })
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
                        className="w-20 p-1 text-center font-black text-xs bg-purple-50 text-purple-600 rounded-lg outline-none focus:ring-1 focus:ring-purple-300 transition-all border border-transparent hover:border-purple-200"
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
          <button onClick={handleValidatePreList} className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-green-100 hover:scale-105 transition-all active:scale-95 cursor-pointer">
             🚀 Valider la Pré liste
          </button>
        </div>
      )}

      {/* MODAL REGROUPEMENT ALIMENTS SIMILAIRES */}
      {similarGroups.length > 0 && currentGroupIndex >= 0 && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-[36px] sm:rounded-[40px] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 shrink-0 bg-purple-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-xl uppercase tracking-widest">
                  Regroupement d'aliments 🔄
                </span>
                <span className="text-xs font-black text-gray-400">
                  Groupe {currentGroupIndex + 1} / {similarGroups.length}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                Regrouper les aliments similaires ?
              </h3>
              <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">
                Nous avons détecté des aliments similaires. Vous pouvez en exclure certains (ex: "pommes" d'un lot de "pommes de terre") afin qu'ils restent séparés dans la pré-liste finale.
              </p>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {/* Étape 1 : Choisir l'aliment final & exclure */}
              <div className="space-y-3">
                <label className="text-xs font-black text-purple-600 uppercase tracking-widest block">
                  1. Choisir l'aliment final à conserver (ou exclure du regroupement) :
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {similarGroups[currentGroupIndex].map(item => {
                    const isExcluded = excludedItemIds.has(item.id);
                    const isSelected = selectedTargetItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                          isExcluded
                            ? 'border-red-100 bg-red-50/30 opacity-75'
                            : isSelected
                            ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        {/* Exclude Toggle button */}
                        <button
                          type="button"
                          onClick={() => toggleExcludeItem(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 transition-all cursor-pointer ${
                            isExcluded
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-white border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200'
                          }`}
                          title={isExcluded ? "Réintégrer dans le regroupement" : "Exclure du regroupement (conserver séparé dans la liste)"}
                        >
                          {isExcluded ? 'Exclu ❌' : 'Exclure 🚫'}
                        </button>

                        {/* Select as Target (only clickable if not excluded) */}
                        <div
                          onClick={() => {
                            if (!isExcluded) {
                              setSelectedTargetItem(item);
                              setSelectedTargetUnit(item.unit);
                            }
                          }}
                          className={`flex-1 flex items-center justify-between gap-3 ${!isExcluded ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        >
                          <div className="flex items-center gap-3">
                            {!isExcluded && (
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                )}
                              </div>
                            )}
                            <span className={`font-bold text-sm sm:text-base ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-xl shrink-0 ${
                            isExcluded 
                              ? 'bg-gray-100 text-gray-400' 
                              : 'bg-purple-100/80 text-purple-700'
                          }`}>
                            {item.amount} {item.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Étape 2 : Choisir l'unité */}
              {similarGroups[currentGroupIndex].filter(i => !excludedItemIds.has(i.id)).length > 1 && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest block">
                    2. Choisir l'unité finale de cumul :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const activeUnits = Array.from(new Set(
                        similarGroups[currentGroupIndex]
                          .filter(i => !excludedItemIds.has(i.id))
                          .map(i => i.unit)
                      ));
                      const unitsToDisplay = activeUnits.length > 0 ? activeUnits : Array.from(new Set(similarGroups[currentGroupIndex].map(i => i.unit)));
                      return unitsToDisplay.map(unit => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setSelectedTargetUnit(unit)}
                          className={`px-4 py-2.5 rounded-xl border-2 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                            selectedTargetUnit === unit
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {unit || 'Sans unité'}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Étape 3 : Renseigner les équivalences d'unités si différent */}
              {similarGroups[currentGroupIndex].some(item => !excludedItemIds.has(item.id) && item.unit !== selectedTargetUnit) && 
               similarGroups[currentGroupIndex].filter(i => !excludedItemIds.has(i.id)).length > 1 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="text-xs font-black text-purple-600 uppercase tracking-widest block">
                    3. Renseigner les équivalences d'unités :
                  </label>
                  <p className="text-xs text-gray-400 font-bold">
                    Veuillez indiquer la correspondance pour les articles exprimés dans une autre unité :
                  </p>
                  <div className="space-y-3">
                    {similarGroups[currentGroupIndex]
                      .filter(item => !excludedItemIds.has(item.id) && item.unit !== selectedTargetUnit)
                      .map(item => (
                        <div key={item.id} className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-2">
                          <p className="text-xs sm:text-sm font-bold text-amber-950">
                            Combien de <span className="font-black text-purple-700">{selectedTargetUnit}</span> voulez-vous mettre pour <span className="font-black text-amber-900">{item.amount} {item.unit}</span> de <span className="font-black">{item.name}</span> ?
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="any"
                              value={conversions[item.id] || ''}
                              onChange={(e) => setConversions(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Ex: 150"
                              className="flex-1 p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-purple-200"
                            />
                            <span className="text-xs font-black text-purple-600 uppercase tracking-widest shrink-0">
                              {selectedTargetUnit}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with buttons */}
            <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50/50 shrink-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleValidateCurrentGroup}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  Regrouper & Continuer
                </button>
                <button
                  type="button"
                  onClick={handleSkipCurrentGroup}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 p-4 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer text-center"
                >
                  Ne pas regrouper ce groupe
                </button>
              </div>
              <button
                type="button"
                onClick={handleSkipAllGrouping}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer text-center"
              >
                Continuer sans modifier (Valider tout directement)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉCAPITULATIF FINAL */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-10 pb-24">
             <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-4 pb-8 flex justify-between items-center border-b -mx-6 px-6">
               <div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">Liste de courses finale</h2>
                 <p className="text-sm font-bold text-green-600 mt-1 uppercase tracking-widest">
                   {checkedSummaryItems.size}/{consolidatedList.length} articles validés
                 </p>
               </div>
               <button onClick={() => setShowSummary(false)} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-all cursor-pointer">×</button>
             </header>

             <div className="space-y-8">
                {summaryCategories.map(cat => {
                  const items = groupedConsolidatedList[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest border-b border-purple-100 pb-2 px-2">{cat}</h3>
                      <div className="bg-white rounded-[40px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                        {items.map(item => {
                          const converted = formatPortionConvertedDisplay(item.name, item.amount, item.unit, foodPortions);
                          return (
                            <div key={item.id} className="p-6 flex items-center transition-all">
                              <div onClick={() => toggleSummaryCheck(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mr-5 shrink-0 ${checkedSummaryItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                {checkedSummaryItems.has(item.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <div className="flex-1">
                                <span className={`font-bold text-xl block ${checkedSummaryItems.has(item.id) ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.name}</span>
                                {converted.hasRule && (
                                  <span className="text-xs text-gray-400 font-medium block mt-0.5">
                                    Cumul pré liste : {item.amount} {item.unit}
                                  </span>
                                )}
                              </div>
                              <span className={`font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-2xl text-sm ${checkedSummaryItems.has(item.id) ? 'opacity-50' : ''}`}>
                                {converted.formatted}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
             </div>

             <div className="pt-8 space-y-4">
                <button 
                  onClick={() => {
                    setList([]);
                    setPantryGroups(prev => prev.map(g => ({
                      ...g,
                      items: g.items.map(i => ({ ...i, checked: false }))
                    })));
                    setShowSummary(false);
                  }} 
                  className="w-full bg-green-600 text-white p-6 rounded-3xl font-black shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  🚀 Supprimer la liste & la pré liste
                </button>
                <button 
                  onClick={() => setShowSummary(false)} 
                  className="w-full bg-gray-100 text-gray-500 p-6 rounded-3xl font-black hover:bg-gray-200 transition-all"
                >
                  Revenir à ma pré liste
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

      {/* MODAL NOUVEL ALIMENT (Ajout rapide) */}
      {showNewFoodModal && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-slideUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">✨</div>
            <h3 className="text-xl font-black text-gray-800">Aliment à classer</h3>
            <p className="text-gray-500 font-medium text-xs">
              L'article <span className="text-purple-600 font-bold">"{newItemName}"</span> n'est pas encore enregistré.
            </p>

            <div className="space-y-3 text-left">
              {/* Mode Créer nouveau */}
              <button
                type="button"
                onClick={() => setSelectedMatchModeShopping('__NEW__')}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectedMatchModeShopping === '__NEW__'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs'
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
                  selectedMatchModeShopping === '__NEW__' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                }`}>
                  {selectedMatchModeShopping === '__NEW__' && <span className="text-[10px] font-black">✓</span>}
                </div>
              </button>

              {/* Suggestions existantes */}
              {similarShoppingSuggestions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider pl-1 mb-1.5">
                    Ou utiliser un aliment existant :
                  </p>
                  <div className="space-y-1.5">
                    {similarShoppingSuggestions.map(sug => {
                      const isSug = selectedMatchModeShopping === sug;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setSelectedMatchModeShopping(sug)}
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

              {/* Choix de la catégorie si __NEW__ */}
              {selectedMatchModeShopping === '__NEW__' && (
                <div className="space-y-1 pt-2 animate-fadeIn">
                  <label className="text-[11px] font-black text-purple-600 uppercase tracking-widest ml-1">Choix de la catégorie</label>
                  <select 
                    className="w-full p-3.5 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
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
              <button onClick={() => setShowNewFoodModal(false)} className="flex-1 p-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs active:scale-95 transition-all">
                Annuler
              </button>
              <button 
                onClick={confirmNewFood} 
                className="flex-1 p-3.5 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-purple-100 active:scale-95 transition-all"
              >
                {selectedMatchModeShopping === '__NEW__' ? "Ajouter" : "Utiliser cet aliment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARAMÉTRER LES PORTIONS */}
      {showPortionsConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[160] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white relative">
              <button 
                onClick={() => setShowPortionsConfigModal(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚖️</span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Paramétrer les portions
                  </h3>
                </div>
                <button
                  onClick={() => setShowPortionsExportImportModal(true)}
                  className="mr-10 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Exporter / Importer en fichier Excel"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Exporter / Importer</span>
                </button>
              </div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium leading-relaxed">
                Définissez les équivalences de portions et d'unités d'achat pour vos aliments (ex: 7 portions = 1 pièce).
              </p>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <span className="text-xs font-black uppercase text-purple-600 tracking-wider">
                  Équivalences configurées
                </span>
                <div className="flex items-center gap-2">
                  {configuredPortions.length > 0 && (
                    <button
                      onClick={() => setShowClearAllPortionsModal(true)}
                      className="px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Supprimer toute la liste des portions"
                    >
                      <span>🗑️</span>
                      <span>Supprimer tout</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPortionsExportImportModal(true)}
                    className="px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Exporter / Importer la liste d'aliments et valeurs en Excel"
                  >
                    <span>📊</span>
                    <span>Exporter / Importer</span>
                  </button>
                  <button
                    onClick={() => {
                      setPortionFoodName('');
                      setPortionCategory('Sans catégorie');
                      setPortionRules([{ id: Math.random().toString(36).substr(2, 9), baseAmount: 7, baseUnit: 'portion(s)', purchaseAmount: 1, purchaseUnit: 'pièce(s)' }]);
                      setShowAddPortionFoodModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-black text-xs hover:bg-purple-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>➕</span>
                    <span>Ajouter aliment</span>
                  </button>
                </div>
              </div>

              {/* Champ de recherche pour sélectionner un aliment */}
              {configuredPortions.length > 0 && (
                <div className="relative mb-4">
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400 text-sm">🔍</span>
                    <input
                      type="text"
                      value={portionSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPortionSearchQuery(val);
                        if (val.trim()) {
                          const matched = configuredPortions.find(p => 
                            p.name.toLowerCase().includes(val.trim().toLowerCase())
                          );
                          if (matched) {
                            const el = document.getElementById(`portion-row-${matched.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }
                        }
                      }}
                      placeholder="Rechercher et accéder directement à un aliment..."
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-purple-200/80 focus:border-purple-500 focus:bg-white rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none transition-all shadow-inner"
                    />
                    {portionSearchQuery && (
                      <button
                        onClick={() => setPortionSearchQuery('')}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
                        title="Effacer la recherche"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Suggestions déroulantes si recherche active */}
                  {portionSearchQuery.trim() && (
                    <div className="mt-1 bg-white border border-purple-100 rounded-2xl shadow-lg overflow-hidden max-h-40 overflow-y-auto z-10 space-y-0.5 p-1">
                      {configuredPortions
                        .filter(p => p.name.toLowerCase().includes(portionSearchQuery.trim().toLowerCase()))
                        .map(p => {
                          const rules = getPortionRules(p);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setPortionSearchQuery(p.name);
                                const el = document.getElementById(`portion-row-${p.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-purple-50 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span>{p.name}</span>
                              <span className="text-[10px] text-purple-600 font-bold">
                                {rules.map(r => `${r.baseAmount} ${r.baseUnit} = ${r.purchaseAmount} ${r.purchaseUnit}`).join(' | ')}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {configuredPortions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  Aucune équivalence de portion configurée. Cliquez sur "Ajouter aliment" pour en créer une.
                </div>
              ) : (
                <div className="space-y-3">
                  {configuredPortions.map(p => {
                    const rules = getPortionRules(p);
                    const isHighlighted = portionSearchQuery.trim() && p.name.toLowerCase().includes(portionSearchQuery.trim().toLowerCase());
                    return (
                      <div 
                        key={p.id} 
                        id={`portion-row-${p.id}`}
                        className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${
                          isHighlighted 
                            ? 'bg-purple-50/90 border-purple-400 shadow-md ring-2 ring-purple-300 ring-offset-1 scale-[1.01]' 
                            : 'bg-gray-50 border-gray-200/80'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900">{p.name}</h4>
                          <div className="space-y-0.5 mt-1">
                            {rules.map((r, rIdx) => (
                              <div key={r.id || rIdx} className="text-xs font-bold text-purple-600 flex items-center gap-1.5 flex-wrap">
                                {rules.length > 1 && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-extrabold">
                                    #{rIdx + 1}
                                  </span>
                                )}
                                <span>{r.baseAmount} {r.baseUnit} = {r.purchaseAmount} {r.purchaseUnit}</span>
                                {r.minThreshold && r.minThreshold > 0 ? (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                    (dès {r.minThreshold} {r.baseUnit})
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPortionFoodName(p.name);
                              setPortionCategory(p.category || 'Sans catégorie');
                              const existingRules = getPortionRules(p);
                              setPortionRules(existingRules.map(r => ({ ...r, id: r.id || Math.random().toString(36).substr(2, 9), minThreshold: r.minThreshold })));
                              setShowAddPortionFoodModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-purple-600 font-bold text-xs cursor-pointer"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setPortionToDelete(p)}
                            className="p-2 text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer"
                            title="Supprimer la règle"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPortionsConfigModal(false)}
                className="px-6 py-2.5 rounded-xl font-black text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION TOUTES LES PORTIONS */}
      {showClearAllPortionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-red-100 flex flex-col animate-scaleUp p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-black text-gray-900">Supprimer toute la liste ?</h3>
            </div>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <strong className="text-red-600 font-black">l'intégralité des {configuredPortions.length} portions et équivalences</strong> configurées ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowClearAllPortionsModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleClearAllPortions}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-md transition-all cursor-pointer"
              >
                Tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION PORTION */}
      {portionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-red-100 flex flex-col animate-scaleUp p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-black text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Voulez-vous vraiment supprimer cet aliment des portions : <strong className="text-gray-900">{portionToDelete.name}</strong> ?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setPortionToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleDeletePortionRule(portionToDelete.id);
                  setPortionToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-md transition-all cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER / MODIFIER ALIMENT (PORTIONS & ÉQUIVALENCES MULTIPLES) */}
      {showAddPortionFoodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[180] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 flex flex-col animate-scaleUp max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-7 text-white relative">
              <button 
                onClick={() => setShowAddPortionFoodModal(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🍎</span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Aliment & Équivalences
                </h3>
              </div>
              <p className="text-purple-100 text-xs font-medium">
                Associez une ou plusieurs équivalences pour cet aliment (ex: par pièce, par g, par portion, etc.).
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Selection de l'aliment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-700 tracking-wider">
                  Sélectionner ou saisir un aliment
                </label>
                <input
                  type="text"
                  list="available-foods-portions-list"
                  placeholder="Ex: Cuisse de dinde, Salade verte, Pommes de terre..."
                  value={portionFoodName}
                  onChange={(e) => handleSelectFoodForPortion(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300"
                />
                <datalist id="available-foods-portions-list">
                  {allAvailableFoods.map(food => (
                    <option key={food} value={food} />
                  ))}
                </datalist>
              </div>

              {/* Catégorie */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-700 tracking-wider">
                  Rayon / Catégorie
                </label>
                <select
                  value={portionCategory}
                  onChange={(e) => setPortionCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
                >
                  <option value="Sans catégorie">Sans catégorie</option>
                    {(foodCategories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Section des équivalences multiples */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-purple-800 tracking-wider">
                      Équivalences ({portionRules.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRuleRow}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
                    title="Ajouter une équivalence supplémentaire"
                  >
                    <span>➕</span>
                    <span>Ajouter une équivalence</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {portionRules.map((rule, idx) => (
                    <div key={rule.id || idx} className="bg-purple-50/40 p-4 rounded-2xl border border-purple-200/80 space-y-3 relative shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 inline-flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span>Équivalence #{idx + 1}</span>
                        </span>
                        {portionRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRuleRow(rule.id || '')}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Supprimer cette équivalence"
                          >
                            <span>🗑️</span>
                            <span className="text-[10px]">Supprimer</span>
                          </button>
                        )}
                      </div>

                      {/* Quantité de base */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">
                          Quantité et unité de base (recette / portion)
                        </label>
                        <div className="grid grid-cols-12 gap-2.5 items-center">
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={rule.baseAmount}
                              onChange={(e) => handleUpdateRuleRow(rule.id || '', 'baseAmount', Number(e.target.value))}
                              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 font-black text-center text-xs text-purple-700 outline-none focus:ring-2 focus:ring-purple-300 shadow-xs"
                            />
                          </div>
                          <div className="col-span-8">
                            <select
                              value={rule.baseUnit}
                              onChange={(e) => handleUpdateRuleRow(rule.id || '', 'baseUnit', e.target.value)}
                              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer shadow-xs"
                            >
                              {getAvailablePortionUnits(settings).map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Quantité d'achat */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-indigo-800 tracking-wider block">
                          = Équivalence en unité d'achat (magasin)
                        </label>
                        <div className="grid grid-cols-12 gap-2.5 items-center">
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={rule.purchaseAmount}
                              onChange={(e) => handleUpdateRuleRow(rule.id || '', 'purchaseAmount', Number(e.target.value))}
                              className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-black text-center text-xs text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-300 shadow-xs"
                            />
                          </div>
                          <div className="col-span-8">
                            <select
                              value={rule.purchaseUnit}
                              onChange={(e) => handleUpdateRuleRow(rule.id || '', 'purchaseUnit', e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-bold text-xs text-gray-800 outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer shadow-xs"
                            >
                              {getAvailablePortionUnits(settings).map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Seuil de déclenchement minimum (Palier) */}
                      <div className="space-y-1 bg-white/70 p-2.5 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">
                            Palier / Seuil minimum de déclenchement
                          </label>
                          <span className="text-[9px] text-gray-400 font-semibold">(optionnel)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">Si quantité totale ≥</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Ex: 19"
                            value={rule.minThreshold ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              handleUpdateRuleRow(rule.id || '', 'minThreshold', val);
                            }}
                            className="w-24 bg-white border border-purple-200 rounded-lg px-2 py-1.5 font-black text-center text-xs text-purple-700 outline-none focus:ring-2 focus:ring-purple-300 shadow-xs"
                          />
                          <span className="text-xs font-black text-purple-700">{rule.baseUnit}</span>
                          <span className="text-[10px] text-gray-400 font-medium ml-auto">
                            {rule.minThreshold ? `(actif dès ${rule.minThreshold})` : '(auto)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview of rules */}
              {portionFoodName.trim() && (
                <div className="bg-gray-100 p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-xs font-black text-gray-700 block">
                    Règles configurées pour {portionFoodName.trim()} :
                  </span>
                  <div className="space-y-1">
                    {portionRules.map((rule, idx) => (
                      <p key={rule.id || idx} className="text-xs font-bold text-purple-700 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-extrabold">
                          #{idx + 1}
                        </span>
                        <span>{rule.baseAmount} {rule.baseUnit} = {rule.purchaseAmount} {rule.purchaseUnit}</span>
                        {rule.minThreshold && rule.minThreshold > 0 ? (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            (dès {rule.minThreshold} {rule.baseUnit})
                          </span>
                        ) : null}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddPortionFoodModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePortionRule}
                disabled={!portionFoodName.trim()}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md transition-all cursor-pointer"
              >
                Enregistrer l'aliment et ses équivalences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTER / IMPORTER PORTIONS EN EXCEL */}
      {showPortionsExportImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[190] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] sm:rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-7 text-white relative">
              <button 
                onClick={() => {
                  setShowPortionsExportImportModal(false);
                  setPortionsImportStatus(null);
                }}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">📊</span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Exporter / Importer les portions (Excel)
                </h3>
              </div>
              <p className="text-purple-100 text-xs font-medium">
                Gérez la liste de vos aliments et leurs valeurs de conversion via un fichier Excel (.xlsx).
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5 overflow-y-auto max-h-[75vh]">
              {portionsImportStatus && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2 animate-fadeIn">
                  <span className="text-lg">✅</span>
                  <span>{portionsImportStatus}</span>
                </div>
              )}

              {/* Action 1: Export */}
              <div className="bg-purple-50/60 p-5 rounded-3xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-xl shrink-0">
                    📥
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">Exporter en fichier Excel</h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Téléchargez un tableur contenant {configuredPortions.length} aliment(s) configuré(s) avec leurs portions et unités d'achat.
                    </p>
                  </div>
                </div>
                <button
                  onClick={exportPortionsToExcel}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-2xl font-black text-xs shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>📊</span>
                  <span>Télécharger le fichier Excel (.xlsx)</span>
                </button>
              </div>

              {/* Action 2: Import */}
              <div className="bg-indigo-50/60 p-5 rounded-3xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center text-xl shrink-0">
                    📤
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">Importer un fichier Excel</h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Importez ou mettez à jour les aliments avec leurs valeurs de portions depuis un fichier .xlsx ou .xls.
                    </p>
                  </div>
                </div>
                <label className="w-full bg-white hover:bg-indigo-50 text-indigo-700 border-2 border-dashed border-indigo-200 py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-center">
                  <span>📁</span>
                  <span>Sélectionner un fichier Excel à importer</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={importPortionsFromExcel}
                  />
                </label>
              </div>

              {/* Information / Colonnes supportées */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Colonnes reconnues dans le fichier Excel :</p>
                <p className="font-mono text-[10px] text-purple-700">
                  Aliment | Catégorie | Quantité base | Unité base | Quantité achat | Unité achat
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowPortionsExportImportModal(false);
                  setPortionsImportStatus(null);
                }}
                className="px-6 py-2.5 rounded-xl font-black text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
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

