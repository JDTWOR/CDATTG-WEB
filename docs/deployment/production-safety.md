# Despliegue - Seguridad en Produccion

## Reglas criticas (obligatorias)

- **NUNCA eliminar la base de datos de produccion**.
- **NUNCA ejecutar `make db-fresh` ni `make db-reset` en produccion**.
- Separar estrictamente `development`, `staging` y `production`.
- Usar variables de entorno diferentes por entorno.
- Exigir confirmacion explicita para acciones destructivas.
- Ejecutar backups automaticos y pruebas de restauracion.
- Aplicar migraciones versionadas; no cambios manuales directos en produccion.

## Estrategia segura de migraciones

1. Ejecutar migraciones en `staging`.
2. Medir impacto en tiempos, locks y compatibilidad.
3. Tomar backup previo en produccion.
4. Aplicar migracion en ventana controlada.
5. Ejecutar smoke tests de API y funcionalidades criticas.

Principios:

- Cambios backward-compatible por fases.
- Evitar migraciones destructivas en un solo paso.
- Preferir desactivar/retirar columnas en releases posteriores.

## Estrategia de backups

Politica minima recomendada:

- Backup completo diario de PostgreSQL.
- Retencion de 7/14/30 dias segun criticidad.
- Copia externa fuera del mismo servidor.
- Prueba mensual de restauracion en entorno aislado.

Ejemplo de backup (referencial):

```bash
pg_dump -h <host> -U <user> -d <db> -F c -f backup_$(date +%F).dump
```

## Plan de rollback

1. Detectar incidente y congelar nuevas migraciones.
2. Revertir aplicacion al artefacto previo estable.
3. Restaurar base desde backup si la migracion comprometio datos.
4. Validar endpoints criticos y consistencia de negocio.
5. Registrar RCA (analisis causa raiz) y acciones preventivas.

## Endurecimiento recomendado adicional

- Restringir acceso remoto a PostgreSQL por IP/VPN (evitar `0.0.0.0/0` sin firewall estricto).
- Forzar TLS extremo a extremo cuando sea posible.
- Rotar secretos periodicamente.
- Agregar cabeceras de seguridad modernas en Nginx:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `Referrer-Policy`
- Implementar CI/CD con checks de seguridad y pruebas automáticas.
