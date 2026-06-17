package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type DiaSinFormacionSedeService struct {
	repo repositories.DiaSinFormacionSedeRepository
}

func NewDiaSinFormacionSedeService() *DiaSinFormacionSedeService {
	return &DiaSinFormacionSedeService{
		repo: repositories.NewDiaSinFormacionSedeRepository(),
	}
}

func parseFechaAdmin(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, errors.New("fecha obligatoria")
	}
	return time.ParseInLocation(time.DateOnly, s, time.Local)
}

func (s *DiaSinFormacionSedeService) toItem(row *models.DiaSinFormacionSede) dto.DiaSinFormacionSedeItem {
	item := dto.DiaSinFormacionSedeItem{
		ID:          row.ID,
		SedeID:      row.SedeID,
		FechaInicio: dto.FormatFechaDTO(row.FechaInicio),
		FechaFin:    dto.FormatFechaDTO(row.FechaFin),
		Motivo:      row.Motivo,
		CreatedAt:   row.CreatedAt.Format(time.RFC3339),
	}
	if row.Sede != nil {
		item.SedeNombre = row.Sede.Nombre
	}
	return item
}

func (s *DiaSinFormacionSedeService) List(sedeID *uint) ([]dto.DiaSinFormacionSedeItem, error) {
	var rows []models.DiaSinFormacionSede
	var err error
	if sedeID != nil && *sedeID > 0 {
		rows, err = s.repo.ListBySede(*sedeID)
	} else {
		rows, err = s.repo.ListAll()
	}
	if err != nil {
		return nil, err
	}
	out := make([]dto.DiaSinFormacionSedeItem, len(rows))
	for i := range rows {
		out[i] = s.toItem(&rows[i])
	}
	return out, nil
}

func (s *DiaSinFormacionSedeService) Create(actorUserID uint, req dto.DiaSinFormacionSedeCreateRequest) (*dto.DiaSinFormacionSedeItem, error) {
	if req.SedeID == 0 {
		return nil, errors.New("sede_id es obligatorio")
	}
	inicio, err := parseFechaAdmin(req.FechaInicio)
	if err != nil {
		return nil, errors.New("fecha_inicio inválida, use YYYY-MM-DD")
	}
	fin, err := parseFechaAdmin(req.FechaFin)
	if err != nil {
		return nil, errors.New("fecha_fin inválida, use YYYY-MM-DD")
	}
	if fin.Before(inicio) {
		return nil, errors.New("fecha_fin debe ser igual o posterior a fecha_inicio")
	}
	motivo := strings.TrimSpace(req.Motivo)
	if motivo == "" {
		return nil, errors.New("motivo es obligatorio")
	}
	row := &models.DiaSinFormacionSede{
		SedeID:      req.SedeID,
		FechaInicio: fechaCalendario(inicio),
		FechaFin:    fechaCalendario(fin),
		Motivo:      motivo,
		ActorUserID: &actorUserID,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	created, err := s.repo.FindByID(row.ID)
	if err != nil {
		item := s.toItem(row)
		return &item, nil
	}
	item := s.toItem(created)
	return &item, nil
}

func (s *DiaSinFormacionSedeService) Update(id uint, req dto.DiaSinFormacionSedeUpdateRequest) (*dto.DiaSinFormacionSedeItem, error) {
	row, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("registro no encontrado")
	}
	inicio, err := parseFechaAdmin(req.FechaInicio)
	if err != nil {
		return nil, errors.New("fecha_inicio inválida, use YYYY-MM-DD")
	}
	fin, err := parseFechaAdmin(req.FechaFin)
	if err != nil {
		return nil, errors.New("fecha_fin inválida, use YYYY-MM-DD")
	}
	if fin.Before(inicio) {
		return nil, errors.New("fecha_fin debe ser igual o posterior a fecha_inicio")
	}
	motivo := strings.TrimSpace(req.Motivo)
	if motivo == "" {
		return nil, errors.New("motivo es obligatorio")
	}
	row.FechaInicio = fechaCalendario(inicio)
	row.FechaFin = fechaCalendario(fin)
	row.Motivo = motivo
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	updated, err := s.repo.FindByID(id)
	if err != nil {
		item := s.toItem(row)
		return &item, nil
	}
	item := s.toItem(updated)
	return &item, nil
}

func (s *DiaSinFormacionSedeService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("registro no encontrado")
	}
	return s.repo.Delete(id)
}
