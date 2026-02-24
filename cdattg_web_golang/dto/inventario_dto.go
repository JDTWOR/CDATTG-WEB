package dto

import "time"

// --- Producto ---
type ProductoCreateRequest struct {
	Name               string     `json:"name" binding:"required"`
	TipoProductoID      *uint      `json:"tipo_producto_id" binding:"required"`
	Descripcion        string     `json:"descripcion" binding:"required"`
	Peso               *float64   `json:"peso"`
	UnidadMedidaID     *uint      `json:"unidad_medida_id" binding:"required"`
	Cantidad           *int       `json:"cantidad" binding:"required"` // ≥1 en creación
	CodigoBarras       string     `json:"codigo_barras"`
	EstadoProductoID    *uint      `json:"estado_producto_id" binding:"required"`
	CategoriaID        *uint      `json:"categoria_id" binding:"required"`
	MarcaID            *uint      `json:"marca_id" binding:"required"`
	ContratoConvenioID *uint      `json:"contrato_convenio_id" binding:"required"`
	AmbienteID         *uint      `json:"ambiente_id" binding:"required"`
	ProveedorID        *uint      `json:"proveedor_id" binding:"required"`
	FechaVencimiento   *time.Time `json:"fecha_vencimiento"`
}

type ProductoUpdateRequest struct {
	Name               string     `json:"name" binding:"required"`
	TipoProductoID      *uint      `json:"tipo_producto_id" binding:"required"`
	Descripcion        string     `json:"descripcion" binding:"required"`
	Peso               *float64   `json:"peso"`
	UnidadMedidaID     *uint      `json:"unidad_medida_id" binding:"required"`
	Cantidad           *int       `json:"cantidad"` // ≥0 en actualización
	CodigoBarras       string     `json:"codigo_barras"`
	EstadoProductoID   *uint      `json:"estado_producto_id" binding:"required"`
	CategoriaID        *uint      `json:"categoria_id" binding:"required"`
	MarcaID            *uint      `json:"marca_id" binding:"required"`
	ContratoConvenioID *uint      `json:"contrato_convenio_id" binding:"required"`
	AmbienteID         *uint      `json:"ambiente_id" binding:"required"`
	ProveedorID        *uint      `json:"proveedor_id"`
	FechaVencimiento   *time.Time `json:"fecha_vencimiento"`
}

type ProductoResponse struct {
	ID                 uint       `json:"id"`
	Name               string     `json:"name"`
	TipoProductoID     *uint      `json:"tipo_producto_id"`
	Descripcion        string     `json:"descripcion"`
	Peso               *float64   `json:"peso"`
	UnidadMedidaID     *uint      `json:"unidad_medida_id"`
	Cantidad           int        `json:"cantidad"`
	CodigoBarras       string     `json:"codigo_barras"`
	EstadoProductoID   *uint      `json:"estado_producto_id"`
	CategoriaID        *uint      `json:"categoria_id"`
	MarcaID            *uint      `json:"marca_id"`
	ContratoConvenioID *uint      `json:"contrato_convenio_id"`
	AmbienteID         *uint      `json:"ambiente_id"`
	ProveedorID        *uint      `json:"proveedor_id"`
	Imagen             string     `json:"imagen"`
	NivelStock         string     `json:"nivel_stock,omitempty"` // normal, bajo, crítico, alto
}

// --- Carrito (ítems para crear orden) ---
type CarritoItem struct {
	ProductoID uint `json:"producto_id" binding:"required"`
	Cantidad   int  `json:"cantidad" binding:"required,min=1"`
}

type OrdenFromCarritoRequest struct {
	Tipo              string        `json:"tipo" binding:"required,oneof=prestamo salida"`
	Descripcion       string        `json:"descripcion" binding:"required"`
	FechaDevolucion   *time.Time    `json:"fecha_devolucion"` // obligatorio si tipo=prestamo, debe ser > hoy
	Carrito           []CarritoItem `json:"carrito" binding:"required,min=1"`
	RolID             *uint         `json:"rol_id"`
	ProgramaFormacionID *uint       `json:"programa_formacion_id"`
}

type OrdenStoreRequest struct {
	TipoOrden         string             `json:"tipo_orden" binding:"required"`
	Descripcion       string             `json:"descripcion" binding:"required"`
	FechaDevolucion   *time.Time         `json:"fecha_devolucion"`
	Productos         []OrdenProductoItem `json:"productos" binding:"required,min=1"`
}

type OrdenProductoItem struct {
	ProductoID uint `json:"producto_id" binding:"required"`
	Cantidad   int  `json:"cantidad" binding:"required,min=1"`
	EstadoOrdenID *uint `json:"estado_orden_id,omitempty"`
}

// --- Orden response ---
type DetalleOrdenResponse struct {
	ID                uint   `json:"id"`
	OrdenID           uint   `json:"orden_id"`
	ProductoID        uint   `json:"producto_id"`
	ProductoNombre    string `json:"producto_nombre,omitempty"`
	Cantidad          int    `json:"cantidad"`
	CantidadDevuelta  int    `json:"cantidad_devuelta"`
	PendienteDevolver int    `json:"pendiente_devolver"`
	Estado            string `json:"estado"`
	CierraSinStock    bool   `json:"cierra_sin_stock"`
}

