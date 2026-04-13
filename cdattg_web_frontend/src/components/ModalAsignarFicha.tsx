import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { XMarkIcon, UserGroupIcon, AcademicCapIcon, MagnifyingGlassIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { SelectSearch } from './SelectSearch';
import type {
  InstructorFichaResponse,
  InstructorItem,
  AprendizResponse,
  PersonaResponse,
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
} from '../types';

function toDateInputString(iso?: string | null): string | undefined {
  if (iso == null || iso === '') return undefined;
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return undefined;
}

function normalizeDiaIds(ids?: (number | string)[] | null): number[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(Number).filter((n) => !Number.isNaN(n) && n > 0))];
}

function buildFichaUpdatePayload(f: FichaCaracterizacionResponse, nuevoInstructorId: number): FichaCaracterizacionRequest {
  return {
    programa_formacion_id: f.programa_formacion_id,
    ficha: f.ficha,
    instructor_id: nuevoInstructorId,
    fecha_inicio: toDateInputString(f.fecha_inicio),
    fecha_fin: toDateInputString(f.fecha_fin),
    sede_id: f.sede_id ?? null,
    modalidad_formacion_id: f.modalidad_formacion_id ?? null,
    ambiente_id: f.ambiente_id ?? null,
    jornada_id: f.jornada_id ?? null,
    total_horas: f.total_horas,
    status: f.status,
    dias_formacion_ids: normalizeDiaIds(f.dias_formacion_ids),
  };
}

type WithDisplayName = {
  nombre?: string;
  persona_nombre?: string;
  full_name?: string;
  instructor_nombre?: string;
};

function displayNameFromItem(x: WithDisplayName): string {
  if ('nombre' in x && x.nombre) return String(x.nombre);
  if ('persona_nombre' in x && x.persona_nombre) return String(x.persona_nombre);
  if ('instructor_nombre' in x && x.instructor_nombre) return String(x.instructor_nombre);
  return String((x as unknown as { full_name?: string }).full_name || '');
}

const DEBOUNCE_MS = 350;

type Tipo = 'instructores' | 'aprendices';

