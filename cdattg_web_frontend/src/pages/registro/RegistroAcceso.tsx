/**
 * Aquí pido la contraseña y que la repita. Es el último paso del registro.
 * La clave no se guarda en el borrador local (registroBorrador la omite).
 * Lo pinta RegistroCampos junto con caracterización cuando el paso es 4.
 * @author Cristian Deysdayr Jiménez
 */
import { LockClosedIcon } from '@heroicons/react/24/outline';
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
 * Acceso al sistema: dos campos, y valido al salir de cada uno.
 * @param form Valores actuales (password y password_confirm)
 * @param set Cambia un campo del formulario
 * @param bind Errores y tocar (validar al blur)
 * @returns La sección Acceso
 */
export function RegistroAcceso({ form, set, bind }: Props) {
  const { errores, tocar } = bind;
  return (
    <RegistroSeccion titulo="Acceso" icono={<LockClosedIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <RegistroCampo htmlFor="reg-pass" texto="Contraseña" extra="Mínimo 8 caracteres, con letras y números" error={errores.password}>
        {/* type=password para no mostrar lo que escribe; new-password para el gestor del navegador. */}
        <input
          id="reg-pass"
          className={claseInput(errores.password)}
          type="password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          onBlur={() => tocar('password')}
          autoComplete="new-password"
          aria-invalid={Boolean(errores.password)}
          aria-required
        />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-pass2" texto="Confirmar contraseña" error={errores.password_confirm}>
        {/* Tiene que coincidir con la de arriba; registroValidate lo compara. */}
        <input
          id="reg-pass2"
          className={claseInput(errores.password_confirm)}
          type="password"
          value={form.password_confirm}
          onChange={(e) => set('password_confirm', e.target.value)}
          onBlur={() => tocar('password_confirm')}
          autoComplete="new-password"
          aria-invalid={Boolean(errores.password_confirm)}
          aria-required
        />
      </RegistroCampo>
    </RegistroSeccion>
  );
}
