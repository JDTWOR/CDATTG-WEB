package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type InstructorFichaTrasladoFechaRepository interface {
	CreateBatch(tx *gorm.DB, rows []models.InstructorFichaTrasladoFecha) error
	FindByFichaInRange(fichaID uint, desde, hasta time.Time) ([]models.InstructorFichaTrasladoFecha, error)
	ExistsFechaOcupada(fichaID uint, fechas []time.Time) (bool, error)
}

type instructorFichaTrasladoFechaRepository struct{}

func NewInstructorFichaTrasladoFechaRepository() InstructorFichaTrasladoFechaRepository {
	return &instructorFichaTrasladoFechaRepository{}
}

func (r *instructorFichaTrasladoFechaRepository) CreateBatch(tx *gorm.DB, rows []models.InstructorFichaTrasladoFecha) error {
	if len(rows) == 0 {
		return nil
	}
	db := tx
	if db == nil {
		db = database.GetDB()
	}
	return db.Create(&rows).Error
}

func (r *instructorFichaTrasladoFechaRepository) FindByFichaInRange(fichaID uint, desde, hasta time.Time) ([]models.InstructorFichaTrasladoFecha, error) {
	var list []models.InstructorFichaTrasladoFecha
	err := database.GetDB().
		Where("ficha_id = ?", fichaID).
		Where(
			"(fecha_origen BETWEEN ? AND ?) OR (fecha_destino BETWEEN ? AND ?)",
			desde, hasta, desde, hasta,
		).
		Find(&list).Error
	return list, err
}

func (r *instructorFichaTrasladoFechaRepository) ExistsFechaOcupada(fichaID uint, fechas []time.Time) (bool, error) {
	if len(fechas) == 0 {
		return false, nil
	}
	var count int64
	err := database.GetDB().Model(&models.InstructorFichaTrasladoFecha{}).
		Where("ficha_id = ?", fichaID).
		Where("fecha_origen IN ? OR fecha_destino IN ?", fechas, fechas).
		Count(&count).Error
	return count > 0, err
}
