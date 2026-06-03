import { Link } from 'react-router-dom';

type CasosBienestarBreadcrumbProps = Readonly<{
  tail?: string;
}>;

export function CasosBienestarBreadcrumb({ tail }: CasosBienestarBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" aria-label="Miga de pan">
      <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">
        Inicio
      </Link>
      <span>/</span>
      <Link to="/asistencia" className="hover:text-primary-600 dark:hover:text-primary-400">
        Asistencia
      </Link>
      <span>/</span>
      <Link to="/asistencia/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">
        Dashboard
      </Link>
      <span>/</span>
      {tail ? (
        <>
          <Link
            to="/asistencia/dashboard/casos-bienestar"
            className="hover:text-primary-600 dark:hover:text-primary-400"
          >
            Casos a tener en cuenta
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900 dark:text-white">{tail}</span>
        </>
      ) : (
        <span className="font-medium text-gray-900 dark:text-white">Casos a tener en cuenta</span>
      )}
    </nav>
  );
}
