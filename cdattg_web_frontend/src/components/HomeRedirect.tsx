import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForUser } from '../utils/roles';

/** Redirige usuarios autenticados a su home; si no hay sesión, al portal público. */
export const HomeRedirect = () => {
  const { roles, permissions, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getHomeRouteForUser(roles, permissions)} replace />;
};
