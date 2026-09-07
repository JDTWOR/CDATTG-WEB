import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getConfiguracionCarnet } from '../../../services/carnetApi';

export function CarnetReversoQr() {
  const [src, setSrc] = useState('');

  useEffect(() => {
    void getConfiguracionCarnet().then((cfg) => {
      const texto = [cfg.nombre, cfg.cargo, cfg.regional].filter(Boolean).join(' | ');
      void QRCode.toDataURL(texto || 'SIN CONFIGURAR', { margin: 1, width: 256, color: { dark: '#000000', light: '#ffffff' } }).then(setSrc);
    }).catch(() => {
      void QRCode.toDataURL('SIN CONFIGURAR', { margin: 1, width: 256, color: { dark: '#000000', light: '#ffffff' } }).then(setSrc);
    });
  }, []);

  if (!src) return <div className="mx-auto mt-1 h-32 w-32 animate-pulse bg-gray-100" />;
  return (
    <div className="mx-auto mt-1">
      <img src={src} alt="QR del carnet" className="block h-32 w-32 bg-white" />
    </div>
  );
}
