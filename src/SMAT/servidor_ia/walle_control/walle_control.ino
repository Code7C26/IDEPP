// ============================================================
//  DROID-E3D · WALL-E manejado con un joystick en el celular (ESP32-S3)
//
//  Que hace:
//  - Se conecta al WiFi (la IP aparece en el Monitor Serie).
//  - Entrando a http://<IP_DEL_ROBOT> desde el celular (en el mismo WiFi) aparece
//    un joystick: arrastrando el dedo el robot avanza, retrocede y gira.
//    Al soltar, frena. Si el celular se desconecta, tambien frena solo.
//  - Cuando la IA de la compu (motor_ia_robot.py) detecta que a alguien le falta
//    el casco u otro elemento, manda un aviso a http://<IP_DEL_ROBOT>/alerta_seguridad.
//    Entonces el robot FRENA (aunque lo esten manejando) y la pantalla muestra el
//    signo de PELIGRO. A los TIEMPO_ALERTA ms se puede volver a manejar.
//  - Si secretos.h tiene URL_BACKEND, habla con la web: con "detener", "pausar" o
//    "emergencia" el joystick queda bloqueado; con "iniciar" se puede manejar de nuevo.
//
//  Es la version "a control remoto" de robot_droid (que sigue una linea solo).
//
//  Placa: "ESP32S3 Dev Module" · Tools -> USB CDC On Boot -> Enabled
//  Librerias: ninguna para instalar.
//
//  Piezas que todavia no estan (el robot anda igual sin ellas):
//  - Placa de servos PCA9685: si no esta, sigue sin servos.
// ============================================================

#include <WiFi.h>
#include <esp_http_server.h>   // el mismo servidor que usa walle_camara: atiende varios pedidos a la vez
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <ESP_I2S.h>

// ---------- 1. CAMBIAR ESTO ----------
// El nombre y la clave del WiFi van en secretos.h (no se sube a GitHub).
// Para crearlo: copiar secretos.example.h como secretos.h y poner tus datos.
#include "secretos.h"

// Si secretos.h no tiene los datos de la web, el robot anda igual, sin la web.
#ifndef URL_BACKEND
  #define URL_BACKEND ""
  #define ROBOT_API_KEY ""
#endif
#ifndef ZONA_DEL_ROBOT
  #define ZONA_DEL_ROBOT 1
#endif

// ---------- 2. PINES (los mismos de las pruebas que funcionaron) ----------
// Motores con el driver TB6612FNG (walle_motores_prueba)
//   Motor A = rueda IZQUIERDA, motor B = rueda DERECHA.
//   Si una rueda gira al reves, cambiar los cables de ese motor (AO1 <-> AO2).
const int PWMA = 18;   // velocidad motor A
const int AIN1 = 39;   // sentido motor A
const int AIN2 = 40;
const int PWMB = 10;   // velocidad motor B
const int BIN1 = 42;   // sentido motor B
const int BIN2 = 47;
const int STBY = 41;   // en HIGH el driver funciona

// Pantalla ST7789 de 240x240, sin pin CS (walle_pantalla_prueba)
const int PANT_SCL = 12;
const int PANT_SDA = 11;
const int PANT_RES = 14;
const int PANT_DC  = 13;
const int PANT_BLK = 21;

// Placa de servos PCA9685
const int PIN_SDA = 8;
const int PIN_SCL = 9;

// ---------- 3. AJUSTES ----------
const int VELOCIDAD_MAX = 220;              // 0 a 255: lo mas rapido que va con el joystick al fondo
const unsigned long TIEMPO_ALERTA = 10000;  // ms que queda frenado con la alerta (10 s)
const unsigned long SIN_ORDEN_MS = 500;     // si el celular no manda nada en este tiempo, frena
const unsigned long REPORTE_MS = 1500;      // cada cuanto habla con la web

// ---------- Variables internas ----------
volatile bool enAlerta = false;
bool habilitado = true;   // false = la web lo freno (detener, pausar, emergencia)
volatile unsigned long inicioAlerta = 0;
volatile unsigned long ultimaOrden = 0;   // cuando llego el ultimo movimiento del joystick
bool moviendose = false;

