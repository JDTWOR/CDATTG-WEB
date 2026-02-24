export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/** URL del WebSocket del dashboard de asistencia (tiempo real). Pasar el token del usuario. */
export function getAsistenciaDashboardWsUrl(token: string): string {
  const base = API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  return `${base}/asistencias/dashboard/ws?token=${encodeURIComponent(token)}`;
}

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  personas: {
    list: '/personas',
    detail: (id: number) => `/personas/${id}`,
    create: '/personas',
    update: (id: number) => `/personas/${id}`,
    delete: (id: number) => `/personas/${id}`,
  },
};
