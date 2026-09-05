import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { DiaFormacionItem, FichaCaracterizacionResponse } from '../../../types';
import { diasTexto } from '../fichaDetalleUtils';

function esIdInternoLegacy(valor: string): boolean {
  return /^\d{1,6}$/.test(valor.trim());
}

export function useFichaDetalleData(fichaNumeroParam: string | undefined) {
  const fichaNumero = decodeURIComponent(fichaNumeroParam ?? '').trim();
  const [ficha, setFicha] = useState<FichaCaracterizacionResponse | null>(null);
  const [diasFormacionCat, setDiasFormacionCat] = useState<DiaFormacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [legacyIdRedirect, setLegacyIdRedirect] = useState<number | null>(null);

  const isValidFichaNumero = fichaNumero.length > 0;

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
    if (!fichaNumero) return;
    try {
      setError('');
      const data = await apiService.getFichaCaracterizacionByNumero(fichaNumero);
      setFicha(data);
      setLegacyIdRedirect(null);
    } catch (err: unknown) {
      if (esIdInternoLegacy(fichaNumero)) {
        const id = Number.parseInt(fichaNumero, 10);
        try {
          const porId = await apiService.getFichaCaracterizacionById(id);
          setFicha(porId);
          setLegacyIdRedirect(id);
          return;
        } catch {
          // sigue al error original
        }
      }
      const msg = axiosErrorMessage(err, 'Error al cargar ficha');
      setError(msg);
      setFicha(null);
      setLegacyIdRedirect(null);
    }
  }, [fichaNumero]);

  useEffect(() => {
    if (!isValidFichaNumero) return;
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
  }, [fichaNumero, isValidFichaNumero]);

  return {
    ficha,
    setFicha,
    diasFormacionCat,
    loading,
    setLoading,
    error,
    isValidFichaNumero,
    legacyIdRedirect,
    diasFichaDisponibles,
    defaultDiasIds,
    diasLabel,
    loadFicha,
  };
}
