/**
 * Diálogo para tomar o cargar la foto de perfil (solo JPG).
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef, useState } from 'react';
import { archivoEsJpg } from './comprimirJpg';
import { prepararFotoPerfil } from './prepararFotoPerfil';
import { subirMiFoto } from '../../services/personaFotoApi';
import type { PersonaResponse } from '../../types';

type PerfilFotoCamaraProps = Readonly<{
  onCerrar: () => void;
  onGuardada: (persona: PersonaResponse) => void;
}>;

const CONDICIONES =
  'La foto debe ser de medio cuerpo, con camisa presentable (cualquier color). Solo se acepta JPG y queda en 20 KB.';

/**
 * Pinto tomar foto y cargar foto en verde, con las condiciones.
 */
export function PerfilFotoCamara({ onCerrar, onGuardada }: PerfilFotoCamaraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamaraLista(true);
      })
      .catch(() => setError('No pude abrir la cámara. Puede cargar un JPG del dispositivo.'));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const enviar = async (fuente: Blob) => {
    setGuardando(true);
    setError('');
    try {
      onGuardada(await subirMiFoto(await prepararFotoPerfil(fuente)));
      onCerrar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pude guardar la foto');
    } finally {
      setGuardando(false);
    }
  };

  const capturar = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.92));
    if (blob) await enviar(blob);
  };

  const cargarArchivo = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivoEsJpg(archivo)) {
      setError('Solo se permite un archivo JPG.');
      return;
    }
    void enviar(archivo);
  };

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" aria-labelledby="titulo-foto-perfil">
      <section className="w-full max-w-md rounded-2xl bg-white p-4 dark:bg-gray-800">
        <h2 id="titulo-foto-perfil" className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Foto de perfil
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{CONDICIONES}</p>
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          className="sr-only"
          onChange={(e) => cargarArchivo(e.target.files?.[0])}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="btn-sena" onClick={() => fileRef.current?.click()} disabled={guardando}>
            Cargar foto
          </button>
          <button type="button" className="btn-sena" onClick={() => void capturar()} disabled={guardando || !camaraLista}>
            {guardando ? 'Guardando…' : 'Tomar foto'}
          </button>
        </div>
      </section>
    </dialog>
  );
}
