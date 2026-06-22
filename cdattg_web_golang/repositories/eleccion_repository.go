package repositories

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const (
	eleccionPreloadAprendiz           = "Persona"
	eleccionWhereProcesoID            = "proceso_id = ?"
	eleccionWhereProcesoIDEstado      = eleccionWhereProcesoID + " AND estado = ?"
	eleccionWhereProcesoIDVotanteUser = eleccionWhereProcesoID + " AND votante_user_id = ?"
	eleccionWhereProcesoIDAprendizEnPlancha = eleccionWhereProcesoID + " AND estado NOT IN ? AND (titular_aprendiz_id = ? OR suplente_aprendiz_id = ?)"
)

type EleccionRepository interface {
	CreateProceso(p *models.EleccionProceso) error
	UpdateProceso(p *models.EleccionProceso) error
	FindProcesoByID(id uint) (*models.EleccionProceso, error)
	ExistsProcesoByRegionalAnio(regionalID uint, anio int, excludeID uint) (bool, error)
	ListProcesos(regionalIDs []uint, unrestricted bool) ([]models.EleccionProceso, error)
	FindProcesoActivoByRegional(regionalID uint) (*models.EleccionProceso, error)

	CreatePlancha(p *models.EleccionPlancha) error
	UpdatePlancha(p *models.EleccionPlancha) error
	FindPlanchaByID(id uint) (*models.EleccionPlancha, error)
	ListPlanchasByProceso(procesoID uint, soloConfirmadas bool) ([]models.EleccionPlancha, error)
	CountPlanchasConfirmadas(procesoID uint) (int64, error)
	ExistsAprendizEnPlancha(procesoID, aprendizID uint) (bool, error)

	UpsertVoto(v *models.EleccionVoto) error
	CreateVoto(v *models.EleccionVoto) error
	FindVotoByProcesoAndUser(procesoID, userID uint) (*models.EleccionVoto, error)
	CountVotosByProceso(procesoID uint) (int64, error)
	ListVotosByProceso(procesoID uint) ([]models.EleccionVoto, error)
	CountVotosByPlancha(planchaID uint) (int64, error)

	SaveResultado(r *models.EleccionResultado) error
	FindResultadoByProceso(procesoID uint) (*models.EleccionResultado, error)

	FindRepresentantesVigentesByRegional(regionalID uint) (*models.RepresentanteAprendiz, error)
	FindRepresentantesHistorial(regionalID uint) ([]models.RepresentanteAprendiz, error)
	CerrarVigenciaRepresentantes(regionalID uint, hasta time.Time) error
	CreateRepresentante(r *models.RepresentanteAprendiz) error

	CountAprendicesActivosByRegional(regionalID uint) (int64, error)
	FindAprendizIDsExRepresentantes(regionalID uint, anioActual int) ([]uint, error)
}

type eleccionRepository struct {
	db *gorm.DB
}

func NewEleccionRepository() EleccionRepository {
	return &eleccionRepository{db: database.GetDB()}
}

func (r *eleccionRepository) preloadProceso(q *gorm.DB) *gorm.DB {
	return q.Preload("Regional")
}

func (r *eleccionRepository) preloadPlancha(q *gorm.DB) *gorm.DB {
	return q.Preload("TitularAprendiz."+eleccionPreloadAprendiz).
		Preload("TitularAprendiz.FichaCaracterizacion").
		Preload("SuplenteAprendiz."+eleccionPreloadAprendiz).
		Preload("SuplenteAprendiz.FichaCaracterizacion")
}

func (r *eleccionRepository) CreateProceso(p *models.EleccionProceso) error {
	return r.db.Create(p).Error
}

func (r *eleccionRepository) UpdateProceso(p *models.EleccionProceso) error {
	return r.db.Save(p).Error
}

func (r *eleccionRepository) FindProcesoByID(id uint) (*models.EleccionProceso, error) {
	var p models.EleccionProceso
	if err := r.preloadProceso(r.db).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *eleccionRepository) ExistsProcesoByRegionalAnio(regionalID uint, anio int, excludeID uint) (bool, error) {
	var n int64
	q := r.db.Model(&models.EleccionProceso{}).Where("regional_id = ? AND anio = ?", regionalID, anio)
	if excludeID > 0 {
		q = q.Where("id <> ?", excludeID)
	}
	if err := q.Count(&n).Error; err != nil {
		return false, err
	}
	return n > 0, nil
}

