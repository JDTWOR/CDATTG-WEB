import { Navigate, useParams } from 'react-router-dom';
import { asistenciaPaths, bienestarPaths } from './paths';

export function RedirectAsistenciaFichaLegacy() {
  const { fichaId } = useParams<{ fichaId: string }>();
  if (!fichaId) return <Navigate to={asistenciaPaths.index} replace />;
  return <Navigate to={asistenciaPaths.sesion(fichaId)} replace />;
}

export function RedirectAsistenciaHistorialFichaLegacy() {
  const { fichaId } = useParams<{ fichaId: string }>();
  if (!fichaId) return <Navigate to={asistenciaPaths.historial.index} replace />;
  return <Navigate to={asistenciaPaths.historial.ficha(fichaId)} replace />;
}

export function RedirectCasosBienestarLegacy() {
  return <Navigate to={bienestarPaths.casos.index} replace />;
}

export function RedirectCasosBienestarFichaLegacy() {
  const { fichaNumero } = useParams<{ fichaNumero: string }>();
  const search = globalThis.window?.location.search ?? '';
  if (!fichaNumero) return <Navigate to={bienestarPaths.casos.index} replace />;
  return (
    <Navigate
      to={`${bienestarPaths.casos.ficha(fichaNumero)}${search}`}
      replace
    />
  );
}

export function RedirectBienestarIndex() {
  return <Navigate to={bienestarPaths.casos.index} replace />;
}
