import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumbOverride } from '../../navigation/breadcrumb';
import { FichaFormModal } from '../../components/FichaFormModal';
import { useAuth } from '../../context/AuthContext';
import { fichasPaths } from '../../routes/paths';
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
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search } = location;
  const { fichaNumero: fichaNumeroParam } = useParams<{ fichaNumero: string }>();
  const { setLabel, clearLabel } = useBreadcrumbOverride();

  const puedeEditarFicha = canManageFichas(roles);
  const puedeGestionarAprendices = canGestionarAprendicesFicha(roles, hasPermission);
  const puedeProgramarInstructores = canProgramarInstructores(roles, hasPermission);
  const [tab, setTab] = useFichaDetalleTab(puedeProgramarInstructores);
  const [weekStart, setWeekStart] = useInitialWeekStart();
  const [showEditModal, setShowEditModal] = useState(false);

  const data = useFichaDetalleData(fichaNumeroParam);
  const fichaId = data.ficha?.id ?? 0;
  const agenda = useFichaAgenda(fichaId, weekStart, puedeProgramarInstructores);
  const aprendicesModel = useFichaAprendices(fichaId, data.loadFicha);
  const instructoresModel = useFichaInstructores({
    fichaId,
    ficha: data.ficha,
    diasFichaDisponibles: data.diasFichaDisponibles,
    loadFicha: data.loadFicha,
    reloadAgenda: agenda.reload,
  });

  const { ficha, setFicha, loading, setLoading, error, isValidFichaNumero, legacyIdRedirect, diasLabel, loadFicha } =
    data;
  const { loadInstructores, setInstructorLiderId } = instructoresModel;
  const { loadAprendices, loadPersonas } = aprendicesModel;

  useFichaDetallePage({
    fichaId,
    isValidFichaId: isValidFichaNumero,
    tab,
    setLoading,
    loadFicha,
    loadInstructores,
    loadAprendices,
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

  // Canonical: número de ficha en la URL (redirige enlaces viejos con ID interno).
  useEffect(() => {
    if (!ficha?.ficha) return;
    const canonical = fichasPaths.detalle(ficha.ficha, ficha.tipo_formacion);
    if (pathname !== canonical || legacyIdRedirect != null) {
      navigate({ pathname: canonical, search }, { replace: true });
    }
  }, [ficha?.ficha, ficha?.tipo_formacion, legacyIdRedirect, pathname, search, navigate]);

  if (!isValidFichaNumero) {
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
        <FichaDetalleAprendicesTab
          {...aprendicesModel}
          ficha={ficha}
          puedeGestionarAprendices={puedeGestionarAprendices}
        />
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
            void agenda.reload();
          }}
        />
      )}
    </div>
  );
}
