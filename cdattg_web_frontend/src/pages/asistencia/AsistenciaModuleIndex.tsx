import { Navigate, useSearchParams } from 'react-router-dom';
import { AsistenciaDashboard } from '../AsistenciaDashboard';
import { asistenciaFichaPath, parseAsistenciaFichaIdParam } from './asistenciaPaths';

/** Index del módulo asistencia: dashboard con compatibilidad ?ficha= → sesión. */
export function AsistenciaModuleIndex() {
  const [searchParams] = useSearchParams();
  const fichaId = parseAsistenciaFichaIdParam(searchParams.get('ficha') ?? undefined);

  if (fichaId != null) {
    return <Navigate to={asistenciaFichaPath(fichaId)} replace />;
  }

  return <AsistenciaDashboard />;
}
