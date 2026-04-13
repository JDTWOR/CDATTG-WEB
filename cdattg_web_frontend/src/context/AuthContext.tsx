import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserResponse, LoginRequest } from '../types';
import { apiService } from '../services/api';

const ROLES_KEY = 'user_roles';
const PERMISSIONS_KEY = 'user_permissions';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes('*') || permissions.includes(permission),
    [permissions],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  }, []);

  // Cerrar sesión cuando el interceptor de API recibe 401 (sin recargar la página).
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };
    globalThis.addEventListener('auth:session-expired', handleSessionExpired);
    return () => globalThis.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRoles = localStorage.getItem(ROLES_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      const parsedRoles = storedRoles ? JSON.parse(storedRoles) : [];
      if (storedRoles) setRoles(parsedRoles);
      const storedPermissions = localStorage.getItem(PERMISSIONS_KEY);
      const parsedPermissions = storedPermissions ? JSON.parse(storedPermissions) : [];
      if (storedPermissions) setPermissions(parsedPermissions);
      apiService.getCurrentUser()
        .then((currentUser) => {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await apiService.login(credentials);
    setToken(response.token);
    setUser(response.user);
    setRoles(response.roles ?? []);
    setPermissions(response.permissions ?? []);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem(ROLES_KEY, JSON.stringify(response.roles ?? []));
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions ?? []));
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      roles,
      permissions,
      hasPermission,
      login,
      logout,
      isAuthenticated: !!token,
      loading,
    }),
    [user, token, roles, permissions, hasPermission, login, logout, loading],
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
