package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

var errVigPersonaNoEncontrada = errors.New("persona no encontrada con ese número de documento")
var errVigAceptaTerminos = errors.New("debe aceptar los términos de uso y confidencialidad")

type VigilanciaPersonaService interface {
	Lookup(numeroDocumento string) (*dto.PersonaResponse, error)
	ActualizarDatosBasicos(id uint, req dto.VigilanciaDatosBasicosRequest) (*dto.PersonaResponse, error)
}

type vigilanciaPersonaService struct {
	repo repositories.PersonaRepository
}

func NewVigilanciaPersonaService() VigilanciaPersonaService {
	return &vigilanciaPersonaService{repo: repositories.NewPersonaRepository()}
}

func (s *vigilanciaPersonaService) Lookup(numeroDocumento string) (*dto.PersonaResponse, error) {
	persona, err := s.repo.FindByNumeroDocumento(numeroDocumento)
	if err != nil {
		return nil, errVigPersonaNoEncontrada
	}
	resp := mapPersonaToResponse(*persona)
	return &resp, nil
}

func (s *vigilanciaPersonaService) ActualizarDatosBasicos(id uint, req dto.VigilanciaDatosBasicosRequest) (*dto.PersonaResponse, error) {
	persona, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errVigPersonaNoEncontrada
	}

	if req.TipoDocumento != nil {
		persona.TipoDocumentoID = req.TipoDocumento
	}
	if req.PrimerNombre != "" {
		persona.PrimerNombre = req.PrimerNombre
	}
	if req.SegundoNombre != "" {
		persona.SegundoNombre = req.SegundoNombre
	}
	if req.PrimerApellido != "" {
		persona.PrimerApellido = req.PrimerApellido
	}
	if req.SegundoApellido != "" {
		persona.SegundoApellido = req.SegundoApellido
	}
	if req.Celular != "" {
		persona.Celular = req.Celular
	}
	if req.Rh != "" {
		persona.Rh = normalizarPersonaRH(req.Rh)
	}

	// La aceptación de términos es obligatoria y deja constancia de la fecha.
	if !req.AceptaTerminos {
		return nil, errVigAceptaTerminos
	}
	now := time.Now()
	persona.AceptaTerminos = true
	persona.AceptaTerminosAt = &now

	if err := s.repo.Update(persona); err != nil {
		return nil, err
	}

	resp := mapPersonaToResponse(*persona)
	return &resp, nil
}
