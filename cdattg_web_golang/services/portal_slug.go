/**
 * services: slug de semillero a partir del nombre.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"regexp"
	"strings"
	"unicode"
)

var slugNoAlnum = regexp.MustCompile(`[^a-z0-9-]+`)
var slugGuiones = regexp.MustCompile(`-+`)

// SlugDesdeNombre convierte un título a slug URL (minúsculas, guiones).
func SlugDesdeNombre(nombre string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(strings.TrimSpace(nombre)) {
		if unicode.IsSpace(r) {
			b.WriteByte('-')
			continue
		}
		b.WriteRune(r)
	}
	s := slugNoAlnum.ReplaceAllString(b.String(), "")
	s = slugGuiones.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
