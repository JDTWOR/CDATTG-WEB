/**
 * Historial de reposiciones del aprendiz: cada tarjeta muestra la ficha, el
 * estado, el motivo de devolución y los enlaces a sus comprobantes.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { abrirComprobantePerdida } from '../../../services/carnetPerdidaApi';
import type { CarnetPerdidaItem } from '../../../types/carnetPerdida';

type Props = Readonly<{
  items: CarnetPerdidaItem[];
}>;

function verComprobante(id: number, tipo: 'pago' | 'demanda') {
  abrirComprobantePerdida(id, tipo).catch((e: unknown) =>
    window.alert(e instanceof Error ? e.message : 'No pude abrir el comprobante'),
  );
}

export function CarnetPerdidaHistorial({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Aún no ha reportado ninguna pérdida.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((h) => (
        <li key={h.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              Ficha {h.ficha_numero} — {h.programa}
            </span>
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {h.estado_label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Enviada el {h.creada_en}</p>
          {h.motivo_rechazo ? (
            <p className="mt-1 text-sm text-red-600">Motivo: {h.motivo_rechazo}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {h.comprobantes.map((c) => (
              <button
                key={c.tipo}
                type="button"
                onClick={() => verComprobante(h.id, c.tipo)}
                className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Ver {c.tipo === 'pago' ? 'pago' : 'demanda'}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}