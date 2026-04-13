package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

const errMsgDatosInvalidos = "Datos inválidos"

type AmbienteHandler struct {
	svc services.AmbienteService
}

func NewAmbienteHandler() *AmbienteHandler {
	return &AmbienteHandler{
		svc: services.NewAmbienteService(),
	}
}

// Create crea un nuevo ambiente de formación (uso módulo infraestructura).
func (h *AmbienteHandler) Create(c *gin.Context) {
	var req dto.AmbienteCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	res, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

type SedeHandler struct {
	svc services.SedeService
}

func NewSedeHandler() *SedeHandler {
	return &SedeHandler{
		svc: services.NewSedeService(),
	}
}

// Create crea una nueva sede (infraestructura).
func (h *SedeHandler) Create(c *gin.Context) {
	var req dto.SedeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	res, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

type PisoHandler struct {
	svc services.PisoService
}

func NewPisoHandler() *PisoHandler {
	return &PisoHandler{
		svc: services.NewPisoService(),
	}
}

// Create crea un nuevo piso (infraestructura).
func (h *PisoHandler) Create(c *gin.Context) {
	var req dto.PisoCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	res, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

// --- Lookups infra (bloques y pisos) ---

// ListBloques devuelve todos los bloques con el nombre de la sede (para selects en infraestructura).
func ListBloques(c *gin.Context) {
	db := database.GetDB()
	type row struct {
		ID         uint
		Nombre     string
		SedeNombre string
	}
	var rows []row
	if err := db.Table("bloques b").
		Select("b.id, b.nombre, s.nombre as sede_nombre").
		Joins("JOIN sedes s ON s.id = b.sede_id").
		Order("s.nombre, b.nombre").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron cargar los bloques"})
		return
	}
	resp := make([]dto.BloqueItemInfra, len(rows))
	for i, r := range rows {
		resp[i] = dto.BloqueItemInfra{
			ID:         r.ID,
			Nombre:     r.Nombre,
			SedeNombre: r.SedeNombre,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ListPisos devuelve todos los pisos con el nombre del bloque (para selects en infraestructura).
func ListPisos(c *gin.Context) {
	db := database.GetDB()
	type row struct {
		ID           uint
		Nombre       string
		BloqueNombre string
	}
	var rows []row
	if err := db.Table("pisos p").
		Select("p.id, p.nombre, b.nombre as bloque_nombre").
		Joins("JOIN bloques b ON b.id = p.bloque_id").
		Order("b.nombre, p.nombre").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron cargar los pisos"})
		return
	}
	resp := make([]dto.PisoItemInfra, len(rows))
	for i, r := range rows {
		resp[i] = dto.PisoItemInfra{
			ID:           r.ID,
			Nombre:       r.Nombre,
			BloqueNombre: r.BloqueNombre,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

type BloqueHandler struct {
	svc services.BloqueService
}

func NewBloqueHandler() *BloqueHandler {
	return &BloqueHandler{
		svc: services.NewBloqueService(),
	}
}

// Create crea un nuevo bloque (infraestructura).
func (h *BloqueHandler) Create(c *gin.Context) {
	var req dto.BloqueCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	res, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, res)
}

