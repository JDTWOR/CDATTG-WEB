// @module contratista_service
// @description Lógica de negocio de Contratistas: creación desde Persona con rol Casbin y CRUD.
// @author JDTWOR
// @created 2026-08-15
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

const errMsgContratistaNoEncontrado = "contratista no encontrado"

type ContratistaService interface {
	CreateFromPersona(req dto.CreateContratistaRequest) (*dto.RolPersonalItem, error)
	GetByID(id uint) (*dto.RolPersonalItem, error)
	Update(id uint, req dto.UpdateContratistaRequest) (*dto.RolPersonalItem, error)
	Delete(id uint) error
}

type contratistaService struct {
	repo        repositories.ContratistaRepository
	personaRepo repositories.PersonaRepository
	userRepo    repositories.UserRepository
}

func NewContratistaService() ContratistaService {
	return &contratistaService{
		repo:        repositories.NewContratistaRepository(),
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:    repositories.NewUserRepository(),
	}
}

func (s *contratistaService) CreateFromPersona(req dto.CreateContratistaRequest) (*dto.RolPersonalItem, error) {
	persona, err := s.personaRepo.FindByID(req.PersonaID)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}
	exist, _ := s.repo.FindByPersonaID(req.PersonaID)
	if exist != nil {
		return nil, errors.New("esta persona ya es contratista de prestación de servicios")
	}
	m := models.Contratista{
		PersonaID:            req.PersonaID,
		Status:               true,
		NombreCompletoCache:  persona.GetFullName(),
		NumeroDocumentoCache: persona.NumeroDocumento,
	}
	if err := s.repo.Create(&m); err != nil {
		return nil, fmt.Errorf("error al crear contratista: %w", err)
	}
	user, _ := s.userRepo.FindByPersonaID(req.PersonaID)
	if user != nil {
		db := database.GetDB()
		e, err := authz.GetEnforcer(db)
		if err == nil {
			_, _ = authz.AddRoleForUser(e, strconv.FormatUint(uint64(user.ID), 10), authz.RolContratistaPrestacionServicios)
			_ = e.SavePolicy()
		}
	}
	return &dto.RolPersonalItem{ID: m.ID, Nombre: m.NombreCompletoCache}, nil
}

func (s *contratistaService) GetByID(id uint) (*dto.RolPersonalItem, error) {
	m, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgContratistaNoEncontrado)
	}
	return contratistaToItem(m), nil
}

func (s *contratistaService) Update(id uint, req dto.UpdateContratistaRequest) (*dto.RolPersonalItem, error) {
	m, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgContratistaNoEncontrado)
	}
	if req.Estado != nil {
		m.Status = *req.Estado
	}
	if err := s.repo.Update(m); err != nil {
		return nil, fmt.Errorf("error al actualizar contratista: %w", err)
	}
	updated, _ := s.repo.FindByID(id)
	return contratistaToItem(updated), nil
}

func (s *contratistaService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New(errMsgContratistaNoEncontrado)
	}
	return s.repo.Delete(id)
}

// contratistaToItem: documento y nombre desde Persona (la fila solo tiene persona_id).
func contratistaToItem(m *models.Contratista) *dto.RolPersonalItem {
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