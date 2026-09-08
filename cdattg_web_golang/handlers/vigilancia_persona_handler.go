package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type VigilanciaPersonaHandler struct {
	svc     services.VigilanciaPersonaService
	fotoSvc services.PersonaFotoService
}

func NewVigilanciaPersonaHandler() *VigilanciaPersonaHandler {
	return &VigilanciaPersonaHandler{
		svc:     services.NewVigilanciaPersonaService(),
		fotoSvc: services.NewPersonaFotoService(),
	}
}

func NewVigilanciaPersonaHandlerWithServices(svc services.VigilanciaPersonaService, fotoSvc services.PersonaFotoService) *VigilanciaPersonaHandler {
	return &VigilanciaPersonaHandler{svc: svc, fotoSvc: fotoSvc}
}

// Lookup busca persona por número de documento.
func (h *VigilanciaPersonaHandler) Lookup(c *gin.Context) {
	doc := c.Query("numero_documento")
	if doc == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "numero_documento es requerido"})
		return
	}
	persona, err := h.svc.Lookup(doc)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, persona)
}

// ActualizarDatosBasicos actualiza los datos básicos de una persona.
func (h *VigilanciaPersonaHandler) ActualizarDatosBasicos(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.VigilanciaDatosBasicosRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	persona, err := h.svc.ActualizarDatosBasicos(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, persona)
}

// SubirFoto actualiza la foto de una persona puntual (no la del autenticado).
func (h *VigilanciaPersonaHandler) SubirFoto(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
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
	persona, err := h.fotoSvc.Guardar(uint(id), src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, persona)
}
