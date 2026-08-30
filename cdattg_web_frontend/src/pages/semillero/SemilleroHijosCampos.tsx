/**
 * Aquí el admin carga las líneas, integrantes y proyectos del semillero.
 * Cada uno puede ir en publicado o no; solo lo publicado sale en el portal.
 * Lo usa SemilleroFormPage debajo de SemilleroFichaCampos.
 * @author Cristian Deysdayr Jiménez
 */
import type { Dispatch, SetStateAction } from 'react';
import type { SemilleroItem } from '../../types/portal';
import { EstadoPublicacionSelect } from './EstadoPublicacionSelect';
import { claveHijo, integranteVacio, lineaVacia, proyectoVacio } from './semilleroFormState';

type Props = Readonly<{ form: SemilleroItem; setForm: Dispatch<SetStateAction<SemilleroItem>> }>;

/**
 * Listas editables anidadas, cada una con estado de publicación.
 * @param form Semillero en edición
 * @param setForm Actualiza el padre (líneas/integrantes/proyectos)
 * @returns Tres bloques de filas
 */
export function SemilleroHijosCampos({ form, setForm }: Props) {
  const lineas = form.lineas ?? [];
  const integrantes = form.integrantes ?? [];
  const proyectos = form.proyectos ?? [];
  return (
    <div className="space-y-4">
      {/* Cada fila copia el arreglo, cambia el índice i y guarda. Así no muto el state. */}
      <section>
        <h2 className="font-semibold">Líneas</h2>
        {lineas.map((l, i) => (
          <p key={claveHijo(l.id, l.clave)} className="mt-2 grid gap-2 sm:grid-cols-3">
            <input className="input-field" placeholder="Nombre" value={l.nombre} onChange={(e) => {
              const next = [...lineas]; next[i] = { ...l, nombre: e.target.value }; setForm({ ...form, lineas: next });
            }} />
            <input className="input-field" placeholder="Descripción" value={l.descripcion} onChange={(e) => {
              const next = [...lineas]; next[i] = { ...l, descripcion: e.target.value }; setForm({ ...form, lineas: next });
            }} />
            <EstadoPublicacionSelect value={l.estado_publicacion ?? 'publicado'} onChange={(estado_publicacion) => {
              const next = [...lineas]; next[i] = { ...l, estado_publicacion }; setForm({ ...form, lineas: next });
            }} />
          </p>
        ))}
        <button type="button" className="btn-secondary mt-2" onClick={() => setForm({ ...form, lineas: [...lineas, lineaVacia()] })}>Añadir línea</button>
      </section>
      <section>
        <h2 className="font-semibold">Integrantes</h2>
        {integrantes.map((p, i) => (
          <p key={claveHijo(p.id, p.clave)} className="mt-2 grid gap-2 sm:grid-cols-4">
            <input className="input-field" placeholder="Nombre" value={p.nombre} onChange={(e) => {
              const next = [...integrantes]; next[i] = { ...p, nombre: e.target.value }; setForm({ ...form, integrantes: next });
            }} />
            <input className="input-field" placeholder="Rol" value={p.rol} onChange={(e) => {
              const next = [...integrantes]; next[i] = { ...p, rol: e.target.value }; setForm({ ...form, integrantes: next });
            }} />
            <input className="input-field" placeholder="Programa" value={p.programa ?? ''} onChange={(e) => {
              const next = [...integrantes]; next[i] = { ...p, programa: e.target.value }; setForm({ ...form, integrantes: next });
            }} />
            <EstadoPublicacionSelect value={p.estado_publicacion ?? 'publicado'} onChange={(estado_publicacion) => {
              const next = [...integrantes]; next[i] = { ...p, estado_publicacion }; setForm({ ...form, integrantes: next });
            }} />
          </p>
        ))}
        <button type="button" className="btn-secondary mt-2" onClick={() => setForm({ ...form, integrantes: [...integrantes, integranteVacio()] })}>Añadir integrante</button>
      </section>
      <section>
        <h2 className="font-semibold">Proyectos</h2>
        {proyectos.map((p, i) => (
          <p key={claveHijo(p.id, p.clave)} className="mt-2 grid gap-2">
            <input className="input-field" placeholder="Título" value={p.titulo} onChange={(e) => {
              const next = [...proyectos]; next[i] = { ...p, titulo: e.target.value }; setForm({ ...form, proyectos: next });
            }} />
            <textarea className="input-field" placeholder="Resumen" value={p.resumen} onChange={(e) => {
              const next = [...proyectos]; next[i] = { ...p, resumen: e.target.value }; setForm({ ...form, proyectos: next });
            }} />
            <EstadoPublicacionSelect value={p.estado_publicacion ?? 'publicado'} onChange={(estado_publicacion) => {
              const next = [...proyectos]; next[i] = { ...p, estado_publicacion }; setForm({ ...form, proyectos: next });
            }} />
          </p>
        ))}
        <button type="button" className="btn-secondary mt-2" onClick={() => setForm({ ...form, proyectos: [...proyectos, proyectoVacio()] })}>Añadir proyecto</button>
      </section>
    </div>
  );
}
