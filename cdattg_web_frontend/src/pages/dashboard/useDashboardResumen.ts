import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { DashboardResumenResponse } from '../../types';
import { jornadaInicialDesdeApi } from './dashboardFichaFilters';

export function useDashboardResumen(params: {
  fecha: string;
  regionalId?: number;
  sedeId?: number;
  enabled?: boolean;
}) {
  const [data, setData] = useState<DashboardResumenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const jornadaInicializadaRef = useRef(false);
  const [jornadaFilter, setJornadaFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const refetch = useCallback(async () => {
    if (params.enabled === false) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getDashboardResumen({
        fecha: params.fecha || undefined,
        regional_id: params.regionalId,
        sede_id: params.sedeId,
      });
      setData(res);
      if (!jornadaInicializadaRef.current) {
        setJornadaFilter(jornadaInicialDesdeApi(res));
        jornadaInicializadaRef.current = true;
      }
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar el dashboard.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.enabled, params.fecha, params.regionalId, params.sedeId]);

  useEffect(() => {
    jornadaInicializadaRef.current = false;
    setJornadaFilter('');
  }, [params.fecha, params.regionalId, params.sedeId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    jornadaFilter,
    setJornadaFilter,
    searchQuery,
    setSearchQuery,
  };
}
