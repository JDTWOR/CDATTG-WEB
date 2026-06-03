import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type {
  AsignarInstructoresRequest,
  FichaCaracterizacionResponse,
  InstructorFichaItem,
  InstructorFichaResponse,
  InstructorItem,
  DiaFormacionItem,
} from '../../../types';
import { hoyISO, toggleDiaEnInstructores, vigenciaInstructorDefault } from '../fichaDetalleUtils';

type UseFichaInstructoresParams = Readonly<{
  fichaId: number;
  ficha: FichaCaracterizacionResponse | null;
  defaultDiasIds: number[];
  diasFichaDisponibles: DiaFormacionItem[];
  loadFicha: () => Promise<void>;
  reloadAgenda: () => Promise<void>;
}>;

export function useFichaInstructores({
  fichaId,
  ficha,
  defaultDiasIds,
  diasFichaDisponibles,
  loadFicha,
  reloadAgenda,
}: UseFichaInstructoresParams) {
  const [instructores, setInstructores] = useState<InstructorFichaResponse[]>([]);
  const [instructoresDisponibles, setInstructoresDisponibles] = useState<InstructorItem[]>([]);
  const [showFormInstructores, setShowFormInstructores] = useState(false);
  const [instructorPrincipalId, setInstructorPrincipalId] = useState(0);
  const [instructoresSeleccionados, setInstructoresSeleccionados] = useState<InstructorFichaItem[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [programandoInstructorId, setProgramandoInstructorId] = useState<number | null>(null);
  const [programacionDiasDraft, setProgramacionDiasDraft] = useState<number[]>([]);
  const [programacionFechaInicioDraft, setProgramacionFechaInicioDraft] = useState('');
  const [programacionFechaFinDraft, setProgramacionFechaFinDraft] = useState('');
  const [guardandoProgramacion, setGuardandoProgramacion] = useState(false);

  useEffect(() => {
    if (ficha?.instructor_id != null) {
      setInstructorPrincipalId(ficha.instructor_id);
    }
  }, [ficha?.instructor_id]);

  const loadInstructores = useCallback(async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaInstructores(fichaId);
      setInstructores(data);
    } catch {
      setInstructores([]);
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

  const handleAsignarInstructores = async () => {
    if (instructoresSeleccionados.length === 0 || !instructorPrincipalId) {
      alert('Seleccione al menos un instructor y un instructor principal.');
      return;
    }
    const req: AsignarInstructoresRequest = {
      instructor_principal_id: instructorPrincipalId,
      instructores: instructoresSeleccionados.map((i) => ({
        instructor_id: i.instructor_id,
        fecha_inicio: fechaInicio || hoyISO(),
        fecha_fin: fechaFin || hoyISO(),
        dias_formacion_ids: i.dias_formacion_ids?.length ? i.dias_formacion_ids : defaultDiasIds,
      })),
    };
    try {
      await apiService.asignarInstructores(fichaId, req);
      setShowFormInstructores(false);
      setInstructoresSeleccionados([]);
      await loadInstructores();
      await loadFicha();
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
        fecha_inicio: fechaInicio || hoyISO(),
        fecha_fin: fechaFin || hoyISO(),
        dias_formacion_ids: [...defaultDiasIds],
      },
    ]);
  };

  const toggleDiaInstructor = (instructorId: number, diaId: number) => {
    setInstructoresSeleccionados((prev) => toggleDiaEnInstructores(prev, instructorId, diaId));
  };

  const removeInstructorFromForm = (instructorId: number) => {
    setInstructoresSeleccionados((prev) => prev.filter((i) => i.instructor_id !== instructorId));
  };

  const onIniciarProgramacion = useCallback(
    (inst: InstructorFichaResponse) => {
      const vigencia = vigenciaInstructorDefault(inst, ficha);
      setProgramandoInstructorId(inst.instructor_id);
      setProgramacionFechaInicioDraft(vigencia.inicio);
      setProgramacionFechaFinDraft(vigencia.fin);
      setProgramacionDiasDraft(
        inst.dias_formacion_ids?.length ? [...inst.dias_formacion_ids] : [...defaultDiasIds],
      );
    },
    [defaultDiasIds, ficha],
  );

  const onCancelarProgramacion = useCallback(() => {
    setProgramandoInstructorId(null);
    setProgramacionDiasDraft([]);
    setProgramacionFechaInicioDraft('');
    setProgramacionFechaFinDraft('');
  }, []);

  const onToggleDiaProgramacion = useCallback((diaId: number) => {
    setProgramacionDiasDraft((prev) =>
      prev.includes(diaId) ? prev.filter((id) => id !== diaId) : [...prev, diaId],
    );
  }, []);

  const onGuardarProgramacionInstructor = async () => {
    if (!programandoInstructorId || !ficha?.instructor_id) {
      alert('No se pudo identificar el instructor o el instructor principal de la ficha.');
      return;
    }
    if (programacionDiasDraft.length === 0) {
      alert('Seleccione al menos un día de formación.');
      return;
    }
    if (
      !programacionFechaInicioDraft ||
      !programacionFechaFinDraft ||
      programacionFechaInicioDraft > programacionFechaFinDraft
    ) {
      alert('Revise las fechas de vigencia: la fecha fin debe ser igual o posterior a la de inicio.');
      return;
    }
    const inst = instructores.find((i) => i.instructor_id === programandoInstructorId);
    if (!inst) return;
    const req: AsignarInstructoresRequest = {
      instructor_principal_id: ficha.instructor_id,
      instructores: [
        {
          instructor_id: inst.instructor_id,
          fecha_inicio: programacionFechaInicioDraft,
          fecha_fin: programacionFechaFinDraft,
          dias_formacion_ids: programacionDiasDraft,
        },
      ],
    };
    setGuardandoProgramacion(true);
    try {
      await apiService.asignarInstructores(fichaId, req);
      onCancelarProgramacion();
      await loadInstructores();
      void reloadAgenda();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al guardar días de formación'));
    } finally {
      setGuardandoProgramacion(false);
    }
  };

  const handleDesasignarInstructor = async (instructorId: number) => {
    if (!confirm('¿Desasignar este instructor de la ficha?')) return;
    try {
      await apiService.desasignarInstructor(fichaId, instructorId);
      await loadInstructores();
      await loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al desasignar'));
    }
  };

  return {
    ficha,
    instructores,
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
    loadInstructores,
    loadInstructoresDisponibles,
  };
}

export type FichaInstructoresTabModel = ReturnType<typeof useFichaInstructores>;
