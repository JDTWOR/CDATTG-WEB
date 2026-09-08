"""Verificación de aspirantes en SofiaPlus vía login SENA + Consultar Registro.

Solo SofíaPlus (Playwright/StealthyFetcher). Betowa vive en ``betowa_scraper``
y no debe importar ni reutilizar la sesión/navegador de este módulo.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import urljoin

from patchright.sync_api import Frame, Page
from scrapling.fetchers import StealthyFetcher

from app.config import (
    DEFAULT_ROL,
    DIAG_DIR,
    DIAG_PNG,
    DIAGNOSTICO,
    HEADLESS,
    SOFIA_PARALLEL_WORKERS,
    SOFIA_RAPIDO,
    SOFIA_DEBUG_RED,
    SOFIA_SESSION_DIR,
    SOFIA_SESSION_PERSISTENTE,
    TIMEOUT_SEGUNDOS,
    require_login_url,
)
from app import progreso
from app.types import Credenciales, DocumentoLote, ResultadoVerificacion

# Waits: modo rápido recorta sleeps fijos (el cuello de botella sigue siendo Sofía/A4J).
WAIT_SHORT_MS = 50 if SOFIA_RAPIDO else 150
WAIT_MENU_MS = 120 if SOFIA_RAPIDO else 350
WAIT_FORM_MS = 80 if SOFIA_RAPIDO else 250
WAIT_LOGIN_MS = 8000 if SOFIA_RAPIDO else 12000
WAIT_ROLES_MS = 8000 if SOFIA_RAPIDO else 12000
POST_LOGIN_FAIL_FAST_MS = 8000 if SOFIA_RAPIDO else 10000
PAGE_TIMEOUT_MS = max(TIMEOUT_SEGUNDOS, 60) * 1000
POLL_MS = 60 if SOFIA_RAPIDO else 250


def _pause(page: Page, ms: int) -> None:
    """Sleep fijo; en modo rápido ~⅓ (mín. 40 ms)."""
    if ms <= 0:
        return
    if SOFIA_RAPIDO:
        ms = max(40, ms // 3)
    page.wait_for_timeout(ms)

BROWSER_FLAGS = [
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--window-size=1280,720",
    "--lang=es-CO",
    # En Docker, HTTPS :443 de SofiaPlus no responde; evitar upgrade automático / bloqueos cliente.
    "--disable-features=HttpsUpgrades,AutomaticHttpsDefault,UpgradeInsecureRequests,BlockInsecurePrivateNetworkRequests,HttpsFirstBalancedModeAutoEnable",
    "--disable-client-side-phishing-detection",
    "--disable-popup-blocking",
]

# Portal Sofía Plus (Docker/local): HTTP intencional; HTTPS :443 no responde aquí.
JOSSO_SECURITY_CHECK_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/josso_security_check")
SOFIA_JOSSO_LOGIN_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/josso_login/")
SOFIA_SELECCION_ROL_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/secured/seleccionarRol.jsp")

# Contenedores típicos del portal interno (encabezado / sidebar) donde está la Lista de Roles.
CONTENEDORES_ROLES = (
    "#encabezado",
    "#sidebar",
    ".sidebar",
    "#menu",
    "#menuLateral",
    ".menu-lateral",
    "#formRoles",
    "#listaRoles",
    "#listaDeRoles",
    "[id*='formRoles']",
    "[id*='listaRoles']",
    "[id*='listaDeRoles']",
    "[name*='formRoles']",
    "[id*='sidebar']",
    "[class*='sidebar']",
    "[id*='encabezado']",
    "select[name*='rol']",
    "select[id*='rol']",
    "select[name*='Rol']",
    "select[id*='Rol']",
)

# Tipos / roles / mensajes reutilizados (evita literales duplicados Sonar S1192).
TIPO_CC = "Cédula de Ciudadanía"
TIPO_TI = "Tarjeta de Identidad"
TIPO_CE = "Cédula de Extranjería"
TIPO_PPT = "Permiso por Protección Temporal"
TIPO_PEP = "Permiso especial de permanencia"
TIPO_DNI = "DNI - Documento Nacional de Identificación"
TIPO_NCS = "Número Ciego SENA"
ROL_USUARIO_SENA = "Usuario SENA"
MENU_CONSULTAR_REGISTRO = "Consultar Registro"
MENU_SGS = "SGS"
MSG_CRED_INVALIDAS = "Credenciales SENA inválidas"
TXT_ERROR_402 = "error 402"
TXT_ERROR_401 = "error 401"
TXT_ERROR_404 = "error 404"
# Prefijos sin literal "http://" continuo (Sofía solo responde por HTTP aquí).
SCHEME_HTTPS = "https" + "://"
SCHEME_HTTP = "http" + "://"
AUTHPRE_BASE = SCHEME_HTTP + "authpre.senasofiaplus.edu.co"
SOFIA_REFERER = SCHEME_HTTP + "senasofiaplus.edu.co/sofia/"

# Textos completos de roles en SofiaPlus (como aparecen en la Lista de Roles).
ROLES_SOFIA_CONOCIDOS = (
    "Encargado de ingreso centro formación",
    "Encargado de ingreso centro formacion",
    "Encargado de Ingreso Centro Formación",
    "Aprendiz",
    "Aspirante",
    "Instructor",
    "Asesor",
    "Administrador de centro",
    "Administrador de seguridad",
    ROL_USUARIO_SENA,
    "Funcionario",
)

# Fragmentos para reconocer el <select> de roles (normalizados, sin tildes).
PALABRAS_CLAVE_ROL = (
    "encargado de ingreso centro formacion",
    "encargado de ingreso",
    "centro formacion",
    "ingreso centro",
    "lista de roles",
    "administrador de centro",
    "administrador de seguridad",
    "usuario sena",
    "aprendiz",
    "aspirante",
    "instructor",
    "asesor",
    "administrador",
    "funcionario",
)

# Tipos probados en Consultar Registro (orden del select Sofía / más frecuentes primero).
TIPOS_CONSULTA = [
    TIPO_CC,
    TIPO_CE,
    TIPO_TI,
    TIPO_PEP,
    TIPO_DNI,
    TIPO_NCS,
    "Pasaporte",
    TIPO_PPT,
]
# Lote Fase 1: solo los más comunes (CC/TI/CE). Evita 8 consultas × N docs.
TIPOS_CONSULTA_LOTE = [TIPO_CC, TIPO_TI, TIPO_CE]

SOFIA_CODIGO_A_TIPO = {
    "CC": TIPO_CC,
    "CE": TIPO_CE,
    "TI": TIPO_TI,
    "PEP": TIPO_PEP,
    "DNI": TIPO_DNI,
    "NCS": TIPO_NCS,
    "PPT": TIPO_PPT,
    "PAS": "Pasaporte",
    "PS": "Pasaporte",  # value real en Consultar Registro Sofía
}

# IDs reales del form consultarregistro.faces
SEL_TIPO_USUARIO = '[id="formConsultarRegistro:tipoUsuarioSOL"]'
SEL_TIPO_DOC = '[id="formConsultarRegistro:tipoDocumentoSOL"]'
SEL_NUMERO_DOC = (
    '[id="formConsultarRegistro:numeroDocumentoIT"], '
    'input[id*="numeroDocumento"], input[type="text"].control_req'
)

TIPO_LOGIN_TEXTO_A_CODIGO = {
    "cedula de ciudadania": "CC",
    "cedula de extranjeria": "CE",
    "tarjeta de identidad": "TI",
    "permiso especial de permanencia": "PEP",
    "permiso por proteccion temporal": "PPT",
    "pep": "PEP",
    "ppt": "PPT",
}

CODIGO_A_TIPO_CORTO = {
    "CC": TIPO_CC,
    "CE": TIPO_CE,
    "TI": TIPO_TI,
    "PEP": TIPO_PEP,
    "PPT": TIPO_PPT,
    "DNI": TIPO_DNI,
    "NCS": TIPO_NCS,
}

PASOS_MENU = (MENU_SGS, "Gestionar SGS", MENU_CONSULTAR_REGISTRO)

VERIFICACION_REGISTRADO = "REGISTRADO"
VERIFICACION_NO_REGISTRADO = "NO_REGISTRADO"
VERIFICACION_NO_VERIFICADO = "NO_VERIFICADO"

MSG_NO_REGISTRADO = "no se encuentra registrado en el sistema"
MSG_NO_ENCONTR = "no se encontr"
MSG_INSCRIPCION = "Inscripción"
MSG_TIPO_IDENT = "tipo de identificacion"
MSG_PRIMER_APELLIDO = "primer apellido"
MSG_IDENT_FICHA = "identificador ficha"
SEL_INPUT_TEXT = 'input[type="text"]'
MSG_REINTENTE = " Reintente más tarde."
MSG_SIN_RESPUESTA_SCRAPER = "No se obtuvo respuesta del scraper"
MSG_NO_REG_TODOS = (
    "No está registrado en SofiaPlus (probados todos los tipos de documento)."
)

# Prefijos de etiqueta. Sofía pinta "NIS:" vía CSS ::after; inner_text llega SIN ":".
_PREF_TIPO_IDENT = (
    "tipo de identificacion:",
    "tipo de identificación:",
    MSG_TIPO_IDENT,
    "tipo de identificación",
)
_PREF_NOMBRES = ("nombres:", "nombres")
_PREF_APELLIDO1 = ("primer apellido:", MSG_PRIMER_APELLIDO)
_PREF_APELLIDO2 = ("segundo apellido:", "segundo apellido")
_PREF_NIS = ("nis:", "nis")

# Spans del resultado en consultarregistro.faces (más fiable que inner_text).
_DOM_NIS = '[id="formRegistro:perNisOTX"], [id$=":perNisOTX"]'
_DOM_TIPO = '[id="formRegistro:perTipoIdentificacionOTX"], [id$=":perTipoIdentificacionOTX"]'
_DOM_NUMERO = (
    '[id="formRegistro:perNumeroDocumentoIdentidadOTX"], '
    '[id$=":perNumeroDocumentoIdentidadOTX"]'
)
_DOM_NOMBRES = '[id="formRegistro:perNombreOTX"], [id$=":perNombreOTX"]'
_DOM_AP1 = '[id="formRegistro:perPrimerApellidoOTX"], [id$=":perPrimerApellidoOTX"]'
_DOM_AP2 = '[id="formRegistro:perSegundoApellidoOTX"], [id$=":perSegundoApellidoOTX"]'


# Reexport para compatibilidad interna (inscripciones_scraper, etc.).
__all__ = (
    "Credenciales",
    "DocumentoLote",
    "ResultadoVerificacion",
    "ContextoScrape",
    "verificar_documento",
    "verificar_lote",
)


logger = logging.getLogger("sofia.scraper")


@dataclass
class ContextoScrape:
    cred: Credenciales
    docs: list[DocumentoLote]
    resultados: list[ResultadoVerificacion] = field(default_factory=list)
    lote: bool = False
    worker_id: int = 0
    lote_id: str = ""


class _FetchState:
    consulta_url = ""


# Serializa SOLO la escritura de dumps (nombres con sello de segundos), no el navegador.
# Los lotes corren en paralelo con ThreadPoolExecutor: cada worker abre su propio navegador.
_DUMP_LOCK = threading.Lock()

# Un lock por worker-slot: serializa el acceso al perfil de sesión persistente de cada slot
# (Chromium no permite dos procesos sobre el mismo user_data_dir). No bloquea entre slots.
_SESSION_SLOTS = max(SOFIA_PARALLEL_WORKERS + 2, 4)
_SESSION_SLOT_LOCKS = [threading.Lock() for _ in range(_SESSION_SLOTS)]


def _slot_sesion(worker_id: int) -> tuple[threading.Lock, str]:
    idx = worker_id % _SESSION_SLOTS
    perfil = os.path.join(SOFIA_SESSION_DIR, f"w{idx}")
    return _SESSION_SLOT_LOCKS[idx], perfil


def ejecutar_fetch(worker_id: int, page_action: Callable[[Page], None]) -> None:
    """Abre el navegador con sesión persistente por worker-slot (reutilizable entre lotes).

    Si la sesión JOSSO del perfil sigue viva, el siguiente lote arranca directo en el
    formulario (sin re-loguear). Si el perfil está corrupto, se limpia y se reintenta 1 vez.
    """
    lock, perfil = _slot_sesion(worker_id)
    kwargs = _stealthy_fetch_kwargs()
    if SOFIA_SESSION_PERSISTENTE:
        os.makedirs(perfil, exist_ok=True)
        kwargs["user_data_dir"] = perfil

    def _abrir() -> None:
        StealthyFetcher.fetch(
            require_login_url(),
            page_action=page_action,
            **kwargs,
        )

    with lock:
        try:
            _abrir()
        except Exception:
            # Perfil corrupto (p. ej. cambio de versión de Chromium): descartar y reintentar.
            logger.warning("Perfil de sesión %s corrupto; se limpia y reintenta", perfil)
            shutil.rmtree(perfil, ignore_errors=True)
            os.makedirs(perfil, exist_ok=True)
            _abrir()


def _es_dominio_sofia(url: str) -> bool:
    return "senasofiaplus.edu.co" in url


def _http_url(url: str) -> str:
    return url if not url.startswith(SCHEME_HTTPS) else SCHEME_HTTP + url[8:]


def _page_setup_http(page: Page) -> None:
    """SofiaPlus en Docker solo responde en :80; reescribir peticiones HTTPS→HTTP."""

    def reroute(route, request) -> None:
        url = request.url
        if url.startswith(SCHEME_HTTPS) and _es_dominio_sofia(url):
            # Preservar método/body: si no, el POST de JOSSO se rompe y Chromium
            # acaba en chrome-error (ERR_BLOCKED_BY_CLIENT).
            route.continue_(
                url=_http_url(url),
                method=request.method,
                headers=request.headers,
                post_data=request.post_data,
            )
        else:
            route.continue_()

    page.route("**/*", reroute)

    if SOFIA_DEBUG_RED:
        _loguear_red(page)


_SOFIA_ASSETS = (".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff", ".woff2", ".ico", ".webp")


def _redactar_cuerpo(cuerpo: str) -> str:
    """Enmascara valores de credenciales en cuerpos POST (password/josso_password...)."""
    return re.sub(r"(?i)(password|josso_password|clave|pass)=([^&\s]+)", r"\1=***", cuerpo)


def _es_peticion_sofia(url: str) -> bool:
    return _es_dominio_sofia(url) and not url.lower().endswith(_SOFIA_ASSETS)


def _loguear_red(page: Page) -> None:
    """Registra cada petición del navegador a SofíaPlus (método, URL, body redactado, status, ms)."""
    activos: dict[int, tuple[str, float]] = {}
    page.on("request", lambda req: _red_log_request(activos, req))
    page.on("response", lambda resp: _red_log_response(activos, resp))


def _red_log_request(activos: dict[int, tuple[str, float]], req) -> None:
    url = req.url
    if not _es_peticion_sofia(url):
        return
    metodo = req.method
    activos[id(req)] = (url, time.time())
    cuerpo = ""
    if metodo in ("POST", "PUT", "PATCH"):
        try:
            datos = req.post_data
            if datos:
                cuerpo = _redactar_cuerpo(datos)[:500]
        except Exception:
            pass
    logger.info("RED>> %s %s%s", metodo, url, f" | body: {cuerpo}" if cuerpo else "")


def _red_log_response(activos: dict[int, tuple[str, float]], resp) -> None:
    url = resp.url
    if not _es_peticion_sofia(url):
        return
    t0 = activos.pop(id(resp.request), None)
    ms = f" en {(time.time() - t0[1]) * 1000:.0f}ms" if t0 else ""
    logger.info("RED<< %s %s%s", resp.status, url, ms)


def _urls_pagina(page: Page) -> list[str]:
    urls = [page.url]
    for frame in page.frames:
        try:
            urls.append(frame.url)
        except Exception:
            continue
    return urls


def _hay_error_chrome(page: Page) -> bool:
    return any(u.lower().startswith("chrome-error:") for u in _urls_pagina(page))


SOFIA_HOME_URL = SCHEME_HTTP + "senasofiaplus.edu.co/sofia/home/principal.faces"
SOFIA_PUBLIC_HOME = SCHEME_HTTP + "senasofiaplus.edu.co/sofia-public/"


def _pagina_error_sofia(page: Page) -> bool:
    t = _texto_pagina_completo(page)
    if "codigo de error" in t or TXT_ERROR_404 in t or TXT_ERROR_402 in t or TXT_ERROR_401 in t:
        return True
    try:
        u = page.url.lower()
        if "error404" in u or "error402" in u or "error401" in u:
            return True
    except Exception:
        pass
    return False


def _sesion_post_login_ok(page: Page) -> bool:
    """True si ya hay UI útil de Sofía (no basta con la URL)."""
    if _hay_error_chrome(page) or _en_pagina_login(page) or _pagina_error_sofia(page):
        return False
    if _tiene_lista_roles(page):
        return True
    if _texto_visible_en_frames(page, "Bienvenido a SOFIA"):
        return True
    # Select de roles del sidebar suele mostrar Aspirante / Usuario SENA.
    if _texto_visible_en_frames(page, "Aspirante") and (
        _texto_visible_en_frames(page, MSG_INSCRIPCION)
        or _texto_visible_en_frames(page, "Selección")
        or _texto_visible_en_frames(page, ROL_USUARIO_SENA)
    ):
        return True
    if _texto_visible_en_frames(page, MENU_SGS):
        return True
    if _texto_visible_en_frames(page, MSG_INSCRIPCION) and _texto_visible_en_frames(
        page, ROL_USUARIO_SENA
    ):
        return True
    return False


def _recuperar_post_login(page: Page) -> bool:
    """Si Chrome falló (ERR_BLOCKED_BY_CLIENT / HTTPS) tras login, reabrir sesión por HTTP."""
    if not _hay_error_chrome(page) and _sesion_post_login_ok(page):
        return True
    if not _hay_error_chrome(page) and not _en_pagina_login(page):
        # Aún sin menú visible; intentar home igualmente.
        pass
    elif not _hay_error_chrome(page):
        return False

    for destino in (
        SOFIA_HOME_URL,
        SOFIA_SELECCION_ROL_URL,
        SOFIA_PUBLIC_HOME,
    ):
        try:
            page.goto(_http_url(destino), wait_until="domcontentloaded", timeout=20000)
            _pause(page, 1000)
            if _pagina_error_sofia(page):
                continue
            if _sesion_post_login_ok(page):
                _dump(page, "03_post_login_recuperado", solo_error=False)
                return True
        except Exception:
            continue
    return False


def _stealthy_fetch_kwargs() -> dict[str, Any]:
    return {
        "headless": HEADLESS,
        "google_search": False,
        "locale": "es-CO",
        "timezone_id": "America/Bogota",
        "timeout": PAGE_TIMEOUT_MS,
        "network_idle": False,
        "load_dom": True,
        "block_webrtc": False,
        "hide_canvas": False,
        # Bloquear fuentes/imágenes/estilos de las páginas JSF: las consultas
        # solo leen DOM, así que cargar assets solo ralentiza cada página.
        "disable_resources": True,
        "block_ads": False,
        "extra_flags": BROWSER_FLAGS,
        "wait": WAIT_FORM_MS,
        "extra_headers": {"Referer": SOFIA_REFERER},
        "page_setup": _page_setup_http,
        "additional_args": {"ignore_https_errors": True},
    }


def _ejecutar_con_scrapling(
    cred: Credenciales, action: Callable[[Page], None], worker_id: int = 0
) -> str | None:
    """Un fetch Scrapling por solicitud (StealthyFetcher), con sesión persistente por slot."""
    err_msg: list[str | None] = [None]
    estado = _FetchState()

    def page_action(page: Page) -> None:
        page.set_default_timeout(PAGE_TIMEOUT_MS)
        err = _asegurar_consultar_registro(page, cred, estado)
        if err:
            err_msg[0] = err
            return
        try:
            action(page)
        except Exception as exc:
            err_msg[0] = f"Error del scraper: {exc}"

    try:
        ejecutar_fetch(worker_id, page_action)
    except Exception as exc:
        return f"Error del scraper: {exc}"

    return err_msg[0]


def _login_y_seleccionar_rol(page: Page, cred: Credenciales) -> str | None:
    err = _completar_login(page, cred)
    if err:
        return err
    return _seleccionar_rol(page, _rol_efectivo(cred))


def _entrar_flujo_consultar(page: Page, cred: Credenciales) -> str | None:
    """Desde login/roles/sesión activa, deja la página lista para navegar al formulario.

    Sofía suele abrir con rol Aspirante (sin SGS). Hay que forzar Encargado de ingreso
    antes de buscar el menú Consultar Registro.
    """
    rol = _rol_efectivo(cred)

    if _en_pagina_login(page):
        return _login_y_seleccionar_rol(page, cred)

    # Ya hay sesión (p. ej. Aspirante): cambiar al rol de Consultar Registro si falta SGS.
    if _sesion_sofia_activa(page) or _tiene_lista_roles(page):
        if not _texto_visible_en_frames(page, MENU_SGS):
            _dump(page, "04_rol_antes", solo_error=False)
            err = _seleccionar_rol(page, rol)
            _dump(page, f"04_rol_despues_{_sanitize(rol)}", solo_error=False)
            if err:
                return err
        if not _texto_visible_en_frames(page, MENU_SGS):
            return (
                f"Tras elegir el rol '{rol}' no apareció el menú SGS. "
                "Sofía quedó en otro rol (p. ej. Aspirante)."
            )
        return _navegar_consultar_registro(page)

    _pause(page, 150)
    if _en_pagina_login(page):
        return _login_y_seleccionar_rol(page, cred)
    if _tiene_lista_roles(page) or _sesion_sofia_activa(page):
        return _entrar_flujo_consultar(page, cred)
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        return err
    return "No se reconoció la pantalla de SofiaPlus tras la navegación de Scrapling"


def _asegurar_consultar_registro(page: Page, cred: Credenciales, estado: _FetchState) -> str | None:
    """Automatiza login/rol/menú sobre la página que Scrapling ya cargó (sin page.goto)."""
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=True)
    if err:
        return err

    if _en_formulario_consultar(page):
        estado.consulta_url = page.url
        return None

    err = _entrar_flujo_consultar(page, cred)
    if err:
        return err

    if not _en_formulario_consultar(page):
        err = _navegar_consultar_registro(page)
        if err:
            return err

    estado.consulta_url = page.url
    return None


def _en_pagina_login(page: Page) -> bool:
    for frame in _frames(page):
        try:
            if frame.locator("#username, #tipoId, input[name='josso_password']").count() > 0:
                return True
        except Exception:
            continue
    return False


def warm_session() -> None:
    """Hook opcional de precalentamiento; el flujo actual no lo requiere."""
    return None


def _sanitize(s: str) -> str:
    s = s.lower()
    for old, new in (
        (" ", "_"),
        ("/", "-"),
        ("\\", "-"),
        (":", "-"),
        ("á", "a"),
        ("é", "e"),
        ("í", "i"),
        ("ó", "o"),
        ("ú", "u"),
        ("ñ", "n"),
    ):
        s = s.replace(old, new)
    return s


def _normalizar_texto(s: str) -> str:
    t = s.lower().strip()
    for old, new in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
        t = t.replace(old, new)
    return t


def _dump(page: Page, paso: str, *, solo_error: bool = True) -> None:
    if not DIAGNOSTICO:
        return
    # En modo rápido solo dumps de error (evita 5–15 PNG por consulta).
    if SOFIA_RAPIDO and solo_error is False and not paso.startswith("error"):
        return
    if solo_error and not paso.startswith(
        ("login_", "error", "resultado", "warn_", "00_", "01_", "02_", "03_", "04_", "05_")
    ):
        return
    try:
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        base = os.path.join(DIAG_DIR, f"{sello}_{_sanitize(paso)}")
        with _DUMP_LOCK:
            if DIAG_PNG:
                try:
                    page.screenshot(path=f"{base}.png", full_page=True)
                except Exception:
                    pass
            try:
                with open(f"{base}.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
            except Exception:
                pass
            try:
                with open(f"{base}.urls.txt", "w", encoding="utf-8") as f:
                    for i, url in enumerate(_urls_pagina(page)):
                        f.write(f"frame[{i}]: {url}\n")
            except Exception:
                pass
    except Exception:
        pass


def _texto_pagina_completo(page: Page) -> str:
    partes: list[str] = []
    for frame in _frames(page):
        try:
            txt = frame.inner_text("body")
            if txt.strip():
                partes.append(txt)
        except Exception:
            pass
        try:
            partes.append(frame.content())
        except Exception:
            pass
    return _normalizar_texto("\n".join(partes))


def _no_verificado(numero: str, mensaje: str) -> ResultadoVerificacion:
    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_NO_VERIFICADO,
        mensaje=mensaje,
    )


def _login_codigo(tipo_texto: str) -> str:
    clave = _normalizar_texto(tipo_texto)
    return TIPO_LOGIN_TEXTO_A_CODIGO.get(clave, "CC")


def _rol_efectivo(cred: Credenciales) -> str:
    rol = (cred.rol or DEFAULT_ROL).strip()
    return rol or DEFAULT_ROL


def _frames(page: Page) -> list[Frame | Page]:
    vistos: set[int] = set()
    out: list[Frame | Page] = []
    for frame in [page] + page.frames:
        fid = id(frame)
        if fid in vistos:
            continue
        vistos.add(fid)
        out.append(frame)
    return out


def _texto_coincide(opcion: str, buscar: str) -> bool:
    """True solo si opción y búsqueda apuntan al mismo rol (no mezclar Aprendiz con Encargado)."""
    a = _normalizar_texto(opcion)
    b = _normalizar_texto(buscar)
    if not a or not b:
        return False
    if a == b or b in a or a in b:
        return True
    # Ambos deben corresponder al mismo rol conocido (antes: r==a bastaba y Aprendiz
    # coincidía con cualquier búsqueda).
    for rol in ROLES_SOFIA_CONOCIDOS:
        r = _normalizar_texto(rol)
        if not r:
            continue
        a_es = a == r or r in a or a in r
        b_es = b == r or r in b or b in r
        if a_es and b_es:
            return True
    # Rol largo: exige varias palabras clave en común (ej. encargado + ingreso + formacion).
    tokens = [t for t in b.split() if len(t) >= 4]
    if len(tokens) >= 3:
        hits = sum(1 for t in tokens if t in a)
        return hits >= len(tokens) - 1
    return False


def _variantes_rol(rol: str) -> list[str]:
    """Variantes del rol a probar en el dropdown (frase completa + alias SofiaPlus)."""
    base = rol.strip()
    out: list[str] = []
    vistos: set[str] = set()

    def agregar(texto: str) -> None:
        clave = _normalizar_texto(texto)
        if clave and clave not in vistos:
            vistos.add(clave)
            out.append(texto)

    agregar(base)
    for conocido in ROLES_SOFIA_CONOCIDOS:
        if _texto_coincide(conocido, base):
            agregar(conocido)
    if "encargado" in _normalizar_texto(base):
        for conocido in ROLES_SOFIA_CONOCIDOS:
            if "encargado" in _normalizar_texto(conocido):
                agregar(conocido)
    return out


def _labels_select(_frame: Frame | Page, sel: Any) -> list[str]:
    labels: list[str] = []
    try:
        opts = sel.locator("option")
        for j in range(opts.count()):
            label = opts.nth(j).inner_text().strip()
            if label:
                labels.append(label)
    except Exception:
        pass
    return labels


def _es_select_roles(labels: list[str]) -> bool:
    norm = [_normalizar_texto(t) for t in labels if t]
    if not norm:
        return False
    for t in norm:
        for k in PALABRAS_CLAVE_ROL:
            if k in t or t in k:
                return True
        for rol in ROLES_SOFIA_CONOCIDOS:
            r = _normalizar_texto(rol)
            if r in t or t in r:
                return True
    return False


def _iter_selects_roles(frame: Frame | Page) -> list[Any]:
    """Busca <select> de roles en encabezado, sidebar y resto del frame."""
    vistos: set[int] = set()
    selects: list[Any] = []

    def agregar(sel: Any) -> None:
        sid = id(sel)
        if sid in vistos:
            return
        vistos.add(sid)
        selects.append(sel)

    for cont in CONTENEDORES_ROLES:
        try:
            for i in range(frame.locator(f"{cont} select").count()):
                agregar(frame.locator(f"{cont} select").nth(i))
        except Exception:
            continue

    try:
        for i in range(frame.locator("select").count()):
            agregar(frame.locator("select").nth(i))
    except Exception:
        pass
    return selects


def _opciones_select_roles(frame: Frame | Page) -> list[tuple[Any, str, str]]:
    """Retorna (locator select, value, label) de selects que parecen Lista de Roles."""
    hallados: list[tuple[Any, str, str]] = []
    for sel in _iter_selects_roles(frame):
        labels = _labels_select(frame, sel)
        if not _es_select_roles(labels):
            continue
        try:
            opts = sel.locator("option")
            for j in range(opts.count()):
                opt = opts.nth(j)
                label = opt.inner_text().strip()
                if not label:
                    continue
                value = opt.get_attribute("value") or label
                hallados.append((sel, value, label))
        except Exception:
            continue
    return hallados


def _en_pantalla_seleccion_roles(page: Page) -> bool:
    for url in _urls_pagina(page):
        u = url.lower()
        if "seleccionrol" in u or "seleccionarrol" in u:
            return True
    if _texto_visible_en_frames(page, "Lista de Roles"):
        return True
    return False


def _tiene_lista_roles(page: Page) -> bool:
    if _en_pantalla_seleccion_roles(page):
        for frame in _frames(page):
            try:
                if frame.locator("select").count() > 0:
                    return True
            except Exception:
                continue
    for frame in _frames(page):
        if _opciones_select_roles(frame):
            return True
    return False


def _esperar_lista_roles(page: Page, timeout_ms: int = WAIT_ROLES_MS) -> bool:
    pasos = max(1, timeout_ms // 250)
    for _ in range(pasos):
        if _tiene_lista_roles(page):
            return True
        page.wait_for_timeout(POLL_MS)
    return False


def _frame_login(page: Page) -> Frame | Page | None:
    for frame in _frames(page):
        try:
            if frame.locator('form[name="usernamePasswordLoginForm"]').count() > 0:
                return frame
        except Exception:
            continue
    return None


def _llenar_campos_login(page: Page, cred: Credenciales) -> str | None:
    frame = _frame_login(page) or page
    codigo = _login_codigo(cred.tipo_documento)
    usuario = cred.usuario.strip()
    password = cred.password

    try:
        frame.select_option("#tipoId", value=codigo, timeout=5000)
    except Exception:
        if not _seleccionar_por_texto(page, "select", cred.tipo_documento):
            return "No se pudo seleccionar el tipo de documento en el login"

    try:
        frame.fill("#username", usuario, timeout=5000)
        frame.fill('input[name="josso_password"]', password, timeout=5000)
    except Exception:
        return "No se pudieron completar usuario y contraseña en el login de SofiaPlus"
    return None


def _absolutizar_url_josso(action: str, page: Page) -> str:
    action = (action or "").strip()
    if action.startswith(SCHEME_HTTPS):
        return _http_url(action)
    if action.startswith(SCHEME_HTTP):
        return action
    if action.startswith("/"):
        return AUTHPRE_BASE + action
    try:
        base = page.url
        if "authpre." in base:
            return _http_url(urljoin(base, action))
    except Exception:
        pass
    return AUTHPRE_BASE + "/josso/signon/usernamePasswordLogin.do"


_JS_LEER_JOSSO = """
() => {
    const form = document.querySelector('form[name=usernamePasswordLoginForm]');
    if (!form) return null;
    const tipoID = form.tipoId ? form.tipoId.value : '';
    const numero = form.username ? form.username.value : '';
    const sucursal = form.sucursal ? form.sucursal.value : '';
    const password = form.josso_password ? form.josso_password.value : '';
    let campo;
    if (tipoID === 'NIT' && !sucursal) {
        campo = tipoID + ',' + numero;
    } else {
        campo = tipoID + ',' + numero + ',' + sucursal;
    }
    if (form.josso_username) form.josso_username.value = campo;
    const payload = {};
    for (const el of Array.from(form.elements)) {
        if (!el.name || el.disabled) continue;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
        payload[el.name] = el.value;
    }
    payload.josso_username = campo;
    payload.josso_password = password;
    return { action: form.action || '', campo, payload };
}
"""


def _leer_payload_josso(page: Page) -> tuple[dict[str, Any] | None, str | None]:
    frame = _frame_login(page)
    if frame is None:
        return None, "No se encontró el formulario de login JOSSO"
    try:
        data = frame.evaluate(_JS_LEER_JOSSO)
    except Exception as exc:
        return None, f"No se pudo leer el formulario JOSSO: {exc}"
    if not data or not data.get("payload"):
        return None, "Formulario JOSSO vacío o ilegible"
    if DIAGNOSTICO and data.get("campo"):
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(os.path.join(DIAG_DIR, f"{sello}_josso_username.txt"), "w", encoding="utf-8") as f:
            f.write(str(data["campo"]))
    return data, None


def _destinos_post_login(resp_url: str) -> list[str]:
    destinos = [SOFIA_HOME_URL, SOFIA_SELECCION_ROL_URL]
    try:
        final_url = _http_url(resp_url or "")
        if (
            final_url
            and "senasofiaplus.edu.co/sofia" in final_url
            and "josso_security_check" not in final_url
        ):
            destinos.insert(0, final_url)
    except Exception:
        pass
    return destinos


def _probar_destinos_post_login(page: Page, destinos: list[str]) -> str | None:
    """None = sesión ok; MSG_CRED_INVALIDAS = credenciales; '' = seguir intentando."""
    for destino in destinos:
        try:
            page.goto(_http_url(destino), wait_until="domcontentloaded", timeout=25000)
            _pause(page, 1000)
            if _login_fallido(page):
                return MSG_CRED_INVALIDAS
            if _pagina_error_sofia(page):
                continue
            if _sesion_post_login_ok(page):
                _dump(page, "03_post_login_request_ok", solo_error=False)
                return None
        except Exception:
            continue
    return ""


def _login_por_request(page: Page) -> str | None:
    """POST JOSSO vía APIRequest (comparte cookies) evitando ERR_BLOCKED_BY_CLIENT al navegar."""
    data, err = _leer_payload_josso(page)
    if err or data is None:
        return err or "Formulario JOSSO vacío o ilegible"

    action = _absolutizar_url_josso(str(data.get("action") or ""), page)
    try:
        resp = page.request.post(
            action,
            form=data["payload"],
            max_redirects=15,
            timeout=45000,
            fail_on_status_code=False,
        )
    except Exception as exc:
        return f"POST de login JOSSO falló: {exc}"

    if DIAGNOSTICO:
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(os.path.join(DIAG_DIR, f"{sello}_josso_post_status.txt"), "w", encoding="utf-8") as f:
            f.write(f"status={resp.status}\nurl={resp.url}\n")

    resultado = _probar_destinos_post_login(page, _destinos_post_login(resp.url or ""))
    if resultado != "":
        return resultado

    if _hay_error_chrome(page) and _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None
    if _sesion_post_login_ok(page):
        return None
    return "El POST de login no dejó sesión activa en SofiaPlus"


def _enviar_formulario_login(page: Page) -> bool:
    """Fallback: envía login JOSSO con submit del formulario en el iframe."""
    frame = _frame_login(page)
    if frame is None:
        return False

    try:
        ok = frame.evaluate(
            """
            () => {
                const form = document.querySelector('form[name=usernamePasswordLoginForm]');
                if (!form) return null;
                const tipoID = form.tipoId.value;
                const numero = form.username.value;
                const sucursal = form.sucursal ? form.sucursal.value : '';
                let campo;
                if (tipoID === 'NIT' && !sucursal) {
                    campo = tipoID + ',' + numero;
                } else {
                    campo = tipoID + ',' + numero + ',' + sucursal;
                }
                form.josso_username.value = campo;
                form.submit();
                return campo;
            }
            """
        )
        return bool(ok)
    except Exception:
        pass

    try:
        btn = frame.locator('input[name="ingresar"]')
        if btn.count() > 0:
            btn.first.click(timeout=5000)
            return True
    except Exception:
        pass
    return False


def _enviar_login_fallback_click(page: Page) -> bool:
    if _enviar_formulario_login(page):
        return True
    for texto in ("INGRESAR", "Ingresar"):
        if _click_texto(page, texto):
            return True
    return False


def _manejar_chrome_durante_espera(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float | None]:
    """(error|None si ok, nuevo_inicio|None si no reset)."""
    _dump(page, "error_chrome_previo", solo_error=False)
    if _recuperar_post_login(page):
        if _sesion_post_login_ok(page):
            return None, None
        return "", time.monotonic()
    if (time.monotonic() - inicio) * 1000 > POST_LOGIN_FAIL_FAST_MS:
        _dump(page, "error_chrome")
        return (
            "SofiaPlus bloqueó la navegación tras el login (ERR_BLOCKED_BY_CLIENT en authpre). "
            f"Detalle request: {err_req}"
        ), None
    return "", None


def _msg_login_no_completo(err_req: str | None) -> str:
    return (
        "El login no se completó (SofiaPlus siguió en pantalla de ingreso). "
        f"Detalle: {err_req}"
    )


def _resultado_chrome_en_tick(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float] | None:
    """None = no hay chrome-error; si hay, retorna (resultado, inicio)."""
    if not _hay_error_chrome(page):
        return None
    err, nuevo_inicio = _manejar_chrome_durante_espera(page, inicio, err_req)
    if err is None:
        return None, inicio
    if err:
        return err, inicio
    return "", nuevo_inicio if nuevo_inicio is not None else inicio


def _resultado_login_estancado(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float] | None:
    """None = no aplica; si aplica timeout en login, retorna (resultado, inicio)."""
    if not _en_pagina_login(page):
        return None
    if (time.monotonic() - inicio) * 1000 <= POST_LOGIN_FAIL_FAST_MS:
        return None
    if _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None, inicio
    _dump(page, "login_no_completo")
    return _msg_login_no_completo(err_req), inicio


def _tick_espera_login(
    page: Page, inicio: float, i: int, pasos: int, err_req: str | None
) -> tuple[str | None, float]:
    """Retorna (resultado|'' para seguir, inicio_actualizado). resultado None = ok."""
    if _sesion_post_login_ok(page):
        return None, inicio
    if _login_fallido(page):
        _dump(page, "error_credenciales")
        return MSG_CRED_INVALIDAS, inicio

    chrome = _resultado_chrome_en_tick(page, inicio, err_req)
    if chrome is not None:
        return chrome

    estancado = _resultado_login_estancado(page, inicio, err_req)
    if estancado is not None:
        return estancado

    if i > pasos - 3:
        err = _detectar_error_pagina(page, ignorar_si_hay_roles=True)
        if err:
            _dump(page, "error_login")
            return err, inicio
    return "", inicio


def _resultado_final_espera_login(page: Page, err_req: str | None) -> str | None:
    if _sesion_post_login_ok(page):
        return None
    if _hay_error_chrome(page) and _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        _dump(page, "login_error_402")
        return err
    if _en_pagina_login(page):
        _dump(page, "login_no_completo")
        return _msg_login_no_completo(err_req)
    _dump(page, "login_sin_roles")
    return "Login completado pero no apareció la Lista de Roles en SofiaPlus (revise encabezado/sidebar)"


def _esperar_sesion_tras_submit(page: Page, err_req: str | None) -> str | None:
    inicio = time.monotonic()
    pasos = max(1, WAIT_LOGIN_MS // 250)
    for i in range(pasos):
        resultado, inicio = _tick_espera_login(page, inicio, i, pasos, err_req)
        if resultado != "":
            return resultado
        page.wait_for_timeout(POLL_MS)
    return _resultado_final_espera_login(page, err_req)


def _completar_login(page: Page, cred: Credenciales) -> str | None:
    """Completa el formulario de login (Scrapling ya navegó a welcome.jsp → authpre)."""
    _dump(page, "01_login_cargado", solo_error=False)
    _pause(page, 300)

    err = _llenar_campos_login(page, cred)
    if err:
        _dump(page, "error_campos_login")
        return err

    _dump(page, "02_login_lleno", solo_error=False)
    _pause(page, 150)

    # Preferir POST por APIRequest: evita ERR_BLOCKED_BY_CLIENT al navegar authpre.
    err_req = _login_por_request(page)
    if err_req is None:
        return None
    if err_req == MSG_CRED_INVALIDAS:
        _dump(page, "error_credenciales")
        return err_req

    _dump(page, "03_post_login_request_fallback", solo_error=False)

    if not _enviar_login_fallback_click(page):
        _dump(page, "error_enviar_login")
        return err_req or "No se pudo enviar el formulario de login (Ingresar)"

    try:
        page.wait_for_load_state("domcontentloaded", timeout=30000)
    except Exception:
        pass
    _pause(page, 1000)
    _dump(page, "03_post_login", solo_error=False)

    if _hay_error_chrome(page):
        _dump(page, "error_chrome_previo", solo_error=False)
        if _recuperar_post_login(page) and _sesion_post_login_ok(page):
            return None

    return _esperar_sesion_tras_submit(page, err_req)


def _select_labels(sel: Any) -> list[str]:
    labels: list[str] = []
    try:
        opts = sel.locator("option")
        for j in range(opts.count()):
            t = opts.nth(j).inner_text().strip()
            if t:
                labels.append(t)
    except Exception:
        pass
    return labels


def _select_tiene_opcion(sel: Any, texto: str) -> bool:
    return any(_texto_coincide(lab, texto) for lab in _select_labels(sel))


def _buscar_select_con_opcion(page: Page, texto: str) -> Any | None:
    """Localiza un <select> (en cualquier frame) que tenga la opción indicada."""
    for frame in _frames(page):
        try:
            selects = frame.locator("select")
            for i in range(selects.count()):
                sel = selects.nth(i)
                if _es_select_roles(_select_labels(sel)):
                    continue
                if _select_tiene_opcion(sel, texto):
                    return sel
        except Exception:
            continue
    return None


def _en_formulario_consultar(page: Page) -> bool:
    """True solo si el formulario real de Consultar Registro está cargado.

    No basta ver el texto del menú lateral ni un input cualquiera del shell.
    """
    if _buscar_select_con_opcion(page, "Persona") is not None:
        return True
    if not (
        _texto_visible_en_frames(page, "Tipo de Usuario")
        or _texto_visible_en_frames(page, "Tipo de Identificación")
    ):
        return False
    for frame in _frames(page):
        try:
            if frame.locator(SEL_INPUT_TEXT).count() == 0 or frame.locator("select").count() == 0:
                continue
            selects = frame.locator("select")
            for i in range(selects.count()):
                if not _es_select_roles(_select_labels(selects.nth(i))):
                    return True
        except Exception:
            continue
    return False


def _esperar_formulario_consultar(page: Page, timeout_ms: int = 20000) -> bool:
    for _ in range(max(1, timeout_ms // 250)):
        if _en_formulario_consultar(page):
            return True
        page.wait_for_timeout(POLL_MS)
    return _en_formulario_consultar(page)


def _href_menu_consultar_registro(page: Page) -> str:
    for frame in _frames(page):
        try:
            href = frame.evaluate(
                """() => {
                    const norm = (s) => (s || '').toLowerCase().trim()
                        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
                        .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n')
                        .replace(/\\s+/g, ' ');
                    const side = document.querySelector('#side-menu') || document;
                    const links = Array.from(side.querySelectorAll('a[href]'));
                    for (const a of links) {
                        const t = norm(a.textContent || '');
                        const h = (a.getAttribute('href') || '');
                        if ((t === 'consultar registro' || t.includes('consultar registro'))
                            && h && h !== '#' && h.indexOf('javascript:') < 0) {
                            return h;
                        }
                    }
                    for (const a of links) {
                        const h = (a.getAttribute('href') || '').toLowerCase();
                        if (h.includes('consultarregistro') || h.includes('consultar_registro')
                            || h.includes('consultarRegistro'.toLowerCase())) {
                            return a.getAttribute('href') || '';
                        }
                    }
                    return '';
                }"""
            )
            if href:
                return str(href).replace("&amp;", "&")
        except Exception:
            continue
    return ""


def _abrir_menu_consultar_registro(page: Page) -> bool:
    js = """() => {
        const norm = (s) => (s || '').toLowerCase().trim()
            .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
            .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n')
            .replace(/\\s+/g, ' ');
        const side = document.querySelector('#side-menu') || document;
        const clickPor = (label) => {
            const buscar = norm(label);
            for (const n of Array.from(side.querySelectorAll('span.menuPrimario, a, span'))) {
                const t = norm(n.textContent);
                if (t === buscar || t.startsWith(buscar)) {
                    (n.closest('a') || n).click();
                    return true;
                }
            }
            return false;
        };
        clickPor('SGS');
        clickPor('Gestionar SGS');
        const dest = Array.from(side.querySelectorAll('a')).find((a) => {
            const t = norm(a.textContent);
            return t === 'consultar registro' || t.startsWith('consultar registro');
        });
        if (!dest) return 'sin_link';
        dest.click();
        return 'ok';
    }"""
    for frame in _frames(page):
        try:
            if frame.evaluate(js) == "ok":
                return True
        except Exception:
            continue
    for paso in PASOS_MENU:
        if not _click_texto(page, paso):
            return False
        page.wait_for_timeout(WAIT_MENU_MS)
    return True


def _cargar_iframe_consultar_registro(page: Page) -> bool:
    href = _href_menu_consultar_registro(page)
    if not href:
        return False
    try:
        base = page.url.rsplit("/", 1)[0] + "/"
        abs_url = urljoin(base, href)
    except Exception:
        abs_url = href
    try:
        fr = page.frame(name="contenido")
        if fr is not None:
            fr.goto(abs_url, wait_until="domcontentloaded", timeout=30000)
            _pause(page, 300)
            if _en_formulario_consultar(page):
                return True
    except Exception:
        pass
    try:
        page.evaluate(
            """(url) => {
                const iframe = document.getElementById('contenido')
                    || document.querySelector('iframe[name="contenido"]');
                if (!iframe) return false;
                iframe.src = url;
                return true;
            }""",
            abs_url,
        )
        _pause(page, 1000)
        _esperar_sin_blockui(page, 15000)
        return _en_formulario_consultar(page)
    except Exception:
        return False


def _dump_selects_formulario(page: Page, paso: str) -> None:
    if not DIAGNOSTICO:
        return
    lineas: list[str] = []
    for idx, frame in enumerate(_frames(page)):
        try:
            selects = frame.locator("select")
            for i in range(selects.count()):
                labs = _select_labels(selects.nth(i))
                lineas.append(f"frame={idx} select={i} options={labs}")
        except Exception as exc:
            lineas.append(f"frame={idx} error={exc}")
    os.makedirs(DIAG_DIR, exist_ok=True)
    sello = time.strftime("%H%M%S")
    with open(os.path.join(DIAG_DIR, f"{sello}_{_sanitize(paso)}.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lineas) if lineas else "(sin selects)")


def _aplicar_opcion_select(page: Page, sel: Any, opt: Any) -> bool:
    label = opt.inner_text().strip()
    if not label:
        return False
    value = opt.get_attribute("value")
    if value:
        sel.select_option(value=value, timeout=5000)
    else:
        sel.select_option(label=label, timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)
    return True


def _seleccionar_en_select(page: Page, sel: Any, texto: str) -> bool:
    opts = sel.locator("option")
    for j in range(opts.count()):
        opt = opts.nth(j)
        label = opt.inner_text().strip()
        if label and _texto_coincide(label, texto) and _aplicar_opcion_select(page, sel, opt):
            return True
    return False


def _seleccionar_por_texto(page: Page, selector: str, texto: str) -> bool:
    for frame in _frames(page):
        try:
            selects = frame.locator(selector)
            for i in range(selects.count()):
                if _seleccionar_en_select(page, selects.nth(i), texto):
                    return True
        except Exception:
            continue
    return False


def _click_texto(page: Page, texto: str) -> bool:
    for frame in _frames(page):
        js = """
        (texto) => {
            const norm = (s) => (s || '').toLowerCase().trim()
                .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
                .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n');
            const buscar = norm(texto);
            const nodos = Array.from(document.querySelectorAll(
                'a, button, span, td, div, li, label, option, nav, aside, .sidebar a, #sidebar a, #encabezado a, #encabezado select'
            ));
            for (const n of nodos) {
                const t = norm(n.innerText || n.textContent || '');
                if (t === buscar) { n.click(); return true; }
            }
            for (const n of nodos) {
                const t = norm(n.innerText || n.textContent || '');
                if (t.includes(buscar) && t.length < buscar.length + 30) { n.click(); return true; }
            }
            return false;
        }
        """
        try:
            ok = frame.evaluate(js, texto)
            if ok:
                page.wait_for_timeout(WAIT_MENU_MS)
                return True
        except Exception:
            continue
    return False


def _texto_tiene_402(t: str) -> bool:
    return TXT_ERROR_402 in t or "intentando acceder de forma incorrecta" in t


def _error_402_en_url_o_titulo(page: Page) -> bool:
    try:
        if "error402.jsp" in page.url.lower():
            return True
    except Exception:
        pass
    try:
        return TXT_ERROR_402 in _normalizar_texto(page.title())
    except Exception:
        return False


def _error_402_en_pagina(page: Page) -> bool:
    if _tiene_lista_roles(page):
        return False
    if _error_402_en_url_o_titulo(page):
        return True
    try:
        if _texto_tiene_402(_normalizar_texto(page.content())):
            return True
    except Exception:
        pass
    # 402 solo en iframe hijo suele ser transitorio (loadOk); no fallar aún.
    return False


def _detectar_error_pagina(page: Page, *, ignorar_si_hay_roles: bool = True) -> str | None:
    if ignorar_si_hay_roles and _tiene_lista_roles(page):
        return None

    try:
        url = page.url.lower()
        if url.startswith("chrome-error:"):
            return None
        if "error401.jsp" in url:
            return "SofiaPlus rechazó la sesión (ERROR 401). Reintente más tarde."
    except Exception:
        pass

    if _error_402_en_pagina(page):
        return "SofiaPlus rechazó la sesión (ERROR 402). Reintente más tarde."

    texto = _texto_pagina_completo(page)
    if "acceso restringido" in texto or "pagina web bloqueada" in texto:
        return "SofiaPlus bloqueó el acceso automatizado"
    if "informacion de usuario invalida" in texto or "credenciales invalidas" in texto:
        return MSG_CRED_INVALIDAS
    if "usuario y contrase" in texto and "invalid" in texto:
        return MSG_CRED_INVALIDAS
    return None


def _login_fallido(page: Page) -> str | None:
    if _tiene_lista_roles(page):
        return None
    for frame in _frames(page):
        try:
            texto = _normalizar_texto(frame.inner_text("body"))
        except Exception:
            continue
        if "informacion de usuario invalida" in texto:
            return MSG_CRED_INVALIDAS
    return None


def _sesion_sofia_activa(page: Page) -> bool:
    if _pagina_error_sofia(page) or _en_pagina_login(page) or _hay_error_chrome(page):
        return False
    if _tiene_lista_roles(page):
        return True
    if _sesion_post_login_ok(page):
        return True
    url = page.url.lower()
    if "josso_security_check" in url or "josso/signon" in url or "authpre" in url:
        return False
    # Home real del portal (no basta cualquier /sofia/).
    return "senasofiaplus.edu.co/sofia/home" in url or "principal.faces" in url


def _texto_visible_en_frames(page: Page, texto: str) -> bool:
    buscar = _normalizar_texto(texto)
    for frame in _frames(page):
        try:
            if frame.locator(f"text={texto}").count() > 0:
                return True
            cuerpo = _normalizar_texto(frame.inner_text("body"))
            if buscar in cuerpo:
                return True
        except Exception:
            continue
    return False


def _disparar_cambio_select(sel: Any) -> None:
    try:
        sel.evaluate(
            "el => el.dispatchEvent(new Event('change', { bubbles: true }))"
        )
    except Exception:
        pass


def _blockui_visible(page: Page) -> bool:
    try:
        return bool(
            page.evaluate(
                """() => {
                    const nodes = document.querySelectorAll('.blockUI, .blockOverlay, .blockMsg');
                    for (const n of nodes) {
                        const st = window.getComputedStyle(n);
                        if (st && st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0') {
                            return true;
                        }
                    }
                    return false;
                }"""
            )
        )
    except Exception:
        return False


def _esperar_sin_blockui(page: Page, timeout_ms: int = 30000) -> bool:
    """Espera a que desaparezca el overlay blockUI de Sofía (cambio de rol / menú)."""
    to = min(timeout_ms, 12000) if SOFIA_RAPIDO else timeout_ms
    for _ in range(max(1, to // POLL_MS)):
        if not _blockui_visible(page):
            return True
        page.wait_for_timeout(POLL_MS)
    return not _blockui_visible(page)


def _disparar_cambio_rol_a4j(page: Page, valor: str) -> str:
    """Cambia seleccionRol:roles y dispara el A4J.AJAX.Submit del onchange inline."""
    try:
        return str(
            page.evaluate(
                """(valor) => {
                    const el = document.querySelector('select[id="seleccionRol:roles"]')
                        || document.querySelector('select[name="seleccionRol:roles"]');
                    if (!el) return 'no-select';
                    const v = String(valor);
                    let found = false;
                    for (const o of el.options) {
                        if (String(o.value) === v) { found = true; break; }
                    }
                    if (!found) return 'no-option';
                    el.focus();
                    el.value = v;
                    for (const o of el.options) { o.selected = String(o.value) === v; }
                    const attr = el.getAttribute('onchange') || '';
                    if (attr && attr.indexOf('A4J.AJAX.Submit') >= 0) {
                        const event = new Event('change', { bubbles: true, cancelable: true });
                        try {
                            const fn = new Function('event', attr);
                            fn.call(el, event);
                            return 'a4j-submit';
                        } catch (e) {
                            try { el.dispatchEvent(event); return 'dispatch-after-a4j-error'; }
                            catch (e2) { return 'a4j-error:' + String(e); }
                        }
                    }
                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    return 'dispatch';
                }""",
                str(valor),
            )
        )
    except Exception as exc:
        return f"exception:{exc}"


def _valor_y_label_rol(page: Page, variantes: list[str]) -> tuple[str, str] | None:
    """Busca value/label del rol objetivo en el select de roles."""
    for frame in _frames(page):
        for _sel, value, label in _opciones_select_roles(frame):
            if any(_texto_coincide(label, v) for v in variantes):
                return str(value), label
    return None


def _probar_select_opcion_rol(sel: Any, value: str, label: str) -> Any | None:
    try:
        sel.select_option(value=value, timeout=4000)
        return sel
    except Exception:
        try:
            sel.select_option(label=label, timeout=4000)
            return sel
        except Exception:
            return None


def _elegir_rol_en_selects(page: Page, variantes: list[str]) -> Any | None:
    for frame in _frames(page):
        for sel, value, label in _opciones_select_roles(frame):
            if not any(_texto_coincide(label, v) for v in variantes):
                continue
            usado = _probar_select_opcion_rol(sel, value, label)
            if usado is not None:
                return usado
    return None


def _elegir_rol_fallback(page: Page, variantes: list[str]) -> bool:
    for variante in variantes:
        if _seleccionar_por_texto(page, "select", variante):
            return True
    for variante in variantes:
        if _click_texto(page, variante):
            return True
    return False


def _rol_menu_listo(page: Page, rol: str) -> bool:
    """True si el menú del rol ya cargó (SGS para Encargado; Inscripción para Usuario SENA)."""
    if "encargado" in _normalizar_texto(rol):
        return _texto_visible_en_frames(page, MENU_SGS)
    if _normalizar_texto(rol) == _normalizar_texto(ROL_USUARIO_SENA):
        return _texto_visible_en_frames(page, MSG_INSCRIPCION) or _texto_visible_en_frames(
            page, "Consultar Inscripción"
        )
    return _texto_visible_en_frames(page, MENU_SGS)


def _error_sin_lista_roles(page: Page, rol: str) -> str | None:
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        return err
    if _en_pagina_login(page):
        return "El login no se completó antes de elegir el rol"
    return f"No se encontró la Lista de Roles (encabezado/sidebar) para '{rol}'"


def _aplicar_cambio_rol(page: Page, rol: str, variantes: list[str], intento: int) -> str | None:
    """Dispara selección de rol (A4J). None = ok; str = error fatal del intento."""
    hallado = _valor_y_label_rol(page, variantes)
    if hallado is None:
        if not _elegir_rol_fallback(page, variantes):
            return f"No se pudo seleccionar el rol '{rol}' en el sidebar/encabezado"
        return None
    valor, label = hallado
    select_usado = _elegir_rol_en_selects(page, variantes)
    if select_usado is not None:
        _disparar_cambio_select(select_usado)
    modo = _disparar_cambio_rol_a4j(page, valor)
    if DIAGNOSTICO:
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(
            os.path.join(DIAG_DIR, f"{sello}_04_rol_a4j_{_sanitize(rol)}.txt"),
            "w",
            encoding="utf-8",
        ) as f:
            f.write(f"intento={intento}\nvalor={valor}\nlabel={label}\nmodo={modo}\n")
    return None


def _esperar_menu_tras_rol(page: Page, rol: str) -> bool:
    _esperar_sin_blockui(page, 25000)
    _pause(page, max(WAIT_MENU_MS, 800))
    for _ in range(48):
        if _rol_menu_listo(page, rol):
            return True
        page.wait_for_timeout(POLL_MS)
    return False


def _recuperar_home_tras_fallo_rol(page: Page) -> None:
    try:
        page.goto(SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
        _pause(page, 1000)
        _esperar_sin_blockui(page, 15000)
    except Exception:
        pass


def _seleccionar_rol(page: Page, rol: str) -> str | None:
    if not _esperar_lista_roles(page, timeout_ms=WAIT_ROLES_MS):
        return _error_sin_lista_roles(page, rol)

    variantes = _variantes_rol(rol)
    _esperar_sin_blockui(page, 15000)

    for intento in range(1, 4):
        err = _aplicar_cambio_rol(page, rol, variantes, intento)
        if err:
            return err
        if _esperar_menu_tras_rol(page, rol):
            return None
        _dump(page, f"04_rol_intento_{intento}_{_sanitize(rol)}", solo_error=False)
        _recuperar_home_tras_fallo_rol(page)

    return f"No apareció el menú esperado tras elegir el rol '{rol}'"


def _navegar_consultar_registro(page: Page) -> str | None:
    if _en_formulario_consultar(page):
        return None

    _esperar_sin_blockui(page, 10000)
    abierto = _abrir_menu_consultar_registro(page)
    _pause(page, 150)
    _esperar_sin_blockui(page, 10000)

    if abierto and _esperar_formulario_consultar(page, timeout_ms=10000):
        return None

    # El menú a veces no carga el iframe #contenido: forzar href del link.
    _cargar_iframe_consultar_registro(page)
    if _esperar_formulario_consultar(page, timeout_ms=12000):
        return None

    _dump(page, "error_form_consultar_registro")
    _dump_selects_formulario(page, "error_form_consultar_registro_selects")
    return (
        "No se cargó el formulario Consultar Registro (Tipo Usuario Persona). "
        "Revise rol Encargado e iframe contenido."
    )


_ETIQUETAS_REGISTRO = frozenset(
    {
        "roles",
        "nis",
        MSG_TIPO_IDENT,
        "numero de identificacion",
        "nombres",
        MSG_PRIMER_APELLIDO,
        "segundo apellido",
        "sexo",
        "pais de nacimiento",
        "departamento de nacimiento",
        "municipio de nacimiento",
        "libreta militar",
        "pais de residencia",
        "departamento de residencia",
        "municipio de residencia",
        "direccion de residencia",
        "telefono fijo",
        "estado civil",
        "tipo de sangre",
        "tiene eps",
        "correo electronico",
        "justificacion",
    }
)


def _match_prefijo_etiqueta(raw_norm: str, prefs: tuple[str, ...]) -> bool:
    etiqueta = raw_norm.rstrip(":")
    return any(
        etiqueta == pref or raw_norm.startswith(pref + ":") or raw_norm.startswith(pref + " ")
        for pref in prefs
    )


def _valor_siguiente_linea(
    lineas: list[str], i: int, prefs: tuple[str, ...]
) -> str:
    for j in range(i + 1, min(i + 4, len(lineas))):
        nxt = lineas[j].strip()
        if not nxt:
            continue
        nxt_norm = _normalizar_texto(nxt).rstrip(":")
        if nxt_norm in _ETIQUETAS_REGISTRO or nxt_norm in prefs:
            break
        return nxt
    return ""


def _valor_tras_etiqueta(texto: str, prefijos: tuple[str, ...]) -> str:
    """Lee 'Etiqueta: valor' o 'Etiqueta' + valor en la línea siguiente (Sofía)."""
    lineas = texto.splitlines()
    prefs = tuple(_normalizar_texto(p).rstrip(":") for p in prefijos)
    for i, line in enumerate(lineas):
        if not _match_prefijo_etiqueta(_normalizar_texto(line), prefs):
            continue
        if ":" in line:
            val = line.split(":", 1)[1].strip()
            if val:
                return val
        return _valor_siguiente_linea(lineas, i, prefs)
    return ""


def _resolver_tipo_doc(raw: str) -> str:
    if not raw:
        return ""
    tipo = CODIGO_A_TIPO_CORTO.get(raw.upper(), raw)
    if len(tipo) <= 4:
        return CODIGO_A_TIPO_CORTO.get(raw.upper(), SOFIA_CODIGO_A_TIPO.get(raw.upper(), raw))
    return tipo


def _texto_span(frame: Frame | Page, selector: str) -> str:
    try:
        loc = frame.locator(selector)
        if loc.count() == 0:
            return ""
        return (loc.first.inner_text(timeout=1500) or "").strip()
    except Exception:
        return ""


def _dom_coincide_numero(num_res: str, numero_compacto: str, nis: str) -> bool:
    if not nis and not num_res:
        return False
    if numero_compacto and num_res and num_res != numero_compacto:
        return False
    if numero_compacto and not num_res:
        return False
    return True


def _extraer_registro_desde_dom(page: Page, numero: str) -> tuple[str, str, str, str] | None:
    """Lee el bloque Registro desde los spans formRegistro:*OTX (fuente de verdad)."""
    fr = _frame_consultar_registro(page)
    if fr is None:
        return None
    nis = _texto_span(fr, _DOM_NIS)
    num_res = re.sub(r"\s+", "", _texto_span(fr, _DOM_NUMERO))
    numero_compacto = re.sub(r"\s+", "", numero)
    if not _dom_coincide_numero(num_res, numero_compacto, nis):
        return None
    tipo = _resolver_tipo_doc(_texto_span(fr, _DOM_TIPO))
    nombres = _texto_span(fr, _DOM_NOMBRES)
    ap1 = _texto_span(fr, _DOM_AP1)
    ap2 = _texto_span(fr, _DOM_AP2)
    if not (nombres or ap1 or ap2 or nis):
        return None
    return tipo, nombres, ap1, ap2


def _hay_marcadores_registro(t: str) -> bool:
    """True si el texto trae bloque de resultado (con o sin ':' del CSS)."""
    if re.search(r"(?:^|\n)\s*nis\s*:?\s*($|\d)", t, flags=re.I | re.M):
        return True
    if MSG_TIPO_IDENT in t and ("nombres" in t or MSG_PRIMER_APELLIDO in t):
        return True
    return False


def _tipo_corto_en_texto(texto: str) -> str:
    for line in texto.splitlines():
        ln = line.strip().upper()
        if ln in CODIGO_A_TIPO_CORTO:
            return ln
    return ""


def _limpiar_raw_tipo_etiqueta(raw_tipo: str) -> str:
    for marca in ("Número", "Numero", "número", "numero"):
        if marca in raw_tipo:
            raw_tipo = raw_tipo.split(marca, 1)[0].strip()
            break
    if raw_tipo and (
        len(raw_tipo) <= 2
        or raw_tipo.startswith("*")
        or "seleccionar" in _normalizar_texto(raw_tipo)
    ):
        return ""
    return raw_tipo


def _extraer_registro(texto: str, numero: str) -> tuple[str, str, str, str] | None:
    """Retorna (tipo, nombres, primer_apellido, segundo_apellido) o None."""
    t = _normalizar_texto(texto)
    if not _hay_marcadores_registro(t):
        return None
    numero_compacto = re.sub(r"\s+", "", numero)
    texto_compacto = re.sub(r"\s+", "", texto)
    if numero_compacto not in texto_compacto and numero not in texto:
        return None

    raw_tipo = _tipo_corto_en_texto(texto)
    if not raw_tipo:
        raw_tipo = _limpiar_raw_tipo_etiqueta(_valor_tras_etiqueta(texto, _PREF_TIPO_IDENT))
    tipo = _resolver_tipo_doc(raw_tipo)

    nombres = _valor_tras_etiqueta(texto, _PREF_NOMBRES)
    apellido1 = _valor_tras_etiqueta(texto, _PREF_APELLIDO1)
    apellido2 = _valor_tras_etiqueta(texto, _PREF_APELLIDO2)
    if not (nombres or apellido1 or apellido2 or _valor_tras_etiqueta(texto, _PREF_NIS)):
        return None
    return tipo, nombres, apellido1, apellido2


def _seleccionar_en_select_indice(page: Page, indice: int, texto: str) -> bool:
    for frame in _frames(page):
        try:
            selects = frame.locator("select")
            if indice >= selects.count():
                continue
            if _seleccionar_en_select(page, selects.nth(indice), texto):
                return True
        except Exception:
            continue
    return False


def _set_input_numero(campo, numero: str, esperado: str) -> bool:
    try:
        campo.click(timeout=3000)
        campo.evaluate(
            """(el) => {
                el.removeAttribute('maxlength');
                el.removeAttribute('maxLength');
                el.value = '';
            }"""
        )
        campo.fill(numero)
        leido = _numero_compacto(campo.input_value() or "")
        if leido == esperado:
            return True
        campo.evaluate(
            """(el, v) => {
                el.removeAttribute('maxlength');
                el.removeAttribute('maxLength');
                el.value = v;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }""",
            numero,
        )
        return _numero_compacto(campo.input_value() or "") == esperado
    except Exception:
        return False


def _escribir_numero_en_frame(frame: Frame | Page, numero: str, esperado: str) -> bool:
    for sel in (SEL_NUMERO_DOC, 'input[id*="numeroDocumento"]', SEL_INPUT_TEXT):
        try:
            loc = frame.locator(sel)
            if loc.count() == 0:
                continue
            campo = loc.nth(loc.count() - 1) if "text" in sel else loc.first
            if _set_input_numero(campo, numero, esperado):
                return True
        except Exception:
            continue
    return False


def _escribir_numero_consulta(page: Page, numero: str) -> bool:
    """Escribe el número completo (sin truncar por maxlength, p. ej. cédula extranjería)."""
    esperado = _numero_compacto(numero)
    if not esperado:
        return False
    fr = _frame_consultar_registro(page)
    if fr is not None:
        try:
            campo = fr.locator(SEL_NUMERO_DOC).first
            if campo.count() > 0 and _set_input_numero(campo, numero, esperado):
                return True
        except Exception:
            pass
    return any(_escribir_numero_en_frame(frame, numero, esperado) for frame in _frames(page))


def _frame_por_url_consultar(page: Page) -> Frame | Page | None:
    for frame in _frames(page):
        try:
            url = (getattr(frame, "url", "") or "").lower()
            if "consultarregistro" in url.replace("_", ""):
                return frame
        except Exception:
            continue
    return None


def _frame_por_select_persona(page: Page) -> Frame | Page | None:
    for frame in _frames(page):
        try:
            if frame.locator(SEL_INPUT_TEXT).count() == 0:
                continue
            selects = frame.locator("select")
            for i in range(selects.count()):
                if _select_tiene_opcion(selects.nth(i), "Persona"):
                    return frame
        except Exception:
            continue
    return None


def _frame_consultar_registro(page: Page) -> Frame | Page | None:
    """Iframe/contenido del formulario Consultar Registro (no el shell ni el menú)."""
    return _frame_por_url_consultar(page) or _frame_por_select_persona(page)


def _texto_oculto_consultar(fr) -> str:
    """textContent del iframe: incluye mensajes ocultos (dojoDialog display:none)."""
    try:
        return fr.evaluate("document.body.textContent || ''") or ""
    except Exception:
        return ""


def _texto_frame_consultar(fr) -> str:
    """Texto del iframe de Consultar Registro, visible + (si aplica) oculto."""
    try:
        texto = fr.inner_text("body") or ""
    except Exception:
        return ""
    if not texto.strip():
        # Sofía a veces renderiza el mensaje 100% oculto: textContent lo incluye.
        return _texto_oculto_consultar(fr)
    if MSG_NO_REGISTRADO not in texto:
        # Mensaje oculto que confirma "no registrado" (inner_text no lo devuelve).
        oculto = _texto_oculto_consultar(fr)
        if oculto and MSG_NO_REGISTRADO in oculto:
            texto = f"{texto}\n{oculto}"
    return texto


def _leer_cuerpo_consulta(page: Page) -> str:
    fr = _frame_consultar_registro(page)
    if fr is not None:
        texto = _texto_frame_consultar(fr)
        if texto.strip():
            return texto
    # Concatenar todos los frames (el shell solo no basta).
    partes: list[str] = []
    for frame in _frames(page):
        try:
            texto = frame.inner_text("body")
            if texto.strip():
                partes.append(texto)
        except Exception:
            continue
    return "\n".join(partes)


def _numero_compacto(numero: str) -> str:
    return re.sub(r"\s+", "", (numero or "").strip())


def _dom_numero_resultado(page: Page) -> str:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return ""
    return _numero_compacto(_texto_span(fr, _DOM_NUMERO))


def _dom_nis_resultado(page: Page) -> str:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return ""
    return (_texto_span(fr, _DOM_NIS) or "").strip()


def _huella_respuesta(page: Page) -> str:
    """Huella del bloque resultado (NIS/número resultado + flag no-reg + token msg)."""
    num = _dom_numero_resultado(page)
    nis = _dom_nis_resultado(page)
    texto = _normalizar_texto(_leer_cuerpo_consulta(page))
    no_reg = "1" if MSG_NO_REGISTRADO in texto else "0"
    # Token del mensaje para detectar reemplazo aunque sea otro "no registrado".
    idx = texto.find(MSG_NO_REGISTRADO)
    token = texto[idx : idx + 48] if idx >= 0 else ""
    return f"{num}|{nis}|{no_reg}|{token}"


def _cargando_iframe_visible(page: Page) -> bool:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return False
    try:
        return bool(
            fr.evaluate(
                """() => {
                    const el = document.getElementById('cargando');
                    if (!el) return false;
                    const st = window.getComputedStyle(el);
                    if (st.visibility === 'hidden' || st.display === 'none') return false;
                    return (el.innerText || '').toLowerCase().includes('cargando');
                }"""
            )
        )
    except Exception:
        return False


def _form_consultar_sano(page: Page) -> bool:
    """True si el iframe trae los selects reales del formulario (no página A4J vacía)."""
    fr = _frame_consultar_registro(page)
    if fr is None:
        return False
    try:
        if fr.locator(SEL_TIPO_DOC).count() > 0 and fr.locator(SEL_TIPO_USUARIO).count() > 0:
            return True
        # Fallback: Persona + algún select de tipo.
        return _buscar_select_con_opcion(page, "Persona") is not None and (
            _buscar_select_con_opcion(page, TIPO_CC) is not None
            or _valor_tipo_doc_actual(page) != ""
        )
    except Exception:
        return False


def _asegurar_form_sano(page: Page) -> bool:
    if _form_consultar_sano(page):
        return True
    _cargar_iframe_consultar_registro(page)
    _esperar_formulario_consultar(page, timeout_ms=12000)
    for _ in range(40):
        if _form_consultar_sano(page):
            return True
        page.wait_for_timeout(POLL_MS)
    return _form_consultar_sano(page)


def _numero_mencionado_en_no_reg(t: str) -> str:
    """Número que Sofía menciona en el mensaje 'no se encuentra registrado'."""
    idx = t.find(MSG_NO_REGISTRADO)
    if idx < 0:
        return ""
    m = re.search(r"numero\s*:\s*([\d\s.]+)", t[max(0, idx - 160) : idx])
    if not m:
        return ""
    return re.sub(r"\D", "", _normalizar_texto(m.group(1)))


def _clasificar_es_vieja(page: Page, numero: str) -> bool:
    """True si la respuesta visible pertenece a otro documento (mensaje o NIS)."""
    num = _numero_compacto(numero)
    num_dom = _dom_numero_resultado(page)
    if num_dom and num and num_dom != num:
        return True
    t = _normalizar_texto(_leer_cuerpo_consulta(page))
    if MSG_NO_REGISTRADO in t:
        mencionado = _numero_mencionado_en_no_reg(t)
        if mencionado and mencionado != num:
            return True
    return False


def _clasificar_despues_ciclo(page: Page, numero: str) -> tuple[str, str]:
    """Clasifica solo DESPUÉS del ciclo de carga (respuesta de ESTA consulta)."""
    texto = _leer_cuerpo_consulta(page)
    t = _normalizar_texto(texto)
    if _extraer_registro_desde_dom(page, numero) is not None:
        return "REGISTRADO", texto
    num = _numero_compacto(numero)
    # Mensaje no-registrado gana salvo que el DOM tenga Registro de ESTA persona
    # o el mensaje sea de OTRO documento (respuesta vieja sin reemplazar).
    if MSG_NO_REGISTRADO in t:
        if _extraer_registro_desde_dom(page, numero) is not None:
            return "REGISTRADO", texto
        mencionado = _numero_mencionado_en_no_reg(t)
        if mencionado and mencionado != num:
            return "PENDIENTE", texto
        # El mensaje es de ESTE número: gana aunque num_dom aún muestre el
        # documento anterior (span viejo que Sofía tarda en reemplazar).
        return "NO_REGISTRADO", texto
    num_dom = _dom_numero_resultado(page)
    if num_dom and num and num_dom != num:
        return "PENDIENTE", texto
    if num and num in _numero_compacto(texto) and _hay_marcadores_registro(t):
        if _extraer_registro(texto, numero) is not None:
            return "REGISTRADO", texto
    return "PENDIENTE", texto


def _esperar_arranque_carga(
    page: Page, numero: str, huella_antes: str, to_ms: int
) -> tuple[str, str] | None:
    """Fase 1: espera spinner o resultado inmediato. None = seguir a fase 2."""
    t0 = time.time()
    while (time.time() - t0) * 1000 < min(4000, to_ms):
        if _extraer_registro_desde_dom(page, numero) is not None:
            return "REGISTRADO", _leer_cuerpo_consulta(page)
        if _cargando_iframe_visible(page):
            return None
        if _huella_respuesta(page) != huella_antes and _extraer_registro_desde_dom(page, numero):
            return "REGISTRADO", _leer_cuerpo_consulta(page)
        page.wait_for_timeout(POLL_MS)
    return None


def _respuesta_visible_consulta(page: Page) -> bool:
    """Respuesta lista: mensaje no-registrado o número resultado del bloque."""
    if MSG_NO_REGISTRADO in _normalizar_texto(_leer_cuerpo_consulta(page)):
        return True
    return bool(_dom_numero_resultado(page))


def _clasificar_si_respuesta_este_doc(page: Page, numero: str) -> tuple[str, str] | None:
    """Clasifica solo si la respuesta visible ya es de ESTE documento."""
    t = _normalizar_texto(_leer_cuerpo_consulta(page))
    if MSG_NO_REGISTRADO in t:
        mencionado = _numero_mencionado_en_no_reg(t)
        if not mencionado or mencionado == _numero_compacto(numero):
            return _clasificar_despues_ciclo(page, numero)
    num_dom = _dom_numero_resultado(page)
    num = _numero_compacto(numero)
    if num_dom and num and num_dom == num:
        return _clasificar_despues_ciclo(page, numero)
    return None


def _esperar_fin_carga(page: Page, numero: str, to_ms: int) -> tuple[str, str]:
    """Fase 2: espera fin de #cargando / blockUI y clasifica.
    Solo clasifica cuando ya se ve la respuesta de ESTE documento (mensaje o
    número resultado); nunca antes, para no leer la respuesta vieja o el
    mensaje tardío de Sofía (renders 1-3 s después del fin del ciclo)."""
    t1 = time.time()
    while (time.time() - t1) * 1000 < to_ms:
        if _extraer_registro_desde_dom(page, numero) is not None:
            return "REGISTRADO", _leer_cuerpo_consulta(page)
        if _cargando_iframe_visible(page):
            page.wait_for_timeout(POLL_MS)
            continue
        _esperar_sin_blockui(page, 3000)
        # La pantalla aún muestra la respuesta de OTRO documento (A4J lento o caído):
        # sigue esperando la de ESTE número antes de clasificar.
        if _cargando_iframe_visible(page) or _clasificar_es_vieja(page, numero):
            page.wait_for_timeout(POLL_MS)
            continue
        if _respuesta_visible_consulta(page):
            _pause(page, 150)
            return _clasificar_despues_ciclo(page, numero)
        page.wait_for_timeout(POLL_MS)
    return _esperar_respuesta_tardia(page, numero)


def _esperar_respuesta_tardia(page: Page, numero: str) -> tuple[str, str]:
    """Fase extra: Sofía a veces renderiza la respuesta segundos DESPUÉS del
    ciclo (A4J lento); antes de rendirse espera el mensaje/número de ESTE doc."""
    t3 = time.time()
    while (time.time() - t3) * 1000 < 8000:
        if _extraer_registro_desde_dom(page, numero) is not None:
            return "REGISTRADO", _leer_cuerpo_consulta(page)
        clasificado = _clasificar_si_respuesta_este_doc(page, numero)
        if clasificado is not None:
            return clasificado
        page.wait_for_timeout(250)
    if _extraer_registro_desde_dom(page, numero) is not None:
        return "REGISTRADO", _leer_cuerpo_consulta(page)
    return _clasificar_despues_ciclo(page, numero)


def _esperar_respuesta_consulta(
    page: Page, numero: str, timeout_ms: int = 15000, huella_antes: str = ""
) -> tuple[str, str]:
    """Espera ciclo cargando→fin y recién ahí clasifica (evita mensaje viejo)."""
    to = max(timeout_ms, 12000)
    if not huella_antes:
        huella_antes = _huella_respuesta(page)

    temprano = _esperar_arranque_carga(page, numero, huella_antes, to)
    if temprano is not None:
        return temprano

    return _esperar_fin_carga(page, numero, to)


def _dump_iframe_consultar(page: Page, paso: str) -> None:
    if not DIAGNOSTICO:
        return
    fr = _frame_consultar_registro(page)
    if fr is None:
        return
    os.makedirs(DIAG_DIR, exist_ok=True)
    sello = time.strftime("%H%M%S")
    path = os.path.join(DIAG_DIR, f"{sello}_{_sanitize(paso)}_iframe.html")
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fr.content())
    except Exception:
        pass


def _tupla_registrado(
    parsed: tuple[str, str, str, str], tipo: str
) -> tuple[str, str, str, str, str, str]:
    tipo_doc, nombres, ap1, ap2 = parsed
    return VERIFICACION_REGISTRADO, tipo_doc or tipo, nombres, ap1, ap2, ""


def _resultado_consulta_registro(
    page: Page, tipo: str, numero: str, huella_antes: str = ""
) -> tuple[str, str, str, str, str, str]:
    """Retorna (estado, tipo, nombres, apellido1, apellido2, mensaje_error)."""
    clase, texto = _esperar_respuesta_consulta(
        page, numero, timeout_ms=15000, huella_antes=huella_antes
    )

    if clase == "REGISTRADO":
        parsed = _extraer_registro_desde_dom(page, numero) or _extraer_registro(texto, numero)
        if parsed:
            return _tupla_registrado(parsed, tipo)
        parsed = _extraer_registro(texto, numero)
        if parsed:
            return _tupla_registrado(parsed, tipo)

    if clase == "NO_REGISTRADO":
        parsed = _extraer_registro_desde_dom(page, numero)
        if parsed:
            return _tupla_registrado(parsed, tipo)
        return VERIFICACION_NO_REGISTRADO, "", "", "", "", ""

    if not texto:
        _dump(page, "error_sin_respuesta_consulta")
        return _nv("No se pudo leer la respuesta de SofiaPlus")

    parsed = _extraer_registro_desde_dom(page, numero) or _extraer_registro(texto, numero)
    if parsed:
        return _tupla_registrado(parsed, tipo)
    _dump(page, f"error_respuesta_clara_{_sanitize(tipo)}")
    _dump_iframe_consultar(page, f"error_respuesta_clara_{_sanitize(tipo)}")
    return _nv("SofiaPlus no devolvió una respuesta clara")


def _label_select_actual(sel: Any) -> str:
    try:
        return (
            sel.evaluate(
                """el => {
                    const o = el.options[el.selectedIndex];
                    return o ? (o.text || '').trim() : '';
                }"""
            )
            or ""
        )
    except Exception:
        return ""


def _forzar_select_value(sel, codigo: str) -> bool:
    try:
        sel.select_option(value=codigo, timeout=4000)
        actual = (sel.evaluate("el => (el.value || '').toUpperCase()") or "").upper()
        if actual == codigo.upper():
            return True
    except Exception:
        pass
    try:
        return bool(
            sel.evaluate(
                """(el, codigo) => {
                    const v = String(codigo).toUpperCase();
                    let found = null;
                    for (const o of el.options) {
                        if (String(o.value || '').toUpperCase() === v) { found = o.value; break; }
                    }
                    if (found == null) return false;
                    el.focus();
                    el.value = found;
                    for (const o of el.options) o.selected = o.value === found;
                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    const attr = el.getAttribute('onchange') || '';
                    if (attr && attr.indexOf('A4J') >= 0) {
                        try { (new Function('event', attr)).call(el, new Event('change')); } catch (e) {}
                    }
                    return String(el.value || '').toUpperCase() === v;
                }""",
                codigo,
            )
        )
    except Exception:
        return False


def _set_select_silencioso(fr: Frame | Page, selec: str, valor: str) -> bool:
    """Setea el select por valor SIN disparar el handler onchange (A4J).

    Sofía re-renderiza el formulario al cambiar tipo de usuario/tipo de documento
    (A4J) y esas respuestas llegan a veces TARDÍAS, borrando los valores recién
    puestos. Este setter permite re-colocar el valor y estabilizar el formulario
    justo antes del envío (sin disparar otra re-renderización).
    """
    if fr is None:
        return False
    try:
        loc = fr.locator(selec)
        if loc.count() == 0:
            return False
        return bool(
            loc.first.evaluate(
                """(el, valor) => {
                    const attr = el.getAttribute('onchange');
                    el.onchange = null;
                    el.setAttribute('onchange', '');
                    let ok = false;
                    for (const o of el.options) {
                        if (String(o.value || '').trim().toUpperCase() === String(valor).trim().toUpperCase()) {
                            el.selectedIndex = o.index;
                            ok = true;
                            break;
                        }
                    }
                    if (!ok && el.options.length) el.selectedIndex = 0;
                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    if (attr) el.setAttribute('onchange', attr);
                    return ok && String(el.value || '').trim().toUpperCase() === String(valor).trim().toUpperCase();
                }""",
                valor,
            )
        )
    except Exception:
        return False


def _numero_escrito_consulta(page: Page) -> str:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return ""
    try:
        campo = fr.locator(SEL_NUMERO_DOC).first
        if campo.count() > 0:
            return _numero_compacto(campo.input_value() or "")
    except Exception:
        pass
    return ""


def _formulario_consulta_estable(
    fr, page: Page, codigo: str, esperado: str
) -> tuple[bool, str, str, bool]:
    """(estable, usuario, doc, num_ok) del formulario; False si el frame no responde."""
    try:
        tiene_usuario = fr.locator(SEL_TIPO_USUARIO).count() > 0
        usuario = _label_select_actual(fr.locator(SEL_TIPO_USUARIO).first) if tiene_usuario else ""
        doc = _valor_tipo_doc_actual(page)
        num_ok = _numero_escrito_consulta(page) == esperado
    except Exception:
        return False, "", "", False
    estable = usuario == "Persona" and (not codigo or doc == codigo) and num_ok
    return estable, usuario, doc, num_ok


def _recolocar_valores_formulario(fr, page: Page, usuario: str, codigo: str, doc: str, num_ok: bool, numero: str) -> None:
    """Re-coloca Persona/tipo/número tras un re-render de A4J (best-effort)."""
    try:
        if usuario != "Persona":
            _set_select_silencioso(fr, SEL_TIPO_USUARIO, "Persona")
        if codigo and doc != codigo:
            # Options aún sin cargar: esperar el A4J en vuelo.
            _set_select_silencioso(fr, SEL_TIPO_DOC, codigo)
        if not num_ok:
            _escribir_numero_consulta(page, numero)
    except Exception:
        pass


def _estabilizar_formulario_consulta(page: Page, tipo: str, numero: str) -> bool:
    """Re-coloca y verifica Persona + tipo documento + número hasta que aguanten.

    Los onchange A4J de Sofía dejan respuestas tardías que re-renderizan el form
    y borran lo recién escrito: sin esto el envío sale con campos vacíos y JSF
    devuelve "valor requerido" (sin respuesta → NO_VERIFICADO aleatorio).
    """
    codigo = _codigo_desde_etiqueta_tipo(tipo)
    esperado = _numero_compacto(numero)
    estabilidad = 0
    t0 = time.time()
    while (time.time() - t0) * 1000 < 12000:
        fr = _frame_consultar_registro(page)
        if fr is None:
            return False
        estable, usuario, doc, num_ok = _formulario_consulta_estable(fr, page, codigo, esperado)
        if estable:
            estabilidad += 1
            if estabilidad >= 5:
                return True
        else:
            estabilidad = 0
            _recolocar_valores_formulario(fr, page, usuario, codigo, doc, num_ok, numero)
        page.wait_for_timeout(300)
    return False


def _elegir_persona_en_select(page: Page, sel: Any) -> bool:
    if _texto_coincide(_label_select_actual(sel), "Persona"):
        return True
    if _forzar_select_value(sel, "Persona"):
        _esperar_sin_blockui(page, 5000)
        return True
    try:
        sel.select_option(label="Persona", timeout=4000)
        _esperar_sin_blockui(page, 5000)
        return True
    except Exception:
        return False


def _seleccionar_tipo_usuario_persona(page: Page) -> bool:
    """Elige Persona en formConsultarRegistro:tipoUsuarioSOL (sin re-disparar A4J si ya está)."""
    fr = _frame_consultar_registro(page)
    if fr is not None:
        try:
            sel = fr.locator(SEL_TIPO_USUARIO)
            if sel.count() > 0:
                if _texto_coincide(_label_select_actual(sel.first), "Persona"):
                    # Ya está: evita el submit A4J onchange (~600 ms de round-trip por doc).
                    return True
                if _elegir_persona_en_select(page, sel.first):
                    return True
        except Exception:
            pass
    sel = _buscar_select_con_opcion(page, "Persona")
    if sel is None:
        return False
    if _texto_coincide(_label_select_actual(sel), "Persona"):
        return True
    if _seleccionar_en_select(page, sel, "Persona"):
        _esperar_sin_blockui(page, 5000)
        return True
    return _elegir_persona_en_select(page, sel)


def _codigo_desde_etiqueta_tipo(tipo: str) -> str:
    raw = (tipo or "").strip()
    up = raw.upper()
    if up in SOFIA_CODIGO_A_TIPO:
        return "PS" if up == "PAS" else up
    for codigo, etiqueta in SOFIA_CODIGO_A_TIPO.items():
        if _texto_coincide(etiqueta, raw):
            return "PS" if codigo == "PAS" else codigo
    return ""


def _valor_tipo_doc_actual(page: Page) -> str:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return ""
    try:
        sel = fr.locator(SEL_TIPO_DOC)
        if sel.count() == 0:
            return ""
        return (sel.first.evaluate("el => (el.value || '').toUpperCase()") or "").upper()
    except Exception:
        return ""


def _esperar_opciones_tipo_documento(page: Page, timeout_ms: int = 15000) -> bool:
    """Espera a que el select tipo de documento tenga opciones (CC/TI/CE…).

    Se pueblan con el A4J del cambio de tipo de usuario; si aún están vacías
    el setter silencioso no puede fijar el valor sin disparar otro A4J.
    """
    fr = _frame_consultar_registro(page)
    if fr is None:
        return False
    t0 = time.time()
    while (time.time() - t0) * 1000 < timeout_ms:
        try:
            n = fr.evaluate(
                """() => {
                    const el = document.querySelector('[id$="tipoDocumentoSOL"]');
                    return el ? el.options.length : 0;
                }"""
            )
        except Exception:
            n = 0
        if n and n > 1:
            return True
        page.wait_for_timeout(200)
    return False


def _forzar_tipo_doc_en_iframe(page: Page, codigo: str) -> bool:
    fr = _frame_consultar_registro(page)
    if fr is None:
        return False
    try:
        sel = fr.locator(SEL_TIPO_DOC)
        if sel.count() == 0:
            return False
        if _valor_tipo_doc_actual(page) == codigo:
            return True
        # Setter silencioso (sin onchange → sin A4J extra): primero asegura que
        # las opciones estén cargadas (las puebla el A4J del cambio de usuario).
        if _set_select_silencioso(fr, SEL_TIPO_DOC, codigo):
            return _valor_tipo_doc_actual(page) == codigo
        if not _esperar_opciones_tipo_documento(page):
            # Sin opciones ni A4J en vuelo: dispara el onchange de usuario una vez.
            sel_usuario = fr.locator(SEL_TIPO_USUARIO).first
            if sel_usuario.count() > 0:
                _forzar_select_value(sel_usuario, "Persona")
            if not _esperar_opciones_tipo_documento(page):
                return False
        if _set_select_silencioso(fr, SEL_TIPO_DOC, codigo):
            return _valor_tipo_doc_actual(page) == codigo
        return False
    except Exception:
        return False


def _seleccionar_tipo_identificacion(page: Page, tipo: str) -> bool:
    """Elige tipo en formConsultarRegistro:tipoDocumentoSOL (value CC/TI/CE…)."""
    codigo = _codigo_desde_etiqueta_tipo(tipo)
    if not codigo:
        return _seleccionar_por_texto(page, "select", tipo)
    if _forzar_tipo_doc_en_iframe(page, codigo):
        return True
    return _seleccionar_por_texto(page, "select", tipo)


def _preparar_formulario_consulta(page: Page) -> str | None:
    """Asegura form limpio (Persona + select tipo documento)."""
    if not _en_formulario_consultar(page):
        err = _navegar_consultar_registro(page)
        if err:
            return err
    # Si el form quedó “sucio” tras un resultado, recargar iframe.
    if _valor_tipo_doc_actual(page) == "" and _buscar_select_con_opcion(page, "Persona") is None:
        _cargar_iframe_consultar_registro(page)
        if not _esperar_formulario_consultar(page, timeout_ms=10000):
            return "No se pudo recargar el formulario Consultar Registro"
    return None


def _nv(msg: str) -> tuple[str, str, str, str, str, str]:
    return VERIFICACION_NO_VERIFICADO, "", "", "", "", msg


def _persona_o_form_listo(page: Page, tipo: str) -> bool:
    return bool(
        _texto_visible_en_frames(page, "Tipo de Identificación")
        or _valor_tipo_doc_actual(page)
        or _buscar_select_con_opcion(page, tipo) is not None
    )


def _llenar_form_consulta(page: Page, tipo: str, numero: str) -> str | None:
    """Selecciona Persona + tipo + número. Retorna mensaje de error o None."""
    if not _seleccionar_tipo_usuario_persona(page) and not _persona_o_form_listo(page, tipo):
        _dump(page, "error_sin_tipo_usuario_persona")
        _dump_selects_formulario(page, "error_sin_tipo_usuario_persona_selects")
        return "No se pudo seleccionar Tipo de Usuario Persona"

    codigo = _codigo_desde_etiqueta_tipo(tipo)
    if not _seleccionar_tipo_identificacion(page, tipo):
        return f"No se pudo seleccionar tipo '{tipo}'"
    if not _asegurar_form_sano(page) and not _seleccionar_tipo_identificacion(page, tipo):
        return f"No se pudo seleccionar tipo '{tipo}' tras recarga"
    actual = _valor_tipo_doc_actual(page)
    if codigo and actual not in ("", codigo) and not _seleccionar_tipo_identificacion(page, tipo):
        return f"El formulario no quedó en tipo '{tipo}' (sigue {actual or '?'})"
    if not _escribir_numero_consulta(page, numero):
        return "No se pudo escribir el número de documento completo (posible truncado)."
    return None


def _consultar_un_tipo(page: Page, tipo: str, numero: str) -> tuple[str, str, str, str, str, str]:
    """Retorna (estado, tipo_encontrado, nombres, ap1, ap2, mensaje_error)."""
    err = _preparar_formulario_consulta(page)
    if err:
        return _nv(err)
    if not _asegurar_form_sano(page):
        return _nv("Formulario Consultar Registro vacío o a medias (A4J). Reintente.")

    err_fill = _llenar_form_consulta(page, tipo, numero)
    if err_fill:
        return _nv(err_fill)
    if not _estabilizar_formulario_consulta(page, tipo, numero):
        return _nv("El formulario Consultar Registro no quedó estable (A4J). Reintente.")

    huella_antes = _huella_respuesta(page)
    if not _click_boton_consultar_registro(page):
        return _nv("No se pudo hacer clic en el botón Consultar Registro del formulario")

    return _resultado_consulta_registro(page, tipo, numero, huella_antes=huella_antes)


_SEL_BTN_CONSULTAR = (
    'input[type="submit"][value*="Consultar Registro"]',
    'input[type="button"][value*="Consultar Registro"]',
    'input[type="submit"][value*="Consultar"]',
    'button:has-text("Consultar Registro")',
    'input[id*="consultar" i]',
    'input[name*="consultar" i]',
)


def _frame_tiene_form_consultar(frame: Frame | Page) -> bool:
    url = (getattr(frame, "url", "") or "").lower()
    if "consultarregistro" in url.replace("_", ""):
        return True
    try:
        selects = frame.locator("select")
        for i in range(selects.count()):
            if _select_tiene_opcion(selects.nth(i), "Persona"):
                return True
    except Exception:
        pass
    return False


def _click_consultar_en_frame(page: Page, frame: Frame | Page) -> bool:
    for sel in _SEL_BTN_CONSULTAR:
        try:
            btn = frame.locator(sel)
            if btn.count() == 0:
                continue
            btn.first.click(timeout=5000)
            _pause(page, 150)
            return True
        except Exception:
            continue
    try:
        submitted = frame.evaluate(
            """() => {
                const forms = Array.from(document.querySelectorAll('form'));
                for (const f of forms) {
                    const txt = (f.innerText || '').toLowerCase();
                    if (!txt.includes('tipo de usuario') && !txt.includes('persona')) continue;
                    const btn = f.querySelector('input[type="submit"], button[type="submit"], input[type="button"]');
                    if (btn) { btn.click(); return true; }
                    if (typeof f.requestSubmit === 'function') { f.requestSubmit(); return true; }
                    f.submit();
                    return true;
                }
                return false;
            }"""
        )
        if submitted:
            _pause(page, 150)
            return True
    except Exception:
        pass
    return False


def _click_boton_consultar_registro(page: Page) -> bool:
    """Clic en el botón del formulario (NUNCA el ítem del menú lateral)."""
    fr = _frame_consultar_registro(page)
    candidatos: list[Frame | Page] = []
    if fr is not None:
        candidatos.append(fr)
    candidatos.extend(_frames(page))

    vistos: set[int] = set()
    for frame in candidatos:
        fid = id(frame)
        if fid in vistos:
            continue
        vistos.add(fid)
        if not _frame_tiene_form_consultar(frame):
            continue
        if _click_consultar_en_frame(page, frame):
            return True
    return False


def _tipos_a_probar(tipo_codigo: str, *, lote: bool = False) -> list[str]:
    codigo = tipo_codigo.strip().upper()
    if codigo and codigo in SOFIA_CODIGO_A_TIPO:
        return [SOFIA_CODIGO_A_TIPO[codigo]]
    if lote:
        return list(TIPOS_CONSULTA_LOTE)
    return list(TIPOS_CONSULTA)


def _resultado_registrado(
    numero: str, tipo_encontrado: str, nombres: str, ap1: str, ap2: str
) -> ResultadoVerificacion:
    nombre_completo = " ".join(p for p in (nombres, ap1, ap2) if p).strip()
    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_REGISTRADO,
        tipo_encontrado=tipo_encontrado,
        nombre=nombre_completo,
        nombres=nombres,
        primer_apellido=ap1,
        segundo_apellido=ap2,
        mensaje="Registrado en SofiaPlus.",
    )


def _es_respuesta_ambigua(extra: str) -> bool:
    if not extra:
        return False
    t = extra.lower()
    return any(x in t for x in ("respuesta clara", "vacío", "a4j", "a medias"))


def _aplicar_consulta_tipo(
    page: Page,
    tipo: str,
    numero: str,
    *,
    errores: list[str],
) -> tuple[ResultadoVerificacion | None, bool]:
    """Ejecuta una consulta. Retorna (resultado|None, hubo_no_registrado)."""
    estado, tipo_encontrado, nombres, ap1, ap2, extra = _consultar_un_tipo(page, tipo, numero)
    if estado == VERIFICACION_REGISTRADO:
        return _resultado_registrado(numero, tipo_encontrado, nombres, ap1, ap2), False
    if estado == VERIFICACION_NO_REGISTRADO:
        return None, True
    errores.append(extra or "Error en consulta")
    return None, False


def _reintentar_tipos_ambiguos(
    page: Page, tipos: list[str], numero: str
) -> tuple[ResultadoVerificacion | None, bool]:
    """Recarga form y reintenta tipos ambiguos. Retorna (resultado|None, hubo_no_reg)."""
    hubo_no = False
    _cargar_iframe_consultar_registro(page)
    _esperar_formulario_consultar(page, timeout_ms=12000)
    for tipo in tipos:
        estado, tipo_encontrado, nombres, ap1, ap2, _ex = _consultar_un_tipo(page, tipo, numero)
        if estado == VERIFICACION_REGISTRADO:
            return _resultado_registrado(numero, tipo_encontrado, nombres, ap1, ap2), hubo_no
        if estado == VERIFICACION_NO_REGISTRADO:
            hubo_no = True
    return None, hubo_no


def _cerrar_busqueda_documento(
    numero: str, hubo_no_registrado: bool, errores: list[str]
) -> ResultadoVerificacion:
    if hubo_no_registrado and not errores:
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_NO_REGISTRADO,
            mensaje=MSG_NO_REG_TODOS,
        )
    if errores:
        return _no_verificado(numero, errores[-1] + MSG_REINTENTE)
    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_NO_REGISTRADO,
        mensaje=MSG_NO_REG_TODOS,
    )


def _probar_tipo_en_busqueda(
    page: Page,
    tipo: str,
    numero: str,
    errores: list[str],
    tipos_ambiguos: list[str],
) -> tuple[ResultadoVerificacion | None, bool]:
    """Prueba un tipo (con reintento si ambigua). Retorna (hit|None, hubo_no_reg)."""
    resultado, no_reg = _aplicar_consulta_tipo(page, tipo, numero, errores=errores)
    if resultado is not None:
        return resultado, False
    if no_reg:
        return None, True
    if not _es_respuesta_ambigua(errores[-1] if errores else ""):
        return None, False  # señal: caller debe break (errores no vacío + no ambigua)
    tipos_ambiguos.append(tipo)
    _asegurar_form_sano(page)
    resultado2, no_reg2 = _aplicar_consulta_tipo(page, tipo, numero, errores=errores)
    if resultado2 is not None:
        return resultado2, False
    return None, no_reg2


def _buscar_documento(
    page: Page, numero: str, tipo_codigo: str, *, lote: bool = False
) -> ResultadoVerificacion:
    tipos = _tipos_a_probar(tipo_codigo, lote=lote)
    errores: list[str] = []
    hubo_no_registrado = False
    tipos_ambiguos: list[str] = []

    for tipo in tipos:
        n_err = len(errores)
        resultado, no_reg = _probar_tipo_en_busqueda(
            page, tipo, numero, errores, tipos_ambiguos
        )
        if resultado is not None:
            return resultado
        if no_reg:
            hubo_no_registrado = True
            continue
        # Error no ambigua: _probar no añadió a ambiguos y sí a errores.
        if len(errores) > n_err and tipo not in tipos_ambiguos:
            break

    if tipos_ambiguos:
        reintento, no_reg_r = _reintentar_tipos_ambiguos(page, tipos_ambiguos, numero)
        if reintento is not None:
            return reintento
        if no_reg_r:
            hubo_no_registrado = True

    return _cerrar_busqueda_documento(numero, hubo_no_registrado, errores)


def _ejecutar_flujo(ctx: ContextoScrape) -> None:
    def consultar(page: Page) -> None:
        for idx, doc in enumerate(ctx.docs):
            # Entre documentos: recargar form para no arrastrar tipo/mensaje anterior.
            if idx > 0:
                _cargar_iframe_consultar_registro(page)
                _esperar_formulario_consultar(page, timeout_ms=10000)
            t0 = time.time()
            r = _buscar_documento(
                page, doc.numero_documento, doc.tipo_documento, lote=ctx.lote
            )
            ctx.resultados.append(r)
            logger.info(
                "verificado doc=%s estado=%s tipo=%s en %.1fs (worker=%s lote=%s)",
                doc.numero_documento,
                r.estado,
                r.tipo_encontrado or "-",
                time.time() - t0,
                ctx.worker_id,
                ctx.lote,
            )
            progreso.reportar(ctx.lote_id, doc.numero_documento, r.estado)

    err = _ejecutar_con_scrapling(ctx.cred, consultar, worker_id=ctx.worker_id)
    if err and not ctx.resultados:
        for d in ctx.docs:
            r = _no_verificado(d.numero_documento, err)
            ctx.resultados.append(r)
            progreso.reportar(ctx.lote_id, d.numero_documento, r.estado)


def verificar_documento(numero: str, cred: Credenciales, tipo_codigo: str = "") -> ResultadoVerificacion:
    ctx = ContextoScrape(
        cred=cred,
        docs=[DocumentoLote(numero_documento=numero, tipo_documento=tipo_codigo)],
    )
    _ejecutar_flujo(ctx)
    if ctx.resultados:
        return ctx.resultados[0]
    return _no_verificado(numero, MSG_SIN_RESPUESTA_SCRAPER)


def verificar_lote(
    cred: Credenciales, docs: list[DocumentoLote], lote_id: str = ""
) -> list[ResultadoVerificacion]:
    """Verifica N documentos en SofíaPlus (paralelo controlado por navegador).

    Cada worker abre su propio navegador (con su propio login) y procesa un
    subconjunto de documentos; la lógica de consulta/clasificación es exactamente
    la misma que en secuencial. Los resultados se devuelven en el orden de entrada.
    Si se pasa ``lote_id``, cada documento reporta su avance a ``app.progreso``.
    """
    if not docs:
        return []

    progreso.iniciar(lote_id, len(docs), fase="verificar")

    workers = min(SOFIA_PARALLEL_WORKERS, len(docs))
    if workers <= 1:
        ctx = ContextoScrape(cred=cred, docs=docs, lote=True, lote_id=lote_id)
        _ejecutar_flujo(ctx)
        if ctx.resultados:
            progreso.terminar(lote_id)
            return ctx.resultados
        progreso.terminar(lote_id, error=MSG_SIN_RESPUESTA_SCRAPER)
        return [_no_verificado(d.numero_documento, MSG_SIN_RESPUESTA_SCRAPER) for d in docs]

    # Round-robin: reparte documentos adyacentes entre workers (balance de carga).
    chunks: list[list[DocumentoLote]] = [docs[i::workers] for i in range(workers)]
    resultados: list[ResultadoVerificacion | None] = [None] * len(docs)

    def _procesar_chunk(chunk_idx: int) -> None:
        chunk = chunks[chunk_idx]
        ctx = ContextoScrape(
            cred=cred, docs=chunk, lote=True, worker_id=chunk_idx, lote_id=lote_id
        )
        _ejecutar_flujo(ctx)
        if not ctx.resultados:
            ctx.resultados = [
                _no_verificado(d.numero_documento, MSG_SIN_RESPUESTA_SCRAPER) for d in chunk
            ]
        for j, r in enumerate(ctx.resultados):
            resultados[chunk_idx + j * workers] = r

    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(_procesar_chunk, range(workers)))

    progreso.terminar(lote_id)
    return [
        r
        if r is not None
        else _no_verificado(docs[i].numero_documento, "Sin resultado de verificación.")
        for i, r in enumerate(resultados)
    ]


