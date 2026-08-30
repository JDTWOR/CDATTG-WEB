/**
 * Bajo el Excel de biblioteca desde la API.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { bajarExcelBiblioteca } from '../../services/carnetApi';
import { descargarBlob } from './carnetVideoGiro';

/**
 * Pido el archivo a la API y lo guardo.
 * @param fichaId ficha elegida; 0 = todas
 */
export async function descargarExcelBiblioteca(fichaId: number): Promise<void> {
  const blob = await bajarExcelBiblioteca(fichaId);
  descargarBlob(blob, 'carnets-regulares.xlsx');
}
