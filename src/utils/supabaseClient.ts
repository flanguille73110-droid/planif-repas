import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Recipe, MealPlanDay, ShoppingListItem, UserSettings, DietItem, DietRecipe, PantryGroup } from '../types';

export interface SupabaseAppData {
  recipes: Recipe[];
  mealPlan: Record<string, MealPlanDay>;
  settings: UserSettings;
  shoppingList: ShoppingListItem[];
  pantryGroups: PantryGroup[];
  reserveItems: ShoppingListItem[];
  sentMeals: string[];
  dietItems: DietItem[];
  dietServings: number;
  dietRecipes: DietRecipe[];
}

export type StorageMode = 'localstorage' | 'supabase';
export type SupabaseStatus = 'local' | 'connected' | 'disconnected' | 'connecting' | 'error';

export const CULINASHARE_TABLE_NAME = 'culinashare_data';

export const CULINASHARE_SQL_SCHEMA = `-- Script SQL à exécuter dans l'éditeur SQL de votre tableau de bord Supabase :

CREATE TABLE IF NOT EXISTS culinashare_data (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation des autorisations pour la clé publique (Anon) :
ALTER TABLE culinashare_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces public culinashare_data" ON culinashare_data;
CREATE POLICY "Acces public culinashare_data" 
ON culinashare_data 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);`;

let cachedClient: { url: string; key: string; client: SupabaseClient } | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const cleanUrl = (url || '').trim();
  const cleanKey = (key || '').trim();

  if (!cleanUrl || !cleanKey) return null;

  if (cachedClient && cachedClient.url === cleanUrl && cachedClient.key === cleanKey) {
    return cachedClient.client;
  }

  try {
    const client = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    cachedClient = { url: cleanUrl, key: cleanKey, client };
    return client;
  } catch (err) {
    console.error('Erreur création client Supabase:', err);
    return null;
  }
}

/**
 * Test la connectivité avec la base Supabase et la table de l'application
 */
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; tableReady?: boolean }> {
  const client = getSupabaseClient(url, key);
  if (!client) {
    return { success: false, message: "URL ou clé publique Supabase manquante ou invalide." };
  }

  try {
    const { data, error } = await client
      .from(CULINASHARE_TABLE_NAME)
      .select('key')
      .limit(1);

    if (error) {
      // Si la table n'existe pas encore ou permission
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          tableReady: false,
          message: `Connexion à Supabase établie avec succès ! La table "${CULINASHARE_TABLE_NAME}" doit être créée via le script SQL fourni.`
        };
      }
      return {
        success: false,
        message: `Erreur Supabase (${error.code || 'ERR'}): ${error.message}`
      };
    }

    return {
      success: true,
      tableReady: true,
      message: `Connexion à Supabase réussie ! La table "${CULINASHARE_TABLE_NAME}" est prête et synchronisée.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Échec de connexion : ${err?.message || 'Erreur réseau ou URL incorrecte'}`
    };
  }
}

/**
 * Sauvegarde l'ensemble des données de l'application dans la table de l'application
 */
export async function saveAppDataToSupabase(url: string, key: string, data: SupabaseAppData): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(url, key);
  if (!client) {
    return { success: false, error: "Client Supabase non initialisé." };
  }

  try {
    const records = [
      { key: 'recipes', value: data.recipes, updated_at: new Date().toISOString() },
      { key: 'mealPlan', value: data.mealPlan, updated_at: new Date().toISOString() },
      { key: 'settings', value: data.settings, updated_at: new Date().toISOString() },
      { key: 'shoppingList', value: data.shoppingList, updated_at: new Date().toISOString() },
      { key: 'pantryGroups', value: data.pantryGroups, updated_at: new Date().toISOString() },
      { key: 'reserveItems', value: data.reserveItems, updated_at: new Date().toISOString() },
      { key: 'sentMeals', value: data.sentMeals, updated_at: new Date().toISOString() },
      { key: 'dietItems', value: data.dietItems, updated_at: new Date().toISOString() },
      { key: 'dietServings', value: data.dietServings, updated_at: new Date().toISOString() },
      { key: 'dietRecipes', value: data.dietRecipes, updated_at: new Date().toISOString() },
    ];

    const { error } = await client
      .from(CULINASHARE_TABLE_NAME)
      .upsert(records, { onConflict: 'key' });

    if (error) {
      console.error('Erreur sauvegarde Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception sauvegarde Supabase:', err);
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Charge l'ensemble des données de l'application depuis la table Supabase
 */
export async function loadAppDataFromSupabase(url: string, key: string): Promise<{ success: boolean; data?: Partial<SupabaseAppData>; error?: string }> {
  const client = getSupabaseClient(url, key);
  if (!client) {
    return { success: false, error: "Client Supabase non initialisé." };
  }

  try {
    const { data: rows, error } = await client
      .from(CULINASHARE_TABLE_NAME)
      .select('key, value');

    if (error) {
      return { success: false, error: error.message };
    }

    if (!rows || rows.length === 0) {
      return { success: true, data: {} };
    }

    const result: Partial<SupabaseAppData> = {};
    rows.forEach((row: { key: string; value: any }) => {
      if (row.key === 'recipes') result.recipes = row.value;
      else if (row.key === 'mealPlan') result.mealPlan = row.value;
      else if (row.key === 'settings') result.settings = row.value;
      else if (row.key === 'shoppingList') result.shoppingList = row.value;
      else if (row.key === 'pantryGroups') result.pantryGroups = row.value;
      else if (row.key === 'reserveItems') result.reserveItems = row.value;
      else if (row.key === 'sentMeals') result.sentMeals = row.value;
      else if (row.key === 'dietItems') result.dietItems = row.value;
      else if (row.key === 'dietServings') result.dietServings = typeof row.value === 'number' ? row.value : parseFloat(row.value);
      else if (row.key === 'dietRecipes') result.dietRecipes = row.value;
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur de chargement' };
  }
}
