package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

// InstructorAgendaHandler endpoints de agenda de programación.
type InstructorAgendaHandler struct {
	agendaSvc *services.InstructorAgendaService
	instRepo  repositories.InstructorRepository
}

func NewInstructorAgendaHandler() *InstructorAgendaHandler {
	return &InstructorAgendaHandler{
		agendaSvc: services.NewInstructorAgendaService(),
		instRepo:  repositories.NewInstructorRepository(),
	}
}

func (h *InstructorAgendaHandler) instructorIDFromContext(c *gin.Context) (uint, bool) {
	u, ok := c.Get("user")
	if !ok {
		return 0, false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return 0, false
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		return 0, false
	}
	return inst.ID, true
}

// GetMiAgenda GET /instructor/agenda?desde=&hasta=
func (h *InstructorAgendaHandler) GetMiAgenda(c *gin.Context) {
	instID, ok := h.instructorIDFromContext(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "usuario no vinculado como instructor"})
		return
	}
	desde := c.Query("desde")
	hasta := c.Query("hasta")
	if desde == "" || hasta == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros desde y hasta requeridos (YYYY-MM-DD)"})
		return
	}
	resp, err := h.agendaSvc.AgendaInstructor(instID, desde, hasta)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetAgendaFicha GET /fichas-caracterizacion/:id/agenda?desde=&hasta=
func (h *InstructorAgendaHandler) GetAgendaFicha(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return
	}
	desde := c.Query("desde")
	hasta := c.Query("hasta")
	if desde == "" || hasta == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parámetros desde y hasta requeridos (YYYY-MM-DD)"})
		return
	}
	resp, err := h.agendaSvc.AgendaFicha(uint(id), desde, hasta)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
