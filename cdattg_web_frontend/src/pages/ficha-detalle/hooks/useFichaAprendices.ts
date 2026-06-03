import { useCallback, useMemo, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { AprendizResponse, PersonaResponse } from '../../../types';

export function useFichaAprendices(fichaId: number, loadFicha: () => Promise<void>) {
  const [aprendices, setAprendices] = useState<AprendizResponse[]>([]);
  const [personas, setPersonas] = useState<PersonaResponse[]>([]);
  const [showFormAprendices, setShowFormAprendices] = useState(false);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);

  const loadAprendices = useCallback(async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaAprendices(fichaId);
      setAprendices(data);
    } catch {
      setAprendices([]);
    }
  }, [fichaId]);

  const loadPersonas = useCallback(async () => {
    try {
      const res = await apiService.getPersonas(1, 500);
      setPersonas(res.data);
    } catch {
      setPersonas([]);
    }
  }, []);

  const handleAsignarAprendices = async () => {
    if (personasSeleccionadas.length === 0) {
      alert('Seleccione al menos una persona.');
      return;
    }
    try {
      await apiService.asignarAprendices(fichaId, personasSeleccionadas);
      setShowFormAprendices(false);
      setPersonasSeleccionadas([]);
      await loadAprendices();
      await loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al asignar aprendices'));
    }
  };

  const handleDesasignarAprendices = async (personasIds: number[]) => {
    if (personasIds.length === 0 || !confirm('¿Desasignar los aprendices seleccionados?')) return;
    try {
      await apiService.desasignarAprendices(fichaId, personasIds);
      await loadAprendices();
      await loadFicha();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al desasignar'));
    }
  };

  const handleOcultarEnAsistencia = async (personaId: number, oculto: boolean) => {
    const msg = oculto
      ? '¿Ocultar este aprendiz de la toma de asistencia del día? Seguirá en la ficha y contará inasistencias si no asiste.'
      : '¿Mostrar de nuevo este aprendiz en la toma de asistencia?';
    if (!confirm(msg)) return;
    try {
      await apiService.setOcultoAprendicesAsistencia(fichaId, [personaId], oculto);
      await loadAprendices();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al actualizar visibilidad en asistencia'));
    }
  };

  const onPersonaCheckboxChange = useCallback((personaId: number, checked: boolean) => {
    if (checked) {
      setPersonasSeleccionadas((prev) => [...prev, personaId]);
    } else {
      setPersonasSeleccionadas((prev) => prev.filter((pid) => pid !== personaId));
    }
  }, []);

  const personasNoAprendices = useMemo(() => {
    const aprendicesIdsEnFicha = new Set(aprendices.map((a) => a.persona_id));
    return personas.filter((p) => !aprendicesIdsEnFicha.has(p.id));
  }, [aprendices, personas]);

  return {
    aprendices,
    showFormAprendices,
    setShowFormAprendices,
    personasNoAprendices,
    personasSeleccionadas,
    onPersonaCheckboxChange,
    handleAsignarAprendices,
    handleDesasignarAprendices,
    handleOcultarEnAsistencia,
    loadAprendices,
    loadPersonas,
  };
}

export type FichaAprendicesTabModel = ReturnType<typeof useFichaAprendices>;
