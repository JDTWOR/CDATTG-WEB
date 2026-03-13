package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

type BloqueService interface {
	Create(req dto.BloqueCreateRequest) (*dto.BloqueResponse, error)
}

type bloqueService struct{}

func NewBloqueService() BloqueService {
	return &bloqueService{}
}

func (s *bloqueService) Create(req dto.BloqueCreateRequest) (*dto.BloqueResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del bloque es requerido")
	}

	// Validar que la sede exista
	var sede models.Sede
	if err := db.First(&sede, req.SedeID).Error; err != nil {
		return nil, errors.New("sede no encontrada")
	}

	// Evitar duplicados por (sede_id, nombre)
	var existing models.Bloque
	if err := db.Where("sede_id = ? AND nombre = ?", req.SedeID, nombre).First(&existing).Error; err == nil {
		return nil, errors.New("ya existe un bloque con ese nombre en esa sede")
	}

	b := models.Bloque{
		Nombre: nombre,
		SedeID: req.SedeID,
	}
	if err := db.Create(&b).Error; err != nil {
		return nil, fmt.Errorf("error al crear bloque: %w", err)
	}

	res := &dto.BloqueResponse{
		ID:     b.ID,
		Nombre: b.Nombre,
		SedeID: b.SedeID,
	}
	return res, nil
}

