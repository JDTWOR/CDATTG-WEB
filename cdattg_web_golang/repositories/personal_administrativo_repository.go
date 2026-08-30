// @module personal_administrativo_repository
// @description Acceso a datos de Personal Administrativo (listado paginado con JOIN a Persona y CRUD).
// @author JDTWOR
// @created 2026-08-14
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type PersonalAdministrativoRepository interface {
	FindAllPaginated(offset, limit int, search string) ([]models.PersonalAdministrativo, int64, error)
	FindByID(id uint) (*models.PersonalAdministrativo, error)
	FindByPersonaID(personaID uint) (*models.PersonalAdministrativo, error)
	Create(pa *models.PersonalAdministrativo) error
	Update(pa *models.PersonalAdministrativo) error
	Delete(id uint) error
}

type personalAdministrativoRepository struct {
	db *gorm.DB
}

func NewPersonalAdministrativoRepository() PersonalAdministrativoRepository {
	return &personalAdministrativoRepository{db: database.GetDB()}
}

func (r *personalAdministrativoRepository) FindAllPaginated(offset, limit int, search string) ([]models.PersonalAdministrativo, int64, error) {
	var list []models.PersonalAdministrativo
	joinClause := "LEFT JOIN personas ON personas.id = personal_administrativo.persona_id"
	q := r.db.Model(&models.PersonalAdministrativo{}).Joins(joinClause)
	q = applyPersonasSearch(q, search, "personas.")
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	findQuery := r.db.Joins(joinClause)
	findQuery = applyPersonasSearch(findQuery, search, "personas.")
	if err := findQuery.Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *personalAdministrativoRepository) FindByID(id uint) (*models.PersonalAdministrativo, error) {
	var m models.PersonalAdministrativo
	if err := r.db.Joins("Persona").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *personalAdministrativoRepository) FindByPersonaID(personaID uint) (*models.PersonalAdministrativo, error) {
	var m models.PersonalAdministrativo
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *personalAdministrativoRepository) Create(pa *models.PersonalAdministrativo) error {
	return r.db.Create(pa).Error
}

func (r *personalAdministrativoRepository) Update(pa *models.PersonalAdministrativo) error {
	return r.db.Save(pa).Error
}

func (r *personalAdministrativoRepository) Delete(id uint) error {
	return r.db.Delete(&models.PersonalAdministrativo{}, id).Error
}