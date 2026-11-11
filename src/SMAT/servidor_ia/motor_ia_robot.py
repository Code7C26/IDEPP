import os
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"   # oculta los avisos "overread"

import time
import urllib.request
from datetime import datetime

import cv2
import requests
import mysql.connector
from ultralytics import YOLO

from conexion_droid import reportar_a_la_web   # manda cada alerta (con foto) a la web DROID-E3D
# Las IPs de la cámara y del robot se ponen en servidor_ia/.env (ver config.py)
from config import URL_CAMARA_CELULAR, URL_ESP32_ALERTA

# ==========================================
# 1. CAMBIAR ESTO CON TUS DATOS
# ==========================================

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",  # En XAMPP viene vacia
    "database": "robotica_industrial",
}

# ==========================================
# 2. CONFIGURACION DE LA DETECCION
# ==========================================
FRAMES_SEGUIDOS_PARA_ALERTA = 10   # fotogramas seguidos detectando antes de alertar
TIEMPO_COOLDOWN = 10               # segundos de espera entre alertas
CONFIANZA_MINIMA = 0.60            # 60 % para detectar personas
SIMILITUD_ROSTRO = 0.40            # que tan parecido tiene que ser el rostro (0 a 1)

# Modelo que reconoce cascos. Si este archivo no esta en la carpeta,
# el programa usa el modelo general y toma a toda persona como "sin casco".
MODELO_CASCOS = "modelo_cascos.pt"

CARPETA_FOTOS = "fotos_trabajadores"
CARPETA_MODELOS = "modelos"
MODELO_DETECTOR = "face_detection_yunet_2023mar.onnx"
MODELO_RECONOCEDOR = "face_recognition_sface_2021dec.onnx"
URL_MODELOS = {
    MODELO_DETECTOR: "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/"
                     "models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    MODELO_RECONOCEDOR: "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/"
                        "models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
}


# ==========================================
# 3. MODELO DE CASCOS
# ==========================================
def clasificar_clases(nombres):
    """Separa las clases del modelo en 'con casco' y 'sin casco' segun su nombre."""
    con_casco, sin_casco = set(), set()
    for id_clase, nombre in nombres.items():
        t = nombre.lower().replace("-", "").replace("_", "").replace(" ", "")
        if t == "head":                       # algunos modelos llaman "head" a la cabeza sin casco
            sin_casco.add(id_clase)
            continue
        if not any(k in t for k in ("hardhat", "helmet", "casco")):
            continue
        if t.startswith("no") or t.startswith("sin") or "without" in t:
            sin_casco.add(id_clase)
        else:
            con_casco.add(id_clase)
    return con_casco, sin_casco


# ==========================================
# 3b. RECONOCIMIENTO FACIAL
# ==========================================
def descargar_modelos():
    """La primera vez descarga los dos modelos de rostros (unos 40 MB)."""
    os.makedirs(CARPETA_MODELOS, exist_ok=True)
    for archivo, url in URL_MODELOS.items():
        ruta = os.path.join(CARPETA_MODELOS, archivo)
        if not os.path.exists(ruta):
            print(f"[INFO] Descargando {archivo}...")
            urllib.request.urlretrieve(url, ruta)


def cargar_trabajadores(detector, reconocedor):
    """Lee las fotos de fotos_trabajadores/<Nombre>/ y guarda la 'huella' de cada rostro."""
    conocidos = []   # lista de (nombre, huella)
    if not os.path.isdir(CARPETA_FOTOS):
        print("[AVISO] No existe la carpeta fotos_trabajadores. Nadie va a ser reconocido.")
        return conocidos

    for nombre in sorted(os.listdir(CARPETA_FOTOS)):
        carpeta = os.path.join(CARPETA_FOTOS, nombre)
        if not os.path.isdir(carpeta):
            continue
        usadas = 0
        for archivo in os.listdir(carpeta):
            imagen = cv2.imread(os.path.join(carpeta, archivo))
            if imagen is None:
                continue
            alto, ancho = imagen.shape[:2]
            detector.setInputSize((ancho, alto))
            _, rostros = detector.detect(imagen)
            if rostros is None:
                print(f"[AVISO] No se ve ningun rostro en {nombre}/{archivo}")
                continue
            huella = reconocedor.feature(reconocedor.alignCrop(imagen, rostros[0]))
            conocidos.append((nombre, huella))
            usadas += 1
        print(f"[INFO] Trabajador cargado: {nombre} ({usadas} fotos)")
    return conocidos


