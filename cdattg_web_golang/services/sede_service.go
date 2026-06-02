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

type SedeService interface {
	List() ([]dto.SedeListItem, error)
	Create(req dto.SedeCreateRequest) (*dto.SedeResponse, error)
	Update(id uint, req dto.SedeUpdateRequest) (*dto.SedeResponse, error)
	Delete(id uint) error
}

type sedeService struct{}

func NewSedeService() SedeService {
	return &sedeService{}
}

func (s *sedeService) List() ([]dto.SedeListItem, error) {
	db := database.GetDB()
	type row struct {
		ID             uint
		Nombre         string
		Direccion      string
		RegionalID     uint
		RegionalNombre string
		Status         bool
	}
	var rows []row
	err := db.Table("sedes s").
		Select(`s.id, s.nombre, s.direccion, s.regional_id, COALESCE(r.nombre, '') AS regional_nombre, s.status`).
		Joins("LEFT JOIN regionales r ON r.id = s.regional_id").
		Where("s.deleted_at IS NULL").
		Order("s.nombre").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("error al listar sedes: %w", err)
	}
	out := make([]dto.SedeListItem, len(rows))
	for i, r := range rows {
		out[i] = dto.SedeListItem{
			ID:             r.ID,
			Nombre:         r.Nombre,
			Direccion:      r.Direccion,
			RegionalID:     r.RegionalID,
			RegionalNombre: r.RegionalNombre,
			Status:         r.Status,
		}
	}
	return out, nil
}

func (s *sedeService) Create(req dto.SedeCreateRequest) (*dto.SedeResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre de la sede es requerido")
	}

	var regional models.Regional
	if err := db.First(&regional, req.RegionalID).Error; err != nil {
		return nil, errors.New("regional no encontrada")
	}

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

	return sedeToResponse(&sede), nil
}

func (s *sedeService) Update(id uint, req dto.SedeUpdateRequest) (*dto.SedeResponse, error) {
	db := database.GetDB()
	var sede models.Sede
	if err := db.First(&sede, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("sede no encontrada")
		}
		return nil, err
	}

	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre de la sede es requerido")
	}

	var regional models.Regional
	if err := db.First(&regional, req.RegionalID).Error; err != nil {
		return nil, errors.New("regional no encontrada")
	}

	var dup models.Sede
	if err := db.Where("nombre = ? AND id <> ?", nombre, id).First(&dup).Error; err == nil {
		return nil, errors.New("ya existe otra sede con ese nombre")
	}

	regionalID := regional.ID
	sede.Nombre = nombre
	sede.Direccion = strings.TrimSpace(req.Direccion)
	sede.RegionalID = &regionalID
	if req.Status != nil {
		sede.Status = *req.Status
	}
	if err := db.Save(&sede).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar sede: %w", err)
	}
	return sedeToResponse(&sede), nil
}

func (s *sedeService) Delete(id uint) error {
	db := database.GetDB()
	var count int64
	if err := db.Model(&models.Bloque{}).Where("sede_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("no se puede eliminar: la sede tiene bloques asociados")
	}
	res := db.Delete(&models.Sede{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("sede no encontrada")
	}
	return nil
}

func sedeToResponse(sede *models.Sede) *dto.SedeResponse {
	regionalID := uint(0)
	if sede.RegionalID != nil {
		regionalID = *sede.RegionalID
	}
	return &dto.SedeResponse{
		ID:         sede.ID,
		Nombre:     sede.Nombre,
		Direccion:  sede.Direccion,
		RegionalID: regionalID,
		Status:     sede.Status,
	}
}
