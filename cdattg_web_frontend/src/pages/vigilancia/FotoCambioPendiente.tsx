/**
 * Comparo la foto vigente de la persona con la propuesta en un cambio
 * pendiente. En vista compacta se ven miniaturas y un botón "Ver" que abre
 * las dos fotos en grande (como carnet), cerrable con la X, el fondo o el botón.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { urlFotoAcceso, urlFotoCambioPendiente } from '../../services/vigilanciaAccesoFoto';

const TOKEN_KEY = 'token';

/** Trae la foto de la API y la deja lista para el navegador. */
async function cargarFotoBlob(url: string): Promise<string | null> {
  try {
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** Dibuja una foto con su etiqueta, controlada por el tamaño (chico o grande). */
function FotoEtiquetada({ etiqueta, url, grande }: { etiqueta: string; url: string | null; grande?: boolean }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 ${
          grande ? 'h-64 w-64 sm:h-80 sm:w-80' : 'h-20 w-20'
        }`}
      >
        {url ? (
          <img src={url} alt={etiqueta} className="h-full w-full object-cover" />
        ) : (
          <CameraIcon className={`text-gray-400 ${grande ? 'h-16 w-16' : 'h-8 w-8'}`} />
        )}
      </div>
      <figcaption className="text-xs text-gray-500">{etiqueta}</figcaption>
    </figure>
  );
}

interface Props {
  nombre?: string;
  documento?: string;
  tieneFotoActual?: boolean;
  cambioId: number;
  tieneFotoNueva?: boolean;
}

/** Comparación de fotos con apertura y cierre, responsive a todo tamaño. */
export function FotoCambioPendiente({
  nombre,
  documento,
  tieneFotoActual,
  cambioId,
  tieneFotoNueva,
}: Props) {
  const [actualUrl, setActualUrl] = useState<string | null>(null);
  const [nuevaUrl, setNuevaUrl] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!tieneFotoActual || !documento) return;
    void cargarFotoBlob(urlFotoAcceso(documento)).then(setActualUrl);
  }, [documento, tieneFotoActual]);

  useEffect(() => {
    if (!tieneFotoNueva) return;
    void cargarFotoBlob(urlFotoCambioPendiente(cambioId)).then(setNuevaUrl);
  }, [cambioId, tieneFotoNueva]);

  if (!tieneFotoActual && !tieneFotoNueva) return null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-6">
        <FotoEtiquetada etiqueta="Foto actual" url={actualUrl} />
        <span className="text-sm font-semibold text-gray-500">→</span>
        <FotoEtiquetada etiqueta="Foto nueva" url={nuevaUrl} />
        <button type="button" className="btn-secondary" onClick={() => setAbierto(true)}>
          Ver
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
          />
          <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Comparar fotos {nombre ? `de ${nombre}` : ''}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FotoEtiquetada etiqueta="Foto actual" url={actualUrl} grande />
              <FotoEtiquetada etiqueta="Foto nueva" url={nuevaUrl} grande />
            </div>
            <button
              type="button"
              className="btn-secondary mt-4 w-full"
              onClick={() => setAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}