// @module vigilancia_acceso_vigencia
// @description Tests de las reglas de vigencia de roles en portería (aprendiz por ficha, instructor por contrato).
// @author JDTWOR
// @created 2026-08-15
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func ptrTime(y int, m time.Month, d int, hm ...int) *time.Time {
	h, mi := 0, 0
	if len(hm) > 0 {
		h = hm[0]
	}
	if len(hm) > 1 {
		mi = hm[1]
	}
	t := time.Date(y, m, d, h, mi, 0, 0, time.UTC)
	return &t
}

func fichaConID(id uint, status bool) models.FichaCaracterizacion {
	var f models.FichaCaracterizacion
	f.ID = id
	f.Status = status
	return f
}

func fichaActiva() models.FichaCaracterizacion {
	f := fichaConID(1, true)
	f.Ficha = "2520001"
	f.FechaInicio = ptrTime(2026, 1, 1)
	f.FechaFin = ptrTime(2026, 12, 31)
	return f
}

func withVigenciaFechasActiva(t *testing.T) func() {
	t.Helper()
	prev := config.AppConfig
	config.AppConfig = &config.Config{Negocio: config.NegocioConfig{IgnorarVigenciaFicha: false}}
	return func() { config.AppConfig = prev }
}

func TestInstructorVigenteParaAcceso(t *testing.T) {
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)
	instOK := func() *models.Instructor {
		return &models.Instructor{
			Status:              true,
			FechaInicioContrato: ptrTime(2026, 1, 1),
			FechaFinContrato:    ptrTime(2027, 6, 30),
		}
	}
	cases := []struct {
		name string
		inst *models.Instructor
		want bool
	}{
		{"nulo no es vigente", nil, false},
		{"status inactivo no es vigente", &models.Instructor{Status: false}, false},
		{"sin fechas de contrato es vigente", &models.Instructor{Status: true}, true},
		{"contrato dentro de rango es vigente", instOK(), true},
		{"contrato que termina hoy sigue vigente", func() *models.Instructor {
			i := instOK()
			i.FechaFinContrato = ptrTime(2026, 8, 15, 0, 0)
			return i
		}(), true},
		{"contrato vencido ayer no es vigente", func() *models.Instructor {
			i := instOK()
			i.FechaFinContrato = ptrTime(2026, 8, 14, 23, 59)
			return i
		}(), false},
		{"contrato que inicia manana no es vigente", func() *models.Instructor {
			i := instOK()
			i.FechaInicioContrato = ptrTime(2026, 8, 16, 0, 0)
			return i
		}(), false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := instructorVigenteParaAcceso(c.inst, hoy); got != c.want {
				t.Fatalf("got=%v want=%v", got, c.want)
			}
		})
	}
}

func TestFichaVigenteParaAcceso(t *testing.T) {
	restore := withVigenciaFechasActiva(t)
	defer restore()
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)

	cases := []struct {
		name  string
		ficha *models.FichaCaracterizacion
		want  bool
	}{
		{"ficha nula no es vigente", nil, false},
		{"ficha inactiva no es vigente", func() *models.FichaCaracterizacion {
			f := fichaConID(2, false)
			return &f
		}(), false},
		{"ficha activa sin fechas es vigente", func() *models.FichaCaracterizacion {
			f := fichaConID(3, true)
			return &f
		}(), true},
		{"ficha activa dentro de rango es vigente", func() *models.FichaCaracterizacion {
			f := fichaActiva()
			return &f
		}(), true},
		{"ficha vencida no es vigente", func() *models.FichaCaracterizacion {
			f := fichaActiva()
			f.FechaFin = ptrTime(2026, 7, 14)
			return &f
		}(), false},
		{"ficha que aun no inicia no es vigente", func() *models.FichaCaracterizacion {
			f := fichaActiva()
			f.FechaInicio = ptrTime(2026, 9, 1)
			return &f
		}(), false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := fichaVigenteParaAcceso(c.ficha, hoy); got != c.want {
				t.Fatalf("got=%v want=%v", got, c.want)
			}
		})
	}
}

func TestFichaVigenteParaAcceso_IgnoraFechasPorConfig(t *testing.T) {
	prev := config.AppConfig
	config.AppConfig = &config.Config{Negocio: config.NegocioConfig{IgnorarVigenciaFicha: true}}
	defer func() { config.AppConfig = prev }()
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)
	ficha := func() *models.FichaCaracterizacion {
		f := fichaActiva()
		f.FechaFin = ptrTime(2026, 7, 14)
		return &f
	}()
	if got := fichaVigenteParaAcceso(ficha, hoy); !got {
		t.Fatalf("con IgnorarVigenciaFicha=true (config por defecto) la ficha vencida sigue contando, got=%v", got)
	}
	inactiva := func() *models.FichaCaracterizacion {
		f := fichaConID(2, false)
		return &f
	}()
	if got := fichaVigenteParaAcceso(inactiva, hoy); got {
		t.Fatal("status=false nunca debe ser vigente, aunque la config ignore fechas")
	}
}

