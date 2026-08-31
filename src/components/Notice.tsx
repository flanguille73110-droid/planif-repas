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

export const Notice: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="text-center space-y-4">
        <h2 className="text-4xl font-black text-gray-800 tracking-tight">Notice d'utilisation</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto">
          Bienvenue dans votre assistant de gestion de cuisine. Voici un guide détaillé pour maîtriser toutes les fonctionnalités de l'application.
        </p>
      </header>

      <div className="grid gap-6">
        {/* RECETTES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-xl">📖</div>
            <h3 className="text-2xl font-black text-gray-800">Recettes</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            C'est votre bibliothèque culinaire. Vous pouvez y enregistrer toutes vos recettes favorites.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Ajouter</span> : Créez une nouvelle recette avec titre, catégorie, temps, ingrédients et étapes.</li>
            <li><span className="font-bold text-gray-700">Modifier</span> : Ajustez vos recettes existantes à tout moment.</li>
            <li><span className="font-bold text-gray-700">Portions</span> : Dans la fiche recette, ajustez le nombre de portions. Les quantités d'ingrédients s'adaptent automatiquement !</li>
            <li><span className="font-bold text-gray-700">Planning</span> : Programmez une recette directement dans votre calendrier depuis sa fiche détaillée.</li>
          </ul>
        </section>

        {/* RECHERCHE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-xl">🔍</div>
            <h3 className="text-2xl font-black text-gray-800">Recherche</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Trouvez rapidement l'inspiration parmi vos recettes enregistrées. Filtrez par nom ou par catégorie pour gagner du temps.
          </p>
        </section>

        {/* PLANNING */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl">📅</div>
            <h3 className="text-2xl font-black text-gray-800">Planning</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Organisez vos repas de la semaine pour une gestion optimale.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Midi & Soir</span> : Deux emplacements par repas pour plus de flexibilité.</li>
            <li><span className="font-bold text-gray-700">Extras</span> : Un espace dédié pour les viennoiseries, gâteaux, sauces et coulis.</li>
            <li><span className="font-bold text-gray-700">Courses</span> : Envoyez les ingrédients d'un repas planifié directement vers votre liste de courses en un clic.</li>
          </ul>
        </section>

        {/* RÉCURRENTS */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-xl">🔄</div>
            <h3 className="text-2xl font-black text-gray-800">Récurrents</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Gérez vos listes de courses habituelles (ex: "Petit déjeuner", "Produits d'entretien").
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Listes</span> : Créez des groupes de produits thématiques.</li>
            <li><span className="font-bold text-gray-700">Envoi rapide</span> : Cochez les produits manquants et cliquez sur "Envoyer aux courses" pour les ajouter à votre pré-liste.</li>
          </ul>
        </section>

        {/* EN RÉSERVE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-xl">📦</div>
            <h3 className="text-2xl font-black text-gray-800">En réserve</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Gardez un œil sur vos stocks actuels. Idéal pour savoir ce qu'il vous reste dans le congélateur ou le cellier avant de faire vos courses.
          </p>
        </section>

        {/* LISTE DE COURSES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-xl">🛒</div>
            <h3 className="text-2xl font-black text-gray-800">Liste de courses (Pré-liste)</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            C'est ici que vous préparez vos achats. Les articles proviennent du planning, des récurrents ou d'ajouts manuels.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Réserve latérale</span> : Consultez votre réserve tout en faisant votre liste pour éviter les doublons.</li>
            <li><span className="font-bold text-gray-700">Validation</span> : Une fois votre pré-liste terminée, cliquez sur "Valider la Pré liste" pour générer la liste finale.</li>
          </ul>
        </section>

        {/* LISTE FINALE */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl">🚀</div>
            <h3 className="text-2xl font-black text-gray-800">Liste de courses finale</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Le récapitulatif optimisé pour le magasin. Les articles sont automatiquement triés par catégories (Légumes, Viandes, Épicerie...) pour un parcours efficace en rayon.
          </p>
        </section>

        {/* RÉGLAGES */}
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl">⚙️</div>
            <h3 className="text-2xl font-black text-gray-800">Réglages</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Configurez votre application selon vos besoins.
          </p>
          <ul className="list-disc list-inside text-gray-500 space-y-2 ml-4">
            <li><span className="font-bold text-gray-700">Catégories</span> : Personnalisez les rayons de votre magasin.</li>
            <li><span className="font-bold text-gray-700">Portions</span> : Définissez vos portions habituelles pour chaque aliment.</li>
            <li><span className="font-bold text-gray-700">Excel / JSON</span> : Exportez vos données pour les consulter sur ordinateur ou importez-les pour changer d'appareil.</li>
            <li className="font-bold text-gray-700">Pensez a tous enregistrer avec vos 3 fichiers les fichiers se trouve dans OneDrive &gt; Fichiers &gt; Documents &gt; Pour IA &gt; Appli repas courses &gt; Doc transfert</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
