package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

const (
	msgFichaNoEncontrada           = "ficha no encontrada"
	errFmtSyncInstructorLider      = "error al sincronizar instructor líder: %w"
	msgInstructorLiderObligatorio  = "debe asignar un instructor líder a la ficha"
	ambientePorDefinir             = "POR DEFINIR"
)

type FichaService interface {
	FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string) ([]dto.FichaCaracterizacionResponse, int64, error)
	FindByID(id uint) (*dto.FichaCaracterizacionResponse, error)
	FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error)
	GetCodigo(id uint) (string, error)
	Create(req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error)
	Update(id uint, req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error)
	Delete(id uint) error
	ListInstructores(fichaID uint) ([]dto.InstructorFichaResponse, error)
	AsignarInstructores(fichaID uint, req dto.AsignarInstructoresRequest) error
	TrasladarDiaInstructor(fichaID, actorUserID uint, req dto.TrasladarDiaRequest) error
	DesasignarInstructor(fichaID, instructorID uint) error
	ListAprendices(fichaID uint) ([]dto.AprendizResponse, error)
	AsignarAprendices(fichaID uint, personas []uint) error
	DesasignarAprendices(fichaID uint, personas []uint) error
	OcultarAprendicesEnAsistencia(fichaID uint, personas []uint, oculto bool) error
}

type fichaService struct {
	fichaRepo         repositories.FichaRepository
	progRepo          repositories.ProgramaFormacionRepository
	instFichaRepo     repositories.InstructorFichaRepository
	instFichaDiasRepo repositories.InstructorFichaDiasRepository
	trasladoFechaRepo repositories.InstructorFichaTrasladoFechaRepository
	aprendizRepo      repositories.AprendizRepository
	fichaDiasRepo     repositories.FichaDiasRepository
	horarioSvc        *InstructorHorarioService
}

func NewFichaService() FichaService {
	return &fichaService{
		fichaRepo:         repositories.NewFichaRepository(),
		progRepo:          repositories.NewProgramaFormacionRepository(),
		instFichaRepo:     repositories.NewInstructorFichaRepository(),
		instFichaDiasRepo: repositories.NewInstructorFichaDiasRepository(),
		trasladoFechaRepo: repositories.NewInstructorFichaTrasladoFechaRepository(),
		aprendizRepo:      repositories.NewAprendizRepository(),
		fichaDiasRepo:     repositories.NewFichaDiasRepository(),
		horarioSvc:        NewInstructorHorarioService(),
	}
}

// conteosAprendicesActivosPorFicha agrupa COUNT por ficha (errores de consulta → mapa vacío, mismo criterio que antes).
func conteosAprendicesActivosPorFicha(ids []uint) map[uint]int {
	out := make(map[uint]int)
	if len(ids) == 0 {
		return out
	}
	var rows []struct {
		FichaID uint
		Count   int64
	}
	if err := database.GetDB().Model(&models.Aprendiz{}).
		Where("ficha_caracterizacion_id IN ? AND estado = ?", ids, true).
		Group("ficha_caracterizacion_id").
		Select("ficha_caracterizacion_id as ficha_id, COUNT(*) as count").
		Scan(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.FichaID] = int(r.Count)
	}
	return out
}

// diaFormacionIDsPorFichaIDs carga pivote ficha_dias_formacion (consulta explícita; evita fallos de Scan con Model+Select en algunos drivers).
func diaFormacionIDsPorFichaIDs(ids []uint) (map[uint][]uint, error) {
	out := make(map[uint][]uint)
	if len(ids) == 0 {
		return out, nil
	}
	type diaListRow struct {
		FichaID        int64 `gorm:"column:ficha_id"`
		DiaFormacionID int64 `gorm:"column:dia_formacion_id"`
	}
	var diaRows []diaListRow
	if err := database.GetDB().Table("ficha_dias_formacion").
		Select("ficha_id, dia_formacion_id").
		Where("ficha_id IN ?", ids).
		Where("deleted_at IS NULL").
		Scan(&diaRows).Error; err != nil {
		return nil, fmt.Errorf("error al cargar días de formación del listado: %w", err)
	}
	for _, dr := range diaRows {
		if dr.FichaID <= 0 || dr.DiaFormacionID <= 0 {
			continue
		}
		fid := uint(dr.FichaID)
		out[fid] = append(out[fid], uint(dr.DiaFormacionID))
	}
	return out, nil
}

func diaFormacionNombresPorIDs(ids []uint) []string {
	if len(ids) == 0 {
		return nil
	}
	var dias []models.DiasFormacion
	if err := database.GetDB().Where("id IN ?", ids).Find(&dias).Error; err != nil {
		return nil
	}
	byID := make(map[uint]string, len(dias))
	for _, d := range dias {
		byID[d.ID] = d.Nombre
	}
	names := make([]string, 0, len(ids))
	for _, id := range ids {
		if n, ok := byID[id]; ok && n != "" {
			names = append(names, n)
		}
	}
	return names
}

func aplicarDiasFormacionARespuesta(r *dto.FichaCaracterizacionResponse, diaIDsByFicha map[uint][]uint) {
	if ids := diaIDsByFicha[r.ID]; len(ids) > 0 {
		r.DiasFormacionIDs = ids
		r.DiasFormacionNombres = diaFormacionNombresPorIDs(ids)
	}
}

