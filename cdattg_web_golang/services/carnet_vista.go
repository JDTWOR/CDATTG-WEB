/**
 * Arma la vista completa de una solicitud para el instructor líder.
 * Lo hice para que pueda revisar foto y datos antes de aceptar o devolver.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// VerSolicitud entrega el carnet tal como lo vería el aprendiz.
func (s *carnetDigitalService) VerSolicitud(instructorID, solicitudID uint) (*dto.CarnetVistaInstructor, error) {
	sol, err := s.solicitudRepo.FindByID(solicitudID)
	if err != nil {
		return nil, err
	}
	if !s.esLiderDeSolicitud(instructorID, sol) {
		return nil, errCarnetNoLider
	}
	ficha, _ := s.fichaRepo.FindByID(sol.FichaID)
	vista := vistaDesdeSolicitud(*sol, ficha)
	return &vista, nil
}

// vistaDesdeSolicitud junta el paquete enviado con la ficha viva (regional y vencimiento).
func vistaDesdeSolicitud(sol models.CarnetSolicitud, ficha *models.FichaCaracterizacion) dto.CarnetVistaInstructor {
	op := dto.CarnetFichaOpcion{
		ID:            sol.FichaID,
		Numero:        sol.FichaNumero,
		Programa:      sol.Programa,
		TipoFormacion: sol.TipoFormacion,
		TipoLabel:     etiquetaTipoFormacion(sol.TipoFormacion),
		CentroNombre:  carnetCentroCDATTG,
		Regional:      etiquetaRegionalCarnet(""),
	}
	if ficha != nil {
		live := fichaACarnetOpcion(ficha)
		op.Regional = live.Regional
		op.FechaFin = live.FechaFin
		op.CentroNombre = live.CentroNombre
		if op.Numero == "" {
			op.Numero = live.Numero
		}
		if op.Programa == "" {
			op.Programa = live.Programa
		}
	}
	return dto.CarnetVistaInstructor{ID: sol.ID, Persona: solicitudACarnetDatos(sol), Ficha: op}
}
