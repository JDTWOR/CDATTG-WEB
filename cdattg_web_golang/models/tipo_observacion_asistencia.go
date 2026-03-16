package models

// TipoObservacionAsistencia catálogo de observaciones predefinidas para asistencia (ej. No trajo uniforme, Abandono de formación).
type TipoObservacionAsistencia struct {
	BaseModel
	Codigo  string `gorm:"column:codigo;size:80;not null;uniqueIndex" json:"codigo"`
	Nombre  string `gorm:"column:nombre;size:255;not null" json:"nombre"`
	Activo  bool   `gorm:"column:activo;default:true" json:"activo"`
}

// TableName especifica el nombre de la tabla
func (TipoObservacionAsistencia) TableName() string {
	return "tipos_observacion_asistencia"
}
