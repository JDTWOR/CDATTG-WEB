import { CalendarDaysIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatFechaVista } from '../../../utils/formatFecha';
import type { FichaInstructoresTabModel } from '../hooks/useFichaInstructores';
import { DiasInstructorLabel } from './DiasInstructorLabel';
import { FichaDetalleAsignarInstructoresForm } from './FichaDetalleAsignarInstructoresForm';
import { FichaDetalleInstructorProgramacionPanel } from './FichaDetalleInstructorProgramacionPanel';

type FichaDetalleInstructoresTabProps = Readonly<
  FichaInstructoresTabModel & {
    puedeEditarFicha: boolean;
    puedeProgramarInstructores: boolean;
    onEditarFicha: () => void;
  }
>;

export function FichaDetalleInstructoresTab({
  ficha,
  instructores,
  puedeEditarFicha,
  puedeProgramarInstructores,
  onEditarFicha,
  showFormInstructores,
  setShowFormInstructores,
  instructorPrincipalId,
  setInstructorPrincipalId,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  instructoresDisponibles,
  instructoresSeleccionados,
  diasFichaDisponibles,
  toggleDiaInstructor,
  addInstructorToForm,
  removeInstructorFromForm,
  handleAsignarInstructores,
  programandoInstructorId,
  programacionDiasDraft,
  programacionFechaInicioDraft,
  programacionFechaFinDraft,
  setProgramacionFechaInicioDraft,
  setProgramacionFechaFinDraft,
  onIniciarProgramacion,
  onCancelarProgramacion,
  onToggleDiaProgramacion,
  onGuardarProgramacionInstructor,
  guardandoProgramacion,
  handleDesasignarInstructor,
}: FichaDetalleInstructoresTabProps) {
  if (!ficha) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructores asignados a esta ficha</h2>
        {puedeProgramarInstructores && (
          <button type="button" onClick={() => setShowFormInstructores(true)} className="btn-primary">
            Asignar instructores
          </button>
        )}
      </div>
      {puedeProgramarInstructores && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Use <strong>Editar programación</strong> para ajustar la vigencia (fechas) y los días de formación de cada
          instructor. Las horas se toman de la jornada de la ficha y se ven en la pestaña Programación.
        </p>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {instructores.length === 0 ? (
          <li className="py-4 text-gray-500 dark:text-gray-400">Ningún instructor asignado.</li>
        ) : (
          instructores.map((inst) => {
            const esPrincipal = ficha.instructor_id != null && inst.instructor_id === ficha.instructor_id;
            const editando = programandoInstructorId === inst.instructor_id;
            return (
              <li
                key={inst.id}
                className={`py-3 ${editando ? 'rounded-lg bg-gray-50/80 px-3 -mx-3 dark:bg-gray-900/30' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{inst.instructor_nombre}</span>
                      {esPrincipal ? (
                        <span className="inline-flex shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                          Principal
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Vigencia
                      </span>
                      <span>
                        {formatFechaVista(inst.fecha_inicio)} — {formatFechaVista(inst.fecha_fin)}
                      </span>
                    </div>
                    <DiasInstructorLabel inst={inst} puedeProgramar={puedeProgramarInstructores} />
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                    {puedeProgramarInstructores && (
                      <button
                        type="button"
                        onClick={() => (editando ? onCancelarProgramacion() : onIniciarProgramacion(inst))}
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          editando
                            ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            : 'text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300'
                        }`}
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden />
                        {editando ? 'Cerrar' : 'Editar programación'}
                      </button>
                    )}
                    {!esPrincipal && puedeEditarFicha && !editando && (
                      <button
                        type="button"
                        onClick={onEditarFicha}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Hacer principal
                      </button>
                    )}
                    {puedeProgramarInstructores && !editando && (
                      <button
                        type="button"
                        onClick={() => void handleDesasignarInstructor(inst.instructor_id)}
                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                      >
                        Desasignar
                      </button>
                    )}
                  </div>
                </div>
                {puedeProgramarInstructores && editando && (
                  <FichaDetalleInstructorProgramacionPanel
                    inst={inst}
                    diasFichaDisponibles={diasFichaDisponibles}
                    fechaInicioDraft={programacionFechaInicioDraft}
                    fechaFinDraft={programacionFechaFinDraft}
                    programacionDiasDraft={programacionDiasDraft}
                    onFechaInicioChange={setProgramacionFechaInicioDraft}
                    onFechaFinChange={setProgramacionFechaFinDraft}
                    onToggleDia={onToggleDiaProgramacion}
                    onGuardar={onGuardarProgramacionInstructor}
                    onCancelar={onCancelarProgramacion}
                    guardando={guardandoProgramacion}
                  />
                )}
              </li>
            );
          })
        )}
      </ul>

      {showFormInstructores && (
        <FichaDetalleAsignarInstructoresForm
          instructores={instructores}
          instructorPrincipalId={instructorPrincipalId}
          setInstructorPrincipalId={setInstructorPrincipalId}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          instructoresDisponibles={instructoresDisponibles}
          instructoresSeleccionados={instructoresSeleccionados}
          diasFichaDisponibles={diasFichaDisponibles}
          toggleDiaInstructor={toggleDiaInstructor}
          addInstructorToForm={addInstructorToForm}
          removeInstructorFromForm={removeInstructorFromForm}
          handleAsignarInstructores={handleAsignarInstructores}
          onCancel={() => setShowFormInstructores(false)}
        />
      )}
    </div>
  );
}