func (s *fichaService) FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string) ([]dto.FichaCaracterizacionResponse, int64, error) {
	list, total, err := s.fichaRepo.FindAll(page, pageSize, programaID, instructorID, search)
	if err != nil {
		return nil, 0, err
	}
	ids := make([]uint, len(list))
	for i := range list {
		ids[i] = list[i].ID
	}
	counts := conteosAprendicesActivosPorFicha(ids)
	diaIDsByFicha, err := diaFormacionIDsPorFichaIDs(ids)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.FichaCaracterizacionResponse, len(list))
	for i := range list {
		resp[i] = s.fichaToResponse(list[i], counts[list[i].ID])
		if d := diaIDsByFicha[list[i].ID]; len(d) > 0 {
			resp[i].DiasFormacionIDs = d
			resp[i].DiasFormacionNombres = diaFormacionNombresPorIDs(d)
		}
	}
	return resp, total, nil
}

func (s *fichaService) FindByID(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	var count int64
	database.GetDB().Model(&models.Aprendiz{}).Where("ficha_caracterizacion_id = ?", id).Count(&count)
	r := s.fichaToResponse(*f, int(count))
	diaIDsByFicha, err := diaFormacionIDsPorFichaIDs([]uint{id})
	if err != nil {
		return nil, err
	}
	aplicarDiasFormacionARespuesta(&r, diaIDsByFicha)
	return &r, nil
}

func (s *fichaService) FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByIDWithInstructoresAndAprendices(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	r := s.fichaToResponse(*f, len(f.Aprendices))
	diaIDsByFicha, err := diaFormacionIDsPorFichaIDs([]uint{id})
	if err != nil {
		return nil, err
	}
	aplicarDiasFormacionARespuesta(&r, diaIDsByFicha)
	return &r, nil
}

func (s *fichaService) GetCodigo(id uint) (string, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return "", errors.New(msgFichaNoEncontrada)
	}
	return f.Ficha, nil
}

func (s *fichaService) Create(req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error) {
	if s.fichaRepo.ExistsByFicha(req.Ficha) {
		return nil, errors.New("ya existe una ficha con ese número")
	}
	if _, err := s.progRepo.FindByID(req.ProgramaFormacionID); err != nil {
		return nil, errors.New("programa de formación no encontrado")
	}
	// Regla: instructor líder obligatorio
	if req.InstructorID == nil || *req.InstructorID == 0 {
		return nil, errors.New(msgInstructorLiderObligatorio)
	}
	f := s.fichaRequestToModel(req)
	if req.Status != nil {
		f.Status = *req.Status
	} else {
		f.Status = true
	}
	if err := s.fichaRepo.Create(&f); err != nil {
		return nil, fmt.Errorf("error al crear ficha: %w", err)
	}
	// Validar líder según reglas de negocio y sincronizar en pivote
	instRepo := repositories.NewInstructorRepository()
	if err := ValidarAsignacionInstructor(*f.InstructorID, f.ID, true, instRepo, s.fichaRepo, s.instFichaRepo); err != nil {
		_ = s.fichaRepo.Delete(f.ID)
		return nil, err
	}
	if err := SincronizarInstructorLiderEnPivote(&f, s.instFichaRepo); err != nil {
		return nil, fmt.Errorf(errFmtSyncInstructorLider, err)
	}
	if req.Horarios != nil || req.DiasFormacionIDs != nil || req.DiasFormacion != nil {
		if err := s.guardarProgramacionHoraria(f.ID, req); err != nil {
			return nil, fmt.Errorf("error al guardar programación horaria: %w", err)
		}
		if jid := derivarJornadaPrincipalID(req); jid != nil {
			f.JornadaID = jid
			_ = s.fichaRepo.Update(&f)
		}
	}
	return s.FindByID(f.ID)
}

func (s *fichaService) Update(id uint, req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	if s.fichaRepo.ExistsByFichaExcludingID(req.Ficha, id) {
		return nil, errors.New("ya existe otra ficha con ese número")
	}
	f.ProgramaFormacionID = req.ProgramaFormacionID
	f.Ficha = req.Ficha
	f.InstructorID = req.InstructorID
	f.FechaInicio = dto.FlexDateToTime(req.FechaInicio)
	f.FechaFin = dto.FlexDateToTime(req.FechaFin)
	f.AmbienteID = req.AmbienteID
	f.ModalidadFormacionID = req.ModalidadFormacionID
	f.SedeID = req.SedeID
	f.JornadaID = req.JornadaID
	// Evitar que GORM reescriba FKs con asociaciones pre-cargadas; usar solo los IDs asignados arriba.
	f.Jornada = nil
	f.Ambiente = nil
	f.ModalidadFormacion = nil
	f.Sede = nil
	f.Instructor = nil
	// Evitar que Save intente sincronizar la relación HasMany ya cargada (puede interferir con Replace posterior).
	f.FichaDiasFormacion = nil
	f.TotalHoras = req.TotalHoras
	if req.Status != nil {
		f.Status = *req.Status
	}
	if err := s.fichaRepo.Update(f); err != nil {
		return nil, fmt.Errorf("error al actualizar ficha: %w", err)
	}
	if err := SincronizarInstructorLiderEnPivote(f, s.instFichaRepo); err != nil {
		return nil, fmt.Errorf(errFmtSyncInstructorLider, err)
	}
	if req.Horarios != nil || req.DiasFormacionIDs != nil || req.DiasFormacion != nil {
		if err := s.guardarProgramacionHoraria(id, req); err != nil {
			return nil, fmt.Errorf("error al guardar programación horaria: %w", err)
		}
		if jid := derivarJornadaPrincipalID(req); jid != nil {
			f.JornadaID = jid
			if err := s.fichaRepo.Update(f); err != nil {
				return nil, fmt.Errorf("error al actualizar jornada principal: %w", err)
			}
		}
	}
	return s.FindByID(id)
}

