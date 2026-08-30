import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartBarIcon, ClockIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type {
  AccesoEstadisticasResponse,
  AccesoHistorialItem,
  AccesoHistorialParams,
  AccesoHistorialResponse,
  AccesoHoraBucket,
  RegionalItem,
  SedeItem,
} from '../types';

const TIPO_LABELS: Record<string, string> = {
  APRENDIZ: 'Aprendiz',
  INSTRUCTOR: 'Instructor',
  ADMINISTRATIVO: 'Administrativo',
  PERSONAL_OPERATIVO_APOYO: 'Personal operativo y de apoyo',
  CONTRATISTA: 'Contratista de prestación de servicios',
  VISITANTE: 'Visitante',
};

const LIVE_REFRESH_MS = 5000;

const MOTIVO_LABELS: Record<string, string> = {
  DESCANSO: 'Descanso',
  CAFETERIA: 'Cafetería',
  FIN_JORNADA: 'Fin de jornada',
  CITA_MEDICA: 'Cita médica',
  NOVEDAD_FAMILIAR: 'Novedad familiar',
  COMISION_INSTITUCIONAL: 'Comisión institucional',
  OTRO: 'Otro',
};

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function haceDiasISO(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function kpiToneClass(tone?: string): string {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100';
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100';
    case 'red':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100';
    default:
      return 'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
  }
}

