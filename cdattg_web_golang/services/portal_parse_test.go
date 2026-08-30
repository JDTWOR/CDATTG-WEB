/**
 * services: pruebas de estado y fechas del portal.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestEstadoOBorrador(t *testing.T) {
	got, err := estadoOBorrador("")
	if err != nil || got != models.PortalEstadoBorrador {
		t.Fatalf("vacío: %q %v", got, err)
	}
	got, err = estadoOBorrador("publicado")
	if err != nil || got != models.PortalEstadoPublicado {
		t.Fatalf("publicado: %q %v", got, err)
	}
	if _, err := estadoOBorrador("oculto"); err == nil {
		t.Fatal("debe rechazar estado inválido")
	}
}

func TestParseFechaOpcional(t *testing.T) {
	if t1, err := parseFechaOpcional(nil); err != nil || t1 != nil {
		t.Fatal("nil")
	}
	s := "2026-08-26"
	got, err := parseFechaOpcional(&s)
	if err != nil || got == nil || got.Format("2006-01-02") != s {
		t.Fatalf("fecha: %v %v", got, err)
	}
	bad := "26-08-2026"
	if _, err := parseFechaOpcional(&bad); err == nil {
		t.Fatal("formato inválido")
	}
}
