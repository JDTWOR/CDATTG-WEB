/**
 * services: mapeo de modelos de portal y semillero a DTO.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func fechaISO(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format("2006-01-02")
	return &s
}

func bannerAItem(b models.PortalBanner) dto.PortalBannerItem {
	return dto.PortalBannerItem{
		ID: b.ID, Titulo: b.Titulo, Descripcion: b.Descripcion, ImagenURL: b.ImagenURL,
		Etiqueta: b.Etiqueta, BotonTexto: b.BotonTexto, EnlaceURL: b.EnlaceURL,
		Orden: b.Orden, VigenteDesde: fechaISO(b.VigenteDesde), VigenteHasta: fechaISO(b.VigenteHasta),
		EstadoPublicacion: b.EstadoPublicacion,
	}
}

func presentacionAItem(p models.PortalPresentacion) dto.PortalPresentacionItem {
	return dto.PortalPresentacionItem{
		ID: p.ID, Mision: p.Mision, Vision: p.Vision, ObjetivoGeneral: p.ObjetivoGeneral,
		Historia: p.Historia, VideoURL: p.VideoURL, PoliticasPDF: p.PoliticasPDF, Equipo: p.Equipo,
		EstadoPublicacion: p.EstadoPublicacion,
	}
}

func semilleroAItem(s models.Semillero, conHijos bool) dto.SemilleroItem {
	item := dto.SemilleroItem{
		ID: s.ID, Nombre: s.Nombre, Sigla: s.Sigla, Slug: s.Slug, Icono: s.Icono,
		ColorIdentidad: s.ColorIdentidad, Resumen: s.Resumen, Descripcion: s.Descripcion,
		Mision: s.Mision, Vision: s.Vision, Objetivos: s.Objetivos,
		InstructorLider: s.InstructorLider, CorreoContacto: s.CorreoContacto,
		ImagenURL: s.ImagenURL, Orden: s.Orden, EstadoPublicacion: s.EstadoPublicacion,
	}
	if !conHijos {
		return item
	}
	item.Lineas, item.Integrantes, item.Proyectos = mapearHijosSemillero(s, false)
	return item
}

func semilleroPublicoAItem(s models.Semillero) dto.SemilleroItem {
	item := semilleroAItem(s, false)
	item.Lineas, item.Integrantes, item.Proyectos = mapearHijosSemillero(s, true)
	return item
}
