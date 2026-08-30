/**
 * services: lecturas públicas del portal y semilleros publicados.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

// PortalPublicService home y semilleros visibles sin autenticación.
type PortalPublicService struct {
	portal     repositories.PortalRepository
	semilleros repositories.SemilleroRepository
}

// NewPortalPublicService constructor.
func NewPortalPublicService() *PortalPublicService {
	return &PortalPublicService{
		portal:     repositories.NewPortalRepository(),
		semilleros: repositories.NewSemilleroRepository(),
	}
}

// Home banners vigentes y presentación si está publicada.
func (s *PortalPublicService) Home() (dto.PortalHomeResponse, error) {
	banners, err := s.portal.ListarBanners()
	if err != nil {
		return dto.PortalHomeResponse{}, err
	}
	now := time.Now()
	out := dto.PortalHomeResponse{Banners: []dto.PortalBannerItem{}}
	for _, b := range banners {
		if BannerVigente(b, now) {
			out.Banners = append(out.Banners, bannerAItem(b))
		}
	}
	pres, err := s.portal.ObtenerPresentacion()
	if err != nil {
		return dto.PortalHomeResponse{}, err
	}
	if pres != nil && pres.EstadoPublicacion == models.PortalEstadoPublicado {
		item := presentacionAItem(*pres)
		out.Presentacion = &item
	}
	return out, nil
}

// SemillerosPublicados listado para la vitrina.
func (s *PortalPublicService) SemillerosPublicados() ([]dto.SemilleroItem, error) {
	rows, err := s.semilleros.ListarPublicados()
	if err != nil {
		return nil, err
	}
	out := make([]dto.SemilleroItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, semilleroAItem(r, false))
	}
	return out, nil
}

// SemilleroPorSlug ficha pública; 404 si no está publicado.
func (s *PortalPublicService) SemilleroPorSlug(slug string) (*dto.SemilleroItem, error) {
	row, err := s.semilleros.BuscarPorSlug(slug)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, gorm.ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}
	if row.EstadoPublicacion != models.PortalEstadoPublicado {
		return nil, gorm.ErrRecordNotFound
	}
	item := semilleroPublicoAItem(*row)
	return &item, nil
}
