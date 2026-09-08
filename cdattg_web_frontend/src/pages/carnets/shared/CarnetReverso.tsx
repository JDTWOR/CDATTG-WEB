/**
 * Reverso del carnet con el escudo de Colombia, texto legal y regional.
 *
 * @author Cristian Deysdayr Jiménez
 */
import EscudoColombia from '../../../assets/escudo-colombia.png';
import { CARNET_TEXTO_EXTRAVIO, CARNET_TEXTO_LEGAL } from './carnetTextos';
import { CarnetReversoQr } from './CarnetReversoQr';
import { etiquetaRegionalCarnet } from './carnetRegional';
import type { CarnetFichaOpcion } from '../../../types/carnet';

type CarnetReversoProps = Readonly<{ ficha: CarnetFichaOpcion }>;

export function CarnetReverso({ ficha }: CarnetReversoProps) {
  return (
    <article className="carnet-sello mx-auto flex h-[34rem] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-4 shadow-md">
      <header className="mb-2 flex justify-center">
        <img src={EscudoColombia} alt="Escudo de la República de Colombia" className="h-24 w-auto" />
      </header>
      <p className="text-center text-[11px] leading-snug text-black">{CARNET_TEXTO_LEGAL}</p>
      <CarnetReversoQr />
      <p className="mt-4 text-center text-[11px] text-black">{CARNET_TEXTO_EXTRAVIO}</p>
      <footer className="mt-auto pt-4 text-center">
        <p className="text-sm font-semibold uppercase text-sena-green">{etiquetaRegionalCarnet(ficha.regional)}</p>
        <p className="mt-1 text-sm font-semibold uppercase text-sena-green">VENCE: {ficha.fecha_fin || '—'}</p>
      </footer>
    </article>
  );
}
