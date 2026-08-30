/**
 * dto: payloads del portal público y admin de banners/presentación.
 * @author Cristian Deysdayr Jiménez
 */
package dto

// PortalBannerRequest alta o edición de banner.
type PortalBannerRequest struct {
	Titulo            string  `json:"titulo" binding:"required,max=255"`
	Descripcion       string  `json:"descripcion" binding:"max=2000"`
	ImagenURL         string  `json:"imagen_url"`
	Etiqueta          string  `json:"etiqueta" binding:"max=80"`
	BotonTexto        string  `json:"boton_texto" binding:"max=80"`
	EnlaceURL         string  `json:"enlace_url" binding:"max=500"`
	Orden             int     `json:"orden"`
	VigenteDesde      *string `json:"vigente_desde"`
	VigenteHasta      *string `json:"vigente_hasta"`
	EstadoPublicacion string  `json:"estado_publicacion"`
}

// PortalPresentacionRequest edición de la presentación.
type PortalPresentacionRequest struct {
	Mision            string `json:"mision"`
	Vision            string `json:"vision"`
	ObjetivoGeneral   string `json:"objetivo_general"`
	Historia          string `json:"historia"`
	VideoURL          string `json:"video_url"`
	PoliticasPDF      string `json:"politicas_pdf"`
	Equipo            string `json:"equipo"`
	EstadoPublicacion string `json:"estado_publicacion"`
}

// PortalHomeResponse home público: banners vigentes y presentación publicada.
type PortalHomeResponse struct {
	Banners       []PortalBannerItem       `json:"banners"`
	Presentacion  *PortalPresentacionItem  `json:"presentacion"`
}

// PortalBannerItem lectura pública o admin.
type PortalBannerItem struct {
	ID                uint    `json:"id"`
	Titulo            string  `json:"titulo"`
	Descripcion       string  `json:"descripcion"`
	ImagenURL         string  `json:"imagen_url"`
	Etiqueta          string  `json:"etiqueta"`
	BotonTexto        string  `json:"boton_texto"`
	EnlaceURL         string  `json:"enlace_url"`
	Orden             int     `json:"orden"`
	VigenteDesde      *string `json:"vigente_desde,omitempty"`
	VigenteHasta      *string `json:"vigente_hasta,omitempty"`
	EstadoPublicacion string  `json:"estado_publicacion"`
}

// PortalPresentacionItem lectura de presentación.
type PortalPresentacionItem struct {
	ID                uint   `json:"id"`
	Mision            string `json:"mision"`
	Vision            string `json:"vision"`
	ObjetivoGeneral   string `json:"objetivo_general"`
	Historia          string `json:"historia"`
	VideoURL          string `json:"video_url"`
	PoliticasPDF      string `json:"politicas_pdf"`
	Equipo            string `json:"equipo"`
	EstadoPublicacion string `json:"estado_publicacion"`
}
