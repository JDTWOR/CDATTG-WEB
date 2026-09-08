/**
 * Guardo y busco solicitudes de reposición de carnet físico.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// CarnetPerdidaRepository persiste las solicitudes de pérdida.
type CarnetPerdidaRepository interface {
	Create(s *models.CarnetPerdidaSolicitud) error
	Update(s *models.CarnetPerdidaSolicitud) error
	FindByID(id uint) (*models.CarnetPerdidaSolicitud, error)
	FindPendienteByPersona(personaID uint) (*models.CarnetPerdidaSolicitud, error)
	FindPorEstado(estado string, limit, offset int) ([]models.CarnetPerdidaSolicitud, int64, error)
	FindHistorialPorPersona(personaID uint) ([]models.CarnetPerdidaSolicitud, error)
}

type carnetPerdidaRepository struct {
	db *gorm.DB
}

// NewCarnetPerdidaRepository crea el repo.
func NewCarnetPerdidaRepository() CarnetPerdidaRepository {
	return &carnetPerdidaRepository{db: database.GetDB()}
}

func (r *carnetPerdidaRepository) Create(s *models.CarnetPerdidaSolicitud) error {
	return r.db.Create(s).Error
}

func (r *carnetPerdidaRepository) Update(s *models.CarnetPerdidaSolicitud) error {
	return r.db.Save(s).Error
}

func (r *carnetPerdidaRepository) FindByID(id uint) (*models.CarnetPerdidaSolicitud, error) {
	var s models.CarnetPerdidaSolicitud
	if err := r.db.First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

// FindPendienteByPersona evita que el aprendiz abra dos solicitudes a la vez.
func (r *carnetPerdidaRepository) FindPendienteByPersona(personaID uint) (*models.CarnetPerdidaSolicitud, error) {
	var s models.CarnetPerdidaSolicitud
	err := r.db.Where("persona_id = ? AND estado = ?", personaID, models.CarnetPerdidaEstadoPendiente).
		Order("id DESC").First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *carnetPerdidaRepository) FindPorEstado(estado string, limit, offset int) ([]models.CarnetPerdidaSolicitud, int64, error) {
	q := r.db.Model(&models.CarnetPerdidaSolicitud{}).Where("estado = ?", estado)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.CarnetPerdidaSolicitud
	err := r.db.Where("estado = ?", estado).Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *carnetPerdidaRepository) FindHistorialPorPersona(personaID uint) ([]models.CarnetPerdidaSolicitud, error) {
	var list []models.CarnetPerdidaSolicitud
	err := r.db.Where("persona_id = ?", personaID).Order("id DESC").Find(&list).Error
	return list, err
}
