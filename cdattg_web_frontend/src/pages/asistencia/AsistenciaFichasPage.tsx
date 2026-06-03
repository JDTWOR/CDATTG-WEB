import { useAsistenciaFichasCatalog } from './useAsistenciaFichasCatalog';
import { AsistenciaSinFichasView } from './AsistenciaSinFichasView';
import { AsistenciaFichasListView } from './AsistenciaFichasListView';

export function AsistenciaFichasPage() {
  const page = useAsistenciaFichasCatalog();

  if (page.showSinFichas) return <AsistenciaSinFichasView />;
  return <AsistenciaFichasListView page={page} />;
}
