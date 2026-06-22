import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { EleccionPlancha, EleccionProceso, EleccionResultado, RepresentanteAprendiz } from '../../types/eleccion';
import { administracionPaths } from '../../routes/paths';

export function EleccionProcesoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const procesoId = Number(id);
  const [proceso, setProceso] = useState<EleccionProceso | null>(null);
  const [planchas, setPlanchas] = useState<EleccionPlancha[]>([]);
  const [resultado, setResultado] = useState<EleccionResultado | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(axiosErrorMessage(e, 'No se pudo ejecutar la acción.'));
    }
  };

  const exportCSV = async () => {
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
    }
  };

  if (loading) return <p className="text-gray-500">Cargando proceso…</p>;
  if (!proceso) return <p className="text-red-600">Proceso no encontrado.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to={administracionPaths.elecciones} className="text-sm text-primary-600 hover:underline dark:text-primary-400">
          ← Volver a elecciones
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{proceso.nombre_ciclo}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {proceso.regional_nombre} · Estado: <strong>{proceso.estado}</strong>
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => void run(() => apiService.eleccionAbrirInscripcion(procesoId))}>
          Abrir inscripción
        </button>
        <button type="button" className="btn-secondary" onClick={() => void run(() => apiService.eleccionAbrirVotacion(procesoId))}>
          Abrir votación
        </button>
        <button type="button" className="btn-primary" onClick={() => void run(() => apiService.eleccionCalcularResultado(procesoId))}>
          Calcular resultado
        </button>
        <button type="button" className="btn-secondary" onClick={() => void exportCSV()}>
          Exportar CSV
        </button>
      </div>

      {proceso.estado === 'empate_pendiente' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">Registrar desempate</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="input"
              placeholder="ID plancha ganadora"
              value={desempatePlanchaId}
              onChange={(e) => setDesempatePlanchaId(e.target.value)}
            />
            <input
              className="input min-w-[240px] flex-1"
              placeholder="Acta / nota de sorteo"
              value={desempateNota}
              onChange={(e) => setDesempateNota(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void run(() =>
                  apiService.eleccionRegistrarDesempate(procesoId, {
                    plancha_ganadora_id: Number(desempatePlanchaId),
                    nota_desempate: desempateNota,
                  }),
                )
              }
            >
              Registrar
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">Planchas ({planchas.length})</h2>
        <ul className="mt-3 space-y-2">
          {planchas.map((pl) => (
            <li key={pl.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {pl.titular.nombre} / {pl.suplente.nombre}
                </span>
                <span className="ml-2 text-xs text-gray-500">#{pl.id} · {pl.estado}</span>
              </div>
              {pl.estado === 'pendiente_confirmacion' || pl.estado === 'confirmada' ? (
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() =>
                    void run(() => apiService.rechazarEleccionPlancha(pl.id, 'Rechazada por administración'))
                  }
                >
                  Rechazar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {resultado ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Resultados</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Votos: {resultado.votos_totales} · Participación: {resultado.participacion_pct.toFixed(1)}%
            {resultado.empate ? ' · Empate' : ''}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {resultado.conteo.map((c) => (
              <li key={c.plancha_id}>
                {c.label}: <strong>{c.votos}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {historial.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Historial de representantes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {historial.map((h) => (
              <li
                key={`${h.proceso_id}-${h.vigencia_desde}`}
                className="rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {h.nombre_ciclo ?? `Proceso ${h.proceso_id}`}
                </span>
                {h.anio ? <span className="text-gray-500"> · {h.anio}</span> : null}
                <p className="text-gray-700 dark:text-gray-300">
                  {h.titular.nombre} / {h.suplente.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  Desde {new Date(h.vigencia_desde).toLocaleDateString('es-CO')}
                  {h.vigencia_hasta
                    ? ` · Hasta ${new Date(h.vigencia_hasta).toLocaleDateString('es-CO')}`
                    : ' · Vigente'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
