/**
 * Estos son los botones Atrás y Siguiente (o Enviar en el último paso).
 * Siguiente se ve fuerte; Atrás más suave. Los usa RegistroFormulario.
 * En el paso 0, Atrás es “Volver al inicio” porque no hay paso anterior.
 * @author Cristian Deysdayr Jiménez
 */
import { ArrowRightIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { AppLink } from '../../components/AppLink';
import { portalPaths } from '../../routes/paths';
import { TOTAL_PASOS } from './registroForm';

// Política oficial SENA (se abre en otra pestaña).
const POLITICA_SENA = 'https://www.sena.edu.co/es-co/transparencia/Paginas/politicas-lineamientos.aspx';

type Props = Readonly<{
  paso: number;
  saving: boolean;
  onAtras: () => void;
}>;

/**
 * Acciones del paso: avanzar, volver o registrar.
 * @param paso Índice actual
 * @param saving True mientras el API responde (desactivo el botón)
 * @param onAtras Baja un paso (lo define el wizard)
 * @returns Botón principal, enlace atrás y avisos
 */
export function RegistroAcciones({ paso, saving, onAtras }: Props) {
  const ultimo = paso >= TOTAL_PASOS - 1;
  return (
    <div className="space-y-4">
      {/* type=submit: RegistroFormulario decide si avanza o envía. */}
      <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={saving}>
        {ultimo ? <UserPlusIcon className="h-5 w-5" aria-hidden /> : <ArrowRightIcon className="h-5 w-5" aria-hidden />}
        {labelPrincipal(ultimo, saving)}
      </button>
      {paso > 0 ? (
        <button type="button" onClick={onAtras} className="w-full text-center text-sm text-gray-600 hover:underline dark:text-gray-400">
          Atrás
        </button>
      ) : (
        <AppLink path={portalPaths.index} className="block w-full text-center text-sm text-gray-600 hover:underline dark:text-gray-400">
          Volver al inicio
        </AppLink>
      )}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Sus datos se tratan conforme a la{' '}
        <a className="text-primary-700 underline dark:text-primary-300" href={POLITICA_SENA} target="_blank" rel="noopener noreferrer">
          política de privacidad del SENA
        </a>.
      </p>
      <p className="text-center text-sm">
        <AppLink path="/login" className="text-primary-700 hover:underline dark:text-primary-300">Ya tengo cuenta</AppLink>
      </p>
    </div>
  );
}

/**
 * Texto del botón verde según el momento.
 * @param ultimo Si está en el paso de contraseña
 * @param saving Si ya pulsó y estamos esperando el API
 * @returns “Siguiente”, “Registrarme ahora” o “Registrando…”
 */
function labelPrincipal(ultimo: boolean, saving: boolean): string {
  if (saving) return 'Registrando…';
  return ultimo ? 'Registrarme ahora' : 'Siguiente';
}
