package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
)

type DiaFestivoRepository interface {
	UpsertBatch(rows []models.DiaFestivo) error
	ExistsByFecha(fecha time.Time) (bool, error)
	FindEnRango(desde, hasta time.Time) ([]models.DiaFestivo, error)
}

type diaFestivoRepository struct{}

func NewDiaFestivoRepository() DiaFestivoRepository {
	return &diaFestivoRepository{}
}

func (r *diaFestivoRepository) UpsertBatch(rows []models.DiaFestivo) error {
	if len(rows) == 0 {
		return nil
	}
	db := database.GetDB()
	for _, row := range rows {
		var existing models.DiaFestivo
		err := db.Where("fecha = ?", row.Fecha.Format(time.DateOnly)).First(&existing).Error
		if err != nil {
			if err := db.Create(&row).Error; err != nil {
				return err
			}
			continue
		}
		existing.Nombre = row.Nombre
		existing.Anio = row.Anio
		if err := db.Save(&existing).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *diaFestivoRepository) ExistsByFecha(fecha time.Time) (bool, error) {
	db := database.GetDB()
	if db == nil {
		return false, nil
	}
	f := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	var count int64
	err := db.Model(&models.DiaFestivo{}).
		Where("fecha = ?", f.Format(time.DateOnly)).
		Count(&count).Error
	return count > 0, err
}

func (r *diaFestivoRepository) FindEnRango(desde, hasta time.Time) ([]models.DiaFestivo, error) {
	var list []models.DiaFestivo
	err := database.GetDB().
		Where("fecha >= ? AND fecha <= ?", desde.Format(time.DateOnly), hasta.Format(time.DateOnly)).
		Order("fecha").
		Find(&list).Error
	return list, err
}
