/**
 * services: pruebas de vigencia de banners.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestBannerVigente(t *testing.T) {
	now := time.Date(2026, 8, 26, 12, 0, 0, 0, time.UTC)
	ayer := now.Add(-24 * time.Hour)
	manana := now.Add(24 * time.Hour)
	borrador := models.PortalBanner{EstadoPublicacion: models.PortalEstadoBorrador}
	if BannerVigente(borrador, now) {
		t.Fatal("borrador no es vigente")
	}
	ok := models.PortalBanner{EstadoPublicacion: models.PortalEstadoPublicado, VigenteDesde: &ayer, VigenteHasta: &manana}
	if !BannerVigente(ok, now) {
		t.Fatal("debería estar vigente")
	}
	fuera := models.PortalBanner{EstadoPublicacion: models.PortalEstadoPublicado, VigenteHasta: &ayer}
	if BannerVigente(fuera, now) {
		t.Fatal("ya venció")
	}
}
