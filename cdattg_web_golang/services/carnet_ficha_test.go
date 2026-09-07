/**
 * Pruebo grupos de ficha, crear/renovar y el líder de esa ficha.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestEtiquetaTipoFormacion(t *testing.T) {
	t.Parallel()
	if etiquetaTipoFormacion(models.TipoFormacionComplementaria) != "Complementaria" {
		t.Fatal("complementaria")
	}
	if etiquetaTipoFormacion(models.TipoFormacionMediaTecnica) != "Media técnica" {
		t.Fatal("media")
	}
	if etiquetaTipoFormacion(models.TipoFormacionRegular) != "Regular" {
		t.Fatal("regular")
	}
}

func TestAccionCarnet(t *testing.T) {
	t.Parallel()
	if accionCarnet(false, true, false) != carnetAccionCrear {
		t.Fatal("primera vez crea")
	}
	if accionCarnet(true, true, false) != carnetAccionRenovar {
		t.Fatal("ya aprobado renueva")
	}
	if accionCarnet(false, true, true) != "" || accionCarnet(true, false, false) != "" {
		t.Fatal("sin botón si falta dato o está pendiente")
	}
}

func TestAplicarEstadosFichasDevuelto(t *testing.T) {
	t.Parallel()
	fichas := []dto.CarnetFichaOpcion{{ID: 7}}
	ultimas := map[uint]models.CarnetSolicitud{7: {Estado: models.CarnetEstadoRechazado}}
	aplicarEstadosFichas(fichas, ultimas, true)
	if fichas[0].EstadoSolicitud != models.CarnetEstadoDevuelto || fichas[0].Accion != carnetAccionCrear {
		t.Fatalf("%+v", fichas[0])
	}
}

func TestAplicarEstadosFichasNoApruebaLasOtras(t *testing.T) {
	t.Parallel()
	fichas := []dto.CarnetFichaOpcion{{ID: 1}, {ID: 2}}
	ultimas := map[uint]models.CarnetSolicitud{1: {Estado: models.CarnetEstadoAprobado}}
	aplicarEstadosFichas(fichas, ultimas, true)
	if fichas[0].Accion != carnetAccionRenovar || fichas[0].EstadoSolicitud != models.CarnetEstadoAprobado {
		t.Fatalf("ficha 1 %+v", fichas[0])
	}
	if fichas[1].Accion != carnetAccionCrear || fichas[1].EstadoSolicitud != "ninguna" {
		t.Fatalf("ficha 2 no debe salir aprobada %+v", fichas[1])
	}
}

func TestFichaMatriculaYLider(t *testing.T) {
	t.Parallel()
	hoy := time.Date(2026, 8, 29, 0, 0, 0, 0, time.UTC)
	fin := hoy.AddDate(0, 1, 0)
	lid := uint(74)
	ficha := models.FichaCaracterizacion{Status: true, FechaFin: &fin, InstructorID: &lid}
	ficha.ID = 52
	if fichaMatriculaVigente([]models.Aprendiz{{FichaCaracterizacion: &ficha}}, 52, hoy) == nil {
		t.Fatal("debe hallar la ficha")
	}
	if fichaMatriculaVigente([]models.Aprendiz{{FichaCaracterizacion: &ficha}}, 9, hoy) != nil {
		t.Fatal("otra ficha no vale")
	}
	if !fichaTieneLider(&ficha) || !liderTieneFicha([]uint{1, 52}, 52) || liderTieneFicha([]uint{1}, 52) {
		t.Fatal("líder")
	}
}

func TestTablaCarnetAusente(t *testing.T) {
	t.Parallel()
	if !tablaCarnetAusente(errors.New(`relation "carnet_solicitudes" does not exist`)) {
		t.Fatal("debe detectar la tabla faltante")
	}
	if tablaCarnetAusente(errors.New("otra cosa")) {
		t.Fatal("otro error no es tabla faltante")
	}
}
