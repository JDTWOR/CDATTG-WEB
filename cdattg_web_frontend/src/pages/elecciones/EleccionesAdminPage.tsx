import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ArrowPathIcon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { EleccionProceso, EleccionProcesoRequest } from '../../types/eleccion';
import { administracionPaths } from '../../routes/paths';
import {
  anioActualColombia,
  fromDatetimeLocalColombia,
  toDatetimeLocalColombia,
} from '../../utils/formatFecha';

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripción',
  votacion: 'Votación',
  empate_pendiente: 'Empate pendiente',
  cerrada: 'Cerrada',
};

const FECHA_SECCIONES = [
  {
    titulo: 'Período de inscripción',
    descripcion: 'Ventana en la que los aprendices pueden registrar su plancha.',
    campos: [
      { key: 'fecha_inscripcion_inicio' as const, label: 'Inicio' },
      { key: 'fecha_inscripcion_fin' as const, label: 'Fin' },
    ],
  },
  {
    titulo: 'Período de votación',
    descripcion: 'Ventana en la que los aprendices pueden emitir su voto.',
    campos: [
      { key: 'fecha_votacion_inicio' as const, label: 'Inicio' },
      { key: 'fecha_votacion_fin' as const, label: 'Fin' },
    ],
  },
] as const;

function buildCreatePayload(form: EleccionProcesoRequest): EleccionProcesoRequest {
  return {
    ...form,
    fecha_inscripcion_inicio: fromDatetimeLocalColombia(String(form.fecha_inscripcion_inicio ?? '')),
    fecha_inscripcion_fin: fromDatetimeLocalColombia(String(form.fecha_inscripcion_fin ?? '')),
    fecha_votacion_inicio: fromDatetimeLocalColombia(String(form.fecha_votacion_inicio ?? '')),
    fecha_votacion_fin: fromDatetimeLocalColombia(String(form.fecha_votacion_fin ?? '')),
  };
}

function existeCicloElectoral(procesos: EleccionProceso[], regionalId: number, anio: number): boolean {
  return procesos.some((p) => p.regional_id === regionalId && p.anio === anio);
}

function primeraRegionalSinCiclo(
  procesos: EleccionProceso[],
  regionales: { id: number; nombre: string }[],
  anio: number,
): number | null {
  const libre = regionales.find((r) => !existeCicloElectoral(procesos, r.id, anio));
  return libre?.id ?? null;
}

function puedeCrearCicloEnAnio(
  procesos: EleccionProceso[],
  regionales: { id: number; nombre: string }[],
  anio: number,
): boolean {
  return primeraRegionalSinCiclo(procesos, regionales, anio) !== null;
}

type FechaFieldKey = (typeof FECHA_SECCIONES)[number]['campos'][number]['key'];

type FechaSeccionesFieldsProps = Readonly<{
  form: EleccionProcesoRequest;
  onDateChange: (key: FechaFieldKey, value: string) => void;
}>;