// Lo que dejan anotado los pedidos que llegan por WiFi (corren aparte) para que el loop lo haga.
// Asi la pantalla y los motores los maneja una sola parte del programa y no se pisan.
volatile int joyX = 0, joyY = 0;            // ultima posicion del joystick
volatile bool hayOrdenNueva = false;        // llego una posicion nueva del joystick
volatile bool pedirAlerta = false;          // llego una alerta (de la IA o de /peligro)
volatile int pruebaIzq = 0, pruebaDer = 0;  // velocidades de /prueba
volatile bool pedirPrueba = false;
unsigned long ultimoChequeoWifi = 0;

// Lo que comparten el loop (mueve el robot) y tareaWeb (habla con la web).
const char* volatile estadoRobot = "recorriendo";   // lo que se le cuenta a la web
const char* volatile comandoPorAplicar = nullptr;   // orden que llego de la web y falta cumplir
const char* volatile comandoEjecutado = nullptr;    // orden cumplida que falta confirmarle a la web
volatile bool informarEstado = true;                // el estado cambio y la web todavia no lo sabe
volatile int ultimoCodigoWeb = 0;

// ============================================================
// MOTORES
// ============================================================
// vel: positivo = adelante, negativo = atras, 0 = frenado
void motor(int pinPwm, int pin1, int pin2, int vel) {
  digitalWrite(pin1, vel > 0 ? HIGH : LOW);
  digitalWrite(pin2, vel < 0 ? HIGH : LOW);
  ledcWrite(pinPwm, abs(vel));
}
void frenar() {
  motor(PWMA, AIN1, AIN2, 0);
  motor(PWMB, BIN1, BIN2, 0);
  moviendose = false;
}

// Convierte la posicion del joystick en la velocidad de cada rueda.
//   x: -100 (izquierda) a 100 (derecha)    y: -100 (atras) a 100 (adelante)
// Para girar, una rueda va mas rapido que la otra (como un tanque).
void manejar(int x, int y) {
  int izq = constrain(y + x, -100, 100);
  int der = constrain(y - x, -100, 100);
  motor(PWMA, AIN1, AIN2, izq * VELOCIDAD_MAX / 100);
  motor(PWMB, BIN1, BIN2, der * VELOCIDAD_MAX / 100);
  moviendose = (izq != 0 || der != 0);
}

// ============================================================
// SONIDO (amplificador MAX98357A + parlante, como walle_sonido_prueba)
// ============================================================
// Funciono el 2026-11-15 con Vin del amplificador en 3V3: el pin 5V de esta placa
// no da 5V mientras no se suelde el puente "IN-OUT".
const int PIN_BCLK = 15;
const int PIN_LRC  = 16;
const int PIN_DIN  = 17;
const int MUESTRAS_POR_SEGUNDO = 16000;
const int VOLUMEN = 14000;   // de 0 a 32767: subirlo si se escucha bajito

// La alarma: dos notas agudas que se turnan rapido ("pi-po-pi-po"), como una alarma de verdad.
// Se cambian aca para hacerla mas o menos molesta.
const int ALARMA_AGUDA = 1800;     // Hz (mas alto = mas agudo y molesto)
const int ALARMA_GRAVE = 1200;     // Hz
const int ALARMA_NOTA_MS = 120;    // cuanto dura cada nota (menos = mas rapido)

I2SClass i2s;
bool haySonido = false;
volatile bool alarmaSonando = false;   // la prende/apaga sonidoAlarma; la escucha tareaSonido

// Toca una nota: frecuencia en Hz y duracion en ms (frecuencia 0 = silencio).
// Onda "cuadrada": salta de golpe entre arriba y abajo. Suena mas aspera
// (y mas molesta) que la onda suave de walle_sonido_prueba.
void tocarNota(int frecuencia, int duracion) {
  long cantidad = (long)MUESTRAS_POR_SEGUNDO * duracion / 1000;
  int16_t bloque[256];
  int enBloque = 0;
  for (long i = 0; i < cantidad; i++) {
    int16_t muestra = 0;
    if (frecuencia > 0) {
      bool arriba = (i * frecuencia * 2 / MUESTRAS_POR_SEGUNDO) % 2 == 0;
      muestra = arriba ? VOLUMEN : -VOLUMEN;
    }
    bloque[enBloque++] = muestra;
    if (enBloque == 256 || i == cantidad - 1) {
      i2s.write((uint8_t *)bloque, enBloque * 2);
      enBloque = 0;
    }
  }
}

