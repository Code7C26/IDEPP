"""EJEMPLO de referencia: cómo el servidor de IA (YOLO) habla con el backend de DROID-E3D.

Requiere:  pip install requests
Variables de entorno (no pongas la clave en el código):
    DROID_URL       ej. http://192.168.0.10:5000/api
    YOLO_API_KEY    la que está en backend/.env
Contrato completo: docs/API.md
"""
import os

import requests

URL = os.getenv("DROID_URL", "http://localhost:5000/api")
CABECERAS = {"X-API-KEY": os.getenv("YOLO_API_KEY", "")}

# Cada tipo de falta, según el EPP que falta (casco, chaleco y lentes: decisión 011)
TIPOS = {"casco": "sin_casco", "chaleco": "sin_chaleco", "lentes": "sin_lentes"}


def zonas():
    """Devuelve las zonas con su EPP obligatorio. Pedilo una vez al arrancar."""
    r = requests.get(f"{URL}/zones", headers=CABECERAS, timeout=5)
    r.raise_for_status()
    return r.json()["zonas"]


def reportar_falta(epp_faltante, zona_id, empleado_id=None, confianza=0.0, foto_jpg=None):
    """Registra una incidencia. empleado_id puede ser None si no se reconoció la cara.
    foto_jpg: bytes del cuadro de la cámara (con las cajas de YOLO), ej. cv2.imencode(".jpg", frame)[1].tobytes()
    Devuelve la incidencia creada o None si falló (no tires abajo la detección por esto)."""
    datos = {"tipo": TIPOS[epp_faltante], "zona_id": zona_id,
             "empleado_id": empleado_id, "confianza": round(confianza, 2)}
    try:
        if foto_jpg:
            # Con foto: multipart. Los campos van como texto y empleado_id vacío = no reconocido
            datos["empleado_id"] = "" if empleado_id is None else empleado_id
            r = requests.post(f"{URL}/incidents", data=datos, headers=CABECERAS, timeout=10,
                              files={"imagen": ("deteccion.jpg", foto_jpg, "image/jpeg")})
        else:
            r = requests.post(f"{URL}/incidents", json=datos, headers=CABECERAS, timeout=5)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print("No se pudo reportar la incidencia:", e)
        return None


def rostros():
    """Empleados con fotos para el reconocimiento facial. Pedilo seguido (ej. cada 5 min):
    si alguien retira su consentimiento, deja de aparecer y no hay que reconocerlo más."""
    r = requests.get(f"{URL}/rostros", headers=CABECERAS, timeout=10)
    r.raise_for_status()
    return r.json()["rostros"]


def descargar_foto(ruta):
    """Bytes de una foto, con la ruta que viene en rostros() (ej. "/uploads/rostros/1_ab.jpg")."""
    r = requests.get(f"{URL}{ruta}", headers=CABECERAS, timeout=10)
    r.raise_for_status()
    return r.content


if __name__ == "__main__":
    # Prueba rápida: lista las zonas y reporta una falta de casco en la primera
    todas = zonas()
    print("Zonas:", [(z["id"], z["nombre"], z["epp_requerido"]) for z in todas])
    print("Incidencia creada:", reportar_falta("casco", todas[0]["id"], empleado_id=1, confianza=0.93))
