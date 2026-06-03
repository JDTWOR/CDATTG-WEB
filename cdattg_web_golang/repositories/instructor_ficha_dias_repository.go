package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// InstructorFichaDiasRepository gestiona días de formación por instructor en una ficha.
type InstructorFichaDiasRepository interface {
	ReplaceByInstructorAndFicha(instructorID, fichaID uint, diaFormacionIDs []uint) error
	FindByInstructorAndFicha(instructorID, fichaID uint) ([]models.InstructorFichaDias, error)
	FindByInstructorID(instructorID uint) ([]models.InstructorFichaDias, error)
	DeleteByInstructorAndFicha(instructorID, fichaID uint) error
}

type instructorFichaDiasRepository struct{}

const condInstructorFichaID = "instructor_id = ? AND ficha_id = ?"

func NewInstructorFichaDiasRepository() InstructorFichaDiasRepository {
	return &instructorFichaDiasRepository{}
}

func (r *instructorFichaDiasRepository) ReplaceByInstructorAndFicha(instructorID, fichaID uint, diaFormacionIDs []uint) error {
	db := database.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().
			Where(condInstructorFichaID, instructorID, fichaID).
			Delete(&models.InstructorFichaDias{}).Error; err != nil {
			return err
		}
		for _, diaID := range diaFormacionIDs {
			if diaID == 0 {
				continue
			}
			rec := models.InstructorFichaDias{
				InstructorID:   instructorID,
				FichaID:        fichaID,
				DiaFormacionID: diaID,
			}
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *instructorFichaDiasRepository) FindByInstructorAndFicha(instructorID, fichaID uint) ([]models.InstructorFichaDias, error) {
	var list []models.InstructorFichaDias
	err := database.GetDB().
		Where(condInstructorFichaID, instructorID, fichaID).
		Find(&list).Error
	return list, err
}

func (r *instructorFichaDiasRepository) FindByInstructorID(instructorID uint) ([]models.InstructorFichaDias, error) {
	var list []models.InstructorFichaDias
	err := database.GetDB().Where("instructor_id = ?", instructorID).Find(&list).Error
	return list, err
}

func (r *instructorFichaDiasRepository) DeleteByInstructorAndFicha(instructorID, fichaID uint) error {
	return database.GetDB().
		Where(condInstructorFichaID, instructorID, fichaID).
		Delete(&models.InstructorFichaDias{}).Error
}