func (s *fichaService) Delete(id uint) error {
	if _, err := s.fichaRepo.FindByID(id); err != nil {
		return errors.New(msgFichaNoEncontrada)
	}
	return s.fichaRepo.Delete(id)
}

func (s *fichaService) ListInstructores(fichaID uint) ([]dto.InstructorFichaResponse, error) {
	list, err := s.instFichaRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.InstructorFichaResponse, len(list))
	for i := range list {
		resp[i] = s.instructorFichaToResponse(list[i])
		dias, _ := s.instFichaDiasRepo.FindByInstructorAndFicha(list[i].InstructorID, fichaID)
		if len(dias) > 0 {
			ids := make([]uint, len(dias))
			for j, d := range dias {
				ids[j] = d.DiaFormacionID
			}
			resp[i].DiasFormacionIDs = ids
			resp[i].DiasFormacionNombres = diaFormacionNombresPorIDs(ids)
		}
	}
	return resp, nil
}

func (s *fichaService) diasFormacionFicha(fichaID uint) []uint {
	list, err := s.fichaDiasRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil
	}
	ids := make([]uint, 0, len(list))
	for _, d := range list {
		ids = append(ids, d.DiaFormacionID)
	}
	return ids
}

func (s *fichaService) AsignarInstructores(fichaID uint, req dto.AsignarInstructoresRequest) error {
	f, err := s.fichaRepo.FindByID(fichaID)
	if err != nil {
		return errors.New(msgFichaNoEncontrada)
	}
	instRepo := repositories.NewInstructorRepository()
	// Validar cada instructor según reglas de negocio antes de asignar
	for _, it := range req.Instructores {
		esInstructorLider := it.InstructorID == req.InstructorLiderID
		if err := ValidarAsignacionInstructor(it.InstructorID, fichaID, esInstructorLider, instRepo, s.fichaRepo, s.instFichaRepo); err != nil {
			return fmt.Errorf("instructor %d: %w", it.InstructorID, err)
		}
	}
	// Actualizar instructor líder de la ficha
	f.InstructorID = &req.InstructorLiderID
	if err := s.fichaRepo.Update(f); err != nil {
		return err
	}
	if err := SincronizarInstructorLiderEnPivote(f, s.instFichaRepo); err != nil {
		return fmt.Errorf(errFmtSyncInstructorLider, err)
	}
	// Crear o actualizar asignaciones
	fichaDiasDefault := s.diasFormacionFicha(fichaID)
	for _, it := range req.Instructores {
		if err := s.persistirAsignacionInstructor(fichaID, it, fichaDiasDefault); err != nil {
			return err
		}
	}
	return nil
}

func (s *fichaService) persistirAsignacionInstructor(
	fichaID uint,
	it dto.InstructorFichaItem,
	fichaDiasDefault []uint,
) error {
	fechaInicio := it.FechaInicio.Time
	fechaFin := it.FechaFin.Time
	diasIDs := it.DiasFormacionIDs
	if len(diasIDs) == 0 {
		diasIDs = fichaDiasDefault
	}
	// Sin días: permitido mientras coordinación no cargue programación (requerimiento dirección).
	if len(diasIDs) > 0 {
		if err := s.horarioSvc.ValidarDiasSubsetFicha(fichaID, diasIDs); err != nil {
			return fmt.Errorf("instructor %d: %w", it.InstructorID, err)
		}
		if err := s.horarioSvc.ValidarColisionAlAsignar(it.InstructorID, fichaID, diasIDs, fechaInicio, fechaFin, true); err != nil {
			return err
		}
	}
	ex, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, it.InstructorID)
	if err == nil {
		ex.CompetenciaID = it.CompetenciaID
		ex.FechaInicio = &fechaInicio
		ex.FechaFin = &fechaFin
		ex.TotalHorasInstructor = it.TotalHorasInstructor
		if errUp := s.instFichaRepo.Update(ex); errUp != nil {
			return errUp
		}
		return s.guardarDiasInstructor(it.InstructorID, fichaID, diasIDs)
	}
	m := models.InstructorFichaCaracterizacion{
		InstructorID:         it.InstructorID,
		FichaID:              fichaID,
		CompetenciaID:        it.CompetenciaID,
		FechaInicio:          &fechaInicio,
		FechaFin:             &fechaFin,
		TotalHorasInstructor: it.TotalHorasInstructor,
	}
	if err := s.instFichaRepo.Create(&m); err != nil {
		return fmt.Errorf("error al asignar instructor: %w", err)
	}
	return s.guardarDiasInstructor(it.InstructorID, fichaID, diasIDs)
}

