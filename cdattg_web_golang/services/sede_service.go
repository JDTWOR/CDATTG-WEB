package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

type SedeService interface {
	Create(req dto.SedeCreateRequest) (*dto.SedeResponse, error)
}

type sedeService struct{}

func NewSedeService() SedeService {
	return &sedeService{}
}

func (s *sedeService) Create(req dto.SedeCreateRequest) (*dto.SedeResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre de la sede es requerido")
	}

	// Validar que la regional exista
	var regional models.Regional
	if err := db.First(&regional, req.RegionalID).Error; err != nil {
		return nil, errors.New("regional no encontrada")
	}

	// Evitar duplicados por nombre
	var existing models.Sede
	if err := db.Where("nombre = ?", nombre).First(&existing).Error; err == nil {
		return nil, errors.New("ya existe una sede con ese nombre")
	}

	regionalID := regional.ID
	sede := models.Sede{
		Nombre:     nombre,
		Direccion:  strings.TrimSpace(req.Direccion),
		RegionalID: &regionalID,
		Status:     true,
	}
	if err := db.Create(&sede).Error; err != nil {
		return nil, fmt.Errorf("error al crear sede: %w", err)
	}

	res := &dto.SedeResponse{
		ID:         sede.ID,
		Nombre:     sede.Nombre,
		Direccion:  sede.Direccion,
		RegionalID: *sede.RegionalID,
		Status:     sede.Status,
	}
	return res, nil
}

