import { useState, useEffect, useCallback, memo, useRef, type ComponentProps, type ReactNode } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  UserPlusIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
  PencilSquareIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { EscanerQR } from '../components/EscanerQR';
import { useAuth } from '../context/AuthContext';
import type {
  FichaCaracterizacionResponse,
  AsistenciaResponse,
  AprendizResponse,
  AsistenciaAprendizResponse,
  TipoObservacionAsistenciaItem,
} from '../types';

/** Agrupa registros de sesión por aprendiz_id (soporta múltiples tramos por aprendiz). */
function groupRegistrosByAprendiz(list: AsistenciaAprendizResponse[]): Map<number, AsistenciaAprendizResponse[]> {
  const map = new Map<number, AsistenciaAprendizResponse[]>();
  for (const aa of list) {
    const id = aa.aprendiz_id;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(aa);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      if (a.hora_ingreso && b.hora_ingreso) {
        return new Date(a.hora_ingreso).getTime() - new Date(b.hora_ingreso).getTime();
      }
      return a.id - b.id;
    });
  }
  return map;
}

/** Resumen de múltiples tramos de un aprendiz: tramo abierto, primera entrada, última salida, observaciones. */
function summaryRegistros(registros: AsistenciaAprendizResponse[]) {
  const open = registros.find((r) => r.hora_ingreso && !r.hora_salida) ?? null;
  const conIngreso = registros.filter((r) => {
    if (!r.hora_ingreso) return false;
    return !Number.isNaN(new Date(r.hora_ingreso).getTime());
  });
  const conSalida = registros.filter((r) => {
    if (!r.hora_salida) return false;
    return !Number.isNaN(new Date(r.hora_salida).getTime());
  });

  let firstIngreso: string | null = null;
  if (conIngreso.length > 0) {
    const earliest = conIngreso.reduce((best, cur) =>
      new Date(cur.hora_ingreso!).getTime() < new Date(best.hora_ingreso!).getTime() ? cur : best,
      conIngreso[0],
    );
    firstIngreso = new Date(earliest.hora_ingreso!).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  let lastSalida: string | null = null;
  if (conSalida.length > 0) {
    const latest = conSalida.reduce((best, cur) =>
      new Date(cur.hora_salida!).getTime() > new Date(best.hora_salida!).getTime() ? cur : best,
      conSalida[0],
    );
    lastSalida = new Date(latest.hora_salida!).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const lastReg = registros.length > 0 ? registros.at(-1) : undefined;
  const observaciones = open?.observaciones ?? (lastReg?.observaciones ?? '');
  const tiposObservacion = open?.tipos_observacion ?? lastReg?.tipos_observacion ?? [];

  const requiereRevisionRecord = registros.find((r) => r.requiere_revision) ?? null;
  return { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord };
}

function buildRangoText(firstIngreso: string | null, lastSalida: string | null, open: AsistenciaAprendizResponse | null): string {
  const left = firstIngreso ?? '–';
  if (lastSalida) {
    return `${left} → ${lastSalida}`;
  }
  if (open) {
    return `${left} → —`;
  }
  return left;
}

const ASIST_MODAL_IDS = {
  obsTipo: 'asistencia-modal-obs-tipo',
  obsLibre: 'asistencia-modal-obs-libre',
  obsSesionLibre: 'asistencia-modal-obs-sesion-libre',
  estado: 'asistencia-modal-estado',
  estadoMotivo: 'asistencia-modal-estado-motivo',
} as const;

/** Ids distintos del modal de estado en la vista raíz (evita colisión si se reutiliza el mismo árbol). */
const ASIST_MODAL_IDS_ROOT = {
  estado: 'asistencia-modal-estado-root',
  estadoMotivo: 'asistencia-modal-estado-motivo-root',
} as const;

const ASIST_REGISTRO_DOC_INPUT_ID = 'asistencia-registro-doc-manual';

function mensajeRegistroPorTipo(data: { mensaje?: string | null; tipo_registro?: string }): string {
  if (data.mensaje) {
    return data.mensaje;
  }
  if (data.tipo_registro === 'ingreso') {
    return 'Ingreso registrado';
  }
  if (data.tipo_registro === 'salida') {
    return 'Salida registrada';
  }
  return 'Asistencia completa';
}

function sameRegistrosList(a: AsistenciaAprendizResponse[], b: AsistenciaAprendizResponse[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((aa, i) => {
    const bb = b[i];
    if (!bb) return false;
    const tiposA = (aa.tipos_observacion ?? []).map((t) => t.id).sort((x, y) => x - y);
    const tiposB = (bb.tipos_observacion ?? []).map((t) => t.id).sort((x, y) => x - y);
    const mismosTipos =
      tiposA.length === tiposB.length && tiposA.every((id, idx) => id === tiposB[idx]);
    return (
      aa.id === bb.id &&
      aa.hora_ingreso === bb.hora_ingreso &&
      aa.hora_salida === bb.hora_salida &&
      aa.observaciones === bb.observaciones &&
      mismosTipos
    );
  });
}

type TarjetaAprendizAsistenciaProps = Readonly<{
  aprendiz: AprendizResponse;
  registros: AsistenciaAprendizResponse[];
  index: number;
  asistenciaId: number | null;
  onRegistrarIngreso: (aprendizId: number) => void;
  onRegistrarSalida: (asistenciaAprendizId: number) => void;
  onAbrirEstado: (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => void;
  onAbrirObservaciones: (payload: {
    asistenciaId: number;
    aprendizId: number;
    nombre: string;
    observaciones: string;
    tiposObservacion?: TipoObservacionAsistenciaItem[];
  }) => void;
}>;

function TarjetaAprendizAsistencia({
  aprendiz,
  registros,
  index,
  asistenciaId,
  onRegistrarIngreso,
  onRegistrarSalida,
  onAbrirEstado,
  onAbrirObservaciones,
}: TarjetaAprendizAsistenciaProps) {
  const { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord } = summaryRegistros(registros);
  const rango = buildRangoText(firstIngreso, lastSalida, open);

  let accionPrincipalTarjeta: ReactNode;
  if (open) {
    accionPrincipalTarjeta = (
      <button
        type="button"
        onClick={() => onRegistrarSalida(open.id)}
        className="flex min-h-[44px] min-w-[120px] flex-1 items-center justify-center rounded-lg bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 active:bg-primary-800 touch-manipulation"
        aria-label="Registrar salida"
      >
        Salida
      </button>
    );
  } else if (requiereRevisionRecord) {
    accionPrincipalTarjeta = (
      <button
        type="button"
        onClick={() =>
          onAbrirEstado({
            asistenciaAprendizId: requiereRevisionRecord.id,
            nombre: aprendiz.persona_nombre ?? 'Aprendiz',
            estado: requiereRevisionRecord.estado || 'ASISTENCIA_COMPLETA',
            motivo: requiereRevisionRecord.motivo_ajuste || '',
          })
        }
        className="flex min-h-[44px] min-w-[120px] flex-1 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-sm font-medium text-amber-800 touch-manipulation"
      >
        Resolver estado
      </button>
    );
  } else {
    accionPrincipalTarjeta = (
      <button
        type="button"
        onClick={() => onRegistrarIngreso(aprendiz.id)}
        className="flex min-h-[44px] min-w-[120px] flex-1 items-center justify-center rounded-lg bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 active:bg-primary-800 touch-manipulation"
        aria-label="Registrar entrada"
      >
        Entrada
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{aprendiz.persona_nombre ?? '–'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Doc: {aprendiz.persona_documento ?? '–'} · #{index}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">
          {rango}
        </span>
      </div>
      {(tiposObservacion.length > 0 || observaciones) ? (
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 space-y-1">
          {tiposObservacion.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tiposObservacion.map((t) => (
                <span key={t.id} className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t.nombre}
                </span>
              ))}
            </div>
          )}
          {observaciones ? <p className="line-clamp-2" title={observaciones}>{observaciones}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
        {accionPrincipalTarjeta}
        {asistenciaId === null ? null : (
          <button
            type="button"
            onClick={() =>
              onAbrirObservaciones({
                asistenciaId,
                aprendizId: aprendiz.id,
                nombre: aprendiz.persona_nombre ?? 'Aprendiz',
                observaciones,
                tiposObservacion,
              })
            }
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 touch-manipulation"
            aria-label="Observaciones"
            title="Observaciones"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

type FilaAprendizAsistenciaProps = Readonly<{
  aprendiz: AprendizResponse;
  registros: AsistenciaAprendizResponse[];
  index: number;
  asistenciaId: number | null;
  onRegistrarIngreso: (aprendizId: number) => void;
  onRegistrarSalida: (asistenciaAprendizId: number) => void;
  onAbrirEstado: (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => void;
  onAbrirObservaciones: (payload: {
    asistenciaId: number;
    aprendizId: number;
    nombre: string;
    observaciones: string;
    tiposObservacion?: TipoObservacionAsistenciaItem[];
  }) => void;
}>;

const FilaAprendizAsistencia = memo(function FilaAprendizAsistencia({
  aprendiz,
  registros,
  index,
  asistenciaId,
  onRegistrarIngreso,
  onRegistrarSalida,
  onAbrirEstado,
  onAbrirObservaciones,
}: FilaAprendizAsistenciaProps) {
  const { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord } = summaryRegistros(registros);

  let textoCeldaSalida: string;
  if (lastSalida) {
    textoCeldaSalida = lastSalida;
  } else if (open) {
    textoCeldaSalida = '—';
  } else {
    textoCeldaSalida = '–';
  }

  let textoObsCelda: string | null;
  if (observaciones) {
    textoObsCelda = observaciones;
  } else if (tiposObservacion.length === 0) {
    textoObsCelda = '–';
  } else {
    textoObsCelda = null;
  }

  let iconoEntradaSalida: ReactNode;
  if (open) {
    iconoEntradaSalida = (
      <button
        type="button"
        onClick={() => onRegistrarSalida(open.id)}
        className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 touch-manipulation"
        title="Registrar salida"
        aria-label="Registrar salida"
      >
        <ArrowLeftEndOnRectangleIcon className="h-7 w-7" />
      </button>
    );
  } else if (requiereRevisionRecord) {
    iconoEntradaSalida = <span className="inline-block min-h-[52px] min-w-[52px]" aria-hidden />;
  } else {
    iconoEntradaSalida = (
      <button
        type="button"
        onClick={() => onRegistrarIngreso(aprendiz.id)}
        className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl text-green-600 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-green-500 dark:hover:bg-green-900/30 dark:hover:text-green-400 touch-manipulation"
        title="Registrar entrada"
        aria-label="Registrar entrada"
      >
        <ArrowRightStartOnRectangleIcon className="h-7 w-7" />
      </button>
    );
  }

  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-400">{index}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{aprendiz.persona_documento ?? '-'}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-medium">{aprendiz.persona_nombre ?? '-'}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
        {firstIngreso ?? '–'}
      </td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{textoCeldaSalida}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-500 dark:text-gray-400">
        {tiposObservacion.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {tiposObservacion.map((t) => (
              <span key={t.id} className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                {t.nombre}
              </span>
            ))}
          </div>
        )}
        {textoObsCelda}
      </td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
        <div className="flex items-center gap-2">
          {iconoEntradaSalida}
          {requiereRevisionRecord && (
            <button
              type="button"
              onClick={() =>
                onAbrirEstado({
                  asistenciaAprendizId: requiereRevisionRecord.id,
                  nombre: aprendiz.persona_nombre ?? 'Aprendiz',
                  estado: requiereRevisionRecord.estado || 'ASISTENCIA_COMPLETA',
                  motivo: requiereRevisionRecord.motivo_ajuste || '',
                })
              }
              className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
            >
              Resolver estado
            </button>
          )}
          {asistenciaId === null ? null : (
            <button
              type="button"
              onClick={() =>
                onAbrirObservaciones({
                  asistenciaId,
                  aprendizId: aprendiz.id,
                  nombre: aprendiz.persona_nombre ?? 'Aprendiz',
                  observaciones,
                  tiposObservacion,
                })
              }
              className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 touch-manipulation"
              title="Observaciones"
              aria-label="Registrar observaciones"
            >
              <PencilSquareIcon className="h-7 w-7" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  return (
    prev.aprendiz.id === next.aprendiz.id &&
    prev.index === next.index &&
    prev.asistenciaId === next.asistenciaId &&
    sameRegistrosList(prev.registros, next.registros) &&
    prev.onRegistrarIngreso === next.onRegistrarIngreso &&
    prev.onRegistrarSalida === next.onRegistrarSalida &&
    prev.onAbrirEstado === next.onAbrirEstado &&
    prev.onAbrirObservaciones === next.onAbrirObservaciones
  );
});

export const Asistencia = () => {
  const { roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fichaFromUrl = searchParams.get('ficha');
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [fichasLoading, setFichasLoading] = useState(true);
  const [fichaId, setFichaId] = useState<number | ''>(() => {
    const id = fichaFromUrl ? Number.parseInt(fichaFromUrl, 10) : Number.NaN;
    return Number.isFinite(id) ? id : '';
  });
  const [asistenciasSesion, setAsistenciasSesion] = useState<AsistenciaResponse[]>([]);
  const [sesionActual, setSesionActual] = useState<AsistenciaResponse | null>(null);
  const [aprendicesFicha, setAprendicesFicha] = useState<AprendizResponse[]>([]);
  const [aprendicesEnSesion, setAprendicesEnSesion] = useState<AsistenciaAprendizResponse[]>([]);
  const [loadingAprendices, setLoadingAprendices] = useState(false);
  const [errorAprendices, setErrorAprendices] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /** Valores por defecto para crear sesión (ampliar con UI cuando exista selector). */
  const nuevaSesionPayloadRef = useRef({
    instructorFichaSeleccionado: '' as number | '',
    fechaSesion: new Date().toISOString().slice(0, 10),
  });
  const [mostrarNuevaSesion, setMostrarNuevaSesion] = useState(false);
  const [errorSesionMsg, setErrorSesionMsg] = useState('');
  const [documentoManual, setDocumentoManual] = useState('');
  const [errorRegistroManual, setErrorRegistroManual] = useState('');
  const [mensajeRegistroManual, setMensajeRegistroManual] = useState('');
  const [registrandoManual, setRegistrandoManual] = useState(false);
  const [observacionesModal, setObservacionesModal] = useState<{
    asistenciaId: number;
    aprendizId: number;
    nombre: string;
    observaciones: string;
    tipoObservacionIds: number[];
  } | null>(null);
  const [tiposObservacionCatalog, setTiposObservacionCatalog] = useState<TipoObservacionAsistenciaItem[]>([]);
  const [observacionesGuardando, setObservacionesGuardando] = useState(false);
  const [observacionesSesionModal, setObservacionesSesionModal] = useState<{ observaciones: string } | null>(null);
  const [observacionesSesionGuardando, setObservacionesSesionGuardando] = useState(false);
  const [estadoModal, setEstadoModal] = useState<{ asistenciaAprendizId: number; nombre: string; estado: string; motivo: string } | null>(null);
  const [estadoGuardando, setEstadoGuardando] = useState(false);
  const [pendientesRevision, setPendientesRevision] = useState<AsistenciaAprendizResponse[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);
  const [pendientesError, setPendientesError] = useState('');

  const upsertAsistenciaAprendizEnSesion = (actualizado: AsistenciaAprendizResponse) => {
    if (!actualizado) return;
    setAprendicesEnSesion((prev) => {
      const byIdIndex = prev.findIndex((aa) => aa.id === actualizado.id);
      if (byIdIndex !== -1) {
        const copia = [...prev];
        copia[byIdIndex] = actualizado;
        return copia;
      }
      // Nuevo tramo del mismo aprendiz: añadir (mantener los demás tramos del aprendiz).
      return [...prev, actualizado];
    });
  };

  // Siempre pedir "mis fichas" (instructor asignado). Superadmin/otros reciben lista vacía.
  const fetchFichas = async () => {
    setFichasLoading(true);
    try {
      const res = await apiService.getFichasCaracterizacion(1, 200, undefined, true);
      setFichas(res.data);
    } catch (cause: unknown) {
      setFichas([]);
      if (import.meta.env.DEV) {
        console.warn('[Asistencia] No se pudieron cargar fichas', cause);
      }
    } finally {
      setFichasLoading(false);
    }
  };

  useEffect(() => {
    fetchFichas();
  }, []);

  // Cargar pendientes de revisión (para instructor actual) al entrar a la pantalla
  useEffect(() => {
    const loadPendientes = async () => {
      setPendientesLoading(true);
      setPendientesError('');
      try {
        const data = await apiService.getAsistenciaPendientesRevision();
        setPendientesRevision(data);
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } }).response?.status;
        const msg =
          status === 403
            ? 'Solo instructores con permiso de asistencia pueden ver pendientes de revisión.'
            : axiosErrorMessage(e, 'No se pudo cargar la bandeja de pendientes de revisión.');
        setPendientesError(msg);
        setPendientesRevision([]);
      } finally {
        setPendientesLoading(false);
      }
    };
    loadPendientes();
  }, []);

  useEffect(() => {
    if (fichaFromUrl) {
      const id = Number.parseInt(fichaFromUrl, 10);
      if (Number.isFinite(id)) setFichaId(id);
    }
  }, [fichaFromUrl]);

  useEffect(() => {
    if (!fichaId) {
      setSesionActual(null);
      setAprendicesEnSesion([]);
    }
  }, [fichaId]);

  const loadAprendicesYSesion = useCallback(
    async (asistenciaId: number, fichaIdParam?: number) => {
      const fid = fichaIdParam ?? fichaId;
      if (!fid) return;
      setErrorAprendices('');
      setLoadingAprendices(true);
      setAprendicesFicha([]);
      try {
        const [aprendices, enSesion] = await Promise.all([
          apiService.getFichaAprendices(fid),
          apiService.getAsistenciaAprendices(asistenciaId),
        ]);
        setAprendicesFicha(aprendices.filter((a) => a.estado));
        setAprendicesEnSesion(enSesion);
      } catch (e: unknown) {
        const msg = axiosErrorMessage(
          e,
          'No se pudo cargar el listado de aprendices. Verifique permisos (VER ASISTENCIA) o que los aprendices estén asignados a la ficha.',
        );
        setErrorAprendices(msg);
        setAprendicesFicha([]);
        setAprendicesEnSesion([]);
      } finally {
        setLoadingAprendices(false);
      }
    },
    [fichaId],
  );

  useEffect(() => {
    if (sesionActual && fichaId) void loadAprendicesYSesion(sesionActual.id, fichaId);
    else {
      setAprendicesEnSesion([]);
      if (!sesionActual) setAprendicesFicha([]);
    }
  }, [sesionActual, fichaId, loadAprendicesYSesion]);

  useEffect(() => {
    if (!sesionActual) return;
    apiService.getTiposObservacionAsistencia().then(setTiposObservacionCatalog).catch(() => setTiposObservacionCatalog([]));
    // Dependencia solo del id: evita recargar el catálogo cuando cambian otros campos del objeto sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps deliberadas: sesionActual?.id únicamente
  }, [sesionActual?.id]);

  const handleTomarAsistencia = async (id: number) => {
    setError('');
    setErrorAprendices('');
    setLoading(true);
    setAprendicesFicha([]);
    try {
      const sesion = await apiService.entrarTomarAsistencia(id);
      setFichaId(id);
      setSearchParams({ ficha: String(id) });
      setSesionActual(sesion);
      if (id) loadAprendicesYSesion(sesion.id, id);
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'No está asignado como instructor de esta ficha.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVolverAFichas = () => {
    setSesionActual(null);
    setFichaId('');
    setSearchParams({});
    setAprendicesEnSesion([]);
  };

  const _handleCrearSesion = async () => {
    const { instructorFichaSeleccionado, fechaSesion } = nuevaSesionPayloadRef.current;
    if (!instructorFichaSeleccionado) return;
    setErrorSesionMsg('');
    setLoading(true);
    try {
      const sesion = await apiService.createAsistenciaSesion({
        instructor_ficha_id: instructorFichaSeleccionado,
        fecha: fechaSesion,
      });
      setMostrarNuevaSesion(false);
      setAsistenciasSesion((prev) => [sesion, ...prev]);
      setSesionActual(sesion);
      if (fichaId) loadAprendicesYSesion(sesion.id);
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'Error al crear sesión');
      setErrorSesionMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarIngreso = useCallback(
    async (aprendizId: number) => {
      if (!sesionActual) {
        if (import.meta.env.DEV) {
          console.warn('[Asistencia] Intento de registrar ingreso sin sesión activa', { aprendizId, sesionActual });
        }
        return;
      }
      try {
        const nuevo = await apiService.registrarIngresoAsistencia({
          asistencia_id: sesionActual.id,
          aprendiz_id: aprendizId,
        });
        upsertAsistenciaAprendizEnSesion(nuevo);
      } catch (e: unknown) {
        globalThis.alert(axiosErrorMessage(e, 'Error al registrar ingreso'));
      }
    },
    [sesionActual]
  );

  const handleRegistrarSalida = useCallback(async (asistenciaAprendizId: number) => {
    try {
      const actualizado = await apiService.registrarSalidaAsistencia(asistenciaAprendizId);
      upsertAsistenciaAprendizEnSesion(actualizado);
    } catch (e: unknown) {
      globalThis.alert(axiosErrorMessage(e, 'Error al registrar salida'));
    }
  }, []);

  const onAbrirEstadoModal = useCallback(
    (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => {
      setEstadoModal(payload);
    },
    []
  );

  const onAbrirObservacionesModal = useCallback(
    (payload: {
      asistenciaId: number;
      aprendizId: number;
      nombre: string;
      observaciones: string;
      tiposObservacion?: TipoObservacionAsistenciaItem[];
    }) => {
      setObservacionesModal({
        asistenciaId: payload.asistenciaId,
        aprendizId: payload.aprendizId,
        nombre: payload.nombre,
        observaciones: payload.observaciones,
        tipoObservacionIds: payload.tiposObservacion?.map((t) => t.id) ?? [],
      });
    },
    []
  );

  const handleGuardarObservaciones = async () => {
    if (!observacionesModal || !sesionActual) return;
    setObservacionesGuardando(true);
    try {
      const actualizado = await apiService.crearOActualizarObservacionesAsistencia(
        observacionesModal.asistenciaId,
        observacionesModal.aprendizId,
        observacionesModal.observaciones,
        observacionesModal.tipoObservacionIds.length > 0 ? observacionesModal.tipoObservacionIds : undefined
      );
      setObservacionesModal(null);
      upsertAsistenciaAprendizEnSesion(actualizado);
    } catch (e: unknown) {
      globalThis.alert(axiosErrorMessage(e, 'Error al guardar observaciones'));
    } finally {
      setObservacionesGuardando(false);
    }
  };

  const handleGuardarEstado = async () => {
    if (!estadoModal) return;
    setEstadoGuardando(true);
    try {
      const actualizado = await apiService.ajustarEstadoAsistencia(estadoModal.asistenciaAprendizId, {
        estado: estadoModal.estado,
        motivo: estadoModal.motivo || undefined,
      });
      setEstadoModal(null);
      upsertAsistenciaAprendizEnSesion(actualizado);
      // Refrescar bandeja de pendientes
      try {
        const data = await apiService.getAsistenciaPendientesRevision();
        setPendientesRevision(data);
      } catch {
        // ignorar errores silenciosamente aquí
      }
    } catch (e: unknown) {
      globalThis.alert(axiosErrorMessage(e, 'Error al guardar estado'));
    } finally {
      setEstadoGuardando(false);
    }
  };

  const handleGuardarObservacionesSesion = async () => {
    if (!sesionActual || !observacionesSesionModal) return;
    setObservacionesSesionGuardando(true);
    try {
      const actualizada = await apiService.actualizarObservacionesSesionAsistencia(
        sesionActual.id,
        observacionesSesionModal.observaciones
      );
      setSesionActual(actualizada);
      setObservacionesSesionModal(null);
    } catch (e: unknown) {
      globalThis.alert(axiosErrorMessage(e, 'Error al guardar observación de la sesión'));
    } finally {
      setObservacionesSesionGuardando(false);
    }
  };

  const quitarTipoObservacionEnModal = (tipoId: number) => {
    setObservacionesModal((prev) =>
      prev ? { ...prev, tipoObservacionIds: prev.tipoObservacionIds.filter((x) => x !== tipoId) } : null,
    );
  };

  const handleRegistrarPorDocumento = async (numeroDocumento: string) => {
    if (!sesionActual || !numeroDocumento.trim()) return;
    setErrorRegistroManual('');
    setMensajeRegistroManual('');
    setRegistrandoManual(true);
    try {
      const data = await apiService.registrarIngresoAsistenciaPorDocumento(sesionActual.id, numeroDocumento.trim());
      setDocumentoManual('');
      upsertAsistenciaAprendizEnSesion(data);
      setMensajeRegistroManual(mensajeRegistroPorTipo(data));
    } catch (e: unknown) {
      setErrorRegistroManual(axiosErrorMessage(e, 'Error al registrar asistencia'));
    } finally {
      setRegistrandoManual(false);
    }
  };

  const handleRegistroManualSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    handleRegistrarPorDocumento(documentoManual).catch(() => {});
  };

  const crearSesionReservadaRef = useRef<(() => Promise<void>) | null>(null);
  crearSesionReservadaRef.current = _handleCrearSesion;

  const registroPorAprendizId = groupRegistrosByAprendiz(aprendicesEnSesion);

  // Sin fichas asignadas: superadmin o instructor sin asignaciones
  if (!fichasLoading && fichas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Asistencia</h1>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tienes fichas asignadas</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            No se encontraron fichas de formación asignadas a tu cuenta.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
            Contacta al administrador para que te asigne las fichas correspondientes.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Con fichas: cards y (si hay ficha seleccionada) bloque de sesiones
  const fichaSeleccionada = fichaId ? fichas.find((f) => f.id === fichaId) : null;

  // Vista única de tomar asistencia: pantalla completa (no debajo de las cards)
  if (sesionActual && !sesionActual.is_finished && fichaSeleccionada) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tomar asistencia</h1>
            <p className="mt-1 text-gray-600">Ficha {fichaSeleccionada.ficha} · {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}</p>
          </div>
          <button type="button" onClick={handleVolverAFichas} className="btn-secondary">
            Volver a fichas
          </button>
        </div>
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,auto]">
            {/* Panel izquierdo: información de la ficha y sesión */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase text-gray-900">
                    {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}
                  </h2>
                  <p className="text-gray-600">Ficha {fichaSeleccionada.ficha}</p>
                </div>
                {fichaSeleccionada.modalidad_formacion_nombre && (
                  <span className="rounded bg-primary-600 px-2.5 py-1 text-xs font-medium text-white">
                    {fichaSeleccionada.modalidad_formacion_nombre}
                  </span>
                )}
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Información del programa</p>
                  <p className="text-sm text-gray-700">N° Ficha: {fichaSeleccionada.ficha}</p>
                  <p className="text-sm text-gray-700">Instructor líder: {fichaSeleccionada.instructor_nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Estado de la sesión</p>
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />{' '}
                    Asistencia: Activa
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Observación de la sesión:</span>{' '}
                    {sesionActual.observaciones?.trim() ? sesionActual.observaciones : 'Sin observación registrada'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-600">
                  {new Set(aprendicesEnSesion.map((aa) => aa.aprendiz_id)).size} de {aprendicesFicha.length} con registro en sesión
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setObservacionesSesionModal({
                        observaciones: sesionActual.observaciones ?? '',
                      })
                    }
                    className="btn-secondary text-sm"
                  >
                    Observación de sesión
                  </button>
                  <button
                    type="button"
                    onClick={handleVolverAFichas}
                    className="btn-secondary text-sm"
                  >
                    Volver a fichas
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    La sesión se cierra automáticamente al terminar el horario de la jornada (más la extensión).
                  </p>
                </div>
              </div>
            </div>

            {/* Panel derecho: escáner QR */}
            <EscanerQR
              key={sesionActual.id}
              activo
              onEscaneado={handleRegistrarPorDocumento}
              className="lg:w-[340px]"
              readerId={`qr-sesion-${sesionActual.id}`}
            />
          </div>

          {/* Listado de aprendices: registro manual + tabla */}
          <div className="card">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Listado de aprendices</h3>
            <p className="mb-4 text-sm text-gray-600">Entradas y salidas por sesión</p>

            {errorAprendices && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">{errorAprendices}</p>
              </div>
            )}

            {/* Registro manual por documento */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-gray-700">
                <DocumentTextIcon className="h-5 w-5" />
                Registro manual
              </p>
              <form onSubmit={handleRegistroManualSubmit} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[280px] flex-1">
                  <label htmlFor={ASIST_REGISTRO_DOC_INPUT_ID} className="sr-only">
                    Número de documento del aprendiz
                  </label>
                  <input
                    id={ASIST_REGISTRO_DOC_INPUT_ID}
                    type="text"
                    value={documentoManual}
                    onChange={(e) => {
                      setDocumentoManual(e.target.value);
                      setErrorRegistroManual('');
                      setMensajeRegistroManual('');
                    }}
                    placeholder="Ingrese número de documento del aprendiz..."
                    className="input-field w-full"
                    disabled={registrandoManual}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registrandoManual || !documentoManual.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 min-h-[44px] text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Registrar Asistencia
                </button>
              </form>
              {errorRegistroManual && (
                <p className="mt-2 text-sm text-red-600">{errorRegistroManual}</p>
              )}
              {mensajeRegistroManual && (
                <p className="mt-2 text-sm text-green-700 font-medium">{mensajeRegistroManual}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Seleccione aprendices con checkbox o use esta opción para registro manual por documento. También puede escanear el QR del aprendiz.
              </p>
            </div>

            {/* Listado de aprendices: mostrar solo tabla (también en móvil) para aislar error de renderizado */}
            {loadingAprendices && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/50">
                Cargando listado de aprendices...
              </div>
            )}
            {!loadingAprendices && aprendicesFicha.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/50">
                No hay aprendices en esta ficha. Si debería haber aprendices, asígnelos desde Fichas de caracterización (pestaña Aprendices de la ficha).
              </div>
            )}
            {!loadingAprendices && aprendicesFicha.length > 0 && (
              <>
                {/* Vista móvil: tarjetas por aprendiz */}
                <div className="space-y-3 md:hidden">
                  {aprendicesFicha.map((aprendiz, idx) => (
                    <TarjetaAprendizAsistencia
                      key={aprendiz.id}
                      aprendiz={aprendiz}
                      registros={registroPorAprendizId.get(aprendiz.id) ?? []}
                      index={idx + 1}
                      asistenciaId={sesionActual?.id ?? null}
                      onRegistrarIngreso={handleRegistrarIngreso}
                      onRegistrarSalida={handleRegistrarSalida}
                      onAbrirEstado={onAbrirEstadoModal}
                      onAbrirObservaciones={onAbrirObservacionesModal}
                    />
                  ))}
                </div>

                {/* Vista desktop: tabla */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-left dark:bg-gray-800">
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">#</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Documento</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Nombre del aprendiz</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Hora Ingreso</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Hora Salida</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Observaciones</th>
                        <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aprendicesFicha.map((aprendiz, idx) => (
                        <FilaAprendizAsistencia
                          key={aprendiz.id}
                          aprendiz={aprendiz}
                          registros={registroPorAprendizId.get(aprendiz.id) ?? []}
                          index={idx + 1}
                          asistenciaId={sesionActual?.id ?? null}
                          onRegistrarIngreso={handleRegistrarIngreso}
                          onRegistrarSalida={handleRegistrarSalida}
                          onAbrirEstado={onAbrirEstadoModal}
                          onAbrirObservaciones={onAbrirObservacionesModal}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal observaciones */}
        {observacionesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 z-0 bg-black/50"
              aria-label="Cerrar observaciones"
              onClick={() => setObservacionesModal(null)}
            />
            <dialog
              open
              className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-gray-800"
              aria-labelledby="modal-observaciones-title"
            >
              <h3 id="modal-observaciones-title" className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Observaciones — {observacionesModal.nombre}
              </h3>
              <div className="mb-3">
                <label htmlFor={ASIST_MODAL_IDS.obsTipo} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipos de observación
                </label>
                <select
                  id={ASIST_MODAL_IDS.obsTipo}
                  value=""
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (!id) return;
                    e.target.value = '';
                    if (observacionesModal.tipoObservacionIds.includes(id)) return;
                    setObservacionesModal((prev) => (prev ? { ...prev, tipoObservacionIds: [...prev.tipoObservacionIds, id] } : null));
                  }}
                  className="input-field w-full"
                  disabled={observacionesGuardando}
                  aria-label="Agregar tipo de observación"
                >
                  <option value="">Agregar tipo…</option>
                  {tiposObservacionCatalog
                    .filter((t) => !observacionesModal.tipoObservacionIds.includes(t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                </select>
                {observacionesModal.tipoObservacionIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {observacionesModal.tipoObservacionIds.map((id) => {
                      const tipo = tiposObservacionCatalog.find((t) => t.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-200"
                        >
                          {tipo?.nombre ?? id}
                          <button
                            type="button"
                            onClick={() => quitarTipoObservacionEnModal(id)}
                            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
                            aria-label="Quitar"
                            disabled={observacionesGuardando}
                          >
                            <span aria-hidden>×</span>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor={ASIST_MODAL_IDS.obsLibre} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observación libre
                </label>
                <textarea
                  id={ASIST_MODAL_IDS.obsLibre}
                  value={observacionesModal.observaciones}
                  onChange={(e) => setObservacionesModal((prev) => (prev ? { ...prev, observaciones: e.target.value } : null))}
                  placeholder="Escriba aquí las observaciones del aprendiz..."
                  rows={4}
                  className="input-field w-full resize-y"
                  disabled={observacionesGuardando}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setObservacionesModal(null)}
                  className="btn-secondary"
                  disabled={observacionesGuardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarObservaciones}
                  disabled={observacionesGuardando}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {observacionesGuardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* Modal observación de la sesión */}
        {observacionesSesionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 z-0 bg-black/50"
              aria-label="Cerrar observación de sesión"
              onClick={() => setObservacionesSesionModal(null)}
            />
            <dialog
              open
              className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-gray-800"
              aria-labelledby="modal-observacion-sesion-title"
            >
              <h3 id="modal-observacion-sesion-title" className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Observación de la sesión
              </h3>
              <div className="mb-4">
                <label htmlFor={ASIST_MODAL_IDS.obsSesionLibre} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observación de la clase de hoy
                </label>
                <textarea
                  id={ASIST_MODAL_IDS.obsSesionLibre}
                  value={observacionesSesionModal.observaciones}
                  onChange={(e) =>
                    setObservacionesSesionModal((prev) => (prev ? { ...prev, observaciones: e.target.value } : null))
                  }
                  placeholder="Ej: Se realizó socialización de proyecto y hubo retraso por mantenimiento del ambiente."
                  rows={4}
                  className="input-field w-full resize-y"
                  disabled={observacionesSesionGuardando}
                  maxLength={1000}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setObservacionesSesionModal(null)}
                  className="btn-secondary"
                  disabled={observacionesSesionGuardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarObservacionesSesion}
                  disabled={observacionesSesionGuardando}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {observacionesSesionGuardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </dialog>
          </div>
        )}

        {/* Modal estado asistencia */}
        {estadoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 z-0 bg-black/50"
              aria-label="Cerrar estado de asistencia"
              onClick={() => setEstadoModal(null)}
            />
            <dialog
              open
              className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg"
              aria-labelledby="modal-estado-title"
            >
              <h3 id="modal-estado-title" className="mb-3 text-lg font-semibold text-gray-900">
                Estado de asistencia — {estadoModal.nombre}
              </h3>
              <p className="mb-2 text-sm text-gray-600">
                Clasifique este registro cuando hubo entrada pero no quedó clara la salida (olvido del sistema o abandono de jornada).
              </p>
              <div className="mb-4 space-y-2">
                <label htmlFor={ASIST_MODAL_IDS.estado} className="mb-1 block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id={ASIST_MODAL_IDS.estado}
                  value={estadoModal.estado}
                  onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, estado: e.target.value } : null))}
                  className="input-field w-full"
                  disabled={estadoGuardando}
                >
                  <option value="ASISTENCIA_COMPLETA">Asistencia completa (olvido registrar salida)</option>
                  <option value="ASISTENCIA_PARCIAL">Asistencia parcial</option>
                  <option value="ABANDONO_JORNADA">Abandono de jornada</option>
                  <option value="REGISTRO_POR_CORREGIR">Dejar pendiente de revisión</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor={ASIST_MODAL_IDS.estadoMotivo} className="mb-1 block text-sm font-medium text-gray-700">
                  Motivo / detalle (opcional)
                </label>
                <textarea
                  id={ASIST_MODAL_IDS.estadoMotivo}
                  value={estadoModal.motivo}
                  onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, motivo: e.target.value } : null))}
                  rows={3}
                  className="input-field w-full resize-y"
                  disabled={estadoGuardando}
                  placeholder="Ej: Olvido de salida, aprendiz se retiró en el descanso y no regresó, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEstadoModal(null)}
                  className="btn-secondary"
                  disabled={estadoGuardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarEstado}
                  disabled={estadoGuardando}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {estadoGuardando ? 'Guardando…' : 'Guardar estado'}
                </button>
              </div>
            </dialog>
          </div>
        )}
      </div>
    );
  }

  // Listado de fichas (cards)
  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asistencia</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Tomar asistencia por ficha e instructor</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/asistencia/historial"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <CalendarDaysIcon className="w-5 h-5" />
            Ver historial de asistencias
          </Link>
          {isSuperAdmin && (
            <Link
              to="/asistencia/dashboard"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ChartBarIcon className="w-5 h-5" />
              Dashboard en tiempo real
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {errorSesionMsg && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {errorSesionMsg}
        </div>
      )}
      {import.meta.env.DEV && (
        <span className="sr-only" aria-hidden>
          {[
            asistenciasSesion.length,
            mostrarNuevaSesion ? '1' : '0',
            nuevaSesionPayloadRef.current.instructorFichaSeleccionado,
            nuevaSesionPayloadRef.current.fechaSesion,
          ].join('|')}
        </span>
      )}

      {/* Bandeja de pendientes de revisión */}
      <div className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pendientes de revisión de asistencia</h2>
          {pendientesLoading && <span className="text-xs text-gray-500">Cargando…</span>}
        </div>
        {pendientesError && (
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-400">{pendientesError}</p>
        )}
        {!pendientesLoading && !pendientesError && pendientesRevision.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay registros de asistencia pendientes de revisión para hoy.
          </p>
        )}
        {!pendientesLoading && pendientesRevision.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Ficha
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Documento
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Aprendiz
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Ingreso
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Estado actual
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendientesRevision.map((p) => (
                  <tr
                    key={p.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      {p.ficha_numero || '–'}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      {p.numero_documento || '–'}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      {p.aprendiz_nombre || '–'}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      {p.hora_ingreso && !Number.isNaN(new Date(p.hora_ingreso).getTime())
                        ? new Date(p.hora_ingreso).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '–'}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-medium">
                        {p.estado || 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEstadoModal({
                            asistenciaAprendizId: p.id,
                            nombre: p.aprendiz_nombre || 'Aprendiz',
                            estado: p.estado || 'ASISTENCIA_COMPLETA',
                            motivo: p.motivo_ajuste || '',
                          })
                        }
                        className="btn-secondary text-xs"
                      >
                        Resolver estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fichas.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="font-bold text-gray-900 uppercase text-sm leading-tight">
                  {item.programa_formacion_nombre || 'Sin programa'}
                </h3>
                {item.modalidad_formacion_nombre && (
                  <span className="shrink-0 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                    {item.modalidad_formacion_nombre}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">Ficha {item.ficha}</p>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-1">
                    Información académica
                  </p>
                  <div className="text-sm text-gray-700">Jornada: {item.jornada_nombre || '-'}</div>
                  <div className="text-sm text-gray-700">Sede / Ambiente: {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '-'}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instructor líder</p>
                  <div className="text-sm text-gray-700">{item.instructor_nombre || '-'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">{item.cantidad_aprendices} Aprendices</span>
                <button
                  type="button"
                  onClick={() => handleTomarAsistencia(item.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Entrando...' : 'Tomar asistencia'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal estado asistencia (también disponible en vista de fichas + pendientes) */}
      {estadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cerrar estado de asistencia"
            onClick={() => setEstadoModal(null)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg"
            aria-labelledby="modal-estado-title-root"
          >
            <h3 id="modal-estado-title-root" className="mb-3 text-lg font-semibold text-gray-900">
              Estado de asistencia — {estadoModal.nombre}
            </h3>
            <p className="mb-2 text-sm text-gray-600">
              Clasifique este registro cuando hubo entrada pero no quedó clara la salida (olvido del sistema o abandono de jornada).
            </p>
            <div className="mb-4 space-y-2">
              <label htmlFor={ASIST_MODAL_IDS_ROOT.estado} className="mb-1 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id={ASIST_MODAL_IDS_ROOT.estado}
                value={estadoModal.estado}
                onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, estado: e.target.value } : null))}
                className="input-field w-full"
                disabled={estadoGuardando}
              >
                <option value="ASISTENCIA_COMPLETA">Asistencia completa (olvido registrar salida)</option>
                <option value="ASISTENCIA_PARCIAL">Asistencia parcial</option>
                <option value="ABANDONO_JORNADA">Abandono de jornada</option>
                <option value="REGISTRO_POR_CORREGIR">Dejar pendiente de revisión</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor={ASIST_MODAL_IDS_ROOT.estadoMotivo} className="mb-1 block text-sm font-medium text-gray-700">
                Motivo / detalle (opcional)
              </label>
              <textarea
                id={ASIST_MODAL_IDS_ROOT.estadoMotivo}
                value={estadoModal.motivo}
                onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, motivo: e.target.value } : null))}
                rows={3}
                className="input-field w-full resize-y"
                disabled={estadoGuardando}
                placeholder="Ej: Olvido de salida, aprendiz se retiró en el descanso y no regresó, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEstadoModal(null)}
                className="btn-secondary"
                disabled={estadoGuardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarEstado}
                disabled={estadoGuardando}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {estadoGuardando ? 'Guardando…' : 'Guardar estado'}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
};
