"""Crea en la web un empleado por cada trabajador que reconoce el servidor de IA.

La IA de Morena reconoce a las personas por el nombre de su carpeta en
src/SMAT/servidor_ia/fotos_trabajadores/<Nombre Apellido>/. La web vincula cada alerta con el
empleado que tiene ESE MISMO nombre; si no existe, la alerta queda como "Desconocido".
Esa carpeta NO está en GitHub (son caras reales): se pasa por fuera o se arma con registrar_trabajador.py.
Este script da de alta a los que falten (usa la API como encargado, así queda en la auditoría).

Uso (con el backend andando), desde src/SMAT/backend:
    python tools/cargar_trabajadores_ia.py --clave-inicial clave123
    python tools/cargar_trabajadores_ia.py --clave-inicial clave123 --zona 2
    python tools/cargar_trabajadores_ia.py --clave-inicial clave123 --con-consentimiento   # sube también sus fotos

--con-consentimiento: copia hasta 5 fotos de cada uno a "Fotos de rostro" de la web. Usalo SOLO si
esas personas aceptaron que se use su cara (Ley 25.326). Sin esa opción no se sube ninguna foto.
"""
import argparse
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.request
import uuid

CARPETA_FOTOS = os.path.join(os.path.dirname(__file__), "..", "..", "servidor_ia", "fotos_trabajadores")


class Api:
    def __init__(self, url):
        self.url, self.token = url.rstrip("/"), None

    def llamar(self, metodo, ruta, datos=None, cuerpo=None, tipo="application/json"):
        cabeceras = {"Content-Type": tipo}
        if self.token:
            cabeceras["Authorization"] = f"Bearer {self.token}"
        if datos is not None:
            cuerpo = json.dumps(datos).encode()
        pedido = urllib.request.Request(self.url + ruta, data=cuerpo, method=metodo, headers=cabeceras)
        with urllib.request.urlopen(pedido, timeout=10) as r:
            return json.loads(r.read() or b"{}")

    def subir_foto(self, usuario_id, ruta_foto):
        limite = uuid.uuid4().hex
        cuerpo = (f'--{limite}\r\nContent-Disposition: form-data; name="consentimiento"\r\n\r\ntrue\r\n'
                  f'--{limite}\r\nContent-Disposition: form-data; name="imagen"; filename="foto.jpg"\r\n'
                  f"Content-Type: image/jpeg\r\n\r\n").encode() + open(ruta_foto, "rb").read() + f"\r\n--{limite}--\r\n".encode()
        return self.llamar("POST", f"/users/{usuario_id}/rostros", cuerpo=cuerpo, tipo=f"multipart/form-data; boundary={limite}")


def usuario_para(nombre, usados):
    """'Juan Argüello' -> 'juan.arguello' (sin tildes ni espacios); si ya existe, le agrega un número."""
    simple = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    base = ".".join(simple.split()) or "trabajador"
    usuario, n = base, 2
    while usuario in usados:
        usuario, n = f"{base}{n}", n + 1
    return usuario


def main():
    ap = argparse.ArgumentParser(description="Da de alta en la web a los trabajadores que reconoce la IA")
    ap.add_argument("--url", default=os.getenv("DROID_URL", "http://127.0.0.1:5000/api"))
    ap.add_argument("--encargado", default="maria", help="usuario encargado con el que se entra")
    ap.add_argument("--clave", default="pass123", help="contraseña de ese encargado")
    ap.add_argument("--clave-inicial", required=True, help="contraseña inicial de los empleados nuevos (mín. 6)")
    ap.add_argument("--zona", type=int, help="id de la zona donde trabajan (opcional)")
    ap.add_argument("--con-consentimiento", action="store_true", help="sube también sus fotos de rostro")
    args = ap.parse_args()

    if not os.path.isdir(CARPETA_FOTOS):
        # Desde el 19/10 las fotos no se suben a GitHub (datos personales), así que puede faltar
        sys.exit(f"No encuentro la carpeta de fotos: {os.path.abspath(CARPETA_FOTOS)}\n"
                 "Las fotos no están en GitHub: pedíselas a Morena y copialas en esa carpeta,\n"
                 "o sacalas de nuevo con servidor_ia/registrar_trabajador.py.")
    api = Api(args.url)
    try:
        api.token = api.llamar("POST", "/login", {"usuario": args.encargado, "contrasena": args.clave})["token"]
    except urllib.error.URLError as e:
        sys.exit(f"No se pudo entrar a {args.url}: {e}")

    usuarios = api.llamar("GET", "/users")["usuarios"]
    por_nombre = {u["nombre"].lower(): u for u in usuarios}
    usados = {u["usuario"] for u in usuarios}

    for nombre in sorted(os.listdir(CARPETA_FOTOS)):
        carpeta = os.path.join(CARPETA_FOTOS, nombre)
        if not os.path.isdir(carpeta):
            continue
        existente = por_nombre.get(nombre.lower())
        if existente:
            print(f"= {nombre}: ya existe (@{existente['usuario']})")
            empleado = existente
        else:
            usuario = usuario_para(nombre, usados)
            usados.add(usuario)
            try:
                empleado = api.llamar("POST", "/users", {"usuario": usuario, "contrasena": args.clave_inicial, "nombre": nombre,
                                                        "rol": "empleado", "zona_id": args.zona})
            except urllib.error.HTTPError as e:
                print(f"! {nombre}: no se pudo crear ({e.read().decode(errors='replace')})")
                continue
            print(f"+ {nombre}: creado como @{usuario}")

        if args.con_consentimiento:
            ya = len(api.llamar("GET", f"/users/{empleado['id']}/rostros")["fotos"])
            fotos = sorted(f for f in os.listdir(carpeta) if f.lower().endswith((".jpg", ".jpeg", ".png")))
            for foto in fotos[: max(0, 5 - ya)]:
                api.subir_foto(empleado["id"], os.path.join(carpeta, foto))
            print(f"  fotos de rostro en la web: {min(5, ya + len(fotos))}")


if __name__ == "__main__":
    main()
