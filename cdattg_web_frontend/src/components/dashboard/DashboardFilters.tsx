import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatFechaVista } from '../../utils/formatFecha';
import type { RegionalItem, SedeItem } from '../../types';

type DashboardFiltersProps = Readonly<{
  fecha: string;
  onFechaChange: (value: string) => void;
  loading?: boolean;
  showInstitutionalFilters?: boolean;
  regionalId?: string;
  onRegionalIdChange?: (value: string) => void;
  sedeId?: string;
  onSedeIdChange?: (value: string) => void;
  regionales?: RegionalItem[];
  sedes?: SedeItem[];
}>;

export function DashboardFilters({
  fecha,
  onFechaChange,
  loading = false,
  showInstitutionalFilters = false,
  regionalId = '',
  onRegionalIdChange,
  sedeId = '',
  onSedeIdChange,
  regionales = [],
  sedes = [],
}: DashboardFiltersProps) {
  const sedesFiltradas =
    regionalId === ''
      ? sedes
      : sedes.filter((s) => String(s.regional_id ?? '') === regionalId);

  return (
    <div
      className={`space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 transition-opacity ${loading ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="min-w-[180px]">
          <label htmlFor="dash-filtro-fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Datos del día
          </label>
          <input
            id="dash-filtro-fecha"
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatFechaVista(fecha)}</p>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pb-1">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
            Actualizando…
          </div>
        ) : null}
      </div>

      {showInstitutionalFilters ? (
        <div className="flex flex-col lg:flex-row gap-4 pt-1 border-t border-gray-100 dark:border-gray-700">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="dash-filtro-regional" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Regional
            </label>
            <select
              id="dash-filtro-regional"
              value={regionalId}
              onChange={(e) => {
                onRegionalIdChange?.(e.target.value);
                onSedeIdChange?.('');
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-white"
            >
              <option value="">Todas las regionales</option>
              {regionales.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor="dash-filtro-sede" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sede
            </label>
            <select
              id="dash-filtro-sede"
              value={sedeId}
              onChange={(e) => onSedeIdChange?.(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-white"
            >
              <option value="">Todas las sedes</option>
              {sedesFiltradas.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
