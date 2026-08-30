/**
 * services: parseo de fechas y estado de publicación del portal.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func estadoOBorrador(raw string) (string, error) {
	e := strings.TrimSpace(raw)
	if e == "" {
		return models.PortalEstadoBorrador, nil
	}
	if !models.PortalEstadoPublicacionValido(e) {
		return "", errors.New("estado de publicación inválido")
	}
	return e, nil
}

func parseFechaOpcional(raw *string) (*time.Time, error) {
	if raw == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*raw)
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil, errors.New("fecha inválida")
	}
	return &t, nil
}
