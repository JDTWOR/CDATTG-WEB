/**
 * Armo el listado de biblioteca: solo regulares que el líder ya aprobó.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

var errCarnetNoBiblioteca = errors.New("este carnet no es de formación regular aprobada")

// ListarBiblioteca trae fichas y personas con carnet regular validado.
func (s *carnetDigitalService) ListarBiblioteca(fichaID uint) (*dto.CarnetBibliotecaResponse, error) {
	list, err := s.solicitudRepo.FindAprobadosRegular()
	if err != nil {
		if tablaCarnetAusente(err) {
			return &dto.CarnetBibliotecaResponse{Fichas: []dto.CarnetBibliotecaFicha{}, Items: []dto.CarnetBibliotecaItem{}}, nil
		}
		return nil, err
	}
	lideres, err := s.solicitudRepo.FindNombresLiderPorFicha(fichaIDsDeSolicitudes(list))
	if err != nil {
		return nil, err
	}
	personas, err := s.solicitudRepo.FindPersonasPorIDs(personaIDsDeSolicitudes(list))
	if err != nil {
		return nil, err
	}
	out := bibliotecaDesdeSolicitudes(list, lideres, personas)
	out.Items = filtrarItemsBiblioteca(out.Items, fichaID)
	return &out, nil
}

// LeerFotoBiblioteca entrega la foto si el carnet es regular y está aprobado.
func (s *carnetDigitalService) LeerFotoBiblioteca(solicitudID uint) (*PersonaFotoArchivo, error) {
	sol, err := s.solicitudRepo.FindByID(solicitudID)
	if err != nil {
		return nil, err
	}
	if !esCarnetParaBiblioteca(sol) {
		return nil, errCarnetNoBiblioteca
	}
	return leerFotoPersona(sol.FotoPath)
}

func esCarnetParaBiblioteca(sol *models.CarnetSolicitud) bool {
	return sol != nil && sol.Estado == models.CarnetEstadoAprobado && sol.TipoFormacion == models.TipoFormacionRegular
}
