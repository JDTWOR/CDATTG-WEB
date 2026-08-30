/**
 * models: estados de publicación del portal.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "testing"

func TestPortalEstadoPublicacionValido(t *testing.T) {
	if !PortalEstadoPublicacionValido(PortalEstadoBorrador) {
		t.Fatal("borrador debe ser válido")
	}
	if !PortalEstadoPublicacionValido(PortalEstadoPublicado) {
		t.Fatal("publicado debe ser válido")
	}
	if !PortalEstadoPublicacionValido(PortalEstadoArchivado) {
		t.Fatal("archivado debe ser válido")
	}
	if PortalEstadoPublicacionValido("oculto") {
		t.Fatal("oculto no es un estado")
	}
	if !PublicadoVisible("") || !PublicadoVisible(PortalEstadoPublicado) {
		t.Fatal("vacío o publicado deben verse")
	}
	if PublicadoVisible(PortalEstadoBorrador) || PublicadoVisible(PortalEstadoArchivado) {
		t.Fatal("borrador y archivado no van al portal")
	}
}
