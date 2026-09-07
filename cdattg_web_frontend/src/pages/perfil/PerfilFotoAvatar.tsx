/**
 * Círculo de foto de perfil. Si no hay foto, muestro la letra.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef, useState } from 'react';
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
  const dialogoRef = useRef<HTMLDialogElement>(null);

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
    <>
      <button
        type="button"
        tabIndex={url ? 0 : -1}
        className={`m-0 flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/20 font-bold text-white shadow-lg ${url ? 'cursor-pointer' : ''} ${className}`}
        onClick={() => url && dialogoRef.current?.showModal()}
        disabled={!url}
      >
        {url ? <img src={url} alt="Foto de perfil" className="h-full w-full object-cover" draggable={false} /> : initial}
      </button>
      <dialog
        ref={dialogoRef}
        aria-label="Foto de perfil ampliada"
        className="m-auto flex h-dvh w-dvw items-center justify-center bg-transparent p-0 backdrop:bg-black/70"
      >
        <button
          type="button"
          aria-label="Cerrar foto ampliada"
          className="absolute inset-0 cursor-default"
          onClick={() => dialogoRef.current?.close()}
        />
        <div className="relative z-10">
          <img
            src={url ?? ''}
            alt="Foto de perfil ampliada"
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            draggable={false}
          />
          <button
            type="button"
            aria-label="Cerrar foto ampliada"
            className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-3xl font-bold text-white hover:bg-black/80"
            onClick={() => dialogoRef.current?.close()}
          >
            &times;
          </button>
        </div>
      </dialog>
    </>
  );
}
