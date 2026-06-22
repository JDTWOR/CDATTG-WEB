import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CalculatorIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { formatFechaVista, formatRangoFechasVista } from '../../utils/formatFecha';
import type { EleccionPlancha, EleccionProceso, EleccionResultado, RepresentanteAprendiz } from '../../types/eleccion';
import { administracionPaths } from '../../routes/paths';

const ESTADO_LABEL: Record<EleccionProceso['estado'], string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripción',
  votacion: 'Votación',
  empate_pendiente: 'Empate pendiente',
  cerrada: 'Cerrada',
};

const ESTADO_BADGE: Record<EleccionProceso['estado'], string> = {
  borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  inscripcion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  votacion: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  empate_pendiente: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  cerrada: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
};

const PLANCHA_ESTADO_LABEL: Record<string, string> = {
  pendiente_confirmacion: 'Pendiente confirmación',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  retirada: 'Retirada',
};

const FASES: EleccionProceso['estado'][] = ['borrador', 'inscripcion', 'votacion', 'cerrada'];

function estadoFaseIndex(estado: EleccionProceso['estado']): number {
  if (estado === 'empate_pendiente') return FASES.indexOf('votacion');
  return FASES.indexOf(estado);
}

type EstadoBadgeProps = Readonly<{ estado: EleccionProceso['estado'] }>;

function EstadoBadge({ estado }: EstadoBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_BADGE[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

type MetricCardProps = Readonly<{ label: string; value: number | string; hint?: string }>;

function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

type FaseStepperProps = Readonly<{ estado: EleccionProceso['estado'] }>;

function faseStepClasses(completada: boolean, actual: boolean): string {
  if (actual) return 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200';
  if (completada) return 'text-green-700 dark:text-green-400';
  return 'text-gray-400 dark:text-gray-500';
}

function faseStepDotClasses(completada: boolean, actual: boolean): string {
  if (actual) return 'bg-primary-600 text-white';
  if (completada) return 'bg-green-600 text-white';
  return 'bg-gray-200 text-gray-500 dark:bg-gray-700';
}

function faseStepIndicator(completada: boolean, index: number): string | number {
  if (completada) return '✓';
  return index + 1;
}

type FaseStepItemProps = Readonly<{
  fase: EleccionProceso['estado'];
  index: number;
  completada: boolean;
  actual: boolean;
  showConnector: boolean;
}>;

function FaseStepItem({ fase, index, completada, actual, showConnector }: FaseStepItemProps) {
  return (
    <li className="flex items-center">
      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${faseStepClasses(completada, actual)}`}>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${faseStepDotClasses(completada, actual)}`}
        >
          {faseStepIndicator(completada, index)}
        </span>
        {ESTADO_LABEL[fase]}
      </span>
      {showConnector ? (
        <span className="mx-1 hidden h-px w-6 bg-gray-200 sm:inline dark:bg-gray-600" aria-hidden />
      ) : null}
    </li>
  );
}

function FaseStepper({ estado }: FaseStepperProps) {
  const activo = estadoFaseIndex(estado);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs sm:gap-0">
      {FASES.map((fase, i) => (
        <FaseStepItem
          key={fase}
          fase={fase}
          index={i}
          completada={i < activo}
          actual={i === activo}
          showConnector={i < FASES.length - 1}
        />
      ))}
    </ol>
  );
}

type CronogramaCardProps = Readonly<{ proceso: EleccionProceso }>;

function CronogramaCard({ proceso }: CronogramaCardProps) {
  const inscripcion = formatRangoFechasVista(proceso.fecha_inscripcion_inicio, proceso.fecha_inscripcion_fin);
  const votacion = formatRangoFechasVista(proceso.fecha_votacion_inicio, proceso.fecha_votacion_fin);
  if (!inscripcion && !votacion && !proceso.min_dias_matricula) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Cronograma y requisitos</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-gray-500">Inscripción</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{inscripcion ?? 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Votación</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{votacion ?? 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Antigüedad mínima</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {proceso.min_dias_matricula ?? 30} días matriculado
          </dd>
        </div>
      </dl>
    </section>
  );
}

type AccionesProcesoProps = Readonly<{
  proceso: EleccionProceso;
  busy: string | null;
  onAbrirInscripcion: () => void;
  onAbrirVotacion: () => void;
  onCalcular: () => void;
  onExportar: () => void;
  onActualizar: () => void;
}>;

