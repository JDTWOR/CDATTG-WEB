package services

import "errors"

var (
	errPersonaNoEncontrada      = errors.New("persona no encontrada")
	errPersonaDocumentoDuplicado = errors.New("el número de documento ya está registrado")
	errPersonaEmailDuplicado     = errors.New("el email ya está registrado")
	errPersonaCelularDuplicado   = errors.New("el celular ya está registrado")
)
