/**
 * En portería muestro los nombres y la foto del carnet si el líder ya lo validó.
 * Si aún no hay carnet, dejo los datos que la persona tiene hoy en el sistema.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// fichaAcceso arma la ficha de portería y, si hay carnet aprobado, congela nombres y foto.
func (s *vigilanciaAccesoService) fichaAcceso(p *models.Persona, esNueva bool, tipos []string) dto.AccesoPersonaFicha {
	if p == nil {
		return dto.AccesoPersonaFicha{}
	}
	f := toFicha(p, esNueva, tipos)
	f.TieneFoto = strings.TrimSpace(p.FotoPath) != ""
	sol := s.carnetValidadoDe(p.ID)
	if sol == nil {
		return f
	}
	return aplicarCarnetEnAcceso(f, sol)
}

// aplicarCarnetEnAcceso deja los nombres y la foto que el instructor validó.
func aplicarCarnetEnAcceso(f dto.AccesoPersonaFicha, sol *models.CarnetSolicitud) dto.AccesoPersonaFicha {
	if sol == nil {
		return f
	}
	f.PrimerNombre = strings.TrimSpace(sol.Nombres)
	f.SegundoNombre = ""
	f.PrimerApellido = strings.TrimSpace(sol.Apellidos)
	f.SegundoApellido = ""
	f.NombreCompleto = strings.TrimSpace(sol.Nombres + " " + sol.Apellidos)
	f.TieneFoto = strings.TrimSpace(sol.FotoPath) != ""
	f.FotoDesdeCarnet = true
	return f
}

// fotoPathAcceso elige la foto del carnet validado o, si no hay, la de perfil.
func fotoPathAcceso(p *models.Persona, sol *models.CarnetSolicitud) string {
	if sol != nil && strings.TrimSpace(sol.FotoPath) != "" {
		return sol.FotoPath
	}
	if p != nil {
		return p.FotoPath
	}
	return ""
}

// LeerFotoAcceso entrega la foto que debe ver portería para ese documento.
func (s *vigilanciaAccesoService) LeerFotoAcceso(documento string) (*PersonaFotoArchivo, error) {
	doc := normalizeDocumentoAcceso(documento)
	if doc == "" {
		return nil, errPersonaFotoAusente
	}
	persona, err := s.personaRepo.FindByNumeroDocumento(doc)
	if err != nil || persona == nil {
		return nil, errPersonaFotoAusente
	}
	return leerFotoPersona(fotoPathAcceso(persona, s.carnetValidadoDe(persona.ID)))
}

// carnetValidadoDe busca el último carnet aprobado y, si la foto aún es la de perfil, la copia.
func (s *vigilanciaAccesoService) carnetValidadoDe(personaID uint) *models.CarnetSolicitud {
	if s.solicitudRepo == nil {
		return nil
	}
	sol, err := s.solicitudRepo.FindUltimaAprobadaByPersonaID(personaID)
	if err != nil || sol == nil {
		return nil
	}
	fijarFotoCopiaSolicitud(s.solicitudRepo, sol)
	return sol
}