func TestHayMatriculaConFichaVigente(t *testing.T) {
	restore := withVigenciaFechasActiva(t)
	defer restore()
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)

	fichas := map[uint]*models.FichaCaracterizacion{}
	cargarFicha := func(id uint) *models.FichaCaracterizacion { return fichas[id] }
	matricula := func(fichaID uint, ficha *models.FichaCaracterizacion) models.Aprendiz {
		if fichaID > 0 {
			fichas[fichaID] = ficha
		}
		return models.Aprendiz{FichaCaracterizacionID: fichaID, FichaCaracterizacion: ficha}
	}

	cases := []struct {
		name    string
		activos []models.Aprendiz
		want    bool
	}{
		{"sin matriculas no es aprendiz", nil, false},
		{"matricula sin ficha no cuenta", []models.Aprendiz{matricula(0, nil)}, false},
		{"ficha cargada por id y vigente cuenta", func() []models.Aprendiz {
			f := fichaActiva()
			fichas[1] = &f
			return []models.Aprendiz{{FichaCaracterizacionID: 1}}
		}(), true},
		{"ficha inactiva no cuenta", func() []models.Aprendiz {
			f := fichaConID(2, false)
			return []models.Aprendiz{matricula(2, &f)}
		}(), false},
		{"ficha vencida no cuenta", func() []models.Aprendiz {
			f := fichaActiva()
			f.FechaFin = ptrTime(2026, 7, 14)
			return []models.Aprendiz{matricula(3, &f)}
		}(), false},
		{"al menos una vigente cuenta", func() []models.Aprendiz {
			f1 := fichaConID(4, false)
			f2 := fichaActiva()
			return []models.Aprendiz{matricula(4, &f1), matricula(5, &f2)}
		}(), true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := hayMatriculaConFichaVigente(c.activos, hoy, cargarFicha); got != c.want {
				t.Fatalf("got=%v want=%v", got, c.want)
			}
		})
	}
}

func TestFichasVigentesDeMatriculas_DedupYDescartaInactivas(t *testing.T) {
	restore := withVigenciaFechasActiva(t)
	defer restore()
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)

	fichas := map[uint]*models.FichaCaracterizacion{}
	cargarFicha := func(id uint) *models.FichaCaracterizacion { return fichas[id] }
	f1 := fichaActiva()
	f1.ID = 1
	f2 := fichaConID(2, false)
	f2.Ficha = "B"
	fichas[1] = &f1
	fichas[2] = &f2
	fichas[3] = nil

	activos := []models.Aprendiz{
		{FichaCaracterizacionID: 1, FichaCaracterizacion: nil},
		{FichaCaracterizacionID: 1, FichaCaracterizacion: &f1},
		{FichaCaracterizacionID: 2, FichaCaracterizacion: &f2},
		{FichaCaracterizacionID: 3, FichaCaracterizacion: nil},
		{FichaCaracterizacionID: 0, FichaCaracterizacion: nil},
	}
	got := fichasVigentesDeMatriculas(activos, hoy, cargarFicha)
	if len(got) != 1 || got[0].ID != 1 {
		t.Fatalf("esperaba solo la ficha 1 deduplicada, got=%+v", got)
	}
	var _ dto.AccesoFichaResumen = got[0]
}

func TestFichaDeMatricula(t *testing.T) {
	f := fichaActiva()
	cargar := func(id uint) *models.FichaCaracterizacion {
		if id == 9 {
			return &f
		}
		return nil
	}
	cases := []struct {
		name string
		a    models.Aprendiz
		want bool
	}{
		{"con ficha precargada la devuelve directo", models.Aprendiz{FichaCaracterizacionID: 1, FichaCaracterizacion: &f}, true},
		{"sin preload la carga por id", models.Aprendiz{FichaCaracterizacionID: 9}, true},
		{"id inexistente devuelve nil", models.Aprendiz{FichaCaracterizacionID: 8}, false},
		{"sin ficha ni id devuelve nil", models.Aprendiz{}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := fichaDeMatricula(&c.a, cargar)
			if (got != nil) != c.want {
				t.Fatalf("got=%v want presencia=%v", got, c.want)
			}
		})
	}
}

func TestCalcularEstadoFicha(t *testing.T) {
	hoy := time.Date(2026, 8, 15, 8, 0, 0, 0, time.Local)
	ficha := func() *models.FichaCaracterizacion {
		f := fichaConID(1, true)
		f.FechaInicio = ptrTime(2026, 1, 1)
		f.FechaFin = ptrTime(2026, 12, 31)
		return &f
	}
	cases := []struct {
		name string
		f    *models.FichaCaracterizacion
		want bool
	}{
		{"nula se considera activa", nil, true},
		{"override manual true se respeta", func() *models.FichaCaracterizacion {
			f := ficha()
			f.StatusManual = ptrBool(true)
			return f
		}(), true},
		{"override manual false se respeta aun vigente", func() *models.FichaCaracterizacion {
			f := ficha()
			f.StatusManual = ptrBool(false)
			return f
		}(), false},
		{"sin fechas ni override activa", func() *models.FichaCaracterizacion {
			f := fichaConID(2, true)
			return &f
		}(), true},
		{"dentro de rango activa", ficha(), true},
		{"fecha fin vencida inactiva", func() *models.FichaCaracterizacion {
			f := ficha()
			f.FechaFin = ptrTime(2026, 8, 14, 23, 59)
			return f
		}(), false},
		{"fecha fin hoy mismo activa", func() *models.FichaCaracterizacion {
			f := ficha()
			f.FechaFin = ptrTime(2026, 8, 15, 0, 0)
			return f
		}(), true},
		{"fecha inicio futura inactiva", func() *models.FichaCaracterizacion {
			f := ficha()
			f.FechaInicio = ptrTime(2026, 8, 16)
			return f
		}(), false},
		{"fecha inicio hoy activa", func() *models.FichaCaracterizacion {
			f := ficha()
			f.FechaInicio = ptrTime(2026, 8, 15)
			return f
		}(), true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := calcularEstadoFicha(c.f, hoy); got != c.want {
				t.Fatalf("got=%v want=%v", got, c.want)
			}
		})
	}
}