func (s *fichaService) guardarDiasInstructor(instructorID, fichaID uint, diasIDs []uint) error {
	if err := s.instFichaDiasRepo.ReplaceByInstructorAndFicha(instructorID, fichaID, diasIDs); err != nil {
		return fmt.Errorf("error al guardar días del instructor: %w", err)
	}
	return nil
}

func (s *fichaService) DesasignarInstructor(fichaID, instructorID uint) error {
	_ = s.instFichaDiasRepo.DeleteByInstructorAndFicha(instructorID, fichaID)
	return s.instFichaRepo.DeleteByFichaIDAndInstructorID(fichaID, instructorID)
}

type trasladoAuditDetalle struct {
	Modo                string    `json:"modo"`
	FichaID             uint      `json:"ficha_id"`
	InstructorOrigenID  uint      `json:"instructor_origen_id"`
	InstructorDestinoID uint      `json:"instructor_destino_id"`
	DiaOrigenID         uint      `json:"dia_origen_id"`
	DiaDestinoID        uint      `json:"dia_destino_id"`
	ParesFechas         []dto.TrasladoParFecha `json:"pares_fechas,omitempty"`
	DiasOrigenAntes     []uint    `json:"dias_origen_antes"`
	DiasOrigenDespues   []uint    `json:"dias_origen_despues"`
	DiasDestinoAntes    []uint    `json:"dias_destino_antes"`
	DiasDestinoDespues  []uint    `json:"dias_destino_despues"`
	Motivo              string    `json:"motivo"`
	FechaAccion         time.Time `json:"fecha_accion"`
}

func (s *fichaService) TrasladarDiaInstructor(fichaID, actorUserID uint, req dto.TrasladarDiaRequest) error {
	if err := validarRequestTraslado(req); err != nil {
		return err
	}
	if normalizarModoTraslado(req.Modo) == TrasladoModoFechas {
		return s.trasladarDiaPorFechas(fichaID, actorUserID, req)
	}
	ctx, err := s.cargarContextoTraslado(fichaID, req)
	if err != nil {
		return err
	}
	if err := s.validarTrasladoConHorario(fichaID, req, ctx); err != nil {
		return err
	}
	return s.persistirTrasladoPermanenteConAuditoria(fichaID, actorUserID, req, ctx)
}

type trasladoContexto struct {
	ifcOrigen    *models.InstructorFichaCaracterizacion
	ifcDestino   *models.InstructorFichaCaracterizacion
	diasOrigen   []uint
	diasDestino  []uint
	nuevoOrigen  []uint
	nuevoDestino []uint
}

func validarRequestTraslado(req dto.TrasladarDiaRequest) error {
	if req.InstructorOrigenID == 0 || req.InstructorDestinoID == 0 {
		return errors.New("los instructores de origen y destino son obligatorios")
	}
	if req.DiaOrigenID == 0 || req.DiaDestinoID == 0 {
		return errors.New("los días de origen y destino son obligatorios")
	}
	if req.InstructorOrigenID == req.InstructorDestinoID && req.DiaOrigenID == req.DiaDestinoID {
		return errors.New("el traslado no puede mantener instructor y día iguales")
	}
	if strings.TrimSpace(req.Motivo) == "" {
		return errors.New("el motivo del traslado es obligatorio")
	}
	if normalizarModoTraslado(req.Modo) == TrasladoModoFechas && len(req.ParesFechas) == 0 {
		return errors.New("debe indicar al menos un par de fechas para el traslado")
	}
	return nil
}

func (s *fichaService) cargarContextoTraslado(fichaID uint, req dto.TrasladarDiaRequest) (*trasladoContexto, error) {
	ficha, err := s.fichaRepo.FindByID(fichaID)
	if err != nil || ficha == nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	ifcOrigen, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, req.InstructorOrigenID)
	if err != nil || ifcOrigen == nil {
		return nil, errors.New("el instructor origen no está asignado a la ficha")
	}
	ifcDestino, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, req.InstructorDestinoID)
	if err != nil || ifcDestino == nil {
		return nil, errors.New("el instructor destino no está asignado a la ficha")
	}
	diasOrigenRec, err := s.instFichaDiasRepo.FindByInstructorAndFicha(req.InstructorOrigenID, fichaID)
	if err != nil {
		return nil, err
	}
	diasDestinoRec, err := s.instFichaDiasRepo.FindByInstructorAndFicha(req.InstructorDestinoID, fichaID)
	if err != nil {
		return nil, err
	}
	diasOrigen := uniqueDiaIDsFromRecords(diasOrigenRec)
	diasDestino := uniqueDiaIDsFromRecords(diasDestinoRec)
	if !containsUint(diasOrigen, req.DiaOrigenID) {
		return nil, fmt.Errorf("el instructor origen no tiene asignado el día %d en la ficha", req.DiaOrigenID)
	}
	if !containsUint(diasDestino, req.DiaDestinoID) {
		return nil, fmt.Errorf("el instructor destino no tiene asignado el día %d en la ficha", req.DiaDestinoID)
	}
	return &trasladoContexto{
		ifcOrigen:    ifcOrigen,
		ifcDestino:   ifcDestino,
		diasOrigen:   diasOrigen,
		diasDestino:  diasDestino,
		nuevoOrigen:  addDia(removeDia(diasOrigen, req.DiaOrigenID), req.DiaDestinoID),
		nuevoDestino: addDia(removeDia(diasDestino, req.DiaDestinoID), req.DiaOrigenID),
	}, nil
}

