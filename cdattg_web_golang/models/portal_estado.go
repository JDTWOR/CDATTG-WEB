/**
 * models: estados de publicación del portal y semilleros.
 * @author Cristian Deysdayr Jiménez
 */
package models

const (
	PortalEstadoBorrador   = "borrador"
	PortalEstadoPublicado  = "publicado"
	PortalEstadoArchivado  = "archivado"
)

// PortalEstadoPublicacionValido indica si el estado es borrador, publicado o archivado.
func PortalEstadoPublicacionValido(estado string) bool {
	return estado == PortalEstadoBorrador || estado == PortalEstadoPublicado || estado == PortalEstadoArchivado
}

// PublicadoVisible el portal solo lee registros publicados (vacío = legado visible).
func PublicadoVisible(estado string) bool {
	return estado == "" || estado == PortalEstadoPublicado
}
