package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

// complementarios_service.go
// Lógica del módulo Complementarios (FPI):
//  - credenciales SofiaPlus por operador (cifradas)
//  - verificación individual de aspirantes en SofiaPlus

const msgDocumentoObligatorio = "El número de documento es obligatorio."

// ---------------------------------------------------------------------------
// Registro en memoria de lotes en segundo plano (verificación por Excel).
// El POST devuelve el lote_id al instante; el scraper reporta avance y el
// frontend hace polling a /progreso/:lote_id y /resultados/:lote_id.
// ---------------------------------------------------------------------------

type loteJob struct {
	LoteID     string
	Fase       string
	Total      int
	Resultados any // []dto.VerificarAspiranteResponse (verificar) o []dto.ConsultarInscripcionesResponse (inscripciones)
	Done       chan struct{}
	Creado     time.Time
}

var (
	lotesMu sync.Mutex
	lotes   = map[string]*loteJob{}
	loteTTL = 30 * time.Minute
)

func nuevoLoteID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func registrarLote(fase string, total int) *loteJob {
	lotesMu.Lock()
	defer lotesMu.Unlock()

	// Limpieza perezosa: descarta lotes terminados con más de TTL.
	ahora := time.Now()
	for k, j := range lotes {
		if jobTerminado(j) && ahora.Sub(j.Creado) > loteTTL {
			delete(lotes, k)
		}
	}

	job := &loteJob{
		LoteID: nuevoLoteID(),
		Fase:   fase,
		Total:  total,
		Done:   make(chan struct{}),
		Creado: ahora,
	}
	lotes[job.LoteID] = job
	return job
}

func jobTerminado(job *loteJob) bool {
	select {
	case <-job.Done:
		return true
	default:
		return false
	}
}

type ComplementariosService struct {
	repo *repositories.SofiaCredencialRepository
}

func NewComplementariosService() *ComplementariosService {
	return &ComplementariosService{repo: repositories.NewSofiaCredencialRepository()}
}

// GuardarCredencial registra o actualiza el usuario SENA del operador (contraseña cifrada).
// No confundir con el login de CDATTG: aquí va el documento SENA Sofía Plus.
func (s *ComplementariosService) GuardarCredencial(usuarioID uint, req dto.GuardarCredencialSofiaRequest) error {
	usuario := strings.TrimSpace(req.Usuario)
	if !esUsuarioSofiaValido(usuario) {
		return errors.New("el usuario Sofía debe ser el número de documento (solo dígitos), no el correo de CDATTG")
	}
	cifrada, err := cifrarSecreto(req.Password)
	if err != nil {
		return err
	}
	cred := &models.SofiaCredencial{
		UsuarioID:       usuarioID,
		TipoDocumento:   strings.TrimSpace(req.TipoDocumento),
		Usuario:         usuario,
		PasswordCifrada: cifrada,
		Rol:             strings.TrimSpace(req.Rol),
	}
	return s.repo.Upsert(cred)
}

func esUsuarioSofiaValido(usuario string) bool {
	u := strings.TrimSpace(usuario)
	if u == "" || strings.Contains(u, "@") {
		return false
	}
	for _, r := range u {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

// ObtenerEstado indica si el operador tiene credenciales Sofía válidas (documento numérico).
// Si quedó guardado un correo del sistema por error, se elimina y se reporta sin credencial.
func (s *ComplementariosService) ObtenerEstado(usuarioID uint) dto.CredencialSofiaEstadoResponse {
	cred, err := s.repo.FindByUsuarioID(usuarioID)
	if err != nil || cred == nil {
		return dto.CredencialSofiaEstadoResponse{Tiene: false}
	}
	if !esUsuarioSofiaValido(cred.Usuario) {
		_ = s.repo.DeleteByUsuarioID(usuarioID)
		return dto.CredencialSofiaEstadoResponse{Tiene: false}
	}
	return dto.CredencialSofiaEstadoResponse{
		Tiene:         true,
		TipoDocumento: cred.TipoDocumento,
		Usuario:       cred.Usuario,
		Rol:           cred.Rol,
		ActualizadaEn: cred.UpdatedAt.Format("2006-01-02 15:04"),
	}
}

// EliminarCredencial borra el usuario SENA del operador.
func (s *ComplementariosService) EliminarCredencial(usuarioID uint) error {
	return s.repo.DeleteByUsuarioID(usuarioID)
}

// credencialesDeUsuario carga y descifra las credenciales del operador.
func (s *ComplementariosService) credencialesDeUsuario(usuarioID uint) (SofiaCredenciales, error) {
	cred, err := s.repo.FindByUsuarioID(usuarioID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return SofiaCredenciales{}, errors.New("no has registrado tu usuario SENA en el módulo")
		}
		return SofiaCredenciales{}, err
	}
	password, err := descifrarSecreto(cred.PasswordCifrada)
	if err != nil {
		return SofiaCredenciales{}, errors.New("no se pudo descifrar la contraseña guardada (¿cambió SOFIA_ENC_KEY?)")
	}
	return SofiaCredenciales{
		Usuario:       cred.Usuario,
		Password:      password,
		TipoDocumento: cred.TipoDocumento,
		Rol:           cred.Rol,
	}, nil
}

// VerificarAspirante consulta un documento en SofiaPlus (login SENA + Consultar Registro).
func (s *ComplementariosService) VerificarAspirante(usuarioID uint, req dto.VerificarAspiranteRequest) dto.VerificarAspiranteResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	if numero == "" {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         msgDocumentoObligatorio,
		}
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         err.Error(),
		}
	}
	// Fase 1: siempre Encargado de ingreso (Consultar Registro / SGS).
	cred.Rol = "Encargado de ingreso centro formación"

	scraper := NewSofiaScraper()
	return scraper.VerificarDocumento(cred, numero, req.TipoDocumento)
}

