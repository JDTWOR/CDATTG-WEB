/**
 * @module pages/administracion/carruselFormState
 * @description Estado inicial de una diapositiva del carrusel.
 * @author Cristian Deysdayr Jiménez
 */
import type { PortalBannerItem } from '../../types/portal';

export const destacadosVacio: PortalBannerItem = {
  id: 0,
  titulo: '',
  descripcion: '',
  imagen_url: '',
  etiqueta: '',
  boton_texto: '',
  enlace_url: '',
  orden: 0,
  estado_publicacion: 'publicado',
};

/**
 * Cuerpo JSON para crear o actualizar una diapositiva.
 */
export function destacadosARequest(form: PortalBannerItem) {
  return {
    titulo: form.titulo,
    descripcion: form.descripcion,
    imagen_url: form.imagen_url,
    etiqueta: form.etiqueta,
    boton_texto: form.boton_texto,
    enlace_url: form.enlace_url,
    orden: form.orden,
    estado_publicacion: form.estado_publicacion,
  };
}
