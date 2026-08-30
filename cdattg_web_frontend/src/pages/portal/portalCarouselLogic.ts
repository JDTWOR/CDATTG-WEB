/**
 * Aquí están las cuentas del carrusel: cada cuánto pasa, cuál es el siguiente
 * y si un enlace es seguro. Lo saqué de PortalCarousel para no mezclar números
 * con el dibujo. También evita que un enlace raro (javascript:) se use en el botón.
 * @author Cristian Deysdayr Jiménez
 */

// 5 segundos entre un banner y el otro (si hay más de uno).
export const CARRUSEL_INTERVALO_MS = 5000;

// Todas las capas ocupan el mismo recuadro y se funden en 700 ms.
const CAPA_BASE = 'absolute inset-0 transition-opacity duration-700 ease-in-out';

/**
 * Digo cómo se ve la capa: la de ahora, la de abajo o escondida.
 * @param activa La que está entrando
 * @param debajo La anterior, opaca para no ver el fondo
 * @returns Clases de Tailwind
 */
export function claseCapaCarrusel(activa: boolean, debajo = false): string {
  // Encima y visible.
  if (activa) return `${CAPA_BASE} z-10 opacity-100`;
  // Atrás y visible: tapa el fondo negro/verde mientras entra la nueva.
  if (debajo) return `${CAPA_BASE} z-0 opacity-100`;
  // Las demás no se ven ni reciben clics.
  return `${CAPA_BASE} pointer-events-none z-0 opacity-0`;
}

/**
 * Sumo o resto y, si me paso, vuelvo al otro extremo (como un círculo).
 * @param actual Dónde estoy (desde 0)
 * @param total Cuántos banners hay
 * @param delta 1 adelante, -1 atrás
 * @returns El nuevo número, o 0 si no hay banners
 * @example indiceCarruselDelta(0, 3, -1) // 2
 */
export function indiceCarruselDelta(actual: number, total: number, delta: number): number {
  if (total <= 0) return 0;
  // El + total evita números negativos al ir hacia atrás desde 0.
  return (((actual + delta) % total) + total) % total;
}

/**
 * Paso al siguiente; si era el último, vuelvo al primero.
 */
export function siguienteIndiceCarrusel(actual: number, total: number): number {
  return indiceCarruselDelta(actual, total, 1);
}

/**
 * Paso al anterior; si era el primero, salto al último.
 */
export function indiceAnteriorCarrusel(actual: number, total: number): number {
  return indiceCarruselDelta(actual, total, -1);
}

/**
 * Dejo pasar solo http, https o una ruta del sitio que empiece con /.
 * @param raw Lo que escribió el admin en el banner
 * @returns El enlace limpio, o vacío si no es seguro
 */
export function hrefCarruselSeguro(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  // Ruta interna (/registro). // sería un protocolo raro, no lo dejo.
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return s;
  } catch {
    return '';
  }
  // javascript:, data:, etc. no pasan.
  return '';
}
