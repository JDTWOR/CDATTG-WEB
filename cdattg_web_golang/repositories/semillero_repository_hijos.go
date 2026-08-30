/**
 * repositories: líneas, integrantes y proyectos de un semillero.
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const whereSemilleroID = "semillero_id = ?"

// borrarHijosSemillero elimina líneas, integrantes y proyectos.
func borrarHijosSemillero(tx *gorm.DB, id uint) error {
	modelos := []any{
		&models.SemilleroLinea{},
		&models.SemilleroIntegrante{},
		&models.SemilleroProyecto{},
	}
	for _, m := range modelos {
		if err := tx.Where(whereSemilleroID, id).Delete(m).Error; err != nil {
			return err
		}
	}
	return nil
}

// crearHijos inserta filas asignando el semillero padre.
func crearHijos[T any](tx *gorm.DB, rows []T, asignar func(*T)) error {
	for i := range rows {
		asignar(&rows[i])
		if err := tx.Create(&rows[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *semilleroRepository) ReemplazarHijos(
	id uint,
	lineas []models.SemilleroLinea,
	integrantes []models.SemilleroIntegrante,
	proyectos []models.SemilleroProyecto,
) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := borrarHijosSemillero(tx, id); err != nil {
			return err
		}
		if err := crearHijos(tx, lineas, func(l *models.SemilleroLinea) { l.SemilleroID = id }); err != nil {
			return err
		}
		if err := crearHijos(tx, integrantes, func(p *models.SemilleroIntegrante) { p.SemilleroID = id }); err != nil {
			return err
		}
		return crearHijos(tx, proyectos, func(p *models.SemilleroProyecto) { p.SemilleroID = id })
	})
}
