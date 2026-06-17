import { useEffect, useMemo } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { CasoBienestarItem, InasistenciaDetalleItem } from '../../../../types';
import { formatFechaVista, formatRangoFechasVista } from '../../../../utils/formatFecha';

type CasosBienestarInasistenciasModalProps = Readonly<{
  aprendiz: CasoBienestarItem;
  loading: boolean;
  error: string;
  inasistencias: InasistenciaDetalleItem[];
  dias: number;
  minFallas: number;
  periodo: { fecha_inicio: string; fecha_fin: string } | null;
  pdfDescargando: boolean;
  onDescargarPdf: () => void;
  onClose: () => void;
}>;

function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function diaSemanaLegible(fecha: string): string {
  const iso = fecha.slice(0, 10);
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return '';
  const dia = dt.toLocaleDateString('es-CO', { weekday: 'long' });
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

function etiquetaMes(fechaIso: string): string {
  const dt = new Date(`${fechaIso.slice(0, 7)}-01T12:00:00`);
  if (Number.isNaN(dt.getTime())) return fechaIso.slice(0, 7);
  const mes = dt.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

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
    .map(([mes, grupo]) => ({ mes: etiquetaMes(`${mes}-01`), items: grupo }));
}

function ModalLoadingSkeleton() {
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

function InasistenciaCard({ item, indice }: Readonly<{ item: InasistenciaDetalleItem; indice: number }>) {
  const dia = diaSemanaLegible(item.fecha);
  const tieneObservaciones = Boolean(item.observaciones?.trim());

  return (
    <article
      className="relative rounded-lg border border-amber-100 bg-white pl-4 pr-4 py-3 shadow-sm dark:border-amber-900/40 dark:bg-gray-800/80"
      aria-label={`Inasistencia ${indice + 1}: ${formatFechaVista(item.fecha)}`}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-amber-400 dark:bg-amber-500"
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatFechaVista(item.fecha)}
            </p>
            {dia && <p className="text-xs text-gray-500 dark:text-gray-400">{dia}</p>}
          </div>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Registro de inasistencia
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

export function CasosBienestarInasistenciasModal({
  aprendiz,
  loading,
  error,
  inasistencias,
  dias,
  minFallas,
  periodo,
  pdfDescargando,
  onDescargarPdf,
  onClose,
}: CasosBienestarInasistenciasModalProps) {
  const grupos = useMemo(() => agruparInasistenciasPorMes(inasistencias), [inasistencias]);
  const rangoPeriodo = formatRangoFechasVista(periodo?.fecha_inicio, periodo?.fecha_fin);
  const coincideConteo = !loading && inasistencias.length === aprendiz.inasistencias;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <dialog
        open
        aria-labelledby="casos-bienestar-inas-title"
        aria-describedby="casos-bienestar-inas-desc"
        className="relative z-10 m-0 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4 dark:border-amber-900/30 dark:from-amber-950/40 dark:to-gray-800">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
              aria-hidden
            >
              {inicialesNombre(aprendiz.persona_nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="casos-bienestar-inas-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalle de inasistencias
              </h3>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {aprendiz.persona_nombre}
              </p>
              <p id="casos-bienestar-inas-desc" className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                Documento {aprendiz.numero_documento} · Ficha {aprendiz.ficha_numero}
                {aprendiz.sede_nombre ? ` · ${aprendiz.sede_nombre}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-white/80 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 dark:divide-gray-700 dark:border-gray-700">
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{aprendiz.inasistencias}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Inasistencias</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{aprendiz.asistencias_efectivas}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Asistencias</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{aprendiz.total_sesiones}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sesiones evaluadas</p>
          </div>
        </div>

        {(rangoPeriodo || dias > 0) && (
          <div className="border-b border-gray-100 px-5 py-2.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Período de análisis:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {rangoPeriodo ?? `últimos ${dias} días calendario`}
            </span>
            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
            Umbral: {minFallas}+ inasistencias
            {!loading && inasistencias.length > 0 && (
              <span className="ml-2 text-gray-400 dark:text-gray-500">
                · {inasistencias.length} registro{inasistencias.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>{error}</p>
            </div>
          )}

          {loading && <ModalLoadingSkeleton />}

          {!loading && !error && inasistencias.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircleIcon className="mb-3 h-12 w-12 text-green-400 dark:text-green-500" aria-hidden />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Sin registros de inasistencia
              </p>
              <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                No se identificaron sesiones con inasistencia para este aprendiz en el período consultado.
              </p>
            </div>
          )}

          {!loading && inasistencias.length > 0 && (
            <div className="space-y-6">
              {grupos.map((grupo) => (
                <section key={grupo.mes} aria-labelledby={`mes-${grupo.mes}`}>
                  <h4
                    id={`mes-${grupo.mes}`}
                    className="mb-3 sticky top-0 z-[1] bg-white/95 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur-sm dark:bg-gray-800/95 dark:text-gray-400"
                  >
                    {grupo.mes}
                    <span className="ml-2 font-normal normal-case text-gray-400">
                      ({grupo.items.length})
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {grupo.items.map((item, idx) => (
                      <InasistenciaCard key={`${item.fecha}-${idx}`} item={item} indice={idx} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <p className="min-w-0 flex-1 text-xs text-gray-500 dark:text-gray-400">
            {!loading && inasistencias.length > 0 && !coincideConteo && (
              <span className="text-amber-600 dark:text-amber-400">
                El detalle registra {inasistencias.length} fechas; el consolidado indica {aprendiz.inasistencias}.
              </span>
            )}
            {!loading && (inasistencias.length === 0 || coincideConteo) && (
              <span>Criterio: días con formación programada. Excluye festivos y PARO de sede.</span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDescargarPdf}
              disabled={loading || pdfDescargando}
              className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
            >
              {pdfDescargando ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
              )}
              {pdfDescargando ? 'Generando…' : 'Descargar PDF'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
