"""Login, perfil (/me) y protección de rutas."""
from tests.conftest import cabecera_de


def test_login_correcto_devuelve_token_y_no_la_contrasena(cliente):
    r = cliente.post("/api/login", json={"usuario": "maria", "contrasena": "pass123"})
    assert r.status_code == 200
    assert r.json["token"] and r.json["rol"] == "encargado"
    assert "contrasena" not in r.json


def test_login_con_clave_mala_o_datos_faltantes(cliente):
    assert cliente.post("/api/login", json={"usuario": "juan", "contrasena": "mala"}).status_code == 401
    assert cliente.post("/api/login", json={"usuario": "juan"}).status_code == 400
    assert cliente.post("/api/login", json={"usuario": "nadie", "contrasena": "pass123"}).status_code == 401


def test_las_contrasenas_se_guardan_con_hash(cliente, consulta_sql):
    claves = [fila[0] for fila in consulta_sql("SELECT contrasena FROM usuarios")]
    assert all(c.startswith("pbkdf2:sha256") for c in claves)
    assert "pass123" not in claves


def test_rutas_protegidas_sin_token_o_con_token_invalido(cliente):
    assert cliente.get("/api/me").status_code == 401
    assert cliente.get("/api/me", headers={"Authorization": "Bearer basura"}).status_code == 401


def test_me_trae_la_zona_completa_con_su_epp(cliente, empleado):
    r = cliente.get("/api/me", headers=empleado)
    assert r.status_code == 200
    assert r.json["zona"] == "Zona A"
    assert r.json["zona_detalle"]["epp_requerido"] == ["casco", "lentes"]


def test_errores_siempre_en_json(cliente, encargada):
    r = cliente.put("/api/incidents/99999/resolver", headers=encargada)
    assert r.status_code == 404 and "error" in r.json
    assert "error" in cliente.get("/api/no-existe").json


def test_usuario_de_baja_no_puede_entrar(cliente, encargada):
    cliente.delete("/api/users/1", headers=encargada)
    assert cliente.post("/api/login", json={"usuario": "juan", "contrasena": "pass123"}).status_code == 403


def test_token_de_un_usuario_de_baja_no_ve_su_perfil(cliente, encargada):
    cliente.delete("/api/users/3", headers=encargada)
    assert cliente.get("/api/me", headers=cabecera_de(3, "empleado")).status_code == 401   # la sesión se corta al instante


def test_baja_corta_la_sesion_al_instante(cliente, encargada):
    from tests.conftest import cabecera_de
    carlos = cabecera_de(4, "empleado")
    assert cliente.get("/api/me", headers=carlos).status_code == 200
    assert cliente.delete("/api/users/4", headers=encargada).status_code == 200
    r = cliente.get("/api/me", headers=carlos)
    assert r.status_code == 401 and "sesión" in r.get_json()["error"]


def test_el_rol_se_toma_de_la_base_y_no_del_token(cliente):
    from tests.conftest import cabecera_de
    falso_encargado = cabecera_de(1, "encargado")          # Juan es empleado aunque el token diga otra cosa
    assert cliente.get("/api/users", headers=falso_encargado).status_code == 403
