# REGLAS OBLIGATORIAS DE DESARROLLO

Autor: CRANDEYS (Cristian Deysdayr Jiménez)

## Idioma
Siempre responder en español.

## Commits
- No hacer commit/push sin autorización explícita del usuario.

## 1. Tamaño y estructura de archivos
Cada archivo máximo 150 líneas (código + comentarios + blancos). Si se pasa, se parte.
Un archivo = una sola responsabilidad (S de SOLID).

## 2. Reutilización (DRY)
No duplicar. Extraer a funciones, hooks o utils. Buscar si ya existe antes de crear.
Preferir composición, no herencia.

## 3. SOLID (mínimo la S)
Un archivo/clase/módulo = una sola razón para cambiar.

## 4. Código documentado (actualizado)
Quien abra el archivo debe entenderlo como si lo hubieras escrito tú. Palabras fáciles y concretas.

- **Cabecera** (primera persona): qué es, por qué lo hice, dónde lo uso. `@author = Cristian Deysdayr Jiménez`. No `@created`.
- **Funciones**: JSDoc/JavaDoc (qué hace, params, return; `@example` si es difícil).
- **Cada bloque**: comentario de qué hace, por qué está y con qué va. No `i++ // suma 1`.
- Un archivo a la vez, sin romper lo que funciona.

## 5. SonarQube
- Coverage ≥ 80%
- Duplications ≤ 3%
- Hotspots 100%
- Security: 0 críticos y 0 altos
- Reliability: 0 bugs
- Deuda ≤ 5%

## 6. Pruebas
Feliz, borde y error. Mocks de I/O. Pruebas junto con el código.

## 7. Commits
- Formato: `tipo(ámbito): descripción`
- Tipos: feat, fix, docs, style, refactor, perf, test, chore, ci.
- Una cosa por commit.
- Asunto ≤ 50 caracteres, imperativo, sin punto final.
- Después de una línea en blanco: el cuerpo (qué se hizo y por qué).
- Autor del commit: CRANDEYS (`git config`; no cambiarlo).
- Prohibido: Co-authored-by, Cursor, "autorizado por", mezclar feat+fix+docs.
- Ramas: `feature/nombre` desde `develop`.
- Commitear solo si el usuario lo pide. No subir código que no compile o no pase pruebas.

Ejemplo:
```
feat(scraper): extraer certificados SofíaPlus
Se implementa el fetcher autenticado para JOSSO.
Incluye sesión y screenshots de diagnóstico.
Closes #15
```

## 8. Seguridad
Nada de claves en el código. Validar entradas. HTTPS, JWT, CORS. Cerrar hotspots antes de deploy.

## 9. Mantenibilidad
Logs JSON (info/warn/error). Errores globales. Config en .env. README vivo.

## 10. Uso de IA
No inventar APIs ni archivos. Validar contra el código real. Diseño SOLID antes de programar.

## 11. Proceso
Requerimiento → diseño → implementar (≤150, SRP, DRY, comentarios, tests) → Sonar → probar → commit (si lo pides) → PR.

## 12. Ejemplo de cabecera
```java
/**
 * Este archivo calcula el IVA de una venta.
 * Lo hice para no repetir la fórmula en cada pantalla de pagos.
 * Lo uso en el módulo de facturación.
 * @author Cristian Deysdayr Jiménez
 */
```
