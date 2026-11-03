"""Los renders y el juego (frontend/public/robot3d) tienen que andar sin internet, el día de la demo."""
import os
import re

import pytest

CARPETA = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "robot3d")


@pytest.mark.parametrize("archivo", ["robot.html", "fabrica.html", "patrulla.html"])
def test_usan_solo_archivos_locales(archivo):
    texto = open(os.path.join(CARPETA, archivo), encoding="utf-8").read()
    # Ningún enlace a internet, ni pedidos desde el código. Los juegos y renders no tienen por qué salir de la web
    assert not re.findall(r"https?://", texto)
    assert not re.findall(r"\bfetch\(|XMLHttpRequest|WebSocket", texto)
    # Cada archivo que piden tiene que existir, y embebido.js tiene que cargar antes que su código
    pedidos = re.findall(r"""(?:src|href)=["']/robot3d/([^"']+)["']""", texto)
    assert pedidos[:1] == ["fuentes.css"] and pedidos[1] == "embebido.js"
    for pedido in pedidos:
        assert os.path.isfile(os.path.join(CARPETA, pedido)), pedido


def test_las_tipografias_existen():
    css = open(os.path.join(CARPETA, "fuentes.css"), encoding="utf-8").read()
    fuentes = re.findall(r'url\("([^"]+)"\)', css)
    assert len(fuentes) == 4
    for fuente in fuentes:
        assert os.path.isfile(os.path.join(CARPETA, fuente)), fuente
