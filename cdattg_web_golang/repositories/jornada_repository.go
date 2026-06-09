package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// JornadaRepository CRUD de plantillas de jornada.
type JornadaRepository interface {
	List() ([]models.Jornada, error)
	FindByID(id uint) (*models.Jornada, error)
	FindByNombre(nombre string) (*models.Jornada, error)
	Create(j *models.Jornada) error
	Update(j *models.Jornada) error
	Delete(id uint) error
	CountFichasByJornadaID(jornadaID uint) (int64, error)
	CountFichaDiasByJornadaID(jornadaID uint) (int64, error)
}

type jornadaRepository struct {
	db *gorm.DB
}

func NewJornadaRepository() JornadaRepository {
	return &jornadaRepository{db: database.GetDB()}
}

func (r *jornadaRepository) List() ([]models.Jornada, error) {
	var list []models.Jornada
	err := r.db.Order("nombre").Find(&list).Error
	return list, err
}

func (r *jornadaRepository) FindByID(id uint) (*models.Jornada, error) {
	var m models.Jornada
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *jornadaRepository) FindByNombre(nombre string) (*models.Jornada, error) {
	var m models.Jornada
	if err := r.db.Where("LOWER(nombre) = LOWER(?)", nombre).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *jornadaRepository) Create(j *models.Jornada) error {
	return r.db.Create(j).Error
}

func (r *jornadaRepository) Update(j *models.Jornada) error {
	return r.db.Save(j).Error
}

func (r *jornadaRepository) Delete(id uint) error {
	return r.db.Delete(&models.Jornada{}, id).Error
}

func (r *jornadaRepository) CountFichasByJornadaID(jornadaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.FichaCaracterizacion{}).Where("jornada_id = ?", jornadaID).Count(&n).Error
	return n, err
}

func (r *jornadaRepository) CountFichaDiasByJornadaID(jornadaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.FichaDiasFormacion{}).Where("jornada_id = ?", jornadaID).Count(&n).Error
	return n, err
}

// JornadaBloqueRepository bloques de plantillas.
type JornadaBloqueRepository interface {
	FindByJornadaID(jornadaID uint) ([]models.JornadaBloque, error)
	ReplaceByJornadaID(jornadaID uint, bloques []models.JornadaBloque) error
	DeleteByJornadaID(jornadaID uint) error
}

type jornadaBloqueRepository struct {
	db *gorm.DB
}

func NewJornadaBloqueRepository() JornadaBloqueRepository {
	return &jornadaBloqueRepository{db: database.GetDB()}
}

func (r *jornadaBloqueRepository) FindByJornadaID(jornadaID uint) ([]models.JornadaBloque, error) {
	var list []models.JornadaBloque
	err := r.db.Where("jornada_id = ?", jornadaID).
		Preload("DiaFormacion").
		Order("dia_formacion_id, orden, id").
		Find(&list).Error
	return list, err
}

func (r *jornadaBloqueRepository) ReplaceByJornadaID(jornadaID uint, bloques []models.JornadaBloque) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("jornada_id = ?", jornadaID).Delete(&models.JornadaBloque{}).Error; err != nil {
			return err
		}
		for i := range bloques {
			bloques[i].JornadaID = jornadaID
			bloques[i].ID = 0
			if err := tx.Create(&bloques[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *jornadaBloqueRepository) DeleteByJornadaID(jornadaID uint) error {
	return r.db.Unscoped().Where("jornada_id = ?", jornadaID).Delete(&models.JornadaBloque{}).Error
}
