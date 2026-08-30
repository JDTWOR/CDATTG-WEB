/**
 * Guardo y busco solicitudes de carnet digital.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// CarnetSolicitudRepository persiste solicitudes.
type CarnetSolicitudRepository interface {
	FindPendienteByPersonaFicha(personaID, fichaID uint) (*models.CarnetSolicitud, error)
	FindUltimaAprobadaByPersonaID(personaID uint) (*models.CarnetSolicitud, error)
	FindUltimaAprobadaByPersonaFicha(personaID, fichaID uint) (*models.CarnetSolicitud, error)
	FindUltimasPorPersona(personaID uint) (map[uint]models.CarnetSolicitud, error)
	FindByID(id uint) (*models.CarnetSolicitud, error)
	FindPendientesDeFichas(fichaIDs []uint) ([]models.CarnetSolicitud, error)
	FindFichaIDsDeLider(instructorID uint) ([]uint, error)
	FindAprobadosRegular() ([]models.CarnetSolicitud, error)
	FindAprobadoRegularPorDocumento(documento string) (*models.CarnetSolicitud, error)
	FindNombresLiderPorFicha(fichaIDs []uint) (map[uint]string, error)
	FindPersonasPorIDs(ids []uint) (map[uint]models.Persona, error)
	Create(s *models.CarnetSolicitud) error
	Update(s *models.CarnetSolicitud) error
}

const orderCarnetIDDesc = "id DESC"

type carnetSolicitudRepository struct {
	db *gorm.DB
}

// NewCarnetSolicitudRepository crea el repo.
func NewCarnetSolicitudRepository() CarnetSolicitudRepository {
	return &carnetSolicitudRepository{db: database.GetDB()}
}

func (r *carnetSolicitudRepository) FindPendienteByPersonaFicha(personaID, fichaID uint) (*models.CarnetSolicitud, error) {
	var s models.CarnetSolicitud
	err := r.db.Where("persona_id = ? AND ficha_id = ? AND estado = ?", personaID, fichaID, models.CarnetEstadoPendiente).
		Order(orderCarnetIDDesc).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *carnetSolicitudRepository) FindUltimaAprobadaByPersonaID(personaID uint) (*models.CarnetSolicitud, error) {
	var s models.CarnetSolicitud
	err := r.db.Where("persona_id = ? AND estado = ?", personaID, models.CarnetEstadoAprobado).
		Order(orderCarnetIDDesc).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *carnetSolicitudRepository) FindUltimaAprobadaByPersonaFicha(personaID, fichaID uint) (*models.CarnetSolicitud, error) {
	var s models.CarnetSolicitud
	err := r.db.Where("persona_id = ? AND ficha_id = ? AND estado = ?", personaID, fichaID, models.CarnetEstadoAprobado).
		Order(orderCarnetIDDesc).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *carnetSolicitudRepository) FindUltimasPorPersona(personaID uint) (map[uint]models.CarnetSolicitud, error) {
	var list []models.CarnetSolicitud
	err := r.db.Where("persona_id = ?", personaID).Order(orderCarnetIDDesc).Find(&list).Error
	out := map[uint]models.CarnetSolicitud{}
	for i := range list {
		if _, ok := out[list[i].FichaID]; !ok {
			out[list[i].FichaID] = list[i]
		}
	}
	return out, err
}

func (r *carnetSolicitudRepository) FindByID(id uint) (*models.CarnetSolicitud, error) {
	var s models.CarnetSolicitud
	if err := r.db.First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *carnetSolicitudRepository) FindPendientesDeFichas(fichaIDs []uint) ([]models.CarnetSolicitud, error) {
	if len(fichaIDs) == 0 {
		return nil, nil
	}
	var list []models.CarnetSolicitud
	err := r.db.Where("estado = ? AND ficha_id IN ?", models.CarnetEstadoPendiente, fichaIDs).
		Order("id ASC").Find(&list).Error
	return list, err
}

func (r *carnetSolicitudRepository) FindFichaIDsDeLider(instructorID uint) ([]uint, error) {
	var ids []uint
	err := r.db.Model(&models.FichaCaracterizacion{}).
		Where("instructor_id = ?", instructorID).
		Pluck("id", &ids).Error
	return ids, err
}

func (r *carnetSolicitudRepository) Create(s *models.CarnetSolicitud) error {
	return r.db.Create(s).Error
}

func (r *carnetSolicitudRepository) Update(s *models.CarnetSolicitud) error {
	return r.db.Save(s).Error
}
