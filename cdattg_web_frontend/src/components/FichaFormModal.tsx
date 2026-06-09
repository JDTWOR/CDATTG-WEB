import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import {
  construirPayloadFicha,
  formStateFromFicha,
  labelBotonGuardarFicha,
  normalizeDiaIds,
  validarFormFicha,
} from '../utils/fichaCaracterizacionForm';
import { SelectSearch } from './SelectSearch';
import { LABEL_INSTRUCTOR_LIDER } from '../constants/instructorLiderLabels';
import { InstructorSelectAsync } from './InstructorSelectAsync';
import type {
  AmbienteItem,
  DiaFormacionItem,
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
  JornadaItem,
  ModalidadFormacionItem,
  ProgramaFormacionResponse,
  SedeItem,
} from '../types';

const emptyForm = (programaId = 0): FichaCaracterizacionRequest => ({
  programa_formacion_id: programaId,
  ficha: '',
  instructor_id: undefined,
  fecha_inicio: undefined,
  fecha_fin: undefined,
  sede_id: undefined,
  modalidad_formacion_id: undefined,
  ambiente_id: undefined,
  jornada_id: undefined,
  total_horas: undefined,
  status: true,
  dias_formacion_ids: [],
});

export type FichaFormModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  /** null = crear nueva ficha */
  editing: FichaCaracterizacionResponse | null;
  onSaved: (saved: FichaCaracterizacionResponse) => void;
  /** Prefijo para ids de inputs (accesibilidad) */
  inputIdPrefix?: string;
}>;

