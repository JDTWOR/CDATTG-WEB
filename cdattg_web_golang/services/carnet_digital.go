/**
 * Arma el carnet digital del aprendiz con sus fichas vigentes.
 * Lo hice para que, si la ficha ya venció, el carnet no le sirva.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const (
	carnetCentroCDATTG       = "Centro de Desarrollo Agroindustrial Turístico y Tecnológico del Guaviare."
	carnetMotivoSinVigente   = "sin_ficha_vigente"
	carnetMotivoSinSolicitud = "sin_solicitud"
	carnetMotivoPendiente    = "pendiente_validacion"
)

// CarnetDigitalService consulta el carnet del aprendiz autenticado.
type CarnetDigitalService interface {
	ObtenerMiCarnet(personaID uint) (*dto.CarnetDigitalResponse, error)
	Solicitar(personaID, fichaID uint) (*dto.CarnetDigitalResponse, error)
	ListarPendientes(instructorID uint) ([]dto.CarnetPendienteItem, error)
	Decidir(instructorID, solicitudID uint, aprobar bool, motivo string) error
	LeerFotoPublicada(personaID, fichaID uint) (*PersonaFotoArchivo, error)
	LeerFotoSolicitud(instructorID, solicitudID uint) (*PersonaFotoArchivo, error)
	VerSolicitud(instructorID, solicitudID uint) (*dto.CarnetVistaInstructor, error)
	ListarBiblioteca(fichaID uint) (*dto.CarnetBibliotecaResponse, error)
	LeerFotoBiblioteca(solicitudID uint) (*PersonaFotoArchivo, error)
	LeerFotoBibliotecaPorDocumento(documento string) (*PersonaFotoArchivo, error)
	ExcelBiblioteca(fichaID uint) ([]byte, error)
}

type carnetDigitalService struct {
	personaRepo   repositories.PersonaRepository
	aprendizRepo  repositories.AprendizRepository
	solicitudRepo repositories.CarnetSolicitudRepository
	fichaRepo     repositories.FichaRepository
}

// NewCarnetDigitalService crea el servicio del carnet.
func NewCarnetDigitalService() CarnetDigitalService {
	return &carnetDigitalService{
		personaRepo:   repositories.NewPersonaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
		solicitudRepo: repositories.NewCarnetSolicitudRepository(),
		fichaRepo:     repositories.NewFichaRepository(),
	}
}

// ObtenerMiCarnet solo publica datos si el instructor líder ya aprobó.
func (s *carnetDigitalService) ObtenerMiCarnet(personaID uint) (*dto.CarnetDigitalResponse, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}
	hoy := time.Now()
	matriculas, err := s.aprendizRepo.FindActivosByPersonaID(personaID)
	if err != nil {
		return nil, err
	}
	fichas := fichasVigentesDeCarnet(matriculas, hoy)
	aprobada, _ := s.solicitudRepo.FindUltimaAprobadaByPersonaID(personaID)
	ultimas, _ := s.solicitudRepo.FindUltimasPorPersona(personaID)
	aplicarEstadosFichas(fichas, ultimas, datosListosParaCarnet(*persona))
	return armarRespuestaCarnet(*persona, fichas, aprobada), nil
}

func personaACarnetDatos(p models.Persona) dto.CarnetPersonaDatos {
	nombres := strings.TrimSpace(p.PrimerNombre + " " + p.SegundoNombre)
	apellidos := strings.TrimSpace(p.PrimerApellido + " " + p.SegundoApellido)
	return dto.CarnetPersonaDatos{
		Nombres:            strings.ToUpper(nombres),
		Apellidos:          strings.ToUpper(apellidos),
		NumeroDocumento:    p.NumeroDocumento,
		TipoDocumentoLabel: "CC",
		Rh:                 p.Rh,
		TieneFoto:          p.FotoPath != "",
	}
}

func fichasVigentesDeCarnet(matriculas []models.Aprendiz, hoy time.Time) []dto.CarnetFichaOpcion {
	out := make([]dto.CarnetFichaOpcion, 0, len(matriculas))
	for i := range matriculas {
		ficha := matriculas[i].FichaCaracterizacion
		if !fichaSirveParaCarnet(ficha, hoy) {
			continue
		}
		out = append(out, fichaACarnetOpcion(ficha))
	}
	return out
}

func fichaSirveParaCarnet(ficha *models.FichaCaracterizacion, hoy time.Time) bool {
	if ficha == nil || !ficha.Status {
		return false
	}
	return !fechaFinVencida(ficha.FechaFin, hoy)
}

func fichaACarnetOpcion(ficha *models.FichaCaracterizacion) dto.CarnetFichaOpcion {
	programa := strings.TrimSpace(ficha.Nombre)
	if ficha.ProgramaFormacion != nil && strings.TrimSpace(ficha.ProgramaFormacion.Nombre) != "" {
		programa = ficha.ProgramaFormacion.Nombre
	}
	regional := regionalDeFicha(ficha)
	vence := ""
	if ficha.FechaFin != nil {
		vence = ficha.FechaFin.Format(time.DateOnly)
	}
	return dto.CarnetFichaOpcion{
		ID:            ficha.ID,
		Numero:        ficha.Ficha,
		Programa:      programa,
		FechaFin:      vence,
		Regional:      regional,
		CentroNombre:  carnetCentroCDATTG,
		TipoFormacion: ficha.TipoFormacion,
		TipoLabel:     etiquetaTipoFormacion(ficha.TipoFormacion),
	}
}
