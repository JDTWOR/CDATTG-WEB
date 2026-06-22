package services

import (
	"sort"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

const msgInstructorSinAsignar = "Sin asignar"

// InstructorResponsableResolver determina quién debe tomar asistencia hoy en una ficha.
type InstructorResponsableResolver struct {
	calendario    *CalendarioFormacionService
	instFichaRepo repositories.InstructorFichaRepository
	fichaRepo     repositories.FichaRepository
}

func NewInstructorResponsableResolver(calendario *CalendarioFormacionService) *InstructorResponsableResolver {
	return &InstructorResponsableResolver{
		calendario:    calendario,
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		fichaRepo:     repositories.NewFichaRepository(),
	}
}

func instructorNombreFromModel(inst *models.Instructor) string {
	if inst == nil {
		return ""
	}
	if inst.Persona != nil {
		return inst.Persona.GetFullName()
	}
	return strings.TrimSpace(inst.NombreCompletoCache)
}

func (r *InstructorResponsableResolver) nombreFromInstructorFichas(ficha *models.FichaCaracterizacion, instructorID uint) string {
	for j := range ficha.InstructorFichas {
		if ficha.InstructorFichas[j].InstructorID != instructorID || ficha.InstructorFichas[j].Instructor == nil {
			continue
		}
		return instructorNombreFromModel(ficha.InstructorFichas[j].Instructor)
	}
	return ""
}

func (r *InstructorResponsableResolver) nombreInstructorFicha(ifc models.InstructorFichaCaracterizacion, fichaID uint) string {
	if ifc.Instructor != nil {
		if nombre := instructorNombreFromModel(ifc.Instructor); nombre != "" {
			return nombre
		}
	}
	ficha, errInst := r.fichaRepo.FindByIDWithInstructoresAndAprendices(fichaID)
	if errInst != nil || ficha == nil {
		return ""
	}
	return r.nombreFromInstructorFichas(ficha, ifc.InstructorID)
}

func (r *InstructorResponsableResolver) fallbackInstructorPrincipal(ficha models.FichaCaracterizacion) (string, *uint) {
	if ficha.InstructorID == nil || *ficha.InstructorID == 0 {
		return msgInstructorSinAsignar, nil
	}
	full, err := r.fichaRepo.FindByID(ficha.ID)
	if err != nil || full == nil || full.Instructor == nil {
		return msgInstructorSinAsignar, nil
	}
	return instructorNombreFromModel(full.Instructor), ficha.InstructorID
}

func parseFechaDashboard(fecha string) time.Time {
	loc := utils.AppLocation()
	fechaT, err := time.ParseInLocation(time.DateOnly, fecha, loc)
	if err != nil {
		return time.Now().In(loc)
	}
	return fechaT
}

func (r *InstructorResponsableResolver) collectNombresInstructoresSesion(
	ficha models.FichaCaracterizacion,
	fechaT time.Time,
) ([]string, *uint) {
	list, err := r.instFichaRepo.FindByFichaID(ficha.ID)
	if err != nil {
		list = nil
	}
	nombres := make([]string, 0)
	var firstID *uint
	for i := range list {
		ifc := list[i]
		if !r.calendario.EsSesionFormacionValida(ficha.ID, ifc.InstructorID, fechaT) {
			continue
		}
		nombre := r.nombreInstructorFicha(ifc, ficha.ID)
		if nombre == "" {
			continue
		}
		nombres = append(nombres, nombre)
		if firstID == nil {
			id := ifc.InstructorID
			firstID = &id
		}
	}
	return nombres, firstID
}

func (r *InstructorResponsableResolver) NombresParaFicha(ficha models.FichaCaracterizacion, fecha string) (string, *uint) {
	nombres, firstID := r.collectNombresInstructoresSesion(ficha, parseFechaDashboard(fecha))
	if len(nombres) == 0 {
		return r.fallbackInstructorPrincipal(ficha)
	}
	sort.Strings(nombres)
	return strings.Join(nombres, ", "), firstID
}
