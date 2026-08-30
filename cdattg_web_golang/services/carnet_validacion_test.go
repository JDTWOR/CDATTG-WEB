/**
 * Pruebo aprobar, devolver y armar la lista del instructor líder.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestAplicarDecision(t *testing.T) {
	t.Parallel()
	ahora := time.Date(2026, 8, 29, 10, 0, 0, 0, time.UTC)
	ok := models.CarnetSolicitud{Estado: models.CarnetEstadoPendiente}
	aplicarDecision(&ok, 74, true, ahora)
	if ok.Estado != models.CarnetEstadoAprobado || ok.ValidadorInstructorID == nil {
		t.Fatalf("aprobar %+v", ok)
	}
	dev := models.CarnetSolicitud{Estado: models.CarnetEstadoPendiente}
	aplicarDecision(&dev, 74, false, ahora)
	if dev.Estado != models.CarnetEstadoDevuelto || dev.MotivoRechazo != "" {
		t.Fatalf("devolver %+v", dev)
	}
}

func TestPendientesAItems(t *testing.T) {
	t.Parallel()
	list := []models.CarnetSolicitud{{
		PersonaID: 9, Nombres: "Ana", Apellidos: "Rojas",
		NumeroDocumento: "1", Rh: "O+", FichaID: 52, FichaNumero: "3173334",
		Programa: "ADSO", TipoFormacion: models.TipoFormacionRegular,
	}}
	list[0].ID = 3
	items := pendientesAItems(list)
	if len(items) != 1 || items[0].FichaNumero != "3173334" || items[0].TipoLabel != "Regular" {
		t.Fatalf("%+v", items)
	}
}
