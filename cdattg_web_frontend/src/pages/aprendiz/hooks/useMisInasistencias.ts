import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { MisInasistenciasResponse } from '../../../types';

const DIAS_OPCIONES = [30, 60, 90] as const;

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
