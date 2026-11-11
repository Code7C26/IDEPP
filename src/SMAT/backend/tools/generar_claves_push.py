"""Genera las claves VAPID para las notificaciones push (se hace UNA sola vez por servidor).

Uso, desde src/SMAT/backend con el venv activado:
    python tools/generar_claves_push.py

Copiá las dos líneas que imprime en backend/.env y reiniciá el backend.
- La clave PÚBLICA la usa el navegador para suscribirse (no es secreta).
- La clave PRIVADA firma cada notificación: no la subas a GitHub ni la compartas.
Si las cambiás, los dispositivos que ya estaban suscriptos tienen que volver a activar las notificaciones.
"""
import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def a_base64url(datos):
    """Formato que piden los navegadores: base64 "para URLs" y sin los = del final."""
    return base64.urlsafe_b64encode(datos).rstrip(b"=").decode()


def generar_claves():
    """Par de claves de curva elíptica P-256 (la que exige el estándar Web Push)."""
    privada = ec.generate_private_key(ec.SECP256R1())
    publica = privada.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return a_base64url(publica), a_base64url(privada.private_numbers().private_value.to_bytes(32, "big"))


if __name__ == "__main__":
    publica, privada = generar_claves()
    print("Copiá estas líneas en backend/.env:\n")
    print(f"VAPID_PUBLIC_KEY={publica}")
    print(f"VAPID_PRIVATE_KEY={privada}")
