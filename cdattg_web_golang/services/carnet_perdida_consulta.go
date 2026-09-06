/**
 * Consultas del submódulo de reposición: historial del aprendiz y bandeja del
 * bibliotecario. Las acciones (decidir, renovar) viven en
 * carnet_perdida_decision.go y la descarga de archivos en
 * carnet_perdida_descarga_svc.go.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
)

var errCarnetPerdidaNoEncontrada = errors.New("solicitud de reposición no encontrada")
var errCarnetPerdidaYaDecidida = errors.New("esa solicitud ya fue revisada")

// MiHistorial devuelve las reposiciones que ha hecho el aprendiz.
func (s *carnetPerdidaService) MiHistorial(personaID uint) ([]dto.CarnetPerdidaItem, error) {
	hist, err := s.perdidaRepo.FindHistorialPorPersona(personaID)
	if err != nil {
		return nil, err
	}
	out := make([]dto.CarnetPerdidaItem, 0, len(hist))
	for i := range hist {
		out = append(out, perdidaAItem(hist[i]))
	}
	return out, nil
}

// Revisiones devuelve la bandeja del bibliotecario por estado.
func (s *carnetPerdidaService) Revisiones(estado string, limit, offset int) ([]dto.CarnetPerdidaRevision, int64, error) {
	list, total, err := s.perdidaRepo.FindPorEstado(estado, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]dto.CarnetPerdidaRevision, 0, len(list))
	for i := range list {
		out = append(out, perdidaARevision(list[i]))
	}
	return out, total, nil
}
