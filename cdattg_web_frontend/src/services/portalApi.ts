/**
 * Aquí pido al servidor lo del portal: banners del inicio, semilleros públicos
 * y, con sesión, el CRUD de semilleros, banners y presentación.
 * Lo hice con dos clientes: uno sin token (público) y otro con token (admin).
 * portalMediaUrl arma la dirección de las fotos que sube el admin.
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  PortalBannerItem,
  PortalHomeResponse,
  PortalPresentacionItem,
  SemilleroItem,
} from '../types/portal';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../types';

const publicClient = axios.create({ baseURL: API_BASE_URL });

// Token + FormData (fotos): quito Content-Type para que el navegador ponga el boundary.
const authClient = axios.create({ baseURL: API_BASE_URL });
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export const portalApi = {
  // Lo que ve la gente sin entrar.
  home: async () => (await publicClient.get<PortalHomeResponse>('/public/portal')).data,
  semillerosPublicos: async () =>
    (await publicClient.get<{ data: SemilleroItem[] }>('/public/semilleros')).data.data,
  semilleroPublico: async (slug: string) =>
    (await publicClient.get<SemilleroItem>(`/public/semilleros/${slug}`)).data,
  // Listas del registro (país, documento, género…) sin sesión.
  catalogoPaises: async () =>
    (await publicClient.get<{ data: PaisItem[] }>('/public/catalogos/paises')).data.data,
  catalogoDepartamentos: async (paisId: number) =>
    (await publicClient.get<{ data: DepartamentoItem[] }>('/public/catalogos/departamentos', { params: { pais_id: paisId } })).data.data,
  catalogoMunicipios: async (departamentoId: number) =>
    (await publicClient.get<{ data: MunicipioItem[] }>('/public/catalogos/municipios', { params: { departamento_id: departamentoId } })).data.data,
  catalogoTiposDocumento: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/tipos-documento')).data.data,
  catalogoGeneros: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/generos')).data.data,
  catalogoCaracterizacion: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/persona-caracterizacion')).data.data,
  // Admin (sesión): semilleros, banners y presentación.
  listarSemillerosAdmin: async () =>
    (await authClient.get<{ data: SemilleroItem[] }>('/semilleros')).data.data,
  obtenerSemillero: async (id: number) => (await authClient.get<SemilleroItem>(`/semilleros/${id}`)).data,
  crearSemillero: async (body: Partial<SemilleroItem>) =>
    (await authClient.post<SemilleroItem>('/semilleros', body)).data,
  actualizarSemillero: async (id: number, body: Partial<SemilleroItem>) =>
    (await authClient.put<SemilleroItem>(`/semilleros/${id}`, body)).data,
  eliminarSemillero: async (id: number) => {
    await authClient.delete(`/semilleros/${id}`);
  },
  listarBanners: async () =>
    (await authClient.get<{ data: PortalBannerItem[] }>('/portal/banners')).data.data,
  crearBanner: async (body: Partial<PortalBannerItem>) =>
    (await authClient.post<PortalBannerItem>('/portal/banners', body)).data,
  actualizarBanner: async (id: number, body: Partial<PortalBannerItem>) =>
    (await authClient.put<PortalBannerItem>(`/portal/banners/${id}`, body)).data,
  eliminarBanner: async (id: number) => {
    await authClient.delete(`/portal/banners/${id}`);
  },
  obtenerPresentacion: async () =>
    (await authClient.get<PortalPresentacionItem>('/portal/presentacion')).data,
  guardarPresentacion: async (body: Partial<PortalPresentacionItem>) =>
    (await authClient.put<PortalPresentacionItem>('/portal/presentacion', body)).data,
  subirArchivo: async (file: File) => {
    const data = new FormData();
    data.append('archivo', file);
    return (await authClient.post<{ nombre: string; url: string }>('/portal/archivos', data)).data;
  },
};

/**
 * Arma la dirección de una foto o archivo del portal.
 * Si ya viene con http, la dejo. Si es un nombre de archivo, la pego al API.
 * @param path Lo que guardó el admin (url o nombre)
 * @returns Dirección que puede usar un <img>
 */
export function portalMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Quito /api del final para pegar una ruta que ya empieza con /api/...
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  if (path.startsWith('/')) return `${origin}${path}`;
  // Solo el nombre del archivo: lo busco en archivos públicos del portal.
  return `${origin}/api/public/portal/archivos/${path}`;
}
