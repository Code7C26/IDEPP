"""
Registra las fotos de un trabajador usando la camara del celular.

Uso:
  1. Ejecutar:  python registrar_trabajador.py
  2. Escribir el nombre del trabajador y apretar Enter.
  3. En la ventana del video: ESPACIO = sacar foto, Q = terminar.
  Conviene sacar 3 a 5 fotos: de frente, un poco de costado y con distinta luz.
"""
import os
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"

import cv2

# La IP de la cámara se pone en servidor_ia/.env (ver config.py)
from config import URL_CAMARA_CELULAR


CARPETA_FOTOS = "fotos_trabajadores"

nombre = input("Nombre del trabajador (ej: Juan Perez): ").strip()
if not nombre:
    print("No escribiste ningun nombre.")
    raise SystemExit

carpeta = os.path.join(CARPETA_FOTOS, nombre)
os.makedirs(carpeta, exist_ok=True)
cantidad = len(os.listdir(carpeta))

cap = cv2.VideoCapture(URL_CAMARA_CELULAR)
if not cap.isOpened():
    print("No se pudo abrir la camara. Revisa la IP.")
    raise SystemExit

print("ESPACIO = sacar foto  |  Q = terminar")
while True:
    ok, frame = cap.read()
    if not ok:
        continue
    frame = cv2.resize(frame, (640, 480))

    vista = frame.copy()
    cv2.putText(vista, f"{nombre} - fotos: {cantidad}", (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(vista, "ESPACIO = foto   Q = salir", (10, 465),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    cv2.imshow("Registrar trabajador", vista)

    tecla = cv2.waitKey(1) & 0xFF
    if tecla == ord(" "):
        cantidad += 1
        ruta = os.path.join(carpeta, f"foto_{cantidad}.jpg")
        cv2.imwrite(ruta, frame)   # se guarda la foto sin los textos
        print(f"Foto guardada: {ruta}")
    elif tecla == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
print(f"Listo. {nombre} tiene {cantidad} fotos guardadas.")
