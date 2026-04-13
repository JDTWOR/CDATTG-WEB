package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// FichaDiasRepository gestiona días de formación de una ficha
type FichaDiasRepository interface {
	ReplaceByFichaID(fichaID uint, diaFormacionIDs []uint) error
}

type fichaDiasRepository struct{}

func NewFichaDiasRepository() FichaDiasRepository {
	return &fichaDiasRepository{}
}

func (r *fichaDiasRepository) ReplaceByFichaID(fichaID uint, diaFormacionIDs []uint) error {
	db := database.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		// Borrado físico: con soft-delete, Delete solo marca deleted_at y un nuevo INSERT con la misma
		// (ficha_id, dia_formacion_id) suele fallar por UNIQUE o deja filas invisibles al Preload.
		if err := tx.Unscoped().Where("ficha_id = ?", fichaID).Delete(&models.FichaDiasFormacion{}).Error; err != nil {
			return err
		}
		for _, diaID := range diaFormacionIDs {
			if diaID == 0 {
				continue
			}
			rec := models.FichaDiasFormacion{FichaID: fichaID, DiaFormacionID: diaID}
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
