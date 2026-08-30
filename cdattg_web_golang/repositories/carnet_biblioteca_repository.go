/**
 * Busco carnets regulares aprobados y el nombre del instructor líder.
 * Lo separé para no mezclarlo con la validación del instructor.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import "github.com/sena/cdattg-web-golang/models"

// FindAprobadosRegular trae solo formación regular ya validada.
func (r *carnetSolicitudRepository) FindAprobadosRegular() ([]models.CarnetSolicitud, error) {
	var list []models.CarnetSolicitud
	err := r.db.Where("estado = ? AND tipo_formacion = ?", models.CarnetEstadoAprobado, models.TipoFormacionRegular).
		Order("ficha_numero ASC, apellidos ASC, nombres ASC").
		Find(&list).Error
	return list, err
}

// FindAprobadoRegularPorDocumento busca por cédula el último regular aprobado.
// Lo pongo aquí porque la impresora pide la foto con el número de documento.
func (r *carnetSolicitudRepository) FindAprobadoRegularPorDocumento(documento string) (*models.CarnetSolicitud, error) {
	var s models.CarnetSolicitud
	err := r.db.Where("estado = ? AND tipo_formacion = ? AND numero_documento = ?", models.CarnetEstadoAprobado, models.TipoFormacionRegular, documento).
		Order("id DESC").First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// FindNombresLiderPorFicha arma el nombre del líder de cada ficha.
func (r *carnetSolicitudRepository) FindNombresLiderPorFicha(fichaIDs []uint) (map[uint]string, error) {
	out := map[uint]string{}
	if len(fichaIDs) == 0 {
		return out, nil
	}
	var rows []struct {
		ID     uint
		Nombre string
	}
	err := r.db.Table("fichas_caracterizacion AS f").
		Select("f.id, COALESCE(i.nombre_completo_cache, '') AS nombre").
		Joins("LEFT JOIN instructors i ON i.id = f.instructor_id").
		Where("f.id IN ?", fichaIDs).
		Scan(&rows).Error
	for i := range rows {
		out[rows[i].ID] = rows[i].Nombre
	}
	return out, err
}

// FindPersonasPorIDs trae nombres partidos para el Excel de biblioteca.
func (r *carnetSolicitudRepository) FindPersonasPorIDs(ids []uint) (map[uint]models.Persona, error) {
	out := map[uint]models.Persona{}
	if len(ids) == 0 {
		return out, nil
	}
	var list []models.Persona
	err := r.db.Where("id IN ?", ids).Find(&list).Error
	for i := range list {
		out[list[i].ID] = list[i]
	}
	return out, err
}
