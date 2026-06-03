import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { InstructorAgendaResponse } from '../../types/agenda';
import { addDays, formatLocalISO, startOfWeekMonday } from '../../components/calendar/calendarUtils';

export function useInstructorAgenda(weekStart: Date) {
  const [data, setData] = useState<InstructorAgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const desde = formatLocalISO(weekStart);
    const hasta = formatLocalISO(addDays(weekStart, 6));
    setLoading(true);
    setError('');
    try {
      const resp = await apiService.getInstructorAgenda(desde, hasta);
      setData(resp);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar agenda'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function useInitialWeekStart() {
  return useState(() => startOfWeekMonday(new Date()));
}
