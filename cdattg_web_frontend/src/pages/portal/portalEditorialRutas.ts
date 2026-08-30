/**
 * Aquí digo cómo se llama cada sección editorial en el portal y a qué detalle va.
 * Lo hice porque revista, boletines, podcast, convocatorias y actividades
 * se pintan igual, pero cada una tiene su propia URL.
 * Lo usan PortalEditorialListaPage y PortalEditorialDetallePage. No incluye banners.
 * @author Cristian Deysdayr Jiménez
 */
import type { EditorialKind } from '../../types/biogjgas';
import { portalPaths } from '../../routes/paths';

// kind = nombre que entiende el API; titulo = lo que ve la gente; detalle = URL de una ficha.
export type EditorialPublico = {
  kind: EditorialKind;
  titulo: string;
  detalle: (id: string) => string;
};

// La clave (revista, boletines…) es lo que viene en la URL del portal.
export const EDITORIAL_PUBLICO: Record<string, EditorialPublico> = {
  // kind 'revistas' es el del backend; la URL pública es /investigacion/revista/...
  revista: { kind: 'revistas', titulo: 'Revista Rupícola', detalle: (id) => portalPaths.revistaDetalle(id) },
  boletines: { kind: 'boletines', titulo: 'Boletines', detalle: (id) => portalPaths.boletin(id) },
  podcast: { kind: 'podcasts', titulo: 'Podcast', detalle: (id) => portalPaths.podcastDetalle(id) },
  convocatorias: { kind: 'convocatorias', titulo: 'Convocatorias', detalle: (id) => portalPaths.convocatoria(id) },
  actividades: { kind: 'actividades', titulo: 'Actividades', detalle: (id) => portalPaths.actividad(id) },
};
