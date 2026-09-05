package repositories

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// AccesoHistorialQuery filtros de listado / stats.
type AccesoHistorialQuery struct {
	RegionalID       *uint
	SedeID           *uint
	FechaDesde       *time.Time
	FechaHasta       *time.Time
	TipoPersona      string
	Documento        string
	Estado           string // abierto | cerrado | todos
	MotivoSalida     string
	SalidaSinIngreso *bool
	Page             int
	PageSize         int
}

// AccesoStatsResult agregados del reporte de accesos.
type AccesoStatsResult struct {
	TotalIngresos   int64
	TotalSalidas    int64
	Abiertas        int64
	Cerradas        int64
	SinIngreso      int64
	PorTipo         map[string]int64
	PorMotivo       map[string]int64
	PorMetodo       map[string]int64
	IngresosPorHora [24]int64
	SalidasPorHora  [24]int64
}

// PersonaIngresoSalidaRepository acceso a registros de portería.
type PersonaIngresoSalidaRepository interface {
	FindByID(id uint) (*models.PersonaIngresoSalida, error)
	FindAbiertaByPersonaAndSede(personaID, sedeID uint) (*models.PersonaIngresoSalida, error)
	Create(row *models.PersonaIngresoSalida) error
	Update(row *models.PersonaIngresoSalida) error
	ListAbiertasBySede(sedeID uint) ([]models.PersonaIngresoSalida, error)
	CountAbiertasBySede(sedeID *uint, regionalID *uint) (int64, error)
	ListHistorial(q AccesoHistorialQuery) ([]models.PersonaIngresoSalida, int64, error)
	StatsHistorial(q AccesoHistorialQuery) (AccesoStatsResult, error)
}

type personaIngresoSalidaRepository struct {
	db *gorm.DB
}

// NewPersonaIngresoSalidaRepository crea el repositorio.
func NewPersonaIngresoSalidaRepository() PersonaIngresoSalidaRepository {
	return &personaIngresoSalidaRepository{db: database.GetDB()}
}

func (r *personaIngresoSalidaRepository) FindByID(id uint) (*models.PersonaIngresoSalida, error) {
	var row models.PersonaIngresoSalida
	if err := r.db.First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *personaIngresoSalidaRepository) FindAbiertaByPersonaAndSede(personaID, sedeID uint) (*models.PersonaIngresoSalida, error) {
	var row models.PersonaIngresoSalida
	err := r.db.
		Where("persona_id = ? AND sede_id = ? AND timestamp_salida IS NULL AND ingreso_cancelado = false", personaID, sedeID).
		Order("timestamp_entrada DESC").
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *personaIngresoSalidaRepository) Create(row *models.PersonaIngresoSalida) error {
	return r.db.Create(row).Error
}

func (r *personaIngresoSalidaRepository) Update(row *models.PersonaIngresoSalida) error {
	return r.db.Save(row).Error
}

func (r *personaIngresoSalidaRepository) ListAbiertasBySede(sedeID uint) ([]models.PersonaIngresoSalida, error) {
	var rows []models.PersonaIngresoSalida
	err := r.db.
		Preload("Persona").
		Where("sede_id = ? AND timestamp_salida IS NULL AND ingreso_cancelado = false", sedeID).
		Order("timestamp_entrada DESC").
		Find(&rows).Error
	return rows, err
}

