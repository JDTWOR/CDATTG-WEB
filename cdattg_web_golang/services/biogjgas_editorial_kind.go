/**
 * services: armado y listado interno por tipo editorial.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *BiogjgasEditorialService) listarKind(kind string, pub bool) ([]dto.BiogjgasItem, error) {
	switch kind {
	case kindRevista:
		rows, err := s.repo.ListarRevistas(pub)
		return mapearItems(rows, err, revistaAItem)
	case kindBoletin:
		rows, err := s.repo.ListarBoletines(pub)
		return mapearItems(rows, err, boletinAItem)
	case kindPodcast:
		rows, err := s.repo.ListarPodcasts(pub)
		return mapearItems(rows, err, podcastAItem)
	case kindConvocatoria:
		rows, err := s.repo.ListarConvocatorias(pub)
		return mapearItems(rows, err, convocatoriaAItem)
	case kindActividad:
		rows, err := s.repo.ListarActividades(pub)
		return mapearItems(rows, err, actividadAItem)
	default:
		rows, err := s.repo.ListarBanners(pub)
		return bannersAItems(rows, pub, time.Now()), err
	}
}

func (s *BiogjgasEditorialService) armar(kind string, req dto.BiogjgasItem, userID uint) (any, error) {
	switch kind {
	case kindRevista:
		return itemARevista(req, userID)
	case kindBoletin:
		return itemABoletin(req, userID)
	case kindPodcast:
		return itemAPodcast(req, userID)
	case kindConvocatoria:
		return itemAConvocatoria(req, userID)
	case kindActividad:
		return itemAActividad(req, userID)
	default:
		return itemABiogBanner(req, userID)
	}
}

// mapearItems aplica fn a cada fila y propaga err.
func mapearItems[T any](rows []T, err error, fn func(T) dto.BiogjgasItem) ([]dto.BiogjgasItem, error) {
	out := make([]dto.BiogjgasItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, fn(r))
	}
	return out, err
}

// bannersAItems filtra vigencia cuando el listado es público.
func bannersAItems(rows []models.BiogjgasBanner, pub bool, now time.Time) []dto.BiogjgasItem {
	out := make([]dto.BiogjgasItem, 0, len(rows))
	for _, r := range rows {
		if pub && !PublicacionVigente(r.EstadoPublicacion, r.VigenteDesde, r.VigenteHasta, now) {
			continue
		}
		out = append(out, biogBannerAItem(r))
	}
	return out
}
