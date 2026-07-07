package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/services"
)

type StatsHandler struct {
	dashboardSvc  services.DashboardResumenService
	analisisSvc   services.AsistenciaAnalisisService
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		dashboardSvc: services.NewDashboardResumenService(),
		analisisSvc:  services.NewAsistenciaAnalisisService(),
	}
}

func rolesFromContext(c *gin.Context) []string {
	if rolesVal, ok := c.Get("userRoles"); ok {
		if roles, ok2 := rolesVal.([]string); ok2 {
			return roles
		}
	}
	userID, ok := c.Get("userID")
	if !ok {
		return nil
	}
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		return nil
	}
	sub := strconv.FormatUint(uint64(userID.(uint)), 10)
	roles, _ := authz.GetRolesForUser(e, sub)
	return roles
}

// GetDashboardResumen GET /api/stats/dashboard-resumen
func (h *StatsHandler) GetDashboardResumen(c *gin.Context) {
	userID, _ := c.Get("userID")
	roles := rolesFromContext(c)

	fecha := c.Query("fecha")
	var regionalID, sedeID *uint
	if v := c.Query("regional_id"); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			u := uint(id)
			regionalID = &u
		}
	}
	if v := c.Query("sede_id"); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			u := uint(id)
			sedeID = &u
		}
	}

	resp, err := h.dashboardSvc.GetResumen(userID.(uint), roles, fecha, regionalID, sedeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetAsistenciaAnalisis GET /api/stats/asistencia-analisis
func (h *StatsHandler) GetAsistenciaAnalisis(c *gin.Context) {
	userID, _ := c.Get("userID")
	roles := rolesFromContext(c)

	p := services.AsistenciaAnalisisParams{
		FechaDesde: c.Query("fecha_desde"),
		FechaHasta: c.Query("fecha_hasta"),
		Jornada:    c.Query("jornada"),
	}
	if v := c.Query("regional_id"); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			u := uint(id)
			p.RegionalID = &u
		}
	}
	if v := c.Query("sede_id"); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			u := uint(id)
			p.SedeID = &u
		}
	}
	p.FichaNumero = strings.TrimSpace(c.Query("ficha"))
	if v := c.Query("aprendiz_id"); v != "" {
		if id, err := strconv.ParseUint(v, 10, 64); err == nil {
			u := uint(id)
			p.AprendizID = &u
		}
	}
	if v := c.Query("dia_semana_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil {
			p.DiaSemanaID = &id
		}
	}

	resp, err := h.analisisSvc.GetAnalisis(userID.(uint), roles, p)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