func (s *fichaService) validarTrasladoConHorario(fichaID uint, req dto.TrasladarDiaRequest, ctx *trasladoContexto) error {
	if err := s.horarioSvc.ValidarDiasSubsetFicha(fichaID, ctx.nuevoOrigen); err != nil {
		return err
	}
	if err := s.horarioSvc.ValidarDiasSubsetFicha(fichaID, ctx.nuevoDestino); err != nil {
		return err
	}
	fechaInicioOrigen, fechaFinOrigen := rangeVigenciaAsignacion(ctx.ifcOrigen)
	fechaInicioDestino, fechaFinDestino := rangeVigenciaAsignacion(ctx.ifcDestino)
	if err := s.horarioSvc.ValidarColisionAlAsignar(req.InstructorOrigenID, fichaID, ctx.nuevoOrigen, fechaInicioOrigen, fechaFinOrigen, true); err != nil {
		return err
	}
	return s.horarioSvc.ValidarColisionAlAsignar(req.InstructorDestinoID, fichaID, ctx.nuevoDestino, fechaInicioDestino, fechaFinDestino, true)
}

func (s *fichaService) persistirTrasladoPermanenteConAuditoria(fichaID, actorUserID uint, req dto.TrasladarDiaRequest, ctx *trasladoContexto) error {
	return database.GetDB().Transaction(func(tx *gorm.DB) error {
		if err := replaceDiasInstructorTx(tx, fichaID, req.InstructorOrigenID, ctx.nuevoOrigen); err != nil {
			return err
		}
		if err := replaceDiasInstructorTx(tx, fichaID, req.InstructorDestinoID, ctx.nuevoDestino); err != nil {
			return err
		}
		return crearLogTraslado(tx, actorUserID, fichaID, req, ctx, nil)
	})
}

func (s *fichaService) trasladarDiaPorFechas(fichaID, actorUserID uint, req dto.TrasladarDiaRequest) error {
	if _, err := s.cargarContextoTraslado(fichaID, req); err != nil {
		return err
	}
	pares, err := validarParesFechasTraslado(req)
	if err != nil {
		return err
	}
	fechasConsulta := make([]time.Time, 0, len(pares)*2)
	for i := range pares {
		pares[i].FichaID = fichaID
		pares[i].ActorUserID = actorUserID
		fechasConsulta = append(fechasConsulta, pares[i].FechaOrigen, pares[i].FechaDestino)
	}
	ocupada, err := s.trasladoFechaRepo.ExistsFechaOcupada(fichaID, fechasConsulta)
	if err != nil {
		return err
	}
	if ocupada {
		return errors.New("una o más fechas ya tienen un traslado registrado en esta ficha")
	}
	for _, par := range pares {
		if err := s.horarioSvc.ValidarColisionEnFecha(req.InstructorDestinoID, fichaID, req.DiaOrigenID, par.FechaOrigen); err != nil {
			return fmt.Errorf("colisión en fecha origen %s: %w", par.FechaOrigen.Format(time.DateOnly), err)
		}
		if err := s.horarioSvc.ValidarColisionEnFecha(req.InstructorOrigenID, fichaID, req.DiaDestinoID, par.FechaDestino); err != nil {
			return fmt.Errorf("colisión en fecha destino %s: %w", par.FechaDestino.Format(time.DateOnly), err)
		}
	}
	return database.GetDB().Transaction(func(tx *gorm.DB) error {
		if err := s.trasladoFechaRepo.CreateBatch(tx, pares); err != nil {
			return err
		}
		return crearLogTraslado(tx, actorUserID, fichaID, req, nil, pares)
	})
}

func crearLogTraslado(
	tx *gorm.DB,
	actorUserID, fichaID uint,
	req dto.TrasladarDiaRequest,
	ctx *trasladoContexto,
	pares []models.InstructorFichaTrasladoFecha,
) error {
	detalle := trasladoAuditDetalle{
		Modo:                normalizarModoTraslado(req.Modo),
		FichaID:             fichaID,
		InstructorOrigenID:  req.InstructorOrigenID,
		InstructorDestinoID: req.InstructorDestinoID,
		DiaOrigenID:         req.DiaOrigenID,
		DiaDestinoID:        req.DiaDestinoID,
		ParesFechas:         req.ParesFechas,
		Motivo:              strings.TrimSpace(req.Motivo),
		FechaAccion:         time.Now(),
	}
	if ctx != nil {
		detalle.DiasOrigenAntes = ctx.diasOrigen
		detalle.DiasOrigenDespues = ctx.nuevoOrigen
		detalle.DiasDestinoAntes = ctx.diasDestino
		detalle.DiasDestinoDespues = ctx.nuevoDestino
	}
	if len(pares) > 0 {
		detalle.ParesFechas = make([]dto.TrasladoParFecha, len(pares))
		for i, p := range pares {
			detalle.ParesFechas[i] = dto.TrasladoParFecha{
				FechaOrigen:  p.FechaOrigen.Format(time.DateOnly),
				FechaDestino: p.FechaDestino.Format(time.DateOnly),
			}
		}
	}
	payload, _ := json.Marshal(detalle)
	log := models.RegistroActividades{
		UserID:      actorUserID,
		Accion:      "TRASLADO_DIA_INSTRUCTOR",
		Tabla:       "instructor_ficha_dias",
		RegistroID:  nil,
		Detalles:    string(payload),
		FechaAccion: time.Now(),
	}
	return tx.Create(&log).Error
}

