/**
 * Pruebo el guard que decide si una entrada automática de portería puede cancelarse.
 *
 * Casos válidos, de borde y de error se cubren sin base de datos (función pura).
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func baseVisitaCancelable(hace time.Duration) *models.PersonaIngresoSalida {
	ahora := time.Now()
	return &models.PersonaIngresoSalida{
		SedeID:           7,
		TimestampEntrada: ahora.Add(-hace),
		IngresoCancelado: false,
	}
}

func TestVisitaIngresoCancelable_puedeCancelar(t *testing.T) {
	t.Parallel()
	v := baseVisitaCancelable(30 * time.Second)
	if !visitaIngresoCancelable(v, 7, time.Now(), cancelarIngresoVentana) {
		t.Fatal("entrada reciente y abierta debe poder cancelarse")
	}
}

func TestVisitaIngresoCancelable_ventanaVencida(t *testing.T) {
	t.Parallel()
	v := baseVisitaCancelable(10 * time.Minute)
	if visitaIngresoCancelable(v, 7, time.Now(), cancelarIngresoVentana) {
		t.Fatal("fuera de la ventana no debe cancelarse")
	}
}

func TestVisitaIngresoCancelable_otraSede(t *testing.T) {
	t.Parallel()
	v := baseVisitaCancelable(20 * time.Second)
	if visitaIngresoCancelable(v, 99, time.Now(), cancelarIngresoVentana) {
		t.Fatal("sede distinta no debe cancelarse")
	}
}

func TestVisitaIngresoCancelable_yaCancelada(t *testing.T) {
	t.Parallel()
	v := baseVisitaCancelable(20 * time.Second)
	v.IngresoCancelado = true
	if visitaIngresoCancelable(v, 7, time.Now(), cancelarIngresoVentana) {
		t.Fatal("entrada ya cancelada no debe poder cancelarse otra vez")
	}
}

func TestVisitaIngresoCancelable_conSalida(t *testing.T) {
	t.Parallel()
	v := baseVisitaCancelable(20 * time.Second)
	ts := time.Now()
	v.TimestampSalida = &ts
	if visitaIngresoCancelable(v, 7, time.Now(), cancelarIngresoVentana) {
		t.Fatal("visita cerrada no debe cancelarse")
	}
}

func TestVisitaIngresoCancelable_nil(t *testing.T) {
	t.Parallel()
	if visitaIngresoCancelable(nil, 7, time.Now(), cancelarIngresoVentana) {
		t.Fatal("nil nunca es cancelable")
	}
}
