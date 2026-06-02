package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type AmbienteService interface {
	List() ([]dto.AmbienteListItem, error)
	Create(req dto.AmbienteCreateRequest) (*dto.AmbienteResponse, error)
	Update(id uint, req dto.AmbienteUpdateRequest) (*dto.AmbienteResponse, error)
	Delete(id uint) error
}

type ambienteService struct{}

func NewAmbienteService() AmbienteService {
	return &ambienteService{}
}

func (s *ambienteService) List() ([]dto.AmbienteListItem, error) {
	db := database.GetDB()
	type row struct {
		ID           uint
		Nombre       string
		PisoID       uint
		PisoNombre   string
		BloqueNombre string
		SedeNombre   string
		Status       bool
	}
	var rows []row
	err := db.Table("ambientes a").
		Select(`a.id, a.nombre, a.piso_id, p.nombre AS piso_nombre, b.nombre AS bloque_nombre, s.nombre AS sede_nombre, a.status`).
		Joins("JOIN pisos p ON p.id = a.piso_id").
		Joins("JOIN bloques b ON b.id = p.bloque_id").
		Joins("JOIN sedes s ON s.id = b.sede_id").
		Where("a.deleted_at IS NULL").
		Order("s.nombre, b.nombre, p.nombre, a.nombre").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("error al listar ambientes: %w", err)
	}
	out := make([]dto.AmbienteListItem, len(rows))
	for i, r := range rows {
		out[i] = dto.AmbienteListItem{
			ID:           r.ID,
			Nombre:       r.Nombre,
			PisoID:       r.PisoID,
			PisoNombre:   r.PisoNombre,
			BloqueNombre: r.BloqueNombre,
			SedeNombre:   r.SedeNombre,
			Status:       r.Status,
		}
	}
	return out, nil
}

func (s *ambienteService) Create(req dto.AmbienteCreateRequest) (*dto.AmbienteResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del ambiente es requerido")
	}

	var piso models.Piso
	if err := db.First(&piso, req.PisoID).Error; err != nil {
		return nil, errors.New("piso no encontrado")
	}

	var existing models.Ambiente
	if err := db.Where("piso_id = ? AND nombre = ?", req.PisoID, nombre).First(&existing).Error; err == nil {
		return nil, errors.New("ya existe un ambiente con ese nombre en ese piso")
	}

	amb := models.Ambiente{
		Nombre: nombre,
		PisoID: req.PisoID,
		Status: true,
	}
	if err := db.Create(&amb).Error; err != nil {
		return nil, fmt.Errorf("error al crear ambiente: %w", err)
	}

	return ambienteToResponse(&amb), nil
}

func (s *ambienteService) Update(id uint, req dto.AmbienteUpdateRequest) (*dto.AmbienteResponse, error) {
	db := database.GetDB()
	var amb models.Ambiente
	if err := db.First(&amb, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ambiente no encontrado")
		}
		return nil, err
	}

	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del ambiente es requerido")
	}

	var piso models.Piso
	if err := db.First(&piso, req.PisoID).Error; err != nil {
		return nil, errors.New("piso no encontrado")
	}

	var dup models.Ambiente
	if err := db.Where("piso_id = ? AND nombre = ? AND id <> ?", req.PisoID, nombre, id).First(&dup).Error; err == nil {
		return nil, errors.New("ya existe otro ambiente con ese nombre en ese piso")
	}

	amb.Nombre = nombre
	amb.PisoID = req.PisoID
	if req.Status != nil {
		amb.Status = *req.Status
	}
	if err := db.Save(&amb).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar ambiente: %w", err)
	}
	return ambienteToResponse(&amb), nil
}

func (s *ambienteService) Delete(id uint) error {
	db := database.GetDB()
	var count int64
	if err := db.Model(&models.FichaCaracterizacion{}).Where("ambiente_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("no se puede eliminar: el ambiente está asignado a fichas")
	}
	res := db.Delete(&models.Ambiente{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("ambiente no encontrado")
	}
	return nil
}

func ambienteToResponse(amb *models.Ambiente) *dto.AmbienteResponse {
	return &dto.AmbienteResponse{
		ID:     amb.ID,
		Nombre: amb.Nombre,
		PisoID: amb.PisoID,
		Status: amb.Status,
	}
}
