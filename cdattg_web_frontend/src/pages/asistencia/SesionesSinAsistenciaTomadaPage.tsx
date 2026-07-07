import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import type { RegionalItem, SedeItem, SesionSinAsistenciaTomadaItem } from '../../types';

const DIAS_HISTORICO = 0;

const DIAS_OPCIONES = [
  { value: 7, label: 'Últimos 7 días' },
  { value: 15, label: 'Últimos 15 días' },
  { value: 30, label: 'Últimos 30 días' },
  { value: 60, label: 'Últimos 60 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: DIAS_HISTORICO, label: 'Desde el origen de los tiempos' },
] as const;

const PAGE_SIZE = 25;

const SesionSinAsistenciaRow = memo(function SesionSinAsistenciaRow({
  item,
}: {
  item: SesionSinAsistenciaTomadaItem;
}) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{item.fecha}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.ficha_numero}</td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        <div>{item.instructor_nombre || '—'}</div>
        {item.numero_documento ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Doc. {item.numero_documento}</div>
        ) : null}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.programa_nombre || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {[item.sede_nombre, item.jornada_nombre].filter(Boolean).join(' · ') || '—'}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={claseIncumplimiento(item)}>{etiquetaIncumplimiento(item)}</span>
      </td>
    </tr>
  );
});

function etiquetaIncumplimiento(item: SesionSinAsistenciaTomadaItem): string {
  if (item.tipo_incumplimiento === 'dia_sin_sesion') {
    return 'Sin Registro';
  }
  if (item.sesion_finalizada) {
    return 'Sesión finalizada sin marcas';
  }
  return 'Sesión abierta sin marcas';
}

function claseIncumplimiento(item: SesionSinAsistenciaTomadaItem): string {
  if (item.tipo_incumplimiento === 'dia_sin_sesion') {
    return 'inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  }
  if (item.sesion_finalizada) {
    return 'inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
  return 'inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
}

function claveFilaIncumplimiento(item: SesionSinAsistenciaTomadaItem): string {
  if (item.asistencia_id > 0) {
    return `sesion-${item.asistencia_id}`;
  }
  return `dia-${item.ficha_numero}-${item.instructor_id}-${item.fecha}`;
}

function filtrarSesiones(
  sesiones: SesionSinAsistenciaTomadaItem[],
  query: string,
): SesionSinAsistenciaTomadaItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return sesiones;
  return sesiones.filter(
    (s) =>
      s.ficha_numero.toLowerCase().includes(q) ||
      s.instructor_nombre.toLowerCase().includes(q) ||
      s.numero_documento.toLowerCase().includes(q) ||
      (s.programa_nombre || '').toLowerCase().includes(q) ||
      (s.sede_nombre || '').toLowerCase().includes(q),
  );
}

function mensajeResumenPeriodo(
  cantidad: number,
  data: { fecha_inicio?: string; fecha_fin?: string; historico_completo?: boolean } | null,
): string {
  const inicio = data?.fecha_inicio ?? '—';
  const fin = data?.fecha_fin ?? '—';
  if (data?.historico_completo) {
    return `${cantidad} incumplimiento(s) de toma de asistencia desde ${inicio} hasta ${fin}.`;
  }
  return `${cantidad} incumplimiento(s) de toma de asistencia entre ${inicio} y ${fin}.`;
}

export function SesionesSinAsistenciaTomadaPage() {
  const { roles } = useAuth();
  const esCoordinador = roles.includes('COORDINADOR');
  const esAdmin =
    roles.includes('SUPER ADMINISTRADOR') || roles.includes('ADMINISTRADOR');
  const puedeFiltrarInstitucional = esAdmin && !esCoordinador;

  const [dias, setDias] = useState<number>(30);
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<Awaited<ReturnType<typeof apiService.getSesionesSinAsistenciaTomada>> | null>(
    null,
  );

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

  useEffect(() => {
    setPage(1);
  }, [dias, regionalId, sedeId, searchQuery]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getSesionesSinAsistenciaTomada({
        dias,
        regional_id: regionalId ? Number(regionalId) : undefined,
        sede_id: sedeId ? Number(sedeId) : undefined,
      });
      setData(res);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar el reporte.'));
    } finally {
      setLoading(false);
    }
  }, [dias, regionalId, sedeId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const sesionesFiltradas = useMemo(
    () => filtrarSesiones(data?.sesiones ?? [], searchQuery),
    [data?.sesiones, searchQuery],
  );

  const totalFiltradas = sesionesFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltradas / PAGE_SIZE));
  const pageSegura = Math.min(page, totalPages);
  const sesionesPagina = useMemo(() => {
    const inicio = (pageSegura - 1) * PAGE_SIZE;
    return sesionesFiltradas.slice(inicio, inicio + PAGE_SIZE);
  }, [pageSegura, sesionesFiltradas]);

  useEffect(() => {
    if (page !== pageSegura) {
      setPage(pageSegura);
    }
  }, [page, pageSegura]);

  let filasTabla: ReactNode;
  if (loading) {
    filasTabla = (
      <tr>
        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando reporte…
        </td>
      </tr>
    );
  } else if (totalFiltradas === 0) {
    filasTabla = (
      <tr>
        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No se encontraron sesiones sin asistencia tomada en el período consultado.
        </td>
      </tr>
    );
  } else {
    filasTabla = sesionesPagina.map((s) => (
      <SesionSinAsistenciaRow key={claveFilaIncumplimiento(s)} item={s} />
    ));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sesiones sin asistencia tomada
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
          Días de formación programados en los que el instructor no tomó asistencia: ya sea porque abrió
          la sesión sin registrar a ningún aprendiz, o porque nunca abrió sesión ese día. Ninguno de
          estos casos se contabiliza como inasistencia del aprendiz en los reportes de bienestar.
        </p>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="dias-sin-asistencia" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Período (días)
          </label>
          <select
            id="dias-sin-asistencia"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="input-field min-w-[8rem]"
          >
            {DIAS_OPCIONES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {puedeFiltrarInstitucional ? (
          <>
            <div>
              <label htmlFor="regional-sin-asistencia" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Regional
              </label>
              <select
                id="regional-sin-asistencia"
                value={regionalId}
                onChange={(e) => setRegionalId(e.target.value)}
                className="input-field min-w-[12rem]"
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
              <label htmlFor="sede-sin-asistencia" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sede
              </label>
              <select
                id="sede-sin-asistencia"
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="input-field min-w-[12rem]"
              >
                <option value="">Todas</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div className="flex-1 min-w-[12rem]">
          <label htmlFor="buscar-sin-asistencia" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Buscar
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              id="buscar-sin-asistencia"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ficha, instructor, programa…"
              className="input-field pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" aria-hidden />
        <span>
          {loading
            ? 'Cargando…'
            : mensajeResumenPeriodo(totalFiltradas, data)}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <caption className="sr-only">
              Sesiones donde el instructor no registró asistencia de aprendices
            </caption>
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Ficha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Instructor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Programa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Sede / Jornada
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Situación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {filasTabla}
            </tbody>
          </table>
        </div>
        {!loading && totalFiltradas > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {(pageSegura - 1) * PAGE_SIZE + 1} a{' '}
              {Math.min(pageSegura * PAGE_SIZE, totalFiltradas)} de {totalFiltradas} resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSegura <= 1}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {pageSegura} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSegura >= totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