// Corre aparte (en el otro nucleo), asi mientras suena el robot sigue
// contestandole al celular. Suena mientras alarmaSonando este prendida.
void tareaSonido(void*) {
  bool sonaba = false;
  for (;;) {
    if (alarmaSonando) {
      tocarNota(ALARMA_AGUDA, ALARMA_NOTA_MS);
      tocarNota(ALARMA_GRAVE, ALARMA_NOTA_MS);
      sonaba = true;
    } else {
      if (sonaba) tocarNota(0, 50);   // un poquito de silencio, asi el parlante no queda zumbando
      sonaba = false;
      vTaskDelay(pdMS_TO_TICKS(20));
    }
  }
}

void iniciarSonido() {
  i2s.setPins(PIN_BCLK, PIN_LRC, PIN_DIN);
  haySonido = i2s.begin(I2S_MODE_STD, MUESTRAS_POR_SEGUNDO, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO);
  if (haySonido) xTaskCreatePinnedToCore(tareaSonido, "sonido", 4096, NULL, 1, NULL, 0);
  Serial.println(haySonido ? "Sonido listo" : "No pude iniciar el sonido: sigo sin parlante");
}

// Prende la alarma (suena hasta que termina la alerta, los mismos TIEMPO_ALERTA del signo) o la apaga
void sonidoAlarma(bool prender) {
  alarmaSonando = prender && haySonido;
}

// ============================================================
// PANTALLA (ST7789 de 240x240, sin libreria)
// ============================================================
const uint16_t NEGRO    = 0x0000;
const uint16_t AMARILLO = 0xFE40;   // el amarillo del signo de peligro
const uint16_t NARANJA  = 0xF540;   // el borde de afuera del signo
const uint16_t FONDO    = NEGRO;    // color de la pantalla cuando no hay alerta

void pantallaOrden(uint8_t orden) { digitalWrite(PANT_DC, LOW);  SPI.transfer(orden); }
void pantallaDato(uint8_t dato)   { digitalWrite(PANT_DC, HIGH); SPI.transfer(dato); }

void iniciarPantalla() {
  pinMode(PANT_RES, OUTPUT);
  pinMode(PANT_DC, OUTPUT);
  pinMode(PANT_BLK, OUTPUT);
  digitalWrite(PANT_BLK, HIGH);   // luz de fondo
  SPI.begin(PANT_SCL, -1, PANT_SDA, -1);
  SPI.beginTransaction(SPISettings(20000000, MSBFIRST, SPI_MODE3));   // sin pin CS: modo 3

  digitalWrite(PANT_RES, LOW);  delay(50);
  digitalWrite(PANT_RES, HIGH); delay(150);
  pantallaOrden(0x11); delay(150);           // despertar
  pantallaOrden(0x3A); pantallaDato(0x55);   // colores RGB565
  pantallaOrden(0x36); pantallaDato(0x00);   // orientacion normal
  pantallaOrden(0x21);                       // invertir colores (esta pantalla lo necesita)
  pantallaOrden(0x13);                       // modo normal
  pantallaOrden(0x29);                       // prender la imagen
  delay(50);
}

// Pinta un rectangulo: esquina de arriba a la izquierda (x, y), ancho y alto
void rectangulo(int x, int y, int ancho, int alto, uint16_t color) {
  if (ancho <= 0 || alto <= 0) return;
  int x2 = x + ancho - 1;
  int y2 = y + alto - 1;
  pantallaOrden(0x2A);   // columnas de x a x2
  pantallaDato(x >> 8);  pantallaDato(x & 0xFF);
  pantallaDato(x2 >> 8); pantallaDato(x2 & 0xFF);
  pantallaOrden(0x2B);   // filas de y a y2
  pantallaDato(y >> 8);  pantallaDato(y & 0xFF);
  pantallaDato(y2 >> 8); pantallaDato(y2 & 0xFF);
  pantallaOrden(0x2C);   // ahora van los colores
  digitalWrite(PANT_DC, HIGH);
  for (long i = 0; i < (long)ancho * alto; i++) SPI.transfer16(color);
}