type OrdenResponse struct {
	ID                 uint                   `json:"id"`
	NumeroOrden        string                 `json:"numero_orden"`
	TipoOrden          string                 `json:"tipo_orden"`
	Descripcion        string                 `json:"descripcion"`
	FechaOrden         time.Time              `json:"fecha_orden"`
	FechaDevolucion    *time.Time             `json:"fecha_devolucion"`
	Estado             string                 `json:"estado"`
	PersonaID          uint                   `json:"persona_id"`
	PersonaNombre      string                 `json:"persona_nombre,omitempty"`
	DetalleOrdenes     []DetalleOrdenResponse `json:"detalle_ordenes"`
	CreatedAt          time.Time              `json:"created_at"`
}

// --- Aprobación ---
type AprobarRechazarRequest struct {
	DetalleOrdenID *uint  `json:"detalle_orden_id"` // nil = orden completa
	OrdenID        uint   `json:"orden_id" binding:"required"`
	Aprobar        bool   `json:"aprobar"` // true=aprobar, false=rechazar
	Observaciones  string `json:"observaciones"`   // motivo en rechazo
}

// --- Devolución ---
type DevolucionCreateRequest struct {
	DetalleOrdenID   uint   `json:"detalle_orden_id" binding:"required"`
	CantidadDevuelta int    `json:"cantidad_devuelta" binding:"min=0"` // 0 solo si cierre sin stock (consumibles)
	CierraSinStock   bool   `json:"cierra_sin_stock"`
	Observaciones    string `json:"observaciones"` // obligatorias si cierre sin stock
}

type DevolucionResponse struct {
	ID               uint      `json:"id"`
	DetalleOrdenID   uint      `json:"detalle_orden_id"`
	CantidadDevuelta int       `json:"cantidad_devuelta"`
	CierraSinStock   bool      `json:"cierra_sin_stock"`
	FechaDevolucion  time.Time `json:"fecha_devolucion"`
	Observaciones    string    `json:"observaciones"`
}

// --- Dashboard inventario ---
type InventarioDashboardResponse struct {
	TotalProductos    int     `json:"total_productos"`
	StockBajo         int     `json:"stock_bajo"`
	StockCritico      int     `json:"stock_critico"`
	OrdenesEnEspera   int64   `json:"ordenes_en_espera"`
	OrdenesHoy        int64   `json:"ordenes_hoy"`
}

// --- Maestros (respuestas simples) ---
type ProveedorResponse struct {
	ID     uint   `json:"id"`
	Name   string `json:"name"`
	NIT    string `json:"nit"`
	Status bool   `json:"status"`
}

type CategoriaResponse struct {
	ID     uint   `json:"id"`
	Name   string `json:"name"`
	Status bool   `json:"status"`
}

type MarcaResponse struct {
	ID     uint   `json:"id"`
	Name   string `json:"name"`
	Status bool   `json:"status"`
}

type ContratoConvenioResponse struct {
	ID              uint      `json:"id"`
	NumeroContrato  string    `json:"numero_contrato"`
	Nombre          string    `json:"nombre"`
	FechaInicio     time.Time `json:"fecha_inicio"`
	FechaFin        time.Time `json:"fecha_fin"`
	Status          bool      `json:"status"`
}

type NotificacionResponse struct {
	ID        uint       `json:"id"`
	Tipo      string     `json:"tipo"`
	Titulo    string     `json:"titulo"`
	Mensaje   string     `json:"mensaje"`
	LeidaEn   *time.Time `json:"leida_en"`
	CreatedAt time.Time  `json:"created_at"`
}

// --- Maestros: requests ---
type ProveedorCreateRequest struct {
	Name   string `json:"name" binding:"required"`
	NIT    string `json:"nit"`
	Status *bool  `json:"status"`
}

type ProveedorUpdateRequest struct {
	Name   string `json:"name" binding:"required"`
	NIT    string `json:"nit"`
	Status *bool  `json:"status"`
}

type CategoriaCreateRequest struct {
	Name   string `json:"name" binding:"required"`
	Status *bool  `json:"status"`
}

type CategoriaUpdateRequest struct {
	Name   string `json:"name" binding:"required"`
	Status *bool  `json:"status"`
}

type MarcaCreateRequest struct {
	Name   string `json:"name" binding:"required"`
	Status *bool  `json:"status"`
}

type MarcaUpdateRequest struct {
	Name   string `json:"name" binding:"required"`
	Status *bool  `json:"status"`
}

type ContratoConvenioCreateRequest struct {
	NumeroContrato string     `json:"numero_contrato" binding:"required"`
	Nombre         string     `json:"nombre" binding:"required"`
	FechaInicio    time.Time  `json:"fecha_inicio" binding:"required"`
	FechaFin       time.Time  `json:"fecha_fin" binding:"required"`
	Status         *bool      `json:"status"`
}

type ContratoConvenioUpdateRequest struct {
	NumeroContrato string     `json:"numero_contrato" binding:"required"`
	Nombre         string     `json:"nombre" binding:"required"`
	FechaInicio    time.Time  `json:"fecha_inicio" binding:"required"`
	FechaFin       time.Time  `json:"fecha_fin" binding:"required"`
	Status         *bool      `json:"status"`
}
