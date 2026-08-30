/**
 * Pruebo la vista completa que ve el instructor líder.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestVistaDesdeSolicitudSinFicha(t *testing.T) {
	t.Parallel()
	sol := models.CarnetSolicitud{
		FichaID: 52, FichaNumero: "3173334", Programa: "ADSO",
		Nombres: "Ana", Apellidos: "Rojas", NumeroDocumento: "1",
		Rh: "O+", FotoPath: "a.jpg", TipoFormacion: models.TipoFormacionRegular,
	}
	sol.ID = 9
	v := vistaDesdeSolicitud(sol, nil)
	if v.ID != 9 || v.Persona.Nombres != "ANA" || v.Ficha.Numero != "3173334" {
		t.Fatalf("%+v", v)
	}
	if v.Ficha.Regional != "Regional. Guaviare" {
		t.Fatalf("regional %q", v.Ficha.Regional)
	}
}

func TestVistaDesdeSolicitudConFicha(t *testing.T) {
	t.Parallel()
	fin := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	ficha := models.FichaCaracterizacion{Status: true, Ficha: "99", FechaFin: &fin, Nombre: "Redes"}
	ficha.ID = 52
	sol := models.CarnetSolicitud{FichaID: 52, FichaNumero: "", Programa: ""}
	v := vistaDesdeSolicitud(sol, &ficha)
	if v.Ficha.Numero != "99" || v.Ficha.Programa != "Redes" || v.Ficha.FechaFin != "2026-12-01" {
		t.Fatalf("%+v", v.Ficha)
	}
}
