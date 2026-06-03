import { ASIST_MODAL_IDS, ASIST_MODAL_IDS_ROOT } from './asistenciaConstants';
import type { AsistenciaModalsModel } from './asistenciaModalsTypes';

type ModalsProps = Readonly<{
  page: AsistenciaModalsModel;
  estadoFieldIds?: typeof ASIST_MODAL_IDS | typeof ASIST_MODAL_IDS_ROOT;
}>;

export function AsistenciaModals({ page, estadoFieldIds = ASIST_MODAL_IDS }: ModalsProps) {
  const {
    observacionesModal,
    setObservacionesModal,
    tiposObservacionCatalog,
    observacionesGuardando,
    handleGuardarObservaciones,
    observacionesSesionModal,
    setObservacionesSesionModal,
    observacionesSesionGuardando,
    handleGuardarObservacionesSesion,
    estadoModal,
    setEstadoModal,
    estadoGuardando,
    handleGuardarEstado,
  } = page;

  return (
    <>
      {observacionesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cerrar observaciones"
            onClick={() => setObservacionesModal(null)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby="modal-observaciones-title"
          >
            <h3 id="modal-observaciones-title" className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Observaciones — {observacionesModal.nombre}
            </h3>
            <div className="mb-3">
              <label htmlFor={ASIST_MODAL_IDS.obsTipo} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipos de observación
              </label>
              <select
                id={ASIST_MODAL_IDS.obsTipo}
                value=""
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (!id) return;
                  e.target.value = '';
                  if (observacionesModal.tipoObservacionIds.includes(id)) return;
                  setObservacionesModal((prev) =>
                    prev ? { ...prev, tipoObservacionIds: [...prev.tipoObservacionIds, id] } : null,
                  );
                }}
                className="input-field w-full"
                disabled={observacionesGuardando}
              >
                <option value="">Agregar tipo…</option>
                {tiposObservacionCatalog
                  .filter((t) => observacionesModal.tipoObservacionIds.every((id) => id !== t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor={ASIST_MODAL_IDS.obsLibre} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Observación libre
              </label>
              <textarea
                id={ASIST_MODAL_IDS.obsLibre}
                value={observacionesModal.observaciones}
                onChange={(e) =>
                  setObservacionesModal((prev) => (prev ? { ...prev, observaciones: e.target.value } : null))
                }
                rows={4}
                className="input-field w-full resize-y"
                disabled={observacionesGuardando}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setObservacionesModal(null)} className="btn-secondary" disabled={observacionesGuardando}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleGuardarObservaciones()} className="btn-primary" disabled={observacionesGuardando}>
                {observacionesGuardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </dialog>
        </div>
      )}

      {observacionesSesionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setObservacionesSesionModal(null)} />
          <dialog open className="relative z-10 m-0 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-600 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Observación de la sesión</h3>
            <textarea
              id={ASIST_MODAL_IDS.obsSesionLibre}
              value={observacionesSesionModal.observaciones}
              onChange={(e) => setObservacionesSesionModal({ observaciones: e.target.value })}
              rows={4}
              className="input-field w-full"
              disabled={observacionesSesionGuardando}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setObservacionesSesionModal(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleGuardarObservacionesSesion()} disabled={observacionesSesionGuardando}>
                Guardar
              </button>
            </div>
          </dialog>
        </div>
      )}

      {estadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setEstadoModal(null)} />
          <dialog open className="relative z-10 m-0 w-full max-w-md rounded-xl border bg-white p-5">
            <h3 className="mb-3 text-lg font-semibold">Estado — {estadoModal.nombre}</h3>
            <select
              id={estadoFieldIds.estado}
              value={estadoModal.estado}
              onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, estado: e.target.value } : null))}
              className="input-field mb-3 w-full"
              disabled={estadoGuardando}
            >
              <option value="ASISTENCIA_COMPLETA">Asistencia completa</option>
              <option value="ASISTENCIA_PARCIAL">Asistencia parcial</option>
              <option value="ABANDONO_JORNADA">Abandono de jornada</option>
              <option value="REGISTRO_POR_CORREGIR">Pendiente de revisión</option>
            </select>
            <textarea
              id={estadoFieldIds.estadoMotivo}
              value={estadoModal.motivo}
              onChange={(e) => setEstadoModal((prev) => (prev ? { ...prev, motivo: e.target.value } : null))}
              rows={3}
              className="input-field w-full"
              disabled={estadoGuardando}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEstadoModal(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleGuardarEstado()} disabled={estadoGuardando}>
                Guardar estado
              </button>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}
