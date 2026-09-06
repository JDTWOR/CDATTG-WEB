/**
 * Bajo el zip de fotos de biblioteca desde la API.
 * El zip trae las fotos en el mismo orden que el Excel.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { bajarFotosBibliotecaZip } from '../../../services/carnetApi';
import { descargarBlob } from '../digital/carnetVideoGiro';

/**
 * Pido el zip a la API y lo guardo.
 * @param fichaId ficha elegida; 0 = todas
 */
export async function descargarFotosBibliotecaZip(fichaId: number): Promise<void> {
  const blob = await bajarFotosBibliotecaZip(fichaId);
  descargarBlob(blob, 'fotos-carnets-regulares.zip');
}