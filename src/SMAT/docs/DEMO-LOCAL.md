# Demo en la red local (sin internet)

Guía para mostrar DROID-E3D en la feria, en el aula o frente al jurado. La notebook de Toro hace de
**servidor**: tiene MySQL y Flask, y Flask sirve la API y la web compilada en la **misma dirección**.
Los celulares, el robot, la máquina y la PC con la IA se conectan a esa notebook por WiFi.

```
            WiFi propia (router o hotspot del celular)
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
Notebook       Celulares      ESP32 robot    ESP32 máquina   PC de Morena
MySQL + Flask  http://IP:5000 URL_BASE       URL_BASE        servidor_ia (DROID_URL)
(el servidor)
```

> **Usá una WiFi propia** (un router o el hotspot de un celular). Las redes del colegio o de los
> eventos suelen tener «aislamiento de clientes»: los equipos navegan, pero no se ven entre sí.

---

## 1. El día anterior (con internet)

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID
git switch SMAT-web
git pull
cd src\SMAT\backend
venv\Scripts\activate
pip install -r requirements.txt
cd ..\frontend
npm ci
npm run build            # la web compilada (carpeta dist) que va a servir Flask
```

- Opcional, para empezar con los datos de ejemplo limpios: **esto borra todo lo cargado en `robot_db`**.
  ```powershell
  cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT
  C:\xampp\mysql\bin\mysql.exe -u root -e "DROP DATABASE IF EXISTS robot_db;"
  cmd /c "C:\xampp\mysql\bin\mysql.exe -u root < backend\database\schema.sql"
  ```
  (El `cmd /c` hace falta porque PowerShell no acepta el `<`.)
- Si la IA va a reconocer caras: las fotos de `servidor_ia/fotos_trabajadores/` **no están en GitHub**.
  Se pasan por fuera (pendrive o Drive) y solo de personas que dieron su consentimiento (Ley 25.326).

## 2. La IP de la notebook

Conectá la notebook a la WiFi de la demo y buscá su IP:

```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
```

Si no aparece nada, usá `ipconfig` y buscá la **Dirección IPv4** del adaptador Wi-Fi (algo como
`192.168.0.10`). En esta guía se escribe **IP**. Si reiniciás el router o cambiás de red, la IP puede
cambiar: revisala siempre el mismo día.

## 3. Abrir el puerto 5000 en el firewall (una sola vez)

En **PowerShell como administrador** (clic derecho → «Ejecutar como administrador»):

```powershell
# La red de la demo como "privada" (en una red "pública" Windows bloquea todo lo que entra)
Set-NetConnectionProfile -InterfaceAlias Wi-Fi -NetworkCategory Private
# Dejar entrar a DROID-E3D (solo en redes privadas)
New-NetFirewallRule -DisplayName "DROID-E3D (puerto 5000)" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Private
```

Para sacar la regla después de la demo:
```powershell
Remove-NetFirewallRule -DisplayName "DROID-E3D (puerto 5000)"
```

## 4. Arrancar el servidor

1. Abrí el **panel de XAMPP** y tocá **Start** en MySQL.
2. En PowerShell:
   ```powershell
   cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\backend
   venv\Scripts\activate
   python app.py
   ```
3. Desde un **celular** conectado a la misma WiFi, abrí `http://IP:5000/api/health`. Si responde
   `{"status": "ok", ...}`, la red y el firewall están bien.
4. La web queda en **`http://IP:5000`**. Entrá como `maria` (encargada) o `juan` (empleado), con la
   contraseña `pass123`.

> Usá `http://IP:5000` y **no** `npm run dev` (puerto 5173): la versión compilada es la misma que va a
> estar online y no hace falta tocar `frontend\.env`.

## 5. Dónde va la IP en cada pieza

| Pieza | Qué se configura | Dónde |
|---|---|---|
| Celulares y proyector | Abrir `http://IP:5000` | Navegador |
| ESP32 del robot | `URL_BASE = "http://IP:5000/api"` y `ROBOT_KEY` | `docs/integracion/esp32_robot.ino` (se vuelve a cargar al ESP32) |
| ESP32 de la máquina | `URL_BASE = "http://IP:5000/api"` y `ROBOT_KEY` | `docs/integracion/esp32_maquina.ino` |
| IA en la PC de Morena | `DROID_URL=http://IP:5000/api`, `YOLO_API_KEY`, `URL_CAMARA_CELULAR`, `URL_ESP32_ALERTA` | `servidor_ia/.env` (copia de `.env.example`) |
| IA en la misma notebook | Solo `URL_CAMARA_CELULAR` y `URL_ESP32_ALERTA`: la clave la lee de `backend/.env` | `servidor_ia/.env` |
| Video en vivo | La URL de la cámara: `http://<IP-del-celular-cámara>:8080/video` | Web → **Robot** → Dirección del video |

Las claves (`ROBOT_API_KEY`, `YOLO_API_KEY`) están en `backend\.env` y se pasan **por fuera de GitHub**.

## 6. Si falta el hardware: simuladores

Con el backend andando, en otra ventana de PowerShell:

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\backend
venv\Scripts\activate
python tools\simular_esp32.py --velocidad 10 --maquinas     # robot que recorre las zonas + máquinas
python tools\simular_yolo.py --cada 15                       # una alerta con foto cada 15 s
```

En la web: **Robot → Iniciar** y se ve al robot moverse en el mapa. Las alertas llegan solas al Panel,
con sonido y un aviso en pantalla.

## 7. Lo que no anda sin https

En la red local la dirección es `http://`. Por eso, **en los celulares**:
- no se puede **instalar** la web como app (PWA),
- no llegan las **notificaciones push**.

El resto funciona igual: alertas en tiempo real con sonido, robot, mapa, reportes y descargas. En la
**notebook** (`http://localhost:5000`) sí andan la instalación y las notificaciones, porque el navegador
confía en `localhost`. Para mostrarlas en el celular, usar la versión online (Render, `docs/DESPLIEGUE.md`).

## 8. Problemas comunes

| Pasa esto | Probá |
|---|---|
| El celular no abre `http://IP:5000` | ¿Misma WiFi? ¿La red está como privada y existe la regla del paso 3? ¿Es la IP de **hoy**? |
| Abre en la notebook pero no en ningún celular | La WiFi tiene aislamiento de clientes: usá el hotspot de un celular |
| Error 404 o página vacía en `http://IP:5000` | Falta `npm run build` (paso 1) |
| «No se pudo conectar con el servidor» | El backend se cerró o MySQL está apagado en XAMPP |
| El robot figura «Sin conexión» | `URL_BASE` del ESP32 con la IP vieja, o el ESP32 en otra WiFi |
| Las alertas de la IA no llegan | `DROID_URL` o `YOLO_API_KEY` mal en `servidor_ia/.env` (el motor muestra el error en la consola) |
| La IA dice «Desconocido» | El nombre de la carpeta de fotos no coincide con el del empleado: `python tools\cargar_trabajadores_ia.py` |

## Lista para el día de la demo

- [ ] WiFi propia encendida; notebook, celulares, ESP32 y PC de la IA conectados a ella
- [ ] IP de la notebook anotada: `____`
- [ ] XAMPP: MySQL en Start · `python app.py` andando
- [ ] `http://IP:5000/api/health` responde desde un celular
- [ ] ESP32 y `servidor_ia/.env` con la IP de hoy
- [ ] Simuladores listos por si falla el hardware
- [ ] Notebook enchufada y con la suspensión desactivada
