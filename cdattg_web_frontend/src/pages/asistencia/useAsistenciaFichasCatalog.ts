import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import type { FichaCaracterizacionResponse, AsistenciaAprendizResponse } from '../../types';
import { asistenciaFichaPath } from './asistenciaPaths';
import type { AsistenciaEstadoModalState } from './asistenciaModalsTypes';

const noop = () => undefined;

export function useAsistenciaFichasCatalog() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [fichasLoading, setFichasLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorSesionMsg] = useState('');
  const [estadoModal, setEstadoModal] = useState<AsistenciaEstadoModalState | null>(null);
  const [estadoGuardando, setEstadoGuardando] = useState(false);
  const [pendientesRevision, setPendientesRevision] = useState<AsistenciaAprendizResponse[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(false);
  const [pendientesError, setPendientesError] = useState('');

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');
  const showSinFichas = !fichasLoading && fichas.length === 0;

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

  const handleTomarAsistencia = (id: number) => {
    setError('');
    navigate(asistenciaFichaPath(id));
  };

  const onAbrirEstadoModal = useCallback(
    (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => {
      setEstadoModal(payload);
    },
    [],
  );

  const handleGuardarEstado = async () => {
    if (!estadoModal) return;
    setEstadoGuardando(true);
    try {
      await apiService.ajustarEstadoAsistencia(estadoModal.asistenciaAprendizId, {
        estado: estadoModal.estado,
        motivo: estadoModal.motivo || undefined,
      });
      setEstadoModal(null);
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

  return {
    isSuperAdmin,
    fichas,
    fichasLoading,
    showSinFichas,
    error,
    errorSesionMsg,
    loading: false,
    pendientesRevision,
    pendientesLoading,
    pendientesError,
    handleTomarAsistencia,
    onAbrirEstadoModal,
    observacionesModal: null,
    setObservacionesModal: noop,
    tiposObservacionCatalog: [],
    observacionesGuardando: false,
    handleGuardarObservaciones: noop,
    observacionesSesionModal: null,
    setObservacionesSesionModal: noop,
    observacionesSesionGuardando: false,
    handleGuardarObservacionesSesion: noop,
    estadoModal,
    setEstadoModal,
    estadoGuardando,
    handleGuardarEstado,
  };
}

export type AsistenciaFichasPageState = ReturnType<typeof useAsistenciaFichasCatalog>;
