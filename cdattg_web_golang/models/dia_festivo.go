package models

import "time"

// DiaFestivo representa un día festivo nacional en Colombia (sin formación).
type DiaFestivo struct {
	BaseModel
	Fecha  time.Time `gorm:"type:date;not null;uniqueIndex" json:"fecha"`
	Nombre string    `gorm:"size:120;not null" json:"nombre"`
	Anio   int       `gorm:"not null;index" json:"anio"`
}

func (DiaFestivo) TableName() string {
	return "dias_festivos"
}
