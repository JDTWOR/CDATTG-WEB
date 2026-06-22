package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *eleccionService) ListPlanchas(userID uint, roles []string, procesoID uint, soloConfirmadas bool) ([]dto.EleccionPlanchaResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, procesoID)
	if err != nil {
		return nil, err
	}
	list, err := s.repo.ListPlanchasByProceso(p.ID, soloConfirmadas)
	if err != nil {
		return nil, err
	}
	return s.mapPlanchas(list, nil, 0), nil
}

func (s *eleccionService) validarCandidatosPlancha(p *models.EleccionProceso, titular, suplente *models.Aprendiz) error {
	for _, a := range []*models.Aprendiz{titular, suplente} {
		rid, errR := regionalIDFromAprendiz(a)
		if errR != nil || rid != p.RegionalID {
			return errEleccionAprendizRegional
		}
		if err := s.validarElegibilidadCandidato(a, p); err != nil {
			return err
		}
		exists, errE := s.repo.ExistsAprendizEnPlancha(p.ID, a.ID)
		if errE != nil {
			return errE
		}
		if exists {
			return errors.New("uno de los aprendices ya está inscrito en otra plancha")
		}
	}
	return nil
}

func (s *eleccionService) validarProponentePlancha(p *models.EleccionProceso, proponente *models.Aprendiz) error {
	if err := s.validarElegibilidadCandidato(proponente, p); err != nil {
		return err
	}
	exists, err := s.repo.ExistsAprendizEnPlancha(p.ID, proponente.ID)
	if err != nil {
		return err
	}
	if exists {
		return errEleccionYaEnPlancha
	}
	return nil
}

func resolveCandidatosPlancha(proponenteID uint, req dto.EleccionPlanchaRequest) (titularID, suplenteID uint, err error) {
	if req.CompaneroAprendizID == 0 {
		return 0, 0, errors.New("debe indicar al compañero de plancha")
	}
	switch req.RolCandidatura {
	case "titular":
		return proponenteID, req.CompaneroAprendizID, nil
	case "suplente":
		return req.CompaneroAprendizID, proponenteID, nil
	default:
		return 0, 0, errors.New("rol de candidatura inválido")
	}
}

func buildPlanchaPropuesta(
	p *models.EleccionProceso,
	userID uint,
	titular, suplente *models.Aprendiz,
	proponenteID uint,
) *models.EleccionPlancha {
	now := time.Now()
	plancha := &models.EleccionPlancha{
		ProcesoID:          p.ID,
		TitularAprendizID:  titular.ID,
		SuplenteAprendizID: suplente.ID,
		Estado:             models.PlanchaEstadoPendiente,
		PropuestaPorUserID: &userID,
		UserAuditModel:     models.UserAuditModel{UserCreateID: &userID},
	}
	if proponenteID == titular.ID {
		plancha.TitularConfirmadoAt = &now
	}
	if proponenteID == suplente.ID {
		plancha.SuplenteConfirmadoAt = &now
	}
	if plancha.TitularConfirmadoAt != nil && plancha.SuplenteConfirmadoAt != nil {
		plancha.Estado = models.PlanchaEstadoConfirmada
	}
	return plancha
}

func filterPendientesConfirmacion(list []models.EleccionPlancha, aprendizID uint) []models.EleccionPlancha {
	out := make([]models.EleccionPlancha, 0)
	for i := range list {
		pl := list[i]
		if pl.Estado != models.PlanchaEstadoPendiente {
			continue
		}
		if pl.TitularAprendizID == aprendizID && pl.TitularConfirmadoAt == nil {
			out = append(out, pl)
			continue
		}
		if pl.SuplenteAprendizID == aprendizID && pl.SuplenteConfirmadoAt == nil {
			out = append(out, pl)
		}
	}
	return out
}

func (s *eleccionService) ProponerPlancha(userID uint, personaID *uint, procesoID uint, req dto.EleccionPlanchaRequest) (*dto.EleccionPlanchaResponse, error) {
	if personaID == nil {
		return nil, errEleccionUsuarioSinPersona
	}
	p, err := s.repo.FindProcesoByID(procesoID)
	if err != nil {
		return nil, errEleccionProcesoNoEncontrado
	}
	if p.Estado != models.EleccionEstadoInscripcion {
		return nil, errEleccionFaseInvalida
	}
	proponente, err := s.aprendizActivoEnRegional(*personaID, p.RegionalID)
	if err != nil {
		return nil, err
	}
	if err := s.validarProponentePlancha(p, proponente); err != nil {
		return nil, err
	}
	titularID, suplenteID, err := resolveCandidatosPlancha(proponente.ID, req)
	if err != nil {
		return nil, err
	}
	if titularID == suplenteID {
		return nil, errors.New("titular y suplente deben ser aprendices distintos")
	}
	titular, err := s.aprendizRepo.FindByID(titularID)
	if err != nil {
		return nil, err
	}
	suplente, err := s.aprendizRepo.FindByID(suplenteID)
	if err != nil {
		return nil, err
	}
	if err := s.validarCandidatosPlancha(p, titular, suplente); err != nil {
		return nil, err
	}
	plancha := buildPlanchaPropuesta(p, userID, titular, suplente, proponente.ID)
	if err := s.repo.CreatePlancha(plancha); err != nil {
		return nil, err
	}
	plancha, _ = s.repo.FindPlanchaByID(plancha.ID)
	resp := s.mapPlanchas([]models.EleccionPlancha{*plancha}, personaID, proponente.ID)[0]
	return &resp, nil
}

