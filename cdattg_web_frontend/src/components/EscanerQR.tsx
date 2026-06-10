import { memo, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QR_READER_ID_DEFAULT = 'asistencia-qr-reader';
/** Mismo documento: ignorar relecturas del QR mientras la cámara apunta al código. */
const DEBOUNCE_MS = 3000;
/** Pausa de cámara tras cada lectura (evita doble registro). */
const PAUSA_TRAS_ESCANEO_MS = 3000;

interface EscanerQRProps {
  onEscaneado: (numeroDocumento: string) => void | Promise<void>;
  activo: boolean;
  /** Si true, la cámara permanece activa tras cada lectura (escaneo continuo). */
  continuo?: boolean;
  /** Evita lecturas mientras hay un registro en curso (modo continuo). */
  registroEnCurso?: boolean;
  className?: string;
  /** Sin borde/fondo propio cuando va dentro de otra tarjeta. */
  embedded?: boolean;
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

interface DecodedHandlerContext {
  html5Qr: Html5Qrcode;
  scannerRef: { current: Html5Qrcode | null };
  onEscaneadoRef: { current: (numeroDocumento: string) => void | Promise<void> };
  isCancelled: () => boolean;
  setCamaraActiva: Dispatch<SetStateAction<boolean>>;
  continuo: boolean;
  ultimoDocumentoRef: { current: { doc: string; at: number } | null };
  registroEnCursoRef: { current: boolean };
  procesandoLocalRef: { current: boolean };
  bloqueadoHastaRef: { current: number };
  setProcesandoLectura: Dispatch<SetStateAction<boolean>>;
}

function registroBloqueado(ctx: DecodedHandlerContext): boolean {
  if (ctx.registroEnCursoRef.current || ctx.procesandoLocalRef.current) {
    return true;
  }
  return Date.now() < ctx.bloqueadoHastaRef.current;
}

function pausarEscanner(html5Qr: Html5Qrcode): void {
  try {
    html5Qr.pause(true);
  } catch {
    /* ignorar si la cámara ya se detuvo */
  }
}

function reanudarEscanner(html5Qr: Html5Qrcode): void {
  try {
    html5Qr.resume();
  } catch {
    /* ignorar si la cámara ya se detuvo */
  }
}

function liberarEscaneoContinuo(ctx: DecodedHandlerContext): void {
  ctx.bloqueadoHastaRef.current = Date.now() + PAUSA_TRAS_ESCANEO_MS;
  globalThis.setTimeout(() => {
    reanudarEscanner(ctx.html5Qr);
    ctx.setProcesandoLectura(false);
    ctx.procesandoLocalRef.current = false;
  }, PAUSA_TRAS_ESCANEO_MS);
}

function createDecodedHandler(ctx: DecodedHandlerContext): (decodedText: string) => void {
  return (decodedText: string) => {
    const doc = String(decodedText || '').trim();
    if (!doc || ctx.isCancelled()) {
      return;
    }

    if (ctx.continuo) {
      if (registroBloqueado(ctx)) {
        return;
      }

      const now = Date.now();
      const ultimo = ctx.ultimoDocumentoRef.current;
      if (ultimo?.doc === doc && now - ultimo.at < DEBOUNCE_MS) {
        return;
      }

      ctx.procesandoLocalRef.current = true;
      ctx.ultimoDocumentoRef.current = { doc, at: now };
      ctx.setProcesandoLectura(true);
      pausarEscanner(ctx.html5Qr);

      Promise.resolve(ctx.onEscaneadoRef.current(doc))
        .catch(() => {
          /* errores manejados en el callback vía toast */
        })
        .finally(() => {
          liberarEscaneoContinuo(ctx);
        });
      return;
    }

    ctx.onEscaneadoRef.current(doc);
    ctx.setCamaraActiva(false);
    void stopScannerAndClearRef(ctx.html5Qr, ctx.scannerRef);
  };
}

/**
 * Componente que muestra la cámara y escanea códigos QR.
 * El QR debe contener únicamente el número de documento del aprendiz.
 */
function EscanerQRInner({
  onEscaneado,
  activo,
  continuo = false,
  registroEnCurso = false,
  className = '',
  embedded = false,
  readerId = QR_READER_ID_DEFAULT,
}: Readonly<EscanerQRProps>) {
  const [error, setError] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<boolean | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [procesandoLectura, setProcesandoLectura] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const onEscaneadoRef = useRef(onEscaneado);
  const ultimoDocumentoRef = useRef<{ doc: string; at: number } | null>(null);
  const procesandoLocalRef = useRef(false);
  const bloqueadoHastaRef = useRef(0);
  const registroEnCursoRef = useRef(registroEnCurso);
  registroEnCursoRef.current = registroEnCurso;
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

      const onDecodedSuccess = createDecodedHandler({
        html5Qr,
        scannerRef,
        onEscaneadoRef,
        isCancelled: () => cancelled,
        setCamaraActiva,
        continuo,
        ultimoDocumentoRef,
        registroEnCursoRef,
        procesandoLocalRef,
        bloqueadoHastaRef,
        setProcesandoLectura,
      });

      const onScanFailure = (): void => {};

      try {
        await html5Qr.start(
          cameraId,
          { fps: 4, qrbox: { width: 220, height: 220 }, disableFlip: true },
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
  }, [activo, camaraActiva, continuo, readerId]);

  if (!activo) {
    return null;
  }

  const panelClass = embedded
    ? 'p-0'
    : 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800';

  return (
    <div className={className}>
      <div className={panelClass}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Escanear QR</h3>
          <span className="shrink-0 rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">Registro en tiempo real</span>
        </div>
        {camaraActiva ? (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">Posicione el código QR en el recuadro</p>
            {error && (
              <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
            )}
            {permisos === false && !error && (
              <div className="mb-3 rounded bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Permisos de cámara denegados. Use el registro manual por documento.
              </div>
            )}
            <div className="relative flex justify-center">
              <div
                ref={readerContainerRef}
                id={readerId}
                className="qr-scanner-reader mx-auto min-h-[240px] w-full max-w-sm overflow-hidden rounded-lg bg-gray-900"
              />
              {procesandoLectura ? (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex min-h-[240px] w-full max-w-sm flex-col items-center justify-center rounded-lg bg-black/65 px-4 text-center text-white"
                  aria-live="polite"
                >
                  <span className="text-sm font-semibold">Procesando registro…</span>
                  <span className="mt-1 text-xs text-gray-200">Pausa de 3 segundos</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setCamaraActiva(false)}
              className="btn-secondary mt-3 inline-flex w-full items-center justify-center gap-2 text-sm"
            >
              Desactivar cámara
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              La cámara se activará solo cuando presione el botón de abajo. Puede usar el registro manual si lo prefiere.
            </p>
            {error && (
              <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
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
