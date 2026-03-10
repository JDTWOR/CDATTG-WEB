package services

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

// AlertaAsistenciaService verifica fichas que no han iniciado toma de asistencia y notifica por correo a coordinadores.
type AlertaAsistenciaService struct {
	fichaRepo     repositories.FichaRepository
	asistenciaRepo repositories.AsistenciaRepository
	alertaRepo    repositories.AlertaAsistenciaRepository
	userRepo      repositories.UserRepository
}

// NewAlertaAsistenciaService crea el servicio.
func NewAlertaAsistenciaService() *AlertaAsistenciaService {
	return &AlertaAsistenciaService{
		fichaRepo:      repositories.NewFichaRepository(),
		asistenciaRepo: repositories.NewAsistenciaRepository(),
		alertaRepo:     repositories.NewAlertaAsistenciaRepository(),
		userRepo:       repositories.NewUserRepository(),
	}
}

// CheckAndNotify ejecuta la verificación: si alguna ficha activa con formación hoy no ha abierto sesión de asistencia
// pasados N minutos desde el inicio de la jornada, envía un correo a todos los coordinadores (una sola vez por ficha por día).
func (s *AlertaAsistenciaService) CheckAndNotify() {
	cfgAlertas := config.AppConfig.Alertas
	cfgSMTP := config.AppConfig.SMTP
	if !cfgAlertas.Enabled || !cfgSMTP.Enabled {
		return
	}

	loc, err := time.LoadLocation(config.AppConfig.Database.TimeZone)
	if err != nil {
		loc = time.Local
	}
	now := time.Now().In(loc)
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// Emails de coordinadores
	emails := s.emailsCoordinadores()
	if len(emails) == 0 {
		log.Println("Alerta asistencia: no hay coordinadores con correo para notificar")
		return
	}

	fichas, err := s.fichaRepo.FindActivasParaHoyConJornada(now)
	if err != nil {
		log.Printf("Alerta asistencia: error listando fichas: %v", err)
		return
	}

	minutosDespues := cfgAlertas.MinutosDespuesInicioJornada
	if minutosDespues <= 0 {
		minutosDespues = 90
	}

	for i := range fichas {
		f := &fichas[i]
		if f.JornadaID == nil || f.Jornada == nil {
			continue
		}
		limite := HoraInicioMasMinutos(f.Jornada, hoy, minutosDespues)
		if now.Before(limite) {
			continue
		}
		// Ya pasó el límite: verificar si hay sesión de asistencia hoy
		fechaStr := hoy.Format("2006-01-02")
		ids, errSes := s.asistenciaRepo.FindIDsByFichaIDAndFecha(f.ID, fechaStr)
		if errSes != nil || len(ids) > 0 {
			continue
		}
		// No hay sesión; verificar si ya enviamos alerta hoy
		existe, errEx := s.alertaRepo.ExistsByFichaIDAndFecha(f.ID, hoy)
		if errEx != nil || existe {
			continue
		}
		// Enviar correo y registrar
		nombreJornada := f.Jornada.Nombre
		if nombreJornada == "" {
			nombreJornada = "N/A"
		}
		asunto := fmt.Sprintf("[CDATTG] Ficha %s no ha iniciado toma de asistencia", f.Ficha)
		cuerpo := fmt.Sprintf("Se informa que la ficha %s (jornada %s) no ha registrado inicio de toma de asistencia el día %s, pasados %d minutos desde el inicio de la jornada.\n\nFicha: %s\nJornada: %s\nFecha: %s",
			f.Ficha, nombreJornada, fechaStr, minutosDespues, f.Ficha, nombreJornada, fechaStr)
		if errSend := utils.SendMail(emails, asunto, cuerpo); errSend != nil {
			log.Printf("Alerta asistencia: error enviando correo para ficha %s: %v", f.Ficha, errSend)
			continue
		}
		log.Printf("Alerta asistencia: correo enviado a coordinadores por ficha %s (sin asistencia iniciada)", f.Ficha)
		if errCreate := s.alertaRepo.Create(&models.AlertaAsistenciaLog{FichaID: f.ID, Fecha: hoy}); errCreate != nil {
			log.Printf("Alerta asistencia: error registrando log para ficha %s: %v", f.Ficha, errCreate)
		}
	}
}

func (s *AlertaAsistenciaService) emailsCoordinadores() []string {
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return nil
	}
	userIDs := authz.GetUserIDsWithRole(e, "COORDINADOR")
	emails := make([]string, 0, len(userIDs))
	seen := make(map[string]bool)
	for _, idStr := range userIDs {
		id, errParse := strconv.ParseUint(idStr, 10, 32)
		if errParse != nil {
			continue
		}
		u, err := s.userRepo.FindByID(uint(id))
		if err != nil || u == nil || !u.Status {
			continue
		}
		email := strings.TrimSpace(u.Email)
		if email == "" || seen[email] {
			continue
		}
		if strings.HasSuffix(strings.ToLower(email), "@sena.local") {
			continue
		}
		seen[email] = true
		emails = append(emails, email)
	}
	return emails
}
