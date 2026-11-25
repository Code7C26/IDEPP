"""Prepara las fotos de entrenamiento para subirlas a Roboflow, YA MARCADAS.

Para qué sirve: marcar 300 fotos a mano (dibujar cada casco, barbijo, lentes...) lleva
horas. Este programa le pasa cada foto al modelo que ya tenemos (modelo_epp.pt) y guarda
los cuadros que encuentra. En Roboflow solo hay que CORREGIR: borrar los que estén mal,
agregar los que falten (sobre todo lentes y chaleco, que hoy casi no ve).

Cómo se usa (desde la carpeta servidor_ia):
    python entrenamiento/preparar_fotos.py

Lee las fotos de  fotos_entrenamiento/
Crea              entrenamiento/para_roboflow.zip   -> ese zip se sube a Roboflow

Solo se quedan CASCO, CHALECO y LENTES (con y sin cada uno): 6 clases. El barbijo y
los guantes se dejan afuera. Los nombres son los mismos que usa modelo_epp.pt, así
motor_ia_robot.py reconoce el modelo nuevo sin cambiarle nada.
"""
import os
import shutil
import zipfile

from ultralytics import YOLO

CARPETA_SERVIDOR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA_FOTOS = os.path.join(CARPETA_SERVIDOR, "fotos_entrenamiento")
CARPETA_SALIDA = os.path.join(CARPETA_SERVIDOR, "entrenamiento", "para_roboflow")
ARCHIVO_ZIP = os.path.join(CARPETA_SERVIDOR, "entrenamiento", "para_roboflow.zip")
MODELO = os.path.join(CARPETA_SERVIDOR, "modelo_epp.pt")

# Confianza baja a propósito: es mejor que marque de más (se borra fácil en Roboflow)
# que de menos (hay que dibujarlo a mano).
CONFIANZA_MINIMA = 0.25

# Las 6 clases que se quedan, en este orden (0 a 5). Todo lo demás se descarta.
CLASES = ["Hardhat", "NO-Hardhat", "Safety Vest", "NO-Safety Vest", "Goggles", "NO-Goggles"]


def main():
    fotos = [f for f in os.listdir(CARPETA_FOTOS) if f.lower().endswith(".jpg")] if os.path.isdir(CARPETA_FOTOS) else []
    if not fotos:
        print(f"[ERROR] No hay fotos en {CARPETA_FOTOS}")
        print("        Primero sacalas con:  python sacar_fotos_entrenamiento.py")
        return

    print(f"[INFO] {len(fotos)} fotos. Cargando el modelo actual para pre-marcarlas...")
    modelo = YOLO(MODELO)

    # Carpeta limpia con el formato que entiende Roboflow (YOLO): images/ + labels/ + data.yaml
    if os.path.isdir(CARPETA_SALIDA):
        shutil.rmtree(CARPETA_SALIDA)
    os.makedirs(os.path.join(CARPETA_SALIDA, "images"))
    os.makedirs(os.path.join(CARPETA_SALIDA, "labels"))

    cuadros_por_clase = {}
    for numero, nombre in enumerate(sorted(fotos), start=1):
        ruta_foto = os.path.join(CARPETA_FOTOS, nombre)
        resultado = modelo(ruta_foto, conf=CONFIANZA_MINIMA, verbose=False)[0]

        # Una línea por cuadro: clase x_centro y_centro ancho alto (de 0 a 1)
        lineas = []
        for caja in resultado.boxes:
            nombre_clase = modelo.names[int(caja.cls[0])]
            if nombre_clase not in CLASES:   # barbijo, guantes, escalera, persona...: afuera
                continue
            clase = CLASES.index(nombre_clase)
            x, y, ancho, alto = caja.xywhn[0].tolist()
            lineas.append(f"{clase} {x:.6f} {y:.6f} {ancho:.6f} {alto:.6f}")
            cuadros_por_clase[clase] = cuadros_por_clase.get(clase, 0) + 1

        shutil.copy(ruta_foto, os.path.join(CARPETA_SALIDA, "images", nombre))
        with open(os.path.join(CARPETA_SALIDA, "labels", nombre[:-4] + ".txt"), "w") as archivo:
            archivo.write("\n".join(lineas))

        if numero % 25 == 0:
            print(f"   {numero}/{len(fotos)} fotos listas")

    # data.yaml: la lista de las 6 clases, en orden
    with open(os.path.join(CARPETA_SALIDA, "data.yaml"), "w") as archivo:
        archivo.write("train: images\nval: images\n")
        archivo.write(f"nc: {len(CLASES)}\n")
        archivo.write("names: [" + ", ".join(f"'{n}'" for n in CLASES) + "]\n")

    # Todo en un zip para subirlo de una vez
    with zipfile.ZipFile(ARCHIVO_ZIP, "w", zipfile.ZIP_DEFLATED) as zip_final:
        for carpeta, _, archivos in os.walk(CARPETA_SALIDA):
            for archivo in archivos:
                ruta = os.path.join(carpeta, archivo)
                zip_final.write(ruta, os.path.relpath(ruta, CARPETA_SALIDA))

    print("\n[OK] Lo que el modelo actual ya marcó solo:")
    for numero_clase, nombre_clase in enumerate(CLASES):
        print(f"   {nombre_clase:15} {cuadros_por_clase.get(numero_clase, 0)}")
    print(f"\n[OK] Subí este archivo a Roboflow: {ARCHIVO_ZIP}")


if __name__ == "__main__":
    main()
