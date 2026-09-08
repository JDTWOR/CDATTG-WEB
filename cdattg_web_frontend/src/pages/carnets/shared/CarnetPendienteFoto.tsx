/**
 * Miniatura de la foto que el aprendiz envió en la solicitud.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { urlFotoSolicitud } from '../../../services/carnetApi';

/**
 * Cargo la foto de la solicitud con el token de la sesión.
 * @param id id de la solicitud
 * @param fotoUrl ruta de biblioteca si no es la del instructor
 */
export function CarnetPendienteFoto({ id, fotoUrl }: Readonly<{ id: number; fotoUrl?: string }>) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let revoke: string | null = null;
    void fetch(fotoUrl ?? urlFotoSolicitud(id), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [id, fotoUrl]);
  return (
    <figure className="m-0 h-20 w-16 overflow-hidden rounded bg-gray-100">
      {src ? <img src={src} alt="Foto enviada" className="h-full w-full object-cover" /> : null}
    </figure>
  );
}
