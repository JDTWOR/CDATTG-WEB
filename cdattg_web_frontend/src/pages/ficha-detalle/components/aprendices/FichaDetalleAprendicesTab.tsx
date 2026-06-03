import type { FichaAprendicesTabModel } from '../../hooks/useFichaAprendices';
import { FichaDetalleAprendicesTable } from './FichaDetalleAprendicesTable';
import { FichaDetalleAprendicesToolbar } from './FichaDetalleAprendicesToolbar';
import { FichaDetalleAsignarAprendicesPanel } from './FichaDetalleAsignarAprendicesPanel';

type FichaDetalleAprendicesTabProps = Readonly<
  FichaAprendicesTabModel & {
    puedeGestionarAprendices: boolean;
  }
>;

export function FichaDetalleAprendicesTab({
  stats,
  busquedaAprendiz,
  setBusquedaAprendiz,
  aprendicesFiltrados,
  showFormAprendices,
  setShowFormAprendices,
  personasNoAprendices,
  personasSeleccionadas,
  onPersonaCheckboxChange,
  handleAsignarAprendices,
  handleDesasignarAprendices,
  handleOcultarEnAsistencia,
  puedeGestionarAprendices,
}: FichaDetalleAprendicesTabProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <FichaDetalleAprendicesToolbar
        stats={stats}
        busqueda={busquedaAprendiz}
        onBusquedaChange={setBusquedaAprendiz}
        puedeGestionar={puedeGestionarAprendices}
        onAsignarClick={() => setShowFormAprendices(true)}
      />

      <FichaDetalleAprendicesTable
        aprendices={aprendicesFiltrados}
        busquedaActiva={busquedaAprendiz.trim().length > 0}
        puedeGestionar={puedeGestionarAprendices}
        onOcultar={(personaId, oculto, nombre) => void handleOcultarEnAsistencia(personaId, oculto, nombre)}
        onDesasignar={(ids) => void handleDesasignarAprendices(ids)}
      />

      {puedeGestionarAprendices && showFormAprendices && (
        <FichaDetalleAsignarAprendicesPanel
          personasNoAprendices={personasNoAprendices}
          personasSeleccionadas={personasSeleccionadas}
          onPersonaCheckboxChange={onPersonaCheckboxChange}
          onGuardar={() => void handleAsignarAprendices()}
          onCancelar={() => setShowFormAprendices(false)}
        />
      )}
    </div>
  );
}
