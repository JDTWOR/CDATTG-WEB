package utils

import (
	"bytes"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"github.com/sena/cdattg-web-golang/config"
)

// SendMail envía un correo a los destinatarios usando la config SMTP.
// Si SMTP no está habilitado, no hace nada y devuelve nil.
func SendMail(to []string, subject, bodyPlain string) error {
	cfg := config.AppConfig.SMTP
	if !cfg.Enabled || cfg.Host == "" {
		log.Println("SMTP no configurado o deshabilitado; no se envía correo")
		return nil
	}
	if len(to) == 0 {
		return nil
	}

	from := cfg.From
	if from == "" {
		from = cfg.User
	}

	msg := bytes.NewBuffer(nil)
	fmt.Fprintf(msg, "From: %s\r\n", from)
	fmt.Fprintf(msg, "To: %s\r\n", strings.Join(to, ", "))
	fmt.Fprintf(msg, "Subject: %s\r\n", subject)
	msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(bodyPlain)

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	var auth smtp.Auth
	if cfg.User != "" && cfg.Password != "" {
		auth = smtp.PlainAuth("", cfg.User, cfg.Password, cfg.Host)
	}
	if err := smtp.SendMail(addr, auth, from, to, msg.Bytes()); err != nil {
		return fmt.Errorf("enviar correo: %w", err)
	}
	return nil
}
