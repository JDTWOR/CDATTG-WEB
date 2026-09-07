/**
 * El instructor líder ve cara, reverso y foto antes de decidir.
 * Al devolver escribe el motivo, que llega al aprendiz en su notificación.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { getVistaSolicitud, urlFotoSolicitud } from '../../../services/carnetApi';
import { CarnetCara } from '../shared/CarnetCara';
import { CarnetReverso } from '../shared/CarnetReverso';
import type { CarnetVistaInstructor } from '../../../types/carnet';

type Props = Readonly<{
  id: number;
  onClose: () => void;
  onDecidir: (aprobar: boolean, motivo: string) => void;
  soloDevolver?: boolean;
}>;

/**
 * Abro la vista completa de la solicitud con la opción de devolución.
 */
export function CarnetVistaDialog({ id, onClose, onDecidir, soloDevolver = false }: Props) {
  const [vista, setVista] = useState<CarnetVistaInstructor | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [reverso, setReverso] = useState(false);
  const [devolviendo, setDevolviendo] = useState(soloDevolver);
  const [motivo, setMotivo] = useState('');
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
        {devolviendo ? (
          <label className="mt-3 block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de la devolución</span>
            <textarea
              className="input-field mt-1 w-full"
              rows={4}
              value={motivo}
              autoFocus
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique al aprendiz qué debe corregir"
            />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {devolviendo ? (
            <>
              <button
                type="button"
                className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                disabled={motivo.trim() === ''}
                onClick={() => onDecidir(false, motivo.trim())}
              >
                Confirmar devolución
              </button>
              <button type="button" className="btn-secondary" onClick={() => setDevolviendo(false)}>Cancelar</button>
            </>
          ) : (
            <>
              <button type="button" className="btn-sena" onClick={() => onDecidir(true, '')}>Aceptar</button>
              <button type="button" className="btn-danger" onClick={() => setDevolviendo(true)}>Devolver</button>
              <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}