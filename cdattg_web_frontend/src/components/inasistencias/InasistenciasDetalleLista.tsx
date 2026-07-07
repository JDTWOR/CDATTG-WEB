import { useMemo } from 'react';
import {
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { InasistenciaDetalleItem } from '../../types';
import { formatFechaVista, formatDiaSemana, formatMesAnioDesdeIso } from '../../utils/formatFecha';

function agruparInasistenciasPorMes(
  items: InasistenciaDetalleItem[],
): { mes: string; items: InasistenciaDetalleItem[] }[] {
  const map = new Map<string, InasistenciaDetalleItem[]>();
  for (const item of items) {
    const key = item.fecha.slice(0, 7);
    const grupo = map.get(key);
    if (grupo) grupo.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mes, grupo]) => ({ mes: formatMesAnioDesdeIso(`${mes}-01`), items: grupo }));
}

export function InasistenciasDetalleLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando detalle de inasistencias">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-4 dark:border-gray-700">
          <div className="mb-3 h-4 w-32 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="mb-2 h-3 w-48 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

function InasistenciaCard({
  item,
  indice,
  variant = 'sin_justificar',
}: Readonly<{ item: InasistenciaDetalleItem; indice: number; variant?: 'sin_justificar' | 'justificada' }>) {
  const dia = formatDiaSemana(item.fecha);
  const tieneObservaciones = Boolean(item.observaciones?.trim());
  const esJustificada = variant === 'justificada';
  const borderClass = esJustificada
    ? 'border-blue-100 dark:border-blue-900/40'
    : 'border-amber-100 dark:border-amber-900/40';
  const barClass = esJustificada ? 'bg-blue-400 dark:bg-blue-500' : 'bg-amber-400 dark:bg-amber-500';
  const badgeClass = esJustificada
    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  const iconClass = esJustificada ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <article
      className={`relative rounded-lg border bg-white pl-4 pr-4 py-3 shadow-sm dark:bg-gray-800/80 ${borderClass}`}
      aria-label={`Inasistencia ${indice + 1}: ${formatFechaVista(item.fecha)}`}
    >
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${barClass}`} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatFechaVista(item.fecha)}
            </p>
            {dia && <p className="text-xs text-gray-500 dark:text-gray-400">{dia}</p>}
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {esJustificada ? 'Inasistencia justificada' : 'Sin justificar'}
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <p>
          <span className="font-medium text-gray-500 dark:text-gray-400">Instructor: </span>
          {item.instructor_nombre?.trim() || 'No registrado'}
        </p>
      </div>
      <div className="mt-2 flex items-start gap-2 text-sm">
        <ChatBubbleLeftEllipsisIcon
          className={`mt-0.5 h-4 w-4 shrink-0 ${tieneObservaciones ? 'text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}
          aria-hidden
        />
        <p className={tieneObservaciones ? 'text-gray-600 dark:text-gray-400' : 'italic text-gray-400 dark:text-gray-500'}>
          {tieneObservaciones ? item.observaciones : 'Sin observaciones en el registro de asistencia'}
        </p>
      </div>
    </article>
  );
}

type InasistenciasDetalleListaProps = Readonly<{
  loading: boolean;
  error: string;
  inasistencias: InasistenciaDetalleItem[];
  variant?: 'sin_justificar' | 'justificada';
  emptyTitle?: string;
  emptyDescription?: string;
}>;

export function InasistenciasDetalleLista({
  loading,
  error,
  inasistencias,
  variant = 'sin_justificar',
  emptyTitle = 'Sin registros de inasistencia',
  emptyDescription = 'No se identificaron sesiones con inasistencia en el período consultado.',
}: InasistenciasDetalleListaProps) {
  const grupos = useMemo(() => agruparInasistenciasPorMes(inasistencias), [inasistencias]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
      >
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return <InasistenciasDetalleLoadingSkeleton />;
  }

  if (inasistencias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircleIcon className="mb-3 h-12 w-12 text-green-400 dark:text-green-500" aria-hidden />
        <p className="text-sm font-medium text-gray-900 dark:text-white">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.mes} aria-labelledby={`mes-${grupo.mes}`}>
          <h4
            id={`mes-${grupo.mes}`}
            className="mb-3 sticky top-0 z-[1] bg-white/95 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur-sm dark:bg-gray-800/95 dark:text-gray-400"
          >
            {grupo.mes}
            <span className="ml-2 font-normal normal-case text-gray-400">({grupo.items.length})</span>
          </h4>
          <div className="space-y-3">
            {grupo.items.map((item, idx) => (
              <InasistenciaCard key={`${item.fecha}-${idx}`} item={item} indice={idx} variant={variant} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
