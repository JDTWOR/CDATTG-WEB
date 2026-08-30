/**
 * services: pruebas de mapeo de listados editoriales.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestMapearItemsPropagaError(t *testing.T) {
	out, err := mapearItems([]int{2}, errors.New("x"), func(n int) dto.BiogjgasItem {
		return dto.BiogjgasItem{ID: uint(n)}
	})
	if err == nil || err.Error() != "x" {
		t.Fatalf("err=%v", err)
	}
	if len(out) != 1 || out[0].ID != 2 {
		t.Fatalf("out=%v", out)
	}
}

func TestBannersAItemsOmiteNoVigentesEnPublico(t *testing.T) {
	now := time.Date(2026, 8, 27, 12, 0, 0, 0, time.UTC)
	rows := []models.BiogjgasBanner{
		{Titulo: "ok", EstadoPublicacion: models.PortalEstadoPublicado},
		{Titulo: "borrador", EstadoPublicacion: models.PortalEstadoBorrador},
	}
	pub := bannersAItems(rows, true, now)
	if len(pub) != 1 || pub[0].Titulo != "ok" {
		t.Fatalf("publico=%v", pub)
	}
	admin := bannersAItems(rows, false, now)
	if len(admin) != 2 {
		t.Fatalf("admin=%d", len(admin))
	}
}
