# Servidor de IA · DROID-E3D

Hecho por **Morena**. Mira la cámara del robot (ESP32-CAM, `walle_camara/`), detecta con YOLO si alguien
no tiene casco, reconoce de quién es la cara y avisa. Desde el 08/10/2026 cada alerta llega también
a la **web de DROID-E3D**, con la foto del momento.

```
ESP32-CAM ──► motor_ia_robot.py ──┬─► base propia (robotica_industrial)
(WiFi)        YOLO + reconocimiento├─► ESP32 del robot (/alerta_seguridad)
              facial               ├─► web DROID-E3D (POST /api/incidents con foto)
                                   │     └─► alerta en el panel + máquina detenida
                                   └─► video con recuadros en :8080/video (video_web.py)
                                         └─► web → Robot → video en vivo
```

## Archivos

| Archivo | Qué hace |
|---|---|
| `motor_ia_robot.py` | Programa principal: video, detección de cascos, reconocimiento facial y alertas |
| `video_web.py` | Reenvía a la web el video con los recuadros (en `:8080/video`) |
| `conexion_droid.py` | Manda cada alerta a la web (en segundo plano, no frena el video) |
| `registrar_trabajador.py` | Saca fotos de un trabajador con la cámara y las guarda en `fotos_trabajadores/<Nombre>/` |
| `crear_base_datos.sql` | Base propia `robotica_industrial` (registro local de alertas) |
| `fotos_trabajadores/` | Una carpeta por persona; **el nombre de la carpeta es el nombre que se reconoce** |
| `modelo_epp.pt` | Modelo principal: con/sin casco, guantes, lentes, chaleco y barbijo (el barbijo se ve en el video pero todavía no manda alerta: la web no lo acepta) |
| `modelo_cascos.pt`, `yolov8n.pt` | Modelos de respaldo: solo casco, y personas (se usan si falta `modelo_epp.pt`) |
| `modelos/` | Modelos de OpenCV para detectar y reconocer caras |

## Cómo usarlo (Windows, PowerShell)

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\servidor_ia
pip install -r requirements.txt          # una sola vez
# en XAMPP → MySQL, cargar crear_base_datos.sql una vez
python motor_ia_robot.py                  # Q en la ventana del video para salir
```

Antes de arrancar, copiá `.env.example` como `.env` (en esta carpeta) y poné la IP de la cámara
(`URL_CAMARA`, la que muestra la ESP32-CAM en el Monitor Serie) y la del robot (`URL_ESP32_ALERTA`). El `.env` no se sube a GitHub, así que
cuando cambia la red solo se toca ese archivo:
```powershell
Copy-Item .env.example .env
notepad .env
```

**No se suben a GitHub:** `fotos_trabajadores/` (caras reales), `modelos/` y `yolov8n.pt`. Los
modelos se descargan solos la primera vez. Las fotos se pasan por fuera de GitHub o se sacan de nuevo
con `registrar_trabajador.py`. `modelo_cascos.pt` y `modelo_epp.pt` sí están en el repo.

### Conexión con la web

- **Robot (`robot_droid/`):** copiá `secretos.example.h` como `secretos.h` y completá `URL_BACKEND`, `ROBOT_API_KEY` y
  `ZONA_DEL_ROBOT`. Con eso arranca detenido, obedece a la web (Iniciar, Pausar, Detener y Emergencia) y le informa su
  estado y su zona. Sin esos datos, anda como antes: patrulla solo, sin la web. Necesita la librería **ArduinoJson**.
- **Zona del robot:** la saca de la ruta de `/app/robot` y de marcas en el piso. Poné una cinta negra que cruce la línea
  en la entrada de cada zona, lo bastante ancha para que los 2 sensores la vean a la vez: una marca por parada, en el
  mismo orden que la ruta. Al tocar Iniciar, el robot tiene que estar adentro de la primera zona de la ruta. En
  `http://<IP-del-robot>/sensores` se ven las marcas contadas y la zona que informa. Si se saltea una marca, la zona
  queda corrida hasta el próximo Iniciar. El ajuste es `MARCA_MS`, en `robot_droid.ino`.
- **Misma PC que el backend:** no hay que configurar nada; toma la clave de `../backend/.env`.
- **Otra PC:** completá en tu `.env` (la clave te la pasa Toro por fuera de GitHub):
  ```
  DROID_URL=http://<IP-de-la-PC-del-backend>:5000/api
  YOLO_API_KEY=<la clave>
  ```
  También sirven como variables de entorno (`$env:DROID_URL = "..."`), que tienen prioridad sobre el `.env`.
- **Zona:** si no se configura, la web usa la zona que informó el robot. **Si el robot no la informó, la web rechaza la
  alerta (error 400).** Para fijarla: `DROID_ZONA_ID=2` en el `.env`.
- **Demo completa en la red local:** ver [`../docs/DEMO-LOCAL.md`](../docs/DEMO-LOCAL.md).
- **Nombres:** para que la alerta quede a nombre de alguien, tiene que existir un empleado en la web
  con el mismo nombre que su carpeta. Para darlos de alta a todos de una vez:
  ```powershell
  cd ..\backend
  python tools\cargar_trabajadores_ia.py --clave-inicial clave123
  ```
  Si no lo encuentra, la alerta llega igual como "Desconocido".
- **Video en vivo en la web:** la ESP32-CAM le manda video a **uno solo a la vez** (a la IA).
  Por eso la IA lo reenvía, con los recuadros, desde esta PC (`video_web.py`). En la web, en
  Robot → Dirección del video, poné `http://<IP-de-la-PC-de-la-IA>:8080/video` (no la de la cámara).
  Para sacar fotos con `registrar_trabajador.py`, cerrá antes el motor.

Si la web no responde, el motor sigue funcionando igual: solo muestra `[ERROR WEB]` en la consola.

## Datos personales

Las fotos de `fotos_trabajadores/` son caras de personas reales. Solo se cargan con su consentimiento
(Ley 25.326), y si alguien lo retira hay que borrar su carpeta.
