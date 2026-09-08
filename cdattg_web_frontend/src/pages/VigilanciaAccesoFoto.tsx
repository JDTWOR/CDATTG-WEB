/**
 * Muestro arriba del documento la foto: la del carnet validado o la de perfil.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { urlFotoAcceso } from '../services/vigilanciaAccesoFoto';

/**
 * Cargo la foto de portería con el token de la sesión.
 * @param documento cédula de la persona
 * @param tieneFoto si hay archivo que pedir
 */
export function VigilanciaAccesoFoto({
  documento,
  tieneFoto,
}: Readonly<{ documento: string; tieneFoto: boolean }>) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    setSrc(null);
    if (!tieneFoto || !documento) return;
    const token = localStorage.getItem('token') ?? '';
    let revoke: string | null = null;
    void fetch(urlFotoAcceso(documento), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [documento, tieneFoto]);
  return (
    <figure className="mx-auto h-44 w-36 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
      {src ? (
        <img src={src} alt="Foto de la persona" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-gray-400">Sin foto</span>
      )}
    </figure>
  );
}