func (s *eleccionService) ConfirmarPlancha(userID uint, personaID *uint, planchaID uint) (*dto.EleccionPlanchaResponse, error) {
	if personaID == nil {
		return nil, errEleccionUsuarioSinPersona
	}
	plancha, err := s.repo.FindPlanchaByID(planchaID)
	if err != nil {
		return nil, errEleccionPlanchaNoEncontrada
	}
	if plancha.Proceso == nil || plancha.Proceso.Estado != models.EleccionEstadoInscripcion {
		return nil, errEleccionFaseInvalida
	}
	if plancha.Estado != models.PlanchaEstadoPendiente {
		return nil, errors.New("la plancha no está pendiente de confirmación")
	}
	aprendiz, err := s.aprendizActivoEnRegional(*personaID, plancha.Proceso.RegionalID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	if aprendiz.ID == plancha.TitularAprendizID && plancha.TitularConfirmadoAt == nil {
		plancha.TitularConfirmadoAt = &now
	} else if aprendiz.ID == plancha.SuplenteAprendizID && plancha.SuplenteConfirmadoAt == nil {
		plancha.SuplenteConfirmadoAt = &now
	} else {
		return nil, errors.New("no está autorizado para confirmar esta plancha")
	}
	if plancha.TitularConfirmadoAt != nil && plancha.SuplenteConfirmadoAt != nil {
		plancha.Estado = models.PlanchaEstadoConfirmada
	}
	plancha.UserEditID = &userID
	if err := s.repo.UpdatePlancha(plancha); err != nil {
		return nil, err
	}
	plancha, _ = s.repo.FindPlanchaByID(plancha.ID)
	resp := s.mapPlanchas([]models.EleccionPlancha{*plancha}, personaID, aprendiz.ID)[0]
	return &resp, nil
}

func (s *eleccionService) RechazarPlancha(userID uint, roles []string, planchaID uint, req dto.EleccionRechazarPlanchaRequest) error {
	plancha, err := s.repo.FindPlanchaByID(planchaID)
	if err != nil {
		return errEleccionPlanchaNoEncontrada
	}
	if plancha.Proceso == nil {
		return errEleccionProcesoNoEncontrado
	}
	scope, err := s.resolveScope(userID, roles)
	if err != nil {
		return err
	}
	if err := assertEleccionScope(s.scopeSvc, scope, plancha.Proceso.RegionalID); err != nil {
		return err
	}
	motivo := strings.TrimSpace(req.Motivo)
	plancha.Estado = models.PlanchaEstadoRechazada
	plancha.MotivoRechazo = &motivo
	plancha.UserEditID = &userID
	return s.repo.UpdatePlancha(plancha)
}

func (s *eleccionService) RetirarPlancha(userID uint, personaID *uint, planchaID uint) error {
	if personaID == nil {
		return errEleccionUsuarioSinPersona
	}
	plancha, err := s.repo.FindPlanchaByID(planchaID)
	if err != nil {
		return errEleccionPlanchaNoEncontrada
	}
	aprendiz, err := s.aprendizActivoEnRegional(*personaID, plancha.Proceso.RegionalID)
	if err != nil {
		return err
	}
	if aprendiz.ID != plancha.TitularAprendizID && aprendiz.ID != plancha.SuplenteAprendizID && (plancha.PropuestaPorUserID == nil || *plancha.PropuestaPorUserID != userID) {
		return errors.New("no autorizado para retirar esta plancha")
	}
	plancha.Estado = models.PlanchaEstadoRetirada
	plancha.UserEditID = &userID
	return s.repo.UpdatePlancha(plancha)
}

func (s *eleccionService) ListPlanchasConfirmadasAprendiz(personaID *uint, procesoID uint) ([]dto.EleccionPlanchaResponse, error) {
	if personaID == nil {
		return nil, errEleccionUsuarioSinPersona
	}
	p, err := s.repo.FindProcesoByID(procesoID)
	if err != nil {
		return nil, errEleccionProcesoNoEncontrado
	}
	if _, err := s.aprendizActivoEnRegional(*personaID, p.RegionalID); err != nil {
		return nil, err
	}
	list, err := s.repo.ListPlanchasByProceso(p.ID, true)
	if err != nil {
		return nil, err
	}
	aprendiz, _ := s.aprendizRepo.FindActivoByPersonaID(*personaID)
	miID := uint(0)
	if aprendiz != nil {
		miID = aprendiz.ID
	}
	return s.mapPlanchas(list, personaID, miID), nil
}
