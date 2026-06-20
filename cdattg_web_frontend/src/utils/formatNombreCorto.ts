/** Primer nombre y primer apellido a partir del nombre completo. */
export function nombrePrimerNombrePrimerApellido(nombre?: string | null): string {
  const parts = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Sin asignar';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
}
