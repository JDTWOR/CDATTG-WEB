package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
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
	if err := db.Where("ficha_id = ?", fichaID).Delete(&models.FichaDiasFormacion{}).Error; err != nil {
		return err
	}
	for _, diaID := range diaFormacionIDs {
		if diaID == 0 {
			continue
		}
		rec := models.FichaDiasFormacion{FichaID: fichaID, DiaFormacionID: diaID}
		if err := db.Create(&rec).Error; err != nil {
			return err
		}
	}
	return nil
}
