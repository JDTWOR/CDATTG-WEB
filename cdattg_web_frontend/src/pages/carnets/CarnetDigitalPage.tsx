/**
 * El aprendiz crea o renueva el carnet eligiendo la ficha.
 * El instructor líder de esa ficha es quien lo valida.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bajarFotoCarnet, getMiCarnet, solicitarMiCarnet } from '../../services/carnetApi';
import { CarnetCara } from './CarnetCara';
import { CarnetEstadoAvisos } from './CarnetEstadoAvisos';
import { CarnetFichaSelect } from './CarnetFichaSelect';
import { CarnetReverso } from './CarnetReverso';
import { CarnetVideoBoton } from './CarnetVideoBoton';
import { puedeVerCarnetDigital } from './carnetAcceso';
import { fichaCarnetAprobado } from './carnetEstado';
import type { CarnetDigitalResponse } from '../../types/carnet';

/**
 * Cargo estado, dejo crear o renovar y voltear el carnet.
 */
export function CarnetDigitalPage() {
  const { roles, permissions } = useAuth();
  const puede = puedeVerCarnetDigital(roles, permissions);
  const [data, setData] = useState<CarnetDigitalResponse | null>(null);
  const [error, setError] = useState('');
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [reverso, setReverso] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const cargar = useCallback(() => {
    void getMiCarnet()
      .then((c) => {
        setData(c);
        setFichaId((id) => id ?? c.fichas[0]?.id ?? null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  useEffect(() => {
    if (puede) cargar();
  }, [puede, cargar]);

  useEffect(() => {
    const fichaSel = data?.fichas.find((f) => f.id === fichaId) ?? data?.fichas[0];
    if (!fichaSel || !fichaCarnetAprobado(fichaSel.estado_solicitud) || !data?.persona.tiene_foto) {
      setFotoUrl(null);
      return;
    }
    let revoke: string | null = null;
    void bajarFotoCarnet(fichaSel.id).then((blob) => {
      if (!blob) return;
      revoke = URL.createObjectURL(blob);
      setFotoUrl(revoke);
    });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [data, fichaId]);

  if (!puede) return <p className="p-6 text-sm text-gray-600">El carnet digital es solo para aprendices.</p>;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-6 text-sm text-gray-500">Cargando carnet…</p>;

  const ficha = data.fichas.find((f) => f.id === fichaId) ?? data.fichas[0];
  const enviar = () => {
    if (!ficha) return;
    void solicitarMiCarnet(ficha.id).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  };

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Carnet digital</h1>
      <CarnetFichaSelect fichas={data.fichas} fichaId={ficha?.id ?? 0} onChange={setFichaId} />
      <CarnetEstadoAvisos data={data} ficha={ficha} onEnviar={enviar} />
      {ficha && fichaCarnetAprobado(ficha.estado_solicitud) ? (
        <>
          {reverso ? <CarnetReverso ficha={ficha} /> : <CarnetCara persona={data.persona} ficha={ficha} fotoUrl={fotoUrl} />}
          <button type="button" className="btn-secondary w-full" onClick={() => setReverso((v) => !v)}>
            {reverso ? 'Ver cara' : 'Ver reverso'}
          </button>
          <CarnetVideoBoton persona={data.persona} ficha={ficha} fotoUrl={fotoUrl} />
        </>
      ) : null}
    </main>
  );
}
