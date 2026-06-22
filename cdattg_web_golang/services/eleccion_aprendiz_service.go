package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func (s *eleccionService) GetRepresentantesVigentes(regionalID uint) (*dto.RepresentanteAprendizResponse, error) {
	rep, err := s.repo.FindRepresentantesVigentesByRegional(regionalID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	resp := mapRepresentanteToDTO(rep)
	return &resp, nil
}

func (s *eleccionService) GetHistorialRepresentantes(userID uint, roles []string, regionalID uint) ([]dto.RepresentanteAprendizResponse, error) {
	scope, err := s.resolveScope(userID, roles)
	if err != nil {
		return nil, err
	}
	if err := assertEleccionScope(s.scopeSvc, scope, regionalID); err != nil {
		return nil, err
	}
	list, err := s.repo.FindRepresentantesHistorial(regionalID)
	if err != nil {
		return nil, err
	}
	out := make([]dto.RepresentanteAprendizResponse, len(list))
	for i := range list {
		out[i] = mapRepresentanteToDTO(&list[i])
	}
	return out, nil
}

func buildMiRegionalBase(aprendiz *models.Aprendiz, regionalID uint) *dto.EleccionMiRegionalResponse {
	resp := &dto.EleccionMiRegionalResponse{
		RegionalID:   regionalID,
		MiAprendizID: &aprendiz.ID,
	}
	if nombre := regionalNombreFromAprendiz(aprendiz); nombre != "" {
		resp.RegionalNombre = nombre
	}
	return resp
}

func (s *eleccionService) enrichRespuestaProcesoActivo(
	resp *dto.EleccionMiRegionalResponse,
	proceso *models.EleccionProceso,
	aprendiz *models.Aprendiz,
	userID uint,
	personaID *uint,
) {
	pr := s.enrichProcesoResponse(proceso)
	resp.Proceso = &pr
	esCandidato, _ := s.repo.ExistsAprendizEnPlancha(proceso.ID, aprendiz.ID)
	resp.EsCandidato = esCandidato
	if v, errV := s.repo.FindVotoByProcesoAndUser(proceso.ID, userID); errV == nil {
		resp.MiVotoPlanchaID = &v.PlanchaID
		resp.YaVoto = true
	}
	resp.PuedePostular = s.puedePostularEnProceso(proceso, aprendiz, esCandidato)
	resp.PuedeVotar = proceso.Estado == models.EleccionEstadoVotacion && !resp.YaVoto
	pendientes, _ := s.repo.ListPlanchasByProceso(proceso.ID, false)
	resp.PlanchasPendientesConfirmar = s.mapPlanchas(filterPendientesConfirmacion(pendientes, aprendiz.ID), personaID, aprendiz.ID)
}

func (s *eleccionService) GetMiRegional(userID uint, personaID *uint) (*dto.EleccionMiRegionalResponse, error) {
	if personaID == nil {
		return nil, errEleccionUsuarioSinPersona
	}
	aprendiz, err := s.findAprendizElegible(*personaID)
	if err != nil {
		return nil, err
	}
	regionalID, err := regionalIDFromAprendiz(aprendiz)
	if err != nil {
		return nil, err
	}
	resp := buildMiRegionalBase(aprendiz, regionalID)
	if rep, err := s.GetRepresentantesVigentes(regionalID); err == nil && rep != nil {
		resp.RepresentantesVigentes = rep
	}
	proceso, err := s.repo.FindProcesoActivoByRegional(regionalID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if proceso != nil {
		s.enrichRespuestaProcesoActivo(resp, proceso, aprendiz, userID, personaID)
	}
	return resp, nil
}
