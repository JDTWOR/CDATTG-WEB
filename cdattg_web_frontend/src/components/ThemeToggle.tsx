/**
 * Este archivo es el botón de luna y sol de la cabecera del portal.
 * Lo hice porque en el portal público no aparecía cómo cambiar de claro a oscuro;
 * ese botón sí estaba cuando uno ya entra al sistema.
 * Lo pongo en PortalLayout, al lado de Iniciar sesión y Registrarse.
 * El color que elige la persona lo guarda ThemeContext (se recuerda al recargar).
 * @author Cristian Deysdayr Jiménez
 */
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

// Así se ve el botón en el portal: redondito, gris, y un poco más claro al pasar el mouse.
const CLASE_BASE =
  'rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

// Si en otra pantalla quiero otro tamaño o color, le paso className. Si no, uso lo de arriba.
type Props = Readonly<{ className?: string }>;

/**
 * Muestra luna o sol y, al hacer clic, cambia el color de toda la página.
 * @param className Cómo se ve el botón. Si no me lo pasan, uso CLASE_BASE.
 * @returns El botón de cambiar claro/oscuro
 */
export function ThemeToggle({ className = CLASE_BASE }: Props) {
  // De acá saco si ahora está claro u oscuro, y la función que hace el cambio.
  const { theme, toggleTheme } = useTheme();
  // Si está en claro, el siguiente clic es pasar a oscuro (por eso pongo la luna).
  const aOscuro = theme === 'light';
  return (
    <button
      type="button"
      // Al hacer clic cambio el modo de toda la app, no solo de este botón.
      onClick={toggleTheme}
      className={className}
      // Texto al dejar el mouse encima y para quien usa lector de pantalla.
      title={aOscuro ? 'Modo oscuro' : 'Modo claro'}
      aria-label={aOscuro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {aOscuro ? (
        // Luna: la página está clara; si pulsas, pasa a oscuro.
        <MoonIcon className="h-5 w-5" aria-hidden />
      ) : (
        // Sol: la página está oscura; si pulsas, vuelve a claro.
        <SunIcon className="h-5 w-5 text-yellow-400" aria-hidden />
      )}
    </button>
  );
}
