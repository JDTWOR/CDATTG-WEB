import { UserGroupIcon } from '@heroicons/react/24/outline';
import { AsistenciaAprendicesListaSesion } from './AsistenciaAprendicesListaSesion';
import { AsistenciaBulkBar } from './AsistenciaBulkBar';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import type { AsistenciaAccordionSectionProps } from './asistenciaConstants';
import type { AsistenciaSesionPageState } from './useAsistenciaSesion';

type Props = Readonly<{ page: AsistenciaSesionPageState } & AsistenciaAccordionSectionProps>;

export function AsistenciaRegistroGrupalCard({ page, open, onToggle }: Props) {
  const seleccionados = page.selectedAprendizIds.size;

  return (
    <AsistenciaCollapsibleCard
      open={open}
      onToggle={onToggle}
      title="Registro grupal"
      description="Marque varios aprendices con el checkbox y aplique entrada o salida a todos a la vez."
      icon={<UserGroupIcon className="h-6 w-6" />}
      badge={seleccionados > 0 ? `${seleccionados} seleccionados` : undefined}
    >
      {page.aprendicesFiltrados.length > 0 && (
        <label className="mb-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={page.todosFiltradosSeleccionados}
            onChange={page.toggleSeleccionarTodosFiltrados}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 dark:border-gray-500 dark:bg-gray-700"
          />
          Seleccionar todos los visibles ({page.aprendicesFiltrados.length})
        </label>
      )}
      <AsistenciaAprendicesListaSesion page={page} modoLista="grupal" busqueda={false} />
      <AsistenciaBulkBar page={page} embedded />
      {seleccionados === 0 && page.aprendicesFiltrados.length > 0 ? (
        <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          Seleccione al menos un aprendiz para habilitar entrada o salida grupal.
        </p>
      ) : null}
    </AsistenciaCollapsibleCard>
  );
}
