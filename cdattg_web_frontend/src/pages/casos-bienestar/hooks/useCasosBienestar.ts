import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { CasosBienestarResponse } from '../../../types';

type UseCasosBienestarParams = Readonly<{
  enabled: boolean;
  dias: number;
  minFallas: number;
}>;

export function useCasosBienestar({ enabled, dias, minFallas }: UseCasosBienestarParams) {
  const [data, setData] = useState<CasosBienestarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCasos = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getCasosBienestar({ dias, min_fallas: minFallas });
      setData(res);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('Solo el superadministrador puede ver los casos de bienestar.');
      } else {
        setError(axiosErrorMessage(e, 'Error al cargar los casos.'));
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, dias, minFallas]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchCasos();
  }, [enabled, fetchCasos]);

  return { data, loading, error, fetchCasos, setError, setLoading };
}
