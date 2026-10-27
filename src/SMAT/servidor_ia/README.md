# Servidor de IA · DROID-E3D

Hecho por **Morena**. Mira la cámara del robot (celular con IP Webcam), detecta con YOLO si alguien
no tiene casco, reconoce de quién es la cara y avisa. Desde el 08/10/2026 cada alerta llega también
a la **web de DROID-E3D**, con la foto del momento.

```
cámara del celular ──► motor_ia_robot.py ──┬─► base propia (robotica_industrial)
                       YOLO + reconocimiento├─► ESP32 del robot (/alerta_seguridad)
                       facial               └─► web DROID-E3D (POST /api/incidents con foto)
                                                 └─► alerta en el panel + máquina detenida
```

## Archivos

| Archivo | Qué hace |
|---|---|
| `motor_ia_robot.py` | Programa principal: video, detección de cascos, reconocimiento facial y alertas |
| `conexion_droid.py` | Manda cada alerta a la web (en segundo plano, no frena el video) |
| `registrar_trabajador.py` | Saca fotos de un trabajador con la cámara y las guarda en `fotos_trabajadores/<Nombre>/` |
| `crear_base_datos.sql` | Base propia `robotica_industrial` (registro local de alertas) |
| `fotos_trabajadores/` | Una carpeta por persona; **el nombre de la carpeta es el nombre que se reconoce** |
| `modelo_cascos.pt`, `yolov8n.pt` | Modelos de YOLO (con casco / sin casco, y personas) |
| `modelos/` | Modelos de OpenCV para detectar y reconocer caras |

## Cómo usarlo (Windows, PowerShell)

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\servidor_ia
pip install -r requirements.txt          # una sola vez
# en XAMPP → MySQL, cargar crear_base_datos.sql una vez
python motor_ia_robot.py                  # Q en la ventana del video para salir
```

Antes de arrancar, copiá `.env.example` como `.env` (en esta carpeta) y poné la IP de la cámara
(`URL_CAMARA_CELULAR`) y la del robot (`URL_ESP32_ALERTA`). El `.env` no se sube a GitHub, así que
cuando cambia la red solo se toca ese archivo:
```powershell
Copy-Item .env.example .env
notepad .env
```

**No se suben a GitHub:** `fotos_trabajadores/` (caras reales), `modelos/` y `yolov8n.pt`. Los
modelos se descargan solos la primera vez. Las fotos se pasan por fuera de GitHub o se sacan de nuevo
con `registrar_trabajador.py`. `modelo_cascos.pt` sí está en el repo.

### Conexión con la web

- **Misma PC que el backend:** no hay que configurar nada; toma la clave de `../backend/.env`.
- **Otra PC:** completá en tu `.env` (la clave te la pasa Toro por fuera de GitHub):
  ```
  DROID_URL=http://<IP-de-la-PC-del-backend>:5000/api
  YOLO_API_KEY=<la clave>
  ```
  También sirven como variables de entorno (`$env:DROID_URL = "..."`), que tienen prioridad sobre el `.env`.
- **Zona:** si no se configura, la web usa la zona donde está el robot. Para fijarla: `DROID_ZONA_ID=2` en el `.env`.
- **Demo completa en la red local:** ver [`../docs/DEMO-LOCAL.md`](../docs/DEMO-LOCAL.md).
- **Nombres:** para que la alerta quede a nombre de alguien, tiene que existir un empleado en la web
  con el mismo nombre que su carpeta. Para darlos de alta a todos de una vez:
  ```powershell
  cd ..\backend
  python tools\cargar_trabajadores_ia.py --clave-inicial clave123
  ```
  Si no lo encuentra, la alerta llega igual como "Desconocido".
- **Video en vivo en la web:** en la página Robot → Video, pegá la misma URL de la cámara
  (`http://<IP-del-celular>:8080/video`).

Si la web no responde, el motor sigue funcionando igual: solo muestra `[ERROR WEB]` en la consola.

## Datos personales

Las fotos de `fotos_trabajadores/` son caras de personas reales. Solo se cargan con su consentimiento
(Ley 25.326), y si alguien lo retira hay que borrar su carpeta.
