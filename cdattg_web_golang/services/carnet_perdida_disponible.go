/**
 * NotificarDisponible avisa al aprendiz que su carnet renovado ya está listo
 * para recoger. No cambia el estado: solo crea la notificación de turno.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/models"
)

var errCarnetPerdidaNoEnEspera = errors.New("el carnet aún no está en espera de renovación física")

// NotificarDisponible valida que la reposición siga en espera y avisa al aprendiz.
func (s *carnetPerdidaService) NotificarDisponible(solicitudID uint) error {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return errCarnetPerdidaNoEncontrada
	}
	if sol.Estado != models.CarnetPerdidaEstadoEspera {
		return errCarnetPerdidaNoEnEspera
	}
	s.notif.Disponible(sol)
	return nil
}
