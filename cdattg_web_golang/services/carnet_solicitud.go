/**
 * El aprendiz pide crear o renovar el carnet de una ficha.
 * No se publica solo: espera al instructor líder de esa ficha.
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
)

var (
	errCarnetDatosIncompletos = errors.New("complete foto, RH y nombres antes de solicitar el carnet")
	errCarnetSinFicha         = errors.New("seleccione una ficha vigente a la que esté vinculado")
	errCarnetSinLider         = errors.New("esa ficha no tiene instructor líder para validar el carnet")
	errCarnetYaPendiente      = errors.New("ya hay una solicitud en revisión del instructor líder")
)

// Solicitar deja una solicitud pendiente de la ficha elegida.
func (s *carnetDigitalService) Solicitar(personaID, fichaID uint) (*dto.CarnetDigitalResponse, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}
	if !datosListosParaCarnet(*persona) {
		return nil, errCarnetDatosIncompletos
	}
	mats, err := s.aprendizRepo.FindActivosByPersonaID(personaID)
	if err != nil {
		return nil, err
	}
	ficha := fichaMatriculaVigente(mats, fichaID, time.Now())
	if ficha == nil {
		return nil, errCarnetSinFicha
	}
	if !fichaTieneLider(ficha) {
		return nil, errCarnetSinLider
	}
	if pend, _ := s.solicitudRepo.FindPendienteByPersonaFicha(personaID, fichaID); pend != nil {
		return nil, errCarnetYaPendiente
	}
	op := fichaACarnetOpcion(ficha)
	sol := models.CarnetSolicitud{
		PersonaID:       personaID,
		FichaID:         ficha.ID,
		FichaNumero:     op.Numero,
		Programa:        op.Programa,
		TipoFormacion:   op.TipoFormacion,
		Estado:          models.CarnetEstadoPendiente,
		Nombres:         strings.TrimSpace(persona.PrimerNombre + " " + persona.SegundoNombre),
		Apellidos:       strings.TrimSpace(persona.PrimerApellido + " " + persona.SegundoApellido),
		NumeroDocumento: persona.NumeroDocumento,
		Rh:              persona.Rh,
		FotoPath:        persona.FotoPath,
	}
	if err := s.solicitudRepo.Create(&sol); err != nil {
		return nil, err
	}
	// Guardo una copia: si luego cambia la foto de perfil, el carnet no se altera.
	fijarFotoCopiaSolicitud(s.solicitudRepo, &sol)
	return s.ObtenerMiCarnet(personaID)
}

// LeerFotoPublicada sirve la foto aprobada de esa ficha, o la última si no indican ficha.
func (s *carnetDigitalService) LeerFotoPublicada(personaID, fichaID uint) (*PersonaFotoArchivo, error) {
	if fichaID > 0 {
		if ap, err := s.solicitudRepo.FindUltimaAprobadaByPersonaFicha(personaID, fichaID); err == nil {
			return leerFotoPersona(ap.FotoPath)
		}
	}
	aprobada, err := s.solicitudRepo.FindUltimaAprobadaByPersonaID(personaID)
	if err != nil {
		return nil, errPersonaFotoAusente
	}
	return leerFotoPersona(aprobada.FotoPath)
}
