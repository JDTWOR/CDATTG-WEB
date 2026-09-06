/**
 * Tarjeta de la bandeja: muestra la foto del aprendiz y sus datos como en un
 * carnet regular, sus comprobantes (con descarga en zip) y las acciones según
 * el estado: aceptar/devolver cuando está pendiente, o notificar al aprendiz y
 * marcar como renovado cuando está en espera. Botones outline de color según
 * la acción e iconos que se ajustan al espacio del botón.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { BellIcon, DocumentArrowDownIcon, EyeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import {
  abrirComprobantePerdida,
  abrirComprobantesZipPerdida,
} from '../../../services/carnetPerdidaApi';
import type { CarnetPerdidaRevision } from '../../../types/carnetPerdida';
import { CarnetPerdidaFoto } from './CarnetPerdidaFoto';

type Props = Readonly<{
  item: CarnetPerdidaRevision;
  puedeDecidir: boolean;
  renovable: boolean;
  onAceptar: (r: CarnetPerdidaRevision) => void;
  onDevolver: (r: CarnetPerdidaRevision) => void;
  onRenovar: (r: CarnetPerdidaRevision) => void;
  onNotificar: (r: CarnetPerdidaRevision) => Promise<unknown>;
  onVerFoto: (r: CarnetPerdidaRevision) => void;
}>;

function verComprobante(id: number, tipo: 'pago' | 'demanda') {
  abrirComprobantePerdida(id, tipo).catch((e: unknown) =>
    window.alert(e instanceof Error ? e.message : 'No pude abrir el comprobante'),
  );
}

function verZip(id: number) {
  abrirComprobantesZipPerdida(id).catch((e: unknown) =>
    window.alert(e instanceof Error ? e.message : 'No pude descargar el ZIP'),
  );
}

export function CarnetPerdidaRevisionCard({
  item,
  puedeDecidir,
  renovable,
  onAceptar,
  onDevolver,
  onRenovar,
  onNotificar,
  onVerFoto,
}: Props) {
  const [avisado, setAvisado] = useState(false);

  const avisar = () => {
    onNotificar(item)
      .then(() => setAvisado(true))
      .catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'No pude notificar'));
  };

  return (
    <li className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="flex gap-4 border-l-[3px] border-primary-500 p-4">
        <CarnetPerdidaFoto solicitudId={item.id} alt={`Foto de ${item.nombres} ${item.apellidos}`} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold uppercase leading-tight text-primary-700 dark:text-primary-300">
            {item.nombres} {item.apellidos}
          </h2>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {item.tipo_formacion === 'FORMACION_REGULAR' ? 'Aprendiz ' : ''}
            <span className="text-gray-500">CC {item.numero_documento}</span> · <span className="text-gray-500">RH {item.rh || '—'}</span>
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Ficha <span className="font-medium">{item.ficha_numero}</span>
            <span className="text-gray-500"> — {item.programa}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.comprobantes.map((c) => (
              <button
                key={c.tipo}
                type="button"
                onClick={() => verComprobante(item.id, c.tipo)}
                className="btn-outline-primary px-2.5 py-1.5 text-xs"
              >
                <DocumentArrowDownIcon className="h-3.5 w-3.5" aria-hidden />
                {c.tipo === 'pago' ? 'Ver pago' : 'Ver demanda'}
              </button>
            ))}
            <button type="button" onClick={() => verZip(item.id)} className="btn-outline-primary px-2.5 py-1.5 text-xs">
              <PhotoIcon className="h-3.5 w-3.5" aria-hidden />
              ZIP
            </button>
            <button type="button" onClick={() => onVerFoto(item)} className="btn-outline-primary px-2.5 py-1.5 text-xs">
              <EyeIcon className="h-3.5 w-3.5" aria-hidden />
              Ver foto
            </button>
          </div>
        </div>
      </div>
      {item.motivo_rechazo ? (
        <p className="border-t border-gray-100 px-4 py-2 text-xs text-red-600 dark:border-gray-700">
          Devolución: {item.motivo_rechazo}
        </p>
      ) : null}
      {puedeDecidir ? (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row dark:border-gray-700 dark:bg-gray-800">
          <button type="button" className="btn-sena sm:flex-1" onClick={() => onAceptar(item)}>
            Aceptar solicitud
          </button>
          <button type="button" className="btn-outline-danger sm:flex-1" onClick={() => onDevolver(item)}>
            Devolver
          </button>
        </div>
      ) : renovable ? (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row dark:border-gray-700 dark:bg-gray-800">
          <button type="button" className="btn-sena sm:flex-1" onClick={() => onRenovar(item)}>
            Marcar como renovado (ya hecho)
          </button>
          <button type="button" className="btn-outline-primary sm:flex-1" onClick={avisar} disabled={avisado}>
            <BellIcon className="h-3.5 w-3.5" aria-hidden />
            {avisado ? 'Notificado ✓' : 'Notificar al aprendiz'}
          </button>
        </div>
      ) : null}
    </li>
  );
}