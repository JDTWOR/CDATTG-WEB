package dto

// SedeItem para selects
type SedeItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// AmbienteItem para selects
type AmbienteItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// ModalidadFormacionItem para selects
type ModalidadFormacionItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Codigo string `json:"codigo"`
}

// JornadaItem para selects (tabla jornadas)
type JornadaItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// DiaFormacionItem para selects
type DiaFormacionItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Codigo string `json:"codigo"`
}

// PaisItem para selects (formulario persona)
type PaisItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// DepartamentoItem para selects
type DepartamentoItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// MunicipioItem para selects
type MunicipioItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// ParametroItem para selects (tipo doc, género, caracterización)
type ParametroItem struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

// RegionalItem para selects (formulario instructor)
type RegionalItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}