func uniqueDiaIDsFromRecords(rows []models.InstructorFichaDias) []uint {
	seen := make(map[uint]bool, len(rows))
	out := make([]uint, 0, len(rows))
	for _, r := range rows {
		if r.DiaFormacionID == 0 || seen[r.DiaFormacionID] {
			continue
		}
		seen[r.DiaFormacionID] = true
		out = append(out, r.DiaFormacionID)
	}
	return out
}

func removeDia(list []uint, target uint) []uint {
	out := make([]uint, 0, len(list))
	for _, id := range list {
		if id != target {
			out = append(out, id)
		}
	}
	return out
}

func addDia(list []uint, day uint) []uint {
	if day == 0 || containsUint(list, day) {
		return list
	}
	return append(list, day)
}

func rangeVigenciaAsignacion(ifc *models.InstructorFichaCaracterizacion) (time.Time, time.Time) {
	now := time.Now()
	inicio := now
	fin := now
	if ifc != nil && ifc.FechaInicio != nil {
		inicio = *ifc.FechaInicio
	}
	if ifc != nil && ifc.FechaFin != nil {
		fin = *ifc.FechaFin
	}
	if fin.Before(inicio) {
		fin = inicio
	}
	return inicio, fin
}

func replaceDiasInstructorTx(tx *gorm.DB, fichaID, instructorID uint, diasIDs []uint) error {
	if err := tx.Where("instructor_id = ? AND ficha_id = ?", instructorID, fichaID).Delete(&models.InstructorFichaDias{}).Error; err != nil {
		return fmt.Errorf("error al limpiar días del instructor: %w", err)
	}
	for _, d := range diasIDs {
		if d == 0 {
			continue
		}
		rec := models.InstructorFichaDias{
			InstructorID:   instructorID,
			FichaID:        fichaID,
			DiaFormacionID: d,
		}
		if err := tx.Create(&rec).Error; err != nil {
			return fmt.Errorf("error al guardar días del instructor: %w", err)
		}
	}
	return nil
}

func (s *fichaService) ListAprendices(fichaID uint) ([]dto.AprendizResponse, error) {
	list, err := s.aprendizRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AprendizResponse, len(list))
	for i := range list {
		resp[i] = s.aprendizToResponse(list[i], "")
	}
	return resp, nil
}

func (s *fichaService) AsignarAprendices(fichaID uint, personas []uint) error {
	if _, err := s.fichaRepo.FindByID(fichaID); err != nil {
		return errors.New(msgFichaNoEncontrada)
	}
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err == nil {
			a.Estado = true
			a.OcultoEnAsistencia = false
			_ = s.aprendizRepo.Update(a)
			continue
		}
		a = &models.Aprendiz{
			PersonaID:              personaID,
			FichaCaracterizacionID: fichaID,
			Estado:                 true,
			OcultoEnAsistencia:     false,
		}
		if err := s.aprendizRepo.Create(a); err != nil {
			return fmt.Errorf("error al asignar aprendiz: %w", err)
		}
	}
	return nil
}

func (s *fichaService) DesasignarAprendices(fichaID uint, personas []uint) error {
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err != nil {
			continue
		}
		a.Estado = false
		_ = s.aprendizRepo.Update(a)
	}
	return nil
}

func (s *fichaService) OcultarAprendicesEnAsistencia(fichaID uint, personas []uint, oculto bool) error {
	if _, err := s.fichaRepo.FindByID(fichaID); err != nil {
		return errors.New(msgFichaNoEncontrada)
	}
	var actualizados int
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err != nil || a == nil || !a.Estado {
			continue
		}
		a.OcultoEnAsistencia = oculto
		if err := s.aprendizRepo.Update(a); err != nil {
			return fmt.Errorf("error al actualizar visibilidad del aprendiz: %w", err)
		}
		actualizados++
	}
	if actualizados == 0 {
		return errors.New("no se encontró ningún aprendiz activo en esta ficha para actualizar")
	}
	return nil
}

