import re

def main():
    with open("App.tsx", "r", encoding="utf-8") as f:
        code = f.read()

    # 1. Add getSlotOccupantInfo helper if not present
    helper_code = """
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
  const hasDietItems = !!(dietObj?.protein || dietObj?.vegetable || dietObj?.starch || dietObj?.dessert);

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
"""

    if "export const getSlotOccupantInfo" not in code:
        anchor = "const scaleTextQuantity = ("
        idx = code.find(anchor)
        if idx != -1:
            brace_count = 0
            in_fn = False
            fn_end = -1
            for i in range(idx, len(code)):
                if code[i] == '{':
                    brace_count += 1
                    in_fn = True
                elif code[i] == '}':
                    brace_count -= 1
                    if in_fn and brace_count == 0:
                        fn_end = i + 2
                        break
            code = code[:fn_end] + "\n" + helper_code + "\n" + code[fn_end:]
            print("Added getSlotOccupantInfo helper.")

    # 2. Update updateMealPlan & updateDietMealPlan to cleanly clear conflicting other meal types
    old_update_block = """  const updateMealPlan = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => {
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

  const updateDietMealPlan = (date: string, mealType: 'lunch' | 'dinner', slot: 'protein' | 'vegetable' | 'starch' | 'dessert' | 'dietRecipe' | 'servings', itemIdOrValue: string | number | undefined) => {
    setMealPlan(prev => {
      const day = prev[date] || {};
      const targetKey = mealType === 'lunch' ? 'dietLunch' : 'dietDinner';
      const dietObj = (mealType === 'lunch' ? day.dietLunch : day.dietDinner) || {};
      return {
        ...prev,
        [date]: {
          ...day,
          [targetKey]: {
            ...dietObj,
            [slot]: itemIdOrValue
          }
        }
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
  };"""

    new_update_block = """  const updateMealPlan = (date: string, mealType: 'lunch' | 'dinner' | 'extra', slot: 'recipe1' | 'recipe2' | 'viennoiseries' | 'sauces', recipeId: string | undefined, index?: number) => {
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
  };"""

    if old_update_block in code:
        code = code.replace(old_update_block, new_update_block)
        print("Updated updateMealPlan and updateDietMealPlan functions.")
    else:
        print("Warning: old_update_block exact match not found.")

    with open("App.tsx", "w", encoding="utf-8") as f:
        f.write(code)

if __name__ == "__main__":
    main()
