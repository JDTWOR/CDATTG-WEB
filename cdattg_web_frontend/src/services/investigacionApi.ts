/**
 * Aquí pido al servidor lo de investigación BIOGIGAS.
 * publicClient: lo que ve la gente sin entrar. authClient: lo que edita el admin (lleva el token).
 * Lo usan las páginas de /investigacion y las de /semilleros (revista, boletines, etc.).
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { InvestigacionHomeResponse, PortalPresentacionItem } from '../types/portal';
import type { BiogjgasItem, EditorialKind } from '../types/biogjgas';

// Sin token: portal público.
const publicClient = axios.create({ baseURL: API_BASE_URL });
// Con token: pantallas de admin.
const authClient = axios.create({ baseURL: API_BASE_URL });
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const investigacionApi = {
  // Home de /investigacion (banners + semilleros).
  home: async () => (await publicClient.get<InvestigacionHomeResponse>('/public/investigacion')).data,
  presentacion: async () =>
    (await publicClient.get<PortalPresentacionItem>('/public/investigacion/presentacion')).data,
  listarPublico: async (kind: EditorialKind) =>
    (await publicClient.get<{ data: BiogjgasItem[] }>(`/public/investigacion/${kind}`)).data.data,
  detallePublico: async (kind: EditorialKind, id: string) =>
    (await publicClient.get<BiogjgasItem>(`/public/investigacion/${kind}/${id}`)).data,
  // A partir de aquí el admin (sesión).
  listarAdmin: async (kind: EditorialKind) =>
    (await authClient.get<{ data: BiogjgasItem[] }>(`/investigacion/${kind}`)).data.data,
  obtenerAdmin: async (kind: EditorialKind, id: number) =>
    (await authClient.get<BiogjgasItem>(`/investigacion/${kind}/${id}`)).data,
  crear: async (kind: EditorialKind, body: Partial<BiogjgasItem>) =>
    (await authClient.post<BiogjgasItem>(`/investigacion/${kind}`, body)).data,
  actualizar: async (kind: EditorialKind, id: number, body: Partial<BiogjgasItem>) =>
    (await authClient.put<BiogjgasItem>(`/investigacion/${kind}/${id}`, body)).data,
  eliminar: async (kind: EditorialKind, id: number) => {
    await authClient.delete(`/investigacion/${kind}/${id}`);
  },
};
