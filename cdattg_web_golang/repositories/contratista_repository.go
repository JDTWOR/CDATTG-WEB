// @module contratista_repository
// @description Acceso a datos de Contratistas de Prestación de Servicios (listado paginado y CRUD).
// @author JDTWOR
// @created 2026-08-15
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type ContratistaRepository interface {
	FindAllPaginated(offset, limit int, search string) ([]models.Contratista, int64, error)
	FindByID(id uint) (*models.Contratista, error)
	FindByPersonaID(personaID uint) (*models.Contratista, error)
	Create(m *models.Contratista) error
	Update(m *models.Contratista) error
	Delete(id uint) error
}

type contratistaRepository struct {
	db *gorm.DB
}

func NewContratistaRepository() ContratistaRepository {
	return &contratistaRepository{db: database.GetDB()}
}

func (r *contratistaRepository) FindAllPaginated(offset, limit int, search string) ([]models.Contratista, int64, error) {
	var list []models.Contratista
	joinClause := "LEFT JOIN personas ON personas.id = contratistas.persona_id"
	q := r.db.Model(&models.Contratista{}).Joins(joinClause)
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

func (r *contratistaRepository) FindByID(id uint) (*models.Contratista, error) {
	var m models.Contratista
	if err := r.db.Joins("Persona").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *contratistaRepository) FindByPersonaID(personaID uint) (*models.Contratista, error) {
	var m models.Contratista
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *contratistaRepository) Create(m *models.Contratista) error {
	return r.db.Create(m).Error
}

func (r *contratistaRepository) Update(m *models.Contratista) error {
	return r.db.Save(m).Error
}

func (r *contratistaRepository) Delete(id uint) error {
	return r.db.Delete(&models.Contratista{}, id).Error
}