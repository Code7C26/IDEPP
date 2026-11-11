"""Lectura segura de lo que manda el cliente. Cualquiera puede mandar cualquier cosa
(un número donde va un texto, una lista en vez de un objeto...): estas funciones lo revisan
para que el servidor responda con un error claro en vez de caerse."""
from datetime import datetime

from flask import request


def leer_json():
    """El cuerpo JSON del pedido como diccionario. Si no es un objeto JSON, devuelve {}."""
    datos = request.get_json(silent=True)
    return datos if isinstance(datos, dict) else {}


def es_entero(valor):
    """True si es un número entero de verdad (True/False no cuentan como números)."""
    return isinstance(valor, int) and not isinstance(valor, bool)


def id_valido(valor):
    """Un id tiene que ser un entero positivo y razonable (si no, ni se busca en la base)."""
    return es_entero(valor) and 0 < valor < 2**31


def texto(datos, campo, nombre, maximo, obligatorio=False):
    """Lee un campo de texto. Devuelve (valor sin espacios de más o None, mensaje de error o None)."""
    valor = datos.get(campo)
    if valor is None or valor == "":
        return None, (f"{nombre} es obligatorio" if obligatorio else None)
    if not isinstance(valor, str):
        return None, f"{nombre} debe ser un texto"
    valor = valor.strip()
    if not valor:
        return None, (f"{nombre} es obligatorio" if obligatorio else None)
    if len(valor) > maximo:
        return None, f"{nombre} puede tener como máximo {maximo} caracteres"
    return valor, None


def leer_fecha(texto):
    """Convierte 'AAAA-MM-DD' en fecha (datetime a las 00:00). Devuelve None si no viene o es inválida."""
    try:
        return datetime.strptime(texto, "%Y-%m-%d") if isinstance(texto, str) and texto else None
    except ValueError:
        return None
