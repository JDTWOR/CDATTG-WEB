/**
 * Este es el paso 1 de crear cuenta: documento, fechas y género.
 * Lo pinta RegistroCampos cuando el paso es 0.
 * Los tipos y géneros salen de useRegistroCatalogos (listas del API).
 * @author Cristian Deysdayr Jiménez
 */
import { IdentificationIcon } from '@heroicons/react/24/outline';
import type { RegisterPayload } from '../../services/registerApi';
import type { ParametroItem } from '../../types';
import { claseInput, RegistroCampo } from './RegistroCampo';
import { RegistroSeccion } from './RegistroSeccion';
import type { RegistroCampoBind, RegistroSetCampo } from './registroForm';

type Props = Readonly<{
  form: RegisterPayload;
  set: RegistroSetCampo;
  tipos: ParametroItem[];
  generos: ParametroItem[];
  bind: RegistroCampoBind;
}>;

/**
 * Identidad documental y demográfica. El número va sin puntos ni guiones.
 * @returns La sección Identidad
 */
export function RegistroIdentidad({ form, set, tipos, generos, bind }: Props) {
  const { errores, tocar } = bind;
  return (
    <RegistroSeccion titulo="Identidad" icono={<IdentificationIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <RegistroCampo htmlFor="reg-tipo-doc" texto="Tipo de documento" error={errores.tipo_documento}>
        {/* value numérico: el API espera el id del parámetro, no el nombre. */}
        <select
          id="reg-tipo-doc"
          className={claseInput(errores.tipo_documento)}
          value={form.tipo_documento || ''}
          onChange={(e) => set('tipo_documento', Number(e.target.value))}
          onBlur={() => tocar('tipo_documento')}
          aria-invalid={Boolean(errores.tipo_documento)}
          aria-required
        >
          <option value="">Seleccione</option>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-num-doc" texto="Número de documento" extra="Sin puntos, guiones ni espacios" error={errores.numero_documento}>
        <input
          id="reg-num-doc"
          className={claseInput(errores.numero_documento)}
          value={form.numero_documento}
          onChange={(e) => set('numero_documento', e.target.value)}
          onBlur={() => tocar('numero_documento')}
          inputMode="numeric"
          aria-invalid={Boolean(errores.numero_documento)}
          aria-required
          aria-describedby="reg-num-doc-ayuda"
        />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-nacimiento" texto="Fecha de nacimiento" extra="Debe tener al menos 14 años para registrarse" error={errores.fecha_nacimiento}>
        <input
          id="reg-nacimiento"
          className={claseInput(errores.fecha_nacimiento)}
          type="date"
          value={form.fecha_nacimiento}
          onChange={(e) => set('fecha_nacimiento', e.target.value)}
          onBlur={() => tocar('fecha_nacimiento')}
          aria-invalid={Boolean(errores.fecha_nacimiento)}
          aria-required
        />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-genero" texto="Género" error={errores.genero}>
        <select
          id="reg-genero"
          className={claseInput(errores.genero)}
          value={form.genero || ''}
          onChange={(e) => set('genero', Number(e.target.value))}
          onBlur={() => tocar('genero')}
          aria-invalid={Boolean(errores.genero)}
          aria-required
        >
          <option value="">Seleccione</option>
          {generos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </RegistroCampo>
    </RegistroSeccion>
  );
}
