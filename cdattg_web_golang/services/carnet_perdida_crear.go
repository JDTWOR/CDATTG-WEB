/**
 * El aprendiz de formación regular crea la solicitud de reposición física.
 * Exijo ficha regular vigente y los dos comprobantes PDF antes de notificar.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

var (
	errCarnetPerdidaSinFicha    = errors.New("seleccione una ficha vigente a la que esté vinculado")
	errCarnetPerdidaSoloRegular = errors.New("la reposición física solo aplica para ficha de formación regular")
	errCarnetPerdidaYaPendiente = errors.New("ya tiene una solicitud de reposición en revisión")
	errCarnetPerdidaSinArchivos = errors.New("adjunte comprobante de pago y de demanda")
)

// personaFichasOwner consulta la persona y sus matrículas vivas.
type personaFichasOwner struct {
	personaRepo  repositories.PersonaRepository
	aprendizRepo repositories.AprendizRepository
}

// NuevaPersonaFichasOwner crea el consultor de ficha del aprendiz.
func NuevaPersonaFichasOwner() personaFichasOwner {
	return personaFichasOwner{
		personaRepo:  repositories.NewPersonaRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
	}
}

// Crear valida, guarda los PDFs y deja la solicitud pendiente del bibliotecario.
func (s *carnetPerdidaService) Crear(personaID, fichaID uint, pago, demanda []byte) (*dto.CarnetPerdidaItem, error) {
	persona, err := s.owner.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}
	if pend, _ := s.perdidaRepo.FindPendienteByPersona(personaID); pend != nil {
		return nil, errCarnetPerdidaYaPendiente
	}
	ficha, err := s.fichaRegularVigente(personaID, fichaID)
	if err != nil {
		return nil, err
	}
	if len(pago) == 0 || len(demanda) == 0 {
		return nil, errCarnetPerdidaSinArchivos
	}
	sol := models.CarnetPerdidaSolicitud{
		PersonaID:       personaID,
		FichaID:         ficha.ID,
		FichaNumero:     ficha.Ficha,
		Programa:        nombreProgramaFicha(*ficha),
		TipoFormacion:   ficha.TipoFormacion,
		Estado:          models.CarnetPerdidaEstadoPendiente,
		Nombres:         strings.TrimSpace(persona.PrimerNombre + " " + persona.SegundoNombre),
		Apellidos:       strings.TrimSpace(persona.PrimerApellido + " " + persona.SegundoApellido),
		NumeroDocumento: persona.NumeroDocumento,
		Rh:              persona.Rh,
		FotoPath:        persona.FotoPath,
	}
	if err := s.perdidaRepo.Create(&sol); err != nil {
		return nil, err
	}
	if err := s.guardarComprobantes(&sol, pago, demanda); err != nil {
		return nil, err
	}
	s.notif.NuevaSolicitud(&sol)
	item := perdidaAItem(sol)
	return &item, nil
}

// guardarComprobantes persiste los dos archivos contra la solicitud.
func (s *carnetPerdidaService) guardarComprobantes(sol *models.CarnetPerdidaSolicitud, pago, demanda []byte) error {
	var err error
	if sol.ComprobantePagoPath, err = guardarComprobante(sol.ID, "pago", pago); err != nil {
		return err
	}
	if sol.ComprobanteDemandaPath, err = guardarComprobante(sol.ID, "demanda", demanda); err != nil {
		return err
	}
	return s.perdidaRepo.Update(sol)
}

// fichaRegularVigente asegura que la ficha existe viva y es regular.
func (s *carnetPerdidaService) fichaRegularVigente(personaID, fichaID uint) (*models.FichaCaracterizacion, error) {
	mats, err := s.owner.aprendizRepo.FindActivosByPersonaID(personaID)
	if err != nil {
		return nil, err
	}
	ficha := fichaMatriculaVigente(mats, fichaID, time.Now())
	if ficha == nil {
		return nil, errCarnetPerdidaSinFicha
	}
	if ficha.TipoFormacion != models.TipoFormacionRegular {
		return nil, errCarnetPerdidaSoloRegular
	}
	return ficha, nil
}

// nombreProgramaFicha ya existe en servicios (asistencia_dashboard.go).
