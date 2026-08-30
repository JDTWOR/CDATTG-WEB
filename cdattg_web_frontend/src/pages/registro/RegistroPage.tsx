/**
 * Esta es la página de crear cuenta (cinco pasos).
 * La puse en el portal junto a Registrarse. El formulario está en RegistroFormulario.
 * Arriba a la derecha dejo luna/sol, igual que en el login (no uso ThemeToggle
 * porque aquí el botón va absoluto sobre el degradado).
 * @author Cristian Deysdayr Jiménez
 */
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';
import { useTheme } from '../../context/ThemeContext';
import { RegistroFormulario } from './RegistroFormulario';

/**
 * Pinto el título y el asistente de registro.
 * @returns Página /registro
 */
export function RegistroPage() {
  // El mismo ThemeContext del portal: si cambia aquí, cambia en toda la app.
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-lg bg-white p-2 shadow dark:bg-gray-700"
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5 text-yellow-300" />}
      </button>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center">
          <img src={LogoSena} alt="SENA" className="mx-auto h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Crear cuenta</h1>
        </div>
        <RegistroFormulario />
      </div>
    </div>
  );
}
