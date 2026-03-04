package repositories

import (
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type PersonaRepository interface {
	FindByID(id uint) (*models.Persona, error)
	FindByNumeroDocumento(numeroDocumento string) (*models.Persona, error)
	FindByCelular(celular string) (*models.Persona, error)
	FindAll(page, pageSize int, search string) ([]models.Persona, int64, error)
	Create(persona *models.Persona) error
	Update(persona *models.Persona) error
	Delete(id uint) error
	ExistsByNumeroDocumento(numeroDocumento string) bool
	ExistsByEmail(email string) bool
	ExistsByCelular(celular string) bool
	FindByEmailExcludingID(email string, excludeID uint) (*models.Persona, error)
	FindByCelularExcludingID(celular string, excludeID uint) (*models.Persona, error)
}

type personaRepository struct {
	db *gorm.DB
}

func NewPersonaRepository() PersonaRepository {
	return &personaRepository{
		db: database.GetDB(),
	}
}

func (r *personaRepository) FindByID(id uint) (*models.Persona, error) {
	var persona models.Persona
	if err := r.db.First(&persona, id).Error; err != nil {
		return nil, err
	}
	return &persona, nil
}

func (r *personaRepository) FindByNumeroDocumento(numeroDocumento string) (*models.Persona, error) {
	var persona models.Persona
	if err := r.db.Where("numero_documento = ?", numeroDocumento).First(&persona).Error; err != nil {
		return nil, err
	}
	return &persona, nil
}

func (r *personaRepository) FindByCelular(celular string) (*models.Persona, error) {
	var persona models.Persona
	if err := r.db.Where("celular = ?", celular).First(&persona).Error; err != nil {
		return nil, err
	}
	return &persona, nil
}

// applyPersonaSearch aplica búsqueda por varias palabras: cada palabra debe coincidir en al menos un campo (AND de ORs).
func applyPersonaSearch(q *gorm.DB, search string) *gorm.DB {
	words := strings.Fields(strings.TrimSpace(search))
	if len(words) == 0 {
		return q
	}
	likeClause := "numero_documento ILIKE ? OR primer_nombre ILIKE ? OR segundo_nombre ILIKE ? OR primer_apellido ILIKE ? OR segundo_apellido ILIKE ?"
	for _, word := range words {
		term := "%" + word + "%"
		q = q.Where("("+likeClause+")", term, term, term, term, term)
	}
	return q
}

func (r *personaRepository) FindAll(page, pageSize int, search string) ([]models.Persona, int64, error) {
	var personas []models.Persona
	var total int64
	offset := (page - 1) * pageSize
	base := r.db.Model(&models.Persona{})
	base = applyPersonaSearch(base, search)

	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	q := applyPersonaSearch(r.db, search)
	if err := q.Offset(offset).Limit(pageSize).Find(&personas).Error; err != nil {
		return nil, 0, err
	}
	return personas, total, nil
}

func (r *personaRepository) Create(persona *models.Persona) error {
	return r.db.Create(persona).Error
}

func (r *personaRepository) Update(persona *models.Persona) error {
	return r.db.Save(persona).Error
}

func (r *personaRepository) Delete(id uint) error {
	return r.db.Delete(&models.Persona{}, id).Error
}

func (r *personaRepository) ExistsByNumeroDocumento(numeroDocumento string) bool {
	var count int64
	r.db.Model(&models.Persona{}).Where("numero_documento = ?", numeroDocumento).Count(&count)
	return count > 0
}

func (r *personaRepository) ExistsByEmail(email string) bool {
	var count int64
	r.db.Model(&models.Persona{}).Where("email = ?", email).Count(&count)
	return count > 0
}

func (r *personaRepository) ExistsByCelular(celular string) bool {
	var count int64
	r.db.Model(&models.Persona{}).Where("celular = ?", celular).Count(&count)
	return count > 0
}

func (r *personaRepository) FindByEmailExcludingID(email string, excludeID uint) (*models.Persona, error) {
	var persona models.Persona
	if err := r.db.Where("email = ? AND id != ?", email, excludeID).First(&persona).Error; err != nil {
		return nil, err
	}
	return &persona, nil
}

func (r *personaRepository) FindByCelularExcludingID(celular string, excludeID uint) (*models.Persona, error) {
	var persona models.Persona
	if err := r.db.Where("celular = ? AND id != ?", celular, excludeID).First(&persona).Error; err != nil {
		return nil, err
	}
	return &persona, nil
}
