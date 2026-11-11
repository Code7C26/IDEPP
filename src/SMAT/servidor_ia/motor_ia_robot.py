import os
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"   # oculta los avisos "overread"

import threading
import time
import urllib.request
from datetime import datetime

import cv2
import requests
import mysql.connector
from ultralytics import YOLO

from conexion_droid import reportar_a_la_web   # manda cada alerta (con foto) a la web DROID-E3D
# Las IPs de la cámara y del robot se ponen en servidor_ia/.env (ver config.py)
from config import URL_CAMARA, URL_ESP32_ALERTA
from video_web import iniciar_servidor_video, publicar_foto   # reenvía el video a la web

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
FRAMES_SEGUIDOS_PARA_ALERTA = 3    # fotogramas seguidos detectando antes de alertar (sin placa de video hay ~1-2 por segundo)
TIEMPO_COOLDOWN = 20               # segundos de espera entre alertas (más que los 10 s que dura la alarma del robot)
CONFIANZA_MINIMA = 0.40            # 40 %: con la ESP32-CAM el modelo de EPP da entre 40 y 60 %
TAMANO_IMAGEN_IA = 416             # tamaño con el que mira YOLO: mas chico = mas rapido (640 tarda el doble)
SIMILITUD_ROSTRO = 0.40            # que tan parecido tiene que ser el rostro (0 a 1)

# Modelos que reconocen el equipo de proteccion (EPP). Se usa el primero que este en la carpeta:
#   modelo_epp.pt    -> casco, barbijo, guantes, lentes y chaleco (y si FALTA cada uno)
#   modelo_cascos.pt -> solo casco
# Si no hay ninguno, se usa el modelo general y toda persona cuenta como "sin casco".
MODELO_EPP = "modelo_epp.pt"
MODELO_CASCOS = "modelo_cascos.pt"

# Cada elemento del EPP: palabras con las que lo nombran los modelos (en ingles o castellano)
# y como se llama la falta (asi la entiende conexion_droid.py).
# "falta": None = se dibuja en el video pero NO genera alerta (la web todavia no lo acepta).
ELEMENTOS_EPP = {
    "casco":   {"palabras": ("hardhat", "helmet", "casco"), "falta": "Falta de Casco"},
    "barbijo": {"palabras": ("mask", "barbijo"),             "falta": None},
    "guantes": {"palabras": ("glove", "guante"),             "falta": "Falta de Guantes"},
    "lentes":  {"palabras": ("goggle", "glasses", "lente"),  "falta": "Falta de Lentes"},
    "chaleco": {"palabras": ("vest", "chaleco"),             "falta": "Falta de Chaleco"},
}

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
# 3. MODELO DE EPP
# ==========================================
def clasificar_clases(nombres):
    """Lee los nombres de las clases del modelo y dice, para cada una, de que elemento
    se trata y si significa que lo TIENE o que le FALTA.
    Devuelve {id_clase: (elemento, falta)}. Ej: "no_helmet" -> ("casco", True)."""
    clases = {}
    for id_clase, nombre in nombres.items():
        t = nombre.lower().replace("-", "").replace("_", "").replace(" ", "")
        if t == "head":                       # algunos modelos llaman "head" a la cabeza sin casco
            clases[id_clase] = ("casco", True)
            continue
        for elemento, datos in ELEMENTOS_EPP.items():
            if any(palabra in t for palabra in datos["palabras"]):
                falta = t.startswith("no") or t.startswith("sin") or "without" in t
                clases[id_clase] = (elemento, falta)
                break
    return clases


def cargar_modelo():
    """Carga el mejor modelo que haya. Devuelve (modelo, clases); clases vacio = modo personas."""
    for archivo in (MODELO_EPP, MODELO_CASCOS):
        if not os.path.exists(archivo):
            continue
        print(f"[INFO] Cargando modelo: {archivo}")
        modelo = YOLO(archivo)
        clases = clasificar_clases(modelo.names)
        print(f"[INFO] Clases del modelo: {modelo.names}")
        for elemento in ELEMENTOS_EPP:
            tiene = [modelo.names[i] for i, (e, f) in clases.items() if e == elemento and not f]
            falta = [modelo.names[i] for i, (e, f) in clases.items() if e == elemento and f]
            if tiene or falta:
                print(f"[INFO] {elemento}: con {tiene}  |  sin {falta}")
        if any(falta for _, falta in clases.values()):
            return modelo, clases
        print(f"[AVISO] {archivo} no tiene ninguna clase 'sin ...'. Pruebo el siguiente.")
    print("[INFO] No hay modelo de EPP: se usa el modelo general (toda persona = sin casco).")
    return YOLO("yolov8n.pt"), {}


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
class CamaraEnVivo:
    """Lee la camara en segundo plano y se queda SOLO con la ultima foto.
    Asi, aunque YOLO tarde (sin placa de video), siempre analiza lo que pasa AHORA
    y el video no se va atrasando con fotos viejas acumuladas."""

    def __init__(self, url):
        self.url = url
        self.cap = cv2.VideoCapture(url)
        self.foto = None
        self.candado = threading.Lock()
        threading.Thread(target=self._leer_siempre, daemon=True).start()

    def abierta(self):
        return self.cap.isOpened()

    def _leer_siempre(self):
        while True:
            ok, foto = self.cap.read()
            if not ok:
                print("[ERROR] Se perdio el video. Reintentando...")
                time.sleep(1)
                self.cap.release()
                self.cap = cv2.VideoCapture(self.url)
                continue
            with self.candado:
                self.foto = foto

    def ultima_foto(self):
        """Devuelve la foto mas nueva (y la marca como usada) o None si no llego una nueva."""
        with self.candado:
            foto, self.foto = self.foto, None
        return foto


