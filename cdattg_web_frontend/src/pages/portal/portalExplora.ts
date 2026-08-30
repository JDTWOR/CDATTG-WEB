/**
 * Esta lista es el bloque “Explora el área de investigación” del home BIOGIGAS.
 * Lo hice para no escribir a mano los mismos enlaces en la página.
 * Lo usa PortalInvestigacionPage. Las rutas salen de portalPaths.
 * @author Cristian Deysdayr Jiménez
 */
import { portalPaths } from '../../routes/paths';

// to = a dónde va el clic; label = el texto que ve la gente.
export const EXPLORA_INVESTIGACION = [
  { to: portalPaths.presentacion, label: 'Presentación' },
  { to: portalPaths.revista, label: 'Revista Rupícola' },
  { to: portalPaths.boletines, label: 'Boletines' },
  { to: portalPaths.podcast, label: 'Podcast' },
  { to: portalPaths.convocatorias, label: 'Convocatorias' },
  { to: portalPaths.actividades, label: 'Actividades' },
] as const;
