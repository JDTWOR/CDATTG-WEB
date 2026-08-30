/**
 * @module features/personalRol/components/PersonalRolHeader
 * @description Encabezado con título, subtítulo y acciones (importar y crear) del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { Link } from 'react-router-dom';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { PersonalRolModuleConfig } from '../config';

interface PersonalRolHeaderProps {
  config: PersonalRolModuleConfig;
  onNew: () => void;
}

/**
 * Renderiza el título del módulo y los botones de importación y creación.
 * @param props config del módulo y callback de crear.
 */
export function PersonalRolHeader({ config, onNew }: Readonly<PersonalRolHeaderProps>) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{config.labels.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{config.labels.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to={config.importPath} className="btn-secondary inline-flex items-center">
          <ArrowUpTrayIcon className="w-5 h-5 mr-2" aria-hidden />
          {config.labels.importar}
        </Link>
        <button type="button" onClick={onNew} className="btn-primary">
          <span className="inline-flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" aria-hidden />
            {config.labels.nuevo}
          </span>
        </button>
      </div>
    </div>
  );
}