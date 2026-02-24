package models

import "time"

// PersonaImport representa una importación masiva de personas
type PersonaImport struct {
	BaseModel
	NombreArchivo string    `gorm:"size:255;not null" json:"nombre_archivo"`
	TotalRegistros int      `gorm:"not null" json:"total_registros"`
	RegistrosExitosos int   `gorm:"default:0" json:"registros_exitosos"`
	RegistrosFallidos int   `gorm:"default:0" json:"registros_fallidos"`
	FechaImportacion time.Time `gorm:"column:fecha_importacion;not null" json:"fecha_importacion"`
	Status           string    `gorm:"size:50;default:PENDIENTE" json:"status"` // PENDIENTE, PROCESANDO, COMPLETADO, ERROR
	Observaciones    string    `gorm:"type:text" json:"observaciones"`
}

// TableName especifica el nombre de la tabla
func (PersonaImport) TableName() string {
	return "persona_imports"
}
