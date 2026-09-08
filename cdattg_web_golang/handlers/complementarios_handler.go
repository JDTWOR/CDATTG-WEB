package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

const (
	errComplementariosNoAuth      = "no autenticado"
	errComplementariosFaltaExcel  = "falta el archivo Excel (campo 'file')"
	errComplementariosAbrirArchivo = "no se pudo abrir el archivo"
	errComplementariosLeerArchivo  = "no se pudo leer el archivo"
	excelMIME                      = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

// ComplementariosHandler expone credenciales SofiaPlus y verificación de aspirantes (módulo FPI).
type ComplementariosHandler struct {
	svc *services.ComplementariosService
}

func NewComplementariosHandler() *ComplementariosHandler {
	return &ComplementariosHandler{svc: services.NewComplementariosService()}
}

// usuarioIDDeContexto obtiene el id del usuario autenticado (lo pone AuthMiddleware).
func usuarioIDDeContexto(c *gin.Context) (uint, bool) {
	v, ok := c.Get("userID")
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}

func requireUsuarioComplementarios(c *gin.Context) (uint, bool) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": errComplementariosNoAuth})
		return 0, false
	}
	return userID, true
}

func leerExcelMultipart(c *gin.Context) ([]byte, bool) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errComplementariosFaltaExcel})
		return nil, false
	}
	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errComplementariosAbrirArchivo})
		return nil, false
	}
	defer func() { _ = f.Close() }()

	contenido, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errComplementariosLeerArchivo})
		return nil, false
	}
	return contenido, true
}

func responderExcel(c *gin.Context, filename string, data []byte, err error) {
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, excelMIME, data)
}

// GetCredencialEstado GET /complementarios/credenciales
func (h *ComplementariosHandler) GetCredencialEstado(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.ObtenerEstado(userID)})
}

// GuardarCredencial POST /complementarios/credenciales
func (h *ComplementariosHandler) GuardarCredencial(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	var req dto.GuardarCredencialSofiaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.GuardarCredencial(userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.ObtenerEstado(userID)})
}

// EliminarCredencial DELETE /complementarios/credenciales
func (h *ComplementariosHandler) EliminarCredencial(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	if err := h.svc.EliminarCredencial(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"eliminado": true}})
}

// VerificarAspirante POST /complementarios/verificar-aspirante
func (h *ComplementariosHandler) VerificarAspirante(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	var req dto.VerificarAspiranteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.VerificarAspirante(userID, req)})
}

// DescargarPlantilla GET /complementarios/plantilla
func (h *ComplementariosHandler) DescargarPlantilla(c *gin.Context) {
	data, err := h.svc.PlantillaLote()
	responderExcel(c, "plantilla_verificacion_aspirantes.xlsx", data, err)
}

// VerificarLote POST /complementarios/verificar-lote (multipart: file)
// Devuelve lote_id al instante; el escaneo corre en segundo plano y el avance
// se consulta con GET /complementarios/verificar-lote/progreso/:lote_id.
func (h *ComplementariosHandler) VerificarLote(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	contenido, ok := leerExcelMultipart(c)
	if !ok {
		return
	}
	res, err := h.svc.VerificarLoteAsync(userID, contenido)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ReintentarVerificacion POST /complementarios/verificar-lote/reintentar
// Recibe JSON {documentos:[{numero_documento, tipo_documento?}]} y arranca un
// nuevo lote solo con los pendientes (NO_VERIFICADO / NO_REGISTRADO).
func (h *ComplementariosHandler) ReintentarVerificacion(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	var req dto.ReintentarVerificacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "el cuerpo debe traer la lista 'documentos'"})
		return
	}
	res, err := h.svc.ReintentarVerificacion(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ProgresoLote GET /complementarios/verificar-lote/progreso/:lote_id
func (h *ComplementariosHandler) ProgresoLote(c *gin.Context) {
	if _, ok := requireUsuarioComplementarios(c); !ok {
		return
	}
	prog, err := h.svc.ProgresoLote(c.Param("lote_id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": prog})
}

// ResultadosLote GET /complementarios/verificar-lote/resultados/:lote_id
func (h *ComplementariosHandler) ResultadosLote(c *gin.Context) {
	if _, ok := requireUsuarioComplementarios(c); !ok {
		return
	}
	res, err := h.svc.ResultadosLote(c.Param("lote_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ConsultarInscripciones POST /complementarios/consultar-inscripciones
func (h *ComplementariosHandler) ConsultarInscripciones(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	var req dto.ConsultarInscripcionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.ConsultarInscripciones(userID, req)})
}

// DescargarPlantillaInscripciones GET /complementarios/inscripciones/plantilla
func (h *ComplementariosHandler) DescargarPlantillaInscripciones(c *gin.Context) {
	data, err := h.svc.PlantillaInscripciones()
	responderExcel(c, "plantilla_consulta_inscripciones.xlsx", data, err)
}

// ConsultarInscripcionesLote POST /complementarios/inscripciones/consultar-lote
// Devuelve lote_id al instante; el escaneo corre en segundo plano y el avance
// se consulta con GET /complementarios/inscripciones/consultar-lote/progreso/:lote_id.
func (h *ComplementariosHandler) ConsultarInscripcionesLote(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	contenido, ok := leerExcelMultipart(c)
	if !ok {
		return
	}
	res, err := h.svc.ConsultarInscripcionesLoteAsync(userID, contenido)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ResultadosLoteInscripciones GET /complementarios/inscripciones/consultar-lote/resultados/:lote_id
func (h *ComplementariosHandler) ResultadosLoteInscripciones(c *gin.Context) {
	if _, ok := requireUsuarioComplementarios(c); !ok {
		return
	}
	res, err := h.svc.ResultadosLoteInscripciones(c.Param("lote_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// ReintentarInscripciones POST /complementarios/inscripciones/consultar-lote/reintentar
// Recibe JSON {documentos:[{numero_documento, programa, tipo_documento?}]} y
// arranca un nuevo lote solo con las filas pendientes (NO_VERIFICADO / NO_ENCONTRADO).
func (h *ComplementariosHandler) ReintentarInscripciones(c *gin.Context) {
	userID, ok := requireUsuarioComplementarios(c)
	if !ok {
		return
	}
	var req dto.ReintentarInscripcionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "el cuerpo debe traer la lista 'documentos' con numero_documento y programa"})
		return
	}
	res, err := h.svc.ReintentarInscripciones(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// VerificarAspiranteBetowa POST /complementarios/betowa/verificar-aspirante
func (h *ComplementariosHandler) VerificarAspiranteBetowa(c *gin.Context) {
	if _, ok := requireUsuarioComplementarios(c); !ok {
		return
	}
	var req dto.VerificarAspiranteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.VerificarAspiranteBetowa(req)})
}

// VerificarLoteBetowa POST /complementarios/betowa/verificar-lote
func (h *ComplementariosHandler) VerificarLoteBetowa(c *gin.Context) {
	if _, ok := requireUsuarioComplementarios(c); !ok {
		return
	}
	contenido, ok := leerExcelMultipart(c)
	if !ok {
		return
	}
	res, err := h.svc.VerificarLoteBetowa(contenido)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}
