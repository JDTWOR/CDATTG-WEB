/** Mensaje de error de respuestas Axios típicas (error / details). */
export function axiosErrorMessage(e: unknown, fallback: string): string {
  const d = (e as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
  return d?.details || d?.error || fallback;
}
