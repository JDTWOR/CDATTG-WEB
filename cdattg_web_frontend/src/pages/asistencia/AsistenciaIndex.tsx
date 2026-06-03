import { Navigate, useSearchParams } from 'react-router-dom';
import { asistenciaFichaPath, parseAsistenciaFichaIdParam } from './asistenciaPaths';
import { AsistenciaFichasPage } from './AsistenciaFichasPage';

export function AsistenciaIndex() {
  const [searchParams] = useSearchParams();
  const fichaId = parseAsistenciaFichaIdParam(searchParams.get('ficha') ?? undefined);

  if (fichaId != null) {
    return <Navigate to={asistenciaFichaPath(fichaId)} replace />;
  }

  return <AsistenciaFichasPage />;
}
