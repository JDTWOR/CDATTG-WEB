import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { EleccionMiRegional, EleccionPlancha, RepresentanteAprendiz } from '../../types/eleccion';

function planchaVotadaLabel(plancha: EleccionPlancha | undefined, miVotoPlanchaId?: number): string {
  if (plancha) return `${plancha.titular.nombre} / ${plancha.suplente.nombre}`;
  return `plancha #${miVotoPlanchaId}`;
}

type EleccionErrorAlertProps = Readonly<{ message: string }>;

function EleccionErrorAlert({ message }: EleccionErrorAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </div>
  );
}

type RepresentantesVigentesCardProps = Readonly<{ representantes: RepresentanteAprendiz }>;

function RepresentantesVigentesCard({ representantes }: RepresentantesVigentesCardProps) {
  return (
    <section className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/20">
      <h2 className="font-semibold text-primary-900 dark:text-primary-200">Representantes vigentes</h2>
      <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
        Titular: <strong>{representantes.titular.nombre}</strong>
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200">
        Suplente: <strong>{representantes.suplente.nombre}</strong>
      </p>
    </section>
  );
}

type ConfirmarPlanchasSectionProps = Readonly<{
  planchas: EleccionPlancha[];
  onConfirm: (planchaId: number) => Promise<void>;
}>;

function ConfirmarPlanchasSection({ planchas, onConfirm }: ConfirmarPlanchasSectionProps) {
  if (planchas.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">Confirmar plancha</h3>
      <p className="text-xs text-gray-500">
        Un compañero lo incluyó en una plancha. Confirme para completar la inscripción.
      </p>
      {planchas.map((pl) => (
        <button
          key={pl.id}
          type="button"
          className="btn-primary w-full text-left"
          onClick={() => void onConfirm(pl.id)}
        >
          Confirmar plancha #{pl.id} ({pl.titular.nombre} / {pl.suplente.nombre})
        </button>
      ))}
    </div>
  );
}

type PostularPlanchaSectionProps = Readonly<{
  procesoId: number;
  onSubmit: (payload: { rol_candidatura: 'titular' | 'suplente'; companero_aprendiz_id: number }) => Promise<void>;
}>;

function PostularPlanchaSection({ procesoId, onSubmit }: PostularPlanchaSectionProps) {
  const [rolCandidatura, setRolCandidatura] = useState<'titular' | 'suplente'>('titular');
  const [companeroId, setCompaneroId] = useState('');

  const handleSubmit = async () => {
    if (!companeroId) return;
    await onSubmit({
      rol_candidatura: rolCandidatura,
      companero_aprendiz_id: Number(companeroId),
    });
    setCompaneroId('');
  };

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-medium">Postular plancha</h3>
      <p className="text-xs text-gray-500">
        Solo puede inscribirse a sí mismo como titular o suplente. Su compañero deberá confirmar la plancha.
      </p>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`rol_candidatura_${procesoId}`}
            checked={rolCandidatura === 'titular'}
            onChange={() => setRolCandidatura('titular')}
          />
          {' '}
          Postularme como titular
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`rol_candidatura_${procesoId}`}
            checked={rolCandidatura === 'suplente'}
            onChange={() => setRolCandidatura('suplente')}
          />
          {' '}
          Postularme como suplente
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="input"
          placeholder={rolCandidatura === 'titular' ? 'ID aprendiz suplente' : 'ID aprendiz titular'}
          value={companeroId}
          onChange={(e) => setCompaneroId(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => void handleSubmit()}>
          Inscribir plancha
        </button>
      </div>
    </div>
  );
}

type VotoRegistradoSectionProps = Readonly<{
  label: string;
}>;

function VotoRegistradoSection({ label }: VotoRegistradoSectionProps) {
  return (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-medium">Su voto</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Voto registrado para: <strong>{label}</strong>
      </p>
      <p className="text-xs text-gray-500">El voto es único y no puede modificarse.</p>
    </div>
  );
}

type VotarSectionProps = Readonly<{
  planchas: EleccionPlancha[];
  votoPlanchaId: string;
  onVotoPlanchaIdChange: (value: string) => void;
  onSubmit: (planchaId: number) => Promise<void>;
}>;

function VotarSection({ planchas, votoPlanchaId, onVotoPlanchaIdChange, onSubmit }: VotarSectionProps) {
  const handleSubmit = async () => {
    if (!votoPlanchaId) return;
    await onSubmit(Number(votoPlanchaId));
  };

  return (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-medium">Votar</h3>
      <p className="text-xs text-gray-500">Voto transparente, único e irrevocable.</p>
      <select className="input w-full" value={votoPlanchaId} onChange={(e) => onVotoPlanchaIdChange(e.target.value)}>
        <option value="">Seleccione plancha</option>
        {planchas.map((pl) => (
          <option key={pl.id} value={pl.id}>
            {pl.titular.nombre} / {pl.suplente.nombre} ({pl.votos_recibidos ?? 0} votos)
          </option>
        ))}
      </select>
      <button type="button" className="btn-primary" onClick={() => void handleSubmit()}>
        Registrar voto
      </button>
    </div>
  );
}

