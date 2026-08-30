// @module personal_operativo_apoyo_repository
// @description Acceso a datos de Personal Operativo y de Apoyo (listado paginado con JOIN a Persona y CRUD).
// @author JDTWOR
// @created 2026-08-14
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type PersonalOperativoApoyoRepository interface {
	FindAllPaginated(offset, limit int, search string) ([]models.PersonalOperativoApoyo, int64, error)
	FindByID(id uint) (*models.PersonalOperativoApoyo, error)
	FindByPersonaID(personaID uint) (*models.PersonalOperativoApoyo, error)
	Create(m *models.PersonalOperativoApoyo) error
	Update(m *models.PersonalOperativoApoyo) error
	Delete(id uint) error
}

type personalOperativoApoyoRepository struct {
	db *gorm.DB
}

func NewPersonalOperativoApoyoRepository() PersonalOperativoApoyoRepository {
	return &personalOperativoApoyoRepository{db: database.GetDB()}
}

func (r *personalOperativoApoyoRepository) FindAllPaginated(offset, limit int, search string) ([]models.PersonalOperativoApoyo, int64, error) {
	var list []models.PersonalOperativoApoyo
	joinClause := "LEFT JOIN personas ON personas.id = personal_operativo_apoyo.persona_id"
	q := r.db.Model(&models.PersonalOperativoApoyo{}).Joins(joinClause)
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

func (r *personalOperativoApoyoRepository) FindByID(id uint) (*models.PersonalOperativoApoyo, error) {
	var m models.PersonalOperativoApoyo
	if err := r.db.Joins("Persona").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *personalOperativoApoyoRepository) FindByPersonaID(personaID uint) (*models.PersonalOperativoApoyo, error) {
	var m models.PersonalOperativoApoyo
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *personalOperativoApoyoRepository) Create(m *models.PersonalOperativoApoyo) error {
	return r.db.Create(m).Error
}

func (r *personalOperativoApoyoRepository) Update(m *models.PersonalOperativoApoyo) error {
	return r.db.Save(m).Error
}

func (r *personalOperativoApoyoRepository) Delete(id uint) error {
	return r.db.Delete(&models.PersonalOperativoApoyo{}, id).Error
}