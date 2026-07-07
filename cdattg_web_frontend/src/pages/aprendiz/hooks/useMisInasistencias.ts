import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { MisInasistenciasResponse } from '../../../types';

const DIAS_HISTORICO = 0;

const DIAS_OPCIONES = [
  { value: 30, label: 'Últimos 30 días' },
  { value: 60, label: 'Últimos 60 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: DIAS_HISTORICO, label: 'Desde el origen de los tiempos' },
] as const;

export function useMisInasistencias(enabled: boolean) {
  const [dias, setDias] = useState<number>(30);
  const [data, setData] = useState<MisInasistenciasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const resp = await apiService.getMisInasistencias({ dias });
      setData(resp);
    } catch (err) {
      setData(null);
      setError(axiosErrorMessage(err, 'No se pudo cargar el detalle de inasistencias.'));
    } finally {
      setLoading(false);
    }
  }, [dias, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void cargar();
  }, [cargar, enabled]);

  return {
    dias,
    setDias,
    diasOpciones: DIAS_OPCIONES,
    data,
    loading,
    error,
    recargar: cargar,
  };
}
