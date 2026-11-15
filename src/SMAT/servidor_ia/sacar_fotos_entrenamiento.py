"""Saca fotos con la cámara del robot para entrenar el modelo de EPP.

Para qué sirve: el modelo aprendió con fotos de obras, mucho más nítidas que las de la
ESP32-CAM, y por eso casi no reconoce el barbijo, los lentes ni el chaleco. Con fotos
de NUESTRA cámara se lo puede reentrenar (ver el README, "Entrenar el modelo").

Cómo se usa (con motor_ia_robot.py CERRADO: la cámara atiende a un solo programa):
    python sacar_fotos_entrenamiento.py

Se abre una ventana con el video y guarda una foto cada SEGUNDOS_ENTRE_FOTOS en la
carpeta fotos_entrenamiento/ (no se sube a GitHub).
    ESPACIO  pausa / sigue (para cambiarse el barbijo, los lentes, etc. sin sacar fotos)
    Q        termina

Ideas para que el modelo aprenda bien (unas 200-300 fotos en total):
  - Varias personas, CON y SIN cada elemento (barbijo, lentes, casco, chaleco).
  - Combinaciones: con barbijo y sin lentes, con lentes y sin barbijo, con los dos, sin ninguno.
  - De frente, de costado, cerca y de cuerpo entero.
  - Con distinta luz (de día, con la luz prendida) y distintos fondos.
"""
import os
import time

import cv2

from config import URL_CAMARA

SEGUNDOS_ENTRE_FOTOS = 1.0
CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fotos_entrenamiento")


def main():
    os.makedirs(CARPETA, exist_ok=True)
    ya_habia = len([f for f in os.listdir(CARPETA) if f.endswith(".jpg")])
    print(f"[INFO] Las fotos se guardan en {CARPETA} (ya hay {ya_habia})")
    print(f"[INFO] Conectando a la camara: {URL_CAMARA}")

    camara = cv2.VideoCapture(URL_CAMARA)
    if not camara.isOpened():
        print("[ERROR] No pude abrir la camara. ¿Esta prendida? ¿Cerraste motor_ia_robot.py?")
        return

    guardadas = 0
    pausado = True   # arranca en pausa, asi te acomodas antes de empezar
    ultima = 0.0
    print("[INFO] Arranca EN PAUSA. ESPACIO = empezar/pausar, Q = terminar.")

    while True:
        ok, foto = camara.read()
        if not ok:
            print("[ERROR] Se perdio el video. Reintentando...")
            time.sleep(1)
            camara.release()
            camara = cv2.VideoCapture(URL_CAMARA)
            continue

        ahora = time.time()
        if not pausado and ahora - ultima >= SEGUNDOS_ENTRE_FOTOS:
            nombre = time.strftime("foto_%Y%m%d_%H%M%S") + f"_{int(ahora * 1000) % 1000:03d}.jpg"
            cv2.imwrite(os.path.join(CARPETA, nombre), foto)   # se guarda SIN los carteles de abajo
            guardadas += 1
            ultima = ahora

        # Lo que se ve en la ventana (los carteles no quedan en las fotos guardadas)
        vista = foto.copy()
        estado = "PAUSA (ESPACIO para sacar fotos)" if pausado else "SACANDO FOTOS"
        color = (0, 165, 255) if pausado else (0, 0, 255)
        cv2.putText(vista, estado, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(vista, f"Fotos: {ya_habia + guardadas}", (10, 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("Fotos para entrenar - DROID", vista)

        tecla = cv2.waitKey(1) & 0xFF
        if tecla == ord(" "):
            pausado = not pausado
        elif tecla == ord("q"):
            break

    camara.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Listo: {guardadas} fotos nuevas, {ya_habia + guardadas} en total.")


if __name__ == "__main__":
    main()
