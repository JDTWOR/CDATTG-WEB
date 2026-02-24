package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// Producto representa un producto del inventario
type Producto struct {
	models.UserAuditModel
	Name              string     `gorm:"size:255;not null" json:"name"`
	TipoProductoID    *uint      `gorm:"column:tipo_producto_id" json:"tipo_producto_id"`
	Descripcion       string     `gorm:"type:text" json:"descripcion"`
	Peso              *float64   `json:"peso"`
	UnidadMedidaID    *uint      `gorm:"column:unidad_medida_id" json:"unidad_medida_id"`
	Cantidad          *int       `gorm:"default:0" json:"cantidad"`
	CodigoBarras      string     `gorm:"column:codigo_barras;size:100" json:"codigo_barras"`
	EstadoProductoID   *uint      `gorm:"column:estado_producto_id" json:"estado_producto_id"`
	CategoriaID       *uint      `gorm:"column:categoria_id" json:"categoria_id"`
	MarcaID           *uint      `gorm:"column:marca_id" json:"marca_id"`
	ContratoConvenioID *uint     `gorm:"column:contrato_convenio_id" json:"contrato_convenio_id"`
	AmbienteID        *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	ProveedorID       *uint      `gorm:"column:proveedor_id" json:"proveedor_id"`
	FechaVencimiento  *time.Time `gorm:"column:fecha_vencimiento" json:"fecha_vencimiento"`
	Imagen            string     `gorm:"size:255" json:"imagen"`
	EsConsumible      bool       `gorm:"column:es_consumible;default:false" json:"es_consumible"` // para regla cierre sin stock (doc: tipo CONSUMIBLE)
	
	// Relaciones (comentadas temporalmente para evitar dependencias circulares)
	// Ambiente          *models.Ambiente          `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	// Proveedor         *Proveedor                `gorm:"foreignKey:ProveedorID" json:"proveedor,omitempty"`
	// Categoria         *Categoria                `gorm:"foreignKey:CategoriaID" json:"categoria,omitempty"`
	// Marca             *Marca                    `gorm:"foreignKey:MarcaID" json:"marca,omitempty"`
	// ContratoConvenio  *ContratoConvenio         `gorm:"foreignKey:ContratoConvenioID" json:"contrato_convenio,omitempty"`
	// DetalleOrdenes    []DetalleOrden            `gorm:"foreignKey:ProductoID" json:"detalle_ordenes,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Producto) TableName() string {
	return "productos"
}
