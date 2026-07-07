package services

import (
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

type PersonaService interface {
	FindAll(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error)
	FindByID(id uint) (*dto.PersonaResponse, error)
	FindByNumeroDocumento(numeroDocumento string) (*dto.PersonaResponse, error)
	Create(req dto.PersonaRequest) (*dto.PersonaResponse, error)
	CreateWithoutUser(req dto.PersonaRequest) (*dto.PersonaResponse, error)
	EnsureUsersForPersonas(personaIDs []uint) error
	Update(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error)
	UpdateSelf(personaID uint, req dto.PersonaSelfUpdateRequest) (*dto.PersonaResponse, error)
	Delete(id uint) error
	ResetPassword(personaID uint) error
}

type personaService struct {
	personaRepo repositories.PersonaRepository
	accounts    PersonaUserAccountService
}

func NewPersonaService() PersonaService {
	userRepo := repositories.NewUserRepository()
	return &personaService{
		personaRepo: repositories.NewPersonaRepository(),
		accounts:    NewPersonaUserAccountService(userRepo),
	}
}

func (s *personaService) FindAll(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error) {
	personas, total, err := s.personaRepo.FindAll(page, pageSize, search)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]dto.PersonaResponse, len(personas))
	for i, persona := range personas {
		responses[i] = mapPersonaToResponse(persona)
	}

	return responses, total, nil
}

func (s *personaService) FindByID(id uint) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(id)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}

	response := mapPersonaToResponse(*persona)
	return &response, nil
}

func (s *personaService) FindByNumeroDocumento(numeroDocumento string) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByNumeroDocumento(numeroDocumento)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}

	response := mapPersonaToResponse(*persona)
	return &response, nil
}

func (s *personaService) Create(req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	if err := validatePersonaCreate(s.personaRepo, req); err != nil {
		return nil, err
	}

	persona := mapPersonaRequestToModel(req)
	persona.ID = 0
	persona.Status = personaStatusFromRequest(req)

	if err := s.personaRepo.Create(&persona); err != nil {
		return nil, fmt.Errorf("error al crear persona: %w", err)
	}

	_ = s.accounts.CreateForPersona(persona)

	response := mapPersonaToResponse(persona)
	return &response, nil
}

// CreateWithoutUser crea la persona sin crear usuario. Usado en importación masiva; luego se llama EnsureUsersForPersonas en lote.
func (s *personaService) CreateWithoutUser(req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	if err := validatePersonaCreate(s.personaRepo, req); err != nil {
		return nil, err
	}

	persona := mapPersonaRequestToModel(req)
	persona.ID = 0
	persona.Status = personaStatusFromRequest(req)

	if err := s.personaRepo.Create(&persona); err != nil {
		return nil, fmt.Errorf("error al crear persona: %w", err)
	}

	response := mapPersonaToResponse(persona)
	return &response, nil
}

func (s *personaService) EnsureUsersForPersonas(personaIDs []uint) error {
	return s.accounts.EnsureForPersonas(personaIDs)
}

func (s *personaService) Update(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(id)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}

	if err := validatePersonaUpdate(s.personaRepo, id, req); err != nil {
		return nil, err
	}

	applyPersonaRequest(persona, req)
	if req.Status != nil {
		persona.Status = *req.Status
	}

	if err := s.personaRepo.Update(persona); err != nil {
		return nil, fmt.Errorf("error al actualizar persona: %w", err)
	}

	response := mapPersonaToResponse(*persona)
	return &response, nil
}

func (s *personaService) UpdateSelf(personaID uint, req dto.PersonaSelfUpdateRequest) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}

	if err := validatePersonaSelfUpdate(s.personaRepo, personaID, req); err != nil {
		return nil, err
	}

	applyPersonaSelfUpdate(persona, req)

	if err := s.personaRepo.Update(persona); err != nil {
		return nil, fmt.Errorf("error al actualizar persona: %w", err)
	}

	if req.Email != "" {
		if err := s.accounts.SyncEmail(personaID, req.Email); err != nil {
			return nil, err
		}
	}

	response := mapPersonaToResponse(*persona)
	return &response, nil
}

func (s *personaService) Delete(id uint) error {
	return s.personaRepo.Delete(id)
}

func (s *personaService) ResetPassword(personaID uint) error {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return errPersonaNoEncontrada
	}
	return s.accounts.ResetPassword(personaID, persona.NumeroDocumento)
}
