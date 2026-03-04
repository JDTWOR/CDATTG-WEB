package repositories

import (
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type AprendizRepository interface {
	FindByID(id uint) (*models.Aprendiz, error)
	FindByFichaID(fichaID uint) ([]models.Aprendiz, error)
	FindByPersonaIDAndFichaID(personaID, fichaID uint) (*models.Aprendiz, error)
	FindByPersonaID(personaID uint) (*models.Aprendiz, error)
	FindAll(page, pageSize int, fichaID *uint, search string) ([]models.Aprendiz, int64, error)
	Create(a *models.Aprendiz) error
	Update(a *models.Aprendiz) error
	Delete(id uint) error
}

type aprendizRepository struct {
	db *gorm.DB
}

func NewAprendizRepository() AprendizRepository {
	return &aprendizRepository{db: database.GetDB()}
}

func (r *aprendizRepository) FindByID(id uint) (*models.Aprendiz, error) {
	var a models.Aprendiz
	if err := r.db.Preload("Persona").Preload("FichaCaracterizacion.ProgramaFormacion").Preload("FichaCaracterizacion.Sede.Regional").First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *aprendizRepository) FindByFichaID(fichaID uint) ([]models.Aprendiz, error) {
	var list []models.Aprendiz
	if err := r.db.Where("ficha_caracterizacion_id = ?", fichaID).Preload("Persona").Preload("FichaCaracterizacion.ProgramaFormacion").Preload("FichaCaracterizacion.Sede.Regional").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *aprendizRepository) FindByPersonaIDAndFichaID(personaID, fichaID uint) (*models.Aprendiz, error) {
	var a models.Aprendiz
	if err := r.db.Where("persona_id = ? AND ficha_caracterizacion_id = ?", personaID, fichaID).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *aprendizRepository) FindByPersonaID(personaID uint) (*models.Aprendiz, error) {
	var a models.Aprendiz
	if err := r.db.Where("persona_id = ?", personaID).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// applyAprendizSearch aplica búsqueda por varias palabras: cada palabra debe coincidir en al menos un campo.
func applyAprendizSearch(q *gorm.DB, search string) *gorm.DB {
	words := strings.Fields(strings.TrimSpace(search))
	if len(words) == 0 {
		return q
	}
	likeClause := "personas.numero_documento ILIKE ? OR personas.primer_nombre ILIKE ? OR personas.segundo_nombre ILIKE ? OR personas.primer_apellido ILIKE ? OR personas.segundo_apellido ILIKE ? OR fichas_caracterizacion.ficha ILIKE ? OR programas_formacion.nombre ILIKE ?"
	for _, word := range words {
		term := "%" + word + "%"
		q = q.Where("("+likeClause+")", term, term, term, term, term, term, term)
	}
	return q
}

func (r *aprendizRepository) FindAll(page, pageSize int, fichaID *uint, search string) ([]models.Aprendiz, int64, error) {
	var list []models.Aprendiz
	var total int64
	search = strings.TrimSpace(search)
	q := r.db.Model(&models.Aprendiz{})
	if fichaID != nil && *fichaID > 0 {
		q = q.Where("aprendices.ficha_caracterizacion_id = ?", *fichaID)
	}
	if search != "" {
		q = q.Joins("LEFT JOIN personas ON personas.id = aprendices.persona_id").
			Joins("LEFT JOIN fichas_caracterizacion ON fichas_caracterizacion.id = aprendices.ficha_caracterizacion_id").
			Joins("LEFT JOIN programas_formacion ON programas_formacion.id = fichas_caracterizacion.programa_formacion_id")
		q = applyAprendizSearch(q, search)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	findQ := r.db.Model(&models.Aprendiz{}).Preload("Persona").Preload("FichaCaracterizacion.ProgramaFormacion").Preload("FichaCaracterizacion.Sede.Regional")
	if fichaID != nil && *fichaID > 0 {
		findQ = findQ.Where("aprendices.ficha_caracterizacion_id = ?", *fichaID)
	}
	if search != "" {
		findQ = findQ.Joins("LEFT JOIN personas ON personas.id = aprendices.persona_id").
			Joins("LEFT JOIN fichas_caracterizacion ON fichas_caracterizacion.id = aprendices.ficha_caracterizacion_id").
			Joins("LEFT JOIN programas_formacion ON programas_formacion.id = fichas_caracterizacion.programa_formacion_id")
		findQ = applyAprendizSearch(findQ, search)
	}
	if err := findQ.Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *aprendizRepository) Create(a *models.Aprendiz) error {
	return r.db.Create(a).Error
}

func (r *aprendizRepository) Update(a *models.Aprendiz) error {
	return r.db.Save(a).Error
}

func (r *aprendizRepository) Delete(id uint) error {
	return r.db.Delete(&models.Aprendiz{}, id).Error
}