void pintarTodo(uint16_t color) { rectangulo(0, 0, 240, 240, color); }

// Triangulo con la punta para arriba, dibujado fila por fila
void triangulo(int centroX, int arriba, int alto, int ancho, uint16_t color) {
  for (int fila = 0; fila < alto; fila++) {
    int mitad = (long)(ancho / 2) * fila / (alto - 1);
    rectangulo(centroX - mitad, arriba + fila, 2 * mitad + 1, 1, color);
  }
}

// Circulo relleno, tambien fila por fila
void circulo(int centroX, int centroY, int radio, uint16_t color) {
  for (int dy = -radio; dy <= radio; dy++) {
    int dx = sqrt(radio * radio - dy * dy);
    rectangulo(centroX - dx, centroY + dy, 2 * dx + 1, 1, color);
  }
}

// El signo de PELIGRO: triangulo amarillo con borde negro y un "!" negro
void dibujarPeligro() {
  pintarTodo(FONDO);
  triangulo(120, 18, 190, 220, NARANJA);    // borde de afuera
  triangulo(120, 28, 175, 202, NEGRO);      // borde negro
  triangulo(120, 43, 152, 176, AMARILLO);   // el amarillo de adentro
  rectangulo(111, 88, 19, 62, NEGRO);       // el palito del "!"
  circulo(120, 88, 9, NEGRO);
  circulo(120, 150, 9, NEGRO);
  circulo(120, 176, 11, NEGRO);             // el punto del "!"
}

// ============================================================
// SERVOS (placa PCA9685, sin libreria, como walle_servos_cero)
// ============================================================
const uint8_t DIRECCION_PCA = 0x40;

void escribirPCA(uint8_t registro, uint8_t valor) {
  Wire.beginTransmission(DIRECCION_PCA);
  Wire.write(registro);
  Wire.write(valor);
  Wire.endTransmission();
}

void moverServo(int canal, int angulo) {
  long pulso = map(angulo, 0, 180, 500, 2500);   // microsegundos
  int pasos = pulso * 4096 / 20000;
  Wire.beginTransmission(DIRECCION_PCA);
  Wire.write(0x06 + 4 * canal);
  Wire.write(0); Wire.write(0);
  Wire.write(pasos & 0xFF); Wire.write(pasos >> 8);
  Wire.endTransmission();
}

// Al arrancar deja todos los servos derechos (90 grados). Si no esta la placa, sigue igual.
void iniciarServos() {
  Wire.beginTransmission(DIRECCION_PCA);
  if (Wire.endTransmission() != 0) {
    Serial.println("No encuentro la placa de servos (PCA9685): sigo sin servos");
    return;
  }
  escribirPCA(0x00, 0x10);   // dormir para cambiar la frecuencia
  escribirPCA(0xFE, 121);    // 50 Hz, la frecuencia de los servos
  escribirPCA(0x00, 0x20);   // despertar
  delay(5);
  escribirPCA(0x00, 0xA0);
  for (int canal = 0; canal < 16; canal++) moverServo(canal, 90);
  Serial.println("Servos centrados en 90 grados");
}

// ============================================================
// ESTADO DEL ROBOT (para la web)
// ============================================================
void cambiarEstado(const char* estado, bool puedeManejar) {
  estadoRobot = estado;
  habilitado = puedeManejar;
  informarEstado = true;
  if (!puedeManejar) frenar();
  Serial.println("Estado: " + String(estado));
}

void aplicarComando(const char* comando) {
  bool enEmergencia = strcmp(estadoRobot, "emergencia") == 0;
  if (strcmp(comando, "iniciar") == 0) {
    if (!enEmergencia) cambiarEstado("recorriendo", true);
  }
  else if (strcmp(comando, "pausar") == 0)     cambiarEstado("pausado", false);
  else if (strcmp(comando, "detener") == 0)    cambiarEstado("detenido", false);
  else if (strcmp(comando, "emergencia") == 0) cambiarEstado("emergencia", false);
}