func (s *fichaService) fichaToResponse(f models.FichaCaracterizacion, cantidadAprendices int) dto.FichaCaracterizacionResponse {
	r := dto.FichaCaracterizacionResponse{
		ID:                   f.ID,
		ProgramaFormacionID:  f.ProgramaFormacionID,
		Ficha:                f.Ficha,
		InstructorID:         f.InstructorID,
		FechaInicio:          f.FechaInicio,
		FechaFin:             f.FechaFin,
		AmbienteID:           f.AmbienteID,
		SedeID:               f.SedeID,
		ModalidadFormacionID: f.ModalidadFormacionID,
		JornadaID:            f.JornadaID,
		TotalHoras:           f.TotalHoras,
		Status:               f.Status,
		CantidadAprendices:   cantidadAprendices,
		DiasFormacionIDs:     []uint{},
	}
	if f.ProgramaFormacion != nil {
		r.ProgramaFormacionNombre = f.ProgramaFormacion.Nombre
	}
	if f.Instructor != nil {
		if f.Instructor.Persona != nil {
			r.InstructorNombre = f.Instructor.Persona.GetFullName()
		} else {
			r.InstructorNombre = f.Instructor.NombreCompletoCache
		}
	}
	if f.Ambiente != nil {
		r.AmbienteNombre = formatAmbienteRuta(f.Ambiente)
	} else {
		r.AmbienteNombre = ambientePorDefinir
	}
	if f.Sede != nil {
		r.SedeNombre = f.Sede.Nombre
	}
	if f.ModalidadFormacion != nil {
		r.ModalidadFormacionNombre = f.ModalidadFormacion.Nombre
	}
	if f.Jornada != nil {
		r.JornadaNombre = f.Jornada.Nombre
	}
	for _, fd := range f.FichaDiasFormacion {
		item := fichaDiaToItem(fd)
		r.DiasFormacion = append(r.DiasFormacion, item)
		if !containsUint(r.DiasFormacionIDs, fd.DiaFormacionID) {
			r.DiasFormacionIDs = append(r.DiasFormacionIDs, fd.DiaFormacionID)
		}
	}
	r.Horarios = r.DiasFormacion
	return r
}

func containsUint(list []uint, id uint) bool {
	for _, x := range list {
		if x == id {
			return true
		}
	}
	return false
}

func fichaDiaToItem(fd models.FichaDiasFormacion) dto.FichaDiaFormacionItem {
	item := dto.FichaDiaFormacionItem{
		DiaFormacionID: fd.DiaFormacionID,
		HoraInicio:     normalizeHoraMM(fd.HoraInicio),
		HoraFin:        normalizeHoraMM(fd.HoraFin),
		Orden:          fd.Orden,
		JornadaID:      fd.JornadaID,
	}
	if fd.DiaFormacion != nil {
		item.DiaNombre = fd.DiaFormacion.Nombre
	}
	if fd.Jornada != nil {
		item.JornadaNombre = fd.Jornada.Nombre
	}
	return item
}

func (s *fichaService) fichaRequestToModel(req dto.FichaCaracterizacionRequest) models.FichaCaracterizacion {
	return models.FichaCaracterizacion{
		ProgramaFormacionID:  req.ProgramaFormacionID,
		Ficha:                req.Ficha,
		InstructorID:         req.InstructorID,
		FechaInicio:          dto.FlexDateToTime(req.FechaInicio),
		FechaFin:             dto.FlexDateToTime(req.FechaFin),
		AmbienteID:           req.AmbienteID,
		ModalidadFormacionID: req.ModalidadFormacionID,
		SedeID:               req.SedeID,
		JornadaID:            req.JornadaID,
		TotalHoras:           req.TotalHoras,
	}
}

func horasDefaultJornada(jornadaID *uint) (inicio, fin string) {
	if jornadaID == nil || *jornadaID == 0 {
		return "", ""
	}
	bloqueRepo := repositories.NewJornadaBloqueRepository()
	bloques, err := bloqueRepo.FindByJornadaID(*jornadaID)
	if err == nil && len(bloques) > 0 {
		return normalizeHoraMM(bloques[0].HoraInicio), normalizeHoraMM(bloques[0].HoraFin)
	}
	j, err := repositories.NewCatalogoRepository().FindJornadaByID(*jornadaID)
	if err != nil || j == nil {
		return "", ""
	}
	return normalizeHoraMM(j.HoraInicio), normalizeHoraMM(j.HoraFin)
}

func resolveHorariosFromRequest(req dto.FichaCaracterizacionRequest) []dto.FichaDiaFormacionItem {
	if len(req.Horarios) > 0 {
		return req.Horarios
	}
	if len(req.DiasFormacion) > 0 {
		return req.DiasFormacion
	}
	if len(req.DiasFormacionIDs) == 0 {
		return nil
	}
	hi, hf := horasDefaultJornada(req.JornadaID)
	return buildDiasFormacionFromIDs(req.DiasFormacionIDs, req.DiasFormacion, hi, hf)
}

func buildDiasFormacionFromIDs(ids []uint, detalle []dto.FichaDiaFormacionItem, hi, hf string) []dto.FichaDiaFormacionItem {
	horasByDia := make(map[uint]dto.FichaDiaFormacionItem)
	for _, d := range detalle {
		if d.DiaFormacionID > 0 {
			horasByDia[d.DiaFormacionID] = d
		}
	}
	out := make([]dto.FichaDiaFormacionItem, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		item := dto.FichaDiaFormacionItem{
			DiaFormacionID: id,
			HoraInicio:     hi,
			HoraFin:        hf,
		}
		if h, ok := horasByDia[id]; ok {
			if h.HoraInicio != "" {
				item.HoraInicio = h.HoraInicio
			}
			if h.HoraFin != "" {
				item.HoraFin = h.HoraFin
			}
			item.Orden = h.Orden
			item.JornadaID = h.JornadaID
		}
		out = append(out, item)
	}
	return out
}

