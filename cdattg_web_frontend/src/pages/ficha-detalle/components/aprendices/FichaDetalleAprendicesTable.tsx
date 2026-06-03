import { EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { AprendizResponse } from '../../../../types';

type FichaDetalleAprendicesTableProps = Readonly<{
  aprendices: AprendizResponse[];
  busquedaActiva: boolean;
  puedeGestionar: boolean;
  onOcultar: (personaId: number, oculto: boolean, nombre: string) => void;
  onDesasignar: (personaIds: number[]) => void;
}>;

function EstadoBadge({ oculto }: { oculto: boolean }) {
  if (oculto) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
        Oculto en asistencia
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
      Activo
    </span>
  );
}

function AccionesAprendiz({
  aprendiz,
  puedeGestionar,
  onOcultar,
  onDesasignar,
}: Readonly<{
  aprendiz: AprendizResponse;
  puedeGestionar: boolean;
  onOcultar: FichaDetalleAprendicesTableProps['onOcultar'];
  onDesasignar: FichaDetalleAprendicesTableProps['onDesasignar'];
}>) {
  if (!puedeGestionar) return null;
  const oculto = aprendiz.oculto_en_asistencia;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onOcultar(aprendiz.persona_id, !oculto, aprendiz.persona_nombre)}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title={oculto ? 'Mostrar en asistencia' : 'Ocultar de asistencia'}
        aria-label={oculto ? 'Mostrar en asistencia' : 'Ocultar de asistencia'}
      >
        {oculto ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={() => onDesasignar([aprendiz.persona_id])}
        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        title="Desasignar de la ficha"
        aria-label="Desasignar"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export function FichaDetalleAprendicesTable({
  aprendices,
  busquedaActiva,
  puedeGestionar,
  onOcultar,
  onDesasignar,
}: FichaDetalleAprendicesTableProps) {
  if (aprendices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {busquedaActiva ? 'Ningún aprendiz coincide con la búsqueda.' : 'Ningún aprendiz asignado.'}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Aprendiz
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Documento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Estado
              </th>
              {puedeGestionar && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800/50">
            {aprendices.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {a.persona_nombre}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {a.persona_documento ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge oculto={!!a.oculto_en_asistencia} />
                </td>
                {puedeGestionar && (
                  <td className="px-4 py-3 text-right">
                    <AccionesAprendiz
                      aprendiz={a}
                      puedeGestionar={puedeGestionar}
                      onOcultar={onOcultar}
                      onDesasignar={onDesasignar}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-600 md:hidden">
        {aprendices.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">{a.persona_nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a.persona_documento ?? '—'}</p>
              </div>
              <EstadoBadge oculto={!!a.oculto_en_asistencia} />
            </div>
            <AccionesAprendiz
              aprendiz={a}
              puedeGestionar={puedeGestionar}
              onOcultar={onOcultar}
              onDesasignar={onDesasignar}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
