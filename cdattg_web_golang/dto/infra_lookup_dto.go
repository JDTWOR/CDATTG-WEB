package dto

// BloqueItemInfra para selects de bloques (infraestructura).
type BloqueItemInfra struct {
	ID         uint   `json:"id"`
	Nombre     string `json:"nombre"`
	SedeNombre string `json:"sede_nombre"`
}

// PisoItemInfra para selects de pisos (infraestructura).
type PisoItemInfra struct {
	ID           uint   `json:"id"`
	Nombre       string `json:"nombre"`
	BloqueNombre string `json:"bloque_nombre"`
}