func (r *eleccionRepository) ListProcesos(regionalIDs []uint, unrestricted bool) ([]models.EleccionProceso, error) {
	var list []models.EleccionProceso
	q := r.preloadProceso(r.db).Order("anio DESC, id DESC")
	if !unrestricted && len(regionalIDs) > 0 {
		q = q.Where("regional_id IN ?", regionalIDs)
	}
	if err := q.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *eleccionRepository) FindProcesoActivoByRegional(regionalID uint) (*models.EleccionProceso, error) {
	var p models.EleccionProceso
	err := r.preloadProceso(r.db).
		Where("regional_id = ? AND estado IN ?", regionalID, []string{
			models.EleccionEstadoInscripcion,
			models.EleccionEstadoVotacion,
			models.EleccionEstadoEmpatePendiente,
		}).
		Order("id DESC").
		First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *eleccionRepository) CreatePlancha(p *models.EleccionPlancha) error {
	return r.db.Create(p).Error
}

func (r *eleccionRepository) UpdatePlancha(p *models.EleccionPlancha) error {
	return r.db.Save(p).Error
}

func (r *eleccionRepository) FindPlanchaByID(id uint) (*models.EleccionPlancha, error) {
	var p models.EleccionPlancha
	if err := r.preloadPlancha(r.db.Preload("Proceso.Regional")).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *eleccionRepository) ListPlanchasByProceso(procesoID uint, soloConfirmadas bool) ([]models.EleccionPlancha, error) {
	var list []models.EleccionPlancha
	q := r.preloadPlancha(r.db).Where(eleccionWhereProcesoID, procesoID)
	if soloConfirmadas {
		q = q.Where("estado = ?", models.PlanchaEstadoConfirmada)
	} else {
		q = q.Where("estado NOT IN ?", []string{models.PlanchaEstadoRetirada, models.PlanchaEstadoRechazada})
	}
	if err := q.Order("id ASC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *eleccionRepository) CountPlanchasConfirmadas(procesoID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.EleccionPlancha{}).
		Where(eleccionWhereProcesoIDEstado, procesoID, models.PlanchaEstadoConfirmada).
		Count(&n).Error
	return n, err
}

func (r *eleccionRepository) ExistsAprendizEnPlancha(procesoID, aprendizID uint) (bool, error) {
	var n int64
	err := r.db.Model(&models.EleccionPlancha{}).
		Where(eleccionWhereProcesoIDAprendizEnPlancha,
			procesoID, []string{models.PlanchaEstadoRetirada, models.PlanchaEstadoRechazada}, aprendizID, aprendizID).
		Count(&n).Error
	return n > 0, err
}

func (r *eleccionRepository) CreateVoto(v *models.EleccionVoto) error {
	return r.db.Create(v).Error
}

func (r *eleccionRepository) UpsertVoto(v *models.EleccionVoto) error {
	var existing models.EleccionVoto
	err := r.db.Where(eleccionWhereProcesoIDVotanteUser, v.ProcesoID, v.VotanteUserID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(v).Error
	}
	if err != nil {
		return err
	}
	existing.PlanchaID = v.PlanchaID
	existing.VotanteAprendizID = v.VotanteAprendizID
	return r.db.Save(&existing).Error
}

func (r *eleccionRepository) FindVotoByProcesoAndUser(procesoID, userID uint) (*models.EleccionVoto, error) {
	var v models.EleccionVoto
	if err := r.db.Where(eleccionWhereProcesoIDVotanteUser, procesoID, userID).First(&v).Error; err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *eleccionRepository) CountVotosByProceso(procesoID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.EleccionVoto{}).Where(eleccionWhereProcesoID, procesoID).Count(&n).Error
	return n, err
}

func (r *eleccionRepository) ListVotosByProceso(procesoID uint) ([]models.EleccionVoto, error) {
	var list []models.EleccionVoto
	err := r.db.Where(eleccionWhereProcesoID, procesoID).
		Preload("VotanteAprendiz."+eleccionPreloadAprendiz).
		Preload("Plancha").
		Order("updated_at ASC").
		Find(&list).Error
	return list, err
}

