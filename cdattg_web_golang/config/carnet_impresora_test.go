/**
 * Pruebo que la clave de impresora salga del entorno y que vacío apague.
 *
 * @author Cristian Deysdayr Jiménez
 */
package config

import "testing"

func TestClaveImpresora(t *testing.T) {
	t.Setenv(envClaveImpresora, "  clave-maquina  ")
	if got := ClaveImpresora(); got != "clave-maquina" {
		t.Fatalf("got %q", got)
	}
	t.Setenv(envClaveImpresora, "")
	if ClaveImpresora() != "" {
		t.Fatal("vacío debe apagar")
	}
}
