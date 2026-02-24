package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

type OrdenHandler struct {
	svc services.OrdenService
}

func NewOrdenHandler() *OrdenHandler {
	return &OrdenHandler{svc: services.NewOrdenService()}
}

func (h *OrdenHandler) personaIDFromContext(c *gin.Context) (uint, bool) {
	user, _ := c.Get("user")
	u, _ := user.(*models.User)
	if u == nil || u.PersonaID == nil {
		return 0, false
	}
	return *u.PersonaID, true
}

func (h *OrdenHandler) CreateFromCarrito(c *gin.Context) {
	user, _ := c.Get("user")
	u, _ := user.(*models.User)
	if u == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	personaID, ok := h.personaIDFromContext(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Su usuario no está vinculado a una persona. Contacte al administrador."})
		return
	}
	var req dto.OrdenFromCarritoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.CreateFromCarrito(req, personaID, u.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *OrdenHandler) Create(c *gin.Context) {
	user, _ := c.Get("user")
	u, _ := user.(*models.User)
	if u == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	personaID, ok := h.personaIDFromContext(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Su usuario no está vinculado a una persona."})
		return
	}
	var req dto.OrdenStoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.Create(req, personaID, u.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *OrdenHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	resp, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *OrdenHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	var userID *uint
	verTodas := false
	if u, ok := c.Get("user"); ok {
		if user, _ := u.(*models.User); user != nil {
			userID = &user.ID
			if e, err := authz.GetEnforcer(database.GetDB()); err == nil {
				sub := strconv.FormatUint(uint64(user.ID), 10)
				verTodas, _ = authz.Enforce(e, sub, "orden", "VER TODAS LAS ORDENES")
			}
		}
	}
	list, total, err := h.svc.List(pageSize, offset, userID, verTodas)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "page": page, "page_size": pageSize})
}

func (h *OrdenHandler) ListPendientesAprobacion(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	list, total, err := h.svc.ListPendientesAprobacion(pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "page": page, "page_size": pageSize})
}
