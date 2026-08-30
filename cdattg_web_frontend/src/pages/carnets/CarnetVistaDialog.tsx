/**
 * El instructor líder ve cara, reverso y foto antes de decidir.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { getVistaSolicitud, urlFotoSolicitud } from '../../services/carnetApi';
import { CarnetCara } from './CarnetCara';
import { CarnetReverso } from './CarnetReverso';
import type { CarnetVistaInstructor } from '../../types/carnet';

type Props = Readonly<{
  id: number;
  onClose: () => void;
  onDecidir: (aprobar: boolean) => void;
}>;

/**
 * Abro la vista completa de la solicitud.
 */
export function CarnetVistaDialog({ id, onClose, onDecidir }: Props) {
  const [vista, setVista] = useState<CarnetVistaInstructor | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [reverso, setReverso] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let revoke: string | null = null;
    const token = localStorage.getItem('token') ?? '';
    void getVistaSolicitud(id).then(setVista).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
    void fetch(urlFotoSolicitud(id), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        revoke = URL.createObjectURL(blob);
        setFotoUrl(revoke);
      });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={onClose} />
      <dialog open className="relative z-10 m-0 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ver carnet</h2>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {vista ? (
          <>
            {reverso ? <CarnetReverso ficha={vista.ficha} /> : <CarnetCara persona={vista.persona} ficha={vista.ficha} fotoUrl={fotoUrl} />}
            <button type="button" className="btn-secondary mt-3 w-full" onClick={() => setReverso((v) => !v)}>
              {reverso ? 'Ver cara' : 'Ver reverso'}
            </button>
          </>
        ) : <p className="mt-2 text-sm text-gray-500">Cargando…</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-sena" onClick={() => onDecidir(true)}>Aceptar</button>
          <button type="button" className="btn-danger" onClick={() => onDecidir(false)}>Devolver</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </dialog>
    </div>
  );
}
