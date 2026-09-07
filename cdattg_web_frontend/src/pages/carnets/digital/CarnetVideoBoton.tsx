/**
 * El aprendiz descarga un video 3D del carnet (cara y reverso).
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useRef, useState } from 'react';
import { CarnetCara } from '../shared/CarnetCara';
import { CarnetReverso } from '../shared/CarnetReverso';
import { grabarVideoCarnet } from './carnetVideoGrabar';
import { descargarBlob, mimeVideoCarnet, nombreVideoCarnet } from './carnetVideoGiro';
import type { CarnetFichaOpcion, CarnetPersonaDatos } from '../../../types/carnet';

type Props = Readonly<{
  persona: CarnetPersonaDatos;
  ficha: CarnetFichaOpcion;
  fotoUrl: string | null;
}>;

export function CarnetVideoBoton({ persona, ficha, fotoUrl }: Props) {
  const caraRef = useRef<HTMLDivElement>(null);
  const reversoRef = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState('');

  const descargar = async () => {
    if (!caraRef.current || !reversoRef.current) return;
    setCargando(true);
    setAviso('');
    try {
      const blob = await grabarVideoCarnet(caraRef.current, reversoRef.current);
      descargarBlob(blob, nombreVideoCarnet(persona.nombres, persona.numero_documento, mimeVideoCarnet()));
    } catch (e: unknown) {
      setAviso(e instanceof Error ? e.message : 'No pude crear el video');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button type="button" className="btn-sena w-full" disabled={cargando} onClick={() => void descargar()}>
        {cargando ? 'Preparando video 3D…' : 'Descargar video 3D'}
      </button>
      {aviso ? <p className="text-sm text-red-600">{aviso}</p> : null}
      <div className="pointer-events-none fixed left-0 top-0 -z-10 w-[24rem] opacity-[0.02]" aria-hidden>
        <div ref={caraRef}><CarnetCara persona={persona} ficha={ficha} fotoUrl={fotoUrl} /></div>
        <div ref={reversoRef}><CarnetReverso ficha={ficha} /></div>
      </div>
    </>
  );
}
