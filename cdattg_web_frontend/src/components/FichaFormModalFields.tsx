import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { FichaFormSection } from './FichaFormSection';
import { FichaHorariosEditor } from './FichaHorariosEditor';
import { SelectSearch } from './SelectSearch';
import { LABEL_INSTRUCTOR_LIDER } from '../constants/instructorLiderLabels';
import { InstructorSelectAsync } from './InstructorSelectAsync';
import { toDisplayTitle } from '../utils/fichaListDisplay';
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
import type { Dispatch, ReactNode, SetStateAction } from 'react';

function FieldLabel({
  htmlFor,
  children,
  hint,
}: Readonly<{ htmlFor: string; children: ReactNode; hint?: string }>) {
  return (
    <div className="mb-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {children}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

type Props = Readonly<{
  pid: string;
  form: FichaCaracterizacionRequest;
  setForm: Dispatch<SetStateAction<FichaCaracterizacionRequest>>;
  editingRow: FichaCaracterizacionResponse | null;
  programas: ProgramaFormacionResponse[];
  sedes: SedeItem[];
  ambientes: AmbienteItem[];
  modalidades: ModalidadFormacionItem[];
  jornadas: JornadaItem[];
  diasFormacion: DiaFormacionItem[];
}>;

export function FichaFormModalFields({
  pid,
  form,
  setForm,
  editingRow,
  programas,
  sedes,
  ambientes,
  modalidades,
  jornadas,
  diasFormacion,
}: Props) {
  const isEditing = editingRow !== null;

  return (
    <div className="space-y-4">
      <FichaFormSection
        title="Identificación"
        description="Datos básicos de la ficha y vigencia del programa."
        icon={<DocumentTextIcon className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${pid}-ficha`}>Número de ficha *</FieldLabel>
            <input
              id={`${pid}-ficha`}
              type="text"
              placeholder="Ej: 3173292"
              value={form.ficha}
              onChange={(e) => setForm((f) => ({ ...f, ficha: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${pid}-programa`}>Programa de formación *</FieldLabel>
            <SelectSearch
              inputId={`${pid}-programa`}
              options={programas.map((p) => ({
                value: p.id,
                label: p.codigo ? `${p.codigo} — ${toDisplayTitle(p.nombre)}` : toDisplayTitle(p.nombre),
              }))}
              value={form.programa_formacion_id === 0 ? undefined : form.programa_formacion_id}
              onChange={(v) => setForm((f) => ({ ...f, programa_formacion_id: v ?? 0 }))}
              placeholder="Seleccione un programa…"
              isRequired
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${pid}-fecha-inicio`}>Fecha de inicio *</FieldLabel>
            <input
              id={`${pid}-fecha-inicio`}
              type="date"
              value={form.fecha_inicio ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || undefined }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${pid}-fecha-fin`}>Fecha de fin *</FieldLabel>
            <input
              id={`${pid}-fecha-fin`}
              type="date"
              value={form.fecha_fin ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value || undefined }))}
              className="input-field w-full"
              min={form.fecha_inicio ?? undefined}
            />
          </div>
        </div>
      </FichaFormSection>

      <FichaFormSection
        title="Ubicación y modalidad"
        description="Sede, ambiente y modalidad de formación."
        icon={<MapPinIcon className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${pid}-sede`}>Sede *</FieldLabel>
            <SelectSearch
              inputId={`${pid}-sede`}
              options={sedes.map((s) => ({ value: s.id, label: toDisplayTitle(s.nombre) }))}
              value={form.sede_id}
              onChange={(v) => setForm((f) => ({ ...f, sede_id: v }))}
              placeholder="Seleccione una sede…"
              isRequired
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${pid}-modalidad`}>Modalidad *</FieldLabel>
            <SelectSearch
              inputId={`${pid}-modalidad`}
              options={modalidades.map((m) => ({ value: m.id, label: toDisplayTitle(m.nombre) }))}
              value={form.modalidad_formacion_id}
              onChange={(v) => setForm((f) => ({ ...f, modalidad_formacion_id: v }))}
              placeholder="Seleccione modalidad…"
              isRequired
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor={`${pid}-ambiente`}>Ambiente *</FieldLabel>
            <SelectSearch
              inputId={`${pid}-ambiente`}
              options={ambientes.map((a) => ({ value: a.id, label: toDisplayTitle(a.nombre) }))}
              value={form.ambiente_id}
              onChange={(v) => setForm((f) => ({ ...f, ambiente_id: v }))}
              placeholder="Seleccione un ambiente…"
              isRequired
            />
          </div>
        </div>
      </FichaFormSection>

      <FichaFormSection
        title={LABEL_INSTRUCTOR_LIDER}
        description={isEditing ? 'Puede cambiar el instructor líder asignado a esta ficha.' : 'Obligatorio al crear la ficha.'}
        icon={<AcademicCapIcon className="h-5 w-5" />}
      >
        <InstructorSelectAsync
          inputId={`${pid}-instructor`}
          value={form.instructor_id ?? undefined}
          onChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
          placeholder="Buscar por nombre o documento…"
          isRequired
          defaultLabel={editingRow?.instructor_nombre}
        />
      </FichaFormSection>

      <FichaFormSection
        title="Programación horaria"
        description="Use plantillas de jornada o defina bloques personalizados."
        icon={<ClockIcon className="h-5 w-5" />}
      >
        <FichaHorariosEditor
          horarios={form.horarios ?? form.dias_formacion ?? []}
          onChange={(horarios) =>
            setForm((f) => ({
              ...f,
              horarios,
              dias_formacion: horarios,
              dias_formacion_ids: [...new Set(horarios.map((h) => h.dia_formacion_id).filter((id) => id > 0))],
            }))
          }
          jornadas={jornadas}
          diasFormacion={diasFormacion}
          inputIdPrefix={pid}
        />
      </FichaFormSection>

      <FichaFormSection
        title="Estado de la ficha"
        description="Las fichas inactivas no permiten tomar asistencia."
        icon={<CalendarDaysIcon className="h-5 w-5" />}
        className="!bg-white dark:!bg-gray-800"
      >
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Ficha activa</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {form.status ? 'Visible para instructores y toma de asistencia' : 'Oculta temporalmente del flujo operativo'}
            </p>
          </div>
          <button
            id={`${pid}-status`}
            type="button"
            role="switch"
            aria-checked={form.status ?? true}
            onClick={() => setForm((f) => ({ ...f, status: !(f.status ?? true) }))}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              form.status ?? true ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                form.status ?? true ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </FichaFormSection>
    </div>
  );
}