// ConsultarInscripciones consulta inscripciones en SofiaPlus filtrando por programa (Usuario SENA).
func (s *ComplementariosService) ConsultarInscripciones(usuarioID uint, req dto.ConsultarInscripcionesRequest) dto.ConsultarInscripcionesResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	programa := strings.TrimSpace(req.Programa)
	if numero == "" {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            msgDocumentoObligatorio,
		}
	}
	if programa == "" {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            "El nombre del programa de formación es obligatorio.",
		}
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            err.Error(),
		}
	}
	// Este flujo siempre usa Usuario SENA (no el rol de Consultar Registro).
	cred.Rol = "Usuario SENA"

	scraper := NewSofiaScraper()
	return scraper.ConsultarInscripciones(cred, numero, programa, req.TipoDocumento)
}

// PlantillaInscripciones Excel para carga masiva documento+programa.
func (s *ComplementariosService) PlantillaInscripciones() ([]byte, error) {
	return GenerarPlantillaInscripciones()
}

// ConsultarInscripcionesLote procesa Excel (numero_documento, programa) con un solo login SENA.
// (síncrono; se mantiene por compatibilidad, el handler usa ConsultarInscripcionesLoteAsync)
func (s *ComplementariosService) ConsultarInscripcionesLote(usuarioID uint, contenido []byte) (dto.ConsultarInscripcionesLoteResponse, error) {
	filas, err := ParsearLoteInscripcionesExcel(contenido)
	if err != nil {
		return dto.ConsultarInscripcionesLoteResponse{}, err
	}
	if len(filas) == 0 {
		return dto.ConsultarInscripcionesLoteResponse{}, errors.New("el Excel no tiene filas válidas (numero_documento y programa de formación)")
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.ConsultarInscripcionesLoteResponse{}, err
	}
	cred.Rol = "Usuario SENA"

	scraper := NewSofiaScraper()
	resultados := scraper.ConsultarInscripcionesLote(cred, filas, "")

	out := dto.ConsultarInscripcionesLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.InscripcionEncontrado:
			out.Encontrados++
		case dto.InscripcionNoEncontrado:
			out.NoEncontrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// ConsultarInscripcionesLoteAsync valida el Excel, arranca el lote de
// inscripciones en segundo plano y devuelve el lote_id de inmediato.
func (s *ComplementariosService) ConsultarInscripcionesLoteAsync(usuarioID uint, contenido []byte) (dto.LoteIniciadoResponse, error) {
	filas, err := ParsearLoteInscripcionesExcel(contenido)
	if err != nil {
		return dto.LoteIniciadoResponse{}, err
	}
	if len(filas) == 0 {
		return dto.LoteIniciadoResponse{}, errors.New("el Excel no tiene filas válidas (numero_documento y programa de formación)")
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.LoteIniciadoResponse{}, err
	}
	cred.Rol = "Usuario SENA"

	job := s.iniciarLoteInscripciones(cred, filas)
	return dto.LoteIniciadoResponse{LoteID: job.LoteID, Total: len(filas)}, nil
}

// ReintentarInscripciones vuelve a consultar en SofiaPlus solo las filas que
// quedaron NO_VERIFICADO / NO_ENCONTRADO en un lote anterior (sin Excel).
func (s *ComplementariosService) ReintentarInscripciones(usuarioID uint, req dto.ReintentarInscripcionesRequest) (dto.LoteIniciadoResponse, error) {
	filas := filasReintentoValidas(req.Documentos)
	if len(filas) == 0 {
		return dto.LoteIniciadoResponse{}, errors.New("no hay filas válidas (numero_documento y programa) para reintentar")
	}
	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.LoteIniciadoResponse{}, err
	}
	cred.Rol = "Usuario SENA"

	job := s.iniciarLoteInscripciones(cred, filas)
	return dto.LoteIniciadoResponse{LoteID: job.LoteID, Total: len(filas)}, nil
}

