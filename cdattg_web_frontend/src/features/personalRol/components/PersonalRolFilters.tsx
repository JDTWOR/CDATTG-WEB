/**
 * @module features/personalRol/components/PersonalRolFilters
 * @description Barra de filtros (búsqueda por texto y estado) del listado del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import type { FilterEstado } from '../usePersonalRolCrud';

interface PersonalRolFiltersProps {
  searchText: string;
  filterEstado: FilterEstado;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterEstado) => void;
}

/**
 * Renderiza la búsqueda libre y el selector de estado.
 * @param props valores actuales y callbacks de cambio.
 */
export function PersonalRolFilters({
  searchText,
  filterEstado,
  onSearchChange,
  onFilterChange,
}: Readonly<PersonalRolFiltersProps>) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-4">
      <input
        type="text"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por documento, nombre..."
        className="input-field flex-1 max-w-md"
      />
      <select
        className="input-field w-40"
        value={filterEstado}
        onChange={(e) => onFilterChange(e.target.value as FilterEstado)}
      >
        <option value="all">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>
    </div>
  );
}