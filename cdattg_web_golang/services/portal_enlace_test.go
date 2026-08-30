/**
 * services: pruebas del enlace del botón del carrusel.
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestEnlacePublicoSeguro(t *testing.T) {
	if got := EnlacePublicoSeguro("https://sena.edu.co"); got == "" {
		t.Fatal("https válido")
	}
	if got := EnlacePublicoSeguro("/investigacion"); got != "/investigacion" {
		t.Fatalf("ruta: %q", got)
	}
	if got := EnlacePublicoSeguro("javascript:alert(1)"); got != "" {
		t.Fatal("debe rechazar javascript")
	}
	if got := EnlacePublicoSeguro("//evil.example"); got != "" {
		t.Fatal("debe rechazar protocol-relative")
	}
}
