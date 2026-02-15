import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, Users, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useRecipeSearch, useRecipeDetail } from '../hooks/useRecipes';
import { useCreateMeal } from '../hooks/useMeals';
import type { RecipeSearchResult, Category } from '../types';

interface RecipeSearchModalProps {
  onClose: () => void;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function RecipeSearchModal({ onClose }: RecipeSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const debouncedQuery = useDebounce(query, 400);
  const navigate = useNavigate();

  const { data: results, isLoading: searching, isFetching } = useRecipeSearch(debouncedQuery);
  const { data: detail, isLoading: loadingDetail } = useRecipeDetail(selectedId);
  const createMeal = useCreateMeal();

  const handleImport = async () => {
    if (!detail) return;
    const meal = await createMeal.mutateAsync({
      name: detail.title,
      description: detail.summary || undefined,
      servings: detail.servings,
      ingredients: detail.ingredients.map((ing) => ({
        name: ing.name,
        category: ing.category as Category,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
    });
    onClose();
    navigate(`/meals/${meal.id}`);
  };

  // Detail view
  if (selectedId !== null) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            </div>
          ) : detail ? (
            <div className="p-6">
              {detail.image && (
                <img
                  src={detail.image}
                  alt={detail.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-lg font-bold mb-2">{detail.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {detail.servings} servings
                </span>
                {detail.readyInMinutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {detail.readyInMinutes} min
                  </span>
                )}
              </div>
              {detail.summary && (
                <p className="text-sm text-gray-600 mb-4">{detail.summary}</p>
              )}

              <h3 className="text-sm font-semibold mb-2">
                Ingredients ({detail.ingredients.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                {detail.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-sand rounded-lg px-3 py-1.5">
                    <span className="flex-1">{ing.name}</span>
                    <span className="text-gray-500">{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                disabled={createMeal.isPending}
                className="w-full flex items-center justify-center gap-2 bg-ocean text-white py-2.5 rounded-lg hover:bg-ocean-light disabled:opacity-50 transition-colors font-medium"
              >
                {createMeal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Import as Meal</>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Search results view
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Find a Recipe</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean outline-none"
              placeholder="Search recipes... e.g., chicken parmesan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          {debouncedQuery.length < 2 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Type at least 2 characters to search
            </p>
          ) : searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-ocean" />
            </div>
          ) : results && results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No recipes found for "{debouncedQuery}"
            </p>
          ) : results ? (
            <div className="space-y-2">
              {results.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedId(recipe.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({
  recipe,
  onClick,
}: {
  recipe: RecipeSearchResult;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sand transition-colors text-left"
    >
      {recipe.image ? (
        <img
          src={recipe.image}
          alt=""
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-sand-dark flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{recipe.title}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {recipe.servings}
          </span>
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {recipe.readyInMinutes} min
            </span>
          )}
        </div>
        {recipe.summary && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{recipe.summary}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}
