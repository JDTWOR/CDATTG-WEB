/**
 * Recibo y entrego la foto de perfil de la persona autenticada.
 * Lo hice para que Mi perfil y el carnet usen el mismo archivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

// PersonaFotoHandler atiende /personas/mi-foto.
type PersonaFotoHandler struct {
	fotoSvc services.PersonaFotoService
}

// NewPersonaFotoHandler crea el handler con el servicio de fotos.
func NewPersonaFotoHandler() *PersonaFotoHandler {
	return &PersonaFotoHandler{fotoSvc: services.NewPersonaFotoService()}
}

func personaIDDelContexto(c *gin.Context) (uint, bool) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return 0, false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Este usuario no tiene una persona vinculada"})
		return 0, false
	}
	return *user.PersonaID, true
}

// SubirMiFoto POST /personas/mi-foto (campo file).
func (h *PersonaFotoHandler) SubirMiFoto(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	archivo, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Debe enviar una foto"})
		return
	}
	src, err := archivo.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No pude abrir la foto"})
		return
	}
	defer src.Close()

	// El visitante no puede cambiar su foto directo: se guarda en la ruta de
	// pendiente y la aprueba el vigilante desde "Cambios pendientes".
	if esVisitante(c) {
		if err := h.subirFotoPendiente(c, personaID, src); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	persona, err := h.fotoSvc.Guardar(personaID, src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, persona)
}

// subirFotoPendiente guarda la foto del visitante en una ruta aparte y crea un
// cambio pendiente para que el vigilante la apruebe. No toca la foto vigente.
func (h *PersonaFotoHandler) subirFotoPendiente(c *gin.Context, personaID uint, src io.Reader) error {
	ruta, err := h.fotoSvc.GuardarPendiente(personaID, src)
	if err != nil {
		return err
	}

	var req dto.PersonaSelfUpdateRequest
	svc := services.NewPersonaCambioPendienteService()
	_, err = svc.CrearCambioPendiente(personaID, req, ruta)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Su foto será revisada por el vigilante. Acérquese a porteria para validar los cambios.",
	})
	return nil
}

// VerMiFoto GET /personas/mi-foto.
func (h *PersonaFotoHandler) VerMiFoto(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	arch, err := h.fotoSvc.Leer(personaID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}
