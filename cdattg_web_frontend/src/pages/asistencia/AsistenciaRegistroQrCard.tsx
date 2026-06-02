import { QrCodeIcon } from '@heroicons/react/24/outline';
import { EscanerQR } from '../../components/EscanerQR';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import type { AsistenciaAccordionSectionProps } from './asistenciaConstants';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState } & AsistenciaAccordionSectionProps>;

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
        Si el aprendiz ya tiene entrada sin salida hoy en la ficha, se registrará la salida al escanear.
      </p>
      <EscanerQR
        key={`qr-${sesionId}`}
        activo
        embedded
        onEscaneado={page.handleRegistrarPorDocumento}
        readerId={`qr-sesion-${sesionId}`}
      />
    </AsistenciaCollapsibleCard>
  );
}
