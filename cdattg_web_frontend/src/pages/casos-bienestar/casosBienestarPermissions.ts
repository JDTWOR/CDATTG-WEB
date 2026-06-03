export function canViewCasosBienestar(roles: string[]): boolean {
  return roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');
}

export const MENSAJE_SIN_PERMISO_CASOS_BIENESTAR =
  'No tiene permiso para acceder a los casos de bienestar (requiere rol de Superadministrador o Bienestar al Aprendiz).';
