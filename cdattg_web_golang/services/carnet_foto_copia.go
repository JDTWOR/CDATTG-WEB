/**
 * Copio la foto del carnet a su propia carpeta.
 * Lo hice porque si la persona cambia la foto de perfil, la del carnet
 * no se puede perder: portería debe ver la que validó el líder.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

var carnetFotoDir = "storage/carnets_fotos"

// copiarFotoCarnet deja una copia de la foto de la solicitud.
// @param origen ruta de la foto de perfil
// @param solicitudID id de la solicitud
// @returns ruta nueva o la misma si ya estaba copiada
func copiarFotoCarnet(origen string, solicitudID uint) (string, error) {
	origen = strings.TrimSpace(origen)
	if origen == "" || solicitudID == 0 {
		return "", errPersonaFotoAusente
	}
	dest := filepath.Join(carnetFotoDir, fmt.Sprintf("%d.jpg", solicitudID))
	if filepath.Clean(origen) == filepath.Clean(dest) {
		return filepath.ToSlash(dest), nil
	}
	data, err := os.ReadFile(origen)
	if err != nil {
		return "", errPersonaFotoAusente
	}
	if err := os.MkdirAll(carnetFotoDir, 0o750); err != nil {
		return "", fmt.Errorf("no pude crear la carpeta de fotos del carnet: %w", err)
	}
	if err := os.WriteFile(dest, data, 0o640); err != nil {
		return "", fmt.Errorf("no pude copiar la foto del carnet: %w", err)
	}
	return filepath.ToSlash(dest), nil
}

// fijarFotoCopiaSolicitud guarda la copia en la solicitud si se pudo hacer.
func fijarFotoCopiaSolicitud(repo repositories.CarnetSolicitudRepository, sol *models.CarnetSolicitud) {
	if repo == nil || sol == nil {
		return
	}
	copia, err := copiarFotoCarnet(sol.FotoPath, sol.ID)
	if err != nil || copia == "" || copia == strings.TrimSpace(sol.FotoPath) {
		return
	}
	sol.FotoPath = copia
	_ = repo.Update(sol)
}
