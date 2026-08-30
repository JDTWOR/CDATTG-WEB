/**
 * El instructor líder valida las solicitudes de carnet de su ficha.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { decidirCarnet, listarCarnetsPendientes } from '../../services/carnetApi';
import { CarnetPendienteFoto } from './CarnetPendienteFoto';
import { CarnetVistaDialog } from './CarnetVistaDialog';
import type { CarnetPendienteItem } from '../../types/carnet';

/**
 * Listo pendientes y dejo ver, aceptar o devolver.
 */
export function CarnetValidarPage() {
  const [rows, setRows] = useState<CarnetPendienteItem[]>([]);
  const [error, setError] = useState('');
  const [verId, setVerId] = useState<number | null>(null);

  const cargar = () => {
    void listarCarnetsPendientes().then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  };

  useEffect(() => {
    cargar();
  }, []);

  const decidir = async (id: number, aprobar: boolean) => {
    try {
      await decidirCarnet(id, aprobar);
      setVerId(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Validar carnet</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Vea el carnet completo. Luego puede aceptar o devolver.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.length === 0 ? <p className="text-sm text-gray-500">No hay solicitudes pendientes.</p> : null}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
            <article className="flex flex-wrap items-center gap-4">
              <CarnetPendienteFoto id={r.id} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 dark:text-white">{r.nombres} {r.apellidos}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">CC {r.numero_documento} · RH {r.rh}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {r.tipo_label} · ficha {r.ficha_numero} · {r.programa}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => setVerId(r.id)}>Ver</button>
                <button type="button" className="btn-sena" onClick={() => void decidir(r.id, true)}>Aceptar</button>
                <button type="button" className="btn-danger" onClick={() => void decidir(r.id, false)}>Devolver</button>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {verId === null ? null : (
        <CarnetVistaDialog id={verId} onClose={() => setVerId(null)} onDecidir={(ok) => void decidir(verId, ok)} />
      )}
    </main>
  );
}
