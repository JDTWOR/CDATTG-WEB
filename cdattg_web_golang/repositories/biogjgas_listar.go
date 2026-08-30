/**
 * repositories: listados y bajas por tipo BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import "github.com/sena/cdattg-web-golang/models"

// ListarRevistas ediciones de revista.
func (r *BiogjgasRepository) ListarRevistas(pub bool) ([]models.BiogjgasRevista, error) {
	var rows []models.BiogjgasRevista
	return rows, r.listar(&rows, pub)
}

// ListarBoletines boletines del área.
func (r *BiogjgasRepository) ListarBoletines(pub bool) ([]models.BiogjgasBoletin, error) {
	var rows []models.BiogjgasBoletin
	return rows, r.listar(&rows, pub)
}

// ListarPodcasts episodios.
func (r *BiogjgasRepository) ListarPodcasts(pub bool) ([]models.BiogjgasPodcast, error) {
	var rows []models.BiogjgasPodcast
	return rows, r.listar(&rows, pub)
}

// ListarConvocatorias convocatorias.
func (r *BiogjgasRepository) ListarConvocatorias(pub bool) ([]models.BiogjgasConvocatoria, error) {
	var rows []models.BiogjgasConvocatoria
	return rows, r.listar(&rows, pub)
}

// ListarActividades actividades.
func (r *BiogjgasRepository) ListarActividades(pub bool) ([]models.BiogjgasActividad, error) {
	var rows []models.BiogjgasActividad
	return rows, r.listar(&rows, pub)
}

// ListarBanners banners del home de investigación.
func (r *BiogjgasRepository) ListarBanners(pub bool) ([]models.BiogjgasBanner, error) {
	var rows []models.BiogjgasBanner
	return rows, r.listar(&rows, pub)
}

// Crear inserta un modelo editorial.
func (r *BiogjgasRepository) Crear(row any) error { return r.crear(row) }

// Guardar actualiza un modelo editorial.
func (r *BiogjgasRepository) Guardar(row any) error { return r.guardar(row) }

// Buscar carga por id.
func (r *BiogjgasRepository) Buscar(dest any, id uint) error { return r.buscar(dest, id) }

// Eliminar baja lógica.
func (r *BiogjgasRepository) Eliminar(model any, id uint) error { return r.eliminar(model, id) }

// RevistaPorSlug busca una edición por slug.
func (r *BiogjgasRepository) RevistaPorSlug(slug string) (*models.BiogjgasRevista, error) {
	return r.buscarRevistaSlug(slug)
}
