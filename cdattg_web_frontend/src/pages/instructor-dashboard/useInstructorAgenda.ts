import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { InstructorAgendaResponse } from '../../types/agenda';
import {
  addDays,
  endOfMonth,
  formatLocalISO,
  startOfMonth,
  startOfWeekMonday,
} from '../../components/calendar/calendarUtils';

export function useInstructorAgenda(weekStart: Date) {
  const [data, setData] = useState<InstructorAgendaResponse | null>(null);
  const [monthData, setMonthData] = useState<InstructorAgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const desde = formatLocalISO(weekStart);
    const hasta = formatLocalISO(addDays(weekStart, 6));
    const mesDesde = formatLocalISO(startOfMonth(weekStart));
    const mesHasta = formatLocalISO(endOfMonth(weekStart));
    setLoading(true);
    setError('');
    try {
      const [semana, mes] = await Promise.all([
        apiService.getInstructorAgenda(desde, hasta),
        apiService.getInstructorAgenda(mesDesde, mesHasta),
      ]);
      setData(semana);
      setMonthData(mes);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar agenda'));
      setData(null);
      setMonthData(null);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, monthData, loading, error, reload: load };
}

export function useInitialWeekStart() {
  return useState(() => startOfWeekMonday(new Date()));
}
