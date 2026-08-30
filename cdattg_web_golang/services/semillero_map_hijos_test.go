/**
 * services: filtro de hijos publicados en la ficha pública.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestMapearHijosSemilleroSoloPublicados(t *testing.T) {
	s := models.Semillero{
		Lineas: []models.SemilleroLinea{
			{Nombre: "A", EstadoPublicacion: models.PortalEstadoPublicado},
			{Nombre: "B", EstadoPublicacion: models.PortalEstadoBorrador},
		},
	}
	lineas, _, _ := mapearHijosSemillero(s, true)
	if len(lineas) != 1 || lineas[0].Nombre != "A" {
		t.Fatalf("got %#v", lineas)
	}
	todos, _, _ := mapearHijosSemillero(s, false)
	if len(todos) != 2 {
		t.Fatalf("admin debe ver ambos: %#v", todos)
	}
}