function FechaSeccionesFields({ form, onDateChange }: FechaSeccionesFieldsProps) {
  return (
    <>
      {FECHA_SECCIONES.map((seccion) => (
        <section key={seccion.titulo}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{seccion.titulo}</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{seccion.descripcion}</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {seccion.campos.map(({ key, label }) => (
              <div key={key}>
                <label htmlFor={`eleccion-${key}`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <input
                  id={`eleccion-${key}`}
                  type="datetime-local"
                  className="input-field"
                  value={toDatetimeLocalColombia(String(form[key] ?? ''))}
                  onChange={(e) => onDateChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

type NuevoCicloEleccionModalProps = Readonly<{
  form: EleccionProcesoRequest;
  regionales: { id: number; nombre: string }[];
  procesos: EleccionProceso[];
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (form: EleccionProcesoRequest) => void;
}>;

function NuevoCicloEleccionModal({
  form,
  regionales,
  procesos,
  saving,
  onClose,
  onSubmit,
  onFormChange,
}: NuevoCicloEleccionModalProps) {
  const setField = <K extends keyof EleccionProcesoRequest>(key: K, value: EleccionProcesoRequest[K]) => {
    onFormChange({ ...form, [key]: value });
  };
  const cicloDuplicado = existeCicloElectoral(procesos, form.regional_id, form.anio);
  const regionalNombre = regionales.find((r) => r.id === form.regional_id)?.nombre ?? String(form.regional_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar formulario de nuevo ciclo electoral"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        aria-labelledby="eleccion-nuevo-ciclo-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarDaysIcon className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
              <h2 id="eleccion-nuevo-ciclo-title" className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                Nuevo ciclo electoral
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure la regional, los plazos y los requisitos de matrícula.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {cicloDuplicado ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              Ya existe un ciclo electoral para <strong>{regionalNombre}</strong> en el año <strong>{form.anio}</strong>.
              Solo se permite un ciclo por regional y año.
            </div>
          ) : null}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Datos generales</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="eleccion-regional" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Regional
                </label>
                <select
                  id="eleccion-regional"
                  className="input-field"
                  value={form.regional_id}
                  onChange={(e) => setField('regional_id', Number(e.target.value))}
                >
                  {regionales.map((r) => {
                    const ocupada = existeCicloElectoral(procesos, r.id, form.anio);
                    return (
                      <option key={r.id} value={r.id} disabled={ocupada}>
                        {r.nombre}
                        {ocupada ? ' (ciclo existente)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="eleccion-anio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Año
                </label>
                <input
                  id="eleccion-anio"
                  type="number"
                  className="input-field"
                  value={form.anio}
                  onChange={(e) => setField('anio', Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="eleccion-nombre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del ciclo
                </label>
                <input
                  id="eleccion-nombre"
                  className="input-field"
                  value={form.nombre_ciclo}
                  onChange={(e) => setField('nombre_ciclo', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="eleccion-min-dias" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Días mínimos matriculado
                </label>
                <input
                  id="eleccion-min-dias"
                  type="number"
                  min={0}
                  className="input-field"
                  value={form.min_dias_matricula ?? 30}
                  onChange={(e) => setField('min_dias_matricula', Number(e.target.value))}
                />
              </div>
            </div>
          </section>

          <FechaSeccionesFields form={form} onDateChange={(key, value) => setField(key, value)} />
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/50 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={saving || cicloDuplicado} onClick={onSubmit}>
            {saving ? 'Guardando…' : 'Crear ciclo'}
          </button>
        </div>
      </dialog>
    </div>
  );
}

type ProcesosTableBodyProps = Readonly<{
  loading: boolean;
  items: EleccionProceso[];
}>;

function ProcesosTableBody({ loading, items }: ProcesosTableBodyProps) {
  if (loading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
          Cargando…
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
          No hay procesos electorales.
        </td>
      </tr>
    );
  }
  return (
    <>
      {items.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-3">
            <div className="font-medium text-gray-900 dark:text-white">{p.nombre_ciclo}</div>
            <div className="text-xs text-gray-500">{p.anio}</div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{p.regional_nombre ?? p.regional_id}</td>
          <td className="px-4 py-3">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
              {ESTADO_LABEL[p.estado] ?? p.estado}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <Link to={administracionPaths.eleccionDetalle(p.id)} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              Gestionar
            </Link>
          </td>
        </tr>
      ))}
    </>
  );
}

export function EleccionesAdminPage() {
  const [items, setItems] = useState<EleccionProceso[]>([]);
  const [regionales, setRegionales] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EleccionProcesoRequest>({
    regional_id: 0,
    anio: anioActualColombia(),
    nombre_ciclo: `Elecciones ${anioActualColombia()}`,
    min_dias_matricula: 30,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [procesos, reg] = await Promise.all([
        apiService.getEleccionProcesos(),
        apiService.getCatalogosRegionales(),
      ]);
      setItems(procesos);
      setRegionales(reg);
      if (reg.length > 0 && form.regional_id === 0) {
        setForm((f) => ({ ...f, regional_id: reg[0].id }));
      }
    } catch (e) {
      setError(axiosErrorMessage(e, 'Error al cargar los procesos electorales.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const anioActual = anioActualColombia();
  const puedeCrearCiclo = puedeCrearCicloEnAnio(items, regionales, anioActual);

  const handleOpenModal = () => {
    setError('');
    const regionalId = primeraRegionalSinCiclo(items, regionales, anioActual);
    if (regionalId === null) {
      setError(`Ya existe un ciclo electoral para cada regional en el año ${anioActual}.`);
      return;
    }
    setForm((f) => ({
      ...f,
      regional_id: regionalId,
      anio: anioActual,
      nombre_ciclo: `Elecciones ${anioActual}`,
    }));
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (existeCicloElectoral(items, form.regional_id, form.anio)) {
      setError('Ya existe un ciclo electoral para esta regional en el mismo año.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: EleccionProcesoRequest = buildCreatePayload(form);
      await apiService.createEleccionProceso(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(axiosErrorMessage(e, 'Error al crear el ciclo electoral.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elecciones de aprendices</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Procesos electorales por regional (titular y suplente).
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="btn-secondary inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={!puedeCrearCiclo || loading}
            title={
              puedeCrearCiclo
                ? undefined
                : `Todas las regionales ya tienen un ciclo en ${anioActual}.`
            }
            className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo ciclo
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Ciclo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Regional</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            <ProcesosTableBody loading={loading} items={items} />
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <NuevoCicloEleccionModal
          form={form}
          regionales={regionales}
          procesos={items}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={() => void handleCreate()}
          onFormChange={(next) => {
            if (existeCicloElectoral(items, next.regional_id, next.anio)) {
              const regionalLibre = primeraRegionalSinCiclo(items, regionales, next.anio);
              setForm(regionalLibre === null ? next : { ...next, regional_id: regionalLibre });
              return;
            }
            setForm(next);
          }}
        />
      ) : null}
    </div>
  );
}
