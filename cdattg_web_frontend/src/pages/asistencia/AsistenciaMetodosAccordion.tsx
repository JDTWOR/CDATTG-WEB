import { useCallback, useState } from 'react';
import type { AsistenciaMetodoRegistroId } from './asistenciaConstants';
import { AsistenciaRegistroDocumentoCard } from './AsistenciaRegistroDocumentoCard';
import { AsistenciaRegistroGrupalCard } from './AsistenciaRegistroGrupalCard';
import { AsistenciaRegistroIndividualCard } from './AsistenciaRegistroIndividualCard';
import { AsistenciaRegistroQrCard } from './AsistenciaRegistroQrCard';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{
  page: AsistenciaPageState;
  sesionId: number;
}>;

/** Acordeón de métodos; `key={sesionId}` en el padre reinicia el panel abierto por sesión. */
export function AsistenciaMetodosAccordion({ page, sesionId }: Props) {
  const [metodoAbierto, setMetodoAbierto] = useState<AsistenciaMetodoRegistroId | null>('documento');

  const toggleMetodo = useCallback((id: AsistenciaMetodoRegistroId) => {
    setMetodoAbierto((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section className="space-y-3" aria-label="Métodos de registro de asistencia" data-sesion-id={sesionId}>
      <AsistenciaRegistroDocumentoCard
        page={page}
        open={metodoAbierto === 'documento'}
        onToggle={() => toggleMetodo('documento')}
      />
      <AsistenciaRegistroQrCard page={page} open={metodoAbierto === 'qr'} onToggle={() => toggleMetodo('qr')} />
      <AsistenciaRegistroIndividualCard
        page={page}
        open={metodoAbierto === 'individual'}
        onToggle={() => toggleMetodo('individual')}
      />
      <AsistenciaRegistroGrupalCard
        page={page}
        open={metodoAbierto === 'grupal'}
        onToggle={() => toggleMetodo('grupal')}
      />
    </section>
  );
}
