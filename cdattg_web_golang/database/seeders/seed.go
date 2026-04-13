package seeders

import (
	"fmt"
	"log"

	"github.com/sena/cdattg-web-golang/database"
	"gorm.io/gorm"
)

// RunAll ejecuta migraciones y todos los seeders en orden (igual que cdattg_web DatabaseSeeder).
func RunAll() error {
	db := database.GetDB()
	if db == nil {
		return fmt.Errorf("base de datos no inicializada: ejecute database.Initialize() antes de los seeders")
	}

	if err := database.Migrate(); err != nil {
		return err
	}

	steps := []func(*gorm.DB) error{
		RunRolePermissionSeeder,
		RunRegionalSeeder,
		RunPaisSeeder,
		RunDepartamentoSeeder,
		RunMunicipioSeeder,
		RunTiposDocumentoSeeder,
		RunNivelesFormacionSeeder,
		RunTiposProgramaSeeder,
		RunGenerosSeeder,
		RunPersonaCaracterizacionSeeder,
		RunJornadasSeeder,
		RunModalidadesSeeder,
		RunSedeSeeder,
		RunBloqueSeeder,
		RunPisoSeeder,
		RunAmbienteSeeder,
		RunModalidadFormacionSeeder,
		RunDiasFormacionSeeder,
		RunPersonaSeeder,
		RunUsersSeeder,
		RunSyncInstructorRolesSeeder,
		RunTiposObservacionAsistenciaSeeder,
	}
	for _, run := range steps {
		if err := run(db); err != nil {
			return err
		}
	}

	log.Println("Todos los seeders completados correctamente.")
	return nil
}
