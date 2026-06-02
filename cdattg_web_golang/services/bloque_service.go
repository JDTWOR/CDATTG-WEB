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

type BloqueService interface {
	List() ([]dto.BloqueItemInfra, error)
	Create(req dto.BloqueCreateRequest) (*dto.BloqueResponse, error)
	Update(id uint, req dto.BloqueUpdateRequest) (*dto.BloqueResponse, error)
	Delete(id uint) error
}

type bloqueService struct{}

func NewBloqueService() BloqueService {
	return &bloqueService{}
}

func (s *bloqueService) List() ([]dto.BloqueItemInfra, error) {
	db := database.GetDB()
	type row struct {
		ID         uint
		Nombre     string
		SedeID     uint
		SedeNombre string
	}
	var rows []row
	err := db.Table("bloques b").
		Select("b.id, b.nombre, b.sede_id, s.nombre as sede_nombre").
		Joins("JOIN sedes s ON s.id = b.sede_id").
		Where("b.deleted_at IS NULL").
		Order("s.nombre, b.nombre").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("error al listar bloques: %w", err)
	}
	out := make([]dto.BloqueItemInfra, len(rows))
	for i, r := range rows {
		out[i] = dto.BloqueItemInfra{
			ID:         r.ID,
			Nombre:     r.Nombre,
			SedeID:     r.SedeID,
			SedeNombre: r.SedeNombre,
		}
	}
	return out, nil
}

func (s *bloqueService) Create(req dto.BloqueCreateRequest) (*dto.BloqueResponse, error) {
	db := database.GetDB()
	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del bloque es requerido")
	}

	var sede models.Sede
	if err := db.First(&sede, req.SedeID).Error; err != nil {
		return nil, errors.New("sede no encontrada")
	}

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

	return bloqueToResponse(&b), nil
}

func (s *bloqueService) Update(id uint, req dto.BloqueUpdateRequest) (*dto.BloqueResponse, error) {
	db := database.GetDB()
	var bloque models.Bloque
	if err := db.First(&bloque, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("bloque no encontrado")
		}
		return nil, err
	}

	nombre := strings.TrimSpace(strings.ToUpper(req.Nombre))
	if nombre == "" {
		return nil, errors.New("el nombre del bloque es requerido")
	}

	var sede models.Sede
	if err := db.First(&sede, req.SedeID).Error; err != nil {
		return nil, errors.New("sede no encontrada")
	}

	var dup models.Bloque
	if err := db.Where("sede_id = ? AND nombre = ? AND id <> ?", req.SedeID, nombre, id).First(&dup).Error; err == nil {
		return nil, errors.New("ya existe otro bloque con ese nombre en esa sede")
	}

	bloque.Nombre = nombre
	bloque.SedeID = req.SedeID
	if err := db.Save(&bloque).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar bloque: %w", err)
	}
	return bloqueToResponse(&bloque), nil
}

func (s *bloqueService) Delete(id uint) error {
	db := database.GetDB()
	var count int64
	if err := db.Model(&models.Piso{}).Where("bloque_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("no se puede eliminar: el bloque tiene pisos asociados")
	}
	res := db.Delete(&models.Bloque{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("bloque no encontrado")
	}
	return nil
}

func bloqueToResponse(b *models.Bloque) *dto.BloqueResponse {
	return &dto.BloqueResponse{
		ID:     b.ID,
		Nombre: b.Nombre,
		SedeID: b.SedeID,
	}
}
