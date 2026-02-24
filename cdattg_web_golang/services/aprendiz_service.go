package services

import (
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type AprendizService interface {
	FindAll(page, pageSize int, fichaID *uint) ([]dto.AprendizResponse, int64, error)
	FindByID(id uint) (*dto.AprendizResponse, error)
	Create(req dto.AprendizRequest) (*dto.AprendizResponse, error)
	Update(id uint, req dto.AprendizRequest) (*dto.AprendizResponse, error)
	Delete(id uint) error
}

type aprendizService struct {
	repo     repositories.AprendizRepository
	fichaRepo repositories.FichaRepository
}

func NewAprendizService() AprendizService {
	return &aprendizService{
		repo:     repositories.NewAprendizRepository(),
		fichaRepo: repositories.NewFichaRepository(),
	}
}

func (s *aprendizService) FindAll(page, pageSize int, fichaID *uint) ([]dto.AprendizResponse, int64, error) {
	list, total, err := s.repo.FindAll(page, pageSize, fichaID)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.AprendizResponse, len(list))
	for i := range list {
		fichaNum := ""
		if list[i].FichaCaracterizacion != nil {
			fichaNum = list[i].FichaCaracterizacion.Ficha
		}
		resp[i] = s.toResponse(list[i], fichaNum)
	}
	return resp, total, nil
}

func (s *aprendizService) FindByID(id uint) (*dto.AprendizResponse, error) {
	a, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("aprendiz no encontrado")
	}
	fichaNum := ""
	if a.FichaCaracterizacion != nil {
		fichaNum = a.FichaCaracterizacion.Ficha
	}
	r := s.toResponse(*a, fichaNum)
	return &r, nil
}

func (s *aprendizService) Create(req dto.AprendizRequest) (*dto.AprendizResponse, error) {
	if _, err := s.fichaRepo.FindByID(req.FichaCaracterizacionID); err != nil {
		return nil, errors.New("ficha no encontrada")
	}
	exist, _ := s.repo.FindByPersonaIDAndFichaID(req.PersonaID, req.FichaCaracterizacionID)
	if exist != nil {
		return nil, errors.New("esta persona ya está asignada como aprendiz en esta ficha")
	}
	estado := true
	if req.Estado != nil {
		estado = *req.Estado
	}
	a := models.Aprendiz{
		PersonaID:             req.PersonaID,
		FichaCaracterizacionID: req.FichaCaracterizacionID,
		Estado:                estado,
	}
	if err := s.repo.Create(&a); err != nil {
		return nil, fmt.Errorf("error al crear aprendiz: %w", err)
	}
	return s.FindByID(a.ID)
}

func (s *aprendizService) Update(id uint, req dto.AprendizRequest) (*dto.AprendizResponse, error) {
	a, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("aprendiz no encontrado")
	}
	if req.Estado != nil {
		a.Estado = *req.Estado
	}
	if req.FichaCaracterizacionID > 0 {
		a.FichaCaracterizacionID = req.FichaCaracterizacionID
	}
	if err := s.repo.Update(a); err != nil {
		return nil, fmt.Errorf("error al actualizar aprendiz: %w", err)
	}
	return s.FindByID(id)
}

func (s *aprendizService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("aprendiz no encontrado")
	}
	return s.repo.Delete(id)
}

func (s *aprendizService) toResponse(a models.Aprendiz, fichaNumero string) dto.AprendizResponse {
	r := dto.AprendizResponse{
		ID:                     a.ID,
		PersonaID:              a.PersonaID,
		FichaCaracterizacionID: a.FichaCaracterizacionID,
		Estado:                 a.Estado,
		FichaNumero:            fichaNumero,
	}
	if a.Persona != nil {
		r.PersonaNombre = a.Persona.GetFullName()
		r.PersonaDocumento = a.Persona.NumeroDocumento
	}
	if a.FichaCaracterizacion != nil {
		if a.FichaCaracterizacion.ProgramaFormacion != nil {
			r.ProgramaNombre = a.FichaCaracterizacion.ProgramaFormacion.Nombre
		}
		if a.FichaCaracterizacion.Sede != nil && a.FichaCaracterizacion.Sede.Regional != nil {
			r.RegionalNombre = a.FichaCaracterizacion.Sede.Regional.Nombre
		}
	}
	return r
}
