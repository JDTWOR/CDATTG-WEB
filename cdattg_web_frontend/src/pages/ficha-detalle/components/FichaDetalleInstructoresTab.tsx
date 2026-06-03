import { formatFechaVista } from '../../../utils/formatFecha';
import type { FichaInstructoresTabModel } from '../hooks/useFichaInstructores';
import { DiasInstructorLabel } from './DiasInstructorLabel';
import { FichaDetalleAsignarInstructoresForm } from './FichaDetalleAsignarInstructoresForm';

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
          Use <strong>Programar días</strong> en cada instructor para definir en qué días da formación. Las horas se
          toman de la jornada de la ficha y se ven en la pestaña Programación.
        </p>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {instructores.length === 0 ? (
          <li className="py-4 text-gray-500 dark:text-gray-400">Ningún instructor asignado.</li>
        ) : (
          instructores.map((inst) => {
            const esPrincipal = ficha.instructor_id != null && inst.instructor_id === ficha.instructor_id;
            return (
              <li key={inst.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{inst.instructor_nombre}</span>
                    {esPrincipal ? (
                      <span className="inline-flex shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                        Principal
                      </span>
                    ) : null}
                  </div>
                  {(inst.fecha_inicio || inst.fecha_fin) && (
                    <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
                      {formatFechaVista(inst.fecha_inicio)} — {formatFechaVista(inst.fecha_fin)}
                    </span>
                  )}
                  <DiasInstructorLabel inst={inst} puedeProgramar={puedeProgramarInstructores} />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                  {puedeProgramarInstructores && (
                    <button
                      type="button"
                      onClick={() => onIniciarProgramacion(inst)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Programar días
                    </button>
                  )}
                  {!esPrincipal && puedeEditarFicha && (
                    <button
                      type="button"
                      onClick={onEditarFicha}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Hacer principal
                    </button>
                  )}
                  {puedeProgramarInstructores && (
                    <button
                      type="button"
                      onClick={() => void handleDesasignarInstructor(inst.instructor_id)}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      Desasignar
                    </button>
                  )}
                </div>
                {puedeProgramarInstructores && programandoInstructorId === inst.instructor_id && (
                  <div className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50/50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
                    <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                      Días de formación de {inst.instructor_nombre}
                    </p>
                    {diasFichaDisponibles.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {diasFichaDisponibles.map((dia) => (
                          <label key={dia.id} className="inline-flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={programacionDiasDraft.includes(dia.id)}
                              onChange={() => onToggleDiaProgramacion(dia.id)}
                            />
                            {dia.nombre}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        La ficha no tiene días de formación definidos. Edite la ficha primero.
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void onGuardarProgramacionInstructor()}
                        disabled={guardandoProgramacion || programacionDiasDraft.length === 0}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {guardandoProgramacion ? 'Guardando…' : 'Guardar días'}
                      </button>
                      <button type="button" onClick={onCancelarProgramacion} className="btn-secondary text-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
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