type EleccionProcesoSectionProps = Readonly<{
  data: EleccionMiRegional;
  planchas: EleccionPlancha[];
  votoPlanchaId: string;
  onVotoPlanchaIdChange: (value: string) => void;
  onConfirmPlancha: (planchaId: number) => Promise<void>;
  onProponerPlancha: (payload: { rol_candidatura: 'titular' | 'suplente'; companero_aprendiz_id: number }) => Promise<void>;
  onRegistrarVoto: (planchaId: number) => Promise<void>;
}>;

function EleccionProcesoSection({
  data,
  planchas,
  votoPlanchaId,
  onVotoPlanchaIdChange,
  onConfirmPlancha,
  onProponerPlancha,
  onRegistrarVoto,
}: EleccionProcesoSectionProps) {
  const proceso = data.proceso;
  if (!proceso) return null;

  const votoRegistrado = data.ya_voto ?? Boolean(data.mi_voto_plancha_id);
  const planchaVotada = votoRegistrado
    ? planchas.find((pl) => pl.id === data.mi_voto_plancha_id)
    : undefined;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="font-semibold text-gray-900 dark:text-white">{proceso.nombre_ciclo}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Estado: {proceso.estado}</p>

      <ConfirmarPlanchasSection
        planchas={data.planchas_pendientes_confirmar ?? []}
        onConfirm={onConfirmPlancha}
      />

      {data.puede_postular ? (
        <PostularPlanchaSection procesoId={proceso.id} onSubmit={onProponerPlancha} />
      ) : null}

      {votoRegistrado ? (
        <VotoRegistradoSection label={planchaVotadaLabel(planchaVotada, data.mi_voto_plancha_id)} />
      ) : null}

      {data.puede_votar ? (
        <VotarSection
          planchas={planchas}
          votoPlanchaId={votoPlanchaId}
          onVotoPlanchaIdChange={onVotoPlanchaIdChange}
          onSubmit={onRegistrarVoto}
        />
      ) : null}
    </section>
  );
}

export function EleccionAprendizPage() {
  const [data, setData] = useState<EleccionMiRegional | null>(null);
  const [planchas, setPlanchas] = useState<EleccionPlancha[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [votoPlanchaId, setVotoPlanchaId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mi = await apiService.getEleccionMiRegional();
      setData(mi);
      if (mi.proceso?.id) {
        const pl = await apiService.getEleccionPlanchas(mi.proceso.id);
        setPlanchas(pl);
        if (mi.mi_voto_plancha_id) setVotoPlanchaId(String(mi.mi_voto_plancha_id));
      } else {
        setPlanchas([]);
      }
    } catch (e) {
      setError(axiosErrorMessage(e, 'Error al cargar la elección.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (action: () => Promise<void>, fallbackError: string) => {
      try {
        await action();
        await load();
      } catch (e) {
        setError(axiosErrorMessage(e, fallbackError));
      }
    },
    [load],
  );

  const handleConfirmPlancha = useCallback(
    (planchaId: number) =>
      runAction(async () => {
        await apiService.confirmarEleccionPlancha(planchaId);
      }, 'No se pudo confirmar la plancha.'),
    [runAction],
  );

  const handleProponerPlancha = useCallback(
    (payload: { rol_candidatura: 'titular' | 'suplente'; companero_aprendiz_id: number }) => {
      const procesoId = data?.proceso?.id;
      if (!procesoId) return Promise.resolve();
      return runAction(async () => {
        await apiService.proponerEleccionPlancha(procesoId, payload);
      }, 'No se pudo inscribir la plancha.');
    },
    [data?.proceso?.id, runAction],
  );

  const handleRegistrarVoto = useCallback(
    (planchaId: number) => {
      const procesoId = data?.proceso?.id;
      if (!procesoId) return Promise.resolve();
      return runAction(async () => {
        await apiService.registrarEleccionVoto(procesoId, { plancha_id: planchaId });
      }, 'No se pudo registrar el voto.');
    },
    [data?.proceso?.id, runAction],
  );

  if (loading) return <p className="text-gray-500">Cargando…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elección de representante</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Regional: {data?.regional_nombre ?? data?.regional_id}
        </p>
      </div>

      {error ? <EleccionErrorAlert message={error} /> : null}

      {data?.representantes_vigentes ? (
        <RepresentantesVigentesCard representantes={data.representantes_vigentes} />
      ) : null}

      {data?.proceso ? (
        <EleccionProcesoSection
          data={data}
          planchas={planchas}
          votoPlanchaId={votoPlanchaId}
          onVotoPlanchaIdChange={setVotoPlanchaId}
          onConfirmPlancha={handleConfirmPlancha}
          onProponerPlancha={handleProponerPlancha}
          onRegistrarVoto={handleRegistrarVoto}
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No hay elección activa en su regional.</p>
      )}
    </div>
  );
}
