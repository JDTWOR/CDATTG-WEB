/**
 * Este es el aviso de por qué pedimos los datos al crear cuenta.
 * Lo pongo solo en el primer paso (RegistroFormulario, cuando paso === 0).
 * @author Cristian Deysdayr Jiménez
 */
import { InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Caja naranja al inicio del formulario, junto al logo SENA.
 * @returns El recuadro de “¿Por qué pedimos estos datos?”
 */
export function RegistroAvisoDatos() {
  return (
    // Borde naranja SENA para que se note que es información, no un error.
    <div className="flex gap-3 rounded-lg border border-sena-orange/40 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/40">
      <InformationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-sena-orange" aria-hidden />
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">¿Por qué pedimos estos datos?</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Validamos su identidad para asegurar la comunicación institucional y personalizar la experiencia en el portal.
        </p>
      </div>
    </div>
  );
}
