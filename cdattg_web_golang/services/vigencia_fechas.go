// @module vigencia_fechas
// @description Comparación de fechas de vigencia por día calendario (evita desfases de zona horaria).
// @author JDTWOR
// @created 2026-08-15
package services

import "time"

// fechaFinVencida true si la fecha fin ya pasó (por día calendario en la TZ local, igual que
// fecha_fin::date < CURRENT_DATE en BD: el propio día de fecha_fin la ficha sigue activa).
func fechaFinVencida(fin *time.Time, hoy time.Time) bool {
	if fin == nil {
		return false
	}
	return fin.In(hoy.Location()).Format(time.DateOnly) < hoy.Format(time.DateOnly)
}

// fechaInicioFutura true si la fecha inicio aún no ha llegado (por día calendario).
func fechaInicioFutura(inicio *time.Time, hoy time.Time) bool {
	if inicio == nil {
		return false
	}
	return inicio.In(hoy.Location()).Format(time.DateOnly) > hoy.Format(time.DateOnly)
}
