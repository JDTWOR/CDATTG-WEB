/**
 * Este es el recuadro con icono y título de cada paso del registro.
 * Lo hice para que se vea como el resto de formularios del sistema.
 * Lo usan Identidad, Nombre, Contacto, Ubicación, Caracterización y Acceso.
 * @author Cristian Deysdayr Jiménez
 */
import type { ReactNode } from 'react';

type Props = Readonly<{
  titulo: string;
  icono: ReactNode;
  children: ReactNode;
}>;

/**
 * Pinto el encabezado del paso y debajo los campos.
 * @param titulo Texto grande (ej. “Identidad”)
 * @param icono Icono a la izquierda del título
 * @param children Los campos de ese paso
 * @returns La sección visual
 */
export function RegistroSeccion({ titulo, icono, children }: Props) {
  return (
    <section className="space-y-6">
      {/* text-sena-dark: verde institucional, igual que otras pantallas SENA. */}
      <h2 className="flex items-center gap-2 text-lg font-semibold text-sena-dark dark:text-gray-100">
        {icono}
        {titulo}
      </h2>
      {children}
    </section>
  );
}
