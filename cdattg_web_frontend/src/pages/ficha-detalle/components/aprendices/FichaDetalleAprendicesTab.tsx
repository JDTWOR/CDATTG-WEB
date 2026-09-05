import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import type { FichaAprendicesTabModel } from '../../hooks/useFichaAprendices';
import type { FichaCaracterizacionResponse } from '../../../../types';
import { exportarListaAprendicesSenaPdf } from '../../exportAprendicesListaSenaPdf';
import { FichaDetalleAprendicesTable } from './FichaDetalleAprendicesTable';
import { FichaDetalleAprendicesToolbar } from './FichaDetalleAprendicesToolbar';
import { FichaDetalleAsignarAprendicesPanel } from './FichaDetalleAsignarAprendicesPanel';

type FichaDetalleAprendicesTabProps = Readonly<
  FichaAprendicesTabModel & {
    ficha: FichaCaracterizacionResponse;
    puedeGestionarAprendices: boolean;
  }
>;

export function FichaDetalleAprendicesTab({
  stats,
  busquedaAprendiz,
  setBusquedaAprendiz,
  aprendicesFiltrados,
  aprendices,
  showFormAprendices,
  setShowFormAprendices,
  personasNoAprendices,
  personasSeleccionadas,
  onPersonaCheckboxChange,
  handleAsignarAprendices,
  handleDesasignarAprendices,
  handleOcultarEnAsistencia,
  ficha,
  puedeGestionarAprendices,
}: FichaDetalleAprendicesTabProps) {
  const [exportando, setExportando] = useState(false);

  const handleExportar = useCallback(async () => {
    setExportando(true);
    try {
      await exportarListaAprendicesSenaPdf(ficha, aprendices);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo generar el documento.';
      await Swal.fire({ icon: 'error', title: 'Exportación', text: msg });
    } finally {
      setExportando(false);
    }
  }, [aprendices, ficha]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <FichaDetalleAprendicesToolbar
        stats={stats}
        busqueda={busquedaAprendiz}
        onBusquedaChange={setBusquedaAprendiz}
        puedeGestionar={puedeGestionarAprendices}
        onAsignarClick={() => setShowFormAprendices(true)}
        exportando={exportando}
        onExportarClick={() => void handleExportar()}
        puedeExportar
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
