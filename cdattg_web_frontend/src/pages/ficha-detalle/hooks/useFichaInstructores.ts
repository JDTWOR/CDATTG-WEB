import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import {
  MSG_ERROR_IDENTIFICAR_INSTRUCTOR_LIDER,
  MSG_SELECCIONE_INSTRUCTOR_LIDER_PRIMERO,
} from '../../../constants/instructorLiderLabels';
import type {
  AsignarInstructoresRequest,
  FichaCaracterizacionResponse,
  InstructorFichaItem,
  InstructorFichaResponse,
  DiaFormacionItem,
  TrasladarDiaInstructorRequest,
} from '../../../types';
import {
  crearTrasladoParFechaDraft,
  type TrasladoModo,
} from '../components/FichaDetalleTrasladoDiaModal';
import { hoyISO, toggleDiaEnInstructores, vigenciaInstructorDefault } from '../fichaDetalleUtils';

type UseFichaInstructoresParams = Readonly<{
  fichaId: number;
  ficha: FichaCaracterizacionResponse | null;
  diasFichaDisponibles: DiaFormacionItem[];
  loadFicha: () => Promise<void>;
  reloadAgenda: () => Promise<void>;
}>;

export function useFichaInstructores({
  fichaId,
  ficha,
  diasFichaDisponibles,
  loadFicha,
  reloadAgenda,
}: UseFichaInstructoresParams) {
  const [instructores, setInstructores] = useState<InstructorFichaResponse[]>([]);
  const [showFormInstructores, setShowFormInstructores] = useState(false);
  const [instructorLiderId, setInstructorLiderId] = useState(0);
  const [instructoresSeleccionados, setInstructoresSeleccionados] = useState<InstructorFichaItem[]>([]);
  const [nombresInstructoresSeleccionados, setNombresInstructoresSeleccionados] = useState<Record<number, string>>({});
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [programandoInstructorId, setProgramandoInstructorId] = useState<number | null>(null);
  const [programacionDiasDraft, setProgramacionDiasDraft] = useState<number[]>([]);
  const [programacionFechaInicioDraft, setProgramacionFechaInicioDraft] = useState('');
  const [programacionFechaFinDraft, setProgramacionFechaFinDraft] = useState('');
  const [guardandoProgramacion, setGuardandoProgramacion] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [trasladoOrigenInstructorId, setTrasladoOrigenInstructorId] = useState(0);
  const [trasladoOrigenDiaId, setTrasladoOrigenDiaId] = useState(0);
  const [trasladoDestinoInstructorId, setTrasladoDestinoInstructorId] = useState(0);
  const [trasladoDestinoDiaId, setTrasladoDestinoDiaId] = useState(0);
  const [trasladoMotivo, setTrasladoMotivo] = useState('');
  const [trasladoModo, setTrasladoModo] = useState<TrasladoModo>('fechas');
  const [trasladoParesFechas, setTrasladoParesFechas] = useState([crearTrasladoParFechaDraft()]);
  const [guardandoTraslado, setGuardandoTraslado] = useState(false);

  useEffect(() => {
    if (ficha?.instructor_id != null) {
      setInstructorLiderId(ficha.instructor_id);
    }
  }, [ficha?.instructor_id]);

  useEffect(() => {
    if (!showFormInstructores) return;
    const vigencia = vigenciaInstructorDefault({}, ficha);
    setFechaInicio(vigencia.inicio);
    setFechaFin(vigencia.fin);
    setInstructoresSeleccionados([]);
    setNombresInstructoresSeleccionados({});
    if (ficha?.instructor_id) {
      setInstructorLiderId(ficha.instructor_id);
    }
  }, [showFormInstructores, ficha]);

  const loadInstructores = useCallback(async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaInstructores(fichaId);
      setInstructores(data);
    } catch {
      setInstructores([]);
    }
  }, [fichaId]);

  const handleAsignarInstructores = async () => {
    if (instructoresSeleccionados.length === 0) {
      alert('Agregue al menos un instructor a la lista.');
      return;
    }
    let liderId = instructorLiderId;
    if (!liderId && instructoresSeleccionados.length === 1) {
      liderId = instructoresSeleccionados[0].instructor_id;
    }
    if (!liderId) {
      alert(MSG_SELECCIONE_INSTRUCTOR_LIDER_PRIMERO);
      return;
    }
    const req: AsignarInstructoresRequest = {
      instructor_lider_id: liderId,
      instructores: instructoresSeleccionados.map((i) => ({
        instructor_id: i.instructor_id,
        fecha_inicio: fechaInicio || hoyISO(),
        fecha_fin: fechaFin || hoyISO(),
        dias_formacion_ids: i.dias_formacion_ids ?? [],
      })),
    };
    try {
      await apiService.asignarInstructores(fichaId, req);
      setShowFormInstructores(false);
      setInstructoresSeleccionados([]);
      setNombresInstructoresSeleccionados({});
      await loadInstructores();
      await loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al asignar instructores'));
    }
  };

  const addInstructorToForm = (instructorId: number, nombre: string) => {
    if (instructores.some((i) => i.instructor_id === instructorId)) return;
    if (instructoresSeleccionados.some((i) => i.instructor_id === instructorId)) return;
    setNombresInstructoresSeleccionados((prev) => ({ ...prev, [instructorId]: nombre }));
    setInstructoresSeleccionados((prev) => [
      ...prev,
      {
        instructor_id: instructorId,
        fecha_inicio: fechaInicio || hoyISO(),
        fecha_fin: fechaFin || hoyISO(),
        dias_formacion_ids: [],
      },
    ]);
    if (!instructorLiderId && instructores.length === 0 && instructoresSeleccionados.length === 0) {
      setInstructorLiderId(instructorId);
    }
  };

  const toggleDiaInstructor = (instructorId: number, diaId: number) => {
    setInstructoresSeleccionados((prev) => toggleDiaEnInstructores(prev, instructorId, diaId));
  };

  const removeInstructorFromForm = (instructorId: number) => {
    setInstructoresSeleccionados((prev) => prev.filter((i) => i.instructor_id !== instructorId));
    setNombresInstructoresSeleccionados((prev) => {
      const next = { ...prev };
      delete next[instructorId];
      return next;
    });
    if (instructorLiderId === instructorId) {
      setInstructorLiderId(ficha?.instructor_id ?? 0);
    }
  };

  const onIniciarProgramacion = useCallback(
    (inst: InstructorFichaResponse) => {
      const vigencia = vigenciaInstructorDefault(inst, ficha);
      setProgramandoInstructorId(inst.instructor_id);
      setProgramacionFechaInicioDraft(vigencia.inicio);
      setProgramacionFechaFinDraft(vigencia.fin);
      setProgramacionDiasDraft(
        inst.dias_formacion_ids?.length ? [...inst.dias_formacion_ids] : [],
      );
    },
    [ficha],
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
      alert(MSG_ERROR_IDENTIFICAR_INSTRUCTOR_LIDER);
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
      instructor_lider_id: ficha.instructor_id,
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

  const abrirTraslado = () => {
    setShowTrasladoModal(true);
  };

  const cerrarTraslado = () => {
    if (guardandoTraslado) return;
    setShowTrasladoModal(false);
    setTrasladoOrigenInstructorId(0);
    setTrasladoOrigenDiaId(0);
    setTrasladoDestinoInstructorId(0);
    setTrasladoDestinoDiaId(0);
    setTrasladoMotivo('');
    setTrasladoModo('fechas');
    setTrasladoParesFechas([crearTrasladoParFechaDraft()]);
  };

  const guardarTraslado = async () => {
    if (!trasladoOrigenInstructorId || !trasladoDestinoInstructorId) {
      alert('Seleccione instructor origen e instructor destino.');
      return;
    }
    if (!trasladoOrigenDiaId || !trasladoDestinoDiaId) {
      alert('Seleccione día origen y día destino.');
      return;
    }
    if (
      trasladoOrigenInstructorId === trasladoDestinoInstructorId &&
      trasladoOrigenDiaId === trasladoDestinoDiaId
    ) {
      alert('El traslado no puede mantener instructor y día iguales.');
      return;
    }
    if (!trasladoMotivo.trim()) {
      alert('Debe registrar un motivo para el traslado.');
      return;
    }
    if (trasladoModo === 'fechas') {
      const paresValidos = trasladoParesFechas.filter(
        (par) => par.fecha_origen.trim() && par.fecha_destino.trim(),
      );
      if (paresValidos.length === 0) {
        alert('Indique al menos un par de fechas origen y destino.');
        return;
      }
    }
    const payload: TrasladarDiaInstructorRequest = {
      modo: trasladoModo,
      instructor_origen_id: trasladoOrigenInstructorId,
      dia_origen_id: trasladoOrigenDiaId,
      instructor_destino_id: trasladoDestinoInstructorId,
      dia_destino_id: trasladoDestinoDiaId,
      motivo: trasladoMotivo.trim(),
      pares_fechas:
        trasladoModo === 'fechas'
          ? trasladoParesFechas
              .filter((par) => par.fecha_origen.trim() && par.fecha_destino.trim())
              .map(({ fecha_origen, fecha_destino }) => ({ fecha_origen, fecha_destino }))
          : undefined,
    };
    setGuardandoTraslado(true);
    try {
      await apiService.trasladarDiaInstructor(fichaId, payload);
      await loadInstructores();
      await loadFicha();
      void reloadAgenda();
      cerrarTraslado();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al trasladar día de formación'));
    } finally {
      setGuardandoTraslado(false);
    }
  };

  return {
    ficha,
    instructores,
    showFormInstructores,
    setShowFormInstructores,
    instructorLiderId,
    setInstructorLiderId,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    instructoresSeleccionados,
    nombresInstructoresSeleccionados,
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
    showTrasladoModal,
    abrirTraslado,
    cerrarTraslado,
    trasladoOrigenInstructorId,
    setTrasladoOrigenInstructorId,
    trasladoOrigenDiaId,
    setTrasladoOrigenDiaId,
    trasladoDestinoInstructorId,
    setTrasladoDestinoInstructorId,
    trasladoDestinoDiaId,
    setTrasladoDestinoDiaId,
    trasladoMotivo,
    setTrasladoMotivo,
    trasladoModo,
    setTrasladoModo,
    trasladoParesFechas,
    setTrasladoParesFechas,
    guardarTraslado,
    guardandoTraslado,
    handleDesasignarInstructor,
    loadInstructores,
  };
}

export type FichaInstructoresTabModel = ReturnType<typeof useFichaInstructores>;
