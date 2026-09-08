"""Pruebas unitarias de la clasificación de respuestas de SofíaPlus.

Cubre la lógica pura y la clasificación con página simulada (sin navegador):

- _clasificar_despues_ciclo: el mensaje "no se encuentra registrado" de ESTE
  documento gana aunque el span del número siga mostrando el anterior (bug
  histórico que dejaba NO_VERIFICADO aleatorios).
- _esperar_fin_carga: la respuesta solo se clasifica cuando ya es de ESTE
  documento (mensaje o número resultado), nunca por haber visto #cargando
  (fix del 2026-08: el ciclo vista implicaba clasificar antes de que Sofía
  renderizara el mensaje, 1–3 s después).
- Helpers puros de extracción/normalización.

Ejecutar dentro del contenedor del scraper (tiene patchright + scrapling):
    python -m unittest discover -s tests -v
"""
from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import scraper  # noqa: E402


class _FakePage:
    """Página mínima: solo esperar (los helpers de lectura se parchean)."""

    def __init__(self) -> None:
        self._pausado = 0.0
        self.slept_ms = 0.0

    def wait_for_timeout(self, ms: int) -> None:
        self.slept_ms += ms


class ConAyudaPatcheada(unittest.TestCase):
    """Restaura los atributos del módulo parcheados en cada prueba."""

    _PARCHEADOS: tuple[str, ...] = ()

    def setUp(self) -> None:
        self._originales = {k: getattr(scraper, k) for k in self._PARCHEADOS}

    def tearDown(self) -> None:
        for k, v in self._originales.items():
            setattr(scraper, k, v)

    def parchear(self, nombre: str, fn) -> None:
        setattr(scraper, nombre, fn)


class PurezaTextoTest(unittest.TestCase):
    def test_numero_compacto_quitaEspaciosYpuntos(self) -> None:
        for crudo, esperado in (
            (" 1118028779 ", "1118028779"),
            ("1.234.567", "1.234.567"),  # solo quita espacios en blanco, no puntos
            ("1 118 028 779", "1118028779"),
            ("", ""),
            (None, ""),
        ):
            with self.subTest(crudo=crudo):
                self.assertEqual(scraper._numero_compacto(crudo), esperado)

    def test_normalizar_texto_quitaAcentosYnormaliza(self) -> None:
        self.assertEqual(scraper._normalizar_texto("Cédula De Ciudadanía"), "cedula de ciudadania")

    def test_sanitize_paraNombresDeArchivo(self) -> None:
        self.assertEqual(scraper._sanitize("Estado: Cédula Niño/a"), "estado-_cedula_nino-a")

    def test_texto_tiene_402(self) -> None:
        self.assertTrue(scraper._texto_tiene_402("error 402"))
        self.assertTrue(scraper._texto_tiene_402("intentando acceder de forma incorrecta"))
        self.assertFalse(scraper._texto_tiene_402("Error 402 Payment Required"))
        self.assertFalse(scraper._texto_tiene_402("todo normal"))

    def test_es_dominio_sofia(self) -> None:
        self.assertTrue(scraper._es_dominio_sofia("https://senasofiaplus.edu.co/x"))
        self.assertFalse(scraper._es_dominio_sofia("https://evil.com/senasofiaplus"))


class NumeroMencionadoEnNoRegTest(unittest.TestCase):
    def test_extraeValorConEspacios(self) -> None:
        msg = scraper.MSG_NO_REGISTRADO
        texto = f"numero: 1.118.028.779 {msg}"
        self.assertEqual(scraper._numero_mencionado_en_no_reg(texto), "1118028779")

    def test_sinMensajeDevuelveVacio(self) -> None:
        self.assertEqual(scraper._numero_mencionado_en_no_reg("respuesta normal"), "")

    def test_mensajeSinNumeroDevuelveVacio(self) -> None:
        self.assertEqual(scraper._numero_mencionado_en_no_reg(f"zzz {scraper.MSG_NO_REGISTRADO} zzz"), "")


class TextoCoincideTest(unittest.TestCase):
    def test_mismoRolCoincide(self) -> None:
        self.assertTrue(scraper._texto_coincide("Encargado de ingreso centro formación", "ENCARGADO DE INGRESO CENTRO FORMACION"))

    def test_rolDiferenteNoCoincide(self) -> None:
        self.assertFalse(scraper._texto_coincide("Aprendiz", "Encargado de ingreso centro formación"))
        self.assertFalse(scraper._texto_coincide("", "Encargado de ingreso centro formación"))