// ============================================================
// LA PAGINA DEL JOYSTICK (la que se abre en el celular)
// ============================================================
// Cada 100 ms, mientras el dedo esta apoyado, el celular le manda al robot
// /mover?x=..&y=.. con la posicion. Al soltar manda x=0, y=0.
const char PAGINA_JOYSTICK[] PROGMEM = R"rawliteral(<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>WALL-E</title>
<style>
  body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;
       justify-content:center;gap:28px;background:#1b1f24;color:#f2f2f2;
       font-family:system-ui,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none}
  h1{margin:0;font-size:1.6rem;letter-spacing:.05em}
  #estado{font-size:1.1rem;padding:8px 16px;border-radius:20px;background:#2d343c}
  #estado.alerta{background:#f5a623;color:#111;font-weight:bold}
  #base{width:260px;height:260px;border-radius:50%;background:#2d343c;position:relative;
        box-shadow:inset 0 0 0 4px #3c4550}
  #palanca{width:100px;height:100px;border-radius:50%;background:#f5c518;position:absolute;
           left:80px;top:80px;box-shadow:0 4px 12px #0008}
  p{margin:0;color:#9aa4ae;font-size:.9rem;text-align:center;padding:0 16px}
</style></head><body>
<h1>WALL-E</h1>
<div id="estado">Conectando...</div>
<div id="base"><div id="palanca"></div></div>
<p>Arrastra el circulo amarillo para manejar. Al soltarlo, el robot frena.</p>
<script>
const base = document.getElementById('base'), palanca = document.getElementById('palanca');
const cartel = document.getElementById('estado');
const RADIO = 80;           // cuanto se puede alejar la palanca del centro (px)
let x = 0, y = 0, apretado = false, enviando = false;

function mover(e) {
  const r = base.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy);
  if (d > RADIO) { dx = dx * RADIO / d; dy = dy * RADIO / d; }
  palanca.style.left = (80 + dx) + 'px'; palanca.style.top = (80 + dy) + 'px';
  x = Math.round(dx / RADIO * 100); y = Math.round(-dy / RADIO * 100);
  if (Math.abs(x) < 12) x = 0;   // zona muerta: un poquito movido = quieto
  if (Math.abs(y) < 12) y = 0;
}
function soltar() {
  apretado = false; x = 0; y = 0;
  palanca.style.left = '80px'; palanca.style.top = '80px';
  enviar();
}
base.addEventListener('pointerdown', e => { apretado = true; base.setPointerCapture(e.pointerId); mover(e); });
base.addEventListener('pointermove', e => { if (apretado) mover(e); });
base.addEventListener('pointerup', soltar);
base.addEventListener('pointercancel', soltar);

async function enviar() {
  if (enviando) return;   // espera a que conteste el anterior
  enviando = true;
  try {
    const resp = await fetch('/mover?x=' + x + '&y=' + y, {cache: 'no-store'});
    const texto = await resp.text();
    cartel.textContent = texto;
    cartel.className = resp.ok ? '' : 'alerta';
  } catch (err) {
    cartel.textContent = 'Sin conexion con el robot';
    cartel.className = 'alerta';
  }
  enviando = false;
}
// Mientras el dedo esta apoyado manda la posicion; sin dedo, pregunta el estado cada tanto
setInterval(() => { if (apretado) enviar(); }, 100);
setInterval(() => { if (!apretado) enviar(); }, 1000);
</script></body></html>)rawliteral";

// ============================================================
// LOS PEDIDOS QUE LLEGAN POR WIFI (celular, IA, pruebas)
// ============================================================
// Cada pedido se atiende aparte y enseguida: si el celular deja una conexion abierta
// sin mandar nada, la alerta de la IA igual pasa (con el servidor anterior quedaba
// esperando hasta 5 segundos y la IA se cansaba de esperar).

