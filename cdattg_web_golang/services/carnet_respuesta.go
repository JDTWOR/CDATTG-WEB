/**
 * Armo la respuesta del carnet según ficha vigente y validación.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

const carnetMotivoDevuelto = "devuelto"

func armarRespuestaCarnet(
	persona models.Persona,
	fichas []dto.CarnetFichaOpcion,
	aprobada *models.CarnetSolicitud,
) *dto.CarnetDigitalResponse {
	resp := &dto.CarnetDigitalResponse{
		Fichas:          fichas,
		EstadoSolicitud: "ninguna",
		Persona:         personaACarnetDatos(persona),
	}
	if len(fichas) == 0 {
		resp.Motivo = carnetMotivoSinVigente
		return resp
	}
	if aprobada != nil {
		resp.Habilitado = true
		resp.EstadoSolicitud = models.CarnetEstadoAprobado
		resp.Persona = solicitudACarnetDatos(*aprobada)
	}
	aplicarMotivoGlobal(resp)
	resp.PuedeSolicitar = datosListosParaCarnet(persona) && algunaAccionFicha(fichas)
	return resp
}

func aplicarMotivoGlobal(resp *dto.CarnetDigitalResponse) {
	for i := range resp.Fichas {
		if resp.Fichas[i].EstadoSolicitud == models.CarnetEstadoPendiente {
			resp.EstadoSolicitud = models.CarnetEstadoPendiente
			if !resp.Habilitado {
				resp.Motivo = carnetMotivoPendiente
			}
			return
		}
	}
	if resp.Habilitado {
		return
	}
	if algunaDevueltaFicha(resp.Fichas) {
		resp.EstadoSolicitud = models.CarnetEstadoDevuelto
		resp.Motivo = carnetMotivoDevuelto
		return
	}
	resp.Motivo = carnetMotivoSinSolicitud
}

func algunaAccionFicha(fichas []dto.CarnetFichaOpcion) bool {
	for i := range fichas {
		if fichas[i].Accion != "" {
			return true
		}
	}
	return false
}

func algunaDevueltaFicha(fichas []dto.CarnetFichaOpcion) bool {
	for i := range fichas {
		if fichas[i].EstadoSolicitud == models.CarnetEstadoDevuelto {
			return true
		}
	}
	return false
}

func solicitudACarnetDatos(s models.CarnetSolicitud) dto.CarnetPersonaDatos {
	return dto.CarnetPersonaDatos{
		Nombres:            strings.ToUpper(s.Nombres),
		Apellidos:          strings.ToUpper(s.Apellidos),
		NumeroDocumento:    s.NumeroDocumento,
		TipoDocumentoLabel: "CC",
		Rh:                 s.Rh,
		TieneFoto:          s.FotoPath != "",
	}
}

func datosListosParaCarnet(p models.Persona) bool {
	return strings.TrimSpace(p.PrimerNombre) != "" &&
		strings.TrimSpace(p.PrimerApellido) != "" &&
		strings.TrimSpace(p.NumeroDocumento) != "" &&
		strings.TrimSpace(p.Rh) != "" &&
		strings.TrimSpace(p.FotoPath) != ""
}
