/**
 * Dibujo el QR de la cédula en la cara del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { textoQrCarnet } from './carnetQr';

type CarnetQrImgProps = Readonly<{ documento: string }>;

/**
 * Pinto un QR negro sobre blanco.
 * @param documento número de cédula
 */
export function CarnetQrImg({ documento }: CarnetQrImgProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const texto = textoQrCarnet(documento);
    if (!texto) {
      setSrc('');
      return;
    }
    void QRCode.toDataURL(texto, { margin: 0, width: 160, color: { dark: '#000000', light: '#ffffff' } }).then(setSrc);
  }, [documento]);

  if (!src) return <div className="h-24 w-24 bg-white" aria-hidden />;
  return <img src={src} alt="Código QR del documento" className="h-24 w-24 bg-white" />;
}