def reconocer_rostros(frame, detector, reconocedor, conocidos):
    """Devuelve una lista de (nombre, x, y, ancho, alto) con los rostros del fotograma."""
    alto, ancho = frame.shape[:2]
    detector.setInputSize((ancho, alto))
    _, rostros = detector.detect(frame)
    resultado = []
    if rostros is None:
        return resultado

    for rostro in rostros:
        huella = reconocedor.feature(reconocedor.alignCrop(frame, rostro))
        mejor_nombre, mejor_parecido = "Desconocido", 0.0
        for nombre, huella_conocida in conocidos:
            parecido = reconocedor.match(huella, huella_conocida,
                                         cv2.FaceRecognizerSF_FR_COSINE)
            if parecido > mejor_parecido:
                mejor_nombre, mejor_parecido = nombre, parecido
        if mejor_parecido < SIMILITUD_ROSTRO:
            mejor_nombre = "Desconocido"
        x, y, w, h = map(int, rostro[:4])
        resultado.append((mejor_nombre, x, y, w, h))
    return resultado


# ==========================================
# 4. BASE DE DATOS Y ROBOT
# ==========================================
def registrar_incidencia_bd(infraccion, trabajador, confianza):
    """Guarda la incidencia en MySQL."""
    conexion = None
    try:
        conexion = mysql.connector.connect(**DB_CONFIG)
        cursor = conexion.cursor()
        consulta = """INSERT INTO registro_incidencias
                      (fecha_hora, tipo_infraccion, trabajador, nivel_confianza)
                      VALUES (%s, %s, %s, %s)"""
        cursor.execute(consulta, (datetime.now(), infraccion, trabajador, float(confianza)))
        conexion.commit()
        cursor.close()
        print(f"[BD] Incidencia guardada: {infraccion} - {trabajador} ({confianza:.0f}%)")
    except mysql.connector.Error as err:
        print(f"[ERROR BD] No se pudo guardar: {err}")
    finally:
        if conexion is not None and conexion.is_connected():
            conexion.close()


def enviar_alerta_esp32(trabajador):
    """Le avisa al robot que se detenga y le manda el nombre del trabajador."""
    try:
        print("[RED] Enviando alerta al robot...")
        respuesta = requests.post(URL_ESP32_ALERTA, data={"nombre": trabajador}, timeout=2)
        if respuesta.status_code == 200:
            print("[RED] El robot recibio la alerta.")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR RED] No hay conexion con el robot: {e}")


