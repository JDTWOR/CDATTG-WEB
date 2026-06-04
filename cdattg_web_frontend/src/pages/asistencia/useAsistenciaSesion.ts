import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumbOverride } from '../../navigation/breadcrumb';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { AsistenciaResponse, FichaCaracterizacionResponse } from '../../types';
import { parseAsistenciaFichaIdParam } from './asistenciaPaths';
import { useAsistenciaRegistro } from './useAsistenciaRegistro';

export function useAsistenciaSesion() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setLabel, clearLabel } = useBreadcrumbOverride();
  const { fichaId: fichaIdParam } = useParams<{ fichaId: string }>();
  const fichaId = parseAsistenciaFichaIdParam(fichaIdParam);

  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaCaracterizacionResponse | null>(null);
  const [sesionActual, setSesionActual] = useState<AsistenciaResponse | null>(null);
  const [entrando, setEntrando] = useState(true);
  const [errorEntrada, setErrorEntrada] = useState('');
  const entrandoRef = useRef(false);

  const registro = useAsistenciaRegistro({
    fichaId: fichaId ?? 0,
    sesionActual,
    setSesionActual,
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
    navigate('/asistencia');
  };

  const showTomarSesion = Boolean(
    fichaId && fichaSeleccionada && sesionActual && !sesionActual.is_finished && !entrando && !errorEntrada,
  );

  return {
    fichaId,
    fichaSeleccionada,
    sesionActual,
    entrando,
    errorEntrada,
    showTomarSesion,
    handleVolverAFichas,
    ...registro,
  };
}

export type AsistenciaSesionPageState = ReturnType<typeof useAsistenciaSesion>;
