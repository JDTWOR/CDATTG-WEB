package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

const (
	eleccionErrNoAuth     = "no autenticado"
	eleccionErrIDInvalido = "id inválido"
)

type EleccionHandler struct {
	svc services.EleccionService
}

func NewEleccionHandler() *EleccionHandler {
	return &EleccionHandler{svc: services.NewEleccionService()}
}

type eleccionAuth struct {
	userID    uint
	roles     []string
	personaID *uint
}

func eleccionAuthFromContext(c *gin.Context) (eleccionAuth, bool) {
	uid, exists := c.Get("userID")
	if !exists {
		respondEleccionError(c, http.StatusUnauthorized, eleccionErrNoAuth)
		return eleccionAuth{}, false
	}
	userID, ok := uid.(uint)
	if !ok {
		respondEleccionError(c, http.StatusUnauthorized, eleccionErrNoAuth)
		return eleccionAuth{}, false
	}
	auth := eleccionAuth{userID: userID, roles: rolesFromContext(c)}
	if u, okU := c.Get("user"); okU {
		if user, okM := u.(*models.User); okM && user != nil {
			auth.personaID = user.PersonaID
		}
	}
	return auth, true
}

func eleccionParamID(c *gin.Context) (uint, bool) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		respondEleccionError(c, http.StatusBadRequest, eleccionErrIDInvalido)
		return 0, false
	}
	return id, true
}

func respondEleccionError(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}

func respondEleccionBadRequest(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

type eleccionProcesoAdminFn func(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error)

func (h *EleccionHandler) withAuthRoles(c *gin.Context, fn func(auth eleccionAuth)) {
	auth, ok := eleccionAuthFromContext(c)
	if !ok {
		return
	}
	fn(auth)
}

func (h *EleccionHandler) withAuthRolesAndID(c *gin.Context, fn func(auth eleccionAuth, id uint)) {
	auth, ok := eleccionAuthFromContext(c)
	if !ok {
		return
	}
	id, ok := eleccionParamID(c)
	if !ok {
		return
	}
	fn(auth, id)
}

func (h *EleccionHandler) runProcesoAdmin(c *gin.Context, fn eleccionProcesoAdminFn) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		item, err := fn(auth.userID, auth.roles, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) ListProcesos(c *gin.Context) {
	h.withAuthRoles(c, func(auth eleccionAuth) {
		list, err := h.svc.ListProcesos(auth.userID, auth.roles)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": list})
	})
}

func (h *EleccionHandler) GetProceso(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		item, err := h.svc.GetProceso(auth.userID, auth.roles, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) CreateProceso(c *gin.Context) {
	h.withAuthRoles(c, func(auth eleccionAuth) {
		var req dto.EleccionProcesoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		item, err := h.svc.CreateProceso(auth.userID, auth.roles, req)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": item})
	})
}

func (h *EleccionHandler) UpdateProceso(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		var req dto.EleccionProcesoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		item, err := h.svc.UpdateProceso(auth.userID, auth.roles, id, req)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) AbrirInscripcion(c *gin.Context) {
	h.cambiarEstado(c, models.EleccionEstadoInscripcion)
}

func (h *EleccionHandler) CerrarInscripcion(c *gin.Context) {
	h.runProcesoAdmin(c, h.svc.CerrarInscripcion)
}

func (h *EleccionHandler) AbrirVotacion(c *gin.Context) {
	h.runProcesoAdmin(c, h.svc.AbrirVotacion)
}

func (h *EleccionHandler) cambiarEstado(c *gin.Context, estado string) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		item, err := h.svc.CambiarEstadoProceso(auth.userID, auth.roles, id, estado)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) CalcularResultado(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		res, err := h.svc.CalcularResultado(auth.userID, auth.roles, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": res})
	})
}

func (h *EleccionHandler) RegistrarDesempate(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		var req dto.EleccionDesempateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		res, err := h.svc.RegistrarDesempate(auth.userID, auth.roles, id, req)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": res})
	})
}

func (h *EleccionHandler) ListPlanchasAdmin(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		soloConfirmadas := c.Query("confirmadas") == "1"
		list, err := h.svc.ListPlanchas(auth.userID, auth.roles, id, soloConfirmadas)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": list})
	})
}

func (h *EleccionHandler) ListPlanchasAprendiz(c *gin.Context) {
	auth, ok := eleccionAuthFromContext(c)
	if !ok {
		return
	}
	id, ok := eleccionParamID(c)
	if !ok {
		return
	}
	list, err := h.svc.ListPlanchasConfirmadasAprendiz(auth.personaID, id)
	if err != nil {
		respondEleccionBadRequest(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *EleccionHandler) ProponerPlancha(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		var req dto.EleccionPlanchaRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		item, err := h.svc.ProponerPlancha(auth.userID, auth.personaID, id, req)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": item})
	})
}

func (h *EleccionHandler) ConfirmarPlancha(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		item, err := h.svc.ConfirmarPlancha(auth.userID, auth.personaID, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) RechazarPlancha(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		var req dto.EleccionRechazarPlanchaRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		if err := h.svc.RechazarPlancha(auth.userID, auth.roles, id, req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "plancha rechazada"})
	})
}

func (h *EleccionHandler) RetirarPlancha(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		if err := h.svc.RetirarPlancha(auth.userID, auth.personaID, id); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "plancha retirada"})
	})
}

func (h *EleccionHandler) RegistrarVoto(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		var req dto.EleccionVotoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		item, err := h.svc.RegistrarVoto(auth.userID, auth.personaID, id, req)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": item})
	})
}

func (h *EleccionHandler) GetResultados(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		incluirVotos := c.Query("auditoria") == "1"
		res, err := h.svc.GetResultados(auth.userID, auth.roles, id, incluirVotos)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": res})
	})
}

func (h *EleccionHandler) ExportResultadosCSV(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		data, err := h.svc.ExportResultadosCSV(auth.userID, auth.roles, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		const csvContentType = "text/csv; charset=utf-8"
		c.Header("Content-Type", csvContentType)
		c.Header("Content-Disposition", "attachment; filename=eleccion_resultados.csv")
		c.Data(http.StatusOK, csvContentType, data)
	})
}

func (h *EleccionHandler) GetMiRegional(c *gin.Context) {
	auth, ok := eleccionAuthFromContext(c)
	if !ok {
		return
	}
	resp, err := h.svc.GetMiRegional(auth.userID, auth.personaID)
	if err != nil {
		respondEleccionBadRequest(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *EleccionHandler) GetRepresentantesVigentes(c *gin.Context) {
	id, ok := eleccionParamID(c)
	if !ok {
		return
	}
	resp, err := h.svc.GetRepresentantesVigentes(id)
	if err != nil {
		respondEleccionBadRequest(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *EleccionHandler) GetHistorialRepresentantes(c *gin.Context) {
	h.withAuthRolesAndID(c, func(auth eleccionAuth, id uint) {
		list, err := h.svc.GetHistorialRepresentantes(auth.userID, auth.roles, id)
		if err != nil {
			respondEleccionBadRequest(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": list})
	})
}

func (h *EleccionHandler) GetReglas(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": services.EleccionReglasDocumentadas()})
}
