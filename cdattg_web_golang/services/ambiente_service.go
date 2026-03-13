package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

type AmbienteService interface {
	Create(req dto.AmbienteCreateRequest) (*dto.AmbienteResponse, error)
}

type ambienteService struct{}

func NewAmbienteService() AmbienteService {
	return &ambienteService{}
}

func (s *ambienteService) Create(req dto.AmbienteCreateRequest) (*dto.AmbienteResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del ambiente es requerido")
	}

	// Validar que el piso exista
	var piso models.Piso
	if err := db.First(&piso, req.PisoID).Error; err != nil {
		return nil, errors.New("piso no encontrado")
	}

	// Evitar duplicados por (piso_id, nombre)
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

	res := &dto.AmbienteResponse{
		ID:     amb.ID,
		Nombre: amb.Nombre,
		PisoID: amb.PisoID,
		Status: amb.Status,
	}
	return res, nil
}

