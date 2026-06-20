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

type ConfiguracionAsistenciaService struct {
	repo *repositories.ConfiguracionAsistenciaRepository
}

func NewConfiguracionAsistenciaService() *ConfiguracionAsistenciaService {
	return &ConfiguracionAsistenciaService{repo: repositories.NewConfiguracionAsistenciaRepository()}
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
	cfg, err := repositories.NewConfiguracionAsistenciaRepository().FindSingleton()
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			cfg = &configAsistenciaDefaults
			_ = repositories.NewConfiguracionAsistenciaRepository().UpsertSingleton(cfg)
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

func plazoEdicionObservacionesDias() int {
	d := GetConfiguracionAsistencia().PlazoEdicionObservacionesDias
	if d <= 0 {
		return configAsistenciaDefaults.PlazoEdicionObservacionesDias
	}
	return d
}

func intervaloAutoCierreMinutos() int {
	m := GetConfiguracionAsistencia().IntervaloAutoCierreMinutos
	if m <= 0 {
		return configAsistenciaDefaults.IntervaloAutoCierreMinutos
	}
	return m
}

func minutosAlertaSinSesion() int {
	m := GetConfiguracionAsistencia().MinutosAlertaSinSesion
	if m <= 0 {
		return configAsistenciaDefaults.MinutosAlertaSinSesion
	}
	return m
}

func minutosExtensionDefaultRuntime() int {
	m := GetConfiguracionAsistencia().MinutosExtensionDefault
	if m < 0 {
		return configAsistenciaDefaults.MinutosExtensionDefault
	}
	return m
}

func (s *ConfiguracionAsistenciaService) Get() dto.ConfiguracionAsistenciaResponse {
	cfg := GetConfiguracionAsistencia()
	return dto.ConfiguracionAsistenciaResponse{
		PlazoEdicionObservacionesDias: cfg.PlazoEdicionObservacionesDias,
		IntervaloAutoCierreMinutos:    cfg.IntervaloAutoCierreMinutos,
		MinutosAlertaSinSesion:        cfg.MinutosAlertaSinSesion,
		MinutosExtensionDefault:       cfg.MinutosExtensionDefault,
	}
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
