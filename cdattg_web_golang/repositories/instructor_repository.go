package repositories

import (
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type InstructorRepository interface {
	FindAll() ([]models.Instructor, error)
	FindAllPaginated(offset, limit int, search string) ([]models.Instructor, int64, error)
	FindByID(id uint) (*models.Instructor, error)
	FindByPersonaID(personaID uint) (*models.Instructor, error)
	Create(instructor *models.Instructor) error
	Update(instructor *models.Instructor) error
	Delete(id uint) error
}

type instructorRepository struct {
	db *gorm.DB
}

func NewInstructorRepository() InstructorRepository {
	return &instructorRepository{db: database.GetDB()}
}

func (r *instructorRepository) FindAll() ([]models.Instructor, error) {
	var list []models.Instructor
	// Joins("Persona") asegura cargar persona en la misma consulta; documento y nombre vienen de Persona
	if err := r.db.Joins("Persona").Preload("Regional").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// applyPersonasSearch aplica búsqueda por varias palabras: cada palabra debe coincidir en al menos un campo (AND de ORs).
func applyPersonasSearch(q *gorm.DB, search string, prefix string) *gorm.DB {
	words := strings.Fields(strings.TrimSpace(search))
	if len(words) == 0 {
		return q
	}
	likeClause := prefix + "primer_nombre ILIKE ? OR " + prefix + "segundo_nombre ILIKE ? OR " + prefix + "primer_apellido ILIKE ? OR " + prefix + "segundo_apellido ILIKE ? OR " + prefix + "numero_documento ILIKE ?"
	for _, word := range words {
		term := "%" + word + "%"
		q = q.Where("("+likeClause+")", term, term, term, term, term)
	}
	return q
}

func (r *instructorRepository) FindAllPaginated(offset, limit int, search string) ([]models.Instructor, int64, error) {
	var list []models.Instructor
	joinClause := "LEFT JOIN personas ON personas.id = instructors.persona_id"
	q := r.db.Model(&models.Instructor{}).Joins(joinClause)
	q = applyPersonasSearch(q, search, "personas.")
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	findQuery := r.db.Joins(joinClause).Preload("Regional")
	findQuery = applyPersonasSearch(findQuery, search, "personas.")
	if err := findQuery.Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *instructorRepository) FindByID(id uint) (*models.Instructor, error) {
	var m models.Instructor
	if err := r.db.Joins("Persona").Preload("Regional").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *instructorRepository) FindByPersonaID(personaID uint) (*models.Instructor, error) {
	var m models.Instructor
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *instructorRepository) Create(instructor *models.Instructor) error {
	return r.db.Create(instructor).Error
}

func (r *instructorRepository) Update(instructor *models.Instructor) error {
	return r.db.Save(instructor).Error
}

func (r *instructorRepository) Delete(id uint) error {
	return r.db.Delete(&models.Instructor{}, id).Error
}
