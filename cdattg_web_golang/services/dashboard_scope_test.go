package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestFichaEnSedes(t *testing.T) {
	sedeID := uint(10)
	if !fichaEnSedes(&sedeID, []uint{10, 20}) {
		t.Fatal("expected ficha in sedes")
	}
	if fichaEnSedes(&sedeID, []uint{20}) {
		t.Fatal("expected ficha not in sedes")
	}
	if !fichaEnSedes(nil, nil) {
		t.Fatal("nil sede filter should allow all")
	}
}

func TestFiltrarFichasPorSedes(t *testing.T) {
	s1 := uint(1)
	s2 := uint(2)
	fichas := []models.FichaCaracterizacion{
		{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 1}}, SedeID: &s1},
		{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 2}}, SedeID: &s2},
	}
	out := filtrarFichasPorSedes(fichas, []uint{1})
	if len(out) != 1 || out[0].ID != 1 {
		t.Fatalf("expected one ficha, got %+v", out)
	}
}

func TestResolveEffectiveSedes_CoordinadorVacio(t *testing.T) {
	svc := NewDashboardScopeService()
	_, empty := svc.ResolveEffectiveSedes(&DashboardScope{Empty: true}, nil, nil)
	if !empty {
		t.Fatal("expected empty flag")
	}
}

func TestResolveEffectiveSedes_CoordinadorFiltraSedeAjena(t *testing.T) {
	svc := NewDashboardScopeService()
	sede := uint(99)
	ids, empty := svc.ResolveEffectiveSedes(&DashboardScope{
		Restricted: true,
		SedeIDs:    []uint{10, 11},
	}, nil, &sede)
	if empty || len(ids) != 0 {
		t.Fatalf("sede ajena debe quedar sin datos, got ids=%v empty=%v", ids, empty)
	}
}

func TestHasRole(t *testing.T) {
	if !hasRole([]string{"COORDINADOR"}, "COORDINADOR") {
		t.Fatal("expected role match")
	}
}