// filasReintentoValidas normaliza y descarta filas sin documento o programa del
// reintento de inscripciones.
func filasReintentoValidas(documentos []dto.LoteInscripcionFila) []dto.LoteInscripcionFila {
	filas := make([]dto.LoteInscripcionFila, 0, len(documentos))
	for _, d := range documentos {
		numero := strings.TrimSpace(d.NumeroDocumento)
		programa := strings.TrimSpace(d.Programa)
		if numero == "" || programa == "" {
			continue
		}
		filas = append(filas, dto.LoteInscripcionFila{
			NumeroDocumento: numero,
			Programa:        programa,
			TipoDocumento:   strings.TrimSpace(d.TipoDocumento),
		})
	}
	return filas
}

// iniciarLoteInscripciones arranca en segundo plano el escaneo Fase 2
// (Consultar Inscripciones) de una lista de filas documento+programa; lo
// comparten Excel y reintento.
func (s *ComplementariosService) iniciarLoteInscripciones(cred SofiaCredenciales, filas []dto.LoteInscripcionFila) *loteJob {
	job := registrarLote("inscripciones", len(filas))
	go func() {
		defer close(job.Done)
		scraper := NewSofiaScraper()
		job.Resultados = scraper.ConsultarInscripcionesLote(cred, filas, job.LoteID)
	}()
	return job
}

// ResultadosLoteInscripciones devuelve el resultado final de un lote de
// inscripciones cuando ya terminó.
func (s *ComplementariosService) ResultadosLoteInscripciones(loteID string) (dto.ConsultarInscripcionesLoteResponse, error) {
	lotesMu.Lock()
	job, ok := lotes[loteID]
	lotesMu.Unlock()
	if !ok {
		return dto.ConsultarInscripcionesLoteResponse{}, errors.New("lote no encontrado o expirado")
	}
	if !jobTerminado(job) {
		return dto.ConsultarInscripcionesLoteResponse{}, errors.New("el lote aún está en curso")
	}
	resultados, ok := job.Resultados.([]dto.ConsultarInscripcionesResponse)
	if !ok {
		return dto.ConsultarInscripcionesLoteResponse{}, errors.New("el lote no es de inscripciones")
	}

	out := dto.ConsultarInscripcionesLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.InscripcionEncontrado:
			out.Encontrados++
		case dto.InscripcionNoEncontrado:
			out.NoEncontrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// VerificarAspiranteBetowa consulta un documento en Betowa (sin credenciales SENA).
func (s *ComplementariosService) VerificarAspiranteBetowa(req dto.VerificarAspiranteRequest) dto.VerificarAspiranteResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	if numero == "" {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         msgDocumentoObligatorio,
		}
	}

	scraper := NewBetowaScraper()
	return scraper.VerificarDocumento(numero, req.TipoDocumento)
}

// PlantillaLote devuelve el Excel de ejemplo para la carga masiva.
func (s *ComplementariosService) PlantillaLote() ([]byte, error) {
	return GenerarPlantillaLote()
}

// VerificarLote procesa el Excel de documentos vía login SENA + Consultar Registro.
// (síncrono; se mantiene por compatibilidad, el handler usa VerificarLoteAsync)
func (s *ComplementariosService) VerificarLote(usuarioID uint, contenido []byte) (dto.VerificarLoteResponse, error) {
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}
	if len(docs) == 0 {
		return dto.VerificarLoteResponse{}, errors.New("el Excel no tiene documentos válidos (revisa la columna numero_documento)")
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}
	// Fase 1: siempre Encargado de ingreso (Consultar Registro / SGS).
	cred.Rol = "Encargado de ingreso centro formación"

	scraper := NewSofiaScraper()
	resultados := scraper.VerificarLote(cred, docs, "")

	out := dto.VerificarLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.VerificacionRegistrado:
			out.Registrados++
		case dto.VerificacionNoRegistrado:
			out.NoRegistrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// VerificarLoteAsync valida el Excel, arranca el lote en segundo plano y
// devuelve de inmediato el lote_id para consultar progreso/resultados.
func (s *ComplementariosService) VerificarLoteAsync(usuarioID uint, contenido []byte) (dto.LoteIniciadoResponse, error) {
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		return dto.LoteIniciadoResponse{}, err
	}
	if len(docs) == 0 {
		return dto.LoteIniciadoResponse{}, errors.New("el Excel no tiene documentos válidos (revisa la columna numero_documento)")
	}
	return s.iniciarLoteVerificar(usuarioID, docs)
}

