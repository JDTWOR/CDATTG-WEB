package services

import (
	"time"
)

const DiasHistoricoCompletoCasosBienestar = 0

type rangoAnalisisCasosBienestar struct {
	FechaInicio    time.Time
	FechaFin       time.Time
	DiasAnalizados int
	Historico      bool
}

type minFechaAsistenciaReader interface {
	MinFechaAsistencia(sedeID *uint) (time.Time, bool, error)
}

func resolverRangoCasosBienestar(
	repo minFechaAsistenciaReader,
	sedeID *uint,
	dias int,
) (rangoAnalisisCasosBienestar, error) {
	fechaFin := time.Now()
	if dias == DiasHistoricoCompletoCasosBienestar {
		minFecha, ok, err := repo.MinFechaAsistencia(sedeID)
		if err != nil {
			return rangoAnalisisCasosBienestar{}, err
		}
		fechaInicio := fechaFin
		if ok {
			fechaInicio = minFecha
		}
		return rangoAnalisisCasosBienestar{
			FechaInicio:    fechaInicio,
			FechaFin:       fechaFin,
			DiasAnalizados: 0,
			Historico:      true,
		}, nil
	}
	if dias <= 0 {
		dias = 30
	}
	return rangoAnalisisCasosBienestar{
		FechaInicio:    fechaFin.AddDate(0, 0, -dias),
		FechaFin:       fechaFin,
		DiasAnalizados: dias,
		Historico:      false,
	}, nil
}
