package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
)

func TestDetectarEmpateSinVotos(t *testing.T) {
	empate, ganador := detectarEmpate(nil)
	if empate || ganador != nil {
		t.Fatalf("esperaba sin empate ni ganador")
	}
}

func TestDetectarEmpateDosLideres(t *testing.T) {
	conteo := []dto.EleccionResultadoPlanchaConteo{
		{PlanchaID: 1, Votos: 5},
		{PlanchaID: 2, Votos: 5},
	}
	empate, ganador := detectarEmpate(conteo)
	if !empate || ganador != nil {
		t.Fatalf("esperaba empate sin ganador único")
	}
}

func TestDetectarEmpateGanadorUnico(t *testing.T) {
	conteo := []dto.EleccionResultadoPlanchaConteo{
		{PlanchaID: 1, Votos: 7},
		{PlanchaID: 2, Votos: 3},
	}
	empate, ganador := detectarEmpate(conteo)
	if empate || ganador == nil || *ganador != 1 {
		t.Fatalf("esperaba ganador plancha 1")
	}
}

func TestEleccionReglasDocumentadas(t *testing.T) {
	reglas := EleccionReglasDocumentadas()
	if reglas["cambio_voto"] == "" || reglas["alcance"] == "" || reglas["inscripcion_plancha"] == "" {
		t.Fatal("reglas incompletas")
	}
	if EleccionPermiteCambioVoto {
		t.Fatal("cambio de voto debe estar deshabilitado")
	}
}
