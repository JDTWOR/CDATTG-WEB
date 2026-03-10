package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Database   DatabaseConfig
	Server     ServerConfig
	JWT        JWTConfig
	CORS       CORSConfig
	Negocio    NegocioConfig
	Inventario InventarioConfig
	SMTP       SMTPConfig
	Alertas    AlertasConfig
	Env        string
}

// SMTPConfig para envío de correos (alertas al coordinador).
type SMTPConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
	Enabled  bool
}

// AlertasConfig reglas para alertas de asistencia (fichas que no han iniciado toma de asistencia).
type AlertasConfig struct {
	MinutosDespuesInicioJornada int  // Alertar si pasaron estos minutos desde hora_inicio y no hay sesión (ej. 90 = 1h30)
	Enabled                    bool // Si las alertas por correo están activas
}

// InventarioConfig según documentacion_inventario.md (umbrales, notificaciones)
type InventarioConfig struct {
	UmbralMinimo       int  // bajo este valor el nivel es "bajo"
	UmbralCritico      int  // bajo este valor el nivel es "crítico"
	NotificarStockBajo bool // notificar a administradores cuando stock cruza umbral
}

// NegocioConfig reglas de negocio configurables (según reglas_negocio.md)
type NegocioConfig struct {
	MaxFichasActivas            int  // Máximo de fichas activas por instructor (normativa, ej. 5)
	ExperienciaMinimaAnios      int  // Años de experiencia mínimos para asignar (ej. 1)
	HorasMaxSemana              int  // Horas máximas por semana por instructor (ej. 48)
	ValidarCargaHoraria         bool // Si se valida la carga horaria semanal
	ValidarEspecialidadInstructor bool // Si se exige que el instructor tenga la especialidad (red de conocimiento) del programa; por ahora desactivado, activar a futuro
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	TimeZone string
}

type ServerConfig struct {
	Port string
	Host string
}

type JWTConfig struct {
	Secret         string
	ExpirationHours int
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
}

var AppConfig *Config

func LoadConfig() {
	// Cargar .env si existe
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	AppConfig = &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "jhon"),
			Password: getEnv("DB_PASSWORD", "1234"),
			Name:     getEnv("DB_NAME", "cdattg_web"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			TimeZone: getEnv("DB_TIMEZONE", "America/Bogota"),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
		},
		JWT: JWTConfig{
			Secret:         getEnv("JWT_SECRET", "cdattg-web-golang-secret-key-change-in-production"),
			ExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		},
		CORS: CORSConfig{
			AllowedOrigins:   getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:8000", "http://localhost:3000", "http://localhost:5173"}),
			AllowedMethods:   getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}),
			AllowedHeaders:   getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"*"}),
			AllowCredentials: getEnvAsBool("CORS_ALLOW_CREDENTIALS", true),
		},
		Negocio: NegocioConfig{
			MaxFichasActivas:            getEnvAsInt("NEGOCIO_MAX_FICHAS_ACTIVAS", 5),
			ExperienciaMinimaAnios:      getEnvAsInt("NEGOCIO_EXPERIENCIA_MIN_ANIOS", 0),
			HorasMaxSemana:              getEnvAsInt("NEGOCIO_HORAS_MAX_SEMANA", 48),
			ValidarCargaHoraria:         getEnvAsBool("NEGOCIO_VALIDAR_CARGA_HORARIA", false),
			ValidarEspecialidadInstructor: getEnvAsBool("NEGOCIO_VALIDAR_ESPECIALIDAD_INSTRUCTOR", false),
		},
		Inventario: InventarioConfig{
			UmbralMinimo:       getEnvAsInt("INVENTARIO_UMBRAL_MINIMO", 10),
			UmbralCritico:      getEnvAsInt("INVENTARIO_UMBRAL_CRITICO", 5),
			NotificarStockBajo: getEnvAsBool("INVENTARIO_NOTIFICAR_STOCK_BAJO", true),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", ""),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			User:     getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@sena.local"),
			Enabled:  getEnvAsBool("SMTP_ENABLED", false),
		},
		Alertas: AlertasConfig{
			MinutosDespuesInicioJornada: getEnvAsInt("ALERTAS_MINUTOS_DESPUES_INICIO_JORNADA", 90),
			Enabled:                     getEnvAsBool("ALERTAS_ASISTENCIA_ENABLED", true),
		},
		Env: getEnv("ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple split by comma
		result := []string{}
		for _, item := range splitString(value, ",") {
			if trimmed := trimString(item); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}

func splitString(s, sep string) []string {
	result := []string{}
	current := ""
	for _, char := range s {
		if string(char) == sep {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func trimString(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}

func GetDSN() string {
	cfg := AppConfig.Database
	return "host=" + cfg.Host + " user=" + cfg.User + " password=" + cfg.Password + " dbname=" + cfg.Name + " port=" + cfg.Port + " sslmode=" + cfg.SSLMode + " TimeZone=" + cfg.TimeZone
}