// Lee un dato del pedido: primero de la direccion (?x=10&y=20) y si no esta,
// del cuerpo (la IA manda "nombre=..." por POST). Devuelve "" si no esta.
String leerDato(httpd_req_t* pedido, const char* clave) {
  char texto[128] = "";
  char valor[64] = "";
  if (httpd_req_get_url_query_str(pedido, texto, sizeof(texto)) == ESP_OK &&
      httpd_query_key_value(texto, clave, valor, sizeof(valor)) == ESP_OK) {
    return String(valor);
  }
  if (pedido->method == HTTP_POST && pedido->content_len > 0 && pedido->content_len < sizeof(texto)) {
    int leidos = httpd_req_recv(pedido, texto, pedido->content_len);
    if (leidos > 0) {
      texto[leidos] = 0;
      if (httpd_query_key_value(texto, clave, valor, sizeof(valor)) == ESP_OK) {
        String resultado(valor);
        resultado.replace("+", " ");
        return resultado;
      }
    }
  }
  return "";
}

esp_err_t contestar(httpd_req_t* pedido, const char* estado, const String& texto) {
  httpd_resp_set_status(pedido, estado);
  httpd_resp_set_type(pedido, "text/plain");
  httpd_resp_set_hdr(pedido, "Cache-Control", "no-store");
  return httpd_resp_send(pedido, texto.c_str(), texto.length());
}

esp_err_t paginaJoystick(httpd_req_t* pedido) {
  httpd_resp_set_type(pedido, "text/html");
  return httpd_resp_send(pedido, PAGINA_JOYSTICK, HTTPD_RESP_USE_STRLEN);
}

// /mover?x=..&y=..  (de -100 a 100). Contesta un texto para el cartel del celular.
esp_err_t recibirMovimiento(httpd_req_t* pedido) {
  int x = constrain(leerDato(pedido, "x").toInt(), -100, 100);
  int y = constrain(leerDato(pedido, "y").toInt(), -100, 100);

  if (enAlerta || pedirAlerta) {
    unsigned long pasaron = millis() - inicioAlerta;
    unsigned long faltan = pasaron < TIEMPO_ALERTA ? (TIEMPO_ALERTA - pasaron) / 1000 + 1 : TIEMPO_ALERTA / 1000;
    return contestar(pedido, "423 Locked", "PELIGRO: frenado " + String(faltan) + " s");
  }
  if (!habilitado) {
    return contestar(pedido, "423 Locked", "Bloqueado desde la web (" + String(estadoRobot) + ")");
  }

  joyX = x;
  joyY = y;
  ultimaOrden = millis();
  hayOrdenNueva = true;   // el loop mueve las ruedas
  return contestar(pedido, "200 OK", (x != 0 || y != 0) ? "Manejando" : "Listo para manejar");
}

// La IA de la compu avisa aca: http://<IP>/alerta_seguridad (POST con nombre=...)
esp_err_t recibirAlerta(httpd_req_t* pedido) {
  String nombre = leerDato(pedido, "nombre");
  Serial.println("ALERTA: " + (nombre.length() ? nombre : String("Desconocido")));
  pedirAlerta = true;   // el loop frena, dibuja el signo y prende la alarma
  return contestar(pedido, "200 OK", "OK");
}

// Para probar la pantalla y la alarma sin la IA: http://<IP>/peligro
esp_err_t probarPeligro(httpd_req_t* pedido) {
  pedirAlerta = true;
  return contestar(pedido, "200 OK", "Mostrando el signo de peligro 10 segundos");
}

// Prueba de motores sin el joystick: http://<IP>/prueba?motor=izq&sentido=adelante
//   motor = izq | der | ambos      sentido = adelante | atras
esp_err_t probarMotor(httpd_req_t* pedido) {
  String cual = leerDato(pedido, "motor");
  String sentido = leerDato(pedido, "sentido");
  int vel = (sentido == "atras") ? -VELOCIDAD_MAX : VELOCIDAD_MAX;
  if (cual != "izq" && cual != "der" && cual != "ambos") {
    return contestar(pedido, "400 Bad Request", "Usar ?motor=izq|der|ambos&sentido=adelante|atras");
  }
  pruebaIzq = (cual == "izq" || cual == "ambos") ? vel : 0;
  pruebaDer = (cual == "der" || cual == "ambos") ? vel : 0;
  pedirPrueba = true;   // el loop gira el motor 1 segundo
  return contestar(pedido, "200 OK", "Girando 1 segundo: " + cual + " " + sentido);
}