// ReintentarVerificacion vuelve a consultar en SofiaPlus solo los documentos
// que quedaron NO_VERIFICADO / NO_REGISTRADO en un lote anterior (sin Excel).
func (s *ComplementariosService) ReintentarVerificacion(usuarioID uint, req dto.ReintentarVerificacionRequest) (dto.LoteIniciadoResponse, error) {
	docs := docsReintentoValidos(req.Documentos)
	if len(docs) == 0 {
		return dto.LoteIniciadoResponse{}, errors.New("no hay documentos válidos para reintentar")
	}
	return s.iniciarLoteVerificar(usuarioID, docs)
}

// docsReintentoValidos normaliza y descarta documentos vacíos del reintento de verificación.
func docsReintentoValidos(documentos []dto.LoteDocumento) []dto.LoteDocumento {
	docs := make([]dto.LoteDocumento, 0, len(documentos))
	for _, d := range documentos {
		numero := strings.TrimSpace(d.NumeroDocumento)
		if numero == "" {
			continue
		}
		docs = append(docs, dto.LoteDocumento{
			NumeroDocumento: numero,
			TipoDocumento:   strings.TrimSpace(d.TipoDocumento),
		})
	}
	return docs
}

// iniciarLoteVerificar arranca en segundo plano el escaneo Fase 1 (Consultar
// Registro) de una lista de documentos; lo comparten Excel y reintento.
func (s *ComplementariosService) iniciarLoteVerificar(usuarioID uint, docs []dto.LoteDocumento) (dto.LoteIniciadoResponse, error) {
	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.LoteIniciadoResponse{}, err
	}
	// Fase 1: siempre Encargado de ingreso (Consultar Registro / SGS).
	cred.Rol = "Encargado de ingreso centro formación"

	job := registrarLote("verificar", len(docs))
	go func() {
		defer close(job.Done)
		scraper := NewSofiaScraper()
		job.Resultados = scraper.VerificarLote(cred, docs, job.LoteID)
	}()

	return dto.LoteIniciadoResponse{LoteID: job.LoteID, Total: len(docs)}, nil
}

// ProgresoLote devuelve el avance en vivo de un lote (proxy al scraper cuando
// está en curso; estado local cuando ya terminó).
func (s *ComplementariosService) ProgresoLote(loteID string) (dto.ProgresoLoteResponse, error) {
	lotesMu.Lock()
	job, ok := lotes[loteID]
	lotesMu.Unlock()
	if !ok {
		return dto.ProgresoLoteResponse{}, errors.New("lote no encontrado o expirado")
	}
	if jobTerminado(job) {
		return dto.ProgresoLoteResponse{
			LoteID:     job.LoteID,
			Fase:       job.Fase,
			Total:      job.Total,
			Procesados: job.Total,
			Terminado:  true,
		}, nil
	}

	scraper := NewSofiaScraper()
	prog, err := scraper.ProgresoLote(loteID)
	if err != nil {
		return dto.ProgresoLoteResponse{}, err
	}
	prog.LoteID = job.LoteID
	if prog.Total == 0 {
		prog.Total = job.Total
	}
	return prog, nil
}

// ResultadosLote devuelve el resultado final del lote cuando ya terminó.
func (s *ComplementariosService) ResultadosLote(loteID string) (dto.VerificarLoteResponse, error) {
	lotesMu.Lock()
	job, ok := lotes[loteID]
	lotesMu.Unlock()
	if !ok {
		return dto.VerificarLoteResponse{}, errors.New("lote no encontrado o expirado")
	}
	if !jobTerminado(job) {
		return dto.VerificarLoteResponse{}, errors.New("el lote aún está en curso")
	}
	resultados, ok := job.Resultados.([]dto.VerificarAspiranteResponse)
	if !ok {
		return dto.VerificarLoteResponse{}, errors.New("el lote no es de verificación")
	}

	out := dto.VerificarLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range out.Resultados {
		switch r.Estado {
		case dto.VerificacionRegistrado:
			out.Registrados++
		case dto.VerificacionNoRegistrado:
			out.NoRegistrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// VerificarLoteBetowa procesa el Excel vía formulario de registro Betowa (sin credenciales).
func (s *ComplementariosService) VerificarLoteBetowa(contenido []byte) (dto.VerificarLoteResponse, error) {
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}
	if len(docs) == 0 {
		return dto.VerificarLoteResponse{}, errors.New("el Excel no tiene documentos válidos (revisa la columna numero_documento)")
	}

	scraper := NewBetowaScraper()
	resultados := scraper.VerificarLote(docs)

	out := dto.VerificarLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.VerificacionRegistrado:
			out.Registrados++
		case dto.VerificacionNoRegistrado:
			out.NoRegistrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

//
