import { Navigate, useSearchParams } from 'react-router-dom';
import { AsistenciaDashboard } from '../AsistenciaDashboard';
import { asistenciaFichaPath, parseAsistenciaFichaIdParam } from './asistenciaPaths';
import { asistenciaPaths } from '../../routes/paths';
import { useAuth } from '../../context/AuthContext';
import { canViewCasosBienestar } from '../bienestar/casos/casosBienestarPermissions';

/** Index del módulo asistencia: dashboard global o redirección a fichas del instructor. */
export function AsistenciaModuleIndex() {
  const [searchParams] = useSearchParams();
  const { roles, hasPermission } = useAuth();
  const fichaId = parseAsistenciaFichaIdParam(searchParams.get('ficha') ?? undefined);

  if (fichaId != null) {
    return <Navigate to={asistenciaFichaPath(fichaId)} replace />;
  }

  if (canViewCasosBienestar(roles)) {
    return <AsistenciaDashboard />;
  }

  if (hasPermission('VER ASISTENCIA')) {
    return <Navigate to={asistenciaPaths.fichas} replace />;
  }

  return (
    <p className="text-red-600 dark:text-red-400">
      No tiene permiso para acceder al módulo de asistencia.
    </p>
  );
}
