package services

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// es especialidades JSON: {"principal": <id>, "secundarias": [id, ...]}
type especialidadesJSON struct {
	Principal   *uint  `json:"principal"`
	Secundarias []uint `json:"secundarias"`
}

// ValidarAsignacionInstructor aplica reglas de negocio para asignar un instructor a una ficha
func ValidarAsignacionInstructor(
	instructorID, fichaID uint,
	esInstructorLider bool,
	instRepo repositories.InstructorRepository,
	fichaRepo repositories.FichaRepository,
	instFichaRepo repositories.InstructorFichaRepository,
) error {
	cfg := config.AppConfig.Negocio

	instructor, err := instRepo.FindByID(instructorID)
	if err != nil {
		return errors.New("instructor no encontrado")
	}
	if err := validarInstructorAsignable(instructor); err != nil {
		return err
	}

	ficha, err := fichaRepo.FindByID(fichaID)
	if err != nil {
		return errors.New("ficha no encontrada")
	}
	if err := validarFichaAsignable(ficha); err != nil {
		return err
	}

	if err := validarExperienciaMinimaInstructor(cfg, instructor); err != nil {
		return err
	}
	if err := validarRegionalInstructorFicha(instructor, ficha); err != nil {
		return err
	}
	return validarEspecialidadInstructorFicha(cfg, esInstructorLider, instructor, ficha)
}

func validarInstructorAsignable(instructor *models.Instructor) error {
	if !instructor.Status {
		return errors.New("el instructor está inactivo")
	}
	return nil
}

func validarFichaAsignable(ficha *models.FichaCaracterizacion) error {
	if !ficha.Status {
		return errors.New("la ficha no está activa")
	}
	return nil
}

func validarExperienciaMinimaInstructor(cfg config.NegocioConfig, instructor *models.Instructor) error {
	if cfg.ExperienciaMinimaAnios <= 0 {
		return nil
	}
	anos := 0
	if instructor.AnosExperiencia != nil {
		anos = *instructor.AnosExperiencia
	}
	meses := 0
	if instructor.ExperienciaInstructorMeses != nil {
		meses = *instructor.ExperienciaInstructorMeses
	}
	equivAnos := anos + meses/12
	if equivAnos < cfg.ExperienciaMinimaAnios {
		return fmt.Errorf(
			"el instructor debe tener al menos %d año(s) de experiencia (tiene el equivalente a %d)",
			cfg.ExperienciaMinimaAnios,
			equivAnos,
		)
	}
	return nil
}

func validarRegionalInstructorFicha(instructor *models.Instructor, ficha *models.FichaCaracterizacion) error {
	if ficha.Sede == nil || ficha.Sede.RegionalID == nil || *ficha.Sede.RegionalID == 0 {
		return nil
	}
	if instructor.RegionalID == nil || *instructor.RegionalID != *ficha.Sede.RegionalID {
		return errors.New("la regional del instructor no coincide con la regional de la sede de la ficha")
	}
	return nil
}

func validarEspecialidadInstructorFicha(
	cfg config.NegocioConfig,
	esInstructorLider bool,
	instructor *models.Instructor,
	ficha *models.FichaCaracterizacion,
) error {
	if !cfg.ValidarEspecialidadInstructor || esInstructorLider {
		return nil
	}
	if ficha.ProgramaFormacion == nil ||
		ficha.ProgramaFormacion.RedConocimientoID == nil ||
		*ficha.ProgramaFormacion.RedConocimientoID == 0 {
		return nil
	}
	redID := *ficha.ProgramaFormacion.RedConocimientoID
	if !instructorTieneRedConocimiento(instructor, redID) {
		return errors.New("el instructor no tiene la especialidad (red de conocimiento) requerida por el programa de la ficha")
	}
	return nil
}

func instructorTieneRedConocimiento(instructor *models.Instructor, redID uint) bool {
	var esp especialidadesJSON
	if instructor.Especialidades != "" {
		_ = json.Unmarshal([]byte(instructor.Especialidades), &esp)
	}
	if esp.Principal != nil && *esp.Principal == redID {
		return true
	}
	for _, id := range esp.Secundarias {
		if id == redID {
			return true
		}
	}
	return false
}

// SincronizarInstructorLiderEnPivote asegura que el instructor líder de la ficha exista en instructor_ficha
func SincronizarInstructorLiderEnPivote(
	f *models.FichaCaracterizacion,
	instFichaRepo repositories.InstructorFichaRepository,
) error {
	if f.InstructorID == nil || *f.InstructorID == 0 {
		return nil
	}
	exist, err := instFichaRepo.FindByFichaIDAndInstructorID(f.ID, *f.InstructorID)
	if err == nil && exist != nil {
		// Actualizar fechas/horas si cambió la ficha
		exist.FechaInicio = f.FechaInicio
		exist.FechaFin = f.FechaFin
		return instFichaRepo.Update(exist)
	}
	// Crear registro en pivote
	pivote := models.InstructorFichaCaracterizacion{
		InstructorID: *f.InstructorID,
		FichaID:      f.ID,
		FechaInicio:  f.FechaInicio,
		FechaFin:     f.FechaFin,
	}
	return instFichaRepo.Create(&pivote)
}
