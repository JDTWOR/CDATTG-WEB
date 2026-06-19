import { useEffect, useMemo } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { CasoBienestarItem, InasistenciaDetalleItem } from '../../../../types';
import { formatRangoFechasVista } from '../../../../utils/formatFecha';
import { InasistenciasDetalleLista } from '../../../../components/inasistencias/InasistenciasDetalleLista';

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
  const rangoPeriodo = formatRangoFechasVista(periodo?.fecha_inicio, periodo?.fecha_fin);
  const coincideConteo = useMemo(
    () => !loading && inasistencias.length === aprendiz.inasistencias,
    [loading, inasistencias.length, aprendiz.inasistencias],
  );

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
          <InasistenciasDetalleLista
            loading={loading}
            error={error}
            inasistencias={inasistencias}
            emptyDescription="No se identificaron sesiones con inasistencia para este aprendiz en el período consultado."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <p className="min-w-0 flex-1 text-xs text-gray-500 dark:text-gray-400">
            {!loading && inasistencias.length > 0 && !coincideConteo && (
              <span className="text-amber-600 dark:text-amber-400">
                El detalle registra {inasistencias.length} sesiones; el consolidado indica {aprendiz.inasistencias}.
                Recargue la lista de casos si el consolidado es anterior.
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
