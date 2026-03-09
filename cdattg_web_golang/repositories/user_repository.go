package repositories

import (
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	FindByID(id uint) (*models.User, error)
	FindByEmail(email string) (*models.User, error)
	FindByPersonaID(personaID uint) (*models.User, error)
	FindActiveByEmail(email string) (*models.User, error)
	List(offset, limit int, search string) ([]models.User, int64, error)
	Create(user *models.User) error
	Update(user *models.User) error
	Delete(id uint) error
	ExistsByEmail(email string) bool
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{
		db: database.GetDB(),
	}
}

func (r *userRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByPersonaID(personaID uint) (*models.User, error) {
	var user models.User
	if err := r.db.Where("persona_id = ?", personaID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindActiveByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ? AND status = ?", email, true).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) List(offset, limit int, search string) ([]models.User, int64, error) {
	var list []models.User
	q := r.db.Model(&models.User{}).Preload("Persona")
	if search != "" {
		// Reemplazar espacios por % para permitir búsqueda parcial
		searchPattern := "%" + strings.ToLower(strings.Join(strings.Fields(search), "%")) + "%"
		q = q.Joins("LEFT JOIN personas ON personas.id = users.persona_id").
			Where("LOWER(users.email) LIKE ? OR LOWER(COALESCE(personas.primer_nombre,'') || ' ' || COALESCE(personas.segundo_nombre,'') || ' ' || COALESCE(personas.primer_apellido,'') || ' ' || COALESCE(personas.segundo_apellido,'')) LIKE ? OR LOWER(personas.numero_documento) LIKE ?", searchPattern, searchPattern, searchPattern)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := q.Offset(offset).Limit(limit).Order("users.id").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *userRepository) ExistsByEmail(email string) bool {
	var count int64
	r.db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}
