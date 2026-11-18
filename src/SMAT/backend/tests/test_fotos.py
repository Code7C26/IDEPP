"""Fase 6: foto de evidencia en las alertas y fotos de rostro con consentimiento."""
import io

from tests.conftest import CARLOS, JUAN, YOLO, cabecera_de

# Imágenes mínimas: alcanza con los primeros bytes de cada formato (el servidor revisa la "firma")
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def archivo(contenido=PNG, nombre="foto.png"):
    return (io.BytesIO(contenido), nombre)


def alerta_con_foto(cliente, **campos):
    datos = {"tipo": "sin_casco", "zona_id": "2", "empleado_id": str(CARLOS), "confianza": "0.9", "imagen": archivo(), **campos}
    return cliente.post("/api/incidents", data=datos, headers=YOLO, content_type="multipart/form-data")


# ---------- Evidencia en las alertas ----------

def test_yolo_manda_alerta_con_foto(cliente, encargada):
    r = alerta_con_foto(cliente)
    assert r.status_code == 201
    inc = r.get_json()
    assert inc["imagen_url"].startswith(f"/uploads/evidencias/{inc['id']}_") and inc["imagen_url"].endswith(".png")
    assert inc["empleado_id"] == CARLOS and inc["confianza"] == 0.9

    foto = cliente.get("/api" + inc["imagen_url"], headers=encargada)
    assert foto.status_code == 200 and foto.data == PNG


def test_alerta_con_foto_sin_empleado(cliente):
    r = alerta_con_foto(cliente, empleado_id="")
    assert r.status_code == 201 and r.get_json()["empleado_id"] is None


def test_alerta_con_foto_rechaza_archivos_que_no_son_imagen(cliente, encargada):
    antes = cliente.get("/api/incidents?limit=1", headers=encargada).get_json()["total"]
    r = alerta_con_foto(cliente, imagen=archivo(b"MZ esto es un programa", "virus.png"))
    assert r.status_code == 400 and "JPG o PNG" in r.get_json()["error"]
    assert cliente.get("/api/incidents?limit=1", headers=encargada).get_json()["total"] == antes   # no se guardó nada


def test_alerta_con_foto_valida_los_campos(cliente):
    assert alerta_con_foto(cliente, tipo="sin_botas").status_code == 400
    assert alerta_con_foto(cliente, confianza="mucha").status_code == 400
    assert alerta_con_foto(cliente, zona_id="99").status_code == 400


def test_foto_demasiado_grande(cliente):
    r = alerta_con_foto(cliente, imagen=archivo(PNG + b"\x00" * (7 * 1024 * 1024)))
    assert r.status_code == 413 and "MB" in r.get_json()["error"]


def test_evidencia_solo_la_ve_el_encargado_o_el_empleado_de_la_alerta(cliente, empleado):
    url = "/api" + alerta_con_foto(cliente).get_json()["imagen_url"]
    assert cliente.get(url).status_code == 401
    assert cliente.get(url, headers=empleado).status_code == 403                      # Juan no está en la foto
    assert cliente.get(url, headers=cabecera_de(CARLOS, "empleado")).status_code == 200
    assert cliente.get("/api/uploads/evidencias/..%2Fconfig.py", headers=cabecera_de(CARLOS, "empleado")).status_code in (403, 404)
    assert cliente.get("/api/uploads/otra/x.png", headers=YOLO).status_code == 404


# ---------- Fotos de rostro ----------

def subir_rostro(cliente, headers, usuario=JUAN, consentimiento="true", contenido=JPG):
    return cliente.post(f"/api/users/{usuario}/rostros", headers=headers, content_type="multipart/form-data",
                        data={"imagen": archivo(contenido, "cara.jpg"), "consentimiento": consentimiento})


def test_rostro_exige_consentimiento(cliente, encargada):
    r = subir_rostro(cliente, encargada, consentimiento="false")
    assert r.status_code == 400 and "consentimiento" in r.get_json()["error"]
    assert cliente.get(f"/api/users/{JUAN}/rostros", headers=encargada).get_json()["fotos"] == []


def test_encargada_sube_rostro_y_yolo_lo_recibe(cliente, encargada, consulta_sql):
    r = subir_rostro(cliente, encargada)
    assert r.status_code == 201
    foto = r.get_json()
    assert foto["url"].startswith(f"/uploads/rostros/{JUAN}_") and foto["consentimiento_at"]

    rostros = cliente.get("/api/rostros", headers=YOLO).get_json()["rostros"]
    assert rostros == [{"empleado_id": JUAN, "nombre": "Juan Pérez", "fotos": [foto["url"]]}]
    assert cliente.get("/api" + foto["url"], headers=YOLO).data == JPG
    assert consulta_sql("SELECT accion FROM auditoria WHERE accion = 'subir_rostro'")


def test_empleado_maneja_solo_sus_fotos(cliente, empleado):
    foto = subir_rostro(cliente, empleado).get_json()
    assert cliente.get(f"/api/users/{JUAN}/rostros", headers=empleado).get_json()["fotos"][0]["id"] == foto["id"]
    assert cliente.get(f"/api/users/{CARLOS}/rostros", headers=empleado).status_code == 403
    assert subir_rostro(cliente, empleado, usuario=CARLOS).status_code == 403

    assert cliente.delete(f"/api/users/{JUAN}/rostros/{foto['id']}", headers=empleado).status_code == 200
    assert cliente.get(f"/api/users/{JUAN}/rostros", headers=empleado).get_json()["fotos"] == []
    assert cliente.get("/api" + foto["url"], headers=YOLO).status_code == 404     # el archivo también se borró


def test_maximo_de_fotos(cliente, encargada):
    for _ in range(5):
        assert subir_rostro(cliente, encargada).status_code == 201
    r = subir_rostro(cliente, encargada)
    assert r.status_code == 400 and "5 fotos" in r.get_json()["error"]


def test_baja_borra_las_fotos_de_rostro(cliente, encargada):
    url = subir_rostro(cliente, encargada, usuario=CARLOS).get_json()["url"]
    assert cliente.delete(f"/api/users/{CARLOS}", headers=encargada).status_code == 200
    assert cliente.get("/api/rostros", headers=YOLO).get_json()["rostros"] == []
    assert cliente.get("/api" + url, headers=YOLO).status_code == 404


def test_rostros_exige_la_clave_de_yolo(cliente, encargada):
    assert cliente.get("/api/rostros").status_code == 401
    assert cliente.get("/api/rostros", headers=encargada).status_code == 401
