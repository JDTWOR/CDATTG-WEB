/**
 * services: CRUD editorial BIOGIGAS (admin).
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

// BiogjgasEditorialService altas y listados del área de investigación.
type BiogjgasEditorialService struct {
	repo *repositories.BiogjgasRepository
}

// NewBiogjgasEditorialService constructor.
func NewBiogjgasEditorialService() *BiogjgasEditorialService {
	return &BiogjgasEditorialService{repo: repositories.NewBiogjgasRepository()}
}

// Listar admin o público según soloPublicados.
func (s *BiogjgasEditorialService) Listar(kind string, soloPublicados bool) ([]dto.BiogjgasItem, error) {
	if err := exigirKind(kind); err != nil {
		return nil, err
	}
	return s.listarKind(kind, soloPublicados)
}

// Obtener un registro por id.
func (s *BiogjgasEditorialService) Obtener(kind string, id uint, soloPublicados bool) (*dto.BiogjgasItem, error) {
	if err := exigirKind(kind); err != nil {
		return nil, err
	}
	item, err := s.buscarKind(kind, id)
	if err != nil {
		return nil, err
	}
	if soloPublicados && item.EstadoPublicacion != models.PortalEstadoPublicado {
		return nil, gorm.ErrRecordNotFound
	}
	return item, nil
}

// RevistaPorSlug ficha pública de un número.
func (s *BiogjgasEditorialService) RevistaPorSlug(slug string) (*dto.BiogjgasItem, error) {
	row, err := s.repo.RevistaPorSlug(strings.TrimSpace(slug))
	if err != nil {
		return nil, err
	}
	if row.EstadoPublicacion != models.PortalEstadoPublicado {
		return nil, gorm.ErrRecordNotFound
	}
	item := revistaAItem(*row)
	return &item, nil
}

// Crear registro.
func (s *BiogjgasEditorialService) Crear(kind string, req dto.BiogjgasItem, userID uint) (*dto.BiogjgasItem, error) {
	if strings.TrimSpace(req.Titulo) == "" {
		return nil, errors.New("el título es obligatorio")
	}
	row, err := s.armar(kind, req, userID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Crear(row); err != nil {
		return nil, err
	}
	return s.itemDesdeModelo(kind, row)
}

// Actualizar registro existente.
func (s *BiogjgasEditorialService) Actualizar(kind string, id uint, req dto.BiogjgasItem, userID uint) (*dto.BiogjgasItem, error) {
	if _, err := s.buscarKind(kind, id); err != nil {
		return nil, err
	}
	row, err := s.armar(kind, req, userID)
	if err != nil {
		return nil, err
	}
	if err := s.ponerID(kind, row, id); err != nil {
		return nil, err
	}
	if err := s.repo.Guardar(row); err != nil {
		return nil, err
	}
	return s.Obtener(kind, id, false)
}

// Eliminar baja lógica GORM.
func (s *BiogjgasEditorialService) Eliminar(kind string, id uint) error {
	if err := exigirKind(kind); err != nil {
		return err
	}
	return s.borrarKind(kind, id)
}
