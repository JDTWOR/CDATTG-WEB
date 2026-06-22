package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func (s *eleccionService) CalcularResultado(userID uint, roles []string, id uint) (*dto.EleccionResultadoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, id)
	if err != nil {
		return nil, err
	}
	if p.Estado != models.EleccionEstadoVotacion && p.Estado != models.EleccionEstadoEmpatePendiente {
		return nil, errEleccionFaseInvalida
	}
	return s.finalizarConteo(userID, p, nil, "")
}

func (s *eleccionService) RegistrarDesempate(userID uint, roles []string, id uint, req dto.EleccionDesempateRequest) (*dto.EleccionResultadoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, id)
	if err != nil {
		return nil, err
	}
	if p.Estado != models.EleccionEstadoEmpatePendiente {
		return nil, errors.New("el proceso no está pendiente de desempate")
	}
	planchaID := req.PlanchaGanadoraID
	nota := strings.TrimSpace(req.NotaDesempate)
	return s.finalizarConteo(userID, p, &planchaID, nota)
}

func (s *eleccionService) finalizarConteo(userID uint, p *models.EleccionProceso, ganadorForzado *uint, notaDesempate string) (*dto.EleccionResultadoResponse, error) {
	conteo, total, err := s.buildConteo(p.ID)
	if err != nil {
		return nil, err
	}
	empate, ganadorID := detectarEmpate(conteo)
	res := &models.EleccionResultado{
		ProcesoID:      p.ID,
		VotosTotales:   total,
		DetalleJSON:    encodeDetalleJSON(conteo),
		Empate:         empate,
		UserRegistroID: &userID,
	}
	if ganadorForzado != nil {
		res.Empate = false
		res.PlanchaGanadoraID = ganadorForzado
		if notaDesempate != "" {
			res.NotaDesempate = &notaDesempate
		}
		p.Estado = models.EleccionEstadoCerrada
	} else if empate {
		res.Empate = true
		p.Estado = models.EleccionEstadoEmpatePendiente
	} else {
		res.PlanchaGanadoraID = ganadorID
		p.Estado = models.EleccionEstadoCerrada
	}
	if err := s.repo.SaveResultado(res); err != nil {
		return nil, err
	}
	p.UserEditID = &userID
	if err := s.repo.UpdateProceso(p); err != nil {
		return nil, err
	}
	if p.Estado == models.EleccionEstadoCerrada && res.PlanchaGanadoraID != nil {
		if err := s.publicarRepresentantes(p, *res.PlanchaGanadoraID); err != nil {
			return nil, err
		}
	}
	return s.buildResultadoResponse(p, res, conteo, total, false)
}

func (s *eleccionService) publicarRepresentantes(p *models.EleccionProceso, planchaID uint) error {
	plancha, err := s.repo.FindPlanchaByID(planchaID)
	if err != nil {
		return err
	}
	now := time.Now()
	if err := s.repo.CerrarVigenciaRepresentantes(p.RegionalID, now); err != nil {
		return err
	}
	return s.repo.CreateRepresentante(&models.RepresentanteAprendiz{
		RegionalID:         p.RegionalID,
		ProcesoID:          p.ID,
		TitularAprendizID:  plancha.TitularAprendizID,
		SuplenteAprendizID: plancha.SuplenteAprendizID,
		VigenciaDesde:      now,
	})
}

func (s *eleccionService) buildResultadoResponse(p *models.EleccionProceso, res *models.EleccionResultado, conteo []dto.EleccionResultadoPlanchaConteo, total int, incluirVotos bool) (*dto.EleccionResultadoResponse, error) {
	elegibles, _ := s.repo.CountAprendicesActivosByRegional(p.RegionalID)
	participacion := 0.0
	if elegibles > 0 {
		participacion = float64(total) / float64(elegibles) * 100
	}
	out := &dto.EleccionResultadoResponse{
		ProcesoID:         p.ID,
		EstadoProceso:     p.Estado,
		PlanchaGanadoraID: res.PlanchaGanadoraID,
		VotosTotales:      total,
		ParticipacionPct:  participacion,
		Empate:            res.Empate,
		NotaDesempate:     res.NotaDesempate,
		Conteo:            conteo,
	}
	if incluirVotos {
		votos, err := s.repo.ListVotosByProceso(p.ID)
		if err != nil {
			return nil, err
		}
		planchas, _ := s.repo.ListPlanchasByProceso(p.ID, false)
		labelByID := make(map[uint]string, len(planchas))
		for i := range planchas {
			labelByID[planchas[i].ID] = planchaLabel(&planchas[i])
		}
		out.Votos = make([]dto.EleccionVotoAuditoriaItem, len(votos))
		for i := range votos {
			doc := ""
			if votos[i].VotanteAprendiz != nil && votos[i].VotanteAprendiz.Persona != nil {
				doc = votos[i].VotanteAprendiz.Persona.NumeroDocumento
			}
			out.Votos[i] = dto.EleccionVotoAuditoriaItem{
				VotanteNombre: nombreAprendiz(votos[i].VotanteAprendiz),
				VotanteDoc:    doc,
				PlanchaID:     votos[i].PlanchaID,
				PlanchaLabel:  labelByID[votos[i].PlanchaID],
				VotadoAt:      votos[i].UpdatedAt,
			}
		}
	}
	return out, nil
}

func (s *eleccionService) GetResultados(userID uint, roles []string, procesoID uint, incluirVotos bool) (*dto.EleccionResultadoResponse, error) {
	p, _, err := s.loadProcesoScoped(userID, roles, procesoID)
	if err != nil {
		return nil, err
	}
	res, err := s.repo.FindResultadoByProceso(p.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			conteo, total, errC := s.buildConteo(p.ID)
			if errC != nil {
				return nil, errC
			}
			elegibles, _ := s.repo.CountAprendicesActivosByRegional(p.RegionalID)
			participacion := 0.0
			if elegibles > 0 {
				participacion = float64(total) / float64(elegibles) * 100
			}
			empate, _ := detectarEmpate(conteo)
			return &dto.EleccionResultadoResponse{
				ProcesoID:        p.ID,
				EstadoProceso:    p.Estado,
				VotosTotales:     total,
				ParticipacionPct: participacion,
				Empate:           empate,
				Conteo:           conteo,
				Votos:            nil,
			}, nil
		}
		return nil, err
	}
	conteo := decodeDetalleJSON(res.DetalleJSON)
	if len(conteo) == 0 {
		conteo, _, _ = s.buildConteo(p.ID)
	}
	return s.buildResultadoResponse(p, res, conteo, res.VotosTotales, incluirVotos)
}

func (s *eleccionService) ExportResultadosCSV(userID uint, roles []string, procesoID uint) ([]byte, error) {
	res, err := s.GetResultados(userID, roles, procesoID, true)
	if err != nil {
		return nil, err
	}
	var b strings.Builder
	b.WriteString("votante_nombre,votante_documento,plancha_id,plancha_label,votado_at\n")
	for _, v := range res.Votos {
		b.WriteString(fmt.Sprintf("%q,%q,%d,%q,%s\n", v.VotanteNombre, v.VotanteDoc, v.PlanchaID, v.PlanchaLabel, v.VotadoAt.Format(time.RFC3339)))
	}
	b.WriteString("\n# conteo\nplancha_id,label,votos\n")
	for _, c := range res.Conteo {
		b.WriteString(fmt.Sprintf("%d,%q,%d\n", c.PlanchaID, c.Label, c.Votos))
	}
	return []byte(b.String()), nil
}
