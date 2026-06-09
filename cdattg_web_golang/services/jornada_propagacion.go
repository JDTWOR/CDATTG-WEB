package services

import (
	"fmt"
	"sort"
	"strconv"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// PropagarPlantillaAFichas reemplaza bloques vinculados a la plantilla en fichas existentes.
// oldPlantilla: bloques anteriores al cambio (para detectar filas legacy sin jornada_id).
func PropagarPlantillaAFichas(
	fichaDiasRepo repositories.FichaDiasRepository,
	fichaIDs []uint,
	jornadaID uint,
	newPlantilla []models.JornadaBloque,
	oldPlantilla []models.JornadaBloque,
) dto.JornadaPropagateResult {
	result := dto.JornadaPropagateResult{}
	nuevos := plantillaToFichaInputs(jornadaID, newPlantilla)

	for _, fichaID := range fichaIDs {
		actual, err := fichaDiasRepo.FindByFichaID(fichaID)
		if err != nil {
			result.Omitidas++
			result.Detalles = append(result.Detalles, dto.JornadaPropagateDetalle{
				FichaID: fichaID,
				Motivo:  fmt.Sprintf("error al leer bloques: %v", err),
			})
			continue
		}
		if len(actual) == 0 {
			continue
		}

		merged := mergePropagacionBloques(actual, jornadaID, nuevos, oldPlantilla)
		if !programacionCambio(actual, merged) {
			continue
		}
		if err := ValidarHorariosSinSolape(fichaInputsToHorario(merged)); err != nil {
			result.Omitidas++
			result.Detalles = append(result.Detalles, dto.JornadaPropagateDetalle{
				FichaID: fichaID,
				Motivo:  err.Error(),
			})
			continue
		}
		if err := fichaDiasRepo.ReplaceByFichaIDWithHorarios(fichaID, merged); err != nil {
			result.Omitidas++
			result.Detalles = append(result.Detalles, dto.JornadaPropagateDetalle{
				FichaID: fichaID,
				Motivo:  fmt.Sprintf("error al guardar: %v", err),
			})
			continue
		}
		result.Actualizadas++
	}
	return result
}

func plantillaToFichaInputs(jornadaID uint, bloques []models.JornadaBloque) []repositories.FichaDiaInput {
	jid := jornadaID
	out := make([]repositories.FichaDiaInput, 0, len(bloques))
	for _, b := range bloques {
		out = append(out, repositories.FichaDiaInput{
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     normalizeHoraMM(b.HoraInicio),
			HoraFin:        normalizeHoraMM(b.HoraFin),
			Orden:          b.Orden,
			JornadaID:      &jid,
		})
	}
	return out
}

func mergePropagacionBloques(
	actual []models.FichaDiasFormacion,
	jornadaID uint,
	nuevos []repositories.FichaDiaInput,
	oldPlantilla []models.JornadaBloque,
) []repositories.FichaDiaInput {
	kept := make([]repositories.FichaDiaInput, 0, len(actual))
	for _, fd := range actual {
		if debeReemplazarBloqueFicha(fd, jornadaID, oldPlantilla) {
			continue
		}
		kept = append(kept, fichaDiaModelToInput(fd))
	}
	return append(kept, nuevos...)
}

func debeReemplazarBloqueFicha(fd models.FichaDiasFormacion, jornadaID uint, oldPlantilla []models.JornadaBloque) bool {
	if fd.JornadaID != nil {
		return *fd.JornadaID == jornadaID
	}
	if len(oldPlantilla) == 0 {
		return false
	}
	return bloqueFichaCoincidePlantilla(fd, oldPlantilla)
}

func bloqueFichaCoincidePlantilla(fd models.FichaDiasFormacion, plantilla []models.JornadaBloque) bool {
	hi := normalizeHoraMM(fd.HoraInicio)
	hf := normalizeHoraMM(fd.HoraFin)
	for _, p := range plantilla {
		if p.DiaFormacionID == fd.DiaFormacionID &&
			normalizeHoraMM(p.HoraInicio) == hi &&
			normalizeHoraMM(p.HoraFin) == hf {
			return true
		}
	}
	return false
}

func fichaDiaModelToInput(fd models.FichaDiasFormacion) repositories.FichaDiaInput {
	return repositories.FichaDiaInput{
		DiaFormacionID: fd.DiaFormacionID,
		HoraInicio:     normalizeHoraMM(fd.HoraInicio),
		HoraFin:        normalizeHoraMM(fd.HoraFin),
		Orden:          fd.Orden,
		JornadaID:      fd.JornadaID,
	}
}

func fichaInputsToHorario(inputs []repositories.FichaDiaInput) []HorarioBloqueInput {
	out := make([]HorarioBloqueInput, len(inputs))
	for i, in := range inputs {
		out[i] = HorarioBloqueInput{
			DiaFormacionID: in.DiaFormacionID,
			HoraInicio:     in.HoraInicio,
			HoraFin:        in.HoraFin,
			Orden:          in.Orden,
			JornadaID:      in.JornadaID,
		}
	}
	return out
}

func programacionCambio(actual []models.FichaDiasFormacion, merged []repositories.FichaDiaInput) bool {
	return bloqueKeysActual(actual) != bloqueKeysMerged(merged)
}

func bloqueKeysActual(actual []models.FichaDiasFormacion) string {
	keys := make([]string, 0, len(actual))
	for _, fd := range actual {
		jid := "0"
		if fd.JornadaID != nil {
			jid = strconv.FormatUint(uint64(*fd.JornadaID), 10)
		}
		keys = append(keys, fmt.Sprintf("%d|%s|%s|%d|%s",
			fd.DiaFormacionID, normalizeHoraMM(fd.HoraInicio), normalizeHoraMM(fd.HoraFin), fd.Orden, jid))
	}
	sort.Strings(keys)
	return stringsJoin(keys)
}

func bloqueKeysMerged(merged []repositories.FichaDiaInput) string {
	keys := make([]string, 0, len(merged))
	for _, m := range merged {
		jid := "0"
		if m.JornadaID != nil {
			jid = strconv.FormatUint(uint64(*m.JornadaID), 10)
		}
		keys = append(keys, fmt.Sprintf("%d|%s|%s|%d|%s",
			m.DiaFormacionID, normalizeHoraMM(m.HoraInicio), normalizeHoraMM(m.HoraFin), m.Orden, jid))
	}
	sort.Strings(keys)
	return stringsJoin(keys)
}

func stringsJoin(keys []string) string {
	if len(keys) == 0 {
		return ""
	}
	out := keys[0]
	for i := 1; i < len(keys); i++ {
		out += ";" + keys[i]
	}
	return out
}
