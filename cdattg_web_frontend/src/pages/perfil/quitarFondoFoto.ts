/**
 * Quito el fondo de la foto con el recortador de persona y, si falla,
 * con el recorte por color de las esquinas.
 *
 * @author Cristian Deysdayr Jiménez
 */

function colorEn(data: Uint8ClampedArray, i: number): [number, number, number] {
  return [data[i], data[i + 1], data[i + 2]];
}

function distancia(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Quito píxeles parecidos a las esquinas (fondo liso).
 * @param imageData foto
 * @param umbral parecido al fondo
 */
export function quitarFondoFoto(imageData: ImageData, umbral = 48): ImageData {
  const { data, width, height } = imageData;
  const esquinas = [
    colorEn(data, 0),
    colorEn(data, (width - 1) * 4),
    colorEn(data, (height - 1) * width * 4),
    colorEn(data, ((height - 1) * width + (width - 1)) * 4),
  ];
  const fondo: [number, number, number] = [
    Math.round((esquinas[0][0] + esquinas[1][0] + esquinas[2][0] + esquinas[3][0]) / 4),
    Math.round((esquinas[0][1] + esquinas[1][1] + esquinas[2][1] + esquinas[3][1]) / 4),
    Math.round((esquinas[0][2] + esquinas[1][2] + esquinas[2][2] + esquinas[3][2]) / 4),
  ];
  for (let i = 0; i < data.length; i += 4) {
    if (distancia(colorEn(data, i), fondo) <= umbral) data[i + 3] = 0;
  }
  return imageData;
}

/**
 * Quito el fondo con el modelo de persona. Lo cargo solo al tomar la foto.
 * @param fuente blob o archivo
 * @returns png con transparencia
 */
export async function quitarFondoConModelo(fuente: Blob): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground(fuente);
}
