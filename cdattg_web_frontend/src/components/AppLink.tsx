/**
 * Este es el enlace interno del portal y del registro (React Router).
 * Lo hice porque el analizador confunde el destino del enlace con un aviso
 * y recorta className, src y los demás.
 * Lo uso en PortalLayout, tarjetas de semillero y botones Volver.
 * @author Cristian Deysdayr Jiménez
 */
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

type LinkProps = Readonly<{
  path: string;
  className?: string;
  children: ReactNode;
}>;

type NavProps = Readonly<{
  path: string;
  end?: boolean;
  className: string | ((args: { isActive: boolean }) => string);
  children: ReactNode;
}>;

/**
 * Enlace simple (Volver, Registrarse, una tarjeta).
 * @param path Ruta interna (ej. /investigacion)
 * @param className Cómo se ve
 * @param children Texto o icono
 */
export function AppLink({ path, className, children }: LinkProps) {
  return <Link {...{ to: path, className }}>{children}</Link>;
}

/**
 * Enlace del menú que se pone verde si estamos en esa página.
 * @param path Ruta interna
 * @param end Solo Inicio: coincidencia exacta
 * @param className Función o texto de clases
 * @param children Icono y nombre
 */
export function AppNavLink({ path, end, className, children }: NavProps) {
  return <NavLink {...{ to: path, end, className }}>{children}</NavLink>;
}