function KpiCard({ label, value, tone }: Readonly<{ label: string; value: number | string; tone?: string }>) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${kpiToneClass(tone)}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DistList({ title, data, labels }: Readonly<{ title: string; data?: Record<string, number>; labels?: Record<string, string> }>) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Sin datos</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map(([k, n]) => (
            <li key={k} className="flex justify-between gap-2">
              <span className="text-gray-700 dark:text-gray-300">{labels?.[k] || k || '—'}</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatHoraLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function formatIndice(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

function normalizeHoras24(data?: AccesoHoraBucket[]): AccesoHoraBucket[] {
  if (data?.length === 24) return data;
  return Array.from({ length: 24 }, (_, hora) => ({
    hora,
    n: data?.find((d) => d.hora === hora)?.n ?? 0,
  }));
}

/** Todas las horas empatadas en el máximo (puede haber varias horas pico). */
function horasPicoEmpatadas(data?: AccesoHoraBucket[]): { horas: number[]; n: number } {
  const rows = normalizeHoras24(data);
  const max = Math.max(0, ...rows.map((r) => r.n));
  if (max <= 0) return { horas: [], n: 0 };
  return { horas: rows.filter((r) => r.n === max).map((r) => r.hora), n: max };
}

function formatHorasPico(horas: number[], n: number): string {
  if (horas.length === 0 || n <= 0) return 'Sin movimientos';
  const labels = horas.map((h) => formatHoraLabel(h)).join(', ');
  if (horas.length === 1) return `${labels} (${n})`;
  return `${labels} — ${n} c/u`;
}

/** Tabla estilo boceto: horas 0–11 | 12–23, con cantidad por hora. */
function HalfDayHourTable({
  title,
  metricLabel,
  data,
  tone,
}: Readonly<{
  title: string;
  metricLabel: string;
  data?: AccesoHoraBucket[];
  tone: 'emerald' | 'amber';
}>) {
  const rows = normalizeHoras24(data);
  const pico = horasPicoEmpatadas(rows);
  const picoSet = new Set(pico.horas);
  const left = rows.slice(0, 12);
  const right = rows.slice(12, 24);

  const headTone =
    tone === 'emerald'
      ? 'bg-emerald-700 text-white dark:bg-emerald-800'
      : 'bg-amber-700 text-white dark:bg-amber-800';
  const picoCell =
    tone === 'emerald'
      ? 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
      : 'bg-amber-50 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';

  const renderHalf = (half: AccesoHoraBucket[], keyPrefix: string) => (
    <table className="min-w-0 w-full table-fixed border-collapse">
      <thead>
        <tr className={headTone}>
          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" aria-hidden />
              Hora
            </span>
          </th>
          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center justify-end gap-1.5">
              <UserIcon className="h-4 w-4" aria-hidden />
              {metricLabel}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {half.map((row) => {
          const esPico = picoSet.has(row.hora);
          return (
            <tr key={`${keyPrefix}-${row.hora}`} className="border-b border-gray-200 dark:border-gray-700">
              <td className="px-2 py-1.5 text-sm tabular-nums text-gray-800 dark:text-gray-200">
                {row.hora}
                {esPico ? (
                  <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary-600 dark:text-primary-300">
                    pico
                  </span>
                ) : null}
              </td>
              <td
                className={`px-2 py-1.5 text-right text-sm tabular-nums ${
                  esPico ? picoCell : 'text-gray-900 dark:text-white'
                }`}
              >
                {row.n > 0 ? row.n : ''}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Pico:{' '}
          <strong className={tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
            {formatHorasPico(pico.horas, pico.n)}
          </strong>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="min-w-0 border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-700">
          {renderHalf(left, 'am')}
        </div>
        <div className="min-w-0">{renderHalf(right, 'pm')}</div>
      </div>
    </div>
  );
}

function shiftDayISO(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function VigilanciaAccesoPanel() {
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(haceDiasISO(7));
  const [fechaHasta, setFechaHasta] = useState(hoyISO());
  const [tipoPersona, setTipoPersona] = useState('');
  const [motivoSalida, setMotivoSalida] = useState('');
  const [documento, setDocumento] = useState('');
  const [estado, setEstado] = useState('todos');
  const [soloSinIngreso, setSoloSinIngreso] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState<AccesoHistorialResponse | null>(null);
  const [stats, setStats] = useState<AccesoEstadisticasResponse | null>(null);
  const [diaGrafico, setDiaGrafico] = useState(hoyISO());
  const [statsDia, setStatsDia] = useState<AccesoEstadisticasResponse | null>(null);
  const [loadingDia, setLoadingDia] = useState(false);
  const [liveUpdating, setLiveUpdating] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const liveInFlight = useRef(false);

  const sedesFiltradas = useMemo(
    () => sedes.filter((s) => !regionalId || String(s.regional_id ?? '') === regionalId),
    [sedes, regionalId],
  );

  useEffect(() => {
    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])
      .then(([regs, seds]) => {
        setRegionales(regs ?? []);
        setSedes(seds ?? []);
      })
      .catch((e: unknown) => setError(axiosErrorMessage(e, 'No se pudieron cargar catálogos.')));
  }, []);

  const buildParams = useCallback(
    (pageOverride?: number): AccesoHistorialParams => {
      const params: AccesoHistorialParams = {
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        tipo_persona: tipoPersona || undefined,
        motivo_salida: motivoSalida || undefined,
        documento: documento.trim() || undefined,
        estado: estado === 'todos' ? undefined : estado,
        page: pageOverride ?? page,
        page_size: 25,
      };
      if (regionalId) params.regional_id = Number(regionalId);
      if (sedeId) params.sede_id = Number(sedeId);
      if (soloSinIngreso) params.salida_sin_ingreso = true;
      return params;
    },
    [
      fechaDesde,
      fechaHasta,
      tipoPersona,
      motivoSalida,
      documento,
      estado,
      page,
      regionalId,
      sedeId,
      soloSinIngreso,
    ],
  );

  const cargarDiaGrafico = useCallback(
    async (dia: string, overrides?: Partial<AccesoHistorialParams>, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingDia(true);
      try {
        const params: AccesoHistorialParams = {
          ...buildParams(1),
          ...overrides,
          fecha_desde: dia,
          fecha_hasta: dia,
          page: 1,
        };
        const est = await apiService.accesoEstadisticas(params);
        setStatsDia(est);
        setUltimaActualizacion(new Date());
      } catch (e: unknown) {
        if (!opts?.silent) {
          setError(axiosErrorMessage(e, 'No se pudo cargar la tabla del día.'));
        }
      } finally {
        if (!opts?.silent) setLoadingDia(false);
      }
    },
    [buildParams],
  );

  const cargar = useCallback(
    async (
      pageOverride?: number,
      overrides?: Partial<AccesoHistorialParams>,
      diaChart?: string,
      opts?: { silent?: boolean },
    ) => {
      if (!opts?.silent) {
        setLoading(true);
        setError('');
      } else {
        setLiveUpdating(true);
      }
      const params = { ...buildParams(pageOverride), ...overrides };
      try {
        const [hist, est] = await Promise.all([
          apiService.accesoHistorial(params),
          apiService.accesoEstadisticas(params),
        ]);
        setHistorial(hist);
        setStats(est);
        if (pageOverride && !opts?.silent) setPage(pageOverride);
        const dia = diaChart ?? diaGrafico;
        if (diaChart) setDiaGrafico(diaChart);
        await cargarDiaGrafico(dia, overrides, { silent: opts?.silent });
      } catch (e: unknown) {
        if (!opts?.silent) {
          setError(axiosErrorMessage(e, 'No se pudo cargar el reporte.'));
        }
      } finally {
        if (!opts?.silent) setLoading(false);
        else setLiveUpdating(false);
      }
    },
    [buildParams, cargarDiaGrafico, diaGrafico],
  );

  useEffect(() => {
    void cargar(1);
    // carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tiempo real: refresca KPIs, historial y tabla horaria cada pocos segundos.
  useEffect(() => {
    const id = globalThis.setInterval(() => {
      if (liveInFlight.current) return;
      liveInFlight.current = true;
      void cargar(undefined, undefined, undefined, { silent: true }).finally(() => {
        liveInFlight.current = false;
      });
    }, LIVE_REFRESH_MS);
    return () => globalThis.clearInterval(id);
  }, [cargar]);

  const totalPages = historial ? Math.max(1, Math.ceil(historial.total / historial.page_size)) : 1;

  const irDiaGrafico = (dia: string) => {
    if (dia > hoyISO()) return;
    setDiaGrafico(dia);
    void cargarDiaGrafico(dia);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-8">
      <header>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Reporte de accesos</h1>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Historial, índice entrada/salida, horas pico (incluye empates) y filtros por tipo, motivo y fechas.
          Los datos se actualizan en tiempo real cada 5 segundos.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="rep-regional" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Regional
            </label>
            <select
              id="rep-regional"
              className="input-field w-full"
              value={regionalId}
              onChange={(e) => {
                setRegionalId(e.target.value);
                setSedeId('');
              }}
            >
              <option value="">Todas</option>
              {regionales.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sede
            </label>
            <select
              id="rep-sede"
              className="input-field w-full"
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
            >
              <option value="">Todas</option>
              {sedesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-desde" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Desde
            </label>
            <input
              id="rep-desde"
              type="date"
              className="input-field w-full"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rep-hasta" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hasta
            </label>
            <input
              id="rep-hasta"
              type="date"
              className="input-field w-full"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rep-tipo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo persona
            </label>
            <select
              id="rep-tipo"
              className="input-field w-full"
              value={tipoPersona}
              onChange={(e) => setTipoPersona(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-motivo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo de salida
            </label>
            <select
              id="rep-motivo"
              className="input-field w-full"
              value={motivoSalida}
              onChange={(e) => setMotivoSalida(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(MOTIVO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-estado" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <select
              id="rep-estado"
              className="input-field w-full"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="abierto">Dentro (abierto)</option>
              <option value="cerrado">Cerrados (con salida)</option>
            </select>
          </div>
          <div>
            <label htmlFor="rep-doc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documento
            </label>
            <input
              id="rep-doc"
              type="text"
              className="input-field w-full"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Buscar documento"
            />
          </div>
          <div className="flex items-end gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={soloSinIngreso}
                onChange={(e) => setSoloSinIngreso(e.target.checked)}
              />{' '}
              Solo salidas sin ingreso
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
            onClick={() => void cargar(1)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {loading ? 'Cargando…' : 'Consultar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => {
              const hoy = hoyISO();
              setFechaDesde(hoy);
              setFechaHasta(hoy);
              void cargar(1, { fecha_desde: hoy, fecha_hasta: hoy }, hoy);
            }}
          >
            Solo hoy
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => {
              const desde = haceDiasISO(7);
              const hasta = hoyISO();
              setFechaDesde(desde);
              setFechaHasta(hasta);
              void cargar(1, { fecha_desde: desde, fecha_hasta: hasta });
            }}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => {
              const desde = haceDiasISO(30);
              const hasta = hoyISO();
              setFechaDesde(desde);
              setFechaHasta(hasta);
              void cargar(1, { fecha_desde: desde, fecha_hasta: hasta });
            }}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => {
              setTipoPersona('APRENDIZ');
              void cargar(1, { tipo_persona: 'APRENDIZ' });
            }}
          >
            Solo aprendices
          </button>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {stats ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Ingresos (periodo)" value={stats.total_ingresos} tone="emerald" />
          <KpiCard label="Salidas (periodo)" value={stats.total_salidas} tone="amber" />
          <KpiCard
            label="Índice salida/ingreso"
            value={formatIndice(stats.indice_salida_ingreso)}
            tone="emerald"
          />
          <KpiCard label="Dentro ahora" value={stats.dentro_ahora} />
          <KpiCard label="Salidas sin ingreso" value={stats.salidas_sin_ingreso} tone="red" />
        </section>
      ) : null}

      {stats || statsDia ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tablas por hora (24 h)</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Una tabla de ingresos y otra de salidas (0–11 y 12–23). Si varias horas empatan el máximo, todas
                aparecen como pico. Se actualiza en tiempo real.
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {liveUpdating ? 'Actualizando…' : 'En vivo'}
                {ultimaActualizacion
                  ? ` · Última sync ${ultimaActualizacion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                className="btn-secondary min-h-[40px]"
                disabled={loadingDia}
                onClick={() => irDiaGrafico(shiftDayISO(diaGrafico, -1))}
              >
                ← Día anterior
              </button>
              <div>
                <label htmlFor="dia-grafico" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Día de la tabla
                </label>
                <input
                  id="dia-grafico"
                  type="date"
                  className="input-field"
                  max={hoyISO()}
                  value={diaGrafico}
                  disabled={loadingDia}
                  onChange={(e) => irDiaGrafico(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-secondary min-h-[40px]"
                disabled={loadingDia || diaGrafico >= hoyISO()}
                onClick={() => irDiaGrafico(shiftDayISO(diaGrafico, 1))}
              >
                Día siguiente →
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[40px]"
                disabled={loadingDia || diaGrafico === hoyISO()}
                onClick={() => irDiaGrafico(hoyISO())}
              >
                Hoy
              </button>
            </div>
          </div>
          {loadingDia ? (
            <p className="text-sm text-primary-600 dark:text-primary-400">Cargando tabla del {diaGrafico}…</p>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            <HalfDayHourTable
              title={`Ingresos — ${diaGrafico}`}
              metricLabel="Ingreso"
              data={statsDia?.ingresos_por_hora}
              tone="emerald"
            />
            <HalfDayHourTable
              title={`Salidas — ${diaGrafico}`}
              metricLabel="Salida"
              data={statsDia?.salidas_por_hora}
              tone="amber"
            />
          </div>
        </section>
      ) : null}

      {stats ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <DistList title="Por tipo de persona" data={stats.por_tipo_persona} labels={TIPO_LABELS} />
          <DistList title="Por motivo de salida" data={stats.por_motivo_salida} labels={MOTIVO_LABELS} />
          <DistList title="Por método" data={stats.por_metodo} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial {historial ? `(${historial.total})` : ''}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Sede</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Entrada</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Salida</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(historial?.items || []).map((item: AccesoHistorialItem) => (
                <tr key={item.visita_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {item.persona?.numero_documento || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {item.persona?.nombre_completo || 'Sin nombre'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {TIPO_LABELS[item.tipo_persona] || item.tipo_persona}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.sede_nombre || item.sede_id}
                    {item.regional_nombre ? (
                      <div className="text-xs text-gray-400">{item.regional_nombre}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {formatHora(item.timestamp_entrada)}
                  </td>
                  <td className="px-3 py-2 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {formatHora(item.timestamp_salida)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.salida_sin_ingreso ? (
                      <span className="mr-1 inline-flex rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                        Sin ingreso
                      </span>
                    ) : null}
                    {MOTIVO_LABELS[item.motivo_salida || ''] || item.motivo_salida || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        item.estado === 'abierto'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.estado === 'abierto' ? 'Dentro' : 'Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && (historial?.items?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {historial && historial.total > historial.page_size ? (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Página {historial.page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={loading || page <= 1}
                onClick={() => void cargar(page - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={loading || page >= totalPages}
                onClick={() => void cargar(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default VigilanciaAccesoPanel;
