/**
 * El aprendiz de formación regular reporta el carnet físico perdido.
 * Sube dos comprobantes (PDF, JPG, PNG o WEBP) con vista previa; el historial
 * de reposiciones se suma al flujo de consultas del propio aprendiz.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { crearSolicitudPerdida } from '../../../services/carnetPerdidaApi';
import { getMiCarnet } from '../../../services/carnetApi';
import type { CarnetFichaOpcion } from '../../../types/carnet';
import { validarComprobantesSeleccionados } from '../../../utils/carnetPerdidaArchivos';
import { CarnetPerdidaArchivoInput } from './CarnetPerdidaArchivoInput';

export function CarnetPerdidaPage() {
  const [fichas, setFichas] = useState<CarnetFichaOpcion[]>([]);
  const [fichaId, setFichaId] = useState(0);
  const [pago, setPago] = useState<File | null>(null);
  const [demanda, setDemanda] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void getMiCarnet()
      .then((c) => setFichas(c.fichas.filter((f) => f.tipo_formacion === 'FORMACION_REGULAR')))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorValidacion = validarComprobantesSeleccionados(pago, demanda);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError('');
    setMensaje('');
    setEnviando(true);
    try {
      await crearSolicitudPerdida(fichaId, pago as File, demanda as File);
      setMensaje('Solicitud enviada. El bibliotecario la revisará.');
      setPago(null);
      setDemanda(null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pérdida de carnet físico</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Solo para aprendices de formación regular. Adjunte el comprobante de pago y el de la demanda empaquetada.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
      ) : null}
      {mensaje ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">{mensaje}</p>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
        <h2 className="mb-3 font-medium text-gray-900 dark:text-white">Reportar pérdida</h2>
        <form onSubmit={(e) => void enviar(e)} className="space-y-4">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Ficha de formación regular
            <select
              required
              value={fichaId}
              onChange={(e) => setFichaId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            >
              <option value={0} disabled>
                Seleccione la ficha
              </option>
              {fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  Ficha {f.numero} — {f.programa}
                </option>
              ))}
            </select>
          </label>
          <CarnetPerdidaArchivoInput
            etiqueta="Comprobante de pago"
            ayuda="PDF o imagen (JPG, PNG, WEBP), máximo 2 MB."
            archivo={pago}
            onChange={setPago}
          />
          <CarnetPerdidaArchivoInput
            etiqueta="Comprobante de la demanda empaquetada"
            ayuda="PDF o imagen (JPG, PNG, WEBP), máximo 2 MB."
            archivo={demanda}
            onChange={setDemanda}
          />
          <button
            type="submit"
            disabled={enviando || fichas.length === 0}
            className="btn-primary w-full"
          >
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </section>
    </main>
  );
}