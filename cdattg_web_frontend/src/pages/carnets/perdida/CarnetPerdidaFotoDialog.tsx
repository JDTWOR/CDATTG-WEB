/**
 * Foto grande del solicitante en la bandeja de reposiciones, igual que en
 * carnet regulares. La bajo con el token de la sesión y la muestro en un
 * <dialog>; si no hay foto, dejo el aviso "Sin foto".
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { bajarFotoPerdida } from '../../../services/carnetPerdidaApi';

type Props = Readonly<{
  id: number;
  nombre: string;
  onClose: () => void;
}>;

export function CarnetPerdidaFotoDialog({ id, nombre, onClose }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let revoke: string | null = null;
    void bajarFotoPerdida(id)
      .then((blob) => {
        if (!activo || !blob) return;
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Cerrar" onClick={onClose} />
      <dialog open className="relative z-10 m-0 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Foto de {nombre}</h2>
        <figure className="mt-3 flex justify-center bg-gray-100 dark:bg-gray-900">
          {src ? (
            <img src={src} alt={`Fotografía de ${nombre}`} className="max-h-[70vh] w-auto object-contain" />
          ) : (
            <figcaption className="p-8 text-sm text-gray-500">Sin foto</figcaption>
          )}
        </figure>
        <button type="button" className="btn-secondary mt-4 w-full" onClick={onClose}>
          Cerrar
        </button>
      </dialog>
    </div>
  );
}