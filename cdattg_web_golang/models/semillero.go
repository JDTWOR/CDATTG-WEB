/**
 * models: semillero de investigación visible en el portal público.
 * @author Cristian Deysdayr Jiménez
 */
package models

// Semillero ficha principal del grupo BIOGIGAS.
type Semillero struct {
	UserAuditModel
	Nombre            string `gorm:"size:255;not null" json:"nombre"`
	Sigla             string `gorm:"size:40" json:"sigla"`
	Slug              string `gorm:"size:180;not null;uniqueIndex" json:"slug"`
	Icono             string `gorm:"size:80" json:"icono"`
	ColorIdentidad    string `gorm:"column:color_identidad;size:20" json:"color_identidad"`
	Resumen           string `gorm:"type:text" json:"resumen"`
	Descripcion       string `gorm:"type:text" json:"descripcion"`
	Mision            string `gorm:"type:text" json:"mision"`
	Vision            string `gorm:"type:text" json:"vision"`
	Objetivos         string `gorm:"type:text" json:"objetivos"`
	InstructorLider   string `gorm:"column:instructor_lider;size:255" json:"instructor_lider"`
	CorreoContacto    string `gorm:"column:correo_contacto;size:150" json:"correo_contacto"`
	ImagenURL         string `gorm:"column:imagen_url;size:500" json:"imagen_url"`
	Orden             int    `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
	Lineas            []SemilleroLinea      `gorm:"foreignKey:SemilleroID" json:"lineas,omitempty"`
	Integrantes       []SemilleroIntegrante `gorm:"foreignKey:SemilleroID" json:"integrantes,omitempty"`
	Proyectos         []SemilleroProyecto   `gorm:"foreignKey:SemilleroID" json:"proyectos,omitempty"`
}

// TableName tabla de semilleros.
func (Semillero) TableName() string {
	return "semilleros"
}
