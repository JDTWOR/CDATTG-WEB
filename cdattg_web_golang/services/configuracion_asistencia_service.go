package services

import (
	"sync"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

var (
	configAsistenciaDefaults = models.ConfiguracionAsistencia{
		ID:                            1,
		PlazoEdicionObservacionesDias: 5,
		IntervaloAutoCierreMinutos:    5,
		MinutosAlertaSinSesion:        90,
		MinutosExtensionDefault:       60,
	}
	configAsistenciaCache *models.ConfiguracionAsistencia
	configAsistenciaMu    sync.RWMutex
)

func configAsistenciaRepository() *repositories.ConfiguracionAsistenciaRepository {
	return repositories.NewConfiguracionAsistenciaRepository()
}

type ConfiguracionAsistenciaService struct {
	repo *repositories.ConfiguracionAsistenciaRepository
}

func NewConfiguracionAsistenciaService() *ConfiguracionAsistenciaService {
	return &ConfiguracionAsistenciaService{repo: configAsistenciaRepository()}
}

// GetConfiguracionAsistencia devuelve la configuración global (cache en memoria).
func GetConfiguracionAsistencia() models.ConfiguracionAsistencia {
	configAsistenciaMu.RLock()
	if configAsistenciaCache != nil {
		c := *configAsistenciaCache
		configAsistenciaMu.RUnlock()
		return c
	}
	configAsistenciaMu.RUnlock()
	return loadConfiguracionAsistencia()
}

func loadConfiguracionAsistencia() models.ConfiguracionAsistencia {
	if database.GetDB() == nil {
		return configAsistenciaDefaults
	}
	cfg, err := configAsistenciaRepository().FindSingleton()
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			cfg = &configAsistenciaDefaults
			_ = configAsistenciaRepository().UpsertSingleton(cfg)
		} else {
			return configAsistenciaDefaults
		}
	}
	configAsistenciaMu.Lock()
	configAsistenciaCache = cfg
	configAsistenciaMu.Unlock()
	return *cfg
}

func InvalidateConfiguracionAsistenciaCache() {
	configAsistenciaMu.Lock()
	configAsistenciaCache = nil
	configAsistenciaMu.Unlock()
}

func configAsistenciaPositive(value, defaultValue int) int {
	if value <= 0 {
		return defaultValue
	}
	return value
}

func configAsistenciaNonNegative(value, defaultValue int) int {
	if value < 0 {
		return defaultValue
	}
	return value
}

func plazoEdicionObservacionesDias() int {
	return configAsistenciaPositive(
		GetConfiguracionAsistencia().PlazoEdicionObservacionesDias,
		configAsistenciaDefaults.PlazoEdicionObservacionesDias,
	)
}

// IntervaloAutoCierreMinutos devuelve el intervalo del cron de auto-cierre con fallback seguro.
func IntervaloAutoCierreMinutos() int {
	return configAsistenciaPositive(
		GetConfiguracionAsistencia().IntervaloAutoCierreMinutos,
		configAsistenciaDefaults.IntervaloAutoCierreMinutos,
	)
}

func minutosAlertaSinSesion() int {
	return configAsistenciaPositive(
		GetConfiguracionAsistencia().MinutosAlertaSinSesion,
		configAsistenciaDefaults.MinutosAlertaSinSesion,
	)
}

func minutosExtensionDefaultRuntime() int {
	return configAsistenciaNonNegative(
		GetConfiguracionAsistencia().MinutosExtensionDefault,
		configAsistenciaDefaults.MinutosExtensionDefault,
	)
}

func configuracionAsistenciaToDTO(cfg models.ConfiguracionAsistencia) dto.ConfiguracionAsistenciaResponse {
	return dto.ConfiguracionAsistenciaResponse{
		PlazoEdicionObservacionesDias: cfg.PlazoEdicionObservacionesDias,
		IntervaloAutoCierreMinutos:    cfg.IntervaloAutoCierreMinutos,
		MinutosAlertaSinSesion:        cfg.MinutosAlertaSinSesion,
		MinutosExtensionDefault:       cfg.MinutosExtensionDefault,
	}
}

func (s *ConfiguracionAsistenciaService) Get() dto.ConfiguracionAsistenciaResponse {
	return configuracionAsistenciaToDTO(GetConfiguracionAsistencia())
}

func (s *ConfiguracionAsistenciaService) Update(req dto.ConfiguracionAsistenciaUpdateRequest) (dto.ConfiguracionAsistenciaResponse, error) {
	cfg := models.ConfiguracionAsistencia{
		ID:                            1,
		PlazoEdicionObservacionesDias: req.PlazoEdicionObservacionesDias,
		IntervaloAutoCierreMinutos:    req.IntervaloAutoCierreMinutos,
		MinutosAlertaSinSesion:        req.MinutosAlertaSinSesion,
		MinutosExtensionDefault:       req.MinutosExtensionDefault,
	}
	if err := s.repo.UpsertSingleton(&cfg); err != nil {
		return dto.ConfiguracionAsistenciaResponse{}, err
	}
	InvalidateConfiguracionAsistenciaCache()
	return s.Get(), nil
}
