package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type PersonaCambioPendienteRepository interface {
	Create(cambio *models.PersonaCambioPendiente) error
	FindByID(id uint) (*models.PersonaCambioPendiente, error)
	FindByPersonaID(personaID uint) (*models.PersonaCambioPendiente, error)
	ListarPendientes() ([]models.PersonaCambioPendiente, error)
	Aprobar(id uint, validadorID uint) error
	Rechazar(id uint, validadorID uint, motivo string) error
}

type personaCambioPendienteRepository struct {
	db *gorm.DB
}

func NewPersonaCambioPendienteRepository() PersonaCambioPendienteRepository {
	return &personaCambioPendienteRepository{db: database.GetDB()}
}

func (r *personaCambioPendienteRepository) Create(cambio *models.PersonaCambioPendiente) error {
	return r.db.Create(cambio).Error
}

func (r *personaCambioPendienteRepository) FindByID(id uint) (*models.PersonaCambioPendiente, error) {
	var cambio models.PersonaCambioPendiente
	if err := r.db.Preload("Persona").First(&cambio, id).Error; err != nil {
		return nil, err
	}
	return &cambio, nil
}

func (r *personaCambioPendienteRepository) FindByPersonaID(personaID uint) (*models.PersonaCambioPendiente, error) {
	var cambio models.PersonaCambioPendiente
	if err := r.db.Where("persona_id = ? AND estado = ?", personaID, "pendiente").First(&cambio).Error; err != nil {
		return nil, err
	}
	return &cambio, nil
}

func (r *personaCambioPendienteRepository) ListarPendientes() ([]models.PersonaCambioPendiente, error) {
	var cambios []models.PersonaCambioPendiente
	if err := r.db.Preload("Persona").Where("estado = ?", "pendiente").Order("created_at DESC").Find(&cambios).Error; err != nil {
		return nil, err
	}
	return cambios, nil
}

func (r *personaCambioPendienteRepository) Aprobar(id uint, validadorID uint) error {
	return r.db.Model(&models.PersonaCambioPendiente{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"estado":      "aprobado",
			"validador_id": validadorID,
			"validado_en":  gorm.Expr("NOW()"),
		}).Error
}

func (r *personaCambioPendienteRepository) Rechazar(id uint, validadorID uint, motivo string) error {
	return r.db.Model(&models.PersonaCambioPendiente{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"estado":         "rechazado",
			"validador_id":   validadorID,
			"validado_en":    gorm.Expr("NOW()"),
			"motivo_rechazo": motivo,
		}).Error
}
