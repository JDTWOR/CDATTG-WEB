/**
 * Biblioteca mira los carnets regulares que el instructor líder ya validó.
 * Solo ve datos y foto; no acepta ni devuelve.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { listarCarnetsBiblioteca } from '../../services/carnetApi';
import type { CarnetBibliotecaItem, CarnetBibliotecaResponse } from '../../types/carnet';
import { CarnetBibliotecaFila } from './CarnetBibliotecaFila';
import { CarnetBibliotecaFiltro } from './CarnetBibliotecaFiltro';
import { CarnetBibliotecaFotoDialog } from './CarnetBibliotecaFotoDialog';
import { filtrarItemsBiblioteca } from './carnetBiblioteca';
import { descargarExcelBiblioteca } from './carnetBibliotecaExcel';

/**
 * Cargo el catálogo, filtro por ficha y listo las personas.
 */
export function CarnetBibliotecaPage() {
  const [data, setData] = useState<CarnetBibliotecaResponse>({ fichas: [], items: [] });
  const [fichaId, setFichaId] = useState(0);
  const [error, setError] = useState('');
  const [ver, setVer] = useState<CarnetBibliotecaItem | null>(null);
  const visibles = filtrarItemsBiblioteca(data.items, fichaId);

  useEffect(() => {
    void listarCarnetsBiblioteca()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Carnets regulares</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Solo formación regular. Aquí están los aprendices cuyo instructor líder ya validó el carnet.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <CarnetBibliotecaFiltro fichas={data.fichas} fichaId={fichaId} onChange={setFichaId} />
      <button
        type="button"
        className="btn-sena w-full"
        disabled={visibles.length === 0}
        onClick={() => void descargarExcelBiblioteca(fichaId)}
      >
        Descargar Excel
      </button>
      {visibles.length === 0 ? <p className="text-sm text-gray-500">No hay carnets validados en esta ficha.</p> : null}
      <ul className="space-y-3">
        {visibles.map((item) => (
          <li key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
            <CarnetBibliotecaFila item={item} onVerFoto={setVer} />
          </li>
        ))}
      </ul>
      {ver ? (
        <CarnetBibliotecaFotoDialog
          id={ver.id}
          nombre={`${ver.nombres} ${ver.apellidos}`.trim()}
          onClose={() => setVer(null)}
        />
      ) : null}
    </main>
  );
}
