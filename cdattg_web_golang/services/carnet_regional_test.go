/**
 * Pruebo Regional. Guaviare.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestEtiquetaRegionalCarnet(t *testing.T) {
	t.Parallel()
	if got := etiquetaRegionalCarnet("Guaviare"); got != "Regional. Guaviare" {
		t.Fatalf("got %q", got)
	}
	if got := etiquetaRegionalCarnet("Regional Guaviare"); got != "Regional. Guaviare" {
		t.Fatalf("got %q", got)
	}
}
