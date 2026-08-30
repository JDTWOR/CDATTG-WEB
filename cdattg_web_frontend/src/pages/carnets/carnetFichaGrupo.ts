/**
 * Agrupo las fichas del aprendiz por tipo de formación.
 * Lo hice para que regular, media técnica y complementaria se vean juntas.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetFichaOpcion } from '../../types/carnet';

const ORDEN_TIPO = ['FORMACION_REGULAR', 'MEDIA_TECNICA', 'FORMACION_COMPLEMENTARIA'];

export type CarnetFichaGrupo = {
  tipo: string;
  label: string;
  fichas: CarnetFichaOpcion[];
};

/**
 * Ordeno y agrupo las fichas vigentes por tipo.
 * @param fichas fichas que trajo el carnet
 * @returns grupos listos para el select
 */
export function agruparFichasPorTipo(fichas: CarnetFichaOpcion[]): CarnetFichaGrupo[] {
  const mapa = new Map<string, CarnetFichaGrupo>();
  // Junto las fichas del mismo tipo para el select.
  fichas.forEach((f) => {
    const tipo = f.tipo_formacion || 'FORMACION_REGULAR';
    const actual = mapa.get(tipo) ?? { tipo, label: f.tipo_label || 'Regular', fichas: [] };
    actual.fichas.push(f);
    mapa.set(tipo, actual);
  });
  return [...mapa.values()].sort((a, b) => ORDEN_TIPO.indexOf(a.tipo) - ORDEN_TIPO.indexOf(b.tipo));
}
