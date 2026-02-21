
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, Ingredient, ShoppingListItem } from "../types";
import { CATEGORIES } from "../constants";

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const findRecipeSuggestions = async (ingredients: string[], criteria: string): Promise<Recipe | null> => {
  try {
    // Initialize GoogleGenAI within the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Propose une recette détaillée en utilisant certains de ces ingrédients : ${ingredients.join(", ")}. 
                 Critères et appareil : ${criteria}. 
                 Si l'appareil est un Thermomix (TM7), inclus impérativement les réglages de température, temps et vitesse pour chaque étape.
                 IMPORTANT : La catégorie doit être EXACTEMENT l'une des suivantes : ${CATEGORIES.join(", ")}.
                 Réponds exclusivement en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                },
                required: ["name", "amount", "unit"],
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.NUMBER },
            cookTime: { type: Type.NUMBER },
            servings: { type: Type.NUMBER },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "ingredients", "instructions", "prepTime", "cookTime", "servings", "category"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(cleanJsonResponse(text));
    return { ...data, id: data.id || Math.random().toString(36).substr(2, 9) };
  } catch (error) {
    console.error("Service Error:", error);
    return null;
  }
};

export const searchCookidooRecipes = async (query: string): Promise<{ recipe: Recipe, sources: any[] } | null> => {
  try {
    // Initialize GoogleGenAI within the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Trouve la recette Thermomix officielle (format Cookidoo) pour : "${query}".
                 Extrais les ingrédients précis et les étapes avec réglages (Vitesse, Température, Temps).
                 Réponds exclusivement en JSON structuré selon le schéma Gestion cuisine.`,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is not strictly allowed with googleSearch grounding if we expect non-JSON,
        // but since we prompt for JSON and provide a schema, we keep it consistent with the user's intent
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                }
              }
            },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            prepTime: { type: Type.NUMBER },
            cookTime: { type: Type.NUMBER },
            servings: { type: Type.NUMBER },
            category: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (!text) return null;
    const data = JSON.parse(cleanJsonResponse(text));
    
    return {
      recipe: { ...data, id: Math.random().toString(36).substr(2, 9), tags: ['Cookidoo'], imageUrl: '' },
      sources
    };
  } catch (error) {
    console.error("Cookidoo Search Error:", error);
    return null;
  }
};

export const generateImageForRecipe = async (title: string, description: string): Promise<string | null> => {
  try {
    // Initialize GoogleGenAI within the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A professional, appetizing food photography of: ${title}. ${description}` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export interface PriceComparison {
  stores: {
    name: string;
    totalEstimated: number;
    notes: string;
    cheapestItems: string[];
  }[];
  bestChoice: string;
  savingTips: string;
}

export const comparePrices = async (items: ShoppingListItem[]): Promise<PriceComparison | null> => {
  try {
    // Initialize GoogleGenAI within the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const itemListStr = items.map(i => `${i.amount} ${i.unit} de ${i.name}`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse cette liste de courses et simule une comparaison de prix réaliste entre Intermarché, Leclerc et Auchan en France : ${itemListStr}.
                 Estime un total pour chaque enseigne. Identifie l'enseigne la moins chère globalement.
                 Réponds exclusivement en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  totalEstimated: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                  cheapestItems: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "totalEstimated", "notes", "cheapestItems"]
              }
            },
            bestChoice: { type: Type.STRING },
            savingTips: { type: Type.STRING }
          },
          required: ["stores", "bestChoice", "savingTips"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(cleanJsonResponse(text));
  } catch (error) {
    console.error("Comparison Error:", error);
    return null;
  }
};

export interface DriveLocation {
  brand: string;
  name: string;
  city: string;
  address?: string;
}

/**
 * Trouve les drives dans un rayon de 50km autour de Villers-Faucon (Somme/Aisne)
 */
export const findRegionalDrives = async (): Promise<DriveLocation[]> => {
  try {
    // Initialize GoogleGenAI within the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Quels sont les supermarchés Drive (Leclerc, Auchan, Intermarché) situés dans un rayon de 50km autour de Villers-Faucon (80240), couvrant les départements de la Somme (80) et de l'Aisne (02) ? Donne une liste structurée avec l'enseigne, le nom exact du magasin et la ville.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: 49.9765, // Villers-Faucon
              longitude: 3.0991
            }
          }
        }
      }
    });

    // We reuse the ai instance for the next call as well
    const parseResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transforme cette liste de supermarchés en JSON : "${response.text}". 
                 Format : Array<{brand: string, name: string, city: string}>. 
                 Brand doit être "Leclerc drive", "Auchan drive" ou "Intermarché drive".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              name: { type: Type.STRING },
              city: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(cleanJsonResponse(parseResponse.text)) as DriveLocation[];
  } catch (error) {
    console.error("Location Search Error:", error);
    return [];
  }
};
