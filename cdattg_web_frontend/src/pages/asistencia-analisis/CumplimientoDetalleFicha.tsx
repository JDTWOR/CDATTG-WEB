import { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { AsistenciaAnalisisResponse } from '../../types';

type CumplimientoItem = AsistenciaAnalisisResponse['cumplimiento']['items'][number];
type DetalleDia = CumplimientoItem['detalle_dias'][number];

type DetalleFiltro = 'faltantes' | 'todos';

function celdaEstado(dia: DetalleDia): { className: string; label: string } {
  if (dia.programado && dia.tiene_sesion) {
    return {
      className: 'bg-green-500 dark:bg-green-600',
      label: `${dia.fecha}: programado, con asistencia`,
    };
  }
  if (dia.programado && !dia.tiene_sesion) {
    return {
      className: 'bg-amber-400 dark:bg-amber-500',
      label: `${dia.fecha}: programado, sin asistencia`,
    };
  }
  return {
    className: 'bg-sky-400 dark:bg-sky-500',
    label: `${dia.fecha}: asistencia fuera de programación`,
  };
}

function agruparPorMes(dias: DetalleDia[]): Map<string, DetalleDia[]> {
  const map = new Map<string, DetalleDia[]>();
  for (const dia of dias) {
    const mes = dia.fecha.slice(0, 7);
    const list = map.get(mes) ?? [];
    list.push(dia);
    map.set(mes, list);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function etiquetaMes(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function iconoEstado(dia: DetalleDia) {
  if (dia.tiene_sesion) {
    return <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden />;
  }
  if (dia.programado) {
    return <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />;
  }
  return <InformationCircleIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden />;
}

type Props = Readonly<{
  item: CumplimientoItem;
  onIrABloqueA?: () => void;
}>;

export function CumplimientoDetalleFicha({ item, onIrABloqueA }: Props) {
  const [filtro, setFiltro] = useState<DetalleFiltro>('faltantes');
  const resumen = item.resumen_detalle;

  const diasFiltrados = useMemo(() => {
    const dias = item.detalle_dias ?? [];
    if (filtro === 'todos') return dias;
    return dias.filter((d) => d.programado && !d.tiene_sesion);
  }, [item.detalle_dias, filtro]);

  const porMes = useMemo(() => agruparPorMes(item.detalle_dias ?? []), [item.detalle_dias]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
          <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden />
          {resumen?.dias_cumplidos ?? item.dias_con_sesion} cumplidos
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          <ExclamationTriangleIcon className="w-3.5 h-3.5" aria-hidden />
          {resumen?.dias_sin_toma ?? 0} sin toma
        </span>
        {(resumen?.sesiones_fuera_programacion ?? 0) > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
            <InformationCircleIcon className="w-3.5 h-3.5" aria-hidden />
            {resumen.sesiones_fuera_programacion} fuera de prog.
          </span>
        ) : null}
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {item.total_sesiones} sesiones totales (bloque A)
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Los días con sesión del bloque B coinciden con el bloque A. Si hay más sesiones que días con sesión,
        hubo varias tomas el mismo día.
        {onIrABloqueA ? (
          <>
            {' '}
            <button
              type="button"
              onClick={onIrABloqueA}
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Ver hora de toma (bloque A)
            </button>
          </>
        ) : null}
      </p>

      {/* Heatmap mensual */}
      <div className="space-y-3">
        {[...porMes.entries()].map(([mes, dias]) => (
          <div key={mes}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              {etiquetaMes(mes)}
            </p>
            <div className="flex flex-wrap gap-1">
              {dias.map((dia) => {
                const { className, label } = celdaEstado(dia);
                return (
                  <span
                    key={dia.fecha}
                    title={label}
                    className={`h-3 w-3 rounded-sm ${className}`}
                    aria-label={label}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Lista:</span>
        <button
          type="button"
          onClick={() => setFiltro('faltantes')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            filtro === 'faltantes'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Solo faltantes ({resumen?.dias_sin_toma ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('todos')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            filtro === 'todos'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({item.detalle_dias?.length ?? 0})
        </button>
      </div>

      {diasFiltrados.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          {filtro === 'faltantes'
            ? 'No hay días programados sin toma de asistencia en este período.'
            : 'Sin días registrados en el detalle.'}
        </p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800/80 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500 w-8" />
                <th className="px-2 py-1.5 text-left font-medium text-gray-500">Fecha</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500">Día</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
              {diasFiltrados.map((dia) => (
                <tr key={dia.fecha}>
                  <td className="px-2 py-1.5">{iconoEstado(dia)}</td>
                  <td className="px-2 py-1.5 tabular-nums">{dia.fecha}</td>
                  <td className="px-2 py-1.5">{dia.dia_semana}</td>
                  <td className="px-2 py-1.5">
                    {dia.programado && dia.tiene_sesion && (
                      <span className="text-green-700 dark:text-green-400">Cumplido</span>
                    )}
                    {dia.programado && !dia.tiene_sesion && (
                      <span className="text-amber-700 dark:text-amber-400">Sin toma</span>
                    )}
                    {!dia.programado && dia.tiene_sesion && (
                      <span className="text-sky-700 dark:text-sky-400">Fuera de programación</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Cumplido
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Sin toma
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Fuera de prog.
        </span>
      </div>
    </div>
  );
}
