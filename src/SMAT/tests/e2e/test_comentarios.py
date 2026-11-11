"""Fase 8.4: el empleado y la encargada conversan sobre una alerta."""
from conftest import esperar_texto, selector


def comentario(pag, texto, segundos=9):
    """Espera a que el comentario aparezca en la conversación y lo devuelve (o None).
    Se busca dentro de la lista: el cuadro donde se escribe también contiene el texto mientras se envía."""
    item = pag.get_by_role("dialog").get_by_role("listitem").filter(has_text=texto)
    for _ in range(segundos * 4):
        if item.count() and item.first.is_visible():
            return item.first
        pag.wait_for_timeout(250)
    return None


def test_el_empleado_comenta_y_la_encargada_responde(base_limpia, abrir):
    # Juan abre su alerta más nueva y cuenta qué pasó
    juan = abrir("juan", "/app/mis-alertas")
    juan.locator("article").first.click()
    dialogo = juan.get_by_role("dialog")
    assert esperar_texto(juan, "Todavía no hay comentarios. Podés contarle al encargado qué pasó.")
    dialogo.get_by_label("Escribir un comentario").fill("Se me empañaban los lentes, ya pedí otros")
    dialogo.get_by_role("button", name="Comentar").click()
    propio = comentario(juan, "Se me empañaban los lentes, ya pedí otros")
    assert propio and propio.get_by_text("Vos", exact=True).is_visible()

    # La encargada ve que esa alerta tiene un comentario y le responde
    maria = abrir("maria", "/app/incidencias")
    selector(maria, "Empleado").select_option(label="Juan Pérez")
    maria.wait_for_timeout(900)
    assert maria.get_by_title("1 comentario").first.is_visible()
    maria.get_by_role("button", name="Ver detalle").first.click()
    detalle = maria.get_by_role("dialog")
    assert comentario(maria, "Se me empañaban los lentes, ya pedí otros")
    detalle.get_by_label("Escribir un comentario").fill("Perfecto, pasá por el pañol")
    detalle.get_by_role("button", name="Comentar").click()
    respuesta = comentario(maria, "Perfecto, pasá por el pañol")
    assert respuesta and respuesta.get_by_text("Encargado", exact=True).is_visible()

    # A Juan le aparece la respuesta sin recargar (la conversación se actualiza cada 10 s)
    assert comentario(juan, "Perfecto, pasá por el pañol", 13)
    assert not juan.errores and not maria.errores
