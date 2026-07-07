import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import type { CasoBienestarItem } from '../../../../types';
import { nivelAlertaInasistencias, porcentajeAsistenciaAprendiz } from '../casosBienestarUtils';

type CasosBienestarAprendicesTableProps = Readonly<{
  fichaNumero: string;
  casos: CasoBienestarItem[];
  casosTotal: number;
  minFallas: number;
  busquedaActiva: boolean;
  pdfDescargandoId: number | null;
  onVerDetalle: (caso: CasoBienestarItem) => void;
  onDescargarPdf: (caso: CasoBienestarItem) => void;
}>;

function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function accentBarraCumplimiento(porcentaje: number): string {
  if (porcentaje >= 80) return 'accent-green-500';
  if (porcentaje >= 60) return 'accent-amber-500';
  return 'accent-red-500';
}

function BarraCumplimiento({ porcentaje }: Readonly<{ porcentaje: number }>) {
  const accent = accentBarraCumplimiento(porcentaje);
  return (
    <div className="flex items-center justify-end gap-2">
      <progress
        className={`h-2 w-20 overflow-hidden rounded-full ${accent}`}
        max={100}
        value={porcentaje}
        aria-label={`Cumplimiento de asistencia ${porcentaje} por ciento`}
      />
      <span className="w-10 text-right text-xs font-medium tabular-nums text-gray-700 dark:text-gray-300">
        {porcentaje}%
      </span>
    </div>
  );
}

function clasesBadgeInasistencias(nivel: 'alto' | 'medio' | 'base'): string {
  if (nivel === 'alto') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  }
  if (nivel === 'medio') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
}

function BadgeInasistencias({
  inasistencias,
  minFallas,
}: Readonly<{ inasistencias: number; minFallas: number }>) {
  const nivel = nivelAlertaInasistencias(inasistencias, minFallas);
  const clases = clasesBadgeInasistencias(nivel);

  return (
    <span
      className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${clases}`}
    >
      {inasistencias}
    </span>
  );
}

export function CasosBienestarAprendicesTable({
  fichaNumero,
  casos,
  casosTotal,
  minFallas,
  busquedaActiva,
  pdfDescargandoId,
  onVerDetalle,
  onDescargarPdf,
}: CasosBienestarAprendicesTableProps) {
  if (casosTotal === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Sin aprendices en seguimiento</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Ningún aprendiz de esta ficha cumple los criterios de alerta definidos para el período consultado.
        </p>
      </div>
    );
  }

  if (casos.length === 0 && busquedaActiva) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Sin coincidencias</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No se encontraron aprendices que coincidan con el criterio de búsqueda.
        </p>
        {casosTotal > 0 && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {casosTotal} aprendiz{casosTotal === 1 ? '' : 'es'} en seguimiento en total.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {busquedaActiva && casosTotal > 0 && (
        <p className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Resultados filtrados: {casos.length} de {casosTotal} aprendiz{casosTotal === 1 ? '' : 'es'}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <caption className="sr-only">Aprendices en seguimiento de la ficha {fichaNumero}</caption>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                N.º documento
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Aprendiz
              </th>
              <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 sm:table-cell">
                Sede
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Sesiones
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Asistencias
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Cumplimiento
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Sin justificar
              </th>
              <th className="hidden px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 md:table-cell">
                Justificadas
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700/80 dark:bg-gray-800/50">
            {casos.map((c) => {
              const pct = porcentajeAsistenciaAprendiz(c);
              const pdfCargando = pdfDescargandoId === c.aprendiz_id;

              return (
                <tr
                  key={c.aprendiz_id}
                  className="transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {c.numero_documento}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        aria-hidden
                      >
                        {inicialesNombre(c.persona_nombre)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.persona_nombre}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 sm:table-cell">
                    {c.sede_nombre || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {c.total_sesiones}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-green-700 dark:text-green-400">
                    {c.asistencias_efectivas}
                  </td>
                  <td className="px-4 py-3.5">
                    <BarraCumplimiento porcentaje={pct} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <BadgeInasistencias inasistencias={c.inasistencias} minFallas={minFallas} />
                  </td>
                  <td className="hidden px-4 py-3.5 text-center md:table-cell">
                    {(c.inasistencias_justificadas ?? 0) > 0 ? (
                      <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {c.inasistencias_justificadas}
                      </span>
                    ) : (
                      <span className="text-sm tabular-nums text-gray-400 dark:text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(c)}
                        className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
                        title="Consultar detalle de inasistencias"
                      >
                        <DocumentMagnifyingGlassIcon className="h-4 w-4" aria-hidden />
                        <span className="hidden sm:inline">Consultar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDescargarPdf(c)}
                        disabled={pdfDescargandoId != null}
                        className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                        title="Descargar reporte PDF"
                        aria-busy={pdfCargando}
                      >
                        {pdfCargando ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                        )}
                        <span className="hidden sm:inline">{pdfCargando ? 'Generando…' : 'PDF'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
