/**
 * Aquí digo cómo se llama cada sección en el menú de admin (Revista, Boletines…).
 * Lo usa InvestigacionEditorialPage para el título y el “volver”.
 * kind es lo que entiende el API; titulo es lo que ve el admin.
 * @author Cristian Deysdayr Jiménez
 */
import type { EditorialKind } from '../../types/biogjgas';
import { semilleroAdminPaths } from '../../routes/paths';

// kind = clave del API; titulo = encabezado; path = ruta del menú admin.
export type EditorialMeta = { kind: EditorialKind; titulo: string; path: string };

// El orden de esta lista es el orden en que las muestro en admin.
export const EDITORIAL_ADMIN: EditorialMeta[] = [
  { kind: 'banners', titulo: 'Banners del portal', path: semilleroAdminPaths.banners },
  { kind: 'revistas', titulo: 'Revista Rupícola', path: semilleroAdminPaths.revista },
  { kind: 'boletines', titulo: 'Boletines', path: semilleroAdminPaths.boletines },
  { kind: 'podcasts', titulo: 'Podcast', path: semilleroAdminPaths.podcast },
  { kind: 'convocatorias', titulo: 'Convocatorias', path: semilleroAdminPaths.convocatorias },
  { kind: 'actividades', titulo: 'Actividades', path: semilleroAdminPaths.actividades },
];

/**
 * Busco título y ruta según el kind de la pantalla.
 * Si llega un kind que no está en la lista, es un error de programación.
 * @param kind Tipo de contenido (revistas, banners…)
 * @returns Metadatos de esa sección
 */
export function editorialMeta(kind: EditorialKind): EditorialMeta {
  const found = EDITORIAL_ADMIN.find((e) => e.kind === kind);
  if (!found) {
    throw new Error('submódulo desconocido');
  }
  return found;
}
