/**
 * El bibliotecario (o super administrador) revisa las reposiciones de carnet.
 * Cada solicitud se muestra con la foto y los datos el aprendiz, como en un
 * carnet regular, con sus comprobantes y la decisión (acepta y pasa a espera de
 * renovación física, o devuelve con motivo). Al entregar el carnet renovado se
 * marca como renovado y cae en la pestaña Historial.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  decidirSolicitudPerdida,
  listarRevisionesPerdida,
  notificarDisponiblePerdida,
  renovarSolicitudPerdida,
} from '../../../services/carnetPerdidaApi';
import type { CarnetPerdidaRevision } from '../../../types/carnetPerdida';
import { CarnetPerdidaDecisionModal } from './CarnetPerdidaDecisionModal';
import { CarnetPerdidaFotoDialog } from './CarnetPerdidaFotoDialog';
import { CarnetPerdidaRevisionCard } from './CarnetPerdidaRevisionCard';

type Pestania = 'pendiente' | 'en_espera_renovacion_digital' | 'devuelto' | 'renovado';
type Accion = 'aceptar' | 'devolver' | 'renovar';
type Decision = { item: CarnetPerdidaRevision; accion: Accion };

const PESTANIAS: ReadonlyArray<{ id: Pestania; label: string }> = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'en_espera_renovacion_digital', label: 'En espera de renovación física' },
  { id: 'devuelto', label: 'Devueltas' },
  { id: 'renovado', label: 'Historial' },
];

export function CarnetPerdidaRevisionPage() {
  const [pestania, setPestania] = useState<Pestania>('pendiente');
  const [items, setItems] = useState<CarnetPerdidaRevision[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [verFoto, setVerFoto] = useState<CarnetPerdidaRevision | null>(null);
  const [enviando, setEnviando] = useState(false);
  const peticionRef = useRef(0);

  const cargar = useCallback((est: Pestania) => {
    const peticion = ++peticionRef.current;
    setCargando(true);
    void listarRevisionesPerdida(est)
      .then((r) => { if (peticion === peticionRef.current) setItems(r.items); })
      .catch((e: unknown) => { if (peticion === peticionRef.current) setError(e instanceof Error ? e.message : 'Error'); })
      .finally(() => { if (peticion === peticionRef.current) setCargando(false); });
  }, []);

  useEffect(() => cargar(pestania), [pestania, cargar]);

  const cambiarPestania = (p: Pestania) => {
    if (p === pestania) return;
    peticionRef.current++;
    setItems([]);
    setPestania(p);
  };

  const decidir = async (accion: Accion, motivo: string) => {
    if (!decision) return;
    try {
      setEnviando(true);
      setError('');
      if (accion === 'renovar') {
        await renovarSolicitudPerdida(decision.item.id);
      } else {
        await decidirSolicitudPerdida(decision.item.id, accion === 'aceptar', motivo);
      }
      setDecision(null);
      cargar(pestania);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setEnviando(false);
    }
  };

  const notificar = (r: CarnetPerdidaRevision) => {
    setError('');
    return notificarDisponiblePerdida(r.id);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reposición de carnet por pérdida</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Valide los comprobantes, acepte para esperar la renovación física y márquela renovada al entregar.</p>
      </header>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p> : null}

      <div role="tablist" className="flex flex-wrap gap-2">
        {PESTANIAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestania === p.id}
            onClick={() => cambiarPestania(p.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${pestania === p.id ? 'bg-primary-800 text-white shadow-sm' : 'btn-outline-primary'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No hay solicitudes en este apartado.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <CarnetPerdidaRevisionCard
              key={r.id}
              item={r}
              puedeDecidir={pestania === 'pendiente'}
              renovable={pestania === 'en_espera_renovacion_digital'}
              onAceptar={(it) => setDecision({ item: it, accion: 'aceptar' })}
              onDevolver={(it) => setDecision({ item: it, accion: 'devolver' })}
              onRenovar={(it) => setDecision({ item: it, accion: 'renovar' })}
              onNotificar={notificar}
              onVerFoto={setVerFoto}
            />
          ))}
        </ul>
      )}

      {decision ? (
        <CarnetPerdidaDecisionModal
          key={`${decision.item.id}-${decision.accion}`}
          item={decision.item}
          accion={decision.accion}
          loading={enviando}
          onConfirmar={(accion, motivo) => void decidir(accion, motivo)}
          onCerrar={() => setDecision(null)}
        />
      ) : null}
      {verFoto ? (
        <CarnetPerdidaFotoDialog
          key={verFoto.id}
          id={verFoto.id}
          nombre={`${verFoto.nombres} ${verFoto.apellidos}`}
          onClose={() => setVerFoto(null)}
        />
      ) : null}
    </main>
  );
}