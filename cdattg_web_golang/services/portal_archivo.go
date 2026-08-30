/**
 * services: guardado de imágenes del portal (storage/portal).
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

const (
	portalArchivoDir     = "storage/portal"
	portalArchivoMaxByte = 5 * 1024 * 1024
)

var portalExtPermitidas = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".pdf": true}

// GuardarArchivoPortal persiste un adjunto y devuelve el nombre público.
func GuardarArchivoPortal(fh *multipart.FileHeader) (string, error) {
	if fh == nil {
		return "", errors.New("adjunte un archivo")
	}
	if fh.Size > portalArchivoMaxByte {
		return "", errors.New("el archivo supera 5 MB")
	}
	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if !portalExtPermitidas[ext] {
		return "", errors.New("solo se permiten jpg, png, webp, gif o pdf")
	}
	if err := os.MkdirAll(portalArchivoDir, 0o750); err != nil {
		return "", err
	}
	nombre, err := nombreArchivoPortal(ext)
	if err != nil {
		return "", err
	}
	src, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()
	destino := filepath.Join(portalArchivoDir, nombre)
	dst, err := os.OpenFile(destino, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		return "", err
	}
	defer dst.Close()
	if _, err := io.Copy(dst, io.LimitReader(src, portalArchivoMaxByte+1)); err != nil {
		return "", err
	}
	return nombre, nil
}

// RutaArchivoPortal resuelve un nombre seguro dentro de storage/portal.
// Acepta el *nombre de gin (puede venir con barra inicial).
func RutaArchivoPortal(nombre string) (string, error) {
	base := strings.Trim(strings.ReplaceAll(nombre, "\\", "/"), "/")
	if base == "" || strings.Contains(base, "/") || strings.Contains(base, "..") {
		return "", errors.New("nombre de archivo inválido")
	}
	ext := strings.ToLower(filepath.Ext(base))
	if !portalExtPermitidas[ext] {
		return "", errors.New("tipo no permitido")
	}
	return filepath.Join(portalArchivoDir, base), nil
}

func nombreArchivoPortal(ext string) (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf) + ext, nil
}
