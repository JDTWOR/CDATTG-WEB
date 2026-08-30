/**
 * services: CRUD de banners y presentación del portal.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// PortalAdminService contenido del portal (banners y presentación).
type PortalAdminService struct {
	repo repositories.PortalRepository
}

// NewPortalAdminService constructor.
func NewPortalAdminService() *PortalAdminService {
	return &PortalAdminService{repo: repositories.NewPortalRepository()}
}

// ListarBanners admin.
func (s *PortalAdminService) ListarBanners() ([]dto.PortalBannerItem, error) {
	rows, err := s.repo.ListarBanners()
	if err != nil {
		return nil, err
	}
	out := make([]dto.PortalBannerItem, 0, len(rows))
	for _, b := range rows {
		out = append(out, bannerAItem(b))
	}
	return out, nil
}

// CrearBanner alta.
func (s *PortalAdminService) CrearBanner(req dto.PortalBannerRequest, userID uint) (*dto.PortalBannerItem, error) {
	row, err := armarBanner(req, userID)
	if err != nil {
		return nil, err
	}
	if err := s.repo.CrearBanner(row); err != nil {
		return nil, err
	}
	item := bannerAItem(*row)
	return &item, nil
}

// ActualizarBanner edición.
func (s *PortalAdminService) ActualizarBanner(id uint, req dto.PortalBannerRequest, userID uint) (*dto.PortalBannerItem, error) {
	existente, err := s.repo.BuscarBanner(id)
	if err != nil {
		return nil, err
	}
	row, err := armarBanner(req, userID)
	if err != nil {
		return nil, err
	}
	row.ID = existente.ID
	row.CreatedAt = existente.CreatedAt
	row.UserCreateID = existente.UserCreateID
	if err := s.repo.GuardarBanner(row); err != nil {
		return nil, err
	}
	item := bannerAItem(*row)
	return &item, nil
}

// EliminarBanner baja lógica GORM.
func (s *PortalAdminService) EliminarBanner(id uint) error {
	return s.repo.EliminarBanner(id)
}

// ObtenerPresentacion o estructura vacía.
func (s *PortalAdminService) ObtenerPresentacion() (*dto.PortalPresentacionItem, error) {
	row, err := s.repo.ObtenerPresentacion()
	if err != nil {
		return nil, err
	}
	if row == nil {
		vacio := dto.PortalPresentacionItem{EstadoPublicacion: models.PortalEstadoBorrador}
		return &vacio, nil
	}
	item := presentacionAItem(*row)
	return &item, nil
}

// GuardarPresentacion crea o actualiza el registro único.
func (s *PortalAdminService) GuardarPresentacion(req dto.PortalPresentacionRequest, userID uint) (*dto.PortalPresentacionItem, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	uid := userID
	existente, err := s.repo.ObtenerPresentacion()
	if err != nil {
		return nil, err
	}
	row := &models.PortalPresentacion{
		Mision: req.Mision, Vision: req.Vision, ObjetivoGeneral: req.ObjetivoGeneral,
		Historia: req.Historia, VideoURL: req.VideoURL, PoliticasPDF: req.PoliticasPDF,
		Equipo: req.Equipo, EstadoPublicacion: estado,
	}
	row.UserEditID = &uid
	if existente != nil {
		row.ID = existente.ID
		row.CreatedAt = existente.CreatedAt
		row.UserCreateID = existente.UserCreateID
	} else {
		row.UserCreateID = &uid
	}
	if err := s.repo.GuardarPresentacion(row); err != nil {
		return nil, err
	}
	item := presentacionAItem(*row)
	return &item, nil
}

func armarBanner(req dto.PortalBannerRequest, userID uint) (*models.PortalBanner, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	desde, err := parseFechaOpcional(req.VigenteDesde)
	if err != nil {
		return nil, err
	}
	hasta, err := parseFechaOpcional(req.VigenteHasta)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.PortalBanner{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: req.Titulo, Descripcion: strings.TrimSpace(req.Descripcion), ImagenURL: req.ImagenURL,
		Etiqueta: strings.TrimSpace(req.Etiqueta), BotonTexto: strings.TrimSpace(req.BotonTexto),
		EnlaceURL: EnlacePublicoSeguro(req.EnlaceURL),
		Orden: req.Orden, VigenteDesde: desde, VigenteHasta: hasta, EstadoPublicacion: estado,
	}, nil
}
