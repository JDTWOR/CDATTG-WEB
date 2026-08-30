/**
 * services: tipos de contenido editorial BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package services

import "errors"

const (
	kindRevista      = "revistas"
	kindBoletin      = "boletines"
	kindPodcast      = "podcasts"
	kindConvocatoria = "convocatorias"
	kindActividad    = "actividades"
	kindBanner       = "banners"
)

// KindEditorialValido indica si la colección admin/pública existe.
func KindEditorialValido(kind string) bool {
	switch kind {
	case kindRevista, kindBoletin, kindPodcast, kindConvocatoria, kindActividad, kindBanner:
		return true
	default:
		return false
	}
}

func exigirKind(kind string) error {
	if !KindEditorialValido(kind) {
		return errors.New("tipo de contenido inválido")
	}
	return nil
}
