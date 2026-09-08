/**
 * Confirmación doble contextual del bibliotecario: al pulsar "Aceptar" se
 * confirma la aceptación (verde); al pulsar "Devolver" se pide el motivo y se
 * confirma la devolución (rojo); al pulsar "Marcar como renovado" se confirma
 * la entrega del carnet físico (verde). Cancelar no cambia nada.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import type { CarnetPerdidaRevision } from '../../../types/carnetPerdida';

type Accion = 'aceptar' | 'devolver' | 'renovar';

type Props = Readonly<{
  item: CarnetPerdidaRevision;
  accion: Accion;
  loading: boolean;
  onConfirmar: (accion: Accion, motivo: string) => void;
  onCerrar: () => void;
}>;

export function CarnetPerdidaDecisionModal({ item, accion, loading, onConfirmar, onCerrar }: Props) {
  const [motivo, setMotivo] = useState('');

  const confirmar = () => {
    if (accion === 'devolver' && motivo.trim() === '') return;
    onConfirmar(accion, motivo);
  };

  const titulo =
    accion === 'aceptar'
      ? 'Aceptar la reposición'
      : accion === 'devolver'
        ? 'Devolver la reposición'
        : 'Confirmar renovación física';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={onCerrar} />
      <dialog open className="relative z-10 m-0 w-full max-w-md space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
        <h2 className="font-medium text-gray-900 dark:text-white">{titulo}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {item.nombres} {item.apellidos} · Ficha {item.ficha_numero} — {item.programa}
        </p>
        {accion === 'aceptar' ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ¿Confirma que los comprobantes (pago y demanda) son válidos y aprueba la reposición?
          </p>
        ) : accion === 'renovar' ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ¿Confirma que el carnet físico renovado ya fue entregado al aprendiz? La solicitud pasará al historial.
          </p>
        ) : (
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Motivo de la devolución (obligatorio)
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
              disabled={loading}
              placeholder="Ej.: falta el comprobante de la demanda"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            />
          </label>
        )}
        <div className="flex gap-2">
          {accion === 'devolver' ? (
            <button
              type="button"
              disabled={loading || motivo.trim() === ''}
              className="btn-danger flex-1"
              onClick={confirmar}
            >
              {loading ? 'Enviando...' : 'Confirmar devolución'}
            </button>
          ) : (
            <button type="button" disabled={loading} className="btn-sena flex-1" onClick={confirmar}>
              {loading ? 'Enviando...' : accion === 'renovar' ? 'Sí, ya lo entregué' : 'Sí, aceptar'}
            </button>
          )}
          <button type="button" disabled={loading} className="btn-outline-gray" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </dialog>
    </div>
  );
}