function AccionesProceso({
  proceso,
  busy,
  onAbrirInscripcion,
  onAbrirVotacion,
  onCalcular,
  onExportar,
  onActualizar,
}: AccionesProcesoProps) {
  const btn = (id: string, label: string, onClick: () => void, primary = false) => (
    <button
      key={id}
      type="button"
      className={primary ? 'btn-primary' : 'btn-secondary'}
      disabled={busy !== null}
      onClick={onClick}
    >
      {busy === id ? 'Procesando…' : label}
    </button>
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Acciones del proceso</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Avance el ciclo según la fase actual. Las acciones no disponibles están ocultas.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary inline-flex items-center gap-2" disabled={busy !== null} onClick={onActualizar}>
          <ArrowPathIcon className="h-4 w-4" />
          Actualizar
        </button>
        {proceso.estado === 'borrador' ? btn('inscripcion', 'Abrir inscripción', onAbrirInscripcion, true) : null}
        {proceso.estado === 'inscripcion' ? btn('votacion', 'Abrir votación', onAbrirVotacion, true) : null}
        {proceso.estado === 'votacion' ? btn('calcular', 'Calcular resultado', onCalcular, true) : null}
        {proceso.estado === 'cerrada' || proceso.estado === 'empate_pendiente' || resultadoTieneDatos(proceso) ? (
          <button type="button" className="btn-secondary inline-flex items-center gap-2" disabled={busy !== null} onClick={onExportar}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar CSV
          </button>
        ) : null}
      </div>
    </section>
  );
}

function resultadoTieneDatos(proceso: EleccionProceso): boolean {
  return (proceso.votos_registrados ?? 0) > 0;
}

type DesempateSectionProps = Readonly<{
  planchas: EleccionPlancha[];
  resultado: EleccionResultado | null;
  desempatePlanchaId: string;
  desempateNota: string;
  busy: boolean;
  onPlanchaChange: (value: string) => void;
  onNotaChange: (value: string) => void;
  onSubmit: () => void;
}>;

