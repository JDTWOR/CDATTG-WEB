/**
 * services: buscar, borrar y leer ID de modelos editoriales.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *BiogjgasEditorialService) buscarKind(kind string, id uint) (*dto.BiogjgasItem, error) {
	switch kind {
	case kindRevista:
		var row models.BiogjgasRevista
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := revistaAItem(row)
		return &item, nil
	case kindBoletin:
		var row models.BiogjgasBoletin
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := boletinAItem(row)
		return &item, nil
	case kindPodcast:
		var row models.BiogjgasPodcast
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := podcastAItem(row)
		return &item, nil
	case kindConvocatoria:
		var row models.BiogjgasConvocatoria
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := convocatoriaAItem(row)
		return &item, nil
	case kindActividad:
		var row models.BiogjgasActividad
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := actividadAItem(row)
		return &item, nil
	default:
		var row models.BiogjgasBanner
		if err := s.repo.Buscar(&row, id); err != nil {
			return nil, err
		}
		item := biogBannerAItem(row)
		return &item, nil
	}
}

func (s *BiogjgasEditorialService) borrarKind(kind string, id uint) error {
	switch kind {
	case kindRevista:
		return s.repo.Eliminar(&models.BiogjgasRevista{}, id)
	case kindBoletin:
		return s.repo.Eliminar(&models.BiogjgasBoletin{}, id)
	case kindPodcast:
		return s.repo.Eliminar(&models.BiogjgasPodcast{}, id)
	case kindConvocatoria:
		return s.repo.Eliminar(&models.BiogjgasConvocatoria{}, id)
	case kindActividad:
		return s.repo.Eliminar(&models.BiogjgasActividad{}, id)
	default:
		return s.repo.Eliminar(&models.BiogjgasBanner{}, id)
	}
}

func (s *BiogjgasEditorialService) ponerID(kind string, row any, id uint) error {
	switch m := row.(type) {
	case *models.BiogjgasRevista:
		m.ID = id
	case *models.BiogjgasBoletin:
		m.ID = id
	case *models.BiogjgasPodcast:
		m.ID = id
	case *models.BiogjgasConvocatoria:
		m.ID = id
	case *models.BiogjgasActividad:
		m.ID = id
	case *models.BiogjgasBanner:
		m.ID = id
	}
	_ = kind
	return nil
}

func (s *BiogjgasEditorialService) itemDesdeModelo(kind string, row any) (*dto.BiogjgasItem, error) {
	_ = kind
	switch m := row.(type) {
	case *models.BiogjgasRevista:
		item := revistaAItem(*m)
		return &item, nil
	case *models.BiogjgasBoletin:
		item := boletinAItem(*m)
		return &item, nil
	case *models.BiogjgasPodcast:
		item := podcastAItem(*m)
		return &item, nil
	case *models.BiogjgasConvocatoria:
		item := convocatoriaAItem(*m)
		return &item, nil
	case *models.BiogjgasActividad:
		item := actividadAItem(*m)
		return &item, nil
	case *models.BiogjgasBanner:
		item := biogBannerAItem(*m)
		return &item, nil
	default:
		return nil, nil
	}
}