def iniciar_patrullaje():
    modelo, clases = cargar_modelo()
    modo_epp = len(clases) > 0   # False = modo personas (sin modelo de EPP)

    print("[INFO] Cargando reconocimiento facial...")
    descargar_modelos()
    detector = cv2.FaceDetectorYN.create(
        os.path.join(CARPETA_MODELOS, MODELO_DETECTOR), "", (640, 480), 0.8)
    reconocedor = cv2.FaceRecognizerSF.create(
        os.path.join(CARPETA_MODELOS, MODELO_RECONOCEDOR), "")
    conocidos = cargar_trabajadores(detector, reconocedor)

    ultimo_aviso = 0
    frames_seguidos = {}            # por cada falta: cuantos fotogramas seguidos se vio
    ultimo_nombre = "Desconocido"   # ultimo trabajador reconocido durante la deteccion

    print(f"[INFO] Conectando a la camara del robot: {URL_CAMARA}")
    camara = CamaraEnVivo(URL_CAMARA)
    if not camara.abierta():
        print("[ERROR] No se pudo abrir la camara del robot. Revisa la IP en el Monitor Serie"
              " y que nadie mas este mirando el video (la camara atiende a uno solo).")
        return
    iniciar_servidor_video()

    print("[INFO] Patrullaje iniciado. Toca la ventana del video y apreta 'q' para salir.")

    while True:
        frame = camara.ultima_foto()
        if frame is None:          # todavia no llego una foto nueva
            if cv2.waitKey(10) & 0xFF == ord("q"):
                break
            continue

        frame = cv2.resize(frame, (640, 480))
        resultados = modelo(frame, imgsz=TAMANO_IMAGEN_IA, conf=CONFIANZA_MINIMA, verbose=False)

        faltas_en_frame = {}   # falta -> mejor confianza en este fotograma (ej. "Falta de Casco": 87.0)

        for r in resultados:
            for caja in r.boxes:
                id_clase = int(caja.cls[0])
                confianza = float(caja.conf[0])
                if confianza < CONFIANZA_MINIMA:
                    continue
                x1, y1, x2, y2 = map(int, caja.xyxy[0])

                if modo_epp:
                    if id_clase not in clases:
                        continue   # algo que no es EPP (ej. zapatos): no se dibuja
                    elemento, falta = clases[id_clase]
                    if falta:   # rojo: le falta ese elemento
                        color, texto = (0, 0, 255), f"SIN {elemento.upper()} {confianza*100:.0f}%"
                        nombre_falta = ELEMENTOS_EPP[elemento]["falta"]
                        if nombre_falta:   # solo cuenta si genera alerta (el barbijo por ahora no)
                            faltas_en_frame[nombre_falta] = max(faltas_en_frame.get(nombre_falta, 0), confianza * 100)
                    else:       # verde: lo tiene puesto
                        color, texto = (0, 200, 0), f"Con {elemento} {confianza*100:.0f}%"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, texto, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                elif id_clase == 0:
                    # Modo sin modelo de EPP: toda persona cuenta como "sin casco"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"Sin EPP {confianza*100:.0f}%", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    faltas_en_frame["Falta de Casco"] = max(faltas_en_frame.get("Falta de Casco", 0), confianza * 100)

        infraccion_detectada = len(faltas_en_frame) > 0

        # Si hay una infraccion, buscamos de quien es la cara
        if infraccion_detectada:
            for nombre, x, y, w, h in reconocer_rostros(frame, detector, reconocedor, conocidos):
                color = (0, 255, 0) if nombre != "Desconocido" else (0, 165, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, nombre, (x, y + h + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                if nombre != "Desconocido":
                    ultimo_nombre = nombre

        # Cuenta cuantos fotogramas seguidos se ve cada falta (si deja de verse, vuelve a 0)
        frames_seguidos = {falta: frames_seguidos.get(falta, 0) + 1 for falta in faltas_en_frame}
        if not infraccion_detectada:
            ultimo_nombre = "Desconocido"

        # Alerta: la falta que lleva mas fotogramas seguidos, si llego al minimo
        ahora = time.time()
        if frames_seguidos and ahora - ultimo_aviso > TIEMPO_COOLDOWN:
            falta = max(frames_seguidos, key=frames_seguidos.get)
            if frames_seguidos[falta] >= FRAMES_SEGUIDOS_PARA_ALERTA:
                confianza = faltas_en_frame[falta]
                print(f"\n[ALERTA] {falta}: {ultimo_nombre}")
                # En segundo plano: si MySQL o el robot no responden, el video no se congela
                threading.Thread(target=registrar_incidencia_bd,
                                 args=(falta, ultimo_nombre, confianza), daemon=True).start()
                threading.Thread(target=enviar_alerta_esp32, args=(ultimo_nombre,), daemon=True).start()
                reportar_a_la_web(falta, ultimo_nombre, confianza, frame)
                ultimo_aviso = ahora
                frames_seguidos = {}

        seguidos = max(frames_seguidos.values(), default=0)
        cv2.putText(frame, f"Frames seguidos: {seguidos}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        publicar_foto(frame)   # la web ve lo mismo que esta ventana
        cv2.imshow("Panel de Inspeccion - DROID", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camara.cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Sistema apagado.")


if __name__ == "__main__":
    iniciar_patrullaje()
