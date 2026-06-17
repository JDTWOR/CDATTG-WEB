package seeders

import (
	"errors"
	"log"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
	"gorm.io/gorm"
)

const (
	festivosAniosAntes   = 1
	festivosAniosDespues = 2
)

func upsertDiasFestivos(db *gorm.DB, rows []models.DiaFestivo) error {
	for _, row := range rows {
		var existing models.DiaFestivo
		err := db.Where("fecha = ?", row.Fecha.Format(time.DateOnly)).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := db.Create(&row).Error; err != nil {
				return err
			}
			continue
		}
		if err != nil {
			return err
		}
		existing.Nombre = row.Nombre
		existing.Anio = row.Anio
		if err := db.Save(&existing).Error; err != nil {
			return err
		}
	}
	return nil
}

// RunFestivosColombiaSeeder inserta/actualiza festivos nacionales (Ley Emiliani).
func RunFestivosColombiaSeeder(db *gorm.DB) error {
	if db == nil {
		return gorm.ErrInvalidDB
	}
	log.Println("Ejecutando FestivosColombiaSeeder...")
	anio := time.Now().Year()
	rows := services.GenerarFestivosColombiaRango(anio-festivosAniosAntes, anio+festivosAniosDespues)
	if len(rows) == 0 {
		log.Println("FestivosColombiaSeeder completado (0 registros).")
		return nil
	}
	if err := upsertDiasFestivos(db, rows); err != nil {
		return err
	}
	log.Printf("FestivosColombiaSeeder completado (%d registros).", len(rows))
	return nil
}
