import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CASOS_BIEN_APRENDIZ_SEARCH_ID } from '../casosBienestarConstants';

type CasosBienestarAprendicesFiltersProps = Readonly<{
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}>;

export function CasosBienestarAprendicesFilters({
  searchQuery,
  onSearchQueryChange,
}: CasosBienestarAprendicesFiltersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
      <label
        htmlFor={CASOS_BIEN_APRENDIZ_SEARCH_ID}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Buscar aprendiz
      </label>
      <div className="relative max-w-xl">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          id={CASOS_BIEN_APRENDIZ_SEARCH_ID}
          type="text"
          placeholder="Buscar por documento o nombre..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}
