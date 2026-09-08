/**
 * Pruebo la cédula de la impresora: vacío, raro, largo y el enlace de la foto.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestDocumentoImpresora(t *testing.T) {
	t.Parallel()
	if _, err := documentoImpresora("  "); err != errDocumentoImpresoraVacio {
		t.Fatalf("vacío %v", err)
	}
	if _, err := documentoImpresora("12 34"); err != errDocumentoImpresoraInvalido {
		t.Fatalf("espacio %v", err)
	}
	if _, err := documentoImpresora("123456789012345678901"); err != errDocumentoImpresoraInvalido {
		t.Fatalf("largo %v", err)
	}
	got, err := documentoImpresora(" 1120955821 ")
	if err != nil || got != "1120955821" {
		t.Fatalf("feliz %q %v", got, err)
	}
}

func TestRutaFotoImpresora(t *testing.T) {
	t.Parallel()
	if rutaFotoImpresora("") != "" {
		t.Fatal("sin documento no hay enlace")
	}
	want := "/api/impresora/carnets/foto?documento=1120955821"
	if got := rutaFotoImpresora("1120955821"); got != want {
		t.Fatalf("got %q", got)
	}
}
