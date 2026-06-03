import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { InstructorAgendaResponse } from '../../../types/agenda';
import { addDays, formatLocalISO, startOfWeekMonday } from '../../../components/calendar/calendarUtils';

export function useFichaAgenda(fichaId: number, weekStart: Date, enabled = true) {
  const [data, setData] = useState<InstructorAgendaResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!fichaId || !enabled) {
      setLoading(false);
      return;
    }
    const desde = formatLocalISO(weekStart);
    const hasta = formatLocalISO(addDays(weekStart, 6));
    setLoading(true);
    setError('');
    try {
      const resp = await apiService.getFichaAgenda(fichaId, desde, hasta);
      setData(resp);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar programación'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fichaId, weekStart, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function useInitialWeekStart() {
  return useState(() => startOfWeekMonday(new Date()));
}
