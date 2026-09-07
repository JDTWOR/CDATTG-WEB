/**
 * Muestro la foto del aprendiz en grande para que biblioteca la vea bien.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { urlFotoBiblioteca } from '../../../services/carnetApi';

type Props = Readonly<{
  id: number;
  nombre: string;
  onClose: () => void;
}>;

/**
 * Abro la foto completa sobre la lista.
 */
export function CarnetBibliotecaFotoDialog({ id, nombre, onClose }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let revoke: string | null = null;
    void fetch(urlFotoBiblioteca(id), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      });
    return () => {
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
        <button type="button" className="btn-secondary mt-4 w-full" onClick={onClose}>Cerrar</button>
      </dialog>
    </div>
  );
}
