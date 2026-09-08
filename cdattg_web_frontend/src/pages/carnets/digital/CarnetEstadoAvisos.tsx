/**
 * Aviso y botones de crear o renovar el carnet de la ficha elegida.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { fichaCarnetAprobado, fichaCarnetDevuelto, fichaCarnetPendiente } from './carnetEstado';
import type { CarnetDigitalResponse, CarnetFichaOpcion } from '../../../types/carnet';

type Props = Readonly<{
  data: CarnetDigitalResponse;
  ficha: CarnetFichaOpcion | undefined;
  onEnviar: () => void;
}>;

/**
 * Digo el estado y dejo enviar al instructor líder de esa ficha.
 */
export function CarnetEstadoAvisos({ data, ficha, onEnviar }: Props) {
  const estado = ficha?.estado_solicitud ?? data.estado_solicitud;
  const pendiente = fichaCarnetPendiente(estado);
  const devuelto = fichaCarnetDevuelto(estado);
  const datosListos = data.datos_listos;
  return (
    <aside className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      {data.motivo === 'sin_ficha_vigente' ? <p>No tiene ficha vigente. El carnet queda inhabilitado.</p> : null}
      {pendiente ? <p>El instructor líder de esta ficha está revisando su solicitud.</p> : null}
      {devuelto ? <p>Su solicitud fue devuelta. Actualice los datos y envíela de nuevo.</p> : null}
      {fichaCarnetAprobado(estado) ? (
        <p>Este carnet ya está creado para esta ficha. Si tiene otra ficha, selecciónela y pida su propio carnet.</p>
      ) : null}
      {estado === 'ninguna' && data.motivo !== 'sin_ficha_vigente' ? (
        datosListos ? (
          <p>Elija la ficha y el programa. Solo el instructor líder de esa ficha recibe la solicitud.</p>
        ) : (
          <p>
            Para crear el carnet primero edite su perfil y complete los datos requeridos (nombres, apellidos y
            RH) y luego tómese la foto en Mi perfil. Cuando esté listo aparecerá la opción de crearlo.
          </p>
        )
      ) : null}
      {ficha?.accion === 'crear' && datosListos ? (
        <button type="button" className="btn-sena" onClick={onEnviar}>Crear carnet digital</button>
      ) : null}
      {ficha?.accion === 'renovar' ? (
        <button type="button" className="btn-sena" onClick={onEnviar}>Renovar</button>
      ) : null}
    </aside>
  );
}
