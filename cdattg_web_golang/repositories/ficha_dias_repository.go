package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// FichaDiaInput entrada para persistir un bloque de formación con horario.
type FichaDiaInput struct {
	DiaFormacionID uint
	HoraInicio     string
	HoraFin        string
	Orden          int
	JornadaID      *uint
}

// FichaDiasRepository gestiona días de formación de una ficha.
type FichaDiasRepository interface {
	ReplaceByFichaID(fichaID uint, diaFormacionIDs []uint) error
	ReplaceByFichaIDWithHorarios(fichaID uint, dias []FichaDiaInput) error
	FindByFichaID(fichaID uint) ([]models.FichaDiasFormacion, error)
	FindDistinctFichaIDsReferencingJornada(jornadaID uint) ([]uint, error)
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
				Orden:          d.Orden,
				JornadaID:      d.JornadaID,
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
	err := database.GetDB().
		Preload("DiaFormacion").
		Preload("Jornada").
		Where("ficha_id = ?", fichaID).
		Order("dia_formacion_id, orden, id").
		Find(&list).Error
	return list, err
}

func (r *fichaDiasRepository) FindDistinctFichaIDsReferencingJornada(jornadaID uint) ([]uint, error) {
	db := database.GetDB()
	var fromBloques []uint
	if err := db.Model(&models.FichaDiasFormacion{}).
		Where("jornada_id = ?", jornadaID).
		Distinct("ficha_id").
		Pluck("ficha_id", &fromBloques).Error; err != nil {
		return nil, err
	}
	var fromPrincipal []uint
	if err := db.Model(&models.FichaCaracterizacion{}).
		Where("jornada_id = ?", jornadaID).
		Pluck("id", &fromPrincipal).Error; err != nil {
		return nil, err
	}
	seen := make(map[uint]struct{}, len(fromBloques)+len(fromPrincipal))
	out := make([]uint, 0, len(fromBloques)+len(fromPrincipal))
	for _, id := range append(fromBloques, fromPrincipal...) {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out, nil
}
