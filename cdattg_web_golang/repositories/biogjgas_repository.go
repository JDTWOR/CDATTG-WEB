/**
 * repositories: persistencia de contenidos BIOGIGAS por tipo.
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// BiogjgasRepository lecturas y escrituras genéricas por modelo.
type BiogjgasRepository struct{ db *gorm.DB }

// NewBiogjgasRepository constructor.
func NewBiogjgasRepository() *BiogjgasRepository {
	return &BiogjgasRepository{db: database.GetDB()}
}

func (r *BiogjgasRepository) listar(dest any, soloPublicados bool) error {
	q := r.db.Order("orden asc, id desc")
	if soloPublicados {
		q = q.Where("estado_publicacion = ?", models.PortalEstadoPublicado)
	}
	return q.Find(dest).Error
}

func (r *BiogjgasRepository) buscar(dest any, id uint) error {
	return r.db.First(dest, id).Error
}

func (r *BiogjgasRepository) crear(row any) error { return r.db.Create(row).Error }

func (r *BiogjgasRepository) guardar(row any) error { return r.db.Save(row).Error }

func (r *BiogjgasRepository) eliminar(model any, id uint) error {
	return r.db.Delete(model, id).Error
}

func (r *BiogjgasRepository) buscarRevistaSlug(slug string) (*models.BiogjgasRevista, error) {
	var row models.BiogjgasRevista
	err := r.db.Where("slug = ?", slug).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *BiogjgasRepository) listarBanners() ([]models.BiogjgasBanner, error) {
	var rows []models.BiogjgasBanner
	err := r.listar(&rows, false)
	return rows, err
}