class ClasificarDespuesCicloTest(ConAyudaPatcheada):
    """Núcleo de la clasificación: mensaje del doc actual gana sobre span viejo."""

    _PARCHEADAS = ("_leer_cuerpo_consulta", "_extraer_registro_desde_dom", "_dom_numero_resultado")

    NUMERO = "1118028779"

    BLOQUE_REGISTRO = (
        "NIS : 9876543\n"
        "Tipo de identificacion : CEDULA DE CIUDADANIA\n"
        "Nombres : JUAN ANDRES\n"
        "Primer apellido : GOMEZ\n"
        "Segundo apellido : RODRIGUEZ\n"
    )

    def setUp(self) -> None:
        super().setUp()
        self._texto = ""
        self._dom_reg = None
        self._num_dom = ""
        self.parchear("_leer_cuerpo_consulta", lambda page: self._texto)
        self.parchear("_extraer_registro_desde_dom", lambda page, numero: self._dom_reg)
        self.parchear("_dom_numero_resultado", lambda page: self._num_dom)

    def test_mensajeNoRegDeEsteDocGanaAunqueSpanViejo(self) -> None:
        """Regresión histórica: mensaje de ESTE número + span con el anterior."""
        self._texto = f"numero : {self.NUMERO} {scraper.MSG_NO_REGISTRADO} Reintente más tarde."
        self._num_dom = "999999"  # span aún muestra el documento anterior
        clase, texto = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "NO_REGISTRADO")
        self.assertTrue(scraper.MSG_NO_REGISTRADO in texto)

    def test_mensajeDeOtroDocumentoEsPendiente(self) -> None:
        self._texto = f"numero : 987654321 {scraper.MSG_NO_REGISTRADO}"
        self._num_dom = ""
        clase, _ = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "PENDIENTE")

    def test_registroEnDomEsRegistrado(self) -> None:
        self._texto = "respuesta cualquiera"
        self._dom_reg = ("CC", "JUAN ANDRES", "GOMEZ", "RODRIGUEZ")
        clase, _ = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "REGISTRADO")

    def test_spanConOtroNumeroSinMensajeEsPendiente(self) -> None:
        self._texto = "sin mensaje aún"
        self._num_dom = "999999"
        clase, _ = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "PENDIENTE")

    def test_bloqueRegistroPorTextoEsRegistrado(self) -> None:
        self._texto = f"{self.NUMERO}\n{self.BLOQUE_REGISTRO}"
        self._num_dom = ""
        clase, _ = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "REGISTRADO")

    def test_sinRespuestaClaraEsPendiente(self) -> None:
        self._texto = "formulario normal sin resultado todavía"
        clase, _ = scraper._clasificar_despues_ciclo(_FakePage(), self.NUMERO)
        self.assertEqual(clase, "PENDIENTE")


class EsperarFinCargaTest(ConAyudaPatcheada):
    """Fase 2: la clasificación espera la respuesta de ESTE documento.

    Regresión del fix 2026-08: clasificar por haber visto #cargando (vio_cargando)
    producía NO_VERIFICADO porque Sofía renderiza el mensaje 1–3 s DESPUÉS del fin
    del ciclo. El escenario se simula por tiempo virtual (page.slept_ms): aparece
    el ciclo de carga Y la respuesta vieja; la de ESTE doc recién llega después.
    Si el código clasificara por el ciclo, saldría PENDIENTE/NO_REGISTRADO a medias.
    """

    _PARCHEADAS = (
        "_leer_cuerpo_consulta",
        "_cargando_iframe_visible",
        "_extraer_registro_desde_dom",
        "_dom_numero_resultado",
        "_esperar_sin_blockui",
    )

    NUMERO = "96355056"
    OTRO = "999999"

    # Timeline virtual (ms): carga del ciclo los primeros 250 ms; el mensaje de
    # ESTE documento solo se renderiza DESPUÉS de ~600 ms.
    T_CICLO = 250
    T_RESPUESTA = 600

    def setUp(self) -> None:
        super().setUp()
        self._dom_reg = None
        self.parchear("_extraer_registro_desde_dom", lambda page, numero: self._dom_reg)
        self.parchear("_esperar_sin_blockui", lambda page, timeout_ms: True)

    def _pagina_con_timeline(self) -> _FakePage:
        page = _FakePage()

        def cargando(page) -> bool:
            return page.slept_ms < self.T_CICLO

        def cuerpo(page) -> str:
            if page.slept_ms < self.T_RESPUESTA:
                return f"numero : {self.OTRO} {scraper.MSG_NO_REGISTRADO}"
            return f"numero : {self.NUMERO} {scraper.MSG_NO_REGISTRADO}"

        def num_dom(page) -> str:
            if page.slept_ms < self.T_RESPUESTA:
                return ""
            return self.NUMERO

        self.parchear("_cargando_iframe_visible", cargando)
        self.parchear("_leer_cuerpo_consulta", cuerpo)
        self.parchear("_dom_numero_resultado", num_dom)
        return page

    def test_noClasificaPorCicloSinoPorRespuestaDeEsteDoc(self) -> None:
        page = self._pagina_con_timeline()
        clase, texto = scraper._esperar_fin_carga(page, self.NUMERO, to_ms=4000)
        self.assertEqual(clase, "NO_REGISTRADO", f"clasificó sin la respuesta de este doc: {texto}")
        self.assertIn(self.NUMERO, texto)
        self.assertGreaterEqual(page.slept_ms, self.T_RESPUESTA, "clasificó antes de que llegara la respuesta propia")

    def test_respuestaViejaNoClasificaYAlFinalEsPendiente(self) -> None:
        """Solo respuestas viejas de OTRO documento: jamás clasifica NO_REGISTRADO."""
        page = _FakePage()
        self.parchear("_leer_cuerpo_consulta", lambda p: f"numero : {self.OTRO} {scraper.MSG_NO_REGISTRADO}")
        self.parchear("_cargando_iframe_visible", lambda p: False)
        self.parchear("_dom_numero_resultado", lambda p: "")
        clase, _ = scraper._esperar_fin_carga(page, self.NUMERO, to_ms=600)
        self.assertEqual(clase, "PENDIENTE")

    def test_registroInmediatoEsRegistrado(self) -> None:
        self._dom_reg = ("CC", "NOMBRE", "AP1", "AP2")
        page = _FakePage()
        clase, _ = scraper._esperar_fin_carga(page, self.NUMERO, to_ms=4000)
        self.assertEqual(clase, "REGISTRADO")


if __name__ == "__main__":
    unittest.main(verbosity=2)
