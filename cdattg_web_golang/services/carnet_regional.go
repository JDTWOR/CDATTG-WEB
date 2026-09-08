/**
 * Formateo “Regional. …” para el carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/models"
)

// etiquetaRegionalCarnet deja Regional. Guaviare aunque la sede solo traiga Guaviare.
func etiquetaRegionalCarnet(nombre string) string {
	n := strings.TrimSpace(nombre)
	lower := strings.ToLower(n)
	switch {
	case strings.HasPrefix(lower, "regional."):
		n = strings.TrimSpace(n[len("regional."):])
	case strings.HasPrefix(lower, "regional"):
		n = strings.TrimSpace(n[len("regional"):])
	}
	if n == "" {
		n = "Guaviare"
	}
	return "Regional. " + n
}

func regionalDeFicha(ficha *models.FichaCaracterizacion) string {
	if ficha != nil && ficha.Sede != nil && ficha.Sede.Regional != nil {
		return etiquetaRegionalCarnet(ficha.Sede.Regional.Nombre)
	}
	return etiquetaRegionalCarnet("")
}
