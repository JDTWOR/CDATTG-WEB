package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type stubFichaDiasPropagacion struct {
	byFicha map[uint][]models.FichaDiasFormacion
	saved   map[uint][]repositories.FichaDiaInput
}

func (s *stubFichaDiasPropagacion) ReplaceByFichaID(uint, []uint) error { return nil }
func (s *stubFichaDiasPropagacion) FindDistinctFichaIDsReferencingJornada(uint) ([]uint, error) {
	return nil, nil
}

func (s *stubFichaDiasPropagacion) FindByFichaID(fichaID uint) ([]models.FichaDiasFormacion, error) {
	return s.byFicha[fichaID], nil
}

func (s *stubFichaDiasPropagacion) ReplaceByFichaIDWithHorarios(fichaID uint, dias []repositories.FichaDiaInput) error {
	if s.saved == nil {
		s.saved = make(map[uint][]repositories.FichaDiaInput)
	}
	s.saved[fichaID] = dias
	return nil
}

func TestPropagarPlantillaAFichas_nocheMasSabadoCustom(t *testing.T) {
	jornadaNoche := uint(3)
	oldNoche := []models.JornadaBloque{
		{DiaFormacionID: 1, HoraInicio: "18:00", HoraFin: "23:00"},
		{DiaFormacionID: 2, HoraInicio: "18:00", HoraFin: "23:00"},
	}
	newNoche := []models.JornadaBloque{
		{DiaFormacionID: 1, HoraInicio: "18:30", HoraFin: "23:00"},
		{DiaFormacionID: 2, HoraInicio: "18:30", HoraFin: "23:00"},
	}
	repo := &stubFichaDiasPropagacion{
		byFicha: map[uint][]models.FichaDiasFormacion{
			17: {
				{DiaFormacionID: 1, HoraInicio: "18:00", HoraFin: "23:00", JornadaID: &jornadaNoche},
				{DiaFormacionID: 6, HoraInicio: "15:00", HoraFin: "19:00"},
			},
		},
	}
	result := PropagarPlantillaAFichas(repo, []uint{17}, jornadaNoche, newNoche, oldNoche)
	if result.Actualizadas != 1 {
		t.Fatalf("esperaba 1 ficha actualizada, got %+v", result)
	}
	saved := repo.saved[17]
	if len(saved) != 3 {
		t.Fatalf("esperaba 3 bloques (2 noche + sábado), got %d", len(saved))
	}
	var sabado *repositories.FichaDiaInput
	for i := range saved {
		if saved[i].DiaFormacionID == 6 {
			sabado = &saved[i]
		}
		if saved[i].DiaFormacionID == 1 && saved[i].HoraInicio != "18:30" {
			t.Fatalf("bloque lunes debería actualizarse a 18:30, got %s", saved[i].HoraInicio)
		}
	}
	if sabado == nil || sabado.HoraInicio != "15:00" {
		t.Fatal("bloque sábado custom debe conservarse")
	}
}

func TestPropagarPlantillaAFichas_legacySinJornadaID(t *testing.T) {
	jid := uint(2)
	old := []models.JornadaBloque{{DiaFormacionID: 1, HoraInicio: "13:00", HoraFin: "18:00"}}
	newB := []models.JornadaBloque{{DiaFormacionID: 1, HoraInicio: "13:30", HoraFin: "18:00"}}
	repo := &stubFichaDiasPropagacion{
		byFicha: map[uint][]models.FichaDiasFormacion{
			5: {{DiaFormacionID: 1, HoraInicio: "13:00", HoraFin: "18:00"}},
		},
	}
	result := PropagarPlantillaAFichas(repo, []uint{5}, jid, newB, old)
	if result.Actualizadas != 1 {
		t.Fatalf("legacy debería actualizarse, got %+v", result)
	}
	if repo.saved[5][0].JornadaID == nil || *repo.saved[5][0].JornadaID != jid {
		t.Fatal("bloque legacy debe quedar vinculado a plantilla")
	}
}

func TestPropagarPlantillaAFichas_omiteSiSolapa(t *testing.T) {
	jid := uint(1)
	old := []models.JornadaBloque{{DiaFormacionID: 1, HoraInicio: "06:30", HoraFin: "13:00"}}
	newB := []models.JornadaBloque{{DiaFormacionID: 1, HoraInicio: "10:00", HoraFin: "14:00"}}
	repo := &stubFichaDiasPropagacion{
		byFicha: map[uint][]models.FichaDiasFormacion{
			9: {
				{DiaFormacionID: 1, HoraInicio: "06:30", HoraFin: "13:00", JornadaID: &jid},
				{DiaFormacionID: 1, HoraInicio: "11:00", HoraFin: "12:00"},
			},
		},
	}
	result := PropagarPlantillaAFichas(repo, []uint{9}, jid, newB, old)
	if result.Omitidas != 1 {
		t.Fatalf("esperaba omitir por solape, got %+v", result)
	}
	if repo.saved[9] != nil {
		t.Fatal("no debería guardar ficha con solape")
	}
}