void agregarDireccion(httpd_handle_t servidor, const char* direccion, httpd_method_t metodo,
                      esp_err_t (*funcion)(httpd_req_t*)) {
  httpd_uri_t ruta = {};
  ruta.uri = direccion;
  ruta.method = metodo;
  ruta.handler = funcion;
  httpd_register_uri_handler(servidor, &ruta);
}

void iniciarServidor() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.lru_purge_enable = true;   // si se llena de conexiones viejas del celular, cierra la mas vieja
  httpd_handle_t servidor = NULL;
  if (httpd_start(&servidor, &config) != ESP_OK) {
    Serial.println("ERROR: no pude iniciar el servidor web.");
    return;
  }
  agregarDireccion(servidor, "/", HTTP_GET, paginaJoystick);
  agregarDireccion(servidor, "/mover", HTTP_GET, recibirMovimiento);
  agregarDireccion(servidor, "/alerta_seguridad", HTTP_POST, recibirAlerta);
  agregarDireccion(servidor, "/alerta_seguridad", HTTP_GET, recibirAlerta);
  agregarDireccion(servidor, "/peligro", HTTP_GET, probarPeligro);
  agregarDireccion(servidor, "/prueba", HTTP_GET, probarMotor);
}

// ============================================================
// CONEXION CON LA WEB (contrato: src/SMAT/docs/API.md)
// ============================================================
// Devuelve el texto fijo de una orden conocida si aparece en la respuesta (nullptr si no hay).
const char* buscarOrden(const String& respuesta) {
  int pos = respuesta.indexOf("\"comando\"");
  if (pos < 0) return nullptr;
  int dosPuntos = respuesta.indexOf(':', pos);
  String resto = respuesta.substring(dosPuntos + 1);
  resto.trim();
  for (const char* orden : {"iniciar", "pausar", "detener", "emergencia"}) {
    if (resto.startsWith("\"" + String(orden) + "\"")) return orden;
  }
  return nullptr;
}

// Corre en el otro nucleo del ESP32, asi esperar a la web no traba el joystick.
void tareaWeb(void*) {
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(REPORTE_MS));
    if (WiFi.status() != WL_CONNECTED) continue;

    const char* estadoEnviado = estadoRobot;
    bool mandaEstado = informarEstado;   // el estado se manda solo cuando cambia
    const char* ejecutado = comandoEjecutado;
    String cuerpo = "{\"zona_actual_id\": " + String(ZONA_DEL_ROBOT);
    if (mandaEstado) cuerpo += ", \"estado\": \"" + String(estadoEnviado) + "\"";
    if (ejecutado != nullptr) cuerpo += ", \"comando_ejecutado\": \"" + String(ejecutado) + "\"";
    cuerpo += "}";

    HTTPClient http;
    http.setConnectTimeout(3000);
    http.setTimeout(3000);
    http.begin(String(URL_BACKEND) + "/robot/reporte");
    http.addHeader("X-API-KEY", ROBOT_API_KEY);
    http.addHeader("Content-Type", "application/json");
    int codigo = http.POST(cuerpo);
    ultimoCodigoWeb = codigo;

    if (codigo == 200) {
      if (mandaEstado && estadoEnviado == estadoRobot) informarEstado = false;
      if (ejecutado != nullptr && comandoEjecutado == ejecutado) comandoEjecutado = nullptr;
      const char* orden = buscarOrden(http.getString());
      if (orden != nullptr) comandoPorAplicar = orden;   // la cumple el loop
    } else {
      Serial.println("La web respondio " + String(codigo));
    }
    http.end();
  }
}

