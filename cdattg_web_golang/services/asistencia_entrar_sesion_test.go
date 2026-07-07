package services

import (
	"strings"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type stubAsistenciaRepoEntrar struct {
	sesionHoy       *models.Asistencia
	created         *models.Asistencia
	createCount     int
	lastCreatedIFID uint
}

func (s *stubAsistenciaRepoEntrar) Create(a *models.Asistencia) error {
	s.createCount++
	s.lastCreatedIFID = a.InstructorFichaID
	a.ID = 99
	s.created = a
	return nil
}
func (s *stubAsistenciaRepoEntrar) FindByID(id uint) (*models.Asistencia, error) {
	if s.created != nil && s.created.ID == id {
		return s.created, nil
	}
	if s.sesionHoy != nil && s.sesionHoy.ID == id {
		return s.sesionHoy, nil
	}
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindByInstructorFichaID(uint) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindActivaByInstructorFichaID(uint) (*models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindByInstructorFichaIDAndFecha(instructorFichaID uint, fecha time.Time) (*models.Asistencia, error) {
	if s.sesionHoy != nil && s.sesionHoy.InstructorFichaID == instructorFichaID && esSesionDeHoy(s.sesionHoy.Fecha) {
		return s.sesionHoy, nil
	}
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindActivaByFichaID(uint) (*models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindByFichaIDAndFechas(uint, string, string) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) FindIDsByFichaIDAndFecha(uint, string) ([]uint, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) Update(*models.Asistencia) error { return nil }
func (s *stubAsistenciaRepoEntrar) GetDashboardResumen(*uint, string) (int, []repositories.DashboardFichaRow, error) {
	return 0, nil, nil
}
func (s *stubAsistenciaRepoEntrar) GetFichasSinSesionHoy(*uint, string) ([]repositories.DashboardFichaSinSesionRow, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) CountPendientesRevisionByFecha(*uint, string) (int, error) {
	return 0, nil
}
func (s *stubAsistenciaRepoEntrar) ListSesionesCasosBienestarEnRango(*uint, string, string) ([]repositories.SesionCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListAprendicesActivosCasosBienestar(*uint) ([]repositories.AprendizCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListAsistenciasEfectivasEnSesiones([]uint) ([]repositories.AsistenciaEfectivaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListInasistenciasJustificadasEnSesiones([]uint) ([]repositories.InasistenciaJustificadaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListDetalleSesionesCasosBienestar(string, uint, string, string, string) ([]repositories.DetalleSesionCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListSesionesSinAsistenciaTomadaEnRango([]uint, string, string) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListAsignacionesInstructorFichaActivas([]uint) ([]repositories.AsignacionInstructorFichaReporteRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) ListClavesSesionInstructorFichaEnRango([]uint, string, string) ([]repositories.ClaveSesionInstructorFichaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) MinFechaAsistencia(*uint) (time.Time, bool, error) {
	return time.Time{}, false, nil
}
func (s *stubAsistenciaRepoEntrar) FindSesionesNoFinalizadasDesde(string) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoEntrar) GetPendientesRevisionPorInstructor(*uint, string, string) ([]repositories.PendienteInstructorRow, error) {
	return nil, nil
}

type stubInstFichaRepoEntrar struct {
	ifc *models.InstructorFichaCaracterizacion
}

func (s *stubInstFichaRepoEntrar) FindByID(id uint) (*models.InstructorFichaCaracterizacion, error) {
	if s.ifc != nil && s.ifc.ID == id {
		return s.ifc, nil
	}
	return s.ifc, nil
}
func (s *stubInstFichaRepoEntrar) FindByFichaID(uint) ([]models.InstructorFichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubInstFichaRepoEntrar) FindByFichaIDAndInstructorID(_, _ uint) (*models.InstructorFichaCaracterizacion, error) {
	return s.ifc, nil
}
func (s *stubInstFichaRepoEntrar) FindByInstructorID(uint) ([]models.InstructorFichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubInstFichaRepoEntrar) CountActiveFichasByInstructorID(uint) (int, error) { return 0, nil }
func (s *stubInstFichaRepoEntrar) Create(*models.InstructorFichaCaracterizacion) error  { return nil }
func (s *stubInstFichaRepoEntrar) Update(*models.InstructorFichaCaracterizacion) error  { return nil }
func (s *stubInstFichaRepoEntrar) Delete(uint) error                                     { return nil }
func (s *stubInstFichaRepoEntrar) DeleteByFichaIDAndInstructorID(_, _ uint) error      { return nil }

type stubEvidenciaRepoEntrar struct{}

func (s *stubEvidenciaRepoEntrar) Create(ev *models.Evidencia) error {
	ev.ID = 1
	return nil
}
func (s *stubEvidenciaRepoEntrar) FindByID(uint) (*models.Evidencia, error) { return nil, nil }
func (s *stubEvidenciaRepoEntrar) Update(*models.Evidencia) error         { return nil }

func testAsistenciaServiceEntrar(repo *stubAsistenciaRepoEntrar, ifc *models.InstructorFichaCaracterizacion) *asistenciaService {
	setRelaxarRestriccionAsistenciaForTest(true)
	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.Local)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.Local)
	ficha := &models.FichaCaracterizacion{
		UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: ifc.FichaID}},
		Ficha:          "3406451",
		Status:         true,
		FechaInicio:    &inicio,
		FechaFin:       &fin,
	}
	ifc.Ficha = ficha
	calendarioSvc := &CalendarioFormacionService{
		fichaRepo:             &stubFichaRepoHorario{ficha: ficha},
		instFichaRepo:         &stubInstFichaRepoEntrar{ifc: ifc},
		fichaDiasRepo:         &stubFichaDiasRepo{},
		instFichaDiasRepo:     &stubInstFichaDiasRepo{},
		trasladoFechaRepo:     &stubTrasladoFechaRepo{},
		festivosCache:         map[string]bool{time.Now().Format(time.DateOnly): false},
		sinFormacionSedeCache: make(map[uint]map[string]string),
	}
	horario := testHorarioService(ifc, ficha, nil, nil)
	horario.calendarioSvc = calendarioSvc
	return &asistenciaService{
		repo:          repo,
		instFichaRepo: &stubInstFichaRepoEntrar{ifc: ifc},
		evidenciaRepo: &stubEvidenciaRepoEntrar{},
		horarioSvc:    horario,
	}
}

func setRelaxarRestriccionAsistenciaForTest(enabled bool) {
	if config.AppConfig == nil {
		config.AppConfig = &config.Config{}
	}
	config.AppConfig.Negocio.RelaxarRestriccionAsistencia = enabled
}

func sesionHoyTest(id uint, instructorFichaID uint, finished bool) *models.Asistencia {
	now := time.Now()
	fecha := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return &models.Asistencia{
		UserAuditModel:    models.UserAuditModel{BaseModel: models.BaseModel{ID: id}},
		InstructorFichaID: instructorFichaID,
		Fecha:             fecha,
		IsFinished:        finished,
	}
}

func TestEntrarTomarAsistencia_reutilizaSesionActivaHoy(t *testing.T) {
	ifc := &models.InstructorFichaCaracterizacion{
		BaseModel:    models.BaseModel{ID: 5},
		InstructorID: 1,
		FichaID:      10,
	}
	repo := &stubAsistenciaRepoEntrar{sesionHoy: sesionHoyTest(42, 5, false)}
	svc := testAsistenciaServiceEntrar(repo, ifc)

	resp, err := svc.EntrarTomarAsistencia(1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ID != 42 {
		t.Fatalf("expected session id 42, got %d", resp.ID)
	}
	if repo.createCount != 0 {
		t.Fatalf("must not create session, createCount=%d", repo.createCount)
	}
}

func TestEntrarTomarAsistencia_reutilizaSesionFinalizadaHoy(t *testing.T) {
	ifc := &models.InstructorFichaCaracterizacion{
		BaseModel:    models.BaseModel{ID: 5},
		InstructorID: 1,
		FichaID:      10,
	}
	repo := &stubAsistenciaRepoEntrar{sesionHoy: sesionHoyTest(42, 5, true)}
	svc := testAsistenciaServiceEntrar(repo, ifc)

	resp, err := svc.EntrarTomarAsistencia(1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ID != 42 || !resp.IsFinished {
		t.Fatalf("expected finished session 42, got id=%d finished=%v", resp.ID, resp.IsFinished)
	}
	if repo.createCount != 0 {
		t.Fatalf("must not create second session after auto-close, createCount=%d", repo.createCount)
	}
}

func TestEntrarTomarAsistencia_creaPrimeraSesionDelDia(t *testing.T) {
	ifc := &models.InstructorFichaCaracterizacion{
		BaseModel:    models.BaseModel{ID: 5},
		InstructorID: 1,
		FichaID:      10,
	}
	repo := &stubAsistenciaRepoEntrar{}
	svc := testAsistenciaServiceEntrar(repo, ifc)

	resp, err := svc.EntrarTomarAsistencia(1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ID != 99 {
		t.Fatalf("expected created session id 99, got %d", resp.ID)
	}
	if repo.createCount != 1 {
		t.Fatalf("expected one create, got %d", repo.createCount)
	}
}

func TestCreateSesion_rechazaSegundaSesionMismoDia(t *testing.T) {
	ifc := &models.InstructorFichaCaracterizacion{
		BaseModel:    models.BaseModel{ID: 5},
		InstructorID: 1,
		FichaID:      10,
	}
	repo := &stubAsistenciaRepoEntrar{sesionHoy: sesionHoyTest(42, 5, true)}
	svc := testAsistenciaServiceEntrar(repo, ifc)

	_, err := svc.CreateSesion(dto.AsistenciaRequest{
		InstructorFichaID: 5,
		Fecha:             time.Now().Format(time.DateOnly),
	})
	if err == nil {
		t.Fatal("expected error when session already exists for date")
	}
	want := strings.ToLower(errMsgYaExisteSesionEnFecha)
	if !strings.Contains(strings.ToLower(err.Error()), want) {
		t.Fatalf("error = %q, want contain %q", err.Error(), want)
	}
	if repo.createCount != 0 {
		t.Fatalf("must not insert duplicate session, createCount=%d", repo.createCount)
	}
}
