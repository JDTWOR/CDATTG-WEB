/**
 * Leo y escribo la configuración del carnet (singleton).
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// CarnetConfigService acceso a la configuración del carnet.
type CarnetConfigService struct {
	db *gorm.DB
}

// NewCarnetConfigService crea el servicio con la DB.
func NewCarnetConfigService(db *gorm.DB) *CarnetConfigService {
	return &CarnetConfigService{db: db}
}

// Obtener devuelve la configuración actual (id=1).
func (s *CarnetConfigService) Obtener() (models.ConfiguracionCarnet, error) {
	var cfg models.ConfiguracionCarnet
	err := s.db.First(&cfg, 1).Error
	return cfg, err
}

// Guardar actualiza los datos de la configuración.
func (s *CarnetConfigService) Guardar(nombre, cargo, regional string) (models.ConfiguracionCarnet, error) {
	var cfg models.ConfiguracionCarnet
	if err := s.db.First(&cfg, 1).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			cfg = models.ConfiguracionCarnet{ID: 1, Nombre: nombre, Cargo: cargo, Regional: regional}
			return cfg, s.db.Create(&cfg).Error
		}
		return cfg, err
	}
	cfg.Nombre = nombre
	cfg.Cargo = cargo
	cfg.Regional = regional
	return cfg, s.db.Save(&cfg).Error
}

// CargoRegional devuelve el texto combinado para el QR del reverso.
func (s *CarnetConfigService) CargoRegional() string {
	cfg, err := s.Obtener()
	if err != nil {
		return ""
	}
	return cfg.Nombre + " | " + cfg.Cargo + " | " + cfg.Regional
}
