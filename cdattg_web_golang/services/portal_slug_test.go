/**
 * services: pruebas del slug de semillero.
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestSlugDesdeNombre(t *testing.T) {
	if got := SlugDesdeNombre("  Semillero BIOGJGAS  "); got != "semillero-biogjgas" {
		t.Fatalf("got %q", got)
	}
	if got := SlugDesdeNombre(""); got != "" {
		t.Fatalf("vacío: %q", got)
	}
	if got := SlugDesdeNombre("A---B!!C"); got != "a-bc" {
		t.Fatalf("símbolos: %q", got)
	}
}
