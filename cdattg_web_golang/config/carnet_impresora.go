/**
 * Leo la clave de la impresora de carnets desde el entorno.
 * La impresora no puede iniciar sesión como persona; por eso usa esta clave.
 * Si está vacía, apago esas rutas. La pongo en CARNET_IMPRESORA_API_KEY.
 *
 * @author Cristian Deysdayr Jiménez
 */
package config

import (
	"os"
	"strings"
)

const envClaveImpresora = "CARNET_IMPRESORA_API_KEY"

// ClaveImpresora es la clave de máquina. Vacío = impresora apagada.
func ClaveImpresora() string {
	return strings.TrimSpace(os.Getenv(envClaveImpresora))
}
