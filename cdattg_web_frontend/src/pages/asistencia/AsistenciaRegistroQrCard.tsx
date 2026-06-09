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
        Si escanea dos veces seguidas, la entrada se registra una sola vez. Si el aprendiz ya tiene entrada sin
        salida, el siguiente escaneo marca salida (espere al menos 1 minuto desde la entrada).
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
    </AsistenciaCollapsibleCard>
  );
}
