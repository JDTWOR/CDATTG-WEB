import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { axiosErrorMessage } from '../../utils/httpError';
import { hoyISOColombia, formatNumero } from '../../utils/formatFecha';
import type { AsistenciaAnalisisResponse, RegionalItem, SedeItem } from '../../types';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { CumplimientoDetalleFicha } from './CumplimientoDetalleFicha';

const JORNADAS = ['', 'DIURNA', 'TARDE', 'NOCHE', 'JORNADA CONTINUA', 'FINES DE SEMANA'] as const;

const DIAS_SEMANA = [
  { id: 0, label: 'Todos' },
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 7, label: 'Domingo' },
] as const;

function defaultDesde(): string {
  const d = new Date();
  d.setDate(d.getDate() - 89);
  return d.toISOString().slice(0, 10);
}

function pctBarClass(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function PanelAnaliticoAsistenciaPage() {
  const { roles } = useAuth();
  const esCoordinador = roles.includes('COORDINADOR');
  const esAdmin =
    roles.includes('SUPER ADMINISTRADOR') || roles.includes('ADMINISTRADOR');
  const puedeFiltrarInstitucional = esAdmin && !esCoordinador;

  const [fechaDesde, setFechaDesde] = useState(defaultDesde);
  const [fechaHasta, setFechaHasta] = useState(hoyISOColombia);
  const [jornada, setJornada] = useState('');
  const [diaSemanaId, setDiaSemanaId] = useState(0);
  const [fichaNumero, setFichaNumero] = useState('');
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [data, setData] = useState<AsistenciaAnalisisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fichaDetalleAbierta, setFichaDetalleAbierta] = useState<number | null>(null);
  const bloqueARef = useRef<HTMLElement>(null);

  const sedesFiltradas = useMemo(() => {
    if (!regionalId) return sedes;
    return sedes.filter((s) => String(s.regional_id ?? '') === regionalId);
  }, [sedes, regionalId]);

  useEffect(() => {
    if (!puedeFiltrarInstitucional) return;
    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])
      .then(([regs, sds]) => {
        setRegionales(regs);
        setSedes(sds);
      })
      .catch(() => {
        /* filtros opcionales */
      });
  }, [puedeFiltrarInstitucional]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getAsistenciaAnalisis({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        jornada: jornada || undefined,
        ficha: fichaNumero.trim() || undefined,
        dia_semana_id: diaSemanaId > 0 ? diaSemanaId : undefined,
        regional_id: regionalId ? Number(regionalId) : undefined,
        sede_id: sedeId ? Number(sedeId) : undefined,
      });
      setData(res);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar el panel analítico.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, jornada, diaSemanaId, fichaNumero, regionalId, sedeId]);

  useEffect(() => {
    load();
  }, [load]);

  const topDias = useMemo(() => {
    const items = data?.dia_semana.dias_mas_asistencia ?? [];
    return items.slice(0, 3).filter((d) => d.vinieron > 0);
  }, [data]);

  const filasSemana = useMemo(() => {
    const rows = data?.dia_semana.por_dia ?? [];
    if (diaSemanaId <= 0) return rows;
    return rows.filter((r) => r.dia_semana_id === diaSemanaId);
  }, [data, diaSemanaId]);

  return (
    <div className="page-container space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel analítico de asistencia</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Análisis de hora de toma, cumplimiento por ficha y asistencia por día de la semana (aprendices en formación activa).
        </p>
      </header>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="analisis-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              id="analisis-desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label htmlFor="analisis-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <input
              id="analisis-hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
            />
          </div>
          <div>
            <label htmlFor="analisis-jornada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jornada
            </label>
            <select
              id="analisis-jornada"
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
            >
              <option value="">Todas</option>
              {JORNADAS.filter(Boolean).map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="analisis-ficha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de ficha (opcional)
            </label>
            <input
              id="analisis-ficha"
              type="text"
              value={fichaNumero}
              onChange={(e) => setFichaNumero(e.target.value)}
              placeholder="Ej. 3173334"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
            />
          </div>
        </div>
        {puedeFiltrarInstitucional ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="analisis-regional"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Regional
              </label>
              <select
                id="analisis-regional"
                value={regionalId}
                onChange={(e) => {
                  setRegionalId(e.target.value);
                  setSedeId('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
              >
                <option value="">Todas las regionales</option>
                {regionales.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="analisis-sede"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Sede
              </label>
              <select
                id="analisis-sede"
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
              >
                <option value="">Todas las sedes</option>
                {sedesFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {/* Bloque A */}
      <section ref={bloqueARef} className="space-y-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-primary-600" aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            A — Hora promedio de toma de asistencia
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Promedio según el primer registro de cada sesión.{' '}
          <strong>Sesiones</strong> cuenta cada toma;{' '}
          <strong>días con sesión</strong> cuenta fechas distintas programadas con toma (coincide con bloque B).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Hora promedio global"
            value={loading ? '…' : (data?.hora_toma.promedio_hora ?? '—')}
            tooltip="Promedio de la primera hora de registro en todas las sesiones del período."
            icon={<ClockIcon className="w-6 h-6 text-sena-green" aria-hidden />}
          />
          <KpiCard
            label="Sesiones analizadas"
            value={loading ? '…' : formatNumero(data?.hora_toma.total_sesiones ?? 0)}
            tooltip="Total de registros de asistencia (puede ser mayor que días con sesión si hubo varias tomas el mismo día)."
            icon={<ChartBarIcon className="w-6 h-6 text-sena-dark" aria-hidden />}
          />
          <KpiCard
            label="Días con sesión"
            value={loading ? '…' : formatNumero(data?.hora_toma.total_dias_con_sesion ?? 0)}
            tooltip="Fechas distintas con al menos una sesión. Este número se alinea con «Con sesión» del bloque B por ficha."
            icon={<CalendarDaysIcon className="w-6 h-6 text-primary-600" aria-hidden />}
          />
        </div>
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Detalle por ficha</h3>
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Ficha</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Programa</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Jornada</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Hora prom.</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Sesiones</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Días c/ sesión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(data?.hora_toma.detalle_por_ficha ?? []).map((row) => (
                <tr key={row.ficha_id}>
                  <td className="px-3 py-2 font-medium">{row.ficha_numero}</td>
                  <td className="px-3 py-2">{row.programa_nombre || '—'}</td>
                  <td className="px-3 py-2">{row.jornada_nombre || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.promedio_hora}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.total_sesiones}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.dias_con_sesion}</td>
                </tr>
              ))}
              {!loading && (data?.hora_toma.detalle_por_ficha.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Sin sesiones en el período seleccionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bloque B */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600" aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            B — Cumplimiento de toma de asistencia por ficha
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Porcentaje de días programados en los que la ficha registró al menos una sesión.{' '}
          <strong>Con sesión</strong> coincide con <strong>Días c/ sesión</strong> del bloque A;{' '}
          <strong>Sesiones</strong> puede ser mayor si hubo varias tomas el mismo día.
        </p>
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Ficha</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Programa</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Jornada</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Días prog.</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Con sesión</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Sesiones</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">%</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(data?.cumplimiento.items ?? []).map((row) => (
                <Fragment key={row.ficha_id}>
                  <tr>
                    <td className="px-3 py-2 font-medium">{row.ficha_numero}</td>
                    <td className="px-3 py-2">{row.programa_nombre || '—'}</td>
                    <td className="px-3 py-2">{row.jornada_nombre || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.dias_programados}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-green-700 dark:text-green-400">
                      {row.dias_con_sesion}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                      {row.total_sesiones}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full ${pctBarClass(row.pct_cumplimiento)}`}
                            style={{ width: `${Math.min(100, row.pct_cumplimiento)}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-medium w-12 text-right">{row.pct_cumplimiento}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setFichaDetalleAbierta((prev) => (prev === row.ficha_id ? null : row.ficha_id))
                        }
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {fichaDetalleAbierta === row.ficha_id ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {fichaDetalleAbierta === row.ficha_id ? (
                    <tr key={`${row.ficha_id}-detalle`}>
                      <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-gray-800/40">
                        <CumplimientoDetalleFicha
                          key={row.ficha_id}
                          item={row}
                          onIrABloqueA={() => bloqueARef.current?.scrollIntoView({ behavior: 'smooth' })}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {!loading && (data?.cumplimiento.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    Sin fichas con días programados en el período.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bloque C */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-primary-600" aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            C — Asistencia semana anterior
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Semana calendario completa anterior ({data?.dia_semana.semana_desde || '…'} al{' '}
          {data?.dia_semana.semana_hasta || '…'}). Aprendices activos visibles en asistencia por día y jornada.
        </p>

        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDiaSemanaId(d.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                diaSemanaId === d.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {topDias.length > 0 ? (
          <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Días con más asistencia:</strong>{' '}
              {topDias.map((d, i) => (
                <span key={d.fecha ?? d.dia_semana_id}>
                  {i > 0 ? ', ' : ''}
                  {d.fecha ? `${d.fecha} (${d.dia_semana})` : d.dia_semana} ({formatNumero(d.vinieron)}{' '}
                  aprendices, {d.pct}%)
                </span>
              ))}
            </p>
          </div>
        ) : null}

        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Fecha</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Día</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Jornada</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Aprendices esp.</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Asistieron</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filasSemana.map((row) => (
                <tr key={`${row.fecha}-${row.jornada_nombre}`}>
                  <td className="px-3 py-2 tabular-nums">{row.fecha}</td>
                  <td className="px-3 py-2 font-medium">{row.dia_semana}</td>
                  <td className="px-3 py-2">{row.jornada_nombre || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumero(row.esperados)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumero(row.vinieron)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{row.pct}%</td>
                </tr>
              ))}
              {!loading && filasSemana.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Sin datos de asistencia para la semana anterior con los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
