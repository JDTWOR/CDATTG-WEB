/**
 * repositories: banners y presentación del portal.
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// PortalRepository banners y presentación.
type PortalRepository interface {
	ListarBanners() ([]models.PortalBanner, error)
	BuscarBanner(id uint) (*models.PortalBanner, error)
	CrearBanner(row *models.PortalBanner) error
	GuardarBanner(row *models.PortalBanner) error
	EliminarBanner(id uint) error
	ObtenerPresentacion() (*models.PortalPresentacion, error)
	GuardarPresentacion(row *models.PortalPresentacion) error
}

type portalRepository struct{ db *gorm.DB }

// NewPortalRepository constructor.
func NewPortalRepository() PortalRepository {
	return &portalRepository{db: database.GetDB()}
}

func (r *portalRepository) ListarBanners() ([]models.PortalBanner, error) {
	var rows []models.PortalBanner
	err := r.db.Order("orden asc, id asc").Find(&rows).Error
	return rows, err
}

func (r *portalRepository) BuscarBanner(id uint) (*models.PortalBanner, error) {
	var row models.PortalBanner
	if err := r.db.First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *portalRepository) CrearBanner(row *models.PortalBanner) error {
	return r.db.Create(row).Error
}

func (r *portalRepository) GuardarBanner(row *models.PortalBanner) error {
	return r.db.Save(row).Error
}

func (r *portalRepository) EliminarBanner(id uint) error {
	return r.db.Delete(&models.PortalBanner{}, id).Error
}

func (r *portalRepository) ObtenerPresentacion() (*models.PortalPresentacion, error) {
	var row models.PortalPresentacion
	err := r.db.Order("id asc").First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *portalRepository) GuardarPresentacion(row *models.PortalPresentacion) error {
	if row.ID == 0 {
		return r.db.Create(row).Error
	}
	return r.db.Save(row).Error
}
