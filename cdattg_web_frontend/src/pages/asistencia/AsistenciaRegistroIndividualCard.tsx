import { UserIcon } from '@heroicons/react/24/outline';
import { AsistenciaAprendicesListaSesion } from './AsistenciaAprendicesListaSesion';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import type { AsistenciaAccordionSectionProps } from './asistenciaConstants';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState } & AsistenciaAccordionSectionProps>;

export function AsistenciaRegistroIndividualCard({ page, open, onToggle }: Props) {
  return (
    <AsistenciaCollapsibleCard
      open={open}
      onToggle={onToggle}
      title="Registro uno a uno"
      description="Busque al aprendiz y use los botones Entrada o Salida en cada fila."
      icon={<UserIcon className="h-6 w-6" />}
      badge={`${page.aprendicesFicha.length} aprendices`}
    >
      <AsistenciaAprendicesListaSesion page={page} modoLista="individual" busqueda={false} />
    </AsistenciaCollapsibleCard>
  );
}
