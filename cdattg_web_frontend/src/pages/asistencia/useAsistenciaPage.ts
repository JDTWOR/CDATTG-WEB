import { useState, useEffect, useCallback, useRef, useMemo, type ComponentProps } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import type {
  FichaCaracterizacionResponse,
  AsistenciaResponse,
  AprendizResponse,
  AsistenciaAprendizResponse,
  TipoObservacionAsistenciaItem,
} from '../../types';
import {
  computeBulkCounts,
  groupRegistrosByAprendiz,
  inferirAccionPorDocumento,
  sortAprendicesAz,
  summaryRegistros,
} from './asistenciaUtils';
import { mostrarToastErrorAsistencia, mostrarToastRegistroAsistencia } from './asistenciaToast';

export function useAsistenciaPage() {
  const { roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fichaFromUrl = searchParams.get('ficha');
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [fichasLoading, setFichasLoading] = useState(true);
  const [fichaId, setFichaId] = useState<number | ''>(() => {
    const id = fichaFromUrl ? Number.parseInt(fichaFromUrl, 10) : Number.NaN;
    return Number.isFinite(id) ? id : '';
  });
  const [sesionActual, setSesionActual] = useState<AsistenciaResponse | null>(null);
  const [aprendicesFicha, setAprendicesFicha] = useState<AprendizResponse[]>([]);
  const [aprendicesEnSesion, setAprendicesEnSesion] = useState<AsistenciaAprendizResponse[]>([]);
  const [loadingAprendices, setLoadingAprendices] = useState(false);
  const [errorAprendices, setErrorAprendices] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nuevaSesionPayloadRef = useRef<{
    instructorFichaSeleccionado: number | '';
    fechaSesion: string;
  }>({
    instructorFichaSeleccionado: '',
    fechaSesion: new Date().toISOString().slice(0, 10),
  });
  const [errorSesionMsg] = useState('');
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
  const [estadoModal, setEstadoModal] = useState<{
    asistenciaAprendizId: number;
    nombre: string;
    estado: string;
    motivo: string;
  } | null>(null);
  const [estadoGuardando, setEstadoGuardando] = useState(false);
  const [pendientesRevision, setPendientesRevision] = useState<AsistenciaAprendizResponse[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);
  const [pendientesError, setPendientesError] = useState('');
  const [selectedAprendizIds, setSelectedAprendizIds] = useState<Set<number>>(() => new Set());
  const [busquedaAprendiz, setBusquedaAprendiz] = useState('');
  const [busyAprendizIds, setBusyAprendizIds] = useState<Set<number>>(() => new Set());
  const [bulkProcesando, setBulkProcesando] = useState(false);
  const registroDocumentoEnCurso = useRef(false);

  const upsertAsistenciaAprendizEnSesion = useCallback((actualizado: AsistenciaAprendizResponse) => {
    if (!actualizado) return;
    setAprendicesEnSesion((prev) => {
      const byIdIndex = prev.findIndex((aa) => aa.id === actualizado.id);
      if (byIdIndex !== -1) {
        const copia = [...prev];
        copia[byIdIndex] = actualizado;
        return copia;
      }
      return [...prev, actualizado];
    });
  }, []);

  const fetchFichas = useCallback(async () => {
    setFichasLoading(true);
    try {
      const res = await apiService.getFichasCaracterizacion(1, 200, undefined, true);
      setFichas(res.data.filter((f) => f.status));
    } catch (cause: unknown) {
      setFichas([]);
      if (import.meta.env.DEV) console.warn('[Asistencia] No se pudieron cargar fichas', cause);
    } finally {
      setFichasLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFichas();
  }, [fetchFichas]);

  useEffect(() => {
    const loadPendientes = async () => {
      setPendientesLoading(true);
      setPendientesError('');
      try {
        setPendientesRevision(await apiService.getAsistenciaPendientesRevision());
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } }).response?.status;
        setPendientesError(
          status === 403
            ? 'Solo instructores con permiso de asistencia pueden ver ajustes pendientes.'
            : axiosErrorMessage(e, 'No se pudo cargar la bandeja de ajustes pendientes.'),
        );
        setPendientesRevision([]);
      } finally {
        setPendientesLoading(false);
      }
    };
    void loadPendientes();
  }, []);

  useEffect(() => {
    if (fichasLoading || !fichaFromUrl) return;
    const id = Number.parseInt(fichaFromUrl, 10);
    if (!Number.isFinite(id)) return;
    if (fichas.some((f) => f.id === id)) {
      setFichaId(id);
      return;
    }
    setFichaId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('ficha');
      return next;
    });
  }, [fichaFromUrl, fichas, fichasLoading, setSearchParams]);

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
        setAprendicesFicha(
          sortAprendicesAz(aprendices.filter((a) => a.estado && !a.oculto_en_asistencia)),
        );
        setAprendicesEnSesion(enSesion);
      } catch (e: unknown) {
        setErrorAprendices(
          axiosErrorMessage(
            e,
            'No se pudo cargar el listado de aprendices. Verifique permisos (VER ASISTENCIA) o que los aprendices estén asignados a la ficha.',
          ),
        );
        setAprendicesFicha([]);
        setAprendicesEnSesion([]);
      } finally {
        setLoadingAprendices(false);
      }
    },
    [fichaId],
  );

  const sesionId = sesionActual?.id;

  useEffect(() => {
    if (sesionActual && fichaId) {
      void loadAprendicesYSesion(sesionActual.id, fichaId);
      return;
    }
    setAprendicesEnSesion([]);
    if (sesionActual == null) setAprendicesFicha([]);
  }, [sesionActual, fichaId, loadAprendicesYSesion]);

  useEffect(() => {
    if (sesionId == null) return;
    apiService.getTiposObservacionAsistencia().then(setTiposObservacionCatalog).catch(() => setTiposObservacionCatalog([]));
  }, [sesionId]);

  useEffect(() => {
    setSelectedAprendizIds(new Set());
    setBusquedaAprendiz('');
  }, [sesionId, fichaId]);

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
      if (id) void loadAprendicesYSesion(sesion.id, id);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No está asignado como instructor de esta ficha.'));
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

  const setAprendizBusy = useCallback((aprendizId: number, busy: boolean) => {
    setBusyAprendizIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(aprendizId);
      else next.delete(aprendizId);
      return next;
    });
  }, []);

  const handleRegistrarIngreso = useCallback(
    async (aprendizId: number) => {
      if (!sesionActual || busyAprendizIds.has(aprendizId)) return;
      setAprendizBusy(aprendizId, true);
      try {
        const nuevo = await apiService.registrarIngresoAsistencia({
          asistencia_id: sesionActual.id,
          aprendiz_id: aprendizId,
        });
        upsertAsistenciaAprendizEnSesion(nuevo);
      } catch (e: unknown) {
        globalThis.alert(axiosErrorMessage(e, 'Error al registrar ingreso'));
      } finally {
        setAprendizBusy(aprendizId, false);
      }
    },
    [sesionActual, busyAprendizIds, setAprendizBusy, upsertAsistenciaAprendizEnSesion],
  );

  const handleRegistrarSalida = useCallback(
    async (asistenciaAprendizId: number, aprendizId?: number) => {
      const busyKey = aprendizId ?? asistenciaAprendizId;
      if (busyAprendizIds.has(busyKey)) return;
      setAprendizBusy(busyKey, true);
      try {
        upsertAsistenciaAprendizEnSesion(await apiService.registrarSalidaAsistencia(asistenciaAprendizId));
      } catch (e: unknown) {
        globalThis.alert(axiosErrorMessage(e, 'Error al registrar salida'));
      } finally {
        setAprendizBusy(busyKey, false);
      }
    },
    [busyAprendizIds, setAprendizBusy, upsertAsistenciaAprendizEnSesion],
  );

  const onAbrirEstadoModal = useCallback(
    (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => {
      setEstadoModal(payload);
    },
    [],
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
    [],
  );

  const handleGuardarObservaciones = async () => {
    if (!observacionesModal || !sesionActual) return;
    setObservacionesGuardando(true);
    try {
      const actualizado = await apiService.crearOActualizarObservacionesAsistencia(
        observacionesModal.asistenciaId,
        observacionesModal.aprendizId,
        observacionesModal.observaciones,
        observacionesModal.tipoObservacionIds.length > 0 ? observacionesModal.tipoObservacionIds : undefined,
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
      try {
        setPendientesRevision(await apiService.getAsistenciaPendientesRevision());
      } catch {
        /* ignorar */
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
      setSesionActual(
        await apiService.actualizarObservacionesSesionAsistencia(
          sesionActual.id,
          observacionesSesionModal.observaciones,
        ),
      );
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
    const doc = numeroDocumento.trim();
    if (!sesionActual || !doc || registroDocumentoEnCurso.current) return;
    registroDocumentoEnCurso.current = true;
    setErrorRegistroManual('');
    setMensajeRegistroManual('');
    setRegistrandoManual(true);
    try {
      const data = await apiService.registrarIngresoAsistenciaPorDocumento(sesionActual.id, doc);
      setDocumentoManual('');
      upsertAsistenciaAprendizEnSesion(data);
      mostrarToastRegistroAsistencia(data);
    } catch (e: unknown) {
      const mensaje = axiosErrorMessage(e, 'Error al registrar asistencia');
      setErrorRegistroManual(mensaje);
      mostrarToastErrorAsistencia(mensaje);
    } finally {
      setRegistrandoManual(false);
      registroDocumentoEnCurso.current = false;
    }
  };

  const toggleSelectAprendiz = useCallback((aprendizId: number) => {
    setSelectedAprendizIds((prev) => {
      const next = new Set(prev);
      if (next.has(aprendizId)) next.delete(aprendizId);
      else next.add(aprendizId);
      return next;
    });
  }, []);

  const registroPorAprendizId = useMemo(
    () => groupRegistrosByAprendiz(aprendicesEnSesion),
    [aprendicesEnSesion],
  );

  const accionInferidaDocumento = useMemo(
    () => inferirAccionPorDocumento(documentoManual, aprendicesFicha, registroPorAprendizId),
    [documentoManual, aprendicesFicha, registroPorAprendizId],
  );

  const aprendicesFiltrados = useMemo(() => {
    const q = busquedaAprendiz.trim().toLowerCase();
    const lista = q
      ? aprendicesFicha.filter(
          (a) =>
            (a.persona_nombre?.toLowerCase().includes(q) ?? false) ||
            (a.persona_documento?.toLowerCase().includes(q) ?? false),
        )
      : aprendicesFicha;
    return sortAprendicesAz(lista);
  }, [aprendicesFicha, busquedaAprendiz]);

  const bulkCounts = useMemo(
    () => computeBulkCounts(selectedAprendizIds, registroPorAprendizId),
    [selectedAprendizIds, registroPorAprendizId],
  );

  const runBulkRegistro = async (
    items: { kind: 'ingreso'; aprendizId: number }[] | { kind: 'salida'; asistenciaAprendizId: number }[],
    label: string,
  ) => {
    if (!sesionActual || items.length === 0) return;
    setBulkProcesando(true);
    let ok = 0;
    let fail = 0;
    for (const item of items) {
      try {
        if (item.kind === 'ingreso') {
          upsertAsistenciaAprendizEnSesion(
            await apiService.registrarIngresoAsistencia({
              asistencia_id: sesionActual.id,
              aprendiz_id: item.aprendizId,
            }),
          );
        } else {
          upsertAsistenciaAprendizEnSesion(await apiService.registrarSalidaAsistencia(item.asistenciaAprendizId));
        }
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkProcesando(false);
    setSelectedAprendizIds(new Set());
    if (fail > 0) globalThis.alert(`${label}: ${ok} registradas, ${fail} con error.`);
  };

  const handleBulkEntrada = () => {
    const ids = [...selectedAprendizIds].filter((id) => !summaryRegistros(registroPorAprendizId.get(id) ?? []).open);
    void runBulkRegistro(ids.map((aprendizId) => ({ kind: 'ingreso' as const, aprendizId })), 'Entrada');
  };

  const handleBulkSalida = () => {
    const items = [...selectedAprendizIds]
      .map((id) => {
        const { open } = summaryRegistros(registroPorAprendizId.get(id) ?? []);
        return open ? { kind: 'salida' as const, asistenciaAprendizId: open.id } : null;
      })
      .filter((x): x is { kind: 'salida'; asistenciaAprendizId: number } => x !== null);
    void runBulkRegistro(items, 'Salida');
  };

  const handleRegistroManualSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    void handleRegistrarPorDocumento(documentoManual);
  };

  const fichaSeleccionada = fichaId ? fichas.find((f) => f.id === fichaId) : null;
  const showSinFichas = !fichasLoading && fichas.length === 0;
  const showTomarSesion = Boolean(sesionActual && !sesionActual.is_finished && fichaSeleccionada);
  const enSesionCount = new Set(aprendicesEnSesion.map((aa) => aa.aprendiz_id)).size;
  const todosFiltradosSeleccionados =
    aprendicesFiltrados.length > 0 && aprendicesFiltrados.every((a) => selectedAprendizIds.has(a.id));
  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const toggleSeleccionarTodosFiltrados = () => {
    if (todosFiltradosSeleccionados) setSelectedAprendizIds(new Set());
    else setSelectedAprendizIds(new Set(aprendicesFiltrados.map((a) => a.id)));
  };

  return {
    roles,
    isSuperAdmin,
    fichas,
    fichasLoading,
    fichaId,
    sesionActual,
    aprendicesFicha,
    aprendicesEnSesion,
    loadingAprendices,
    errorAprendices,
    loading,
    error,
    errorSesionMsg,
    setMensajeRegistroManual,
    nuevaSesionPayloadRef,
    documentoManual,
    setDocumentoManual,
    errorRegistroManual,
    setErrorRegistroManual,
    mensajeRegistroManual,
    registrandoManual,
    observacionesModal,
    setObservacionesModal,
    tiposObservacionCatalog,
    observacionesGuardando,
    observacionesSesionModal,
    setObservacionesSesionModal,
    observacionesSesionGuardando,
    estadoModal,
    setEstadoModal,
    estadoGuardando,
    pendientesRevision,
    pendientesLoading,
    pendientesError,
    selectedAprendizIds,
    busquedaAprendiz,
    setBusquedaAprendiz,
    accionInferidaDocumento,
    busyAprendizIds,
    bulkProcesando,
    registroPorAprendizId,
    aprendicesFiltrados,
    bulkCounts,
    fichaSeleccionada,
    showSinFichas,
    showTomarSesion,
    enSesionCount,
    todosFiltradosSeleccionados,
    handleTomarAsistencia,
    handleVolverAFichas,
    handleRegistrarIngreso,
    handleRegistrarSalida,
    onAbrirEstadoModal,
    onAbrirObservacionesModal,
    handleGuardarObservaciones,
    handleGuardarEstado,
    handleGuardarObservacionesSesion,
    quitarTipoObservacionEnModal,
    handleRegistrarPorDocumento,
    toggleSelectAprendiz,
    handleBulkEntrada,
    handleBulkSalida,
    handleRegistroManualSubmit,
    toggleSeleccionarTodosFiltrados,
  };
}

export type AsistenciaPageState = ReturnType<typeof useAsistenciaPage>;
