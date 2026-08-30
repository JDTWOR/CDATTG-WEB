/**
 * Este es el paso 3: celular, teléfono y correo.
 * Lo pinta RegistroCampos cuando el paso es 2.
 * El celular es obligatorio en el API; el teléfono fijo no.
 * @author Cristian Deysdayr Jiménez
 */
import { PhoneIcon } from '@heroicons/react/24/outline';
import type { RegisterPayload } from '../../services/registerApi';
import { claseInput, RegistroCampo } from './RegistroCampo';
import { RegistroSeccion } from './RegistroSeccion';
import type { RegistroCampoBind, RegistroSetCampo } from './registroForm';

type Props = Readonly<{
  form: RegisterPayload;
  set: RegistroSetCampo;
  bind: RegistroCampoBind;
}>;

/**
 * Cómo contactar a la persona. Sin guiones ni espacios en los números.
 * @returns La sección Contacto
 */
export function RegistroContacto({ form, set, bind }: Props) {
  const { errores, tocar } = bind;
  return (
    <RegistroSeccion titulo="Contacto" icono={<PhoneIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <RegistroCampo htmlFor="reg-celular" texto="Celular" extra="Sin guiones ni espacios" error={errores.celular}>
        <input
          id="reg-celular"
          className={claseInput(errores.celular)}
          value={form.celular}
          onChange={(e) => set('celular', e.target.value)}
          onBlur={() => tocar('celular')}
          inputMode="numeric"
          autoComplete="tel"
          aria-invalid={Boolean(errores.celular)}
          aria-required
        />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-telefono" texto="Teléfono" opcional extra="Sin guiones ni espacios" error={errores.telefono}>
        <input
          id="reg-telefono"
          className={claseInput(errores.telefono)}
          value={form.telefono}
          onChange={(e) => set('telefono', e.target.value)}
          onBlur={() => tocar('telefono')}
          inputMode="numeric"
          autoComplete="tel"
          aria-invalid={Boolean(errores.telefono)}
        />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-email" texto="Correo electrónico" extra="Ejemplo: correo@sena.edu.co" error={errores.email}>
        {/* type=email para teclado y validación nativa; el API también lo valida. */}
        <input
          id="reg-email"
          className={claseInput(errores.email)}
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => tocar('email')}
          autoComplete="email"
          aria-invalid={Boolean(errores.email)}
          aria-required
        />
      </RegistroCampo>
    </RegistroSeccion>
  );
}
