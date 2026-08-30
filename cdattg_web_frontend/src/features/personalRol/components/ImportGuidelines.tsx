/**
 * @module features/personalRol/components/ImportGuidelines
 * @description Tarjeta de buenas prácticas para la importación Excel del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { LightBulbIcon } from '@heroicons/react/24/outline';
import type { PersonalRolModuleConfig } from '../config';

interface ImportGuidelinesProps {
  config: PersonalRolModuleConfig;
}

/**
 * Lista de buenas prácticas de importación del rol configurado.
 * @param props config del módulo.
 */
export function ImportGuidelines({ config }: Readonly<ImportGuidelinesProps>) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <LightBulbIcon className="w-5 h-5 text-amber-500" aria-hidden /> Buenas prácticas
      </h2>
      <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400 text-sm list-disc list-inside">
        {config.labels.buenasPracticas.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}