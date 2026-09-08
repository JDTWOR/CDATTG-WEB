/**
 * Agrupo la ficha que el aprendiz elige y el botón crear o renovar.
 * Lo hice para separar regular, media técnica y complementaria.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

const (
	carnetAccionCrear   = "crear"
	carnetAccionRenovar = "renovar"
)

// etiquetaTipoFormacion nombra el grupo de la ficha.
func etiquetaTipoFormacion(tipo string) string {
	switch tipo {
	case models.TipoFormacionComplementaria:
		return "Complementaria"
	case models.TipoFormacionMediaTecnica:
		return "Media técnica"
	default:
		return "Regular"
	}
}

// estadoVisibleCarnet unifica rechazado viejo con devuelto.
func estadoVisibleCarnet(estado string) string {
	if estado == models.CarnetEstadoRechazado {
		return models.CarnetEstadoDevuelto
	}
	return estado
}

// accionCarnet dice si el aprendiz crea o renueva esa ficha.
func accionCarnet(tieneAprobado, datosListos, hayPendiente bool) string {
	if !datosListos || hayPendiente {
		return ""
	}
	if tieneAprobado {
		return carnetAccionRenovar
	}
	return carnetAccionCrear
}

// aplicarEstadosFichas pone estado y botón solo de esa ficha, no de las demás.
func aplicarEstadosFichas(fichas []dto.CarnetFichaOpcion, ultimas map[uint]models.CarnetSolicitud, datosListos bool) {
	for i := range fichas {
		estado := "ninguna"
		if ult, ok := ultimas[fichas[i].ID]; ok {
			estado = estadoVisibleCarnet(ult.Estado)
		}
		fichas[i].EstadoSolicitud = estado
		fichas[i].Accion = accionCarnet(estado == models.CarnetEstadoAprobado, datosListos, estado == models.CarnetEstadoPendiente)
	}
}

// fichaMatriculaVigente busca la ficha elegida entre las matrículas vivas.
func fichaMatriculaVigente(mats []models.Aprendiz, fichaID uint, hoy time.Time) *models.FichaCaracterizacion {
	for i := range mats {
		ficha := mats[i].FichaCaracterizacion
		if ficha == nil || ficha.ID != fichaID || !fichaSirveParaCarnet(ficha, hoy) {
			continue
		}
		return ficha
	}
	return nil
}

// liderTieneFicha dice si el instructor es líder de esa ficha.
func liderTieneFicha(liderFichas []uint, fichaID uint) bool {
	for _, id := range liderFichas {
		if id == fichaID {
			return true
		}
	}
	return false
}

func fichaTieneLider(ficha *models.FichaCaracterizacion) bool {
	return ficha != nil && ficha.InstructorID != nil && *ficha.InstructorID != 0
}

func tablaCarnetAusente(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "carnet_solicitudes") && strings.Contains(msg, "does not exist")
}
