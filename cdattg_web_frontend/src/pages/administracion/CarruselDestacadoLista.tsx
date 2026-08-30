/**
 * @module pages/administracion/CarruselDestacadoLista
 * @description Tarjetas de diapositivas del carrusel de destacados.
 * @author Cristian Deysdayr Jiménez
 */
import { portalMediaUrl } from '../../services/portalApi';
import type { PortalBannerItem } from '../../types/portal';

type Props = Readonly<{
  banners: PortalBannerItem[];
  onEditar: (row: PortalBannerItem) => void;
  onEliminar: (id: number) => void;
}>;

/**
 * Vista previa de cada diapositiva publicada o en borrador.
 */
export function CarruselDestacadoLista({ banners, onEditar, onEliminar }: Props) {
  if (banners.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay diapositivas. Crea una para el inicio público.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {banners.map((b) => (
        <li key={b.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {b.imagen_url ? <img src={portalMediaUrl(b.imagen_url)} alt="" className="h-36 w-full object-cover" /> : <div className="h-24 bg-sena-green" />}
          <div className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-sena-green">{b.etiqueta || 'Sin etiqueta'}</p>
            <h2 className="font-semibold text-gray-900 dark:text-white">{b.titulo}</h2>
            <p className="line-clamp-2 text-sm text-gray-500">{b.descripcion || '—'}</p>
            <p className="text-xs uppercase text-gray-400">{b.estado_publicacion}{b.boton_texto ? ` · ${b.boton_texto}` : ''}</p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => onEditar(b)}>Editar</button>
              <button type="button" className="btn-danger" onClick={() => onEliminar(b.id)}>Quitar</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
