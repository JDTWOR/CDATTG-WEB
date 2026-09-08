/**
 * Pruebo que el registro de personas exija aceptar los términos de uso y que
 * esa aceptación quede registrada con la fecha en la persona.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestActualizarDatosBasicos_ExigeAceptacionTerminos(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:vig_test?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Persona{}); err != nil {
		t.Fatalf("AutoMigrate: %v", err)
	}
	dbAnterior := database.DB
	database.DB = db
	t.Cleanup(func() { database.DB = dbAnterior })

	persona := models.Persona{PrimerNombre: "Ana", PrimerApellido: "Rojas"}
	if err := db.Create(&persona).Error; err != nil {
		t.Fatalf("Create: %v", err)
	}

	svc := NewVigilanciaPersonaService()
	req := dto.VigilanciaDatosBasicosRequest{
		PrimerNombre: "Ana", PrimerApellido: "Rojas", Celular: "3001234567",
	}

	if _, err := svc.ActualizarDatosBasicos(persona.ID, req); err == nil {
		t.Fatal("debió rechazar sin acepta_terminos")
	}

	req.AceptaTerminos = true
	if _, err := svc.ActualizarDatosBasicos(persona.ID, req); err != nil {
		t.Fatalf("con aceptación: %v", err)
	}

	var guardada models.Persona
	if err := db.First(&guardada, persona.ID).Error; err != nil {
		t.Fatalf("First: %v", err)
	}
	if !guardada.AceptaTerminos || guardada.AceptaTerminosAt == nil {
		t.Fatalf("aceptación no persistida: %+v", guardada)
	}
}