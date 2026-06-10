import { useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import {
  construirPayloadFicha,
  formStateFromFicha,
  labelBotonGuardarFicha,
  validarFormFicha,
} from '../utils/fichaCaracterizacionForm';
import { toDisplayTitle } from '../utils/fichaListDisplay';
import { FichaFormModalFields } from './FichaFormModalFields';
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
  horarios: [],
});

export type FichaFormModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  editing: FichaCaracterizacionResponse | null;
  onSaved: (saved: FichaCaracterizacionResponse) => void;
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
  const isEditing = editingRow !== null;
  const programaLabel = programas.find((p) => p.id === form.programa_formacion_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar ventana"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        aria-labelledby={`${pid}-title`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DocumentTextIcon className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
              <h2 id={`${pid}-title`} className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                {isEditing ? 'Editar ficha' : 'Nueva ficha'}
              </h2>
              {isEditing ? (
                <span className="rounded-md bg-primary-100 px-2 py-0.5 font-mono text-sm font-semibold text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                  {editingRow.ficha}
                </span>
              ) : null}
              {isEditing ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    form.status
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {form.status ? 'Activa' : 'Inactiva'}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isEditing
                ? toDisplayTitle(programaLabel?.nombre ?? editingRow.programa_formacion_nombre)
                : 'Complete los datos de caracterización y la programación horaria.'}
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadingForm ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando formulario…</p>
            </div>
          ) : (
            <>
              {formError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {formError}
                </div>
              ) : null}
              {catalogError ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                  {catalogError} Recargue la página o contacte al administrador si el problema continúa.
                </div>
              ) : null}
              <FichaFormModalFields
                pid={pid}
                form={form}
                setForm={setForm}
                editingRow={editingRow}
                programas={programas}
                sedes={sedes}
                ambientes={ambientes}
                modalidades={modalidades}
                jornadas={jornadas}
                diasFormacion={diasFormacion}
              />
            </>
          )}
        </div>

        {loadingForm ? null : (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/50 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto" disabled={saving}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              className="btn-primary w-full sm:w-auto"
              disabled={saving}
            >
              {labelBotonGuardarFicha(saving, editingRow)}
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
