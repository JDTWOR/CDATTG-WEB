package utils

import (
	"time"

	"github.com/sena/cdattg-web-golang/config"
)

const defaultTimeZone = "America/Bogota"

// AppLocation devuelve la zona horaria de la aplicación (DB_TIMEZONE / America/Bogota).
func AppLocation() *time.Location {
	tz := defaultTimeZone
	if config.AppConfig != nil && config.AppConfig.Database.TimeZone != "" {
		tz = config.AppConfig.Database.TimeZone
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.Local
	}
	return loc
}

// Now devuelve la hora actual en la zona horaria de la aplicación.
func Now() time.Time {
	return time.Now().In(AppLocation())
}

func InitAppLocation() {
	loc := AppLocation()
	time.Local = loc
}
