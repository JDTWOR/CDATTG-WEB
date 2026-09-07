/**
 * Configuración del carnet digital (singleton, id=1).
 * Guarda el nombre, cargo y regional que van en el QR del reverso.
 *
 * @author Cristian Deysdayr Jiménez
 */
package models

// ConfiguracionCarnet fila única con datos del reverso del carnet.
type ConfiguracionCarnet struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Nombre   string `gorm:"size:200;not null;default:''" json:"nombre"`
	Cargo    string `gorm:"size:200;not null;default:''" json:"cargo"`
	Regional string `gorm:"size:200;not null;default:''" json:"regional"`
}

func (ConfiguracionCarnet) TableName() string {
	return "configuracion_carnets"
}
