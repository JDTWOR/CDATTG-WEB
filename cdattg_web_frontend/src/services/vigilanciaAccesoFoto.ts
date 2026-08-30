/**
 * Armo el enlace de la foto que ve portería.
 * Lo puse aparte para no seguir creciendo api.ts.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { API_BASE_URL } from '../config/api';

/**
 * Ruta de la foto de acceso por cédula.
 * @param documento número de documento
 * @returns url de la API
 */
export function urlFotoAcceso(documento: string): string {
  return `${API_BASE_URL}/vigilancia/acceso/foto?documento=${encodeURIComponent(documento)}`;
}