func (r *personaIngresoSalidaRepository) baseQuery(q AccesoHistorialQuery) *gorm.DB {
	tx := r.db.Model(&models.PersonaIngresoSalida{}).
		Joins("LEFT JOIN sedes ON sedes.id = persona_ingreso_salida.sede_id")

	if q.SedeID != nil && *q.SedeID > 0 {
		tx = tx.Where("persona_ingreso_salida.sede_id = ?", *q.SedeID)
	} else if q.RegionalID != nil && *q.RegionalID > 0 {
		tx = tx.Where("sedes.regional_id = ?", *q.RegionalID)
	}
	if q.FechaDesde != nil {
		tx = tx.Where("persona_ingreso_salida.timestamp_entrada >= ?", *q.FechaDesde)
	}
	if q.FechaHasta != nil {
		tx = tx.Where("persona_ingreso_salida.timestamp_entrada < ?", q.FechaHasta.Add(24*time.Hour))
	}
	if tp := strings.TrimSpace(q.TipoPersona); tp != "" {
		tx = tx.Where("persona_ingreso_salida.tipo_persona = ?", strings.ToUpper(tp))
	}
	if motivo := strings.TrimSpace(q.MotivoSalida); motivo != "" {
		tx = tx.Where("persona_ingreso_salida.motivo_salida = ?", strings.ToUpper(motivo))
	}
	if doc := strings.TrimSpace(q.Documento); doc != "" {
		tx = tx.Joins("LEFT JOIN personas ON personas.id = persona_ingreso_salida.persona_id").
			Where("personas.numero_documento LIKE ?", "%"+doc+"%")
	}
	switch strings.ToLower(strings.TrimSpace(q.Estado)) {
	case "abierto":
		tx = tx.Where("persona_ingreso_salida.timestamp_salida IS NULL AND persona_ingreso_salida.ingreso_cancelado = false")
	case "cerrado":
		tx = tx.Where("persona_ingreso_salida.timestamp_salida IS NOT NULL")
	}
	if q.SalidaSinIngreso != nil {
		tx = tx.Where("persona_ingreso_salida.salida_sin_ingreso = ?", *q.SalidaSinIngreso)
	}
	return tx
}

func (r *personaIngresoSalidaRepository) CountAbiertasBySede(sedeID *uint, regionalID *uint) (int64, error) {
	q := AccesoHistorialQuery{SedeID: sedeID, RegionalID: regionalID, Estado: "abierto"}
	var n int64
	err := r.baseQuery(q).Count(&n).Error
	return n, err
}