func (r *eleccionRepository) CountVotosByPlancha(planchaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.EleccionVoto{}).Where("plancha_id = ?", planchaID).Count(&n).Error
	return n, err
}

func (r *eleccionRepository) SaveResultado(res *models.EleccionResultado) error {
	var existing models.EleccionResultado
	err := r.db.Where(eleccionWhereProcesoID, res.ProcesoID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(res).Error
	}
	if err != nil {
		return err
	}
	existing.PlanchaGanadoraID = res.PlanchaGanadoraID
	existing.VotosTotales = res.VotosTotales
	existing.DetalleJSON = res.DetalleJSON
	existing.Empate = res.Empate
	existing.NotaDesempate = res.NotaDesempate
	existing.UserRegistroID = res.UserRegistroID
	return r.db.Save(&existing).Error
}

func (r *eleccionRepository) FindResultadoByProceso(procesoID uint) (*models.EleccionResultado, error) {
	var res models.EleccionResultado
	if err := r.db.Preload("PlanchaGanadora").Where(eleccionWhereProcesoID, procesoID).First(&res).Error; err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *eleccionRepository) preloadRepresentante(q *gorm.DB) *gorm.DB {
	return q.Preload("Regional").
		Preload("Proceso").
		Preload("TitularAprendiz."+eleccionPreloadAprendiz).
		Preload("SuplenteAprendiz."+eleccionPreloadAprendiz)
}

func (r *eleccionRepository) FindRepresentantesVigentesByRegional(regionalID uint) (*models.RepresentanteAprendiz, error) {
	var rep models.RepresentanteAprendiz
	err := r.preloadRepresentante(r.db).
		Where("regional_id = ? AND vigencia_hasta IS NULL", regionalID).
		Order("vigencia_desde DESC").
		First(&rep).Error
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *eleccionRepository) FindRepresentantesHistorial(regionalID uint) ([]models.RepresentanteAprendiz, error) {
	var list []models.RepresentanteAprendiz
	err := r.preloadRepresentante(r.db).
		Where("regional_id = ?", regionalID).
		Order("vigencia_desde DESC").
		Find(&list).Error
	return list, err
}

func (r *eleccionRepository) CerrarVigenciaRepresentantes(regionalID uint, hasta time.Time) error {
	return r.db.Model(&models.RepresentanteAprendiz{}).
		Where("regional_id = ? AND vigencia_hasta IS NULL", regionalID).
		Update("vigencia_hasta", hasta).Error
}

func (r *eleccionRepository) CreateRepresentante(rep *models.RepresentanteAprendiz) error {
	return r.db.Create(rep).Error
}

func (r *eleccionRepository) CountAprendicesActivosByRegional(regionalID uint) (int64, error) {
	var n int64
	err := r.db.Model(&models.Aprendiz{}).
		Joins("INNER JOIN fichas_caracterizacion fc ON fc.id = aprendices.ficha_caracterizacion_id").
		Joins("INNER JOIN sedes s ON s.id = fc.sede_id").
		Where("aprendices.estado = ? AND s.regional_id = ?", true, regionalID).
		Count(&n).Error
	return n, err
}

func (r *eleccionRepository) FindAprendizIDsExRepresentantes(regionalID uint, anioActual int) ([]uint, error) {
	var out []uint
	err := r.db.Raw(`
		SELECT DISTINCT aprendiz_id FROM (
			SELECT titular_aprendiz_id AS aprendiz_id
			FROM representantes_aprendiz ra
			INNER JOIN eleccion_procesos ep ON ep.id = ra.proceso_id
			WHERE ra.regional_id = ? AND ep.anio < ?
			UNION
			SELECT suplente_aprendiz_id AS aprendiz_id
			FROM representantes_aprendiz ra
			INNER JOIN eleccion_procesos ep ON ep.id = ra.proceso_id
			WHERE ra.regional_id = ? AND ep.anio < ?
		) ex`, regionalID, anioActual, regionalID, anioActual).Scan(&out).Error
	return out, err
}
