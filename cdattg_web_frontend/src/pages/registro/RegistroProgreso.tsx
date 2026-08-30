/**
 * Esta es la barra que dice en qué paso va el registro (1 de 5, 2 de 5…).
 * La puse arriba del formulario para que la persona sepa cuánto le falta.
 * Los títulos salen de REGISTRO_TITULOS en registroForm.
 * @author Cristian Deysdayr Jiménez
 */
import { REGISTRO_TITULOS, TOTAL_PASOS } from './registroForm';

type Props = Readonly<{ paso: number }>;

/**
 * Muestra en qué paso está la persona (1 de 5) y el avance visual.
 * @param paso Índice 0–4 que manda el wizard
 * @returns Texto, barra y (en pantalla ancha) los cinco nombres
 */
export function RegistroProgreso({ paso }: Props) {
  // Por si llega un número raro: lo dejo entre 0 y el último paso.
  const actual = Math.min(Math.max(paso, 0), TOTAL_PASOS - 1);
  const titulo = REGISTRO_TITULOS[actual];
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-sena-dark dark:text-gray-200">
        Paso {actual + 1} de {TOTAL_PASOS}
        {' · '}
        {titulo}
      </p>
      <progress
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-primary-600 dark:[&::-webkit-progress-bar]:bg-gray-700"
        max={TOTAL_PASOS}
        value={actual + 1}
        aria-label={`Paso ${actual + 1} de ${TOTAL_PASOS}: ${titulo}`}
      />
      {/* En celular oculto los nombres para no apretar; en sm+ los muestro. */}
      <ol className="hidden justify-between gap-1 text-[11px] text-gray-500 sm:flex dark:text-gray-400">
        {REGISTRO_TITULOS.map((t, i) => (
          <li key={t} className={i === actual ? 'font-semibold text-primary-700 dark:text-primary-300' : undefined}>
            {t}
          </li>
        ))}
      </ol>
    </div>
  );
}