# ==========================================
# 5. PROGRAMA PRINCIPAL
# ==========================================
def iniciar_patrullaje():
    if os.path.exists(MODELO_CASCOS):
        print(f"[INFO] Cargando modelo de cascos: {MODELO_CASCOS}")
        modelo = YOLO(MODELO_CASCOS)
        con_casco, sin_casco = clasificar_clases(modelo.names)
        print(f"[INFO] Clases del modelo: {modelo.names}")
        print(f"[INFO] Con casco: {[modelo.names[i] for i in con_casco]}  |  "
              f"Sin casco: {[modelo.names[i] for i in sin_casco]}")
        modo_cascos = len(sin_casco) > 0
        if not modo_cascos:
            print("[AVISO] El modelo no tiene una clase 'sin casco'. Se usa el modo personas.")
            modelo = YOLO("yolov8n.pt")
    else:
        print("[INFO] No hay modelo_cascos.pt: se usa el modelo general (toda persona = sin casco).")
        modelo = YOLO("yolov8n.pt")
        modo_cascos = False
        con_casco, sin_casco = set(), set()

    print("[INFO] Cargando reconocimiento facial...")
    descargar_modelos()
    detector = cv2.FaceDetectorYN.create(
        os.path.join(CARPETA_MODELOS, MODELO_DETECTOR), "", (640, 480), 0.8)
    reconocedor = cv2.FaceRecognizerSF.create(
        os.path.join(CARPETA_MODELOS, MODELO_RECONOCEDOR), "")
    conocidos = cargar_trabajadores(detector, reconocedor)

    ultimo_aviso = 0
    frames_seguidos = 0
    ultimo_nombre = "Desconocido"   # ultimo trabajador reconocido durante la deteccion

    print(f"[INFO] Conectando a la camara: {URL_CAMARA_CELULAR}")
    cap = cv2.VideoCapture(URL_CAMARA_CELULAR)
    if not cap.isOpened():
        print("[ERROR] No se pudo abrir la camara del celular. Revisa la IP.")
        return

    print("[INFO] Patrullaje iniciado. Toca la ventana del video y apreta 'q' para salir.")

    while True:
        ok, frame = cap.read()
        if not ok:
            print("[ERROR] Se perdio el video. Reintentando...")
            time.sleep(1)
            cap.release()
            cap = cv2.VideoCapture(URL_CAMARA_CELULAR)
            continue

        frame = cv2.resize(frame, (640, 480))
        resultados = modelo(frame, verbose=False)

        infraccion_detectada = False
        mejor_confianza = 0.0

        for r in resultados:
            for caja in r.boxes:
                id_clase = int(caja.cls[0])
                confianza = float(caja.conf[0])
                if confianza < CONFIANZA_MINIMA:
                    continue
                x1, y1, x2, y2 = map(int, caja.xyxy[0])

                if modo_cascos:
                    if id_clase in sin_casco:
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, f"SIN CASCO {confianza*100:.0f}%", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        infraccion_detectada = True
                        mejor_confianza = max(mejor_confianza, confianza * 100)
                    elif id_clase in con_casco:
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 0), 2)
                        cv2.putText(frame, f"Con casco {confianza*100:.0f}%", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 0), 2)
                elif id_clase == 0:
                    # Modo sin modelo de cascos: toda persona cuenta como "sin casco"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"Sin EPP {confianza*100:.0f}%", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    infraccion_detectada = True
                    mejor_confianza = max(mejor_confianza, confianza * 100)

        # Si hay una infraccion, buscamos de quien es la cara
        if infraccion_detectada:
            for nombre, x, y, w, h in reconocer_rostros(frame, detector, reconocedor, conocidos):
                color = (0, 255, 0) if nombre != "Desconocido" else (0, 165, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, nombre, (x, y + h + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                if nombre != "Desconocido":
                    ultimo_nombre = nombre

        # Cuenta cuantos fotogramas seguidos hay una infraccion
        if infraccion_detectada:
            frames_seguidos += 1
        else:
            frames_seguidos = 0
            ultimo_nombre = "Desconocido"

        ahora = time.time()
        if (frames_seguidos >= FRAMES_SEGUIDOS_PARA_ALERTA
                and ahora - ultimo_aviso > TIEMPO_COOLDOWN):
            print(f"\n[ALERTA] Persona sin equipo de proteccion: {ultimo_nombre}")
            registrar_incidencia_bd("Falta de Casco", ultimo_nombre, mejor_confianza)
            enviar_alerta_esp32(ultimo_nombre)
            reportar_a_la_web("Falta de Casco", ultimo_nombre, mejor_confianza, frame)
            ultimo_aviso = ahora
            frames_seguidos = 0

        cv2.putText(frame, f"Frames seguidos: {frames_seguidos}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.imshow("Panel de Inspeccion - DROID", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Sistema apagado.")


if __name__ == "__main__":
    iniciar_patrullaje()
