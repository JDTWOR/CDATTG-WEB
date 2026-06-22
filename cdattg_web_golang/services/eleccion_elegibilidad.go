package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func regionalIDFromAprendiz(a *models.Aprendiz) (uint, error) {
	if a == nil || a.FichaCaracterizacion == nil || a.FichaCaracterizacion.Sede == nil || a.FichaCaracterizacion.Sede.RegionalID == nil {
		return 0, errEleccionAprendizRegional
	}
	return *a.FichaCaracterizacion.Sede.RegionalID, nil
}

func regionalNombreFromAprendiz(aprendiz *models.Aprendiz) string {
	if aprendiz.FichaCaracterizacion == nil || aprendiz.FichaCaracterizacion.Sede == nil || aprendiz.FichaCaracterizacion.Sede.Regional == nil {
		return ""
	}
	return aprendiz.FichaCaracterizacion.Sede.Regional.Nombre
}

func (s *eleccionService) aprendizActivoEnRegional(personaID uint, regionalID uint) (*models.Aprendiz, error) {
	a, err := s.aprendizRepo.FindActivoByPersonaID(personaID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errEleccionNoElegible
		}
		return nil, err
	}
	rid, err := regionalIDFromAprendiz(a)
	if err != nil || rid != regionalID {
		return nil, errEleccionAprendizRegional
	}
	return a, nil
}

func (s *eleccionService) findAprendizElegible(personaID uint) (*models.Aprendiz, error) {
	aprendiz, err := s.aprendizRepo.FindActivoByPersonaID(personaID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errEleccionNoElegible
		}
		return nil, err
	}
	return aprendiz, nil
}

func (s *eleccionService) minDiasMatricula(p *models.EleccionProceso) int {
	if p.MinDiasMatricula != nil && *p.MinDiasMatricula > 0 {
		return *p.MinDiasMatricula
	}
	return EleccionMinDiasMatriculaDefault
}

func (s *eleccionService) validarElegibilidadCandidato(a *models.Aprendiz, p *models.EleccionProceso) error {
	if a == nil || !a.Estado {
		return errEleccionNoElegible
	}
	minDias := s.minDiasMatricula(p)
	if time.Since(a.CreatedAt) < time.Duration(minDias)*24*time.Hour {
		return fmt.Errorf("%w: requiere al menos %d días matriculado", errEleccionNoElegible, minDias)
	}
	exIDs, err := s.repo.FindAprendizIDsExRepresentantes(p.RegionalID, p.Anio)
	if err != nil {
		return err
	}
	for _, id := range exIDs {
		if id == a.ID {
			return fmt.Errorf("%w: no puede reelegirse como representante", errEleccionNoElegible)
		}
	}
	return nil
}

func (s *eleccionService) puedePostularEnProceso(proceso *models.EleccionProceso, aprendiz *models.Aprendiz, esCandidato bool) bool {
	if proceso.Estado != models.EleccionEstadoInscripcion || esCandidato {
		return false
	}
	return s.validarElegibilidadCandidato(aprendiz, proceso) == nil
}
