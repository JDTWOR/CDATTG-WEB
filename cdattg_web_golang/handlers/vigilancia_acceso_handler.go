package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

// VigilanciaAccesoHandler endpoints de portería.
type VigilanciaAccesoHandler struct {
	svc services.VigilanciaAccesoService
}

// NewVigilanciaAccesoHandler crea el handler.
func NewVigilanciaAccesoHandler() *VigilanciaAccesoHandler {
	return &VigilanciaAccesoHandler{svc: services.NewVigilanciaAccesoService()}
}

func userIDFromContext(c *gin.Context) uint {
	v, ok := c.Get("userID")
	if !ok {
		return 0
	}
	id, _ := v.(uint)
	return id
}

func parseUintPtrQuery(c *gin.Context, key string) (*uint, error) {
	raw := strings.TrimSpace(c.Query(key))
	if raw == "" {
		return nil, nil
	}
	n, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || n == 0 {
		return nil, errors.New(key + " inválido")
	}
	id := uint(n)
	return &id, nil
}

func parseBoolPtrQuery(c *gin.Context, key string) *bool {
	raw := strings.TrimSpace(strings.ToLower(c.Query(key)))
	if raw == "" {
		return nil
	}
	v := raw == "1" || raw == "true" || raw == "si" || raw == "sí"
	return &v
}

func filtrosDesdeQuery(c *gin.Context) (dto.AccesoHistorialFiltros, error) {
	regionalID, err := parseUintPtrQuery(c, "regional_id")
	if err != nil {
		return dto.AccesoHistorialFiltros{}, err
	}
	sedeID, err := parseUintPtrQuery(c, "sede_id")
	if err != nil {
		return dto.AccesoHistorialFiltros{}, err
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "25"))
	return dto.AccesoHistorialFiltros{
		RegionalID:       regionalID,
		SedeID:           sedeID,
		FechaDesde:       c.Query("fecha_desde"),
		FechaHasta:       c.Query("fecha_hasta"),
		TipoPersona:      c.Query("tipo_persona"),
		Documento:        c.Query("documento"),
		Estado:           c.Query("estado"),
		MotivoSalida:     c.Query("motivo_salida"),
		SalidaSinIngreso: parseBoolPtrQuery(c, "salida_sin_ingreso"),
		Page:             page,
		PageSize:         pageSize,
	}, nil
}

// Lookup POST /vigilancia/acceso/lookup
func (h *VigilanciaAccesoHandler) Lookup(c *gin.Context) {
	var req dto.AccesoLookupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.svc.Lookup(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Ingreso POST /vigilancia/acceso/ingreso
func (h *VigilanciaAccesoHandler) Ingreso(c *gin.Context) {
	var req dto.AccesoIngresoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.svc.Ingreso(req, userIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Salida POST /vigilancia/acceso/salida
func (h *VigilanciaAccesoHandler) Salida(c *gin.Context) {
	var req dto.AccesoSalidaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.svc.Salida(req, userIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// CancelarIngreso POST /vigilancia/acceso/cancelar-ingreso
func (h *VigilanciaAccesoHandler) CancelarIngreso(c *gin.Context) {
	var req dto.AccesoCancelarIngresoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.svc.CancelarIngreso(req, userIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ListDentro GET /vigilancia/acceso/dentro?sede_id=
func (h *VigilanciaAccesoHandler) ListDentro(c *gin.Context) {
	sedeID, err := parseUintPtrQuery(c, "sede_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sede_id inválido"})
		return
	}
	list, err := h.svc.ListDentro(sedeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// Historial GET /vigilancia/acceso/historial
func (h *VigilanciaAccesoHandler) Historial(c *gin.Context) {
	f, err := filtrosDesdeQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros de filtro inválidos"})
		return
	}
	res, err := h.svc.Historial(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Estadisticas GET /vigilancia/acceso/estadisticas
func (h *VigilanciaAccesoHandler) Estadisticas(c *gin.Context) {
	f, err := filtrosDesdeQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros de filtro inválidos"})
		return
	}
	res, err := h.svc.Estadisticas(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}
