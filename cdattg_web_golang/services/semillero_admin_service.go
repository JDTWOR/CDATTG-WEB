/**
 * services: CRUD autenticado de semilleros.
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

// SemilleroAdminService escrituras del módulo semillero.
type SemilleroAdminService struct {
	repo repositories.SemilleroRepository
}

// NewSemilleroAdminService constructor.
func NewSemilleroAdminService() *SemilleroAdminService {
	return &SemilleroAdminService{repo: repositories.NewSemilleroRepository()}
}

// Listar todos (admin).
func (s *SemilleroAdminService) Listar() ([]dto.SemilleroItem, error) {
	rows, err := s.repo.Listar()
	if err != nil {
		return nil, err
	}
	out := make([]dto.SemilleroItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, semilleroAItem(r, false))
	}
	return out, nil
}

// Obtener detalle con hijos.
func (s *SemilleroAdminService) Obtener(id uint) (*dto.SemilleroItem, error) {
	row, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, err
	}
	item := semilleroAItem(*row, true)
	return &item, nil
}

// Crear semillero y relaciones.
func (s *SemilleroAdminService) Crear(req dto.SemilleroRequest, userID uint) (*dto.SemilleroItem, error) {
	row, err := s.armarSemillero(req, 0, userID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Crear(row); err != nil {
		return nil, err
	}
	if err := s.repo.ReemplazarHijos(row.ID, hijosLineas(req), hijosIntegrantes(req), hijosProyectos(req)); err != nil {
		return nil, err
	}
	return s.Obtener(row.ID)
}

// Actualizar semillero y relaciones.
func (s *SemilleroAdminService) Actualizar(id uint, req dto.SemilleroRequest, userID uint) (*dto.SemilleroItem, error) {
	if _, err := s.repo.BuscarPorID(id); err != nil {
		return nil, err
	}
	row, err := s.armarSemillero(req, id, userID)
	if err != nil {
		return nil, err
	}
	row.ID = id
	if err := s.repo.Guardar(row); err != nil {
		return nil, err
	}
	if err := s.repo.ReemplazarHijos(id, hijosLineas(req), hijosIntegrantes(req), hijosProyectos(req)); err != nil {
		return nil, err
	}
	return s.Obtener(id)
}

// Eliminar semillero.
func (s *SemilleroAdminService) Eliminar(id uint) error {
	return s.repo.Eliminar(id)
}

func (s *SemilleroAdminService) armarSemillero(req dto.SemilleroRequest, id uint, userID uint) (*models.Semillero, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = SlugDesdeNombre(req.Nombre)
	}
	if slug == "" {
		return nil, errors.New("el semillero necesita un slug")
	}
	existente, err := s.repo.BuscarPorSlug(slug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existente != nil && existente.ID != id {
		return nil, errors.New("ya existe un semillero con ese slug")
	}
	uid := userID
	return &models.Semillero{
		UserAuditModel:    models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Nombre:            strings.TrimSpace(req.Nombre),
		Sigla:             strings.TrimSpace(req.Sigla),
		Slug:              slug,
		Icono:             strings.TrimSpace(req.Icono),
		ColorIdentidad:    strings.TrimSpace(req.ColorIdentidad),
		Resumen:           req.Resumen,
		Descripcion:       req.Descripcion,
		Mision:            req.Mision,
		Vision:            req.Vision,
		Objetivos:         req.Objetivos,
		InstructorLider:   strings.TrimSpace(req.InstructorLider),
		CorreoContacto:    strings.ToLower(strings.TrimSpace(req.CorreoContacto)),
		ImagenURL:         req.ImagenURL,
		Orden:             req.Orden,
		EstadoPublicacion: estado,
	}, nil
}
