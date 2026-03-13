package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

type PisoService interface {
	Create(req dto.PisoCreateRequest) (*dto.PisoResponse, error)
}

type pisoService struct{}

func NewPisoService() PisoService {
	return &pisoService{}
}

func (s *pisoService) Create(req dto.PisoCreateRequest) (*dto.PisoResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del piso es requerido")
	}

	// Validar que el bloque exista
	var bloque models.Bloque
	if err := db.First(&bloque, req.BloqueID).Error; err != nil {
		return nil, errors.New("bloque no encontrado")
	}

	// Evitar duplicados por (bloque_id, nombre)
	var existing models.Piso
	if err := db.Where("bloque_id = ? AND nombre = ?", req.BloqueID, nombre).First(&existing).Error; err == nil {
		return nil, errors.New("ya existe un piso con ese nombre en ese bloque")
	}

	piso := models.Piso{
		Nombre:   nombre,
		BloqueID: req.BloqueID,
	}
	if err := db.Create(&piso).Error; err != nil {
		return nil, fmt.Errorf("error al crear piso: %w", err)
	}

	res := &dto.PisoResponse{
		ID:       piso.ID,
		Nombre:   piso.Nombre,
		BloqueID: piso.BloqueID,
	}
	return res, nil
}

