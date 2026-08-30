/**
 * services: mapeo podcast y banner de investigación.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func podcastAItem(p models.BiogjgasPodcast) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: p.ID, Titulo: p.Titulo, Descripcion: p.Descripcion, AudioURL: p.AudioURL,
		Duracion: p.Duracion, Invitados: p.Invitados, PortadaURL: p.PortadaURL,
		Fecha: fechaISO(p.Fecha), Orden: p.Orden, EstadoPublicacion: p.EstadoPublicacion,
	}
}

func itemAPodcast(req dto.BiogjgasItem, userID uint) (*models.BiogjgasPodcast, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	fecha, err := parseFechaOpcional(req.Fecha)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.BiogjgasPodcast{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: strings.TrimSpace(req.Titulo), Descripcion: req.Descripcion, AudioURL: req.AudioURL,
		Duracion: req.Duracion, Invitados: req.Invitados, PortadaURL: req.PortadaURL,
		Fecha: fecha, Orden: req.Orden, EstadoPublicacion: estado,
	}, nil
}

func biogBannerAItem(b models.BiogjgasBanner) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: b.ID, Titulo: b.Titulo, Subtitulo: b.Subtitulo, ImagenURL: b.ImagenURL,
		EnlaceURL: b.EnlaceURL, Orden: b.Orden, VigenteDesde: fechaISO(b.VigenteDesde),
		VigenteHasta: fechaISO(b.VigenteHasta), EstadoPublicacion: b.EstadoPublicacion,
	}
}

func itemABiogBanner(req dto.BiogjgasItem, userID uint) (*models.BiogjgasBanner, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	desde, err := parseFechaOpcional(req.VigenteDesde)
	if err != nil {
		return nil, err
	}
	hasta, err := parseFechaOpcional(req.VigenteHasta)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.BiogjgasBanner{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: strings.TrimSpace(req.Titulo), Subtitulo: req.Subtitulo, ImagenURL: req.ImagenURL,
		EnlaceURL: EnlacePublicoSeguro(req.EnlaceURL), Orden: req.Orden,
		VigenteDesde: desde, VigenteHasta: hasta, EstadoPublicacion: estado,
	}, nil
}

func biogBannerAPortal(b models.BiogjgasBanner) dto.PortalBannerItem {
	boton := ""
	if b.EnlaceURL != "" {
		boton = "Ver más"
	}
	return dto.PortalBannerItem{
		ID: b.ID, Titulo: b.Titulo, Descripcion: b.Subtitulo, ImagenURL: b.ImagenURL,
		BotonTexto: boton, EnlaceURL: b.EnlaceURL, Orden: b.Orden,
		VigenteDesde: fechaISO(b.VigenteDesde), VigenteHasta: fechaISO(b.VigenteHasta),
		EstadoPublicacion: b.EstadoPublicacion,
	}
}
