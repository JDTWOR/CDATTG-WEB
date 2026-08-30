/**
 * Esta es la tarjetita de un semillero en el listado público (foto o sigla de color).
 * Lo hice para que SCBA, SIGEMU y los demás se vean igual en el home y en el listado.
 * Al hacer clic voy a /investigacion/semilleros/{slug}.
 * @author Cristian Deysdayr Jiménez
 */
import { AppLink } from '../../components/AppLink';
import { portalPaths } from '../../routes/paths';
import { portalMediaUrl } from '../../services/portalApi';
import type { SemilleroItem } from '../../types/portal';

type Props = Readonly<{ item: SemilleroItem }>;

/**
 * Pinto foto o recuadro con la sigla, nombre y un resumen corto.
 * @param item Semillero publicado
 */
export function PortalSemilleroCard({ item }: Props) {
  const color = item.color_identidad || '#39A900';
  const foto = item.imagen_url ? portalMediaUrl(item.imagen_url) : '';
  const siglaCorta = item.sigla || item.nombre.slice(0, 4);
  return (
    <AppLink path={portalPaths.semillero(item.slug)} className="card block overflow-hidden hover:shadow-md">
      {foto ? (
        <img src={foto} alt="" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center text-3xl font-extrabold text-white" style={{ background: color }}>
          {siglaCorta}
        </div>
      )}
      <div className="p-4">
        {item.sigla ? <p className="text-xs font-semibold uppercase" style={{ color }}>{item.sigla}</p> : null}
        <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{item.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{item.resumen || item.descripcion || '—'}</p>
      </div>
    </AppLink>
  );
}
