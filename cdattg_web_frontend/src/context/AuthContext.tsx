import { createContext, useContext, useState, useEffect } from 'react';
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

  const hasPermission = (permission: string) =>
    permissions.includes('*') || permissions.includes(permission);

  const logout = () => {
    setToken(null);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  };

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
      // #region agent log
      fetch('http://127.0.0.1:7880/ingest/64fbceb3-b0b0-4487-afc9-1084e1fd5a3f', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c9d35e' }, body: JSON.stringify({ sessionId: 'c9d35e', location: 'AuthContext.tsx:useEffect', message: 'restore from localStorage', data: { roles: parsedRoles, permissions: parsedPermissions, permissionsLength: parsedPermissions.length }, hypothesisId: 'H2', timestamp: Date.now() }) }).catch(() => {});
      // #endregion
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

  const login = async (credentials: LoginRequest) => {
    const response = await apiService.login(credentials);
    setToken(response.token);
    setUser(response.user);
    setRoles(response.roles ?? []);
    setPermissions(response.permissions ?? []);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem(ROLES_KEY, JSON.stringify(response.roles ?? []));
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions ?? []));
    // #region agent log
    fetch('http://127.0.0.1:7880/ingest/64fbceb3-b0b0-4487-afc9-1084e1fd5a3f', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c9d35e' }, body: JSON.stringify({ sessionId: 'c9d35e', location: 'AuthContext.tsx:login', message: 'login response roles and permissions', data: { roles: response.roles ?? [], permissions: response.permissions ?? [], permissionsLength: (response.permissions ?? []).length }, hypothesisId: 'H2-H5', timestamp: Date.now() }) }).catch(() => {});
    // #endregion
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        permissions,
        hasPermission,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
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
