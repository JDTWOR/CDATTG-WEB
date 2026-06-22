package services

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func mapProcesoToDTO(p *models.EleccionProceso) dto.EleccionProcesoResponse {
	resp := dto.EleccionProcesoResponse{
		ID:                     p.ID,
		RegionalID:             p.RegionalID,
		Anio:                   p.Anio,
		NombreCiclo:            p.NombreCiclo,
		Estado:                 p.Estado,
		FechaInscripcionInicio: p.FechaInscripcionInicio,
		FechaInscripcionFin:    p.FechaInscripcionFin,
		FechaVotacionInicio:    p.FechaVotacionInicio,
		FechaVotacionFin:       p.FechaVotacionFin,
		MinDiasMatricula:       p.MinDiasMatricula,
		CreatedAt:              p.CreatedAt,
	}
	if p.Regional != nil {
		resp.RegionalNombre = p.Regional.Nombre
	}
	return resp
}

func nombreAprendiz(a *models.Aprendiz) string {
	if a == nil || a.Persona == nil {
		return "Aprendiz"
	}
	parts := []string{
		strings.TrimSpace(a.Persona.PrimerNombre),
		strings.TrimSpace(a.Persona.PrimerApellido),
	}
	out := strings.TrimSpace(strings.Join(parts, " "))
	if out == "" {
		return a.Persona.NumeroDocumento
	}
	return out
}

func aprendizResumen(a *models.Aprendiz) dto.EleccionAprendizResumen {
	if a == nil {
		return dto.EleccionAprendizResumen{}
	}
	r := dto.EleccionAprendizResumen{ID: a.ID, Nombre: nombreAprendiz(a)}
	if a.FichaCaracterizacion != nil {
		r.Ficha = a.FichaCaracterizacion.Ficha
		if a.FichaCaracterizacion.Sede != nil {
			r.Sede = a.FichaCaracterizacion.Sede.Nombre
		}
	}
	return r
}

func planchaLabel(pl *models.EleccionPlancha) string {
	if pl == nil {
		return ""
	}
	return fmt.Sprintf("%s / %s", nombreAprendiz(pl.TitularAprendiz), nombreAprendiz(pl.SuplenteAprendiz))
}

func (s *eleccionService) mapPlanchas(list []models.EleccionPlancha, personaID *uint, miAprendizID uint) []dto.EleccionPlanchaResponse {
	out := make([]dto.EleccionPlanchaResponse, len(list))
	for i := range list {
		pl := &list[i]
		votos, _ := s.repo.CountVotosByPlancha(pl.ID)
		out[i] = dto.EleccionPlanchaResponse{
			ID:                 pl.ID,
			ProcesoID:          pl.ProcesoID,
			Estado:             pl.Estado,
			Titular:            aprendizResumen(pl.TitularAprendiz),
			Suplente:           aprendizResumen(pl.SuplenteAprendiz),
			TitularConfirmado:  pl.TitularConfirmadoAt != nil,
			SuplenteConfirmado: pl.SuplenteConfirmadoAt != nil,
			VotosRecibidos:     int(votos),
			MotivoRechazo:      pl.MotivoRechazo,
		}
		if personaID != nil && miAprendizID > 0 && pl.Estado == models.PlanchaEstadoPendiente {
			needsTitular := pl.TitularAprendizID == miAprendizID && pl.TitularConfirmadoAt == nil
			needsSuplente := pl.SuplenteAprendizID == miAprendizID && pl.SuplenteConfirmadoAt == nil
			out[i].PendienteMiConfirmacion = needsTitular || needsSuplente
		}
	}
	return out
}

func mapRepresentanteToDTO(r *models.RepresentanteAprendiz) dto.RepresentanteAprendizResponse {
	resp := dto.RepresentanteAprendizResponse{
		RegionalID:     r.RegionalID,
		ProcesoID:      r.ProcesoID,
		Titular:        aprendizResumen(r.TitularAprendiz),
		Suplente:       aprendizResumen(r.SuplenteAprendiz),
		VigenciaDesde:  r.VigenciaDesde,
		VigenciaHasta:  r.VigenciaHasta,
	}
	if r.Regional != nil {
		resp.RegionalNombre = r.Regional.Nombre
	}
	if r.Proceso != nil {
		resp.NombreCiclo = r.Proceso.NombreCiclo
		resp.Anio = r.Proceso.Anio
	}
	return resp
}

func encodeDetalleJSON(conteo []dto.EleccionResultadoPlanchaConteo) string {
	b, _ := json.Marshal(conteo)
	return string(b)
}

func decodeDetalleJSON(raw string) []dto.EleccionResultadoPlanchaConteo {
	if raw == "" {
		return nil
	}
	var out []dto.EleccionResultadoPlanchaConteo
	_ = json.Unmarshal([]byte(raw), &out)
	return out
}

func (s *eleccionService) buildConteo(procesoID uint) ([]dto.EleccionResultadoPlanchaConteo, int, error) {
	planchas, err := s.repo.ListPlanchasByProceso(procesoID, true)
	if err != nil {
		return nil, 0, err
	}
	total := 0
	out := make([]dto.EleccionResultadoPlanchaConteo, len(planchas))
	for i := range planchas {
		n, err := s.repo.CountVotosByPlancha(planchas[i].ID)
		if err != nil {
			return nil, 0, err
		}
		total += int(n)
		out[i] = dto.EleccionResultadoPlanchaConteo{
			PlanchaID: planchas[i].ID,
			Label:     planchaLabel(&planchas[i]),
			Votos:     int(n),
		}
	}
	return out, total, nil
}

func detectarEmpate(conteo []dto.EleccionResultadoPlanchaConteo) (bool, *uint) {
	if len(conteo) == 0 {
		return false, nil
	}
	maxVotos := -1
	var lideres []uint
	for _, c := range conteo {
		if c.Votos > maxVotos {
			maxVotos = c.Votos
			lideres = []uint{c.PlanchaID}
		} else if c.Votos == maxVotos && maxVotos >= 0 {
			lideres = append(lideres, c.PlanchaID)
		}
	}
	if maxVotos <= 0 {
		return false, nil
	}
	if len(lideres) > 1 {
		return true, nil
	}
	id := lideres[0]
	return false, &id
}
