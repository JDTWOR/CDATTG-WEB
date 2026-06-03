package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// FichaDiaInput entrada para persistir un día de formación con horario opcional.
type FichaDiaInput struct {
	DiaFormacionID uint
	HoraInicio     string
	HoraFin        string
}

// FichaDiasRepository gestiona días de formación de una ficha.
type FichaDiasRepository interface {
	ReplaceByFichaID(fichaID uint, diaFormacionIDs []uint) error
	ReplaceByFichaIDWithHorarios(fichaID uint, dias []FichaDiaInput) error
	FindByFichaID(fichaID uint) ([]models.FichaDiasFormacion, error)
}

type fichaDiasRepository struct{}

func NewFichaDiasRepository() FichaDiasRepository {
	return &fichaDiasRepository{}
}

func (r *fichaDiasRepository) ReplaceByFichaID(fichaID uint, diaFormacionIDs []uint) error {
	dias := make([]FichaDiaInput, 0, len(diaFormacionIDs))
	for _, id := range diaFormacionIDs {
		if id == 0 {
			continue
		}
		dias = append(dias, FichaDiaInput{DiaFormacionID: id})
	}
	return r.ReplaceByFichaIDWithHorarios(fichaID, dias)
}

func (r *fichaDiasRepository) ReplaceByFichaIDWithHorarios(fichaID uint, dias []FichaDiaInput) error {
	db := database.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("ficha_id = ?", fichaID).Delete(&models.FichaDiasFormacion{}).Error; err != nil {
			return err
		}
		for _, d := range dias {
			if d.DiaFormacionID == 0 {
				continue
			}
			rec := models.FichaDiasFormacion{
				FichaID:        fichaID,
				DiaFormacionID: d.DiaFormacionID,
				HoraInicio:     d.HoraInicio,
				HoraFin:        d.HoraFin,
			}
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *fichaDiasRepository) FindByFichaID(fichaID uint) ([]models.FichaDiasFormacion, error) {
	var list []models.FichaDiasFormacion
	err := database.GetDB().Where("ficha_id = ?", fichaID).Find(&list).Error
	return list, err
}
