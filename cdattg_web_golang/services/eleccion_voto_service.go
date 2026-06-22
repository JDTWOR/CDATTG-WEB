package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func (s *eleccionService) RegistrarVoto(userID uint, personaID *uint, procesoID uint, req dto.EleccionVotoRequest) (*dto.EleccionVotoResponse, error) {
	if personaID == nil {
		return nil, errEleccionUsuarioSinPersona
	}
	p, err := s.repo.FindProcesoByID(procesoID)
	if err != nil {
		return nil, errEleccionProcesoNoEncontrado
	}
	if p.Estado != models.EleccionEstadoVotacion {
		return nil, errEleccionFaseInvalida
	}
	aprendiz, err := s.aprendizActivoEnRegional(*personaID, p.RegionalID)
	if err != nil {
		return nil, err
	}
	if _, errV := s.repo.FindVotoByProcesoAndUser(p.ID, userID); errV == nil {
		return nil, errEleccionVotoYaRegistrado
	} else if !errors.Is(errV, gorm.ErrRecordNotFound) {
		return nil, errV
	}
	plancha, err := s.repo.FindPlanchaByID(req.PlanchaID)
	if err != nil || plancha.ProcesoID != p.ID || plancha.Estado != models.PlanchaEstadoConfirmada {
		return nil, errors.New("plancha no válida para votar")
	}
	voto := &models.EleccionVoto{
		ProcesoID:         p.ID,
		PlanchaID:         plancha.ID,
		VotanteUserID:     userID,
		VotanteAprendizID: aprendiz.ID,
	}
	if err := s.repo.CreateVoto(voto); err != nil {
		return nil, err
	}
	nombre := nombreAprendiz(aprendiz)
	v, _ := s.repo.FindVotoByProcesoAndUser(p.ID, userID)
	return &dto.EleccionVotoResponse{
		ProcesoID:     p.ID,
		PlanchaID:     plancha.ID,
		VotanteNombre: nombre,
		UpdatedAt:     v.UpdatedAt,
	}, nil
}
