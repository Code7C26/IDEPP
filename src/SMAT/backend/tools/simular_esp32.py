"""Simula el ESP32 del robot para probar la web sin hardware.

Hace lo mismo que haría el robot real, usando la API de docs/API.md:
  - pregunta cada 1,5 s si hay una orden  (GET /robot/comando-pendiente)
  - la ejecuta y la confirma               (POST /robot/reporte con comando_ejecutado)
  - recorre la ruta zona por zona, esperando en cada una, y gasta batería

Uso (con el backend andando):
    cd backend
    python tools/simular_esp32.py                 # lee ROBOT_API_KEY del archivo .env
    python tools/simular_esp32.py --velocidad 10  # 10 veces más rápido, ideal para una demo
Para cortarlo: Ctrl+C.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CADA = 1.5  # segundos entre consultas, como el robot real


def avisar(texto):
    print(f"[{datetime.now():%H:%M:%S}] {texto}", flush=True)


class Api:
    """Llamadas al backend con la clave del robot en el header X-API-KEY."""

    def __init__(self, url, clave):
        self.url, self.clave = url.rstrip("/"), clave

    def llamar(self, metodo, ruta, datos=None):
        pedido = urllib.request.Request(
            self.url + ruta, method=metodo, data=json.dumps(datos).encode() if datos is not None else None,
            headers={"X-API-KEY": self.clave, "Content-Type": "application/json"})
        with urllib.request.urlopen(pedido, timeout=5) as respuesta:
            return json.loads(respuesta.read() or b"{}")


class RobotSimulado:
    def __init__(self, api, velocidad, bateria):
        self.api, self.velocidad, self.bateria = api, velocidad, float(bateria)
        self.estado, self.ruta, self.paso, self.espera_restante = "detenido", [], 0, 0.0

    def zona_actual(self):
        return self.ruta[self.paso]["zona_id"] if self.ruta and self.estado != "detenido" else None

    def cargar_ruta(self):
        self.ruta = self.api.llamar("GET", "/robot/ruta")["ruta"]
        if not self.ruta:
            raise RuntimeError("La ruta está vacía: configurala en la web (Robot → Ruta)")

    def ejecutar(self, comando):
        """Hace lo que pide la orden. Devuelve True si la entendió."""
        if comando == "iniciar":
            if self.estado != "pausado":                # si estaba pausado, sigue donde estaba
                self.cargar_ruta()
                self.paso, self.espera_restante = 0, self.ruta[0]["tiempo_espera_seg"]
            self.estado = "recorriendo"
        elif comando == "pausar":
            self.estado = "pausado"
        elif comando == "detener":
            self.estado = "detenido"
        elif comando == "emergencia":
            self.estado = "emergencia"
        else:
            return False
        avisar(f"ORDEN «{comando}» -> estado: {self.estado}")
        return True

    def avanzar(self, segundos):
        """Pasa el tiempo: espera en la zona, cambia a la siguiente y gasta batería."""
        simulado = segundos * self.velocidad
        if self.estado == "recorriendo":
            self.bateria = max(0.0, self.bateria - simulado / 60)        # 1 % por minuto de recorrido
            self.espera_restante -= simulado
            if self.espera_restante <= 0:
                self.paso = (self.paso + 1) % len(self.ruta)
                self.espera_restante = self.ruta[self.paso]["tiempo_espera_seg"]
                avisar(f"Llegué a la zona {self.ruta[self.paso]['zona_id']} (espero {self.espera_restante:.0f} s)")
            if self.bateria <= 0:
                self.estado = "detenido"
                avisar("Sin batería: me detengo")

    def ciclo(self):
        """Una vuelta: preguntar la orden, ejecutarla y reportar el estado."""
        orden = self.api.llamar("GET", "/robot/comando-pendiente")["comando"]
        ejecutado = orden if orden and self.ejecutar(orden) else None
        if orden and not ejecutado:
            avisar(f"No entiendo la orden «{orden}»: la ignoro")
        self.api.llamar("POST", "/robot/reporte", {
            "estado": self.estado, "bateria": round(self.bateria), "zona_actual_id": self.zona_actual(),
            **({"comando_ejecutado": ejecutado} if ejecutado else {})})


def main():
    ap = argparse.ArgumentParser(description="Simula el ESP32 del robot")
    ap.add_argument("--url", default=os.getenv("DROID_URL", "http://127.0.0.1:5000/api"), help="dirección del backend")
    ap.add_argument("--key", default=os.getenv("ROBOT_API_KEY", ""), help="ROBOT_API_KEY (por defecto, la del .env)")
    ap.add_argument("--velocidad", type=float, default=1.0, help="1 = tiempo real; 10 = diez veces más rápido")
    ap.add_argument("--bateria", type=int, default=100, help="batería inicial (0 a 100)")
    ap.add_argument("--duracion", type=float, default=0, help="corta solo a los N segundos (0 = hasta Ctrl+C)")
    args = ap.parse_args()
    if not args.key:
        sys.exit("Falta la clave: poné ROBOT_API_KEY en backend/.env o pasá --key")

    api = Api(args.url, args.key)
    robot = RobotSimulado(api, args.velocidad, args.bateria)
    avisar(f"Robot simulado conectado a {args.url} (velocidad x{args.velocidad:g}). Ctrl+C para cortar.")
    inicio = time.time()
    try:
        while not args.duracion or time.time() - inicio < args.duracion:
            try:
                robot.ciclo()
            except urllib.error.HTTPError as e:
                avisar(f"El backend respondió {e.code}: revisá la clave o el contenido de la orden")
            except (urllib.error.URLError, TimeoutError):
                avisar("Sin conexión con el backend: reintento…")      # el robot real hace lo mismo
            except RuntimeError as e:
                avisar(str(e)); robot.estado = "detenido"
            time.sleep(CADA)
            robot.avanzar(CADA)
    except KeyboardInterrupt:
        pass
    try:
        api.llamar("POST", "/robot/reporte", {"estado": "detenido", "zona_actual_id": None})
    except Exception:
        pass
    avisar("Simulador detenido.")


if __name__ == "__main__":
    main()
