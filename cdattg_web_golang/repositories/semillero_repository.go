/**
 * repositories: persistencia de semilleros y relaciones.
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// SemilleroRepository acceso a semilleros.
type SemilleroRepository interface {
	Listar() ([]models.Semillero, error)
	ListarPublicados() ([]models.Semillero, error)
	BuscarPorID(id uint) (*models.Semillero, error)
	BuscarPorSlug(slug string) (*models.Semillero, error)
	Crear(row *models.Semillero) error
	Guardar(row *models.Semillero) error
	Eliminar(id uint) error
	ReemplazarHijos(id uint, lineas []models.SemilleroLinea, integrantes []models.SemilleroIntegrante, proyectos []models.SemilleroProyecto) error
}

type semilleroRepository struct{ db *gorm.DB }

// NewSemilleroRepository constructor.
func NewSemilleroRepository() SemilleroRepository {
	return &semilleroRepository{db: database.GetDB()}
}

func (r *semilleroRepository) Listar() ([]models.Semillero, error) {
	var rows []models.Semillero
	err := r.db.Order("orden asc, nombre asc").Find(&rows).Error
	return rows, err
}

func (r *semilleroRepository) ListarPublicados() ([]models.Semillero, error) {
	var rows []models.Semillero
	err := r.db.Where("estado_publicacion = ?", models.PortalEstadoPublicado).Order("orden asc, nombre asc").Find(&rows).Error
	return rows, err
}

func (r *semilleroRepository) BuscarPorID(id uint) (*models.Semillero, error) {
	var row models.Semillero
	err := r.db.Preload("Lineas").Preload("Integrantes").Preload("Proyectos").First(&row, id).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *semilleroRepository) BuscarPorSlug(slug string) (*models.Semillero, error) {
	var row models.Semillero
	err := r.db.Preload("Lineas").Preload("Integrantes").Preload("Proyectos").
		Where("slug = ?", slug).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *semilleroRepository) Crear(row *models.Semillero) error {
	return r.db.Create(row).Error
}

func (r *semilleroRepository) Guardar(row *models.Semillero) error {
	return r.db.Save(row).Error
}

func (r *semilleroRepository) Eliminar(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := borrarHijosSemillero(tx, id); err != nil {
			return err
		}
		return tx.Delete(&models.Semillero{}, id).Error
	})
}
