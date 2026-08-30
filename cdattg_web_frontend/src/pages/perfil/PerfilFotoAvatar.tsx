/**
 * Círculo de foto de perfil. Si no hay foto, muestro la letra.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { bajarMiFoto } from '../../services/personaFotoApi';

type PerfilFotoAvatarProps = Readonly<{
  initial: string;
  tieneFoto?: boolean;
  className?: string;
}>;

/**
 * Solo muestro la foto. La toma va en el botón de la cabecera.
 */
export function PerfilFotoAvatar({
  initial,
  tieneFoto,
  className = 'h-20 w-20 sm:h-24 sm:w-24 text-3xl',
}: PerfilFotoAvatarProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tieneFoto) {
      setUrl(null);
      return;
    }
    let revoke: string | null = null;
    void bajarMiFoto().then((blob) => {
      if (!blob) return;
      revoke = URL.createObjectURL(blob);
      setUrl(revoke);
    });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [tieneFoto]);

  return (
    <figure className={`m-0 flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/20 font-bold text-white shadow-lg ${className}`}>
      {url ? <img src={url} alt="Foto de perfil" className="h-full w-full object-cover" /> : initial}
    </figure>
  );
}
