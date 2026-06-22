package services

import "errors"

var (
	errEleccionProcesoNoEncontrado = errors.New("proceso electoral no encontrado")
	errEleccionPlanchaNoEncontrada   = errors.New("plancha no encontrada")
	errEleccionNoElegible            = errors.New("no cumple requisitos para participar en la elección")
	errEleccionFaseInvalida          = errors.New("operación no permitida en la fase actual del proceso")
	errEleccionAprendizRegional      = errors.New("el aprendiz no pertenece a la regional del proceso")
	errEleccionUsuarioSinPersona     = errors.New("usuario sin persona vinculada")
	errEleccionVotoYaRegistrado      = errors.New("ya registró su voto en este proceso")
	errEleccionYaEnPlancha           = errors.New("ya está inscrito en una plancha de este proceso")
	errEleccionCicloDuplicado        = errors.New("ya existe un ciclo electoral para esta regional en el mismo año")
)
