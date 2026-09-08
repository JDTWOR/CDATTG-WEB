/**
 * Cara del carnet: logo, foto grande, APRENDIZ a la izquierda y datos.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { CarnetLogoSena } from './CarnetLogoSena';
import { CarnetQrImg } from './CarnetQrImg';
import { etiquetaRegionalCarnet } from './carnetRegional';
import type { CarnetFichaOpcion, CarnetPersonaDatos } from '../../../types/carnet';

type CarnetCaraProps = Readonly<{
  persona: CarnetPersonaDatos;
  ficha: CarnetFichaOpcion;
  fotoUrl: string | null;
}>;

/**
 * Pinto la cara con HTML de documento (article, header, figure).
 */
export function CarnetCara({ persona, ficha, fotoUrl }: CarnetCaraProps) {
  return (
    <article className="carnet-sello mx-auto flex h-[34rem] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-6 pt-5 shadow-md">
      <header className="flex items-start justify-between gap-3">
        <CarnetLogoSena />
        <figure className="m-0 h-44 w-36 shrink-0 overflow-hidden rounded-sm bg-gray-100">
          {fotoUrl ? (
            <img src={fotoUrl} alt="Fotografía del aprendiz" className="h-full w-full object-cover object-top" />
          ) : (
            <figcaption className="flex h-full items-center justify-center text-xs text-gray-400">Sin foto</figcaption>
          )}
        </figure>
      </header>
      <p className="mt-3 text-left text-sm font-semibold tracking-wide text-black">APRENDIZ</p>
      <div className="mt-2 h-px bg-sena-green" aria-hidden />
      <section className="mt-3 flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <p className="text-base font-bold uppercase leading-tight text-sena-green">{persona.nombres}</p>
          <p className="text-base font-bold uppercase leading-tight text-sena-green">{persona.apellidos}</p>
          <p className="mt-2 text-sm text-black">
            {persona.tipo_documento_label} : {persona.numero_documento}
          </p>
          <p className="text-sm text-black">RH {persona.rh || '—'}</p>
        </div>
        <CarnetQrImg documento={persona.numero_documento} />
      </section>
      <div className="mt-4 h-px bg-sena-green" aria-hidden />
      <footer className="mt-3 space-y-1 text-left text-sm">
        <p className="text-black">{etiquetaRegionalCarnet(ficha.regional)}</p>
        <p className="text-sena-green">{ficha.centro_nombre}</p>
        <p className="text-sena-green">Programa. {ficha.programa}</p>
        <p className="text-sena-green">Grupo No. {ficha.numero}</p>
      </footer>
    </article>
  );
}
