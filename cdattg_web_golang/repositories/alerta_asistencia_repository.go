package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// AlertaAsistenciaRepository acceso a alertas_asistencia_log
type AlertaAsistenciaRepository interface {
	ExistsByFichaIDAndFecha(fichaID uint, fecha time.Time) (bool, error)
	Create(log *models.AlertaAsistenciaLog) error
}

type alertaAsistenciaRepository struct {
	db *gorm.DB
}

func NewAlertaAsistenciaRepository() AlertaAsistenciaRepository {
	return &alertaAsistenciaRepository{db: database.GetDB()}
}

func (r *alertaAsistenciaRepository) ExistsByFichaIDAndFecha(fichaID uint, fecha time.Time) (bool, error) {
	var count int64
	fechaDate := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	if err := r.db.Model(&models.AlertaAsistenciaLog{}).Where("ficha_id = ? AND fecha = ?", fichaID, fechaDate).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *alertaAsistenciaRepository) Create(log *models.AlertaAsistenciaLog) error {
	return r.db.Create(log).Error
}
