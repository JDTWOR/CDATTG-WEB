/**
 * @module features/personalRol/components/ImportResultCard
 * @description Resumen del resultado de una importación Excel del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import type { PersonalRolImportResult } from '../types';

interface ImportResultCardProps {
  result: PersonalRolImportResult;
}

/**
 * Muestra los conteos de procesados, duplicados, errores y estado de la importación.
 * @param props resultado de la importación devuelto por el backend.
 */
export function ImportResultCard({ result }: Readonly<ImportResultCardProps>) {
  return (
    <output
      aria-live="polite"
      className="mt-3 block w-full p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
    >
      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Importación finalizada</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <span className="font-semibold text-green-800 dark:text-green-200">{result.processed_count}</span> creados
        </div>
        <div>
          <span className="font-semibold text-amber-700 dark:text-amber-300">{result.duplicates_count}</span>{' '}
          duplicados
        </div>
        <div>
          <span className="font-semibold text-red-700 dark:text-red-300">{result.error_count}</span> errores
        </div>
        <div>
          <span className="font-semibold text-green-700 dark:text-green-300">{result.status}</span>
        </div>
      </div>
    </output>
  );
}