package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/database"
)

// RunAll ejecuta migraciones y todos los seeders en orden (igual que cdattg_web DatabaseSeeder).
func RunAll() error {
	db := database.GetDB()
	if db == nil {
		log.Fatal("Base de datos no inicializada. Ejecute database.Initialize() antes de los seeders.")
	}

	if err := database.Migrate(); err != nil {
		return err
	}

	if err := RunRolePermissionSeeder(db); err != nil {
		return err
	}
	if err := RunRegionalSeeder(db); err != nil {
		return err
	}
	if err := RunPaisSeeder(db); err != nil {
		return err
	}
	if err := RunDepartamentoSeeder(db); err != nil {
		return err
	}
	if err := RunMunicipioSeeder(db); err != nil {
		return err
	}
	if err := RunTiposDocumentoSeeder(db); err != nil {
		return err
	}
	if err := RunNivelesFormacionSeeder(db); err != nil {
		return err
	}
	if err := RunTiposProgramaSeeder(db); err != nil {
		return err
	}
	if err := RunGenerosSeeder(db); err != nil {
		return err
	}
	if err := RunPersonaCaracterizacionSeeder(db); err != nil {
		return err
	}
	if err := RunJornadasSeeder(db); err != nil {
		return err
	}
	if err := RunModalidadesSeeder(db); err != nil {
		return err
	}
	if err := RunSedeSeeder(db); err != nil {
		return err
	}
	if err := RunBloqueSeeder(db); err != nil {
		return err
	}
	if err := RunPisoSeeder(db); err != nil {
		return err
	}
	if err := RunAmbienteSeeder(db); err != nil {
		return err
	}
	if err := RunModalidadFormacionSeeder(db); err != nil {
		return err
	}
	if err := RunDiasFormacionSeeder(db); err != nil {
		return err
	}
	if err := RunPersonaSeeder(db); err != nil {
		return err
	}
	if err := RunUsersSeeder(db); err != nil {
		return err
	}
	if err := RunSyncInstructorRolesSeeder(db); err != nil {
		return err
	}

	log.Println("Todos los seeders completados correctamente.")
	return nil
}
