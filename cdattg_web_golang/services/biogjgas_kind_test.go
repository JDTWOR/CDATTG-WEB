/**
 * services: pruebas de tipos editoriales BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestKindEditorialValido(t *testing.T) {
	if !KindEditorialValido("revistas") || !KindEditorialValido("banners") {
		t.Fatal("kinds conocidos")
	}
	if KindEditorialValido("foo") {
		t.Fatal("foo no es kind")
	}
	if exigirKind("podcasts") != nil {
		t.Fatal("podcasts ok")
	}
	if exigirKind("x") == nil {
		t.Fatal("x debe fallar")
	}
}
