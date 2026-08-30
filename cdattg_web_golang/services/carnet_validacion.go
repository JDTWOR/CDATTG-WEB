/**
 * El instructor líder aprueba o devuelve el carnet de su ficha.
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

var (
	errCarnetNoLider     = errors.New("solo el instructor líder de la ficha puede validar este carnet")
	errCarnetNoPendiente = errors.New("esta solicitud ya no está pendiente")
)

// ListarPendientes trae solicitudes de fichas donde el instructor es líder.
func (s *carnetDigitalService) ListarPendientes(instructorID uint) ([]dto.CarnetPendienteItem, error) {
	fichaIDs, err := s.solicitudRepo.FindFichaIDsDeLider(instructorID)
	if err != nil {
		return nil, err
	}
	list, err := s.solicitudRepo.FindPendientesDeFichas(fichaIDs)
	if err != nil {
		if tablaCarnetAusente(err) {
			return []dto.CarnetPendienteItem{}, nil
		}
		return nil, err
	}
	return pendientesAItems(list), nil
}

func pendientesAItems(list []models.CarnetSolicitud) []dto.CarnetPendienteItem {
	out := make([]dto.CarnetPendienteItem, 0, len(list))
	for i := range list {
		out = append(out, dto.CarnetPendienteItem{
			ID: list[i].ID, PersonaID: list[i].PersonaID,
			Nombres: list[i].Nombres, Apellidos: list[i].Apellidos,
			NumeroDocumento: list[i].NumeroDocumento, Rh: list[i].Rh,
			FichaID: list[i].FichaID, FichaNumero: list[i].FichaNumero,
			Programa: list[i].Programa, TipoFormacion: list[i].TipoFormacion,
			TipoLabel: etiquetaTipoFormacion(list[i].TipoFormacion),
		})
	}
	return out
}

// Decidir aprueba o devuelve si el instructor es líder de esa ficha.
func (s *carnetDigitalService) Decidir(instructorID, solicitudID uint, aprobar bool, _ string) error {
	sol, err := s.solicitudRepo.FindByID(solicitudID)
	if err != nil {
		return err
	}
	if sol.Estado != models.CarnetEstadoPendiente {
		return errCarnetNoPendiente
	}
	if !s.esLiderDeSolicitud(instructorID, sol) {
		return errCarnetNoLider
	}
	aplicarDecision(sol, instructorID, aprobar, time.Now())
	if err := s.solicitudRepo.Update(sol); err != nil {
		return err
	}
	// Si aprueba y la foto aún es la de perfil, dejo la copia del carnet.
	if aprobar {
		fijarFotoCopiaSolicitud(s.solicitudRepo, sol)
	}
	return nil
}

func aplicarDecision(sol *models.CarnetSolicitud, instructorID uint, aprobar bool, ahora time.Time) {
	sol.ValidadorInstructorID = &instructorID
	sol.ValidadoEn = &ahora
	sol.MotivoRechazo = ""
	if aprobar {
		sol.Estado = models.CarnetEstadoAprobado
		return
	}
	sol.Estado = models.CarnetEstadoDevuelto
}

func (s *carnetDigitalService) esLiderDeSolicitud(instructorID uint, sol *models.CarnetSolicitud) bool {
	ids, err := s.solicitudRepo.FindFichaIDsDeLider(instructorID)
	if err != nil {
		return false
	}
	if sol.FichaID != 0 {
		return liderTieneFicha(ids, sol.FichaID)
	}
	return s.esLiderDelAprendiz(sol.PersonaID, ids)
}

func (s *carnetDigitalService) esLiderDelAprendiz(personaID uint, ids []uint) bool {
	set := map[uint]struct{}{}
	for _, id := range ids {
		set[id] = struct{}{}
	}
	mats, err := s.aprendizRepo.FindActivosByPersonaID(personaID)
	if err != nil {
		return false
	}
	for i := range mats {
		if _, ok := set[mats[i].FichaCaracterizacionID]; ok {
			return true
		}
	}
	return false
}

// LeerFotoSolicitud deja ver la foto pendiente al líder.
func (s *carnetDigitalService) LeerFotoSolicitud(instructorID, solicitudID uint) (*PersonaFotoArchivo, error) {
	sol, err := s.solicitudRepo.FindByID(solicitudID)
	if err != nil {
		return nil, err
	}
	if !s.esLiderDeSolicitud(instructorID, sol) {
		return nil, errCarnetNoLider
	}
	return leerFotoPersona(sol.FotoPath)
}