func (r *personaIngresoSalidaRepository) ListHistorial(q AccesoHistorialQuery) ([]models.PersonaIngresoSalida, int64, error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.PageSize
	if size < 1 {
		size = 25
	}
	if size > 200 {
		size = 200
	}

	var total int64
	if err := r.baseQuery(q).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []models.PersonaIngresoSalida
	err := r.baseQuery(q).
		Select("persona_ingreso_salida.*").
		Preload("Persona").
		Preload("Sede").
		Preload("Sede.Regional").
		Order("persona_ingreso_salida.timestamp_entrada DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&rows).Error
	return rows, total, err
}

type accesoStatsKV struct {
	K string
	N int64
}

type accesoStatsHoraKV struct {
	Hora int
	N    int64
}

func (r *personaIngresoSalidaRepository) countAccesoQuery(q AccesoHistorialQuery, dest *int64) error {
	return r.baseQuery(q).Count(dest).Error
}

func fillAccesoStatsMap(dest map[string]int64, rows []accesoStatsKV) {
	for _, row := range rows {
		dest[row.K] = row.N
	}
}

func fillAccesoHoras(dest *[24]int64, rows []accesoStatsHoraKV) {
	for _, row := range rows {
		if row.Hora < 0 || row.Hora >= 24 {
			continue
		}
		dest[row.Hora] = row.N
	}
}

func (r *personaIngresoSalidaRepository) scanAccesoGroupCounts(
	q AccesoHistorialQuery,
	selectSQL string,
	groupSQL string,
	extraWhere string,
) ([]accesoStatsKV, error) {
	var rows []accesoStatsKV
	db := r.baseQuery(q).Select(selectSQL)
	if extraWhere != "" {
		db = db.Where(extraWhere)
	}
	err := db.Group(groupSQL).Scan(&rows).Error
	return rows, err
}

func (r *personaIngresoSalidaRepository) scanAccesoHoras(
	q AccesoHistorialQuery,
	selectSQL string,
	groupSQL string,
	extraWhere string,
) ([]accesoStatsHoraKV, error) {
	var rows []accesoStatsHoraKV
	db := r.baseQuery(q).Select(selectSQL)
	if extraWhere != "" {
		db = db.Where(extraWhere)
	}
	err := db.Group(groupSQL).Scan(&rows).Error
	return rows, err
}

func (r *personaIngresoSalidaRepository) fillAccesoStatsCounts(q AccesoHistorialQuery, out *AccesoStatsResult) error {
	if err := r.countAccesoQuery(q, &out.TotalIngresos); err != nil {
		return err
	}

	qCerrado := q
	qCerrado.Estado = "cerrado"
	if err := r.countAccesoQuery(qCerrado, &out.TotalSalidas); err != nil {
		return err
	}
	out.Cerradas = out.TotalSalidas

	qAbierto := q
	qAbierto.Estado = "abierto"
	if err := r.countAccesoQuery(qAbierto, &out.Abiertas); err != nil {
		return err
	}

	flag := true
	qSin := q
	qSin.SalidaSinIngreso = &flag
	return r.countAccesoQuery(qSin, &out.SinIngreso)
}

func (r *personaIngresoSalidaRepository) fillAccesoStatsDistribuciones(q AccesoHistorialQuery, out *AccesoStatsResult) error {
	qCerrado := q
	qCerrado.Estado = "cerrado"

	tipos, err := r.scanAccesoGroupCounts(
		q,
		"persona_ingreso_salida.tipo_persona as k, COUNT(*) as n",
		"persona_ingreso_salida.tipo_persona",
		"",
	)
	if err != nil {
		return err
	}
	fillAccesoStatsMap(out.PorTipo, tipos)

	motivos, err := r.scanAccesoGroupCounts(
		qCerrado,
		"persona_ingreso_salida.motivo_salida as k, COUNT(*) as n",
		"persona_ingreso_salida.motivo_salida",
		"persona_ingreso_salida.motivo_salida <> ''",
	)
	if err != nil {
		return err
	}
	fillAccesoStatsMap(out.PorMotivo, motivos)

	metodos, err := r.scanAccesoGroupCounts(
		q,
		"persona_ingreso_salida.metodo_registro as k, COUNT(*) as n",
		"persona_ingreso_salida.metodo_registro",
		"",
	)
	if err != nil {
		return err
	}
	fillAccesoStatsMap(out.PorMetodo, metodos)
	return nil
}

func (r *personaIngresoSalidaRepository) fillAccesoStatsHoras(q AccesoHistorialQuery, out *AccesoStatsResult) error {
	qCerrado := q
	qCerrado.Estado = "cerrado"

	ingresosH, err := r.scanAccesoHoras(
		q,
		"EXTRACT(HOUR FROM persona_ingreso_salida.timestamp_entrada)::int as hora, COUNT(*) as n",
		"EXTRACT(HOUR FROM persona_ingreso_salida.timestamp_entrada)",
		"",
	)
	if err != nil {
		return err
	}
	fillAccesoHoras(&out.IngresosPorHora, ingresosH)

	salidasH, err := r.scanAccesoHoras(
		qCerrado,
		"EXTRACT(HOUR FROM persona_ingreso_salida.timestamp_salida)::int as hora, COUNT(*) as n",
		"EXTRACT(HOUR FROM persona_ingreso_salida.timestamp_salida)",
		"persona_ingreso_salida.timestamp_salida IS NOT NULL",
	)
	if err != nil {
		return err
	}
	fillAccesoHoras(&out.SalidasPorHora, salidasH)
	return nil
}

func (r *personaIngresoSalidaRepository) StatsHistorial(q AccesoHistorialQuery) (AccesoStatsResult, error) {
	out := AccesoStatsResult{
		PorTipo:   map[string]int64{},
		PorMotivo: map[string]int64{},
		PorMetodo: map[string]int64{},
	}
	if err := r.fillAccesoStatsCounts(q, &out); err != nil {
		return out, err
	}
	if err := r.fillAccesoStatsDistribuciones(q, &out); err != nil {
		return out, err
	}
	if err := r.fillAccesoStatsHoras(q, &out); err != nil {
		return out, err
	}
	return out, nil
}
