import { memo, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QR_READER_ID_DEFAULT = 'asistencia-qr-reader';

interface EscanerQRProps {
  onEscaneado: (numeroDocumento: string) => void;
  activo: boolean;
  className?: string;
  /** Id único del contenedor para evitar conflicto cuando se monta/desmonta (evita pantalla en blanco). */
  readerId?: string;
}

function pickCameraId(cameras: { id: string; label?: string }[]): string {
  const rear = cameras.find((cam) =>
    /back|rear|environment|posterior|trasera/i.test(cam.label || ''),
  );
  return rear?.id ?? cameras[0].id;
}

async function stopScannerAndClearRef(
  html5Qr: Html5Qrcode,
  scannerRef: { current: Html5Qrcode | null },
): Promise<void> {
  try {
    await html5Qr.stop();
  } catch {
    // Ignorar si el navegador ya detuvo el stream.
  } finally {
    scannerRef.current = null;
  }
}

function createDecodedHandler(
  html5Qr: Html5Qrcode,
  scannerRef: { current: Html5Qrcode | null },
  onEscaneadoRef: { current: (numeroDocumento: string) => void },
  isCancelled: () => boolean,
  setCamaraActiva: Dispatch<SetStateAction<boolean>>,
): (decodedText: string) => void {
  return (decodedText: string) => {
    const doc = String(decodedText || '').trim();
    if (!doc || isCancelled()) {
      return;
    }
    onEscaneadoRef.current(doc);
    setCamaraActiva(false);
    void stopScannerAndClearRef(html5Qr, scannerRef);
  };
}

/**
 * Componente que muestra la cámara y escanea códigos QR.
 * El QR debe contener únicamente el número de documento del aprendiz.
 */
function EscanerQRInner({
  onEscaneado,
  activo,
  className = '',
  readerId = QR_READER_ID_DEFAULT,
}: Readonly<EscanerQRProps>) {
  const [error, setError] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<boolean | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const onEscaneadoRef = useRef(onEscaneado);
  onEscaneadoRef.current = onEscaneado;

  // Si el componente deja de estar activo (se cierra la sesión), apagar la cámara.
  useEffect(() => {
    if (!activo) {
      setCamaraActiva(false);
      setError(null);
      setPermisos(null);
    }
  }, [activo]);

  useEffect(() => {
    if (!activo || !camaraActiva) {
      return;
    }

    setError(null);
    setPermisos(null);

    let cancelled = false;

    async function initScanner(): Promise<void> {
      const container = readerContainerRef.current;
      if (!container) {
        setError('Contenedor del escáner no disponible');
        return;
      }

      const html5Qr = new Html5Qrcode(readerId);
      scannerRef.current = html5Qr;

      let cameras: { id: string; label?: string }[];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al solicitar permisos de cámara';
        setError(msg);
        setPermisos(false);
        return;
      }

      if (cancelled) {
        return;
      }

      if (!cameras?.length) {
        setError('No se encontró ninguna cámara');
        return;
      }

      setPermisos(true);
      const cameraId = pickCameraId(cameras);

      const onDecodedSuccess = createDecodedHandler(
        html5Qr,
        scannerRef,
        onEscaneadoRef,
        () => cancelled,
        setCamaraActiva,
      );

      const onScanFailure = (): void => {};

      try {
        await html5Qr.start(
          cameraId,
          { fps: 8, qrbox: { width: 220, height: 220 } },
          onDecodedSuccess,
          onScanFailure,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al iniciar la cámara';
        setError(msg);
      }
    }

    const timer = globalThis.setTimeout(() => {
      void initScanner();
    }, 150);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
      const currentScanner = scannerRef.current;
      if (currentScanner) {
        void currentScanner.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [activo, camaraActiva, readerId]);

  if (!activo) {
    return null;
  }

  return (
    <div className={className}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Escanear QR</h3>
          <span className="rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">Registro en tiempo real</span>
        </div>
        {camaraActiva ? (
          <>
            <p className="mb-3 text-sm text-gray-600">Posicione el código QR en el recuadro</p>
            {error && (
              <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            {permisos === false && !error && (
              <div className="mb-3 rounded bg-amber-50 p-3 text-sm text-amber-800">
                Permisos de cámara denegados. Use el registro manual por documento.
              </div>
            )}
            <div ref={readerContainerRef} id={readerId} className="min-h-[240px] w-full max-w-sm" />
            <button
              type="button"
              onClick={() => setCamaraActiva(false)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Desactivar cámara
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600">
              La cámara se activará solo cuando presione el botón de abajo. Puede usar el registro manual si lo prefiere.
            </p>
            {error && (
              <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <button
              type="button"
              onClick={() => setCamaraActiva(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Activar cámara
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const EscanerQR = memo(EscanerQRInner);
