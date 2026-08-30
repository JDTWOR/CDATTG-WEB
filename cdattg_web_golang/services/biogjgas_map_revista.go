/**
 * services: mapeo revista y boletín BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func revistaAItem(r models.BiogjgasRevista) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: r.ID, Titulo: r.Titulo, Slug: r.Slug, Volumen: r.Volumen, Numero: r.Numero,
		Anio: r.Anio, PortadaURL: r.PortadaURL, Editorial: r.Editorial, ISSN: r.ISSN,
		Articulos: r.Articulos, FechaPublicacion: fechaISO(r.FechaPublicacion),
		Orden: r.Orden, EstadoPublicacion: r.EstadoPublicacion,
	}
}

func itemARevista(req dto.BiogjgasItem, userID uint) (*models.BiogjgasRevista, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	fecha, err := parseFechaOpcional(req.FechaPublicacion)
	if err != nil {
		return nil, err
	}
	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = SlugDesdeNombre(req.Titulo)
	}
	uid := userID
	return &models.BiogjgasRevista{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Slug: slug, Titulo: strings.TrimSpace(req.Titulo), Volumen: req.Volumen, Numero: req.Numero,
		Anio: req.Anio, PortadaURL: req.PortadaURL, Editorial: req.Editorial, ISSN: req.ISSN,
		Articulos: req.Articulos, FechaPublicacion: fecha, Orden: req.Orden, EstadoPublicacion: estado,
	}, nil
}

func boletinAItem(b models.BiogjgasBoletin) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: b.ID, Titulo: b.Titulo, Numero: b.Numero, Fecha: fechaISO(b.Fecha), Resumen: b.Resumen,
		PDFURL: b.PDFURL, PortadaURL: b.PortadaURL, Tematica: b.Tematica,
		Orden: b.Orden, EstadoPublicacion: b.EstadoPublicacion,
	}
}

func itemABoletin(req dto.BiogjgasItem, userID uint) (*models.BiogjgasBoletin, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	fecha, err := parseFechaOpcional(req.Fecha)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.BiogjgasBoletin{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: strings.TrimSpace(req.Titulo), Numero: req.Numero, Fecha: fecha, Resumen: req.Resumen,
		PDFURL: req.PDFURL, PortadaURL: req.PortadaURL, Tematica: req.Tematica,
		Orden: req.Orden, EstadoPublicacion: estado,
	}, nil
}
