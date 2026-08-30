/**
 * Pruebo que el carnet no se publique sin aprobación del líder.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestArmarRespuestaCarnetSinAprobacion(t *testing.T) {
	t.Parallel()
	p := models.Persona{PrimerNombre: "Ana", PrimerApellido: "Rojas", NumeroDocumento: "1", Rh: "O+", FotoPath: "a.jpg"}
	fichas := []dto.CarnetFichaOpcion{{ID: 1, Numero: "1", Accion: carnetAccionCrear}}
	r := armarRespuestaCarnet(p, fichas, nil)
	if r.Habilitado || r.Motivo != carnetMotivoSinSolicitud || !r.PuedeSolicitar {
		t.Fatalf("%+v", r)
	}
}

func TestArmarRespuestaCarnetPendiente(t *testing.T) {
	t.Parallel()
	p := models.Persona{PrimerNombre: "Ana", PrimerApellido: "Rojas", NumeroDocumento: "1", Rh: "O+", FotoPath: "a.jpg"}
	fichas := []dto.CarnetFichaOpcion{{ID: 1, EstadoSolicitud: models.CarnetEstadoPendiente}}
	r := armarRespuestaCarnet(p, fichas, nil)
	if r.Habilitado || r.Motivo != carnetMotivoPendiente || r.PuedeSolicitar {
		t.Fatalf("%+v", r)
	}
}

func TestArmarRespuestaCarnetAprobado(t *testing.T) {
	t.Parallel()
	p := models.Persona{PrimerNombre: "Nuevo", PrimerApellido: "X", NumeroDocumento: "9"}
	ap := &models.CarnetSolicitud{Nombres: "ANA", Apellidos: "ROJAS", NumeroDocumento: "1", Rh: "O+", FotoPath: "a.jpg"}
	fichas := []dto.CarnetFichaOpcion{{ID: 1, Accion: carnetAccionRenovar, EstadoSolicitud: models.CarnetEstadoAprobado}}
	r := armarRespuestaCarnet(p, fichas, ap)
	if !r.Habilitado || r.Persona.Nombres != "ANA" {
		t.Fatalf("%+v", r)
	}
}

func TestArmarRespuestaCarnetDevuelto(t *testing.T) {
	t.Parallel()
	p := models.Persona{PrimerNombre: "Ana", PrimerApellido: "Rojas", NumeroDocumento: "1", Rh: "O+", FotoPath: "a.jpg"}
	fichas := []dto.CarnetFichaOpcion{{ID: 1, EstadoSolicitud: models.CarnetEstadoDevuelto, Accion: carnetAccionCrear}}
	r := armarRespuestaCarnet(p, fichas, nil)
	if r.Habilitado || r.Motivo != carnetMotivoDevuelto || !r.PuedeSolicitar {
		t.Fatalf("%+v", r)
	}
}
