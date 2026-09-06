/**
 * Pruebo la decisión de si el usuario va a portería al editar su perfil.
 * Lo hice para asegurar que el aprendiz que también figura como visitante
 * pueda editar su perfil y su foto directo, sin cambio pendiente.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"testing"

	"github.com/sena/cdattg-web-golang/testutil"
)

func TestEsVisitante(t *testing.T) {
	t.Parallel()
	casos := []struct {
		nombre string
		roles  []string
		espera bool
	}{
		{"solo visitante va a portería", []string{rolVisitante}, true},
		{"visitante con rol aprendiz edita directo", []string{rolVisitante, rolAprendiz}, false},
		{"visitante con rol instructor edita directo", []string{rolVisitante, "INSTRUCTOR"}, false},
		{"visitante con rol personal operativo edita directo", []string{rolVisitante, "PERSONAL OPERATIVO Y DE APOYO"}, false},
		{"visitante con rol personal administrativo edita directo", []string{rolVisitante, "PERSONAL ADMINISTRATIVO"}, false},
		{"visitante con rol contratista edita directo", []string{rolVisitante, "CONTRATISTA PRESTACIÓN DE SERVICIOS"}, false},
		{"aprendiz sin visitante edita directo", []string{rolAprendiz}, false},
		{"sin roles no es visitante", nil, false},
		{"rol de otro tipo no es visitante", []string{"COORDINADOR"}, false},
	}
	for _, caso := range casos {
		caso := caso
		t.Run(caso.nombre, func(t *testing.T) {
			_, g := testutil.RecorderAndContext("GET", "/", nil)
			g.Set("userRoles", caso.roles)
			if got := esVisitante(g); got != caso.espera {
				t.Errorf("esVisitante(%v) = %v, quiere %v", caso.roles, got, caso.espera)
			}
		})
	}
}
