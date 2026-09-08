/**
 * Orquesto guardar y leer la foto de una persona en disco y en la fila.
 * Lo separé del CRUD para no mezclar archivos con el formulario.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"fmt"
	"io"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

// PersonaFotoService guarda y sirve la foto de perfil.
type PersonaFotoService interface {
	Guardar(personaID uint, r io.Reader) (*dto.PersonaResponse, error)
	// GuardarPendiente valida y escribe la foto en la ruta de pendiente, sin tocar
	// la persona. Devuelve la ruta para guardarla en un cambio pendiente.
	GuardarPendiente(personaID uint, r io.Reader) (string, error)
	Leer(personaID uint) (*PersonaFotoArchivo, error)
}

type personaFotoService struct {
	personaRepo repositories.PersonaRepository
}

// NewPersonaFotoService crea el servicio con el repositorio de personas.
func NewPersonaFotoService() PersonaFotoService {
	return &personaFotoService{personaRepo: repositories.NewPersonaRepository()}
}

// Guardar valida, escribe el archivo y deja la ruta en la persona.
func (s *personaFotoService) Guardar(personaID uint, r io.Reader) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}
	data, err := io.ReadAll(io.LimitReader(r, personaFotoMaxBytes+1))
	if err != nil {
		return nil, fmt.Errorf("no pude leer la foto: %w", err)
	}
	ruta, err := guardarFotoPersona(personaID, data)
	if err != nil {
		return nil, err
	}
	persona.FotoPath = ruta
	if err := s.personaRepo.Update(persona); err != nil {
		return nil, fmt.Errorf("no pude guardar la ruta de la foto: %w", err)
	}
	resp := mapPersonaToResponse(*persona)
	return &resp, nil
}

// GuardarPendiente valida y escribe la foto del visitante en la ruta aparte de
// pendiente, sin actualizar la persona. Devuelve la ruta del archivo.
func (s *personaFotoService) GuardarPendiente(personaID uint, r io.Reader) (string, error) {
	data, err := io.ReadAll(io.LimitReader(r, personaFotoMaxBytes+1))
	if err != nil {
		return "", fmt.Errorf("no pude leer la foto: %w", err)
	}
	return guardarFotoPersonaPendiente(personaID, data)
}

// Leer trae los bytes de la foto guardada.
func (s *personaFotoService) Leer(personaID uint) (*PersonaFotoArchivo, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}
	return leerFotoPersona(persona.FotoPath)
}
