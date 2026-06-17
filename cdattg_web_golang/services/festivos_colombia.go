package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// trasladarFestivoEmiliani mueve un festivo al lunes siguiente si no cae en lunes (Ley Emiliani).
func trasladarFestivoEmiliani(year, month, day int) time.Time {
	d := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
	if d.Weekday() == time.Monday {
		return d
	}
	offset := (8 - int(d.Weekday())) % 7
	if offset == 0 {
		offset = 7
	}
	return d.AddDate(0, 0, offset)
}

func easterSunday(year int) time.Time {
	// Algoritmo de Meeus/Jones/Butcher (Gregorian).
	a := year % 19
	b := year / 100
	c := year % 100
	d := b / 4
	e := b % 4
	f := (b + 8) / 25
	g := (b - f + 1) / 3
	h := (19*a + b - d - g + 15) % 30
	i := c / 4
	k := c % 4
	l := (32 + 2*e + 2*i - h - k) % 7
	m := (a + 11*h + 22*l) / 451
	month := (h + l - 7*m + 114) / 31
	day := ((h+l-7*m+114)%31 + 1)
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
}

func festivoDesdeEaster(year int, diasDespues int, nombre string) models.DiaFestivo {
	fecha := easterSunday(year).AddDate(0, 0, diasDespues)
	fecha = trasladarFestivoEmiliani(fecha.Year(), int(fecha.Month()), fecha.Day())
	return models.DiaFestivo{Fecha: fecha, Nombre: nombre, Anio: year}
}

func festivoFijoEmiliani(year, month, day int, nombre string) models.DiaFestivo {
	fecha := trasladarFestivoEmiliani(year, month, day)
	return models.DiaFestivo{Fecha: fecha, Nombre: nombre, Anio: year}
}

func festivoFijo(year, month, day int, nombre string) models.DiaFestivo {
	fecha := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
	return models.DiaFestivo{Fecha: fecha, Nombre: nombre, Anio: year}
}

// GenerarFestivosColombiaAnio devuelve los festivos nacionales de Colombia para un año.
func GenerarFestivosColombiaAnio(year int) []models.DiaFestivo {
	out := []models.DiaFestivo{
		festivoFijo(year, 1, 1, "Año Nuevo"),
		festivoFijoEmiliani(year, 1, 6, "Reyes Magos"),
		festivoFijoEmiliani(year, 3, 19, "San José"),
		festivoFijo(year, 5, 1, "Día del Trabajo"),
		festivoDesdeEaster(year, 43, "Ascensión del Señor"),
		festivoDesdeEaster(year, 64, "Corpus Christi"),
		festivoDesdeEaster(year, 71, "Sagrado Corazón"),
		festivoFijoEmiliani(year, 6, 29, "San Pedro y San Pablo"),
		festivoFijo(year, 7, 20, "Día de la Independencia"),
		festivoFijoEmiliani(year, 8, 15, "Asunción de la Virgen"),
		festivoFijo(year, 8, 7, "Batalla de Boyacá"),
		festivoFijoEmiliani(year, 11, 1, "Todos los Santos"),
		festivoFijoEmiliani(year, 11, 11, "Independencia de Cartagena"),
		festivoFijo(year, 12, 8, "Inmaculada Concepción"),
		festivoFijo(year, 12, 25, "Navidad"),
	}
	// Jueves Santo y Viernes Santo no son días laborables típicos de formación SENA en muchos centros,
	// pero no se trasladan; se incluyen como referencia académica.
	juevesSanto := easterSunday(year).AddDate(0, 0, -3)
	viernesSanto := easterSunday(year).AddDate(0, 0, -2)
	out = append(out,
		models.DiaFestivo{Fecha: juevesSanto, Nombre: "Jueves Santo", Anio: year},
		models.DiaFestivo{Fecha: viernesSanto, Nombre: "Viernes Santo", Anio: year},
	)
	return out
}

// GenerarFestivosColombiaRango genera festivos para un rango de años inclusive.
func GenerarFestivosColombiaRango(desdeAnio, hastaAnio int) []models.DiaFestivo {
	if desdeAnio > hastaAnio {
		desdeAnio, hastaAnio = hastaAnio, desdeAnio
	}
	var out []models.DiaFestivo
	for y := desdeAnio; y <= hastaAnio; y++ {
		out = append(out, GenerarFestivosColombiaAnio(y)...)
	}
	return out
}
