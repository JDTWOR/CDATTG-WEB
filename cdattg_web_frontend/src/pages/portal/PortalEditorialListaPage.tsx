/**
 * Este es el listado público de una sección: revista, boletines, podcast, etc.
 * Lo hice una sola vez porque todas se ven igual; lo que cambia es cfg (portalEditorialRutas).
 * Solo salen los publicados. El API ya filtra.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { investigacionApi } from '../../services/investigacionApi';
import { portalMediaUrl } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { BiogjgasItem } from '../../types/biogjgas';
import { PortalEmptyState } from './PortalEmptyState';
import type { EditorialPublico } from './portalEditorialRutas';

type Props = Readonly<{ cfg: EditorialPublico }>;

/**
 * Pinto las tarjetas de esa sección y el enlace a su detalle.
 * @param cfg Qué sección es (título, kind del API y URL de detalle)
 */
export function PortalEditorialListaPage({ cfg }: Props) {
  const [rows, setRows] = useState<BiogjgasItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // cfg.kind: revistas, boletines, podcasts… lo que entiende el API.
    investigacionApi.listarPublico(cfg.kind)
      .then(setRows)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar')));
  }, [cfg.kind]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AppLink path={portalPaths.investigacion} className="btn-secondary">Volver</AppLink>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{cfg.titulo}</h1>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {rows.length === 0 && !error ? (
        <PortalEmptyState titulo="Sin contenidos publicados" detalle="Cuando el área publique, aparecerán aquí." />
      ) : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className="card">
            {r.portada_url || r.imagen_url ? (
              <img src={portalMediaUrl(r.portada_url || r.imagen_url || '')} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
            ) : null}
            <h2 className="font-semibold text-gray-900 dark:text-white">{r.titulo}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-gray-600">{r.resumen || r.descripcion || r.subtitulo || '—'}</p>
            {/* slug si hay; si no, el id numérico. */}
            <AppLink path={cfg.detalle(r.slug || String(r.id))} className="mt-3 inline-flex text-sm font-medium text-primary-700 hover:underline">Ver detalle</AppLink>
          </li>
        ))}
      </ul>
    </main>
  );
}
