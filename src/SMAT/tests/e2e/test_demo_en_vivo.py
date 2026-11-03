"""Demo sin hardware: tools/demo_en_vivo.py lanza el robot y la IA simulados, y la web los muestra andando."""
import os
import subprocess
import sys

from conftest import API, APP, ROBOT, YOLO, api, esperar_texto, recrear_base, sesion

DURACION = 30   # segundos que anda la demo: termina sola y apaga a sus simuladores


def test_la_demo_hace_andar_la_web_sin_hardware(base_limpia, abrir):
    token = sesion("maria")["token"]
    alertas_antes = api("/incidents?limit=1", token=token)["total"]
    # Las claves van en el ambiente: load_dotenv no pisa lo que ya está definido
    demo = subprocess.Popen([sys.executable, "-u", os.path.join(APP, "backend", "tools", "demo_en_vivo.py"),
                             "--url", API, "--cada", "2", "--velocidad", "20", "--duracion", str(DURACION)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                            env={**os.environ, "PYTHONIOENCODING": "utf-8",
                                 "YOLO_API_KEY": YOLO["X-API-KEY"], "ROBOT_API_KEY": ROBOT["X-API-KEY"]})
    try:
        pag = abrir("maria", "/app/robot")
        assert esperar_texto(pag, "Conectado", 8, exacto=False)
        pag.get_by_role("button", name="Iniciar").click()
        assert esperar_texto(pag, "Recorriendo")

        # El robot cambia de zona solo
        zonas = set()
        for _ in range(40):
            zonas.add(api("/robot/estado", token=token)["zona_actual_id"])
            if len(zonas - {None}) >= 2:
                break
            pag.wait_for_timeout(500)
        assert len(zonas - {None}) >= 2

        # Entran alertas y se detienen máquinas
        assert api("/incidents?limit=1", token=token)["total"] > alertas_antes
        assert any(not z["maquina_activa"] for z in api("/zones", token=token)["zonas"])
        assert not pag.errores
    finally:
        # No se usa terminate(): mataría a la demo y sus simuladores seguirían mandando alertas a las otras pruebas
        demo.wait(timeout=DURACION + 30)
        recrear_base(os.getenv("E2E_DB", "robot_db_e2e"))   # las pruebas siguientes no heredan sus alertas
