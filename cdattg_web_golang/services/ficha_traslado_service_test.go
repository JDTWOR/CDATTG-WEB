package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestTrasladarDiaInstructor_ValidaMismoInstructorYMismoDia(t *testing.T) {
	svc := &fichaService{}
	err := svc.TrasladarDiaInstructor(1, 99, dto.TrasladarDiaRequest{
		Modo:                TrasladoModoPermanente,
		InstructorOrigenID:  10,
		DiaOrigenID:         4,
		InstructorDestinoID: 10,
		DiaDestinoID:        4,
		Motivo:              "prueba",
	})
	if err == nil {
		t.Fatal("esperaba error de validación por mismo instructor y día")
	}
}

func TestRemoveDia(t *testing.T) {
	got := removeDia([]uint{1, 2, 3, 2}, 2)
	if len(got) != 2 || got[0] != 1 || got[1] != 3 {
		t.Fatalf("removeDia resultado inesperado: %#v", got)
	}
}

func TestAddDia(t *testing.T) {
	got := addDia([]uint{1, 2}, 3)
	if len(got) != 3 || got[2] != 3 {
		t.Fatalf("addDia debe agregar el día cuando no existe, got=%#v", got)
	}
	got = addDia([]uint{1, 2}, 2)
	if len(got) != 2 {
		t.Fatalf("addDia no debe duplicar días, got=%#v", got)
	}
}

func TestUniqueDiaIDsFromRecords(t *testing.T) {
	rows := []models.InstructorFichaDias{
		{DiaFormacionID: 1},
		{DiaFormacionID: 2},
		{DiaFormacionID: 1},
		{DiaFormacionID: 0},
	}
	got := uniqueDiaIDsFromRecords(rows)
	if len(got) != 2 {
		t.Fatalf("esperaba 2 días únicos, got=%#v", got)
	}
}

func TestValidarParesFechasTraslado_RechazaFechaPasada(t *testing.T) {
	hoy := time.Now()
	ayer := hoy.AddDate(0, 0, -1)
	_, err := validarParesFechasTraslado(dto.TrasladarDiaRequest{
		DiaOrigenID:  3,
		DiaDestinoID: 5,
		Motivo:       "prueba",
		ParesFechas: []dto.TrasladoParFecha{{
			FechaOrigen:  ayer.Format(time.DateOnly),
			FechaDestino: hoy.Format(time.DateOnly),
		}},
	})
	if err == nil {
		t.Fatal("esperaba error por fecha pasada")
	}
}

func TestValidarParesFechasTraslado_RechazaDiaSemanaIncorrecto(t *testing.T) {
	// Buscar próximo miércoles
	d := time.Now()
	for WeekdayToDiaFormacionID(d.Weekday()) != 3 {
		d = d.AddDate(0, 0, 1)
	}
	_, err := validarParesFechasTraslado(dto.TrasladarDiaRequest{
		DiaOrigenID:  5, // viernes pero fecha es miércoles
		DiaDestinoID: 3,
		Motivo:       "prueba",
		ParesFechas: []dto.TrasladoParFecha{{
			FechaOrigen:  d.Format(time.DateOnly),
			FechaDestino: d.AddDate(0, 0, 2).Format(time.DateOnly),
		}},
	})
	if err == nil {
		t.Fatal("esperaba error por día de semana incorrecto")
	}
}

func TestFechaCalendario_AlineaUTCDePostgresConLocal(t *testing.T) {
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		t.Fatal(err)
	}
	fromDB := time.Date(2026, 6, 17, 0, 0, 0, 0, time.UTC)
	loopDay := time.Date(2026, 6, 17, 0, 0, 0, 0, loc)
	if !fechaCalendario(fromDB).Equal(fechaCalendario(loopDay)) {
		t.Fatalf("misma fecha civil debe coincidir: db=%v loop=%v", fechaCalendario(fromDB), fechaCalendario(loopDay))
	}
}

func TestInstructorCedeSesionTraslado_FechaUTCEnBD(t *testing.T) {
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		t.Fatal(err)
	}
	traslados := []models.InstructorFichaTrasladoFecha{{
		InstructorOrigenID:  69,
		InstructorDestinoID: 74,
		DiaOrigenID:         3,
		DiaDestinoID:        5,
		FechaOrigen:         time.Date(2026, 6, 17, 0, 0, 0, 0, time.UTC),
		FechaDestino:        time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC),
	}}
	diaOrigen := time.Date(2026, 6, 17, 0, 0, 0, 0, loc)
	if !instructorCedeSesionTraslado(traslados, 69, diaOrigen) {
		t.Fatal("origen debe ceder el miércoles 2026-06-17")
	}
	if !instructorSesionPrestadaTrasladoMatch(traslados, 74, diaOrigen, 3) {
		t.Fatal("destino debe recibir sesión del día origen el 2026-06-17")
	}
	diaDestino := time.Date(2026, 6, 19, 0, 0, 0, 0, loc)
	if !instructorCedeSesionTraslado(traslados, 74, diaDestino) {
		t.Fatal("destino debe ceder el viernes 2026-06-19")
	}
	if !instructorSesionPrestadaTrasladoMatch(traslados, 69, diaDestino, 5) {
		t.Fatal("origen debe recibir sesión del día destino el 2026-06-19")
	}
}

func instructorSesionPrestadaTrasladoMatch(
	traslados []models.InstructorFichaTrasladoFecha,
	instructorID uint,
	fecha time.Time,
	wantDia uint,
) bool {
	dia, ok := instructorSesionPrestadaTraslado(traslados, instructorID, fecha)
	return ok && dia == wantDia
}

func TestRangeVigenciaAsignacion(t *testing.T) {
	inicio := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	i, f := rangeVigenciaAsignacion(&models.InstructorFichaCaracterizacion{
		FechaInicio: &inicio,
		FechaFin:    &fin,
	})
	if !i.Equal(inicio) || !f.Equal(fin) {
		t.Fatalf("vigencia inesperada: inicio=%v fin=%v", i, f)
	}
}

