import { QrCodeIcon } from '@heroicons/react/24/outline';
import { EscanerQR } from '../../components/EscanerQR';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import { ModoEntradaSalidaToggle } from './ModoEntradaSalidaToggle';
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
      description="Active la cámara y escanee el QR del aprendiz (contiene su documento)."
      icon={<QrCodeIcon className="h-6 w-6" />}
    >
      <ModoEntradaSalidaToggle modo={page.modoRegistroDocumento} onChange={page.setModoRegistroDocumento} />
      <EscanerQR
        key={`qr-${sesionId}-${page.modoRegistroDocumento}`}
        activo
        embedded
        onEscaneado={page.handleRegistrarPorDocumento}
        readerId={`qr-sesion-${sesionId}`}
      />
    </AsistenciaCollapsibleCard>
  );
}
