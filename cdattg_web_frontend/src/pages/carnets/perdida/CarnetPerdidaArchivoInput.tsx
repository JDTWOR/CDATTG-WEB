/**
 * Carga un comprobante (PDF, JPG, PNG o WEBP) del reporte de pérdida.
 * El área clicable tiene buen aspecto, ofrece vista previa y un botón "Ver"
 * que abre el archivo en otra pestaña. Uso HTML semántico: fieldset con
 * <label>/<input> para adjuntar y <figure>/<figcaption> para el archivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { esImagenComprobante, validarComprobante } from '../../../utils/carnetPerdidaArchivos';

const ACEPTAR = 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp';

type Props = Readonly<{
  etiqueta: string;
  ayuda: string;
  archivo: File | null;
  onChange: (f: File | null) => void;
}>;

function tamanoLegible(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function CarnetPerdidaArchivoInput({ etiqueta, ayuda, archivo, onChange }: Props) {
  const [error, setError] = useState('');
  const [objeto, setObjeto] = useState('');
  const objetoRef = useRef('');

  useEffect(
    () => () => {
      if (objetoRef.current) URL.revokeObjectURL(objetoRef.current);
    },
    [],
  );

  const alElegir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (objetoRef.current) URL.revokeObjectURL(objetoRef.current);
    objetoRef.current = f ? URL.createObjectURL(f) : '';
    setObjeto(objetoRef.current);
    setError(f ? validarComprobante(f) : '');
    onChange(f);
  };

  const quitar = () => {
    if (objetoRef.current) URL.revokeObjectURL(objetoRef.current);
    objetoRef.current = '';
    setObjeto('');
    setError('');
    onChange(null);
  };

  const ver = () => {
    if (objetoRef.current) window.open(objetoRef.current, '_blank', 'noopener,noreferrer');
  };

  if (archivo) {
    return (
      <figure className="mt-1 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
        <span className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
          {esImagenComprobante(archivo) ? (
            <img src={objeto} alt={`Vista previa de ${etiqueta}`} className="h-full w-full object-cover" />
          ) : (
            <DocumentTextIcon className="h-6 w-6 text-primary-600" aria-hidden />
          )}
        </span>
        <figcaption className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{archivo.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{tamanoLegible(archivo.size)}</p>
        </figcaption>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={ver}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-primary-600 ring-1 ring-inset ring-gray-300 hover:bg-primary-50 dark:bg-gray-700 dark:text-primary-300 dark:ring-gray-600"
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
            Ver
          </button>
          <button
            type="button"
            onClick={quitar}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:text-red-600"
            aria-label="Quitar comprobante"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </figure>
    );
  }

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{etiqueta}</legend>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 transition-colors hover:border-primary-400 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-primary-500">
        <input type="file" accept={ACEPTAR} onChange={alElegir} className="sr-only" />
        <ArrowUpTrayIcon className="h-6 w-6 shrink-0 text-primary-600" aria-hidden />
        <span>
          <span className="block text-sm font-medium text-gray-900 dark:text-white">
            Adjuntar {etiqueta.toLowerCase()}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{ayuda}</span>
        </span>
        {error ? (
          <span className="ml-auto text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    </fieldset>
  );
}