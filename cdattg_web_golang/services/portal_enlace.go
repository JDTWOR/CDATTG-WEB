/**
 * services: URLs de botón del carrusel (solo http(s) o ruta interna).
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"net/url"
	"strings"
)

// EnlacePublicoSeguro acepta https, http o rutas que empiezan por /.
func EnlacePublicoSeguro(raw string) string {
	s := strings.TrimSpace(raw)
	if s == "" {
		return ""
	}
	if strings.HasPrefix(s, "/") && !strings.HasPrefix(s, "//") {
		return s
	}
	u, err := url.Parse(s)
	if err != nil || u.Host == "" {
		return ""
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return ""
	}
	return s
}