interface ModalAsignarFichaProps {
  fichaId: number;
  fichaNombre: string;
  tipo: Tipo;
  onClose: () => void;
  onSuccess?: () => void;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const finAnio = () => {
  const d = new Date();
  d.setMonth(11);
  d.setDate(31);
  return d.toISOString().slice(0, 10);
};

export function ModalAsignarFicha(props: Readonly<ModalAsignarFichaProps>) {
  const { fichaId, fichaNombre, tipo, onClose, onSuccess } = props;
  const [asignados, setAsignados] = useState<InstructorFichaResponse[] | AprendizResponse[]>([]);
  const [noAsignados, setNoAsignados] = useState<InstructorItem[] | PersonaResponse[]>([]);
  const [instructorPrincipalId, setInstructorPrincipalId] = useState<number | undefined>(undefined);
  const [filterAsignados, setFilterAsignados] = useState('');
  const [filterNoAsignados, setFilterNoAsignados] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isInstructores = tipo === 'instructores';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isInstructores) {
        const [instFicha, ficha] = await Promise.all([
          apiService.getFichaInstructores(fichaId),
          apiService.getFichaCaracterizacionById(fichaId),
        ]);
        setAsignados(instFicha);
        const idsAsignados = new Set(instFicha.map((i) => i.instructor_id));
        if (instFicha.length === 0) {
          setInstructorPrincipalId(undefined);
        } else {
          const liderBd =
            ficha.instructor_id != null &&
            ficha.instructor_id > 0 &&
            idsAsignados.has(ficha.instructor_id)
              ? ficha.instructor_id
              : instFicha[0].instructor_id;
          setInstructorPrincipalId(liderBd);
        }
      } else {
        const aprendices = await apiService.getFichaAprendices(fichaId);
        const activos = aprendices.filter((a) => a.estado);
        setAsignados(activos);
      }
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar'));
    } finally {
      setLoading(false);
    }
  }, [fichaId, isInstructores]);

  const handleCambioInstructorPrincipal = async (v: number | undefined) => {
    const prev = instructorPrincipalId;
    if (v === undefined) {
      setInstructorPrincipalId(prev);
      return;
    }
    if (v === prev) return;
    setSaving(true);
    setError('');
    try {
      const ficha = await apiService.getFichaCaracterizacionById(fichaId);
      if (v === ficha.instructor_id) {
        setInstructorPrincipalId(v);
        return;
      }
      const payload = buildFichaUpdatePayload(ficha, v);
      await apiService.updateFichaCaracterizacion(fichaId, payload);
      setInstructorPrincipalId(v);
      onSuccess?.();
      await load();
    } catch (e: unknown) {
      setInstructorPrincipalId(prev);
      setError(axiosErrorMessage(e, 'No se pudo actualizar el instructor principal'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const [debouncedFilterNoAsignados, setDebouncedFilterNoAsignados] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilterNoAsignados(filterNoAsignados), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filterNoAsignados]);

  useEffect(() => {
    if (!asignados.length && loading) return;
    const search = debouncedFilterNoAsignados.trim();
    let cancelled = false;
    if (isInstructores) {
      const idsAsignados = new Set((asignados as InstructorFichaResponse[]).map((i) => i.instructor_id));
      apiService.getInstructores(1, 200, search || undefined).then((res) => {
        if (!cancelled) setNoAsignados(res.data.filter((i) => !idsAsignados.has(i.id)));
      });
    } else {
      const idsAprendices = new Set((asignados as AprendizResponse[]).map((a) => a.persona_id));
      apiService.getPersonas(1, 200, search).then((res) => {
        if (!cancelled) setNoAsignados(res.data.filter((p) => !idsAprendices.has(p.id)));
      });
    }
    return () => { cancelled = true; };
  }, [asignados, debouncedFilterNoAsignados, isInstructores]);

  const filterByQuery = <T extends WithDisplayName>(list: T[], query: string): T[] => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((x) => displayNameFromItem(x).toLowerCase().includes(q));
  };

  const asignadosConNombre = isInstructores
    ? (asignados as InstructorFichaResponse[])
    : (asignados as AprendizResponse[]).map((a) => ({ ...a, nombre: a.persona_nombre }));
  const noAsignadosConNombre = isInstructores
    ? (noAsignados as InstructorItem[])
    : (noAsignados as PersonaResponse[]).map((p) => ({ ...p, nombre: p.full_name }));

  const asignadosF = filterByQuery(asignadosConNombre as WithDisplayName[], filterAsignados) as (InstructorFichaResponse | AprendizResponse)[];
  const noAsignadosF = filterByQuery(noAsignadosConNombre as WithDisplayName[], filterNoAsignados) as (InstructorItem | PersonaResponse)[];

  const handleAssignInstructor = async (instructorId: number) => {
    const asignadosActuales = asignados as InstructorFichaResponse[];
    let principal = instructorPrincipalId ?? asignadosActuales[0]?.instructor_id;

    if (!principal) {
      // Si no hay ninguno asignado todavía, el primero que se asigne será el principal
      principal = instructorId;
    }

    if (!principal) {
      setError('Seleccione un instructor principal primero (en la columna izquierda).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiService.asignarInstructores(fichaId, {
        instructor_principal_id: principal,
        instructores: [
          {
            instructor_id: instructorId,
            fecha_inicio: hoy(),
            fecha_fin: finAnio(),
          },
        ],
      });
      onSuccess?.();
      await load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignInstructor = async (instructorId: number) => {
    setSaving(true);
    setError('');
    try {
      await apiService.desasignarInstructor(fichaId, instructorId);
      if (instructorPrincipalId === instructorId) {
        const next = (asignados as InstructorFichaResponse[]).find((i) => i.instructor_id !== instructorId);
        setInstructorPrincipalId(next?.instructor_id);
      }
      onSuccess?.();
      await load();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al desasignar'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAprendices = async (personaId: number) => {
    setSaving(true);
    setError('');
    try {
      await apiService.asignarAprendices(fichaId, [personaId]);
      onSuccess?.();
      await load();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al asignar'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignAprendices = async (personaId: number) => {
    setSaving(true);
    setError('');
    try {
      await apiService.desasignarAprendices(fichaId, [personaId]);
      onSuccess?.();
      await load();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al desasignar'));
    } finally {
      setSaving(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Cerrar ventana"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        aria-labelledby="modal-asignar-ficha-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2
            id="modal-asignar-ficha-title"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"
          >
            {isInstructores ? (
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
            ) : (
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            )}
            {isInstructores ? 'Asignar instructores' : 'Asignar aprendices'} — Ficha {fichaNombre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {isInstructores && (asignados as InstructorFichaResponse[]).length > 0 && (
          <div className="px-4 pt-2">
            <label
              htmlFor="modal-asignar-instructor-principal"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Instructor principal
            </label>
            <div className="max-w-xs">
              <SelectSearch
                inputId="modal-asignar-instructor-principal"
                options={(asignados as InstructorFichaResponse[]).map((i) => ({
                  value: i.instructor_id,
                  label: i.instructor_nombre,
                }))}
                value={instructorPrincipalId}
                onChange={(v) => void handleCambioInstructorPrincipal(v)}
                placeholder="Seleccione instructor principal"
                isDisabled={saving}
              />
            </div>
          </div>
        )}

        <div className="p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
              <section
                aria-label={isInstructores ? 'Instructores asignados. Arrastre aquí para asignar.' : 'Aprendices asignados. Arrastre aquí para asignar.'}
                className="flex min-h-0 flex-col overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-gray-900/30"
                onDragOver={onDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('id');
                  const side = e.dataTransfer.getData('side');
                  if (!id || side === 'asignados') return;
                  if (isInstructores) handleAssignInstructor(Number(id));
                  else handleAssignAprendices(Number(id));
                }}
              >
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 shrink-0">
                  Asignados a esta ficha ({asignadosF.length})
                </h3>
                <div className="relative mb-2 shrink-0">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filterAsignados}
                    onChange={(e) => setFilterAsignados(e.target.value)}
                    placeholder="Buscar en asignados..."
                    className="input-field w-full pl-8 py-1.5 text-sm"
                  />
                </div>
                <ul className="space-y-1 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  {asignadosF.length === 0 ? (
                    <li className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Arrastre aquí para asignar</li>
                  ) : (
                    asignadosF.map((item) => {
                      const id = isInstructores ? (item as InstructorFichaResponse).instructor_id : (item as AprendizResponse).persona_id;
                      const label = isInstructores ? (item as InstructorFichaResponse).instructor_nombre : (item as AprendizResponse).persona_nombre;
                      return (
                        <li
                          key={id}
                          draggable
                          onDragStart={(ev) => {
                            ev.dataTransfer.setData('id', String(id));
                            ev.dataTransfer.setData('side', 'asignados');
                            ev.dataTransfer.effectAllowed = 'move';
                          }}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing text-sm text-gray-900 dark:text-white"
                        >
                          <span className="truncate">{label}</span>
                          {saving ? null : (
                            <button
                              type="button"
                              onClick={() =>
                                isInstructores ? handleUnassignInstructor(id) : handleUnassignAprendices(id)
                              }
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                              title="Quitar (desasignar)"
                            >
                              <ArrowRightIcon className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>

              <section
                aria-label={isInstructores ? 'Instructores disponibles para asignar' : 'Personas disponibles para asignar'}
                className="flex min-h-0 flex-col overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-gray-900/30"
                onDragOver={onDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('id');
                  const side = e.dataTransfer.getData('side');
                  if (!id || side === 'noAsignados') return;
                  if (isInstructores) handleUnassignInstructor(Number(id));
                  else handleUnassignAprendices(Number(id));
                }}
              >
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 shrink-0">
                  No asignados ({noAsignadosF.length})
                </h3>
                <div className="relative mb-2 shrink-0">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filterNoAsignados}
                    onChange={(e) => setFilterNoAsignados(e.target.value)}
                    placeholder="Buscar en no asignados..."
                    className="input-field w-full pl-8 py-1.5 text-sm"
                  />
                </div>
                <ul className="space-y-1 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  {noAsignadosF.length === 0 ? (
                    <li className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Ninguno disponible</li>
                  ) : (
                    noAsignadosF.map((item) => {
                      const id = isInstructores ? (item as InstructorItem).id : (item as PersonaResponse).id;
                      const label = isInstructores ? (item as InstructorItem).nombre : (item as PersonaResponse).full_name || '';
                      return (
                        <li
                          key={id}
                          draggable
                          onDragStart={(ev) => {
                            ev.dataTransfer.setData('id', String(id));
                            ev.dataTransfer.setData('side', 'noAsignados');
                            ev.dataTransfer.effectAllowed = 'move';
                          }}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing text-sm text-gray-900 dark:text-white"
                        >
                          <span className="truncate">{label}</span>
                          {saving ? null : (
                            <button
                              type="button"
                              onClick={() =>
                                isInstructores ? handleAssignInstructor(id) : handleAssignAprendices(id)
                              }
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors shrink-0"
                              title="Asignar"
                            >
                              <ArrowLeftIcon className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-700">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </dialog>
    </div>
  );
}
