import { useState, useEffect, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  SunIcon,
  BuildingOffice2Icon,
  ComputerDesktopIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { InstructorSelectAsync } from '../components/InstructorSelectAsync';
import { axiosErrorMessage } from '../utils/httpError';
import type {
  FichaCaracterizacionResponse,
  FichaCaracterizacionRequest,
  InstructorFichaResponse,
  InstructorItem,
  InstructorFichaItem,
  AsignarInstructoresRequest,
  AprendizResponse,
  PersonaResponse,
  DiaFormacionItem,
} from '../types';

type Tab = 'instructores' | 'aprendices';

function formatFechaVista(iso?: string | null): string {
  if (iso == null || iso === '') return '—';
  const s = String(iso).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString('es-CO');
  return s;
}

/** ISO / RFC3339 → yyyy-MM-dd para el API */
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

function diasTexto(ficha: FichaCaracterizacionResponse, catalogo: DiaFormacionItem[]): string {
  const ids = normalizeDiaIds(ficha.dias_formacion_ids);
  if (!ids.length) return '—';
  return ids
    .map((id) => catalogo.find((d) => Number(d.id) === id)?.nombre ?? String(id))
    .join(', ');
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

type FichaDetalleInstructoresTabProps = Readonly<{
  ficha: FichaCaracterizacionResponse;
  instructores: InstructorFichaResponse[];
  savingInstructorPrincipal: boolean;
  hacerPrincipalDesdeLista: (instructorId: number) => Promise<void>;
  handleDesasignarInstructor: (instructorId: number) => Promise<void>;
  showFormInstructores: boolean;
  setShowFormInstructores: Dispatch<SetStateAction<boolean>>;
  instructorPrincipalId: number;
  setInstructorPrincipalId: Dispatch<SetStateAction<number>>;
  fechaInicio: string;
  setFechaInicio: Dispatch<SetStateAction<string>>;
  fechaFin: string;
  setFechaFin: Dispatch<SetStateAction<string>>;
  instructoresDisponibles: InstructorItem[];
  instructoresSeleccionados: InstructorFichaItem[];
  addInstructorToForm: (instructorId: number) => void;
  removeInstructorFromForm: (instructorId: number) => void;
  handleAsignarInstructores: () => Promise<void>;
}>;

function FichaDetalleInstructoresTab(props: FichaDetalleInstructoresTabProps) {
  const {
    ficha,
    instructores,
    savingInstructorPrincipal,
    hacerPrincipalDesdeLista,
    handleDesasignarInstructor,
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
    addInstructorToForm,
    removeInstructorFromForm,
    handleAsignarInstructores,
  } = props;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructores asignados a esta ficha</h2>
        <button type="button" onClick={() => setShowFormInstructores(true)} className="btn-primary">
          Asignar instructores
        </button>
      </div>
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
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                  {esPrincipal ? null : (
                    <button
                      type="button"
                      disabled={savingInstructorPrincipal}
                      onClick={() => void hacerPrincipalDesdeLista(inst.instructor_id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Hacer principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDesasignarInstructor(inst.instructor_id)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Desasignar
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {showFormInstructores && (
        <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
          <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Asignar instructores</h3>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="detalle-ins-principal-form"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Instructor principal
              </label>
              <div className="mt-1">
                <InstructorSelectAsync
                  inputId="detalle-ins-principal-form"
                  value={instructorPrincipalId || undefined}
                  onChange={(v) => setInstructorPrincipalId(v ?? 0)}
                  placeholder="Buscar por nombre o documento..."
                  isRequired
                  defaultLabel={
                    instructores.find((i) => i.instructor_id === instructorPrincipalId)?.instructor_nombre ??
                    instructoresDisponibles.find((i) => i.id === instructorPrincipalId)?.nombre
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="detalle-fecha-inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha inicio
              </label>
              <input
                id="detalle-fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-field mt-1 w-full"
              />
            </div>
            <div>
              <label htmlFor="detalle-fecha-fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha fin
              </label>
              <input
                id="detalle-fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input-field mt-1 w-full"
              />
            </div>
          </div>
          <fieldset className="mb-4 border-0 p-0">
            <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Instructores a asignar</legend>
            <div className="flex flex-wrap gap-2">
              {instructoresDisponibles.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => addInstructorToForm(i.id)}
                  disabled={instructoresSeleccionados.some((s) => s.instructor_id === i.id)}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  + {i.nombre}
                </button>
              ))}
            </div>
            {instructoresSeleccionados.length > 0 && (
              <ul className="mt-2 text-sm">
                {instructoresSeleccionados.map((s) => {
                  const nom = instructoresDisponibles.find((i) => i.id === s.instructor_id)?.nombre;
                  return (
                    <li key={s.instructor_id} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      {nom}
                      <button type="button" onClick={() => removeInstructorFromForm(s.instructor_id)} className="text-red-600 dark:text-red-400">
                        Quitar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowFormInstructores(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={handleAsignarInstructores} className="btn-primary">
              Guardar asignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type FichaDetalleAprendicesTabProps = Readonly<{
  aprendices: AprendizResponse[];
  showFormAprendices: boolean;
  setShowFormAprendices: Dispatch<SetStateAction<boolean>>;
  personasNoAprendices: PersonaResponse[];
  personasSeleccionadas: number[];
  onPersonaCheckboxChange: (personaId: number, checked: boolean) => void;
  handleAsignarAprendices: () => Promise<void>;
  handleDesasignarAprendices: (personasIds: number[]) => Promise<void>;
}>;

function FichaDetalleAprendicesTab(props: FichaDetalleAprendicesTabProps) {
  const {
    aprendices,
    showFormAprendices,
    setShowFormAprendices,
    personasNoAprendices,
    personasSeleccionadas,
    onPersonaCheckboxChange,
    handleAsignarAprendices,
    handleDesasignarAprendices,
  } = props;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aprendices asignados a esta ficha</h2>
        <button type="button" onClick={() => setShowFormAprendices(true)} className="btn-primary">
          Asignar aprendices
        </button>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {aprendices.filter((a) => a.estado).length === 0 ? (
          <li className="py-4 text-gray-500 dark:text-gray-400">Ningún aprendiz asignado.</li>
        ) : (
          aprendices
            .filter((a) => a.estado)
            .map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.persona_nombre}</span>
                <button
                  type="button"
                  onClick={() => handleDesasignarAprendices([a.persona_id])}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Desasignar
                </button>
              </li>
            ))
        )}
      </ul>

      {showFormAprendices && (
        <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
          <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Asignar aprendices (personas)</h3>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Seleccione personas que aún no están en esta ficha:</p>
          <div className="mb-4 max-h-48 overflow-y-auto rounded border border-gray-200 dark:border-gray-600 p-2">
            {personasNoAprendices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay personas disponibles para asignar.</p>
            ) : (
              personasNoAprendices.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={personasSeleccionadas.includes(p.id)}
                    onChange={(e) => onPersonaCheckboxChange(p.id, e.target.checked)}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {p.full_name} ({p.numero_documento})
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowFormAprendices(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={handleAsignarAprendices} className="btn-primary">
              Guardar asignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const FichaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const fichaId = id ? Number.parseInt(id, 10) : 0;

  const [ficha, setFicha] = useState<FichaCaracterizacionResponse | null>(null);
  const [diasFormacionCat, setDiasFormacionCat] = useState<DiaFormacionItem[]>([]);
  const [instructores, setInstructores] = useState<InstructorFichaResponse[]>([]);
  const [instructoresDisponibles, setInstructoresDisponibles] = useState<InstructorItem[]>([]);
  const [aprendices, setAprendices] = useState<AprendizResponse[]>([]);
  const [personas, setPersonas] = useState<PersonaResponse[]>([]);
  const [tab, setTab] = useState<Tab>('instructores');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFormInstructores, setShowFormInstructores] = useState(false);
  const [instructorPrincipalId, setInstructorPrincipalId] = useState<number>(0);
  const [instructoresSeleccionados, setInstructoresSeleccionados] = useState<InstructorFichaItem[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [showFormAprendices, setShowFormAprendices] = useState(false);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);

  const [editandoInstructorPrincipal, setEditandoInstructorPrincipal] = useState(false);
  const [instructorPrincipalDraft, setInstructorPrincipalDraft] = useState(0);
  const [savingInstructorPrincipal, setSavingInstructorPrincipal] = useState(false);
  const [msgInstructorPrincipal, setMsgInstructorPrincipal] = useState('');

  const diasLabel = useMemo(
    () => (ficha ? diasTexto(ficha, diasFormacionCat) : '—'),
    [ficha, diasFormacionCat]
  );

  const loadFicha = useCallback(async () => {
    if (!fichaId) return;
    try {
      setError('');
      const data = await apiService.getFichaCaracterizacionById(fichaId);
      setFicha(data);
      setInstructorPrincipalId(data.instructor_id ?? 0);
    } catch (err: unknown) {
      const msg = axiosErrorMessage(err, 'Error al cargar ficha');
      setError(msg);
      setFicha(null);
    }
  }, [fichaId]);

  const loadInstructores = useCallback(async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaInstructores(fichaId);
      setInstructores(data);
    } catch {
      setInstructores([]);
    }
  }, [fichaId]);

  const loadAprendices = useCallback(async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaAprendices(fichaId);
      setAprendices(data);
    } catch {
      setAprendices([]);
    }
  }, [fichaId]);

  const loadInstructoresDisponibles = useCallback(async () => {
    try {
      const res = await apiService.getInstructores(1, 10000);
      setInstructoresDisponibles(res.data);
    } catch {
      setInstructoresDisponibles([]);
    }
  }, []);

  const loadPersonas = useCallback(async () => {
    try {
      const res = await apiService.getPersonas(1, 500);
      setPersonas(res.data);
    } catch {
      setPersonas([]);
    }
  }, []);

  useEffect(() => {
    if (!fichaId || Number.isNaN(fichaId)) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await apiService.getCatalogosDiasFormacion();
        if (!cancelled) setDiasFormacionCat(d);
      } catch {
        if (!cancelled) setDiasFormacionCat([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fichaId]);

  useEffect(() => {
    if (!fichaId || Number.isNaN(fichaId)) {
      setLoading(false);
      setError('Identificador de ficha no válido.');
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([loadFicha(), loadInstructores(), loadAprendices(), loadInstructoresDisponibles(), loadPersonas()]).finally(
      () => setLoading(false)
    );
  }, [
    fichaId,
    loadFicha,
    loadInstructores,
    loadAprendices,
    loadInstructoresDisponibles,
    loadPersonas,
  ]);

  useEffect(() => {
    if (tab === 'instructores') void loadInstructores();
    else void loadAprendices();
  }, [tab, fichaId, loadInstructores, loadAprendices]);

  const abrirCambioInstructorPrincipal = () => {
    if (!ficha) return;
    setInstructorPrincipalDraft(ficha.instructor_id ?? 0);
    setMsgInstructorPrincipal('');
    setEditandoInstructorPrincipal(true);
  };

  const cancelarCambioInstructorPrincipal = () => {
    setEditandoInstructorPrincipal(false);
    setMsgInstructorPrincipal('');
  };

  const persistInstructorPrincipal = async (nuevoId: number, origin: 'resumen' | 'lista') => {
    if (!ficha || !fichaId || !nuevoId) return;
    if (nuevoId === ficha.instructor_id) return;
    const payload = buildFichaUpdatePayload(ficha, nuevoId);
    try {
      setSavingInstructorPrincipal(true);
      if (origin === 'resumen') setMsgInstructorPrincipal('');
      const actualizada = await apiService.updateFichaCaracterizacion(fichaId, payload);
      setFicha(actualizada);
      setInstructorPrincipalId(actualizada.instructor_id ?? 0);
      if (origin === 'resumen') setEditandoInstructorPrincipal(false);
      void loadInstructores();
    } catch (err: unknown) {
      const msg = axiosErrorMessage(err, 'No se pudo actualizar el instructor.');
      if (origin === 'resumen') setMsgInstructorPrincipal(msg);
      else alert(msg);
    } finally {
      setSavingInstructorPrincipal(false);
    }
  };

  const guardarInstructorPrincipal = async () => {
    if (!ficha || !fichaId) return;
    if (!instructorPrincipalDraft) {
      setMsgInstructorPrincipal('Seleccione un instructor líder.');
      return;
    }
    await persistInstructorPrincipal(instructorPrincipalDraft, 'resumen');
  };

  const hacerPrincipalDesdeLista = async (instructorId: number) => {
    if (!ficha || instructorId === ficha.instructor_id) return;
    if (
      !globalThis.confirm(
        '¿Establecer a este instructor como instructor principal de la ficha? El cambio quedará reflejado también en los datos de la ficha.'
      )
    ) {
      return;
    }
    await persistInstructorPrincipal(instructorId, 'lista');
  };

  const handleAsignarInstructores = async () => {
    if (instructoresSeleccionados.length === 0 || !instructorPrincipalId) {
      alert('Seleccione al menos un instructor y un instructor principal.');
      return;
    }
    const req: AsignarInstructoresRequest = {
      instructor_principal_id: instructorPrincipalId,
      instructores: instructoresSeleccionados.map((i) => ({
        instructor_id: i.instructor_id,
        fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        fecha_fin: fechaFin || new Date().toISOString().slice(0, 10),
      })),
    };
    try {
      await apiService.asignarInstructores(fichaId, req);
      setShowFormInstructores(false);
      setInstructoresSeleccionados([]);
      loadInstructores();
      loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al asignar instructores'));
    }
  };

  const addInstructorToForm = (instructorId: number) => {
    if (instructoresSeleccionados.some((i) => i.instructor_id === instructorId)) return;
    setInstructoresSeleccionados((prev) => [
      ...prev,
      {
        instructor_id: instructorId,
        fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        fecha_fin: fechaFin || new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const removeInstructorFromForm = (instructorId: number) => {
    setInstructoresSeleccionados((prev) => prev.filter((i) => i.instructor_id !== instructorId));
  };

  const handleDesasignarInstructor = async (instructorId: number) => {
    if (!confirm('¿Desasignar este instructor de la ficha?')) return;
    try {
      await apiService.desasignarInstructor(fichaId, instructorId);
      loadInstructores();
      loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al desasignar'));
    }
  };

  const handleAsignarAprendices = async () => {
    if (personasSeleccionadas.length === 0) {
      alert('Seleccione al menos una persona.');
      return;
    }
    try {
      await apiService.asignarAprendices(fichaId, personasSeleccionadas);
      setShowFormAprendices(false);
      setPersonasSeleccionadas([]);
      loadAprendices();
      loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al asignar aprendices'));
    }
  };

  const handleDesasignarAprendices = async (personasIds: number[]) => {
    if (personasIds.length === 0 || !confirm('¿Desasignar los aprendices seleccionados?')) return;
    try {
      await apiService.desasignarAprendices(fichaId, personasIds);
      loadAprendices();
      loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al desasignar'));
    }
  };

  const onPersonaCheckboxChange = useCallback((personaId: number, checked: boolean) => {
    if (checked) {
      setPersonasSeleccionadas((prev) => [...prev, personaId]);
    } else {
      setPersonasSeleccionadas((prev) => prev.filter((pid) => pid !== personaId));
    }
  }, []);

  const aprendicesIdsEnFicha = new Set(aprendices.map((a) => a.persona_id));
  const personasNoAprendices = personas.filter((p) => !aprendicesIdsEnFicha.has(p.id));

  if (!fichaId || Number.isNaN(fichaId)) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-6 text-red-800 dark:text-red-200">
        <p className="font-medium">Identificador inválido.</p>
        <Link to="/fichas" className="mt-2 inline-flex items-center gap-1 text-sm underline">
          <ArrowLeftIcon className="w-4 h-4" /> Volver a fichas
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600 dark:text-gray-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm">Cargando ficha…</p>
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-6 text-red-800 dark:text-red-200">
          <p className="font-medium">{error || 'No se pudo cargar la ficha.'}</p>
        </div>
        <Link
          to="/fichas"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Volver a fichas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/fichas"
            className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            title="Volver al listado"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ficha de caracterización</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha {ficha.ficha}</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{ficha.programa_formacion_nombre || '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/asistencia?ficha=${ficha.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Tomar asistencia
          </Link>
          <Link
            to={`/asistencia/historial/ficha/${ficha.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <ChartBarIcon className="h-5 w-5" />
            Historial
          </Link>
        </div>
      </div>

      {/* Resumen — solo lectura */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Datos de la ficha</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3">
            <BookOpenIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Programa</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.programa_formacion_nombre || '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-1">
            <AcademicCapIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Instructor principal
              </dt>
              {editandoInstructorPrincipal ? (
                <dd className="mt-2 space-y-3">
                  <div className="max-w-md">
                    <InstructorSelectAsync
                      inputId="detalle-ins-principal-resumen"
                      value={instructorPrincipalDraft || undefined}
                      onChange={(v) => setInstructorPrincipalDraft(v ?? 0)}
                      placeholder="Buscar instructor por nombre o documento..."
                      isRequired
                      defaultLabel={ficha.instructor_nombre}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={guardarInstructorPrincipal}
                      disabled={savingInstructorPrincipal}
                      className="btn-primary disabled:opacity-50"
                    >
                      {savingInstructorPrincipal ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarCambioInstructorPrincipal}
                      disabled={savingInstructorPrincipal}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                  {msgInstructorPrincipal ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{msgInstructorPrincipal}</p>
                  ) : null}
                </dd>
              ) : (
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{ficha.instructor_nombre || '—'}</span>
                  <button
                    type="button"
                    onClick={abrirCambioInstructorPrincipal}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Cambiar
                  </button>
                </dd>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <MapPinIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sede</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.sede_nombre ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <ComputerDesktopIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ambiente</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.ambiente_nombre ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <BuildingOffice2Icon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Modalidad</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.modalidad_formacion_nombre ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <SunIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jornada</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.jornada_nombre ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <CalendarDaysIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Fecha inicio — Fecha fin
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {formatFechaVista(ficha.fecha_inicio)} — {formatFechaVista(ficha.fecha_fin)}
              </dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
            <ClockIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Días de formación
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">{diasLabel}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <ClockIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total horas</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {ficha.total_horas === null || ficha.total_horas === undefined ? '—' : String(ficha.total_horas)}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <UserGroupIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aprendices</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.cantidad_aprendices}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 shrink-0" aria-hidden />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ficha.status
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                >
                  {ficha.status ? 'Activa' : 'Inactiva'}
                </span>
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex gap-6" aria-label="Secciones de la ficha">
          <button
            type="button"
            onClick={() => setTab('instructores')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'instructores'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Instructores
          </button>
          <button
            type="button"
            onClick={() => setTab('aprendices')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'aprendices'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Aprendices
          </button>
        </nav>
      </div>

      {tab === 'instructores' && (
        <FichaDetalleInstructoresTab
          ficha={ficha}
          instructores={instructores}
          savingInstructorPrincipal={savingInstructorPrincipal}
          hacerPrincipalDesdeLista={hacerPrincipalDesdeLista}
          handleDesasignarInstructor={handleDesasignarInstructor}
          showFormInstructores={showFormInstructores}
          setShowFormInstructores={setShowFormInstructores}
          instructorPrincipalId={instructorPrincipalId}
          setInstructorPrincipalId={setInstructorPrincipalId}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          instructoresDisponibles={instructoresDisponibles}
          instructoresSeleccionados={instructoresSeleccionados}
          addInstructorToForm={addInstructorToForm}
          removeInstructorFromForm={removeInstructorFromForm}
          handleAsignarInstructores={handleAsignarInstructores}
        />
      )}

      {tab === 'aprendices' && (
        <FichaDetalleAprendicesTab
          aprendices={aprendices}
          showFormAprendices={showFormAprendices}
          setShowFormAprendices={setShowFormAprendices}
          personasNoAprendices={personasNoAprendices}
          personasSeleccionadas={personasSeleccionadas}
          onPersonaCheckboxChange={onPersonaCheckboxChange}
          handleAsignarAprendices={handleAsignarAprendices}
          handleDesasignarAprendices={handleDesasignarAprendices}
        />
      )}
    </div>
  );
};
