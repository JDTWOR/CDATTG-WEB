/**
 * Pruebo que la foto del carnet se copie y no se pise a sí misma.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCopiarFotoCarnet(t *testing.T) {
	prev := carnetFotoDir
	t.Cleanup(func() { carnetFotoDir = prev })
	carnetFotoDir = t.TempDir()

	if _, err := copiarFotoCarnet("", 1); err != errPersonaFotoAusente {
		t.Fatalf("vacío %v", err)
	}
	origen := filepath.Join(t.TempDir(), "perfil.jpg")
	if err := os.WriteFile(origen, []byte("foto"), 0o600); err != nil {
		t.Fatal(err)
	}
	dest, err := copiarFotoCarnet(origen, 9)
	if err != nil || dest == origen {
		t.Fatalf("copia %q %v", dest, err)
	}
	got, err := os.ReadFile(dest)
	if err != nil || string(got) != "foto" {
		t.Fatalf("bytes %q %v", got, err)
	}
	otra, err := copiarFotoCarnet(dest, 9)
	if err != nil || otra != dest {
		t.Fatalf("misma ruta %q %v", otra, err)
	}
}
