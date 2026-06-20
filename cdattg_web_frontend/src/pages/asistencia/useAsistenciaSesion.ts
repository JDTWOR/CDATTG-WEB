import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumbOverride } from '../../navigation/breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { canManageFichas } from '../../utils/fichaCaracterizacionForm';
import type { AsistenciaResponse, FichaCaracterizacionResponse } from '../../types';
import { parseAsistenciaFichaIdParam, asistenciaPaths } from './asistenciaPaths';
import { useAsistenciaRegistro } from './useAsistenciaRegistro';

export function useAsistenciaSesion() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setLabel, clearLabel } = useBreadcrumbOverride();
  const { fichaId: fichaIdParam } = useParams<{ fichaId: string }>();
  const fichaId = parseAsistenciaFichaIdParam(fichaIdParam);
  const { roles } = useAuth();
  const puedeEliminarRegistro = useMemo(() => canManageFichas(roles), [roles]);

  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaCaracterizacionResponse | null>(null);
  const [sesionActual, setSesionActual] = useState<AsistenciaResponse | null>(null);
  const [entrando, setEntrando] = useState(true);
  const [errorEntrada, setErrorEntrada] = useState('');
  const entrandoRef = useRef(false);

  const sesionSoloLectura = Boolean(sesionActual?.is_finished);

  const registro = useAsistenciaRegistro({
    fichaId: fichaId ?? 0,
    sesionActual,
    setSesionActual,
    puedeEliminarRegistro,
    sesionSoloLectura,
  });

  useEffect(() => {
    if (!fichaId) {
      setEntrando(false);
      setErrorEntrada('Ficha no válida.');
      return;
    }
    if (entrandoRef.current) return;
    entrandoRef.current = true;

    const entrar = async () => {
      setEntrando(true);
      setErrorEntrada('');
      setSesionActual(null);
      try {
        const [ficha, sesion] = await Promise.all([
          apiService.getFichaCaracterizacionById(fichaId),
          apiService.entrarTomarAsistencia(fichaId),
        ]);
        setFichaSeleccionada(ficha);
        setSesionActual(sesion);
      } catch (e: unknown) {
        setErrorEntrada(axiosErrorMessage(e, 'No está asignado como instructor de esta ficha.'));
        setFichaSeleccionada(null);
        setSesionActual(null);
      } finally {
        setEntrando(false);
      }
    };

    void entrar();
  }, [fichaId]);

  useEffect(() => {
    const numero = fichaSeleccionada?.ficha?.trim();
    if (!numero) {
      clearLabel(pathname);
      return;
    }
    setLabel(pathname, `Tomar asistencia · Ficha ${numero}`);
    return () => clearLabel(pathname);
  }, [fichaSeleccionada?.ficha, pathname, setLabel, clearLabel]);

  const handleVolverAFichas = () => {
    navigate(asistenciaPaths.fichas);
  };

  const showSesionView = Boolean(
    fichaId && fichaSeleccionada && sesionActual && !entrando && !errorEntrada,
  );

  return {
    fichaId,
    fichaSeleccionada,
    sesionActual,
    entrando,
    errorEntrada,
    showSesionView,
    sesionSoloLectura,
    handleVolverAFichas,
    ...registro,
  };
}

export type AsistenciaSesionPageState = ReturnType<typeof useAsistenciaSesion>;
