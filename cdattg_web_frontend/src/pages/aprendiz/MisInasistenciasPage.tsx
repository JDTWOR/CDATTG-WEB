import { ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';
import { InasistenciasDetalleLista } from '../../components/inasistencias/InasistenciasDetalleLista';
import { useAuth } from '../../context/AuthContext';
import { formatRangoFechasVista } from '../../utils/formatFecha';
import {
  canViewMisInasistencias,
  MENSAJE_SIN_PERMISO_MIS_INASISTENCIAS,
} from './misInasistenciasPermissions';
import { useMisInasistencias } from './hooks/useMisInasistencias';
import { EleccionRepresentantesBanner } from '../../components/elecciones/EleccionRepresentantesBanner';

export function MisInasistenciasPage() {
  const { roles, permissions } = useAuth();
  const canView = canViewMisInasistencias(roles, permissions);
  const { dias, setDias, diasOpciones, data, loading, error, recargar } = useMisInasistencias(canView);

  if (!canView) {
    return <Navigate to="/perfil" replace state={{ message: MENSAJE_SIN_PERMISO_MIS_INASISTENCIAS }} />;
  }

  const rangoPeriodo = formatRangoFechasVista(data?.fecha_inicio, data?.fecha_fin);
  const justificadas = data?.inasistencias_justificadas ?? [];
  const totalJustificadas = data?.total_inasistencias_justificadas ?? justificadas.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis inasistencias</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Consulte las sesiones en las que no registró asistencia efectiva, separadas entre justificadas y sin
            justificar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void recargar()}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar
        </button>
      </div>

      <EleccionRepresentantesBanner />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-700">
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data?.ficha_numero && (
              <p>
                <span className="font-medium text-gray-800 dark:text-gray-200">Ficha: </span>
                {data.ficha_numero}
              </p>
            )}
            {data?.programa_nombre && (
              <p>
                <span className="font-medium text-gray-800 dark:text-gray-200">Programa: </span>
                {data.programa_nombre}
              </p>
            )}
            {data?.sede_nombre && (
              <p>
                <span className="font-medium text-gray-800 dark:text-gray-200">Sede: </span>
                {data.sede_nombre}
              </p>
            )}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Período</span>
            <select
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              {diasOpciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  Últimos {opcion} días
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
            <CalendarDaysIcon className="h-8 w-8 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {loading ? '—' : (data?.total_inasistencias ?? 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sin justificar
                {rangoPeriodo && (
                  <>
                    {' '}
                    · {rangoPeriodo}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/30">
            <CalendarDaysIcon className="h-8 w-8 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {loading ? '—' : totalJustificadas}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Justificadas</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Inasistencias sin justificar
              {!loading && (
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  ({data?.inasistencias.length ?? 0})
                </span>
              )}
            </h2>
            <InasistenciasDetalleLista
              loading={loading}
              error={error}
              inasistencias={data?.inasistencias ?? []}
              variant="sin_justificar"
              emptyDescription="No tiene inasistencias sin justificar en el período consultado."
            />
          </section>

          {(loading || justificadas.length > 0) && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Inasistencias justificadas
                {!loading && (
                  <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                    ({justificadas.length})
                  </span>
                )}
              </h2>
              <InasistenciasDetalleLista
                loading={loading}
                error=""
                inasistencias={justificadas}
                variant="justificada"
                emptyTitle="Sin inasistencias justificadas"
                emptyDescription="No hay registros con tipo «Inasistencia justificada» en el período consultado."
              />
            </section>
          )}
        </div>

        {!loading && !error && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Criterio: días con formación programada. Excluye festivos y PARO de sede. Las justificadas requieren que el
            instructor haya registrado el tipo de observación correspondiente.
          </p>
        )}
      </div>
    </div>
  );
}
