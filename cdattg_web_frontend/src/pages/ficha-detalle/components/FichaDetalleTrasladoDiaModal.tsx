import type { DiaFormacionItem, InstructorFichaResponse, TrasladoParFechaRequest } from '../../../types';

export type TrasladoModo = 'permanente' | 'fechas';

export type TrasladoParFechaDraft = TrasladoParFechaRequest & { clientKey: string };

export function crearTrasladoParFechaDraft(): TrasladoParFechaDraft {
  const clientKey =
    globalThis.crypto?.randomUUID?.() ?? `par-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { clientKey, fecha_origen: '', fecha_destino: '' };
}

type FichaDetalleTrasladoDiaModalProps = Readonly<{
  open: boolean;
  instructores: InstructorFichaResponse[];
  diasFichaDisponibles: DiaFormacionItem[];
  modo: TrasladoModo;
  setModo: (value: TrasladoModo) => void;
  paresFechas: TrasladoParFechaDraft[];
  setParesFechas: (value: TrasladoParFechaDraft[]) => void;
  origenInstructorId: number;
  setOrigenInstructorId: (value: number) => void;
  origenDiaId: number;
  setOrigenDiaId: (value: number) => void;
  destinoInstructorId: number;
  setDestinoInstructorId: (value: number) => void;
  destinoDiaId: number;
  setDestinoDiaId: (value: number) => void;
  motivo: string;
  setMotivo: (value: string) => void;
  guardando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

function diasInstructor(instructorId: number, instructores: InstructorFichaResponse[]): number[] {
  const inst = instructores.find((i) => i.instructor_id === instructorId);
  return inst?.dias_formacion_ids ?? [];
}

function nombreDia(id: number, dias: DiaFormacionItem[]): string {
  return dias.find((d) => d.id === id)?.nombre ?? `día ${id}`;
}

export function FichaDetalleTrasladoDiaModal({
  open,
  instructores,
  diasFichaDisponibles,
  modo,
  setModo,
  paresFechas,
  setParesFechas,
  origenInstructorId,
  setOrigenInstructorId,
  origenDiaId,
  setOrigenDiaId,
  destinoInstructorId,
  setDestinoInstructorId,
  destinoDiaId,
  setDestinoDiaId,
  motivo,
  setMotivo,
  guardando,
  onCancel,
  onConfirm,
}: FichaDetalleTrasladoDiaModalProps) {
  if (!open) return null;
  const origenDias = diasInstructor(origenInstructorId, instructores);
  const destinoDias = diasInstructor(destinoInstructorId, instructores);
  const esPorFechas = modo === 'fechas';

  const actualizarPar = (clientKey: string, field: keyof TrasladoParFechaRequest, value: string) => {
    setParesFechas(
      paresFechas.map((par) => (par.clientKey === clientKey ? { ...par, [field]: value } : par)),
    );
  };

  const agregarPar = () => {
    setParesFechas([...paresFechas, crearTrasladoParFechaDraft()]);
  };

  const quitarPar = (clientKey: string) => {
    if (paresFechas.length <= 1) return;
    setParesFechas(paresFechas.filter((par) => par.clientKey !== clientKey));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trasladar día de formación</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Permuta sesiones entre dos instructores. El backend validará colisiones con otras fichas.
        </p>

        <fieldset className="mt-4 space-y-2 border-0 p-0">
          <legend className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Tipo de traslado
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <input
                id="traslado-modo-fechas"
                type="radio"
                name="traslado-modo"
                checked={esPorFechas}
                onChange={() => setModo('fechas')}
                className="mt-1"
              />
              <label htmlFor="traslado-modo-fechas" className="cursor-pointer text-sm text-gray-800 dark:text-gray-100">
                <span className="font-medium">Por fechas específicas</span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  Solo las fechas indicadas (ej. miércoles 17 ↔ viernes 19).
                </span>
              </label>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <input
                id="traslado-modo-permanente"
                type="radio"
                name="traslado-modo"
                checked={!esPorFechas}
                onChange={() => setModo('permanente')}
                className="mt-1"
              />
              <label htmlFor="traslado-modo-permanente" className="cursor-pointer text-sm text-gray-800 dark:text-gray-100">
                <span className="font-medium">Permanente desde hoy</span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  Intercambia los días de la semana en adelante (no fechas pasadas).
                </span>
              </label>
            </div>
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Origen</p>
            <select
              className="input-field w-full"
              value={origenInstructorId || ''}
              onChange={(e) => {
                const value = Number(e.target.value);
                setOrigenInstructorId(value);
                setOrigenDiaId(0);
              }}
            >
              <option value="">Seleccione instructor</option>
              {instructores.map((inst) => (
                <option key={`origen-${inst.id}`} value={inst.instructor_id}>
                  {inst.instructor_nombre}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={origenDiaId || ''}
              onChange={(e) => setOrigenDiaId(Number(e.target.value))}
              disabled={!origenInstructorId}
            >
              <option value="">Seleccione día</option>
              {diasFichaDisponibles
                .filter((d) => origenDias.includes(d.id))
                .map((dia) => (
                  <option key={`origen-dia-${dia.id}`} value={dia.id}>
                    {dia.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Destino</p>
            <select
              className="input-field w-full"
              value={destinoInstructorId || ''}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDestinoInstructorId(value);
                setDestinoDiaId(0);
              }}
            >
              <option value="">Seleccione instructor</option>
              {instructores.map((inst) => (
                <option key={`destino-${inst.id}`} value={inst.instructor_id}>
                  {inst.instructor_nombre}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={destinoDiaId || ''}
              onChange={(e) => setDestinoDiaId(Number(e.target.value))}
              disabled={!destinoInstructorId}
            >
              <option value="">Seleccione día</option>
              {diasFichaDisponibles
                .filter((d) => destinoDias.includes(d.id))
                .map((dia) => (
                  <option key={`destino-dia-${dia.id}`} value={dia.id}>
                    {dia.nombre}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {esPorFechas ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Fechas a intercambiar
              </p>
              <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={agregarPar}>
                Agregar par
              </button>
            </div>
            {origenDiaId > 0 && destinoDiaId > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cada fila intercambia un {nombreDia(origenDiaId, diasFichaDisponibles)} con un{' '}
                {nombreDia(destinoDiaId, diasFichaDisponibles)} en fechas concretas.
              </p>
            ) : null}
            {paresFechas.map((par) => (
              <div
                key={par.clientKey}
                className="grid grid-cols-1 items-end gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600 md:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <label htmlFor={`traslado-origen-${par.clientKey}`} className="mb-1 block text-xs text-gray-500">
                    Fecha origen ({nombreDia(origenDiaId, diasFichaDisponibles)})
                  </label>
                  <input
                    id={`traslado-origen-${par.clientKey}`}
                    type="date"
                    className="input-field w-full"
                    value={par.fecha_origen}
                    onChange={(e) => actualizarPar(par.clientKey, 'fecha_origen', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`traslado-destino-${par.clientKey}`} className="mb-1 block text-xs text-gray-500">
                    Fecha destino ({nombreDia(destinoDiaId, diasFichaDisponibles)})
                  </label>
                  <input
                    id={`traslado-destino-${par.clientKey}`}
                    type="date"
                    className="input-field w-full"
                    value={par.fecha_destino}
                    onChange={(e) => actualizarPar(par.clientKey, 'fecha_destino', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 text-xs"
                  onClick={() => quitarPar(par.clientKey)}
                  disabled={paresFechas.length <= 1}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <label
            htmlFor="traslado-motivo"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Motivo del traslado
          </label>
          <textarea
            id="traslado-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            maxLength={500}
            className="input-field w-full"
            placeholder="Ejemplo: permuta por disponibilidad de jueves/viernes"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={guardando}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Confirmar traslado'}
          </button>
        </div>
      </div>
    </div>
  );
}
