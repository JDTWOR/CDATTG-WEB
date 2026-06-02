/** Etiqueta legible: "INSTRUCTOR" → "Instructor", "SUPER ADMINISTRADOR" → "Super Administrador". */
export function formatRoleLabel(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRolesLine(roles: string[]): string {
  return roles.map(formatRoleLabel).join(', ');
}

export function hasAnyRole(userRoles: string[], required: string[]): boolean {
  const normalized = new Set(userRoles.map((r) => r.toUpperCase()));
  return required.some((r) => normalized.has(r.toUpperCase()));
}
