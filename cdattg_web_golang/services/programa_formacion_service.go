package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type ProgramaFormacionService interface {
	FindAll(page, pageSize int, search string) ([]dto.ProgramaFormacionResponse, int64, error)
	FindByID(id uint) (*dto.ProgramaFormacionResponse, error)
	Create(req dto.ProgramaFormacionRequest) (*dto.ProgramaFormacionResponse, error)
	Update(id uint, req dto.ProgramaFormacionRequest) (*dto.ProgramaFormacionResponse, error)
	Delete(id uint) error
}

type programaFormacionService struct {
	repo repositories.ProgramaFormacionRepository
}

func NewProgramaFormacionService() ProgramaFormacionService {
	return &programaFormacionService{repo: repositories.NewProgramaFormacionRepository()}
}

func (s *programaFormacionService) FindAll(page, pageSize int, search string) ([]dto.ProgramaFormacionResponse, int64, error) {
	list, total, err := s.repo.FindAll(page, pageSize, strings.TrimSpace(search))
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.ProgramaFormacionResponse, len(list))
	for i := range list {
		resp[i] = s.toResponse(list[i], 0)
	}
	return resp, total, nil
}

func (s *programaFormacionService) FindByID(id uint) (*dto.ProgramaFormacionResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("programa de formación no encontrado")
	}
	r := s.toResponse(*p, 0)
	return &r, nil
}

func (s *programaFormacionService) Create(req dto.ProgramaFormacionRequest) (*dto.ProgramaFormacionResponse, error) {
	codigo := strings.TrimSpace(strings.ToUpper(req.Codigo))
	if codigo == "" {
		return nil, errors.New("el código es requerido")
	}
	if s.repo.ExistsByCodigo(codigo) {
		return nil, errors.New("ya existe un programa con ese código")
	}
	p := s.toModel(req)
	p.Codigo = codigo
	p.Nombre = strings.TrimSpace(strings.ToUpper(req.Nombre))
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	p.Status = status
	if err := s.repo.Create(&p); err != nil {
		return nil, fmt.Errorf("error al crear programa: %w", err)
	}
	r := s.toResponse(p, 0)
	return &r, nil
}

func (s *programaFormacionService) Update(id uint, req dto.ProgramaFormacionRequest) (*dto.ProgramaFormacionResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("programa de formación no encontrado")
	}
	codigo := strings.TrimSpace(strings.ToUpper(req.Codigo))
	if s.repo.ExistsByCodigoExcludingID(codigo, id) {
		return nil, errors.New("ya existe otro programa con ese código")
	}
	p.Codigo = codigo
	p.Nombre = strings.TrimSpace(strings.ToUpper(req.Nombre))
	p.RedConocimientoID = req.RedConocimientoID
	p.NivelFormacionID = req.NivelFormacionID
	p.TipoProgramaID = req.TipoProgramaID
	p.HorasTotales = req.HorasTotales
	p.HorasEtapaLectiva = req.HorasEtapaLectiva
	p.HorasEtapaProductiva = req.HorasEtapaProductiva
	if req.Status != nil {
		p.Status = *req.Status
	}
	if err := s.repo.Update(p); err != nil {
		return nil, fmt.Errorf("error al actualizar programa: %w", err)
	}
	r := s.toResponse(*p, 0)
	return &r, nil
}

func (s *programaFormacionService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("programa de formación no encontrado")
	}
	return s.repo.Delete(id)
}

func (s *programaFormacionService) toResponse(p models.ProgramaFormacion, cantidadFichas int) dto.ProgramaFormacionResponse {
	r := dto.ProgramaFormacionResponse{
		ID:                   p.ID,
		Codigo:               p.Codigo,
		Nombre:               p.Nombre,
		RedConocimientoID:    p.RedConocimientoID,
		NivelFormacionID:     p.NivelFormacionID,
		TipoProgramaID:       p.TipoProgramaID,
		Status:               p.Status,
		HorasTotales:         p.HorasTotales,
		HorasEtapaLectiva:    p.HorasEtapaLectiva,
		HorasEtapaProductiva: p.HorasEtapaProductiva,
		CantidadFichas:       cantidadFichas,
	}
	if p.RedConocimiento != nil {
		r.RedConocimientoNombre = p.RedConocimiento.Nombre
	}
	return r
}

func (s *programaFormacionService) toModel(req dto.ProgramaFormacionRequest) models.ProgramaFormacion {
	p := models.ProgramaFormacion{
		RedConocimientoID:    req.RedConocimientoID,
		NivelFormacionID:     req.NivelFormacionID,
		TipoProgramaID:       req.TipoProgramaID,
		HorasTotales:         req.HorasTotales,
		HorasEtapaLectiva:    req.HorasEtapaLectiva,
		HorasEtapaProductiva: req.HorasEtapaProductiva,
	}
	if req.Status != nil {
		p.Status = *req.Status
	}
	return p
}