// ============================================================
void setup() {
  Serial.begin(115200);
  // Si la compu no esta leyendo los mensajes (Monitor Serie cerrado), no esperar:
  // sin esto, con el tiempo cada mensaje trababa la placa hasta 4 segundos
  // (y la alerta de la IA no llegaba a tiempo)
  Serial.setTxTimeoutMs(0);
  delay(1000);
  Serial.println("\n=== WALL-E a control remoto arrancando ===");

  // Motores: primero frenados y recien ahi se prende el driver
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  pinMode(STBY, OUTPUT);
  ledcAttach(PWMA, 1000, 8);   // 1000 veces por segundo, velocidad de 0 a 255
  ledcAttach(PWMB, 1000, 8);
  frenar();
  digitalWrite(STBY, HIGH);

  iniciarPantalla();
  pintarTodo(FONDO);

  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);
  iniciarServos();
  iniciarSonido();

  Serial.print("Conectando al WiFi " + String(WIFI_NOMBRE));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_NOMBRE, WIFI_CLAVE);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    intentos++;
    Serial.print(".");
    if (intentos % 20 == 0) {   // cada 10 segundos dice por que no conecta y reintenta
      int estado = WiFi.status();
      String motivo = "error " + String(estado);
      if (estado == WL_NO_SSID_AVAIL) motivo = "no veo la red (nombre mal o red de 5 GHz)";
      if (estado == WL_CONNECT_FAILED) motivo = "clave incorrecta";
      Serial.println("\nNo conecta: " + motivo);
      WiFi.disconnect();
      WiFi.begin(WIFI_NOMBRE, WIFI_CLAVE);
    }
  }
  WiFi.setSleep(false);   // asi el joystick responde sin demora
  String ip = WiFi.localIP().toString();
  Serial.println("\nConectado! Joystick en el celular: http://" + ip);
  Serial.println("Esta IP va en servidor_ia/.env: URL_ESP32_ALERTA=http://" + ip + "/alerta_seguridad");

  iniciarServidor();

  if (strlen(URL_BACKEND) > 0) {
    xTaskCreatePinnedToCore(tareaWeb, "web", 10000, NULL, 1, NULL, 0);
  }
  cambiarEstado("recorriendo", true);
}

void loop() {
  unsigned long ahora = millis();

  // Alerta nueva (de la IA o de /peligro): frena, signo de peligro y alarma.
  // Si llega otra durante la alerta, vuelve a contar los TIEMPO_ALERTA desde ahora.
  if (pedirAlerta) {
    inicioAlerta = ahora;
    pedirAlerta = false;
    hayOrdenNueva = false;
    frenar();
    if (!enAlerta) dibujarPeligro();
    enAlerta = true;
    sonidoAlarma(true);
  }

  // Prueba de un motor desde /prueba
  if (pedirPrueba) {
    pedirPrueba = false;
    if (!enAlerta) {
      motor(PWMA, AIN1, AIN2, pruebaIzq);
      motor(PWMB, BIN1, BIN2, pruebaDer);
      delay(1000);
      frenar();
    }
  }

  // Posicion nueva del joystick
  if (hayOrdenNueva) {
    hayOrdenNueva = false;
    if (!enAlerta && habilitado) {
      manejar(joyX, joyY);
      ultimaOrden = ahora;
    }
  }

  // Si se corto el WiFi, cada 5 segundos intenta reconectar
  if (WiFi.status() != WL_CONNECTED && ahora - ultimoChequeoWifi > 5000) {
    ultimoChequeoWifi = ahora;
    WiFi.reconnect();
  }

  // Orden que llego de la web
  const char* orden = comandoPorAplicar;
  if (orden != nullptr) {
    comandoPorAplicar = nullptr;
    aplicarComando(orden);
    comandoEjecutado = orden;
  }

  // Seguridad: si el celular dejo de mandar ordenes (se corto, se cerro la pagina), frena
  if (moviendose && ahora - ultimaOrden > SIN_ORDEN_MS) {
    frenar();
    Serial.println("Sin ordenes del celular: freno");
  }

  // Fin de la alerta: se borra el signo y se puede volver a manejar
  if (enAlerta && ahora - inicioAlerta >= TIEMPO_ALERTA) {
    enAlerta = false;
    sonidoAlarma(false);
    pintarTodo(FONDO);
    Serial.println("Fin de la alerta");
  }
}
