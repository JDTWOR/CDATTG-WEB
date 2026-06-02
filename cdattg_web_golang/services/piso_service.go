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

type PisoService interface {
	List() ([]dto.PisoItemInfra, error)
	Create(req dto.PisoCreateRequest) (*dto.PisoResponse, error)
	Update(id uint, req dto.PisoUpdateRequest) (*dto.PisoResponse, error)
	Delete(id uint) error
}

type pisoService struct{}

func NewPisoService() PisoService {
	return &pisoService{}
}

func (s *pisoService) List() ([]dto.PisoItemInfra, error) {
	db := database.GetDB()
	type row struct {
		ID           uint
		Nombre       string
		BloqueID     uint
		BloqueNombre string
		SedeNombre   string
	}
	var rows []row
	err := db.Table("pisos p").
		Select("p.id, p.nombre, p.bloque_id, b.nombre as bloque_nombre, s.nombre as sede_nombre").
		Joins("JOIN bloques b ON b.id = p.bloque_id").
		Joins("JOIN sedes s ON s.id = b.sede_id").
		Where("p.deleted_at IS NULL").
		Order("s.nombre, b.nombre, p.nombre").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("error al listar pisos: %w", err)
	}
	out := make([]dto.PisoItemInfra, len(rows))
	for i, r := range rows {
		out[i] = dto.PisoItemInfra{
			ID:           r.ID,
			Nombre:       r.Nombre,
			BloqueID:     r.BloqueID,
			BloqueNombre: r.BloqueNombre,
			SedeNombre:   r.SedeNombre,
		}
	}
	return out, nil
}

func (s *pisoService) Create(req dto.PisoCreateRequest) (*dto.PisoResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del piso es requerido")
	}

	var bloque models.Bloque
	if err := db.First(&bloque, req.BloqueID).Error; err != nil {
		return nil, errors.New("bloque no encontrado")
	}

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

	return pisoToResponse(&piso), nil
}

func (s *pisoService) Update(id uint, req dto.PisoUpdateRequest) (*dto.PisoResponse, error) {
	db := database.GetDB()
	var piso models.Piso
	if err := db.First(&piso, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("piso no encontrado")
		}
		return nil, err
	}

	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del piso es requerido")
	}

	var bloque models.Bloque
	if err := db.First(&bloque, req.BloqueID).Error; err != nil {
		return nil, errors.New("bloque no encontrado")
	}

	var dup models.Piso
	if err := db.Where("bloque_id = ? AND nombre = ? AND id <> ?", req.BloqueID, nombre, id).First(&dup).Error; err == nil {
		return nil, errors.New("ya existe otro piso con ese nombre en ese bloque")
	}

	piso.Nombre = nombre
	piso.BloqueID = req.BloqueID
	if err := db.Save(&piso).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar piso: %w", err)
	}
	return pisoToResponse(&piso), nil
}

func (s *pisoService) Delete(id uint) error {
	db := database.GetDB()
	var count int64
	if err := db.Model(&models.Ambiente{}).Where("piso_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("no se puede eliminar: el piso tiene ambientes asociados")
	}
	res := db.Delete(&models.Piso{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("piso no encontrado")
	}
	return nil
}

func pisoToResponse(piso *models.Piso) *dto.PisoResponse {
	return &dto.PisoResponse{
		ID:       piso.ID,
		Nombre:   piso.Nombre,
		BloqueID: piso.BloqueID,
	}
}
