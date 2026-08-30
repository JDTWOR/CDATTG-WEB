/**
 * dto: payloads de semilleros (admin y público).
 * @author Cristian Deysdayr Jiménez
 */
package dto

// SemilleroLineaItem línea de investigación.
type SemilleroLineaItem struct {
	ID                uint   `json:"id,omitempty"`
	Nombre            string `json:"nombre"`
	Descripcion       string `json:"descripcion"`
	Orden             int    `json:"orden"`
	EstadoPublicacion string `json:"estado_publicacion"`
}

// SemilleroIntegranteItem integrante.
type SemilleroIntegranteItem struct {
	ID                uint   `json:"id,omitempty"`
	Nombre            string `json:"nombre"`
	Rol               string `json:"rol"`
	Programa          string `json:"programa"`
	Correo            string `json:"correo"`
	Orden             int    `json:"orden"`
	EstadoPublicacion string `json:"estado_publicacion"`
}

// SemilleroProyectoItem proyecto.
type SemilleroProyectoItem struct {
	ID                uint    `json:"id,omitempty"`
	Titulo            string  `json:"titulo"`
	Resumen           string  `json:"resumen"`
	Descripcion       string  `json:"descripcion"`
	EstadoEjecucion   string  `json:"estado_ejecucion"`
	FechaInicio       *string `json:"fecha_inicio,omitempty"`
	FechaFin          *string `json:"fecha_fin,omitempty"`
	Anio              int     `json:"anio"`
	Orden             int     `json:"orden"`
	EstadoPublicacion string  `json:"estado_publicacion"`
}

// SemilleroRequest alta o edición.
type SemilleroRequest struct {
	Nombre            string                    `json:"nombre" binding:"required,max=255"`
	Sigla             string                    `json:"sigla"`
	Slug              string                    `json:"slug"`
	Icono             string                    `json:"icono"`
	ColorIdentidad    string                    `json:"color_identidad"`
	Resumen           string                    `json:"resumen"`
	Descripcion       string                    `json:"descripcion"`
	Mision            string                    `json:"mision"`
	Vision            string                    `json:"vision"`
	Objetivos         string                    `json:"objetivos"`
	InstructorLider   string                    `json:"instructor_lider"`
	CorreoContacto    string                    `json:"correo_contacto"`
	ImagenURL         string                    `json:"imagen_url"`
	Orden             int                       `json:"orden"`
	EstadoPublicacion string                    `json:"estado_publicacion"`
	Lineas            []SemilleroLineaItem      `json:"lineas"`
	Integrantes       []SemilleroIntegranteItem `json:"integrantes"`
	Proyectos         []SemilleroProyectoItem   `json:"proyectos"`
}

// SemilleroItem listado o detalle.
type SemilleroItem struct {
	ID                uint                      `json:"id"`
	Nombre            string                    `json:"nombre"`
	Sigla             string                    `json:"sigla"`
	Slug              string                    `json:"slug"`
	Icono             string                    `json:"icono"`
	ColorIdentidad    string                    `json:"color_identidad"`
	Resumen           string                    `json:"resumen"`
	Descripcion       string                    `json:"descripcion"`
	Mision            string                    `json:"mision"`
	Vision            string                    `json:"vision"`
	Objetivos         string                    `json:"objetivos"`
	InstructorLider   string                    `json:"instructor_lider"`
	CorreoContacto    string                    `json:"correo_contacto"`
	ImagenURL         string                    `json:"imagen_url"`
	Orden             int                       `json:"orden"`
	EstadoPublicacion string                    `json:"estado_publicacion"`
	Lineas            []SemilleroLineaItem      `json:"lineas,omitempty"`
	Integrantes       []SemilleroIntegranteItem `json:"integrantes,omitempty"`
	Proyectos         []SemilleroProyectoItem   `json:"proyectos,omitempty"`
}
