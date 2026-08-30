/**
 * dto: contenidos editoriales BIOGIGAS (revista, boletín, podcast, convocatoria, actividad).
 * @author Cristian Deysdayr Jiménez
 */
package dto

// BiogjgasItem registro editorial o banner del área de investigación.
type BiogjgasItem struct {
	ID                   uint    `json:"id"`
	Titulo               string  `json:"titulo"`
	Slug                 string  `json:"slug,omitempty"`
	Subtitulo            string  `json:"subtitulo,omitempty"`
	Volumen              string  `json:"volumen,omitempty"`
	Numero               string  `json:"numero,omitempty"`
	Anio                 int     `json:"anio,omitempty"`
	ISSN                 string  `json:"issn,omitempty"`
	Editorial            string  `json:"editorial,omitempty"`
	Articulos            string  `json:"articulos,omitempty"`
	Resumen              string  `json:"resumen,omitempty"`
	Descripcion          string  `json:"descripcion,omitempty"`
	Requisitos           string  `json:"requisitos,omitempty"`
	Tematica             string  `json:"tematica,omitempty"`
	Tipo                 string  `json:"tipo,omitempty"`
	PortadaURL           string  `json:"portada_url,omitempty"`
	ImagenURL            string  `json:"imagen_url,omitempty"`
	PDFURL               string  `json:"pdf_url,omitempty"`
	AudioURL             string  `json:"audio_url,omitempty"`
	DocumentoURL         string  `json:"documento_url,omitempty"`
	EnlaceURL            string  `json:"enlace_url,omitempty"`
	EnlaceExterno        string  `json:"enlace_externo,omitempty"`
	Duracion             string  `json:"duracion,omitempty"`
	Invitados            string  `json:"invitados,omitempty"`
	Lugar                string  `json:"lugar,omitempty"`
	Modalidad            string  `json:"modalidad,omitempty"`
	EstadoConvocatoria   string  `json:"estado_convocatoria,omitempty"`
	EstadoActividad      string  `json:"estado_actividad,omitempty"`
	SemilleroID          *uint   `json:"semillero_id,omitempty"`
	Fecha                *string `json:"fecha,omitempty"`
	FechaPublicacion     *string `json:"fecha_publicacion,omitempty"`
	FechaApertura        *string `json:"fecha_apertura,omitempty"`
	FechaCierre          *string `json:"fecha_cierre,omitempty"`
	VigenteDesde         *string `json:"vigente_desde,omitempty"`
	VigenteHasta         *string `json:"vigente_hasta,omitempty"`
	Orden                int     `json:"orden"`
	EstadoPublicacion    string  `json:"estado_publicacion"`
}

// InvestigacionHomeResponse vitrina pública de Investigación.
type InvestigacionHomeResponse struct {
	Banners      []PortalBannerItem `json:"banners"`
	Semilleros   []SemilleroItem    `json:"semilleros"`
	Presentacion *PortalPresentacionItem `json:"presentacion"`
}
