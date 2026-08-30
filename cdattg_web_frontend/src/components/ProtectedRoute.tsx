/**
 * Este archivo decide a dónde mandar a quien no ha iniciado sesión.
 * Lo cambié para que el visitante caiga al portal (/) y no al login.
 * Lo usa el router de las pantallas del sistema.
 * @author Cristian Deysdayr Jiménez
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERFIL_PATH, portalPaths } from '../routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Si el perfil está incompleto, solo dejo ir a /perfil o /login.
const PERFIL_INCOMPLETO_ALLOW = new Set([PERFIL_PATH, '/login']);

/**
 * Entrada del sitio para quien no ha iniciado sesión: el portal, no el login.
 * Lo cambié porque el visitante debía ver SENA Regional Guaviare primero.
 * @returns La ruta de inicio público (/)
 */
export function rutaPublicaDeEntrada(): string {
  return portalPaths.index;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    // Todavía no sé si hay sesión: muestro el giro y no redirijo.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Sin sesión → portal público (antes iba a /login).
    return <Navigate to={rutaPublicaDeEntrada()} replace />;
  }

  const perfilIncompleto = user?.perfil_completo === false;
  const rutaPermitida = PERFIL_INCOMPLETO_ALLOW.has(location.pathname);
  if (perfilIncompleto && !rutaPermitida) {
    // Lo mando a completar el perfil; guardo de dónde venía.
    return <Navigate to={PERFIL_PATH} replace state={{ from: location.pathname, perfilForzado: true }} />;
  }

  return <>{children}</>;
};
