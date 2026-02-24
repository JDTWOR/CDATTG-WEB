package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/config"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cfg := config.AppConfig.CORS
		origin := c.Request.Header.Get("Origin")

		allowed := false
		for _, allowedOrigin := range cfg.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}
		// En desarrollo: permitir cualquier origen localhost (ej. Vite 5173)
		if !allowed && config.AppConfig.Env == "development" && origin != "" && strings.Contains(origin, "localhost") {
			allowed = true
		}

		if allowed && origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", strings.Join(cfg.AllowedHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Methods", strings.Join(cfg.AllowedMethods, ", "))
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
