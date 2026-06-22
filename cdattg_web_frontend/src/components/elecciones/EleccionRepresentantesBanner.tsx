import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { eleccionAprendizPaths } from '../../routes/paths';
import type { EleccionMiRegional } from '../../types/eleccion';

/** Bloque compacto para vistas de aprendiz: representantes vigentes y enlace al proceso activo. */
export function EleccionRepresentantesBanner() {
  const [data, setData] = useState<EleccionMiRegional | null>(null);

  useEffect(() => {
    apiService.getEleccionMiRegional().then(setData).catch(() => {});
  }, []);

  const rep = data?.representantes_vigentes;
  const proceso = data?.proceso;
  if (!rep && !proceso) return null;

  const procesoActivo = proceso && proceso.estado !== 'cerrada';

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-950/25">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <UserGroupIcon className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-primary-900 dark:text-primary-200">Representantes de aprendices</h2>
            {rep ? (
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                Titular: <strong>{rep.titular.nombre}</strong> · Suplente:{' '}
                <strong>{rep.suplente.nombre}</strong>
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Sin representantes vigentes registrados.</p>
            )}
            {procesoActivo ? (
              <p className="mt-1 text-xs text-primary-800 dark:text-primary-300">
                Proceso en curso: {proceso.nombre_ciclo} ({proceso.estado})
              </p>
            ) : null}
          </div>
        </div>
        <Link
          to={eleccionAprendizPaths.index}
          className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-300"
        >
          {procesoActivo ? 'Participar en la elección →' : 'Ver detalle →'}
        </Link>
      </div>
    </div>
  );
}
