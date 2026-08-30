/**
 * Aquí muestro solo el paso de ahora (identidad, nombre, contacto, ubicación o cuenta).
 * Lo usa RegistroFormulario para no pintar los cinco de una vez.
 * El número de paso lo decide useRegistroWizard (0 a 4).
 * @author Cristian Deysdayr Jiménez
 */
import type { RegisterPayload } from '../../services/registerApi';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';
import { RegistroAcceso } from './RegistroAcceso';
import { RegistroCaracterizacion } from './RegistroCaracterizacion';
import { RegistroContacto } from './RegistroContacto';
import { RegistroIdentidad } from './RegistroIdentidad';
import { RegistroNombre } from './RegistroNombre';
import { RegistroUbicacion } from './RegistroUbicacion';
import type { RegistroCampoBind, RegistroSetCampo, RegistroSetForm } from './registroForm';

// Lo que necesito de cada paso: el formulario, cómo cambiar un campo, y las listas.
type Props = Readonly<{
  paso: number;
  form: RegisterPayload;
  set: RegistroSetCampo;
  setForm: RegistroSetForm;
  bind: RegistroCampoBind;
  tipos: ParametroItem[];
  generos: ParametroItem[];
  cars: ParametroItem[];
  paises: PaisItem[];
  deps: DepartamentoItem[];
  muns: MunicipioItem[];
  ids: readonly number[];
  onToggle: (id: number) => void;
}>;

/**
 * Pinto un paso a la vez para que no se vea el formulario de golpe.
 * @param p Datos del asistente (paso, formulario, catálogos)
 * @returns El bloque del paso actual
 */
export function RegistroCampos(p: Props) {
  // bind trae errores y “tocar” (validar al salir del campo). Lo paso igual a cada paso.
  const bind = p.bind;
  // Paso 0: documento, nacimiento y género.
  if (p.paso === 0) {
    return <RegistroIdentidad form={p.form} set={p.set} tipos={p.tipos} generos={p.generos} bind={bind} />;
  }
  // Paso 1: nombres y apellidos.
  if (p.paso === 1) {
    return <RegistroNombre form={p.form} set={p.set} bind={bind} />;
  }
  // Paso 2: celular, teléfono y correo.
  if (p.paso === 2) {
    return <RegistroContacto form={p.form} set={p.set} bind={bind} />;
  }
  // Paso 3: país → departamento → municipio. Uso setForm porque al cambiar país limpio los otros.
  if (p.paso === 3) {
    return <RegistroUbicacion form={p.form} setForm={p.setForm} paises={p.paises} deps={p.deps} muns={p.muns} bind={bind} />;
  }
  // Paso 4 (el último): casillas de caracterización y luego la contraseña.
  return (
    <div className="space-y-10">
      <RegistroCaracterizacion cars={p.cars} ids={p.ids} onToggle={p.onToggle} error={bind.errores.parametro_id} />
      <RegistroAcceso form={p.form} set={p.set} bind={bind} />
    </div>
  );
}
