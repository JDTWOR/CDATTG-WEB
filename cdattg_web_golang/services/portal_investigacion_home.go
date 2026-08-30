/**
 * services: home público de Investigación (BIOGIGAS).
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

// InvestigacionHome banners vigentes del área, semilleros y presentación.
func (s *PortalPublicService) InvestigacionHome() (dto.InvestigacionHomeResponse, error) {
	repo := repositories.NewBiogjgasRepository()
	banners, err := repo.ListarBanners(false)
	if err != nil {
		return dto.InvestigacionHomeResponse{}, err
	}
	now := time.Now()
	out := dto.InvestigacionHomeResponse{Banners: []dto.PortalBannerItem{}, Semilleros: []dto.SemilleroItem{}}
	for _, b := range banners {
		if PublicacionVigente(b.EstadoPublicacion, b.VigenteDesde, b.VigenteHasta, now) {
			out.Banners = append(out.Banners, biogBannerAPortal(b))
		}
	}
	sem, err := s.SemillerosPublicados()
	if err != nil {
		return dto.InvestigacionHomeResponse{}, err
	}
	out.Semilleros = sem
	home, err := s.Home()
	if err != nil {
		return dto.InvestigacionHomeResponse{}, err
	}
	out.Presentacion = home.Presentacion
	return out, nil
}
