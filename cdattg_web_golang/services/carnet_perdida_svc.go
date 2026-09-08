/**
 * Contrato y armado de respuestas del submódulo de pérdida de carnet.
 * Crear (aprendiz) y decidir (bibliotecario) viven en archivos aparte.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// CarnetPerdidaService orquesta el flujo de reposición física.
type CarnetPerdidaService interface {
	Crear(personaID, fichaID uint, pago, demanda []byte) (*dto.CarnetPerdidaItem, error)
	Decidir(userID, solicitudID uint, aprobar bool, motivo string) (*dto.CarnetPerdidaItem, error)
	// Renovar cierra la reposición cuando se entrega el carnet renovado.
	Renovar(userID, solicitudID uint) (*dto.CarnetPerdidaItem, error)
	// NotificarDisponible avisa al aprendiz que puede recoger su carnet.
	NotificarDisponible(solicitudID uint) error
	MiHistorial(personaID uint) ([]dto.CarnetPerdidaItem, error)
	Revisiones(estado string, limit, offset int) ([]dto.CarnetPerdidaRevision, int64, error)
	LeerComprobante(solicitudID uint, tipo string) (*ArchivoComprobante, error)
	LeerComprobantesZip(solicitudID uint) ([]byte, error)
	LeerFoto(solicitudID uint) (*PersonaFotoArchivo, error)
	LeerFotoZip(solicitudID uint) ([]byte, error)
}

type carnetPerdidaService struct {
	perdidaRepo repositories.CarnetPerdidaRepository
	notif       *CarnetPerdidaNotificacion
	owner       personaFichasOwner
}

// NewCarnetPerdidaService crea el servicio con sus dependencias.
func NewCarnetPerdidaService() CarnetPerdidaService {
	return &carnetPerdidaService{
		perdidaRepo: repositories.NewCarnetPerdidaRepository(),
		notif:       NewCarnetPerdidaNotificacion(),
		owner:       NuevaPersonaFichasOwner(),
	}
}

// perdidaComprobantes lista los archivos (PDF o imagen) de la solicitud.
func perdidaComprobantes(sol models.CarnetPerdidaSolicitud) []dto.CarnetComprobante {
	out := make([]dto.CarnetComprobante, 0, 2)
	if sol.ComprobantePagoPath != "" {
		out = append(out, dto.CarnetComprobante{Tipo: "pago", Nombre: nombreBaseDeRuta(sol.ComprobantePagoPath)})
	}
	if sol.ComprobanteDemandaPath != "" {
		out = append(out, dto.CarnetComprobante{Tipo: "demanda", Nombre: nombreBaseDeRuta(sol.ComprobanteDemandaPath)})
	}
	return out
}

// perdidaEstadoLabel traduce el estado técnico a texto corto.
func perdidaEstadoLabel(estado string) string {
	switch estado {
	case models.CarnetPerdidaEstadoEspera:
		return "En espera de renovación física"
	case models.CarnetPerdidaEstadoDevuelto:
		return "Devuelta"
	case models.CarnetPerdidaEstadoRenovado:
		return "Renovado (historial)"
	default:
		return "Pendiente de revisión"
	}
}

func perdidaAItem(sol models.CarnetPerdidaSolicitud) dto.CarnetPerdidaItem {
	return dto.CarnetPerdidaItem{
		ID:                sol.ID,
		FichaNumero:       sol.FichaNumero,
		Programa:          sol.Programa,
		TipoFormacion:     sol.TipoFormacion,
		TipoLabel:         etiquetaTipoFormacion(sol.TipoFormacion),
		Estado:            sol.Estado,
		EstadoLabel:       perdidaEstadoLabel(sol.Estado),
		CorreccionDigital: sol.CorreccionDigital,
		MotivoRechazo:     sol.MotivoRechazo,
		Comprobantes:      perdidaComprobantes(sol),
		CreadaEn:          sol.CreatedAt.Format("2006-01-02 15:04"),
	}
}

func perdidaARevision(sol models.CarnetPerdidaSolicitud) dto.CarnetPerdidaRevision {
	return dto.CarnetPerdidaRevision{
		ID:                sol.ID,
		PersonaID:         sol.PersonaID,
		Nombres:           strings.TrimSpace(sol.Nombres),
		Apellidos:         strings.TrimSpace(sol.Apellidos),
		NumeroDocumento:   sol.NumeroDocumento,
		Rh:                sol.Rh,
		FichaID:           sol.FichaID,
		FichaNumero:       sol.FichaNumero,
		Programa:          sol.Programa,
		TipoFormacion:     sol.TipoFormacion,
		TipoLabel:         etiquetaTipoFormacion(sol.TipoFormacion),
		CorreccionDigital: sol.CorreccionDigital,
		MotivoRechazo:     sol.MotivoRechazo,
		Comprobantes:      perdidaComprobantes(sol),
	}
}
