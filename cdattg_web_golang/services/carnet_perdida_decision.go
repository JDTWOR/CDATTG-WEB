/**
 * Acciones del bibliotecario sobre una reposición: decidir (aprobar o devolver)
 * y renovar (cerrar al entregar el carnet). El historial queda servido por
 * carnet_perdida_consulta.go.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// Decidir acepta la reposición (pasa a espera) o la devuelve con motivo.
func (s *carnetPerdidaService) Decidir(userID, solicitudID uint, aprobar bool, motivo string) (*dto.CarnetPerdidaItem, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	if sol.Estado != models.CarnetPerdidaEstadoPendiente {
		return nil, errCarnetPerdidaYaDecidida
	}
	if aprobar {
		sol.Estado = models.CarnetPerdidaEstadoEspera
		sol.AprobadoPorUserID = &userID
		now := time.Now()
		sol.AprobadoEn = &now
		sol.MotivoRechazo = ""
	} else {
		sol.Estado = models.CarnetPerdidaEstadoDevuelto
		sol.MotivoRechazo = motivo
	}
	if err := s.perdidaRepo.Update(sol); err != nil {
		return nil, err
	}
	s.notif.ResultadoAprendiz(sol, aprobar)
	item := perdidaAItem(*sol)
	return &item, nil
}

// Renovar cierra la reposición: el carnet renovado fue entregado y la
// solicitud pasa al historial.
func (s *carnetPerdidaService) Renovar(userID, solicitudID uint) (*dto.CarnetPerdidaItem, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	if sol.Estado != models.CarnetPerdidaEstadoEspera {
		return nil, errors.New("solo se renueva una reposición en espera")
	}
	sol.Estado = models.CarnetPerdidaEstadoRenovado
	sol.AprobadoPorUserID = &userID
	now := time.Now()
	sol.AprobadoEn = &now
	if err := s.perdidaRepo.Update(sol); err != nil {
		return nil, err
	}
	s.notif.Renovada(sol)
	item := perdidaAItem(*sol)
	return &item, nil
}
