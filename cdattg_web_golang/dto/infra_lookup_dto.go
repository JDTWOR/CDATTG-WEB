package dto

// BloqueItemInfra para selects y listado de bloques (infraestructura).
type BloqueItemInfra struct {
	ID         uint   `json:"id"`
	Nombre     string `json:"nombre"`
	SedeID     uint   `json:"sede_id"`
	SedeNombre string `json:"sede_nombre"`
}

// PisoItemInfra para selects y listado de pisos (infraestructura).
type PisoItemInfra struct {
	ID           uint   `json:"id"`
	Nombre       string `json:"nombre"`
	BloqueID     uint   `json:"bloque_id"`
	BloqueNombre string `json:"bloque_nombre"`
	SedeNombre   string `json:"sede_nombre"`
}

