/**
 * Armo filas de biblioteca con nombres partidos para el Excel.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// ultimasSolicitudesBiblioteca deja una sola fila por persona y ficha.
// Lo hice porque al renovar el carnet quedaban dos iguales; me quedo con la última.
func ultimasSolicitudesBiblioteca(list []models.CarnetSolicitud) []models.CarnetSolicitud {
	best := map[string]models.CarnetSolicitud{}
	orden := make([]string, 0, len(list))
	for i := range list {
		clave := claveSolicitudBiblioteca(list[i])
		prev, ok := best[clave]
		if !ok {
			best[clave] = list[i]
			orden = append(orden, clave)
			continue
		}
		if list[i].ID > prev.ID {
			best[clave] = list[i]
		}
	}
	out := make([]models.CarnetSolicitud, 0, len(orden))
	for _, clave := range orden {
		out = append(out, best[clave])
	}
	return out
}

func claveSolicitudBiblioteca(s models.CarnetSolicitud) string {
	if s.PersonaID != 0 {
		return fmt.Sprintf("p:%d:f:%d", s.PersonaID, s.FichaID)
	}
	return fmt.Sprintf("d:%s:f:%d", s.NumeroDocumento, s.FichaID)
}

func fichaIDsDeSolicitudes(list []models.CarnetSolicitud) []uint {
	return idsUnicosSolicitud(list, func(s models.CarnetSolicitud) uint { return s.FichaID })
}

func personaIDsDeSolicitudes(list []models.CarnetSolicitud) []uint {
	return idsUnicosSolicitud(list, func(s models.CarnetSolicitud) uint { return s.PersonaID })
}

func idsUnicosSolicitud(list []models.CarnetSolicitud, idDe func(models.CarnetSolicitud) uint) []uint {
	seen := map[uint]struct{}{}
	ids := make([]uint, 0, len(list))
	for i := range list {
		id := idDe(list[i])
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}
	return ids
}

func bibliotecaDesdeSolicitudes(list []models.CarnetSolicitud, lideres map[uint]string, personas map[uint]models.Persona) dto.CarnetBibliotecaResponse {
	list = ultimasSolicitudesBiblioteca(list)
	items := make([]dto.CarnetBibliotecaItem, 0, len(list))
	fichas := make([]dto.CarnetBibliotecaFicha, 0)
	seen := map[uint]struct{}{}
	for i := range list {
		lider := lideres[list[i].FichaID]
		var p *models.Persona
		if per, ok := personas[list[i].PersonaID]; ok {
			p = &per
		}
		items = append(items, itemBiblioteca(list[i], lider, p))
		if _, ok := seen[list[i].FichaID]; ok {
			continue
		}
		seen[list[i].FichaID] = struct{}{}
		fichas = append(fichas, dto.CarnetBibliotecaFicha{
			ID: list[i].FichaID, Numero: list[i].FichaNumero,
			Programa: list[i].Programa, InstructorLider: lider,
		})
	}
	return dto.CarnetBibliotecaResponse{Fichas: fichas, Items: items}
}

func itemBiblioteca(s models.CarnetSolicitud, lider string, p *models.Persona) dto.CarnetBibliotecaItem {
	pn, sn, pa, sa := s.Nombres, "", s.Apellidos, ""
	if p != nil {
		pn, sn, pa, sa = p.PrimerNombre, p.SegundoNombre, p.PrimerApellido, p.SegundoApellido
	}
	return dto.CarnetBibliotecaItem{
		ID: s.ID, PrimerNombre: pn, SegundoNombre: sn, PrimerApellido: pa, SegundoApellido: sa,
		Nombres: s.Nombres, Apellidos: s.Apellidos,
		NumeroDocumento: s.NumeroDocumento, Rh: s.Rh,
		FichaID: s.FichaID, FichaNumero: s.FichaNumero, Programa: s.Programa,
		InstructorLider: lider, TieneFoto: s.FotoPath != "",
		FotoURL: rutaFotoImpresora(s.NumeroDocumento),
	}
}
