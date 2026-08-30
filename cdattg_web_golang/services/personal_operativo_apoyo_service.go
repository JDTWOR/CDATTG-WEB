// @module personal_operativo_apoyo_service
// @description Lógica de negocio de Personal Operativo y de Apoyo: creación desde Persona con rol Casbin y CRUD.
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

const errMsgPersonalOperativoApoyoNoEncontrado = "personal operativo y de apoyo no encontrado"

type PersonalOperativoApoyoService interface {
	CreateFromPersona(req dto.CreatePersonalOperativoApoyoRequest) (*dto.RolPersonalItem, error)
	GetByID(id uint) (*dto.RolPersonalItem, error)
	Update(id uint, req dto.UpdatePersonalOperativoApoyoRequest) (*dto.RolPersonalItem, error)
	Delete(id uint) error
}

type personalOperativoApoyoService struct {
	repo        repositories.PersonalOperativoApoyoRepository
	personaRepo repositories.PersonaRepository
	userRepo    repositories.UserRepository
}

func NewPersonalOperativoApoyoService() PersonalOperativoApoyoService {
	return &personalOperativoApoyoService{
		repo:        repositories.NewPersonalOperativoApoyoRepository(),
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:    repositories.NewUserRepository(),
	}
}

func (s *personalOperativoApoyoService) CreateFromPersona(req dto.CreatePersonalOperativoApoyoRequest) (*dto.RolPersonalItem, error) {
	persona, err := s.personaRepo.FindByID(req.PersonaID)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}
	exist, _ := s.repo.FindByPersonaID(req.PersonaID)
	if exist != nil {
		return nil, errors.New("esta persona ya es personal operativo y de apoyo")
	}
	m := models.PersonalOperativoApoyo{
		PersonaID:            req.PersonaID,
		Status:               true,
		NombreCompletoCache:  persona.GetFullName(),
		NumeroDocumentoCache: persona.NumeroDocumento,
	}
	if err := s.repo.Create(&m); err != nil {
		return nil, fmt.Errorf("error al crear personal operativo y de apoyo: %w", err)
	}
	user, _ := s.userRepo.FindByPersonaID(req.PersonaID)
	if user != nil {
		db := database.GetDB()
		e, err := authz.GetEnforcer(db)
		if err == nil {
			_, _ = authz.AddRoleForUser(e, strconv.FormatUint(uint64(user.ID), 10), authz.RolPersonalOperativoYDeApoyo)
			_ = e.SavePolicy()
		}
	}
	return &dto.RolPersonalItem{ID: m.ID, Nombre: m.NombreCompletoCache}, nil
}

func (s *personalOperativoApoyoService) GetByID(id uint) (*dto.RolPersonalItem, error) {
	m, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgPersonalOperativoApoyoNoEncontrado)
	}
	return personalOperativoApoyoToItem(m), nil
}

func (s *personalOperativoApoyoService) Update(id uint, req dto.UpdatePersonalOperativoApoyoRequest) (*dto.RolPersonalItem, error) {
	m, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgPersonalOperativoApoyoNoEncontrado)
	}
	if req.Estado != nil {
		m.Status = *req.Estado
	}
	if err := s.repo.Update(m); err != nil {
		return nil, fmt.Errorf("error al actualizar personal operativo y de apoyo: %w", err)
	}
	updated, _ := s.repo.FindByID(id)
	return personalOperativoApoyoToItem(updated), nil
}

func (s *personalOperativoApoyoService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New(errMsgPersonalOperativoApoyoNoEncontrado)
	}
	return s.repo.Delete(id)
}

// personalOperativoApoyoToItem: documento y nombre desde Persona (la fila solo tiene persona_id).
func personalOperativoApoyoToItem(m *models.PersonalOperativoApoyo) *dto.RolPersonalItem {
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