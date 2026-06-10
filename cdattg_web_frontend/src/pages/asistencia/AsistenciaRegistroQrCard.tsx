import { QrCodeIcon } from '@heroicons/react/24/outline';
import { EscanerQR } from '../../components/EscanerQR';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import type { AsistenciaAccordionSectionProps } from './asistenciaConstants';
import type { AsistenciaSesionPageState } from './useAsistenciaSesion';

type Props = Readonly<{ page: AsistenciaSesionPageState } & AsistenciaAccordionSectionProps>;

export function AsistenciaRegistroQrCard({ page, open, onToggle }: Props) {
  const sesionId = page.sesionActual?.id;
  if (!sesionId) return null;

  return (
    <AsistenciaCollapsibleCard
      open={open}
      onToggle={onToggle}
      title="Registro con código QR"
      description="Escanee el QR del aprendiz; el sistema registra entrada o salida automáticamente."
      icon={<QrCodeIcon className="h-6 w-6" />}
    >
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Mantenga el QR estable unos segundos. Tras cada lectura el escáner hace una pausa breve para evitar
        registros duplicados. Si el aprendiz ya tiene entrada sin salida, el siguiente escaneo marca salida (espere
        al menos 1 minuto desde la entrada).
      </p>
      <EscanerQR
        key={`qr-${sesionId}`}
        activo={open}
        continuo
        embedded
        registroEnCurso={page.registrandoManual}
        onEscaneado={page.handleRegistrarPorDocumento}
        readerId={`qr-sesion-${sesionId}`}
      />
      {page.mensajeRegistroManual ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {page.mensajeRegistroManual}
        </p>
      ) : null}
      {page.errorRegistroManual ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {page.errorRegistroManual}
        </p>
      ) : null}
    </AsistenciaCollapsibleCard>
  );
}
