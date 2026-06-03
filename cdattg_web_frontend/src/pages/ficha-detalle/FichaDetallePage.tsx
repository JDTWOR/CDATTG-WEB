import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useBreadcrumbOverride } from '../../navigation/breadcrumb';
import { FichaFormModal } from '../../components/FichaFormModal';
import { useAuth } from '../../context/AuthContext';
import { canGestionarAprendicesFicha } from '../../utils/aprendizFichaPermissions';
import { canManageFichas } from '../../utils/fichaCaracterizacionForm';
import { canProgramarInstructores } from '../../utils/programacionPermissions';
import { FichaDetalleAprendicesTab } from './components/aprendices/FichaDetalleAprendicesTab';
import { FichaDetalleHeader } from './components/FichaDetalleHeader';
import {
  FichaDetalleErrorState,
  FichaDetalleInvalidIdState,
  FichaDetalleLoadingState,
} from './components/FichaDetallePageStates';
import { FichaDetalleInstructoresTab } from './components/FichaDetalleInstructoresTab';
import { FichaDetalleResumen } from './components/FichaDetalleResumen';
import { FichaDetalleTabsNav } from './components/FichaDetalleTabsNav';
import { FichaDetalleProgramacionTab } from './components/programacion/FichaDetalleProgramacionTab';
import { useFichaAgenda, useInitialWeekStart } from './hooks/useFichaAgenda';
import { useFichaAprendices } from './hooks/useFichaAprendices';
import { useFichaDetalleData } from './hooks/useFichaDetalleData';
import { useFichaDetallePage } from './hooks/useFichaDetallePage';
import { useFichaDetalleTab } from './hooks/useFichaDetalleTab';
import { useFichaInstructores } from './hooks/useFichaInstructores';

export function FichaDetallePage() {
  const { roles, hasPermission } = useAuth();
  const { pathname } = useLocation();
  const { fichaId: fichaIdParam } = useParams<{ fichaId: string }>();
  const fichaId = fichaIdParam ? Number.parseInt(fichaIdParam, 10) : 0;
  const { setLabel, clearLabel } = useBreadcrumbOverride();

  const puedeEditarFicha = canManageFichas(roles);
  const puedeGestionarAprendices = canGestionarAprendicesFicha(roles, hasPermission);
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

  const { ficha, setFicha, loading, setLoading, error, isValidFichaId, diasLabel, loadFicha } = data;
  const { loadInstructores, loadInstructoresDisponibles, setInstructorLiderId } = instructoresModel;
  const { loadAprendices, loadPersonas } = aprendicesModel;

  useFichaDetallePage({
    fichaId,
    isValidFichaId,
    tab,
    setLoading,
    loadFicha,
    loadInstructores,
    loadAprendices,
    loadInstructoresDisponibles,
    loadPersonas,
  });

  useEffect(() => {
    if (!ficha?.ficha) {
      clearLabel(pathname);
      return;
    }
    setLabel(pathname, `Ficha ${ficha.ficha}`);
    return () => clearLabel(pathname);
  }, [ficha?.ficha, pathname, setLabel, clearLabel]);

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
            setInstructorLiderId(saved.instructor_id ?? 0);
            void loadInstructores();
            void loadAprendices();
          }}
        />
      )}
    </div>
  );
}