func horariosToInputs(items []dto.FichaDiaFormacionItem) []HorarioBloqueInput {
	out := make([]HorarioBloqueInput, 0, len(items))
	for _, it := range items {
		out = append(out, HorarioBloqueInput{
			DiaFormacionID: it.DiaFormacionID,
			HoraInicio:     it.HoraInicio,
			HoraFin:        it.HoraFin,
			JornadaID:      it.JornadaID,
			Orden:          it.Orden,
		})
	}
	return out
}

func horariosToRepoInputs(items []dto.FichaDiaFormacionItem) []repositories.FichaDiaInput {
	inputs := make([]repositories.FichaDiaInput, 0, len(items))
	for _, it := range items {
		if it.DiaFormacionID == 0 {
			continue
		}
		inputs = append(inputs, repositories.FichaDiaInput{
			DiaFormacionID: it.DiaFormacionID,
			HoraInicio:     normalizeHoraMM(it.HoraInicio),
			HoraFin:        normalizeHoraMM(it.HoraFin),
			Orden:          it.Orden,
			JornadaID:      it.JornadaID,
		})
	}
	return inputs
}

func derivarJornadaPrincipalID(req dto.FichaCaracterizacionRequest) *uint {
	if req.JornadaID != nil && *req.JornadaID > 0 {
		return req.JornadaID
	}
	items := resolveHorariosFromRequest(req)
	counts := make(map[uint]int)
	for _, it := range items {
		if it.JornadaID != nil && *it.JornadaID > 0 {
			counts[*it.JornadaID]++
		}
	}
	var bestID uint
	bestN := 0
	for id, n := range counts {
		if n > bestN {
			bestN = n
			bestID = id
		}
	}
	if bestID == 0 {
		return nil
	}
	return &bestID
}

func (s *fichaService) guardarProgramacionHoraria(fichaID uint, req dto.FichaCaracterizacionRequest) error {
	items := resolveHorariosFromRequest(req)
	if len(items) == 0 {
		return s.fichaDiasRepo.ReplaceByFichaIDWithHorarios(fichaID, nil)
	}
	if err := ValidarHorariosSinSolape(horariosToInputs(items)); err != nil {
		return err
	}
	inputs := horariosToRepoInputs(items)
	return s.fichaDiasRepo.ReplaceByFichaIDWithHorarios(fichaID, inputs)
}

func (s *fichaService) instructorFichaToResponse(m models.InstructorFichaCaracterizacion) dto.InstructorFichaResponse {
	r := dto.InstructorFichaResponse{
		ID:                   m.ID,
		InstructorID:         m.InstructorID,
		FichaID:              m.FichaID,
		CompetenciaID:        m.CompetenciaID,
		FechaInicio:          m.FechaInicio,
		FechaFin:             m.FechaFin,
		TotalHorasInstructor: m.TotalHorasInstructor,
	}
	if m.Instructor != nil {
		if m.Instructor.Persona != nil {
			r.InstructorNombre = m.Instructor.Persona.GetFullName()
		} else {
			r.InstructorNombre = m.Instructor.NombreCompletoCache
		}
	}
	if m.Competencia != nil {
		r.CompetenciaNombre = m.Competencia.Nombre
	}
	return r
}

func (s *fichaService) aprendizToResponse(a models.Aprendiz, fichaNumero string) dto.AprendizResponse {
	if fichaNumero == "" && a.FichaCaracterizacion != nil {
		fichaNumero = a.FichaCaracterizacion.Ficha
	}
	r := dto.AprendizResponse{
		ID:                     a.ID,
		PersonaID:              a.PersonaID,
		FichaCaracterizacionID: a.FichaCaracterizacionID,
		Estado:                 a.Estado,
		OcultoEnAsistencia:     a.OcultoEnAsistencia,
		FichaNumero:            fichaNumero,
	}
	if a.Persona != nil {
		r.PersonaNombre = a.Persona.GetFullName()
		r.PersonaDocumento = a.Persona.NumeroDocumento
	}
	if a.FichaCaracterizacion != nil {
		if a.FichaCaracterizacion.ProgramaFormacion != nil {
			r.ProgramaNombre = a.FichaCaracterizacion.ProgramaFormacion.Nombre
		}
		if a.FichaCaracterizacion.Sede != nil && a.FichaCaracterizacion.Sede.Regional != nil {
			r.RegionalNombre = a.FichaCaracterizacion.Sede.Regional.Nombre
		}
	}
	return r
}

// formatAmbienteRuta devuelve la ubicación completa: "B3 - P3 - MULTIMEDIA".
func formatAmbienteRuta(a *models.Ambiente) string {
	if a == nil {
		return ambientePorDefinir
	}
	var parts []string
	if a.Piso != nil {
		if a.Piso.Bloque != nil && a.Piso.Bloque.Nombre != "" {
			parts = append(parts, a.Piso.Bloque.Nombre)
		}
		if a.Piso.Nombre != "" {
			parts = append(parts, a.Piso.Nombre)
		}
	}
	if a.Nombre != "" {
		parts = append(parts, a.Nombre)
	}
	if len(parts) == 0 {
		return ambientePorDefinir
	}
	return strings.Join(parts, " - ")
}
