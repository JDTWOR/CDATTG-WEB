package services

import (
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *eleccionService) enrichProcesoResponse(p *models.EleccionProceso) dto.EleccionProcesoResponse {
	resp := mapProcesoToDTO(p)
	if n, err := s.repo.CountPlanchasConfirmadas(p.ID); err == nil {
		resp.PlanchasConfirmadas = int(n)
	}
	if n, err := s.repo.CountVotosByProceso(p.ID); err == nil {
		resp.VotosRegistrados = int(n)
	}
	if n, err := s.repo.CountAprendicesActivosByRegional(p.RegionalID); err == nil {
		resp.AprendicesElegibles = int(n)
	}
	return resp
}

func (s *eleccionService) assertCicloUnicoRegionalAnio(regionalID uint, anio int, excludeID uint) error {
	exists, err := s.repo.ExistsProcesoByRegionalAnio(regionalID, anio, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return errEleccionCicloDuplicado
	}
	return nil
}

func (s *eleccionService) ListProcesos(userID uint, roles []string) ([]dto.EleccionProcesoResponse, error) {
	scope, err := s.resolveScope(userID, roles)
	if err != nil {
		return nil, err
	}
	if scope.Empty {
		return []dto.EleccionProcesoResponse{}, nil
	}
	list, err := s.repo.ListProcesos(scope.RegionalIDs, scope.Unrestricted)
	if err != nil {
		return nil, err
	}
	out := make([]dto.EleccionProcesoResponse, len(list))
	for i := range list {
		out[i] = s.enrichProcesoResponse(&list[i])
	}
	return out, nil
}

func (s *eleccionService) GetProceso(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, id)
	if err != nil {
		return nil, err
	}
	resp := s.enrichProcesoResponse(p)
	return &resp, nil
}

func (s *eleccionService) CreateProceso(userID uint, roles []string, req dto.EleccionProcesoRequest) (*dto.EleccionProcesoResponse, error) {
	scope, err := s.resolveScope(userID, roles)
	if err != nil {
		return nil, err
	}
	if err := assertEleccionScope(s.scopeSvc, scope, req.RegionalID); err != nil {
		return nil, err
	}
	if err := s.assertCicloUnicoRegionalAnio(req.RegionalID, req.Anio, 0); err != nil {
		return nil, err
	}
	p := &models.EleccionProceso{
		RegionalID:             req.RegionalID,
		Anio:                   req.Anio,
		NombreCiclo:            strings.TrimSpace(req.NombreCiclo),
		Estado:                 models.EleccionEstadoBorrador,
		FechaInscripcionInicio: req.FechaInscripcionInicio,
		FechaInscripcionFin:    req.FechaInscripcionFin,
		FechaVotacionInicio:    req.FechaVotacionInicio,
		FechaVotacionFin:       req.FechaVotacionFin,
		MinDiasMatricula:       req.MinDiasMatricula,
		UserAuditModel:         models.UserAuditModel{UserCreateID: &userID},
	}
	if err := s.repo.CreateProceso(p); err != nil {
		return nil, err
	}
	p, _ = s.repo.FindProcesoByID(p.ID)
	resp := s.enrichProcesoResponse(p)
	return &resp, nil
}

func (s *eleccionService) UpdateProceso(userID uint, roles []string, id uint, req dto.EleccionProcesoRequest) (*dto.EleccionProcesoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, id)
	if err != nil {
		return nil, err
	}
	if p.Estado == models.EleccionEstadoCerrada {
		return nil, errors.New("no se puede editar un proceso cerrado")
	}
	if err := s.assertCicloUnicoRegionalAnio(req.RegionalID, req.Anio, p.ID); err != nil {
		return nil, err
	}
	p.RegionalID = req.RegionalID
	p.Anio = req.Anio
	p.NombreCiclo = strings.TrimSpace(req.NombreCiclo)
	p.FechaInscripcionInicio = req.FechaInscripcionInicio
	p.FechaInscripcionFin = req.FechaInscripcionFin
	p.FechaVotacionInicio = req.FechaVotacionInicio
	p.FechaVotacionFin = req.FechaVotacionFin
	p.MinDiasMatricula = req.MinDiasMatricula
	p.UserEditID = &userID
	if err := s.repo.UpdateProceso(p); err != nil {
		return nil, err
	}
	resp := s.enrichProcesoResponse(p)
	return &resp, nil
}

func (s *eleccionService) CambiarEstadoProceso(userID uint, roles []string, id uint, estado string) (*dto.EleccionProcesoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, id)
	if err != nil {
		return nil, err
	}
	switch estado {
	case models.EleccionEstadoBorrador, models.EleccionEstadoInscripcion, models.EleccionEstadoVotacion, models.EleccionEstadoCerrada:
		p.Estado = estado
	default:
		return nil, errors.New("estado no válido")
	}
	p.UserEditID = &userID
	if err := s.repo.UpdateProceso(p); err != nil {
		return nil, err
	}
	resp := s.enrichProcesoResponse(p)
	return &resp, nil
}

func (s *eleccionService) CerrarInscripcion(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error) {
	return s.transitionToVotacion(userID, roles, id)
}

func (s *eleccionService) AbrirVotacion(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error) {
	return s.transitionToVotacion(userID, roles, id)
}

func (s *eleccionService) transitionToVotacion(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error) {
	return s.CambiarEstadoProceso(userID, roles, id, models.EleccionEstadoVotacion)
}
