package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

// AsistenciaDashboardHub mantiene las conexiones WebSocket del dashboard de asistencia (solo superadmin).
type AsistenciaDashboardHub struct {
	mu      sync.RWMutex
	clients map[*asistenciaDashboardClient]struct{}
}

type asistenciaDashboardClient struct {
	conn *websocket.Conn
	send chan []byte
}

var globalAsistenciaDashboardHub = &AsistenciaDashboardHub{
	clients: make(map[*asistenciaDashboardClient]struct{}),
}

// GetAsistenciaDashboardHub devuelve el hub global para notificar al dashboard.
func GetAsistenciaDashboardHub() *AsistenciaDashboardHub {
	return globalAsistenciaDashboardHub
}

// BroadcastRefresh envía a todos los clientes conectados un mensaje para que recarguen los datos.
func (h *AsistenciaDashboardHub) BroadcastRefresh() {
	msg, _ := json.Marshal(map[string]string{"type": "refresh"})
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		select {
		case c.send <- msg:
		default:
			// canal lleno, omitir
		}
	}
}

// Register añade un cliente al hub.
func (h *AsistenciaDashboardHub) Register(c *asistenciaDashboardClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

// Unregister quita un cliente del hub.
func (h *AsistenciaDashboardHub) Unregister(c *asistenciaDashboardClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
}

// Run inicia el loop de escritura del cliente (debe llamarse en goroutine).
func (c *asistenciaDashboardClient) Run(hub *AsistenciaDashboardHub) {
	defer func() {
		hub.Unregister(c)
		_ = c.conn.Close()
	}()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("[asistencia-dashboard-ws] write: %v", err)
			return
		}
	}
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// DashboardWebSocket maneja la conexión WebSocket del dashboard de asistencia. Solo superadmin. Token por query: ?token=xxx
func DashboardWebSocket(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token requerido en query (?token=...)"})
		return
	}
	claims, err := utils.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
		return
	}
	userRepo := repositories.NewUserRepository()
	user, err := userRepo.FindByID(claims.UserID)
	if err != nil || user == nil || !user.Status {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no encontrado o inactivo"})
		return
	}
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
		return
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	roles, _ := authz.GetRolesForUser(e, sub)
	isSuperAdmin := false
	for _, r := range roles {
		if r == "SUPER ADMINISTRADOR" {
			isSuperAdmin = true
			break
		}
	}
	if !isSuperAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo el superadministrador puede acceder al dashboard en tiempo real"})
		return
	}
	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[asistencia-dashboard-ws] upgrade: %v", err)
		return
	}
	client := &asistenciaDashboardClient{conn: conn, send: make(chan []byte, 256)}
	hub := GetAsistenciaDashboardHub()
	hub.Register(client)
	go client.Run(hub)
	go func() {
		defer conn.Close()
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				close(client.send)
				return
			}
		}
	}()
}