function DesempateSection({
  planchas,
  resultado,
  desempatePlanchaId,
  desempateNota,
  busy,
  onPlanchaChange,
  onNotaChange,
  onSubmit,
}: DesempateSectionProps) {
  const empatadas =
    resultado?.conteo.filter((c) => {
      const max = Math.max(...(resultado.conteo.map((x) => x.votos) ?? [0]));
      return c.votos === max && max > 0;
    }) ?? [];
  const opciones = empatadas.length > 0 ? empatadas : planchas.filter((p) => p.estado === 'confirmada').map((p) => ({
    plancha_id: p.id,
    label: `${p.titular.nombre} / ${p.suplente.nombre}`,
    votos: p.votos_recibidos ?? 0,
  }));

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <h2 className="font-semibold text-amber-900 dark:text-amber-200">Registrar desempate</h2>
      <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/90">
        Seleccione la plancha ganadora y documente el acta o sorteo realizado.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="desempate-plancha" className="mb-1 block text-sm font-medium text-amber-900 dark:text-amber-200">
            Plancha ganadora
          </label>
          <select
            id="desempate-plancha"
            className="input-field w-full"
            value={desempatePlanchaId}
            onChange={(e) => onPlanchaChange(e.target.value)}
          >
            <option value="">Seleccione plancha</option>
            {opciones.map((o) => (
              <option key={o.plancha_id} value={o.plancha_id}>
                {o.label} ({o.votos} votos)
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="desempate-nota" className="mb-1 block text-sm font-medium text-amber-900 dark:text-amber-200">
            Acta / nota de desempate
          </label>
          <textarea
            id="desempate-nota"
            className="input-field min-h-[80px] w-full"
            placeholder="Describa el procedimiento de desempate (sorteo, acta, etc.)"
            value={desempateNota}
            onChange={(e) => onNotaChange(e.target.value)}
          />
        </div>
      </div>
      <button
        type="button"
        className="btn-primary mt-3"
        disabled={busy || !desempatePlanchaId || !desempateNota.trim()}
        onClick={onSubmit}
      >
        {busy ? 'Registrando…' : 'Registrar desempate y cerrar'}
      </button>
    </section>
  );
}

type PlanchasSectionProps = Readonly<{
  planchas: EleccionPlancha[];
  busy: boolean;
  onRechazar: (planchaId: number, label: string) => void;
}>;

function PlanchasSection({ planchas, busy, onRechazar }: PlanchasSectionProps) {
  const confirmadas = planchas.filter((p) => p.estado === 'confirmada').length;
  const pendientes = planchas.filter((p) => p.estado === 'pendiente_confirmacion').length;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" aria-hidden />
          <h2 className="font-semibold text-gray-900 dark:text-white">Planchas inscritas</h2>
        </div>
        <p className="text-xs text-gray-500">
          {confirmadas} confirmadas · {pendientes} pendientes · {planchas.length} total
        </p>
      </div>
      {planchas.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">No hay planchas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-2">Candidatos</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Confirmación</th>
                <th className="px-4 py-2 text-right">Votos</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm dark:divide-gray-700/80">
              {planchas.map((pl) => (
                <tr key={pl.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pl.titular.nombre} / {pl.suplente.nombre}
                    </p>
                    <p className="text-xs text-gray-500">#{pl.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {PLANCHA_ESTADO_LABEL[pl.estado] ?? pl.estado}
                    </span>
                    {pl.motivo_rechazo ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{pl.motivo_rechazo}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    Titular {pl.titular_confirmado ? '✓' : '—'} · Suplente {pl.suplente_confirmado ? '✓' : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{pl.votos_recibidos ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {pl.estado === 'pendiente_confirmacion' || pl.estado === 'confirmada' ? (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => onRechazar(pl.id, `${pl.titular.nombre} / ${pl.suplente.nombre}`)}
                      >
                        Rechazar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

type ResultadosSectionProps = Readonly<{ resultado: EleccionResultado }>;

function ResultadosSection({ resultado }: ResultadosSectionProps) {
  const maxVotos = Math.max(...resultado.conteo.map((c) => c.votos), 1);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
          <h2 className="font-semibold text-gray-900 dark:text-white">Resultados</h2>
        </div>
        {resultado.plancha_ganadora_id ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
            <CheckBadgeIcon className="h-4 w-4" />
            Ganador #{resultado.plancha_ganadora_id}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Votos totales" value={resultado.votos_totales} />
        <MetricCard label="Participación" value={`${resultado.participacion_pct.toFixed(1)}%`} />
        <MetricCard label="Estado" value={resultado.empate ? 'Empate' : 'Definido'} />
      </div>
      {resultado.nota_desempate ? (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
          <strong>Desempate:</strong> {resultado.nota_desempate}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {resultado.conteo.map((c) => {
          const esGanadora = resultado.plancha_ganadora_id === c.plancha_id;
          const pct = maxVotos > 0 ? (c.votos / maxVotos) * 100 : 0;
          return (
            <li key={c.plancha_id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={esGanadora ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}>
                  {c.label}
                </span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-white">{c.votos}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${esGanadora ? 'bg-primary-600' : 'bg-primary-300 dark:bg-primary-700'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type HistorialSectionProps = Readonly<{ historial: RepresentanteAprendiz[] }>;

function HistorialSection({ historial }: HistorialSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <UserGroupIcon className="h-5 w-5 text-gray-500" aria-hidden />
        <h2 className="font-semibold text-gray-900 dark:text-white">Historial de representantes</h2>
      </div>
      <ul className="mt-4 space-y-2">
        {historial.map((h) => (
          <li
            key={`${h.proceso_id}-${h.vigencia_desde}`}
            className="rounded-lg border border-gray-100 px-3 py-3 dark:border-gray-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {h.nombre_ciclo ?? `Proceso ${h.proceso_id}`}
                {h.anio ? <span className="text-gray-500"> · {h.anio}</span> : null}
              </span>
              {h.vigencia_hasta ? null : (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                  Vigente
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {h.titular.nombre} / {h.suplente.nombre}
            </p>
            <p className="text-xs text-gray-500">
              Desde {formatFechaVista(h.vigencia_desde)}
              {h.vigencia_hasta ? ` · Hasta ${formatFechaVista(h.vigencia_hasta)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EleccionProcesoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const procesoId = Number(id);
  const [proceso, setProceso] = useState<EleccionProceso | null>(null);
  const [planchas, setPlanchas] = useState<EleccionPlancha[]>([]);
  const [resultado, setResultado] = useState<EleccionResultado | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [desempatePlanchaId, setDesempatePlanchaId] = useState('');
  const [desempateNota, setDesempateNota] = useState('');
  const [historial, setHistorial] = useState<RepresentanteAprendiz[]>([]);

  const load = useCallback(async () => {
    if (!procesoId) return;
    setLoading(true);
    setError('');
    try {
      const p = await apiService.getEleccionProceso(procesoId);
      const [pl, res, hist] = await Promise.all([
        apiService.getEleccionPlanchasAdmin(procesoId, false),
        apiService.getEleccionResultados(procesoId, true).catch(() => null),
        apiService.getHistorialRepresentantes(p.regional_id).catch(() => []),
      ]);
      setProceso(p);
      setPlanchas(pl);
      setResultado(res);
      setHistorial(hist);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Error al cargar el proceso electoral.'));
    } finally {
      setLoading(false);
    }
  }, [procesoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (actionId: string, fn: () => Promise<unknown>) => {
    setBusy(actionId);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(axiosErrorMessage(e, 'No se pudo ejecutar la acción.'));
    } finally {
      setBusy(null);
    }
  };

  const exportCSV = async () => {
    setBusy('export');
    setError('');
    try {
      const blob = await apiService.exportEleccionResultadosCSV(procesoId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eleccion_${procesoId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(axiosErrorMessage(e, 'No se pudo exportar el CSV.'));
    } finally {
      setBusy(null);
    }
  };

  const handleRechazar = (planchaId: number, label: string) => {
    if (!globalThis.confirm(`¿Rechazar la plancha ${label}?`)) return;
    void run('rechazar', () => apiService.rechazarEleccionPlancha(planchaId, 'Rechazada por administración'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Cargando proceso electoral…</p>
      </div>
    );
  }

  if (!proceso) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center dark:border-red-900/50 dark:bg-red-950/40">
        <p className="text-red-700 dark:text-red-300">Proceso no encontrado.</p>
        <Link to={administracionPaths.elecciones} className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          Volver a elecciones
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-4">
        <Link
          to={administracionPaths.elecciones}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a elecciones
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{proceso.nombre_ciclo}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {proceso.regional_nombre ?? `Regional ${proceso.regional_id}`} · Año {proceso.anio}
            </p>
          </div>
          <EstadoBadge estado={proceso.estado} />
        </div>
        <FaseStepper estado={proceso.estado} />
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Planchas confirmadas" value={proceso.planchas_confirmadas ?? 0} />
        <MetricCard label="Votos registrados" value={proceso.votos_registrados ?? 0} />
        <MetricCard
          label="Aprendices elegibles"
          value={proceso.aprendices_elegibles ?? 0}
          hint="Activos en la regional"
        />
      </div>

      <CronogramaCard proceso={proceso} />

      <AccionesProceso
        proceso={proceso}
        busy={busy}
        onActualizar={() => void load()}
        onAbrirInscripcion={() => void run('inscripcion', () => apiService.eleccionAbrirInscripcion(procesoId))}
        onAbrirVotacion={() => void run('votacion', () => apiService.eleccionAbrirVotacion(procesoId))}
        onCalcular={() => void run('calcular', () => apiService.eleccionCalcularResultado(procesoId))}
        onExportar={() => void exportCSV()}
      />

      {proceso.estado === 'empate_pendiente' ? (
        <DesempateSection
          planchas={planchas}
          resultado={resultado}
          desempatePlanchaId={desempatePlanchaId}
          desempateNota={desempateNota}
          busy={busy === 'desempate'}
          onPlanchaChange={setDesempatePlanchaId}
          onNotaChange={setDesempateNota}
          onSubmit={() =>
            void run('desempate', () =>
              apiService.eleccionRegistrarDesempate(procesoId, {
                plancha_ganadora_id: Number(desempatePlanchaId),
                nota_desempate: desempateNota,
              }),
            )
          }
        />
      ) : null}

      <PlanchasSection planchas={planchas} busy={busy !== null} onRechazar={handleRechazar} />

      {resultado ? <ResultadosSection resultado={resultado} /> : null}

      {historial.length > 0 ? <HistorialSection historial={historial} /> : null}
    </div>
  );
}
