package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/models/complementarios"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Initialize() error {
	dsn := config.GetDSN()
	
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		return err
	}

	log.Println("Conexión a base de datos establecida exitosamente")
	return nil
}

// ResetInventarioTablesForDev: inventario desactivado, no hace nada.
func ResetInventarioTablesForDev() error {
	return nil
}

// DropSpatieTables elimina tablas de roles/permisos (Spatie). Roles y permisos viven solo en Casbin.
func DropSpatieTables() error {
	for _, t := range []string{"model_has_roles", "model_has_permissions", "role_has_permissions", "roles", "permissions"} {
		if err := DB.Exec("DROP TABLE IF EXISTS " + t + " CASCADE").Error; err != nil {
			log.Printf("Advertencia: al eliminar %s: %v", t, err)
		}
	}
	return nil
}

// Migrate ejecuta las migraciones de todos los modelos
func Migrate() error {
	log.Println("Ejecutando migraciones...")
	if err := DropSpatieTables(); err != nil {
		return err
	}
	if err := ResetInventarioTablesForDev(); err != nil {
		return err
	}
	err := DB.AutoMigrate(
		// Autenticación (roles/permisos solo en Casbin)
		&models.User{},
		
		// Ubicaciones geográficas
		&models.Pais{},
		&models.Departamento{},
		&models.Municipio{},
		
		// Personas
		&models.Persona{},
		&models.PersonaImportLog{},
		&models.InstructorImportLog{},
		
		// Infraestructura
		&models.Regional{},
		&models.Sede{},
		&models.Bloque{},
		&models.Piso{},
		&models.Ambiente{},
		&models.CentroFormacion{},
		
		// Formación
		&models.TipoPrograma{},
		&models.NivelFormacion{},
		&models.ModalidadFormacion{},
		&models.Programa{},
		&models.ProgramaFormacion{},
		&models.RedConocimiento{},
		&models.FichaCaracterizacion{},
		
		// Personas del sistema
		&models.Instructor{},
		&models.Aprendiz{},
		
		// Competencias
		&models.Competencia{},
		&models.ResultadosAprendizaje{},
		&models.CompetenciaPrograma{},
		&models.ResultadosCompetencia{},
		
		// Guías
		&models.GuiasAprendizaje{},
		&models.GuiaAprendizajeRap{},
		&models.EvidenciaGuiaAprendizaje{},
		&models.GuiasResultados{},
		
		// Días de formación
		&models.DiasFormacion{},
		&models.FichaDiasFormacion{},
		&models.InstructorFichaDias{},
		
		// Asignaciones
		&models.AsignacionInstructor{},
		&models.AsignacionInstructorLog{},
		&models.InstructorFichaCaracterizacion{},
		
		// Asistencias
		&models.Asistencia{},
		&models.AsistenciaAprendiz{},
		&models.Evidencia{},
		
		// Entrada/Salida
		&models.EntradaSalida{},
		&models.PersonaIngresoSalida{},
		&models.ReporteSalidaAutomatica{},
		
		// Catálogos (tablas por tema; antes tema-parametro)
		&models.TipoDocumento{},
		&models.Genero{},
		&models.PersonaCaracterizacion{},
		&models.Jornada{},
		&models.Modalidad{},

		// Inventario desactivado: no se migran tablas de inventario

		// Complementarios
		&complementarios.ComplementarioOfertado{},
		&complementarios.ComplementarioCatalogo{},
		&complementarios.AspiranteComplementario{},
		&complementarios.CategoriaCaracterizacionComplementario{},
		&complementarios.PersonaCaracterizacion{},
		&complementarios.SofiaValidationProgress{},
		&complementarios.SenasofiaplusValidationLog{},
		
		// Otros
		&models.Login{},
		&models.RegistroActividades{},
		&models.PersonaContactAlert{},
		&models.PersonaImport{},
		&models.PersonaImportIssue{},
	)
	
	if err != nil {
		return err
	}
	
	log.Println("Migraciones completadas exitosamente")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
