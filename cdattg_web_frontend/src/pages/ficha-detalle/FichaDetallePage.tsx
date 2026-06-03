import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FichaFormModal } from '../../components/FichaFormModal';
import { useAuth } from '../../context/AuthContext';
import { canGestionarAprendicesFicha } from '../../utils/aprendizFichaPermissions';
import { canManageFichas } from '../../utils/fichaCaracterizacionForm';
import { canProgramarInstructores } from '../../utils/programacionPermissions';
import { FichaDetalleAprendicesTab } from './components/FichaDetalleAprendicesTab';
import { FichaDetalleHeader } from './components/FichaDetalleHeader';
import {
  FichaDetalleErrorState,
  FichaDetalleInvalidIdState,
  FichaDetalleLoadingState,
} from './components/FichaDetallePageStates';
import { FichaDetalleInstructoresTab } from './components/FichaDetalleInstructoresTab';
import { FichaDetalleResumen } from './components/FichaDetalleResumen';
import { FichaDetalleTabsNav } from './components/FichaDetalleTabsNav';
import { FichaDetalleProgramacionTab } from './FichaDetalleProgramacionTab';
import { useFichaAgenda, useInitialWeekStart } from './hooks/useFichaAgenda';
import { useFichaAprendices } from './hooks/useFichaAprendices';
import { useFichaDetalleData } from './hooks/useFichaDetalleData';
import { useFichaDetalleTab } from './hooks/useFichaDetalleTab';
import { useFichaInstructores } from './hooks/useFichaInstructores';

export function FichaDetallePage() {
  const { roles, hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const fichaId = id ? Number.parseInt(id, 10) : 0;

  const puedeEditarFicha = canManageFichas(roles);
  const puedeGestionarAprendices = canGestionarAprendicesFicha(hasPermission);
  const puedeProgramarInstructores = canProgramarInstructores(roles, hasPermission);
  const [tab, setTab] = useFichaDetalleTab(puedeProgramarInstructores);
  const [weekStart, setWeekStart] = useInitialWeekStart();
  const agenda = useFichaAgenda(fichaId, weekStart, puedeProgramarInstructores);
  const [showEditModal, setShowEditModal] = useState(false);

  const data = useFichaDetalleData(fichaId);
  const aprendicesModel = useFichaAprendices(fichaId, data.loadFicha);
  const instructoresModel = useFichaInstructores({
    fichaId,
    ficha: data.ficha,
    defaultDiasIds: data.defaultDiasIds,
    diasFichaDisponibles: data.diasFichaDisponibles,
    loadFicha: data.loadFicha,
    reloadAgenda: agenda.reload,
  });

  const {
    ficha,
    setFicha,
    loading,
    setLoading,
    error,
    isValidFichaId,
    diasLabel,
    loadFicha,
  } = data;
  const { loadInstructores, loadInstructoresDisponibles, setInstructorPrincipalId } = instructoresModel;
  const { loadAprendices, loadPersonas } = aprendicesModel;

  useEffect(() => {
    if (!isValidFichaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      loadFicha(),
      loadInstructores(),
      loadAprendices(),
      loadInstructoresDisponibles(),
      loadPersonas(),
    ]).finally(() => setLoading(false));
  }, [
    fichaId,
    isValidFichaId,
    loadFicha,
    loadInstructores,
    loadAprendices,
    loadInstructoresDisponibles,
    loadPersonas,
    setLoading,
  ]);

  useEffect(() => {
    if (!isValidFichaId) return;
    if (tab === 'instructores') void loadInstructores();
    else void loadAprendices();
  }, [tab, fichaId, isValidFichaId, loadInstructores, loadAprendices]);

  if (!isValidFichaId) {
    return <FichaDetalleInvalidIdState />;
  }

  if (loading) {
    return <FichaDetalleLoadingState />;
  }

  if (error || !ficha) {
    return <FichaDetalleErrorState message={error || 'No se pudo cargar la ficha.'} />;
  }

  return (
    <div className="space-y-6">
      <FichaDetalleHeader
        ficha={ficha}
        puedeEditarFicha={puedeEditarFicha}
        onEditarFicha={() => setShowEditModal(true)}
      />

      <FichaDetalleResumen ficha={ficha} diasLabel={diasLabel} puedeEditarFicha={puedeEditarFicha} />

      <FichaDetalleTabsNav tab={tab} setTab={setTab} puedeProgramarInstructores={puedeProgramarInstructores} />

      {tab === 'instructores' && (
        <FichaDetalleInstructoresTab
          {...instructoresModel}
          puedeEditarFicha={puedeEditarFicha}
          puedeProgramarInstructores={puedeProgramarInstructores}
          onEditarFicha={() => setShowEditModal(true)}
        />
      )}

      {tab === 'programacion' && puedeProgramarInstructores && (
        <FichaDetalleProgramacionTab
          events={agenda.data?.eventos ?? []}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          loading={agenda.loading}
          error={agenda.error}
        />
      )}

      {tab === 'aprendices' && (
        <FichaDetalleAprendicesTab {...aprendicesModel} puedeGestionarAprendices={puedeGestionarAprendices} />
      )}

      {puedeEditarFicha && (
        <FichaFormModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          editing={ficha}
          inputIdPrefix="ficha-detalle"
          onSaved={(saved) => {
            setFicha(saved);
            setInstructorPrincipalId(saved.instructor_id ?? 0);
            void loadInstructores();
            void loadAprendices();
          }}
        />
      )}
    </div>
  );
}
