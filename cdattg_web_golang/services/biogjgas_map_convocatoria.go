/**
 * services: mapeo convocatoria y actividad BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func convocatoriaAItem(c models.BiogjgasConvocatoria) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: c.ID, Titulo: c.Titulo, Tipo: c.Tipo, Descripcion: c.Descripcion, Requisitos: c.Requisitos,
		FechaApertura: fechaISO(c.FechaApertura), FechaCierre: fechaISO(c.FechaCierre),
		DocumentoURL: c.DocumentoURL, EnlaceExterno: c.EnlaceExterno,
		EstadoConvocatoria: c.EstadoConvocatoria, SemilleroID: c.SemilleroID,
		Orden: c.Orden, EstadoPublicacion: c.EstadoPublicacion,
	}
}

func itemAConvocatoria(req dto.BiogjgasItem, userID uint) (*models.BiogjgasConvocatoria, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	apertura, err := parseFechaOpcional(req.FechaApertura)
	if err != nil {
		return nil, err
	}
	cierre, err := parseFechaOpcional(req.FechaCierre)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.BiogjgasConvocatoria{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: strings.TrimSpace(req.Titulo), Tipo: req.Tipo, Descripcion: req.Descripcion,
		Requisitos: req.Requisitos, FechaApertura: apertura, FechaCierre: cierre,
		DocumentoURL: req.DocumentoURL, EnlaceExterno: EnlacePublicoSeguro(req.EnlaceExterno),
		EstadoConvocatoria: req.EstadoConvocatoria, SemilleroID: req.SemilleroID,
		Orden: req.Orden, EstadoPublicacion: estado,
	}, nil
}

func actividadAItem(a models.BiogjgasActividad) dto.BiogjgasItem {
	return dto.BiogjgasItem{
		ID: a.ID, Titulo: a.Titulo, Tipo: a.Tipo, Fecha: fechaISO(a.Fecha), Lugar: a.Lugar,
		Modalidad: a.Modalidad, Descripcion: a.Descripcion, SemilleroID: a.SemilleroID,
		EstadoActividad: a.EstadoActividad, Orden: a.Orden, EstadoPublicacion: a.EstadoPublicacion,
	}
}

func itemAActividad(req dto.BiogjgasItem, userID uint) (*models.BiogjgasActividad, error) {
	estado, err := estadoOBorrador(req.EstadoPublicacion)
	if err != nil {
		return nil, err
	}
	fecha, err := parseFechaOpcional(req.Fecha)
	if err != nil {
		return nil, err
	}
	uid := userID
	return &models.BiogjgasActividad{
		UserAuditModel: models.UserAuditModel{UserCreateID: &uid, UserEditID: &uid},
		Titulo: strings.TrimSpace(req.Titulo), Tipo: req.Tipo, Fecha: fecha, Lugar: req.Lugar,
		Modalidad: req.Modalidad, Descripcion: req.Descripcion, SemilleroID: req.SemilleroID,
		EstadoActividad: req.EstadoActividad, Orden: req.Orden, EstadoPublicacion: estado,
	}, nil
}
