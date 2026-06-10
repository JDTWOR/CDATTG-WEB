import { Navigate } from 'react-router-dom';
import { asistenciaPaths } from '../../routes/paths';

export function AsistenciaDashboardRedirect() {
  return <Navigate to={asistenciaPaths.index} replace />;
}
