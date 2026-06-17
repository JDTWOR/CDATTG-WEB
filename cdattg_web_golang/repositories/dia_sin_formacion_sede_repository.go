package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
)

type DiaSinFormacionSedeRepository interface {
	Create(row *models.DiaSinFormacionSede) error
	Update(row *models.DiaSinFormacionSede) error
	Delete(id uint) error
	FindByID(id uint) (*models.DiaSinFormacionSede, error)
	ListBySede(sedeID uint) ([]models.DiaSinFormacionSede, error)
	ListAll() ([]models.DiaSinFormacionSede, error)
	ExistsEnFecha(sedeID uint, fecha time.Time) (bool, string, error)
	FindEnRango(sedeID uint, desde, hasta time.Time) ([]models.DiaSinFormacionSede, error)
}

type diaSinFormacionSedeRepository struct{}

func NewDiaSinFormacionSedeRepository() DiaSinFormacionSedeRepository {
	return &diaSinFormacionSedeRepository{}
}

func (r *diaSinFormacionSedeRepository) Create(row *models.DiaSinFormacionSede) error {
	return database.GetDB().Create(row).Error
}

func (r *diaSinFormacionSedeRepository) Update(row *models.DiaSinFormacionSede) error {
	return database.GetDB().Save(row).Error
}

func (r *diaSinFormacionSedeRepository) Delete(id uint) error {
	return database.GetDB().Delete(&models.DiaSinFormacionSede{}, id).Error
}

func (r *diaSinFormacionSedeRepository) FindByID(id uint) (*models.DiaSinFormacionSede, error) {
	var row models.DiaSinFormacionSede
	if err := database.GetDB().Preload("Sede").First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *diaSinFormacionSedeRepository) ListBySede(sedeID uint) ([]models.DiaSinFormacionSede, error) {
	var list []models.DiaSinFormacionSede
	err := database.GetDB().Preload("Sede").
		Where("sede_id = ?", sedeID).
		Order("fecha_inicio DESC").
		Find(&list).Error
	return list, err
}

func (r *diaSinFormacionSedeRepository) ListAll() ([]models.DiaSinFormacionSede, error) {
	var list []models.DiaSinFormacionSede
	err := database.GetDB().Preload("Sede").Order("fecha_inicio DESC").Find(&list).Error
	return list, err
}

func (r *diaSinFormacionSedeRepository) ExistsEnFecha(sedeID uint, fecha time.Time) (bool, string, error) {
	db := database.GetDB()
	if db == nil {
		return false, "", nil
	}
	f := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	var row models.DiaSinFormacionSede
	err := database.GetDB().
		Where("sede_id = ? AND fecha_inicio <= ? AND fecha_fin >= ?", sedeID, f, f).
		Order("id DESC").
		First(&row).Error
	if err != nil {
		return false, "", nil
	}
	return true, row.Motivo, nil
}

func (r *diaSinFormacionSedeRepository) FindEnRango(sedeID uint, desde, hasta time.Time) ([]models.DiaSinFormacionSede, error) {
	var list []models.DiaSinFormacionSede
	err := database.GetDB().
		Where("sede_id = ? AND fecha_inicio <= ? AND fecha_fin >= ?", sedeID, hasta, desde).
		Order("fecha_inicio").
		Find(&list).Error
	return list, err
}
