/**
 * Foto del solicitante en la bandeja de revisiones: la pido con el token de
 * la sesión (por eso un <img> directo no sirve) y la muestro en una miniatura.
 * Si el aprendiz no tiene foto, dejo un placeholder.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { bajarFotoPerdida } from '../../../services/carnetPerdidaApi';

type Props = Readonly<{
  solicitudId: number;
  alt: string;
}>;

export function CarnetPerdidaFoto({ solicitudId, alt }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let objUrl: string | null = null;
    void bajarFotoPerdida(solicitudId)
      .then((blob) => {
        if (!activo || !blob) return;
        objUrl = URL.createObjectURL(blob);
        setUrl(objUrl);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [solicitudId]);

  if (!url) {
    return (
      <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-300 dark:bg-gray-700">
        <UserCircleIcon className="h-10 w-10" aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className="h-24 w-20 shrink-0 rounded-md border border-gray-200 object-cover object-top dark:border-gray-600"
    />
  );
}