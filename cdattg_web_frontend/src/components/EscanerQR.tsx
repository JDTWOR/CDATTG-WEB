import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QR_READER_ID_DEFAULT = 'asistencia-qr-reader';

interface EscanerQRProps {
  onEscaneado: (numeroDocumento: string) => void;
  activo: boolean;
  className?: string;
  /** Id único del contenedor para evitar conflicto cuando se monta/desmonta (evita pantalla en blanco). */
  readerId?: string;
}

/**
 * Componente que muestra la cámara y escanea códigos QR.
 * El QR debe contener únicamente el número de documento del aprendiz.
 */
export function EscanerQR({ onEscaneado, activo, className = '', readerId = QR_READER_ID_DEFAULT }: EscanerQRProps) {
  const [error, setError] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onEscaneadoRef = useRef(onEscaneado);
  onEscaneadoRef.current = onEscaneado;

  useEffect(() => {
    if (!activo) return;

    setError(null);
    setPermisos(null);

    // Retrasar la creación del escáner hasta que el div esté en el DOM (evita pantalla en blanco tras permisos).
    const t = setTimeout(() => {
      const container = document.getElementById(readerId);
      if (!container) {
        setError('Contenedor del escáner no disponible');
        return;
      }
      const html5Qr = new Html5Qrcode(readerId);
      scannerRef.current = html5Qr;

      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (!cameras || cameras.length === 0) {
            setError('No se encontró ninguna cámara');
            return;
          }
          setPermisos(true);
          const cameraId = cameras[0].id;
          return html5Qr
            .start(
              cameraId,
              { fps: 8, qrbox: { width: 220, height: 220 } },
              (decodedText) => {
                const doc = String(decodedText || '').trim();
                if (doc) {
                  onEscaneadoRef.current(doc);
                  html5Qr.pause();
                  setTimeout(() => html5Qr.resume(), 1500);
                }
              },
              () => {}
            )
            .catch((err: Error) => {
              setError(err?.message || 'Error al iniciar la cámara');
            });
        })
        .catch((err: Error) => {
          setError(err?.message || 'Error al solicitar permisos de cámara');
          setPermisos(false);
        });
    }, 150);

    return () => {
      clearTimeout(t);
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [activo, readerId]);

  if (!activo) return null;

  return (
    <div className={className}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Escanear QR</h3>
          <span className="rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">Registro en tiempo real</span>
        </div>
        <p className="mb-3 text-sm text-gray-600">Posicione el código QR en el recuadro</p>
        {error && (
          <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {permisos === false && !error && (
          <div className="mb-3 rounded bg-amber-50 p-3 text-sm text-amber-800">
            Permisos de cámara denegados. Use el registro manual por documento.
          </div>
        )}
        <div id={readerId} className="min-h-[240px] w-full max-w-sm" />
      </div>
    </div>
  );
}
