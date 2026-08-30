/**
 * Aquí armo la ficha pública: foto, misión, líneas, integrantes y proyectos.
 * Lo saqué de la página de detalle para no mezclar la carga del API con el dibujo.
 * Solo pinto lo que venga publicado (los hijos ya los filtra el backend).
 * @author Cristian Deysdayr Jiménez
 */
import type { SemilleroItem, SemilleroLineaItem } from '../../types/portal';
import { portalMediaUrl } from '../../services/portalApi';

type Props = Readonly<{ item: SemilleroItem }>;

/**
 * Arriba: foto, nombre, sigla, resumen y líder.
 */
function SemilleroCabecera({ item }: Props) {
  return (
    <header className="flex flex-wrap gap-4">
      {item.imagen_url ? <img src={portalMediaUrl(item.imagen_url)} alt="" className="h-32 w-32 rounded-xl object-cover" /> : null}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{item.nombre}</h1>
        {item.sigla ? <p className="text-sm font-semibold text-sena-green">{item.sigla}</p> : null}
        {/* Si no hay resumen, uso la descripción larga. */}
        <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{item.resumen || item.descripcion || '—'}</p>
        {item.instructor_lider ? <p className="mt-1 text-sm text-gray-500">Líder: {item.instructor_lider}</p> : null}
      </div>
    </header>
  );
}

/**
 * Misión y visión, solo si hay texto.
 */
function SemilleroMisionVision({ item }: Props) {
  if (!item.mision && !item.vision) return null;
  return (
    <section className="card space-y-2 whitespace-pre-wrap text-sm">
      {item.mision ? <p><strong>Misión.</strong> {item.mision}</p> : null}
      {item.vision ? <p><strong>Visión.</strong> {item.vision}</p> : null}
    </section>
  );
}

/**
 * Lista de líneas de investigación del grupo.
 */
function SemilleroLineas({ lineas }: Readonly<{ lineas: SemilleroLineaItem[] }>) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Líneas de investigación</h2>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {lineas.map((l) => <li key={l.nombre}>{l.nombre}{l.descripcion ? ` — ${l.descripcion}` : ''}</li>)}
      </ul>
      {lineas.length === 0 ? <p className="text-sm text-gray-500">Sin líneas registradas.</p> : null}
    </section>
  );
}

/**
 * Junto cabecera, textos, integrantes y proyectos.
 * @param item Semillero ya cargado
 */
export function PortalSemilleroFicha({ item }: Props) {
  return (
    <>
      <SemilleroCabecera item={item} />
      <SemilleroMisionVision item={item} />
      <SemilleroLineas lineas={item.lineas ?? []} />
      <section className="card">
        <h2 className="text-lg font-semibold">Integrantes</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(item.integrantes ?? []).map((i) => (
            <li key={`${i.nombre}-${i.correo}`}>{i.nombre} {i.rol ? `(${i.rol})` : ''}</li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2 className="text-lg font-semibold">Proyectos</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {(item.proyectos ?? []).map((p) => (
            <li key={p.titulo}><strong>{p.titulo}</strong> {p.anio ? `(${p.anio})` : ''}<br />{p.resumen}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
