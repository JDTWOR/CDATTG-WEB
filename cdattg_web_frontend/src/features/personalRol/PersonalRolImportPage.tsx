/**
 * @module features/personalRol/PersonalRolImportPage
 * @description Página genérica de importación de los roles del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useCallback, useEffect, useState } from 'react';
import type { PersonalRolModuleConfig } from './config';
import type { PersonalRolImportLogItem } from './types';
import { ImportFilePicker } from './components/ImportFilePicker';
import { ImportGuidelines } from './components/ImportGuidelines';
import { ImportHistory } from './components/ImportHistory';

interface PersonalRolImportPageProps {
  config: PersonalRolModuleConfig;
}

/**
 * Compone la página de importación: carga de archivo, buenas prácticas e historial.
 * @param props config del módulo (Personal Operativo, Administrativo o Contratistas).
 */
export function PersonalRolImportPage({ config }: Readonly<PersonalRolImportPageProps>) {
  const [imports, setImports] = useState<PersonalRolImportLogItem[]>([]);
  const [loadingImports, setLoadingImports] = useState(true);

  const fetchImports = useCallback(async () => {
    try {
      setLoadingImports(true);
      setImports(await config.api.listImports());
    } catch {
      setImports([]);
    } finally {
      setLoadingImports(false);
    }
  }, [config]);

  useEffect(() => {
    void fetchImports();
  }, [fetchImports]);

  const ImportIcon = config.importIcon;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <ImportIcon className="w-8 h-8 text-primary-600" aria-hidden />
        {config.labels.importarTitle}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">{config.labels.importarDescription}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ImportFilePicker config={config} onImported={() => void fetchImports()} />
          <ImportGuidelines config={config} />
        </div>
        <ImportHistory
          items={imports}
          loading={loadingImports}
          caption={`Historial de importaciones de ${config.labels.title.toLowerCase()}`}
          onRefresh={() => void fetchImports()}
        />
      </div>
    </div>
  );
}