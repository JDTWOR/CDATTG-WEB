/**
 * Botones de editar datos y tomar foto, juntos para que se vean.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{
  show: boolean;
  onEdit: () => void;
  onFoto: () => void;
}>;

/**
 * Pinto Editar datos y Tomar foto de perfil uno al lado del otro.
 */
export function PerfilAcciones({ show, onEdit, onFoto }: Props) {
  if (!show) return null;
  return (
    <div className="flex flex-wrap gap-2 self-start">
      <button type="button" onClick={onEdit} className="btn-primary inline-flex items-center justify-center gap-2">
        <PencilSquareIcon className="h-5 w-5" />
        Editar datos
      </button>
      <button type="button" onClick={onFoto} className="btn-sena inline-flex items-center justify-center gap-2">
        <CameraIcon className="h-5 w-5" />
        Tomar foto de perfil
      </button>
    </div>
  );
}
