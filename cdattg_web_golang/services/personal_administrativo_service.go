// @module personal_administrativo_service
// @description Lógica de negocio de Personal Administrativo: creación desde Persona con rol Casbin, CRUD y DTO.
// @author JDTWOR
// @created 2026-08-14
package services

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const errMsgPersonalAdministrativoNoEncontrado = "personal administrativo no encontrado"

type PersonalAdministrativoService interface {
	CreateFromPersona(req dto.CreatePersonalAdministrativoRequest) (*dto.RolPersonalItem, error)
	GetByID(id uint) (*dto.RolPersonalItem, error)
	Update(id uint, req dto.UpdatePersonalAdministrativoRequest) (*dto.RolPersonalItem, error)
	Delete(id uint) error
}

type personalAdministrativoService struct {
	repo        repositories.PersonalAdministrativoRepository
	personaRepo repositories.PersonaRepository
	userRepo    repositories.UserRepository
}

func NewPersonalAdministrativoService() PersonalAdministrativoService {
	return &personalAdministrativoService{
		repo:        repositories.NewPersonalAdministrativoRepository(),
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:    repositories.NewUserRepository(),
	}
}

func (s *personalAdministrativoService) CreateFromPersona(req dto.CreatePersonalAdministrativoRequest) (*dto.RolPersonalItem, error) {
	persona, err := s.personaRepo.FindByID(req.PersonaID)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}
	exist, _ := s.repo.FindByPersonaID(req.PersonaID)
	if exist != nil {
		return nil, errors.New("esta persona ya es personal administrativo")
	}
	pa := models.PersonalAdministrativo{
		PersonaID:            req.PersonaID,
		Status:               true,
		NombreCompletoCache:  persona.GetFullName(),
		NumeroDocumentoCache: persona.NumeroDocumento,
	}
	if err := s.repo.Create(&pa); err != nil {
		return nil, fmt.Errorf("error al crear personal administrativo: %w", err)
	}
	user, _ := s.userRepo.FindByPersonaID(req.PersonaID)
	if user != nil {
		db := database.GetDB()
		e, err := authz.GetEnforcer(db)
		if err == nil {
			_, _ = authz.AddRoleForUser(e, strconv.FormatUint(uint64(user.ID), 10), authz.RolPersonalAdministrativo)
			_ = e.SavePolicy()
		}
	}
	return &dto.RolPersonalItem{ID: pa.ID, Nombre: pa.NombreCompletoCache}, nil
}

func (s *personalAdministrativoService) GetByID(id uint) (*dto.RolPersonalItem, error) {
	pa, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgPersonalAdministrativoNoEncontrado)
	}
	return personalAdministrativoToItem(pa), nil
}

func (s *personalAdministrativoService) Update(id uint, req dto.UpdatePersonalAdministrativoRequest) (*dto.RolPersonalItem, error) {
	pa, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgPersonalAdministrativoNoEncontrado)
	}
	if req.Estado != nil {
		pa.Status = *req.Estado
	}
	if err := s.repo.Update(pa); err != nil {
		return nil, fmt.Errorf("error al actualizar personal administrativo: %w", err)
	}
	updated, _ := s.repo.FindByID(id)
	return personalAdministrativoToItem(updated), nil
}

func (s *personalAdministrativoService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New(errMsgPersonalAdministrativoNoEncontrado)
	}
	return s.repo.Delete(id)
}

// personalAdministrativoToItem: documento y nombre desde Persona (personal administrativo solo tiene persona_id).
func personalAdministrativoToItem(m *models.PersonalAdministrativo) *dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return &dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}