package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type UsuarioRegionalRepository interface {
	FindRegionalIDsByUserID(userID uint) ([]uint, error)
	FindRegionalesByUserID(userID uint) ([]models.Regional, error)
	ReplaceForUser(userID uint, regionalIDs []uint) error
}

type usuarioRegionalRepository struct {
	db *gorm.DB
}

func NewUsuarioRegionalRepository() UsuarioRegionalRepository {
	return &usuarioRegionalRepository{db: database.GetDB()}
}

func (r *usuarioRegionalRepository) FindRegionalIDsByUserID(userID uint) ([]uint, error) {
	var ids []uint
	err := r.db.Model(&models.UsuarioRegional{}).
		Where("user_id = ?", userID).
		Pluck("regional_id", &ids).Error
	return ids, err
}

func (r *usuarioRegionalRepository) FindRegionalesByUserID(userID uint) ([]models.Regional, error) {
	var list []models.Regional
	err := r.db.
		Joins("INNER JOIN usuario_regionales ur ON ur.regional_id = regionals.id").
		Where("ur.user_id = ?", userID).
		Order("regionals.nombre").
		Find(&list).Error
	return list, err
}

func (r *usuarioRegionalRepository) ReplaceForUser(userID uint, regionalIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&models.UsuarioRegional{}).Error; err != nil {
			return err
		}
		for _, rid := range regionalIDs {
			if rid == 0 {
				continue
			}
			if err := tx.Create(&models.UsuarioRegional{UserID: userID, RegionalID: rid}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
