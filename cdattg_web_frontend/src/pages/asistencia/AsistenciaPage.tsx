import { useAsistenciaPage } from './useAsistenciaPage';
import { AsistenciaSinFichasView } from './AsistenciaSinFichasView';
import { AsistenciaTomarSesionView } from './AsistenciaTomarSesionView';
import { AsistenciaFichasListView } from './AsistenciaFichasListView';

export const Asistencia = () => {
  const page = useAsistenciaPage();

  if (page.showSinFichas) return <AsistenciaSinFichasView />;
  if (page.showTomarSesion) return <AsistenciaTomarSesionView page={page} />;
  return <AsistenciaFichasListView page={page} />;
};
