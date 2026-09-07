/**
 * El instructor líder valida las solicitudes de carnet de su ficha.
 * Solo consulta el API si la sesión tiene el permiso; si no, muestra un aviso
 * para evitar un 403 en consola.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { decidirCarnet, listarCarnetsPendientes } from '../../../services/carnetApi';
import { mostrarToastApp } from '../../../utils/appToast';
import { CarnetPendienteFoto } from '../shared/CarnetPendienteFoto';
import { CarnetVistaDialog } from './CarnetVistaDialog';
import type { CarnetPendienteItem } from '../../../types/carnet';

const PERM_VALIDAR_CARNET = 'VALIDAR CARNET DIGITAL';

/**
 * Listo pendientes y dejo ver, aceptar o devolver.
 */
export function CarnetValidarPage() {
  const { hasPermission, loading } = useAuth();
  const puede = hasPermission(PERM_VALIDAR_CARNET);
  const [rows, setRows] = useState<CarnetPendienteItem[]>([]);
  const [error, setError] = useState('');
  const [verId, setVerId] = useState<number | null>(null);
  const [soloDevolver, setSoloDevolver] = useState(false);

  const cargar = useCallback(() => {
    void listarCarnetsPendientes().then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  useEffect(() => {
    if (puede) cargar();
  }, [puede, cargar]);

  const decidir = async (id: number, aprobar: boolean, motivo: string) => {
    try {
      await decidirCarnet(id, aprobar, motivo);
      setVerId(null);
      cargar();
      mostrarToastApp({
        icon: 'success',
        titulo: aprobar ? 'Carnet aceptado' : 'Carnet devuelto',
        texto: aprobar
          ? 'La solicitud quedó aprobada y el aprendiz fue notificado.'
          : `La solicitud quedó devuelta${motivo ? ` con motivo: ${motivo}` : ''} y el aprendiz fue notificado.`,
        timer: 3000,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p className="text-sm text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!puede) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Validar carnet</h1>
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          No tiene permiso para ver las solicitudes pendientes de carnet.
        </p>
      </main>
    );
  }

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
                <button type="button" className="btn-secondary" onClick={() => { setSoloDevolver(false); setVerId(r.id); }}>Ver</button>
                <button type="button" className="btn-sena" onClick={() => void decidir(r.id, true, '')}>Aceptar</button>
                <button type="button" className="btn-danger" onClick={() => { setSoloDevolver(true); setVerId(r.id); }}>Devolver</button>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {verId === null ? null : (
        <CarnetVistaDialog
          id={verId}
          soloDevolver={soloDevolver}
          onClose={() => setVerId(null)}
          onDecidir={(ok, m) => void decidir(verId, ok, m)}
        />
      )}
    </main>
  );
}
