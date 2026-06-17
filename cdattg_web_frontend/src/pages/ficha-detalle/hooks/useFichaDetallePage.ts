import { useEffect } from 'react';

type UseFichaDetallePageArgs = Readonly<{
  fichaId: number;
  isValidFichaId: boolean;
  tab: string;
  setLoading: (loading: boolean) => void;
  loadFicha: () => Promise<void>;
  loadInstructores: () => Promise<void>;
  loadAprendices: () => Promise<void>;
  loadPersonas: () => Promise<void>;
}>;

export function useFichaDetallePage({
  fichaId,
  isValidFichaId,
  tab,
  setLoading,
  loadFicha,
  loadInstructores,
  loadAprendices,
  loadPersonas,
}: UseFichaDetallePageArgs) {
  useEffect(() => {
    if (!isValidFichaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadFicha(), loadInstructores(), loadAprendices(), loadPersonas()]).finally(() =>
      setLoading(false),
    );
  }, [fichaId, isValidFichaId, loadFicha, loadInstructores, loadAprendices, loadPersonas, setLoading]);

  useEffect(() => {
    if (!isValidFichaId) return;
    if (tab === 'instructores') void loadInstructores();
    else if (tab === 'aprendices') void loadAprendices();
  }, [tab, fichaId, isValidFichaId, loadInstructores, loadAprendices]);
}
