/**
 * Pruebo que el RH acepte solo los grupos de sangre reales.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestValidarPersonaRH(t *testing.T) {
	t.Parallel()
	casos := []struct {
		rh      string
		quiere  bool
	}{
		{"", true},
		{"  ", true},
		{"O+", true},
		{"o-", true},
		{"AB+", true},
		{"XX", false},
		{"O", false},
	}
	for _, c := range casos {
		err := validarPersonaRH(c.rh)
		ok := err == nil
		if ok != c.quiere {
			t.Fatalf("rh %q: ok=%v quiere=%v err=%v", c.rh, ok, c.quiere, err)
		}
	}
}

func TestNormalizarPersonaRH(t *testing.T) {
	t.Parallel()
	if got := normalizarPersonaRH("  a+ "); got != "A+" {
		t.Fatalf("got %q", got)
	}
}
