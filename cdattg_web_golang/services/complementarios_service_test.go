package services

import (
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestEsUsuarioSofiaValido_digitosOk(t *testing.T) {
	t.Parallel()
	casos := []struct {
		entrada string
		valido  bool
	}{
		{"1143364626", true},
		{" 1143364626 ", true},
		{"", false},
		{" ",
			false},
		{"1143a626", false},
		{"usuario@correo.com", false},
		{"-1143", false},
	}
	for _, c := range casos {
		if got := esUsuarioSofiaValido(c.entrada); got != c.valido {
			t.Errorf("esUsuarioSofiaValido(%q)=%v, esperado %v", c.entrada, got, c.valido)
		}
	}
}

func TestDocsReintentoValidos_normalizaYDedica(t *testing.T) {
	t.Parallel()
	docs := []dto.LoteDocumento{
		{NumeroDocumento: " 1118028779 ", TipoDocumento: " CC "},
		{NumeroDocumento: ""},
		{NumeroDocumento: "   "},
		{NumeroDocumento: "96355056", TipoDocumento: ""},
	}
	got := docsReintentoValidos(docs)
	if len(got) != 2 {
		t.Fatalf("esperaba 2 documentos válidos, obtuve %d", len(got))
	}
	if got[0].NumeroDocumento != "1118028779" || got[0].TipoDocumento != "CC" {
		t.Fatalf("doc0=%+v", got[0])
	}
	if got[1].NumeroDocumento != "96355056" || got[1].TipoDocumento != "" {
		t.Fatalf("doc1=%+v", got[1])
	}
}

func TestDocsReintentoValidos_vacio(t *testing.T) {
	t.Parallel()
	if got := docsReintentoValidos(nil); len(got) != 0 {
		t.Fatalf("esperaba 0, obtuve %d", len(got))
	}
	if got := docsReintentoValidos([]dto.LoteDocumento{{NumeroDocumento: "  "}}); len(got) != 0 {
		t.Fatalf("esperaba 0, obtuve %d", len(got))
	}
}

func TestFilasReintentoValidas_normalizaYDedica(t *testing.T) {
	t.Parallel()
	filas := []dto.LoteInscripcionFila{
		{NumeroDocumento: " 1120955821 ", Programa: " TECNOLOGO ", TipoDocumento: " CC "},
		{NumeroDocumento: "", Programa: "TECNOLOGO"},
		{NumeroDocumento: "123", Programa: "   "},
		{NumeroDocumento: "456", Programa: "", TipoDocumento: "TI"},
	}
	got := filasReintentoValidas(filas)
	if len(got) != 1 {
		t.Fatalf("esperaba 1 fila válida, obtuve %d", len(got))
	}
	if got[0].NumeroDocumento != "1120955821" || got[0].Programa != "TECNOLOGO" || got[0].TipoDocumento != "CC" {
		t.Fatalf("fila0=%+v", got[0])
	}
}

func TestFilasReintentoValidas_vacio(t *testing.T) {
	t.Parallel()
	if got := filasReintentoValidas(nil); len(got) != 0 {
		t.Fatalf("esperaba 0, obtuve %d", len(got))
	}
}

func TestNuevoLoteID_formatoYUnico(t *testing.T) {
	t.Parallel()
	a := nuevoLoteID()
	b := nuevoLoteID()
	if len(a) != 16 || len(b) != 16 {
		t.Fatalf("lote_id=%q/%q debe tener 16 hex", a, b)
	}
	if strings.ToLower(a) != a {
		t.Fatalf("lote_id=%q debe ser minúsculas", a)
	}
	if a == b {
		t.Fatalf("dos lote_id iguales: %q", a)
	}
}

func TestRegistrarLote_devuelveJobEnCurso(t *testing.T) {
	job := registrarLote("verificar", 2)
	t.Cleanup(func() {
		close(job.Done)
		delete(lotes, job.LoteID)
	})
	if job.Total != 2 || job.Fase != "verificar" || job.LoteID == "" {
		t.Fatalf("job=%+v", job)
	}
	if jobTerminado(job) {
		t.Fatal("un lote recién registrado no debe estar terminado")
	}
	if _, ok := lotes[job.LoteID]; !ok {
		t.Fatal("el lote debe quedar registrado en el mapa")
	}
}

func TestRegistrarLote_limpiaViejosTerminados(t *testing.T) {
	oldTTL := loteTTL
	loteTTL = time.Hour
	defer func() { loteTTL = oldTTL }()

	viejo := registrarLote("verificar", 1)
	close(viejo.Done)                              // terminado
	viejo.Creado = time.Now().Add(-2 * time.Hour)  // vencido frente al TTL

	job := registrarLote("inscripciones", 3)
	t.Cleanup(func() {
		close(job.Done)
		delete(lotes, job.LoteID)
	})

	if _, ok := lotes[viejo.LoteID]; ok {
		t.Fatal("el lote viejo terminado debió limpiarse al registrar uno nuevo")
	}
	if _, ok := lotes[job.LoteID]; !ok {
		t.Fatal("el lote nuevo debe quedar registrado")
	}
	if jobTerminado(job) {
		t.Fatal("el lote nuevo no debe estar terminado")
	}
}

// ---------------------------------------------------------------------------
// Pruebas con base en memoria (sqlite) + clave de cifrado de prueba.
// NO usan t.Parallel: mutan los globales database.DB y config.AppConfig.
// ---------------------------------------------------------------------------

const claveCifradoPrueba = "clave-de-prueba-0123456789abcdef"

func serviceConCredencialesEnMemoria(t *testing.T) *ComplementariosService {
	t.Helper()

	if config.AppConfig == nil {
		config.AppConfig = &config.Config{Sofia: config.SofiaConfig{EncKey: claveCifradoPrueba}}
		t.Cleanup(func() { config.AppConfig = nil })
	} else {
		keyAnterior := config.AppConfig.Sofia.EncKey
		config.AppConfig.Sofia.EncKey = claveCifradoPrueba
		t.Cleanup(func() { config.AppConfig.Sofia.EncKey = keyAnterior })
	}

	db, err := gorm.Open(sqlite.Open("file:sofia_test?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.SofiaCredencial{}); err != nil {
		t.Fatalf("AutoMigrate: %v", err)
	}

	dbAnterior := database.DB
	database.DB = db
	t.Cleanup(func() { database.DB = dbAnterior })

	return NewComplementariosService()
}

func TestGuardarCredencial_roundTripConDescifrado(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	req := dto.GuardarCredencialSofiaRequest{
		TipoDocumento: "CC",
		Usuario:       " 1143364626 ",
		Password:      "contraseña-prueba",
		Rol:           "Encargado de ingreso centro formación",
	}
	if err := svc.GuardarCredencial(2, req); err != nil {
		t.Fatalf("GuardarCredencial: %v", err)
	}

	estado := svc.ObtenerEstado(2)
	if !estado.Tiene || estado.Usuario != "1143364626" || estado.TipoDocumento != "CC" {
		t.Fatalf("estado=%+v", estado)
	}

	cred, err := svc.credencialesDeUsuario(2)
	if err != nil {
		t.Fatalf("credencialesDeUsuario: %v", err)
	}
	if cred.Password != "contraseña-prueba" || cred.Usuario != "1143364626" {
		t.Fatalf("credencial descifrada incorrecta: %+v", cred)
	}
}

func TestGuardarCredencial_usuarioInvalido(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	req := dto.GuardarCredencialSofiaRequest{
		TipoDocumento: "CC",
		Usuario:       "usuario@correo.com",
		Password:      "x",
	}
	if err := svc.GuardarCredencial(2, req); err == nil {
		t.Fatal("esperaba error por usuario no numérico")
	}
	if err := svc.GuardarCredencial(2, dto.GuardarCredencialSofiaRequest{
		TipoDocumento: "CC", Usuario: "", Password: "x",
	}); err == nil {
		t.Fatal("esperaba error por usuario vacío")
	}
}

func TestObtenerEstado_sinCredencial(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	if estado := svc.ObtenerEstado(99); estado.Tiene {
		t.Fatalf("no debe tener credencial: %+v", estado)
	}
}

func TestObtenerEstado_limpiaCredencialConCorreo(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	if err := svc.repo.Upsert(&models.SofiaCredencial{
		UsuarioID:       7,
		TipoDocumento:   "CC",
		Usuario:         "correo@x.com",
		PasswordCifrada: "noimporta",
	}); err != nil {
		t.Fatalf("Upsert: %v", err)
	}
	if estado := svc.ObtenerEstado(7); estado.Tiene {
		t.Fatalf("la credencial con correo debe reportarse sin credencial: %+v", estado)
	}
	if _, err := svc.repo.FindByUsuarioID(7); err == nil {
		t.Fatal("la credencial inválida debió eliminarse")
	}
}

func TestEliminarCredencial(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	req := dto.GuardarCredencialSofiaRequest{TipoDocumento: "CC", Usuario: "1143364626", Password: "x"}
	if err := svc.GuardarCredencial(3, req); err != nil {
		t.Fatalf("GuardarCredencial: %v", err)
	}
	if err := svc.EliminarCredencial(3); err != nil {
		t.Fatalf("EliminarCredencial: %v", err)
	}
	if estado := svc.ObtenerEstado(3); estado.Tiene {
		t.Fatal("después de eliminar no debe haber credencial")
	}
}

func TestReintentarVerificacion_sinCredencial(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_, err := svc.ReintentarVerificacion(1, dto.ReintentarVerificacionRequest{
		Documentos: []dto.LoteDocumento{{NumeroDocumento: "1118028779"}},
	})
	if err == nil || !strings.Contains(err.Error(), "no has registrado tu usuario SENA") {
		t.Fatalf("error esperado de credencial, obtuve: %v", err)
	}
}

func TestReintentarInscripciones_sinCredencial(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_, err := svc.ReintentarInscripciones(1, dto.ReintentarInscripcionesRequest{
		Documentos: []dto.LoteInscripcionFila{{NumeroDocumento: "1120955821", Programa: "TECNOLOGO"}},
	})
	if err == nil || !strings.Contains(err.Error(), "no has registrado tu usuario SENA") {
		t.Fatalf("error esperado de credencial, obtuve: %v", err)
	}
}

func TestReintentarVerificacion_soloInvalidos(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_, err := svc.ReintentarVerificacion(1, dto.ReintentarVerificacionRequest{
		Documentos: []dto.LoteDocumento{{NumeroDocumento: "  "}},
	})
	if err == nil || !strings.Contains(err.Error(), "no hay documentos válidos") {
		t.Fatalf("error esperado de validación, obtuve: %v", err)
	}
}

func TestReintentarInscripciones_soloInvalidos(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_, err := svc.ReintentarInscripciones(1, dto.ReintentarInscripcionesRequest{
		Documentos: []dto.LoteInscripcionFila{{NumeroDocumento: "123", Programa: " "}},
	})
	if err == nil || !strings.Contains(err.Error(), "no hay filas válidas") {
		t.Fatalf("error esperado de validación, obtuve: %v", err)
	}
}

func TestVerificarAspirante_sinNumero(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	res := svc.VerificarAspirante(1, dto.VerificarAspiranteRequest{NumeroDocumento: " "})
	if res.Estado != dto.VerificacionNoVerificado || !strings.Contains(res.Mensaje, "obligatorio") {
		t.Fatalf("res=%+v", res)
	}
}

func TestVerificarAspirante_sinCredencial(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	res := svc.VerificarAspirante(1, dto.VerificarAspiranteRequest{NumeroDocumento: "1118028779"})
	if res.Estado != dto.VerificacionNoVerificado || !strings.Contains(res.Mensaje, "no has registrado") {
		t.Fatalf("res=%+v", res)
	}
}

func TestConsultarInscripciones_validaciones(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)

	resNumero := svc.ConsultarInscripciones(1, dto.ConsultarInscripcionesRequest{
		NumeroDocumento: " ", Programa: "TECNOLOGO",
	})
	if resNumero.Estado != dto.InscripcionNoVerificado || !strings.Contains(resNumero.Mensaje, "obligatorio") {
		t.Fatalf("resNumero=%+v", resNumero)
	}

	resPrograma := svc.ConsultarInscripciones(1, dto.ConsultarInscripcionesRequest{
		NumeroDocumento: "1120955821", Programa: "",
	})
	if resPrograma.Estado != dto.InscripcionNoVerificado || !strings.Contains(resPrograma.Mensaje, "obligatorio") {
		t.Fatalf("resPrograma=%+v", resPrograma)
	}

	resCred := svc.ConsultarInscripciones(1, dto.ConsultarInscripcionesRequest{
		NumeroDocumento: "1120955821", Programa: "TECNOLOGO",
	})
	if resCred.Estado != dto.InscripcionNoVerificado || !strings.Contains(resCred.Mensaje, "no has registrado") {
		t.Fatalf("resCred=%+v", resCred)
	}
}

func TestVerificarAspiranteBetowa_sinNumero(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	res := svc.VerificarAspiranteBetowa(dto.VerificarAspiranteRequest{NumeroDocumento: ""})
	if res.Estado != dto.VerificacionNoVerificado || !strings.Contains(res.Mensaje, "obligatorio") {
		t.Fatalf("res=%+v", res)
	}
}

func TestCifrarSecreto_sinClaveDaError(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_ = svc
	keyAnterior := config.AppConfig.Sofia.EncKey
	config.AppConfig.Sofia.EncKey = ""
	t.Cleanup(func() { config.AppConfig.Sofia.EncKey = keyAnterior })

	if _, err := cifrarSecreto("hola"); err == nil {
		t.Fatal("esperaba error sin SOFIA_ENC_KEY")
	}
}

func TestCifrarDescifrarSecreto_roundTrip(t *testing.T) {
	svc := serviceConCredencialesEnMemoria(t)
	_ = svc
	plano := "Sofia123!@#"
	cifrada, err := cifrarSecreto(plano)
	if err != nil {
		t.Fatalf("cifrarSecreto: %v", err)
	}
	if cifrada == plano {
		t.Fatal("la contraseña no debe guardarse en texto plano")
	}
	vuelta, err := descifrarSecreto(cifrada)
	if err != nil {
		t.Fatalf("descifrarSecreto: %v", err)
	}
	if vuelta != plano {
		t.Fatalf("round trip=%q, esperado %q", vuelta, plano)
	}

	if _, err := descifrarSecreto("&&&no-base64"); err == nil {
		t.Fatal("esperaba error con entrada corrupta")
	}
}

// ---------------------------------------------------------------------------
// Estado del registro de lotes (ResultadosLote, ResultadosLoteInscripciones,
// ProgresoLote) y plantillas — sin tocar el scraper.
// ---------------------------------------------------------------------------

func TestResultadosLote_terminadoSumaResumen(t *testing.T) {
	job := registrarLote("verificar", 2)
	job.Resultados = []dto.VerificarAspiranteResponse{
		{NumeroDocumento: "1", Estado: dto.VerificacionRegistrado},
		{NumeroDocumento: "2", Estado: dto.VerificacionNoRegistrado},
		{NumeroDocumento: "3", Estado: dto.VerificacionNoVerificado},
	}
	close(job.Done)
	t.Cleanup(func() { delete(lotes, job.LoteID) })

	svc := NewComplementariosService()
	res, err := svc.ResultadosLote(job.LoteID)
	if err != nil {
		t.Fatalf("ResultadosLote: %v", err)
	}
	if res.Total != 3 || res.Registrados != 1 || res.NoRegistrados != 1 || res.NoVerificados != 1 {
		t.Fatalf("res=%+v", res)
	}
}

func TestResultadosLote_errores(t *testing.T) {
	svc := NewComplementariosService()

	if _, err := svc.ResultadosLote("no-existe"); err == nil {
		t.Fatal("esperaba error de lote no encontrado")
	}

	enCurso := registrarLote("verificar", 1)
	t.Cleanup(func() { close(enCurso.Done); delete(lotes, enCurso.LoteID) })
	if _, err := svc.ResultadosLote(enCurso.LoteID); err == nil {
		t.Fatal("esperaba error de lote en curso")
	}

	terminado := registrarLote("verificar", 1)
	terminado.Resultados = []dto.ConsultarInscripcionesResponse{} // tipo equivocado
	close(terminado.Done)
	t.Cleanup(func() { delete(lotes, terminado.LoteID) })
	if _, err := svc.ResultadosLote(terminado.LoteID); err == nil {
		t.Fatal("esperaba error de tipo de lote")
	}
}

func TestResultadosLoteInscripciones_terminadoSumaResumen(t *testing.T) {
	job := registrarLote("inscripciones", 3)
	job.Resultados = []dto.ConsultarInscripcionesResponse{
		{NumeroDocumento: "1", Estado: dto.InscripcionEncontrado},
		{NumeroDocumento: "2", Estado: dto.InscripcionNoEncontrado},
		{NumeroDocumento: "3", Estado: dto.InscripcionNoVerificado},
		{NumeroDocumento: "4", Estado: dto.InscripcionEncontrado},
	}
	close(job.Done)
	t.Cleanup(func() { delete(lotes, job.LoteID) })

	svc := NewComplementariosService()
	res, err := svc.ResultadosLoteInscripciones(job.LoteID)
	if err != nil {
		t.Fatalf("ResultadosLoteInscripciones: %v", err)
	}
	if res.Total != 4 || res.Encontrados != 2 || res.NoEncontrados != 1 || res.NoVerificados != 1 {
		t.Fatalf("res=%+v", res)
	}
}

func TestResultadosLoteInscripciones_errores(t *testing.T) {
	svc := NewComplementariosService()

	if _, err := svc.ResultadosLoteInscripciones("no-existe"); err == nil {
		t.Fatal("esperaba error de lote no encontrado")
	}

	enCurso := registrarLote("inscripciones", 1)
	t.Cleanup(func() { close(enCurso.Done); delete(lotes, enCurso.LoteID) })
	if _, err := svc.ResultadosLoteInscripciones(enCurso.LoteID); err == nil {
		t.Fatal("esperaba error de lote en curso")
	}

	terminado := registrarLote("inscripciones", 1)
	terminado.Resultados = []dto.VerificarAspiranteResponse{} // tipo equivocado
	close(terminado.Done)
	t.Cleanup(func() { delete(lotes, terminado.LoteID) })
	if _, err := svc.ResultadosLoteInscripciones(terminado.LoteID); err == nil {
		t.Fatal("esperaba error de tipo de lote")
	}
}

func TestProgresoLote_noEncontradoYTerminado(t *testing.T) {
	svc := NewComplementariosService()

	if _, err := svc.ProgresoLote("no-existe"); err == nil {
		t.Fatal("esperaba error de lote no encontrado")
	}

	job := registrarLote("inscripciones", 7)
	close(job.Done)
	t.Cleanup(func() { delete(lotes, job.LoteID) })

	prog, err := svc.ProgresoLote(job.LoteID)
	if err != nil {
		t.Fatalf("ProgresoLote: %v", err)
	}
	if !prog.Terminado || prog.Total != 7 || prog.Procesados != 7 || prog.Fase != "inscripciones" {
		t.Fatalf("prog=%+v", prog)
	}
}

func TestPlantillas_generanExcel(t *testing.T) {
	svc := NewComplementariosService()

	buf, err := svc.PlantillaLote()
	if err != nil || len(buf) == 0 {
		t.Fatalf("PlantillaLote: len=%d err=%v", len(buf), err)
	}
	bufIns, err := svc.PlantillaInscripciones()
	if err != nil || len(bufIns) == 0 {
		t.Fatalf("PlantillaInscripciones: len=%d err=%v", len(bufIns), err)
	}
}