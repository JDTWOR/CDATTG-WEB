/**
 * Esta es la ficha de un contenido publicado (un boletín, un podcast, etc.).
 * Lo hice para mostrar texto, audio, PDF o enlace, según lo que haya cargado el área.
 * El id o slug viene de la URL. cfg dice de qué sección es.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLink } from '../../components/AppLink';
import { investigacionApi } from '../../services/investigacionApi';
import { portalMediaUrl } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { BiogjgasItem } from '../../types/biogjgas';
import type { EditorialPublico } from './portalEditorialRutas';

type Props = Readonly<{ cfg: EditorialPublico }>;

/**
 * Cargo un ítem y pinto portada, texto y descargas.
 * @param cfg Sección y cómo armar la URL de detalle
 */
export function PortalEditorialDetallePage({ cfg }: Props) {
  // id de la URL: puede ser número o slug.
  const { id } = useParams();
  const [item, setItem] = useState<BiogjgasItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    investigacionApi.detallePublico(cfg.kind, id)
      .then(setItem)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No encontrado')));
  }, [cfg.kind, id]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AppLink path={portalPaths.investigacion} className="btn-secondary">Volver</AppLink>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {item ? (
        <article className="card space-y-3">
          {item.portada_url ? <img src={portalMediaUrl(item.portada_url)} alt="" className="h-48 w-full rounded-lg object-cover" /> : null}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{item.titulo}</h1>
          {/* editorial = texto largo; si no hay, uso descripción o resumen. */}
          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{item.editorial || item.descripcion || item.resumen || ''}</p>
          {item.audio_url ? (
            <a className="text-primary-700 hover:underline" href={portalMediaUrl(item.audio_url)}>Escuchar o descargar audio</a>
          ) : null}
          {item.pdf_url ? <a className="text-primary-700 hover:underline" href={portalMediaUrl(item.pdf_url)}>Descargar PDF</a> : null}
          {item.documento_url ? <a className="text-primary-700 hover:underline" href={portalMediaUrl(item.documento_url)}>Documento</a> : null}
          {item.enlace_externo ? (
            <a className="text-primary-700 hover:underline" href={item.enlace_externo} rel="noreferrer" target="_blank">Enlace externo</a>
          ) : null}
        </article>
      ) : null}
    </main>
  );
}
