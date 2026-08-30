/**
 * services: mapeo de líneas, integrantes y proyectos del semillero.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func mapearHijosSemillero(s models.Semillero, soloPublicados bool) ([]dto.SemilleroLineaItem, []dto.SemilleroIntegranteItem, []dto.SemilleroProyectoItem) {
	var lineas []dto.SemilleroLineaItem
	for _, l := range s.Lineas {
		if soloPublicados && !models.PublicadoVisible(l.EstadoPublicacion) {
			continue
		}
		lineas = append(lineas, dto.SemilleroLineaItem{
			ID: l.ID, Nombre: l.Nombre, Descripcion: l.Descripcion, Orden: l.Orden,
			EstadoPublicacion: l.EstadoPublicacion,
		})
	}
	var integrantes []dto.SemilleroIntegranteItem
	for _, i := range s.Integrantes {
		if soloPublicados && !models.PublicadoVisible(i.EstadoPublicacion) {
			continue
		}
		integrantes = append(integrantes, dto.SemilleroIntegranteItem{
			ID: i.ID, Nombre: i.Nombre, Rol: i.Rol, Programa: i.Programa, Correo: i.Correo,
			Orden: i.Orden, EstadoPublicacion: i.EstadoPublicacion,
		})
	}
	var proyectos []dto.SemilleroProyectoItem
	for _, p := range s.Proyectos {
		if soloPublicados && !models.PublicadoVisible(p.EstadoPublicacion) {
			continue
		}
		proyectos = append(proyectos, dto.SemilleroProyectoItem{
			ID: p.ID, Titulo: p.Titulo, Resumen: p.Resumen, Descripcion: p.Descripcion,
			EstadoEjecucion: p.EstadoEjecucion, FechaInicio: fechaISO(p.FechaInicio),
			FechaFin: fechaISO(p.FechaFin), Anio: p.Anio, Orden: p.Orden,
			EstadoPublicacion: p.EstadoPublicacion,
		})
	}
	return lineas, integrantes, proyectos
}
