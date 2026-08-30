/**
 * Estos son los datos de la ficha del semillero (nombre, sigla, color, misión).
 * Los hijos (líneas, integrantes, proyectos) están en SemilleroHijosCampos.
 * Lo usa SemilleroFormPage.
 * @author Cristian Deysdayr Jiménez
 */
import type { SemilleroItem } from '../../types/portal';
import { EstadoPublicacionSelect } from './EstadoPublicacionSelect';

type Props = Readonly<{ form: SemilleroItem; setForm: (next: SemilleroItem) => void; onImagen: (f: File) => void }>;

/**
 * Nombre, sigla, textos institucionales y estado.
 * @param form Semillero en edición
 * @param setForm Reemplaza el objeto completo
 * @param onImagen Sube el archivo (lo hace la página, no yo)
 * @returns Campos de la ficha
 */
export function SemilleroFichaCampos({ form, setForm, onImagen }: Props) {
  const set = (patch: Partial<SemilleroItem>) => setForm({ ...form, ...patch });
  return (
    <>
      <label className="block text-sm">
        <span>Nombre</span>
        <input className="input-field mt-1" required value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input-field" placeholder="Sigla (SCBA, SIGEMU…)" value={form.sigla} onChange={(e) => set({ sigla: e.target.value })} />
        {/* Vacío = el backend arma el slug a partir del nombre. */}
        <input className="input-field" placeholder="Slug (vacío = automático)" value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
        <input className="input-field" placeholder="Instructor líder" value={form.instructor_lider} onChange={(e) => set({ instructor_lider: e.target.value })} />
        <input className="input-field" placeholder="Correo de contacto" value={form.correo_contacto} onChange={(e) => set({ correo_contacto: e.target.value })} />
        <input className="input-field" placeholder="Color (#39A900)" value={form.color_identidad} onChange={(e) => set({ color_identidad: e.target.value })} />
        <input className="input-field" type="number" placeholder="Orden" value={form.orden} onChange={(e) => set({ orden: Number(e.target.value) })} />
      </div>
      <textarea className="input-field" rows={2} placeholder="Resumen" value={form.resumen} onChange={(e) => set({ resumen: e.target.value })} />
      <textarea className="input-field" rows={3} placeholder="Descripción" value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
      <textarea className="input-field" rows={2} placeholder="Misión" value={form.mision} onChange={(e) => set({ mision: e.target.value })} />
      <textarea className="input-field" rows={2} placeholder="Visión" value={form.vision} onChange={(e) => set({ vision: e.target.value })} />
      <textarea className="input-field" rows={3} placeholder="Objetivos (uno por línea)" value={form.objetivos} onChange={(e) => set({ objetivos: e.target.value })} />
      <EstadoPublicacionSelect value={form.estado_publicacion} onChange={(estado_publicacion) => set({ estado_publicacion })} />
      <label className="block text-sm">
        <span>Imagen</span>
        <input type="file" accept="image/*" className="mt-1" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImagen(f); }} />
      </label>
    </>
  );
}
