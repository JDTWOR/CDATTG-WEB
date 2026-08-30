/**
 * Aquí están las formas de revista, boletines, podcast, convocatorias, actividades y banners.
 * Lo usa investigacionApi y las pantallas de admin y del portal.
 * @author Cristian Deysdayr Jiménez
 */
import type { PortalEstado } from './portal';

export type EditorialKind = 'revistas' | 'boletines' | 'podcasts' | 'convocatorias' | 'actividades' | 'banners';

export interface BiogjgasItem {
  id: number;
  titulo: string;
  slug?: string;
  subtitulo?: string;
  volumen?: string;
  numero?: string;
  anio?: number;
  issn?: string;
  editorial?: string;
  articulos?: string;
  resumen?: string;
  descripcion?: string;
  requisitos?: string;
  tematica?: string;
  tipo?: string;
  portada_url?: string;
  imagen_url?: string;
  pdf_url?: string;
  audio_url?: string;
  documento_url?: string;
  enlace_url?: string;
  enlace_externo?: string;
  duracion?: string;
  invitados?: string;
  lugar?: string;
  modalidad?: string;
  estado_convocatoria?: string;
  estado_actividad?: string;
  semillero_id?: number | null;
  fecha?: string | null;
  fecha_publicacion?: string | null;
  fecha_apertura?: string | null;
  fecha_cierre?: string | null;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  orden: number;
  estado_publicacion: PortalEstado;
}
