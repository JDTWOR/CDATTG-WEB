// @module vigencia_sync
// @description Control de frecuencia para las sincronizaciones de vigencia (fichas e instructores).
// @author Cristian Deysdayr Jiménez
// @created 2026-08-15
package repositories

import "time"

// intervaloSyncVigencia evita correr los UPDATEs masivos de vigencia en cada petición (portería y formación).
const intervaloSyncVigencia = 60 * time.Second

// sincronizacionVigenciaPermitida devuelve true si ya pasó el intervalo desde la última corrida.
func sincronizacionVigenciaPermitida(ultima, ahora time.Time, intervalo time.Duration) bool {
	return ahora.Sub(ultima) >= intervalo
}
