import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SelectSearch } from '../../../../components/SelectSearch';
import { CASOS_BIEN_LISTA_PROGRAMA_ID, CASOS_BIEN_LISTA_SEARCH_ID } from '../casosBienestarConstants';

type CasosBienestarListaFiltersProps = Readonly<{
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  programaFiltroIndex: number;
  onProgramaFiltroIndexChange: (index: number) => void;
  programasOpciones: string[];
}>;

export function CasosBienestarListaFilters({
  searchQuery,
  onSearchQueryChange,
  programaFiltroIndex,
  onProgramaFiltroIndexChange,
  programasOpciones,
}: CasosBienestarListaFiltersProps) {
  const selectOptions = [
    { value: 0, label: 'Todos los programas' },
    ...programasOpciones.map((nombre, i) => ({ value: i + 1, label: nombre })),
  ];

  return (
    <div className="flex flex-col items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800 sm:flex-row sm:items-center">
      <div className="w-full min-w-[250px] flex-1 sm:w-auto">
        <label
          htmlFor={CASOS_BIEN_LISTA_SEARCH_ID}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Buscar ficha
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id={CASOS_BIEN_LISTA_SEARCH_ID}
            type="text"
            placeholder="Buscar por código de ficha o programa..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="w-full min-w-[250px] sm:w-auto">
        <label
          htmlFor={CASOS_BIEN_LISTA_PROGRAMA_ID}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Filtrar por Programa
        </label>
        <SelectSearch
          inputId={CASOS_BIEN_LISTA_PROGRAMA_ID}
          options={selectOptions}
          value={programaFiltroIndex}
          onChange={(v) => onProgramaFiltroIndexChange(v ?? 0)}
          placeholder="Todos los programas"
        />
      </div>
    </div>
  );
}
