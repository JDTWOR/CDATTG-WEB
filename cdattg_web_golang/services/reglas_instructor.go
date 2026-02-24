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
	Principal   *uint   `json:"principal"`
	Secundarias []uint  `json:"secundarias"`
}

// ValidarAsignacionInstructor aplica reglas de negocio para asignar un instructor a una ficha
func ValidarAsignacionInstructor(
	instructorID, fichaID uint,
	esLider bool,
	instRepo repositories.InstructorRepository,
	fichaRepo repositories.FichaRepository,
	instFichaRepo repositories.InstructorFichaRepository,
) error {
	cfg := config.AppConfig.Negocio

	instructor, err := instRepo.FindByID(instructorID)
	if err != nil {
		return errors.New("instructor no encontrado")
	}
	if !instructor.Status {
		return errors.New("el instructor está inactivo")
	}

	ficha, err := fichaRepo.FindByID(fichaID)
	if err != nil {
		return errors.New("ficha no encontrada")
	}
	if !ficha.Status {
		return errors.New("la ficha no está activa")
	}

	// 1. Límite de fichas activas (máximo 5)
	count, err := instFichaRepo.CountActiveFichasByInstructorID(instructorID)
	if err != nil {
		return fmt.Errorf("error al contar fichas del instructor: %w", err)
	}
	// Si ya está asignado a esta ficha (actualización), no sumar una más
	exist, _ := instFichaRepo.FindByFichaIDAndInstructorID(fichaID, instructorID)
	if exist == nil && count >= cfg.MaxFichasActivas {
		return fmt.Errorf("el instructor no puede tener más de %d fichas activas (tiene %d)", cfg.MaxFichasActivas, count)
	}

	// 2. Experiencia mínima (1 año configurable)
	if cfg.ExperienciaMinimaAnios > 0 {
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
			return fmt.Errorf("el instructor debe tener al menos %d año(s) de experiencia (tiene el equivalente a %d)", cfg.ExperienciaMinimaAnios, equivAnos)
		}
	}

	// 3. Regional: la regional del instructor debe coincidir con la de la ficha (vía sede)
	if ficha.Sede != nil && ficha.Sede.RegionalID != nil && *ficha.Sede.RegionalID != 0 {
		if instructor.RegionalID == nil || *instructor.RegionalID != *ficha.Sede.RegionalID {
			return errors.New("la regional del instructor no coincide con la regional de la sede de la ficha")
		}
	}

	// 4. Especialidad (red de conocimiento): el instructor debe tener la especialidad del programa, salvo si es líder.
	// Desactivado por defecto (ValidarEspecialidadInstructor=false); activar a futuro con NEGOCIO_VALIDAR_ESPECIALIDAD_INSTRUCTOR=true
	if cfg.ValidarEspecialidadInstructor && !esLider && ficha.ProgramaFormacion != nil && ficha.ProgramaFormacion.RedConocimientoID != nil && *ficha.ProgramaFormacion.RedConocimientoID != 0 {
		redID := *ficha.ProgramaFormacion.RedConocimientoID
		var esp especialidadesJSON
		if instructor.Especialidades != "" {
			_ = json.Unmarshal([]byte(instructor.Especialidades), &esp)
		}
		tiene := false
		if esp.Principal != nil && *esp.Principal == redID {
			tiene = true
		}
		for _, id := range esp.Secundarias {
			if id == redID {
				tiene = true
				break
			}
		}
		if !tiene {
			return errors.New("el instructor no tiene la especialidad (red de conocimiento) requerida por el programa de la ficha")
		}
	}

	return nil
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
