import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FichaDetalleTab } from '../types';

export function useFichaDetalleTab(puedeProgramarInstructores: boolean) {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<FichaDetalleTab>('instructores');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'programacion' && puedeProgramarInstructores) {
      setTab('programacion');
    } else if (t === 'aprendices') {
      setTab('aprendices');
    } else if (t === 'instructores') {
      setTab('instructores');
    }
  }, [searchParams, puedeProgramarInstructores]);

  return [tab, setTab] as const;
}