export function FichaFormModal({
  open,
  onClose,
  editing,
  onSaved,
  inputIdPrefix = 'ficha-form',
}: FichaFormModalProps) {
  const [form, setForm] = useState<FichaCaracterizacionRequest>(emptyForm());
  const [editingRow, setEditingRow] = useState<FichaCaracterizacionResponse | null>(null);
  const [programas, setProgramas] = useState<ProgramaFormacionResponse[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteItem[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadFormacionItem[]>([]);
  const [jornadas, setJornadas] = useState<JornadaItem[]>([]);
  const [diasFormacion, setDiasFormacion] = useState<DiaFormacionItem[]>([]);
  const [formError, setFormError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  const loadCatalogos = useCallback(async () => {
    try {
      setCatalogError('');
      const [progRes, s, a, m, j, d] = await Promise.all([
        apiService.getProgramasFormacion(1, 200),
        apiService.getCatalogosSedes(),
        apiService.getCatalogosAmbientes(),
        apiService.getCatalogosModalidadesFormacion(),
        apiService.getCatalogosJornadas(),
        apiService.getCatalogosDiasFormacion(),
      ]);
      setProgramas(progRes.data);
      setSedes(s);
      setAmbientes(a);
      setModalidades(m);
      setJornadas(j);
      setDiasFormacion(d);
      return progRes.data;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudieron cargar los catálogos (sedes, días de formación, etc.).';
      setCatalogError(msg);
      return [] as ProgramaFormacionResponse[];
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setFormError('');
      setLoadingForm(true);
      const progs = await loadCatalogos();
      if (cancelled) return;

      if (editing) {
        try {
          const fresh = await apiService.getFichaCaracterizacionById(editing.id);
          if (cancelled) return;
          setEditingRow(fresh);
          setForm(formStateFromFicha(fresh));
        } catch {
          if (cancelled) return;
          setEditingRow(editing);
          setForm(formStateFromFicha(editing));
        }
      } else {
        setEditingRow(null);
        setForm(emptyForm(progs[0]?.id ?? 0));
      }
      if (!cancelled) setLoadingForm(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, editing, loadCatalogos]);

  const setDiaChecked = (diaId: number, checked: boolean) => {
    const idNum = Number(diaId);
    setForm((f) => {
      const cur = normalizeDiaIds(f.dias_formacion_ids);
      if (checked) {
        if (cur.includes(idNum)) return f;
        return { ...f, dias_formacion_ids: [...cur, idNum] };
      }
      return { ...f, dias_formacion_ids: cur.filter((x) => x !== idNum) };
    });
  };

  const handleSave = async () => {
    const err = validarFormFicha(form, editingRow);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    const payload = construirPayloadFicha(form, editingRow, programas);
    try {
      setSaving(true);
      const saved = editingRow
        ? await apiService.updateFichaCaracterizacion(editingRow.id, payload)
        : await apiService.createFichaCaracterizacion(payload);
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setFormError(axiosErrorMessage(e, 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const pid = inputIdPrefix;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Cerrar ventana"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
        aria-labelledby={`${pid}-title`}
      >
        <h2 id={`${pid}-title`} className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {editingRow ? 'Editar ficha' : 'Crear ficha'}
        </h2>

        {loadingForm ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando formulario…</p>
        ) : (
          <>
            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}
            {catalogError && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 px-4 py-3 rounded-lg text-sm">
                {catalogError} Recargue la página o contacte al administrador si el problema continúa.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${pid}-ficha`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Ficha *
                </label>
                <input
                  id={`${pid}-ficha`}
                  type="text"
                  placeholder="Ej: 123456"
                  value={form.ficha}
                  onChange={(e) => setForm((f) => ({ ...f, ficha: e.target.value }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label htmlFor={`${pid}-programa`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Programa de Formación *
                </label>
                <div className="mt-1">
                  <SelectSearch
                    inputId={`${pid}-programa`}
                    options={programas.map((p) => ({ value: p.id, label: `${p.codigo} - ${p.nombre}` }))}
                    value={form.programa_formacion_id === 0 ? undefined : form.programa_formacion_id}
                    onChange={(v) => setForm((f) => ({ ...f, programa_formacion_id: v ?? 0 }))}
                    placeholder="Seleccione un programa..."
                    isRequired
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${pid}-fecha-inicio`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de Inicio *
                </label>
                <input
                  id={`${pid}-fecha-inicio`}
                  type="date"
                  value={form.fecha_inicio ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || undefined }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label htmlFor={`${pid}-fecha-fin`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de Fin *
                </label>
                <input
                  id={`${pid}-fecha-fin`}
                  type="date"
                  value={form.fecha_fin ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value || undefined }))}
                  className="input-field mt-1 w-full"
                />
              </div>

              <div>
                <label htmlFor={`${pid}-sede`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sede *
                </label>
                <div className="mt-1">
                  <SelectSearch
                    inputId={`${pid}-sede`}
                    options={sedes.map((s) => ({ value: s.id, label: s.nombre }))}
                    value={form.sede_id}
                    onChange={(v) => setForm((f) => ({ ...f, sede_id: v }))}
                    placeholder="Seleccione una sede..."
                    isRequired
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`${pid}-instructor`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {LABEL_INSTRUCTOR_LIDER} *
                </label>
                <div className="mt-1">
                  <InstructorSelectAsync
                    inputId={`${pid}-instructor`}
                    value={form.instructor_id ?? undefined}
                    onChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
                    placeholder="Buscar por nombre o documento..."
                    isRequired
                    defaultLabel={editingRow?.instructor_nombre}
                  />
                </div>
                {!editingRow && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    La asignación del instructor líder se realiza en el momento de crear la ficha.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${pid}-modalidad`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modalidad de Formación *
                </label>
                <div className="mt-1">
                  <SelectSearch
                    inputId={`${pid}-modalidad`}
                    options={modalidades.map((m) => ({ value: m.id, label: m.nombre }))}
                    value={form.modalidad_formacion_id}
                    onChange={(v) => setForm((f) => ({ ...f, modalidad_formacion_id: v }))}
                    placeholder="Seleccione una modalidad..."
                    isRequired
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`${pid}-jornada`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jornada de Formación *
                </label>
                <div className="mt-1">
                  <SelectSearch
                    inputId={`${pid}-jornada`}
                    options={jornadas.map((j) => ({ value: j.id, label: j.nombre }))}
                    value={form.jornada_id}
                    onChange={(v) => {
                      const jornada = jornadas.find((j) => j.id === v);
                      setForm((f) => ({
                        ...f,
                        jornada_id: v,
                        hora_inicio: jornada?.hora_inicio?.slice(0, 5) ?? f.hora_inicio,
                        hora_fin: jornada?.hora_fin?.slice(0, 5) ?? f.hora_fin,
                      }));
                    }}
                    placeholder="Seleccione una jornada..."
                    isRequired
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`${pid}-ambiente`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ambiente *
                </label>
                <div className="mt-1">
                  <SelectSearch
                    inputId={`${pid}-ambiente`}
                    options={ambientes.map((a) => ({ value: a.id, label: a.nombre }))}
                    value={form.ambiente_id}
                    onChange={(v) => setForm((f) => ({ ...f, ambiente_id: v }))}
                    placeholder="Seleccione un ambiente..."
                    isRequired
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${pid}-hora-inicio`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hora inicio formación
                </label>
                <input
                  id={`${pid}-hora-inicio`}
                  type="time"
                  value={form.hora_inicio ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={`${pid}-hora-fin`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hora fin formación
                </label>
                <input
                  id={`${pid}-hora-fin`}
                  type="time"
                  value={form.hora_fin ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Horario aplicado a todos los días marcados. Ej.: 06:30–13:00 para jornada mañana con inicio a las 6:30.
            </p>

            <fieldset className="mt-4 border-0 p-0">
              <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días de Formación *
              </legend>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Marque los días en que hay formación y pulse Guardar.
              </p>
              <div className="flex flex-wrap gap-4">
                {diasFormacion.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={normalizeDiaIds(form.dias_formacion_ids).includes(
                        Number(d.id)
                      )}
                      onChange={(e) => setDiaChecked(Number(d.id), e.currentTarget.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{d.nombre}</span>
                  </label>
                ))}
                {diasFormacion.length === 0 && (
                  <span className="text-sm text-gray-500">No hay días cargados o cargando...</span>
                )}
              </div>
            </fieldset>

            <div className="mt-4 flex items-center gap-2">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ficha Activa *</span>
              <button
                id={`${pid}-status`}
                type="button"
                role="switch"
                aria-checked={form.status ?? true}
                onClick={() => setForm((f) => ({ ...f, status: !(f.status ?? true) }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  form.status ?? true ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    form.status ?? true ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">{form.status ?? true ? 'Sí' : 'No'}</span>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleSave()} className="btn-primary" disabled={saving}>
                {labelBotonGuardarFicha(saving, editingRow)}
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
