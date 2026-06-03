import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { DiaFormacionItem, FichaCaracterizacionResponse } from '../../../types';
import { diasTexto } from '../fichaDetalleUtils';

export function useFichaDetalleData(fichaId: number) {
  const [ficha, setFicha] = useState<FichaCaracterizacionResponse | null>(null);
  const [diasFormacionCat, setDiasFormacionCat] = useState<DiaFormacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isValidFichaId = fichaId > 0 && !Number.isNaN(fichaId);

  const diasFichaDisponibles = useMemo(
    () => diasFormacionCat.filter((d) => ficha?.dias_formacion_ids?.includes(d.id)),
    [diasFormacionCat, ficha?.dias_formacion_ids],
  );

  const defaultDiasIds = useMemo(
    () => ficha?.dias_formacion_ids ?? diasFichaDisponibles.map((d) => d.id),
    [ficha?.dias_formacion_ids, diasFichaDisponibles],
  );

  const diasLabel = useMemo(
    () => (ficha ? diasTexto(ficha, diasFormacionCat) : '—'),
    [ficha, diasFormacionCat],
  );

  const loadFicha = useCallback(async () => {
    if (!fichaId) return;
    try {
      setError('');
      const data = await apiService.getFichaCaracterizacionById(fichaId);
      setFicha(data);
    } catch (err: unknown) {
      const msg = axiosErrorMessage(err, 'Error al cargar ficha');
      setError(msg);
      setFicha(null);
    }
  }, [fichaId]);

  useEffect(() => {
    if (!isValidFichaId) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await apiService.getCatalogosDiasFormacion();
        if (!cancelled) setDiasFormacionCat(d);
      } catch {
        if (!cancelled) setDiasFormacionCat([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fichaId, isValidFichaId]);

  return {
    ficha,
    setFicha,
    diasFormacionCat,
    loading,
    setLoading,
    error,
    isValidFichaId,
    diasFichaDisponibles,
    defaultDiasIds,
    diasLabel,
    loadFicha,
  };
}
