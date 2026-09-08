/**
 * Pinto el logo del SENA un poco más grande y en PNG.
 * Lo hice para que se vea bien en pantalla y también en el video.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import LogoSena from '../../../../logo-sena-verde-complementario-svg-2022.svg';
import { svgUrlAPng } from './carnetLogo';

/**
 * Cargo el logo como PNG para que no se pierda al descargar.
 */
export function CarnetLogoSena() {
  const [src, setSrc] = useState(LogoSena);

  useEffect(() => {
    void svgUrlAPng(LogoSena).then(setSrc).catch(() => undefined);
  }, []);

  // Lo dejo un poco más grande que antes (h-14) para que se lea bien.
  return <img src={src} alt="Logotipo del SENA" className="h-20 w-auto" />;
}
