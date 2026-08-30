/**
 * services: vigencia de banners publicados.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// BannerVigente indica si el banner publicado cubre el instante dado.
func BannerVigente(b models.PortalBanner, now time.Time) bool {
	return PublicacionVigente(b.EstadoPublicacion, b.VigenteDesde, b.VigenteHasta, now)
}

// PublicacionVigente estado publicado y rango de fechas opcional.
func PublicacionVigente(estado string, desde, hasta *time.Time, now time.Time) bool {
	if estado != models.PortalEstadoPublicado {
		return false
	}
	if desde != nil && now.Before(*desde) {
		return false
	}
	if hasta != nil && now.After(*hasta) {
		return false
	}
	return true
}
