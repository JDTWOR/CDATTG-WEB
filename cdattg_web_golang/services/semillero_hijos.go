/**
 * services: hijos (líneas, integrantes, proyectos) de un semillero.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func estadoHijo(raw string) string {
	e := strings.TrimSpace(raw)
	if e == "" {
		return models.PortalEstadoPublicado
	}
	return e
}

func hijosLineas(req dto.SemilleroRequest) []models.SemilleroLinea {
	out := make([]models.SemilleroLinea, 0, len(req.Lineas))
	for _, l := range req.Lineas {
		nombre := strings.TrimSpace(l.Nombre)
		if nombre == "" {
			continue
		}
		out = append(out, models.SemilleroLinea{
			Nombre: nombre, Descripcion: l.Descripcion, Orden: l.Orden,
			EstadoPublicacion: estadoHijo(l.EstadoPublicacion),
		})
	}
	return out
}

func hijosIntegrantes(req dto.SemilleroRequest) []models.SemilleroIntegrante {
	out := make([]models.SemilleroIntegrante, 0, len(req.Integrantes))
	for _, i := range req.Integrantes {
		nombre := strings.TrimSpace(i.Nombre)
		if nombre == "" {
			continue
		}
		out = append(out, models.SemilleroIntegrante{
			Nombre: nombre, Rol: i.Rol, Programa: i.Programa,
			Correo: strings.ToLower(strings.TrimSpace(i.Correo)), Orden: i.Orden,
			EstadoPublicacion: estadoHijo(i.EstadoPublicacion),
		})
	}
	return out
}

func hijosProyectos(req dto.SemilleroRequest) []models.SemilleroProyecto {
	out := make([]models.SemilleroProyecto, 0, len(req.Proyectos))
	for _, p := range req.Proyectos {
		titulo := strings.TrimSpace(p.Titulo)
		if titulo == "" {
			continue
		}
		inicio, _ := parseFechaOpcional(p.FechaInicio)
		fin, _ := parseFechaOpcional(p.FechaFin)
		out = append(out, models.SemilleroProyecto{
			Titulo: titulo, Resumen: p.Resumen, Descripcion: p.Descripcion,
			EstadoEjecucion: p.EstadoEjecucion, FechaInicio: inicio, FechaFin: fin,
			Anio: p.Anio, Orden: p.Orden, EstadoPublicacion: estadoHijo(p.EstadoPublicacion),
		})
	}
	return out
}
