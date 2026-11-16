// ============================================================
//  DROID-E3D · Programa del robot (ESP32-S3)
//
//  Un solo programa con DOS MODOS (se elige desde el celular, en http://droid-robot.local):
//  - RECORRER LA RUTA (el de la venta): sigue una línea negra en el piso con 2 seguidores
//    de línea, cuenta las marcas de cada zona y frena si tiene algo adelante (sensor de
//    distancia). Si secretos.h tiene URL_BACKEND, recibe las órdenes de la web (iniciar,
//    pausar, detener, emergencia) y le cuenta su estado y su zona.
//  - CONTROL REMOTO (el de la presentación): un joystick en la página del celular.
//    Al soltarlo frena; si el celular se desconecta, también frena solo.
//
//  En los dos modos:
//  - Cuando la IA de la compu (motor_ia_robot.py) detecta que a alguien le falta el casco
//    u otro elemento, avisa a /alerta_seguridad: el robot FRENA, la pantalla muestra el
//    signo de PELIGRO y suena la alarma durante TIEMPO_ALERTA. Después sigue: en la ruta,
//    vuelve a andar solo; a control remoto, espera el joystick.
//  - El WiFi se elige desde el celular (config_wifi.h): si no tiene uno guardado, crea la
//    red "DROID-E3D-Robot" (clave droid-e3d) y pinta la pantalla de azul.
//  - Se lo encuentra por un nombre fijo: http://droid-robot.local
//
//  Direcciones (http://droid-robot.local/...):
//    /             página con el joystick y los botones de modo
//    /modo?m=ruta  o  /modo?m=remoto      cambiar de modo
//    /arrancar  /parar                    poner en marcha o frenar (sin la web)
//    /sensores                            números de los sensores (para calibrar)
//    /peligro                             probar la pantalla y la alarma
//    /prueba?motor=izq|der|ambos&sentido=adelante|atras    probar un motor 1 segundo
//    /olvidar-wifi                        borrar el WiFi guardado
//
//  Placa: "ESP32S3 Dev Module" · Tools -> USB CDC On Boot -> Enabled
//  Librerías: VL53L0X (Pololu). Nada más: pantalla, servos, sonido y web con código propio.
//
//  Piezas que todavía faltan (el robot anda igual sin ellas):
//  - Sensor de distancia que mida bien: el VL53L0X actual no mide.
//  - Placa de servos PCA9685 sin energía de 5V: los servos no se mueven.
// ============================================================

#include <WiFi.h>
#include <esp_http_server.h>   // atiende varios pedidos a la vez (como walle_camara)
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <ESP_I2S.h>
#include <VL53L0X.h>

// ---------- 1. CAMBIAR ESTO ----------
// secretos.h (no se sube a GitHub) tiene los datos de la web. El WiFi ya no va ahí:
// se elige desde el celular. Para crearlo: copiar secretos.example.h como secretos.h.
#include "secretos.h"
#include "config_wifi.h"

// Si secretos.h no tiene los datos de la web, el robot anda igual, sin la web.
#ifndef URL_BACKEND
  #define URL_BACKEND ""
  #define ROBOT_API_KEY ""
#endif
#ifndef ZONA_DEL_ROBOT
  #define ZONA_DEL_ROBOT 1
#endif

// ---------- 2. PINES (los mismos de las pruebas que funcionaron) ----------
// Motores con el driver TB6612FNG. Motor A = rueda IZQUIERDA, motor B = rueda DERECHA.
// Si una rueda gira al revés, cambiar los cables de ese motor (AO1 <-> AO2).
const int PWMA = 18;   // velocidad motor A
const int AIN1 = 39;   // sentido motor A
const int AIN2 = 40;
const int PWMB = 10;   // velocidad motor B
const int BIN1 = 42;   // sentido motor B
const int BIN2 = 47;
const int STBY = 41;   // en HIGH el driver funciona

// Seguidores de línea: V+ -> 3V3 (NO a 5V), G -> GND. Sobre NEGRO dan 0 y sobre BLANCO unos 3800.
const int SENSOR_IZQ = 4;
const int SENSOR_DER = 5;

// Pantalla ST7789 de 240x240, sin pin CS
const int PANT_SCL = 12;
const int PANT_SDA = 11;
const int PANT_RES = 14;
const int PANT_DC  = 13;
const int PANT_BLK = 21;

// Cables I2C: los comparten la placa de servos PCA9685 y el sensor de distancia
const int PIN_SDA = 8;
const int PIN_SCL = 9;

// Amplificador MAX98357A (Vin en 3V3: el pin 5V de esta placa no da 5V sin soldar IN-OUT)
const int PIN_BCLK = 15;
const int PIN_LRC  = 16;
const int PIN_DIN  = 17;

// ---------- 3. AJUSTES ----------
const int VELOCIDAD_RUTA = 200;             // 0 a 255: velocidad al recorrer la ruta
const int VELOCIDAD_GIRO = 170;             // velocidad al corregir para volver a la línea
const int VELOCIDAD_MAX = 220;              // 0 a 255: lo más rápido con el joystick al fondo
const int UMBRAL_NEGRO = 2000;              // 0 a 4095. MENOS que esto = el sensor ve NEGRO (ver /sensores)
const int DISTANCIA_MINIMA = 200;           // mm. Si hay algo más cerca, frena (200 mm = 20 cm)
const unsigned long TIEMPO_ALERTA = 10000;  // ms que queda frenado con la alerta (10 s)
const unsigned long SIN_ORDEN_MS = 500;     // a control remoto: si el celular no manda nada, frena
const unsigned long REPORTE_MS = 1500;      // cada cuánto habla con la web
const unsigned long MARCA_MS = 60;          // ms que los 2 sensores tienen que ver negro para contar una marca
const int MAX_PARADAS = 50;                 // el mismo límite que tiene la ruta en la web

// La alarma: dos notas agudas que se turnan rápido ("pi-po-pi-po")
const int ALARMA_AGUDA = 1800;     // Hz
const int ALARMA_GRAVE = 1200;     // Hz
const int ALARMA_NOTA_MS = 120;    // cuánto dura cada nota
const int MUESTRAS_POR_SEGUNDO = 16000;
const int VOLUMEN = 14000;         // de 0 a 32767

// ---------- Variables internas ----------
enum Modo { RUTA, REMOTO };
volatile Modo modo = REMOTO;   // arranca a control remoto: no se mueve solo al prenderlo
bool enMarcha = true;          // false = frenado (desde la web o /parar)

volatile bool enAlerta = false;
volatile unsigned long inicioAlerta = 0;
volatile unsigned long ultimaOrden = 0;   // cuándo llegó el último movimiento del joystick
bool moviendose = false;
unsigned long ultimoChequeoWifi = 0;

VL53L0X sensorDistancia;
bool hayDistancia = false;
bool hayObstaculo = false;
volatile int distanciaMm = 0;

// Lo que dejan anotado los pedidos que llegan por WiFi (corren aparte) para que el loop lo haga.
// Así la pantalla y los motores los maneja una sola parte del programa y no se pisan.
volatile int joyX = 0, joyY = 0;
volatile bool hayOrdenNueva = false;
volatile bool pedirAlerta = false;
volatile int pruebaIzq = 0, pruebaDer = 0;
volatile bool pedirPrueba = false;
volatile int pedirModo = -1;              // -1 = nada; si no, el modo pedido
volatile int pedirMarcha = -1;            // -1 = nada; 1 = arrancar; 0 = parar

// Lo que comparten el loop (mueve el robot) y tareaWeb (habla con la web).
const char* volatile estadoRobot = "detenido";      // lo que se le cuenta a la web
const char* volatile comandoPorAplicar = nullptr;   // orden que llegó de la web y falta cumplir
const char* volatile comandoEjecutado = nullptr;    // orden cumplida que falta confirmarle a la web
volatile bool informarEstado = true;
volatile int ultimoCodigoWeb = 0;
int ruta[MAX_PARADAS];                              // zona_id de cada parada, en orden
volatile int paradas = 0;                           // cuántas paradas tiene la ruta (0 = no la leyó)
volatile int paradaActual = 0;
volatile bool pedirRuta = true;

// Para contar cada marca del piso una sola vez
bool sobreMarca = false;
bool marcaContada = false;
unsigned long inicioMarca = 0;
unsigned long ultimoNegro = 0;
volatile unsigned long marcasContadas = 0;

// ============================================================
// MOTORES
// ============================================================
// vel: positivo = adelante, negativo = atrás, 0 = frenado
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
void adelante() { motor(PWMA, AIN1, AIN2, VELOCIDAD_RUTA);  motor(PWMB, BIN1, BIN2, VELOCIDAD_RUTA); }
void girarIzq() { motor(PWMA, AIN1, AIN2, -VELOCIDAD_GIRO); motor(PWMB, BIN1, BIN2, VELOCIDAD_GIRO); }
void girarDer() { motor(PWMA, AIN1, AIN2, VELOCIDAD_GIRO);  motor(PWMB, BIN1, BIN2, -VELOCIDAD_GIRO); }

// Joystick: x de -100 (izquierda) a 100 (derecha), y de -100 (atrás) a 100 (adelante).
// Para girar, una rueda va más rápido que la otra (como un tanque).
void manejar(int x, int y) {
  int izq = constrain(y + x, -100, 100);
  int der = constrain(y - x, -100, 100);
  motor(PWMA, AIN1, AIN2, izq * VELOCIDAD_MAX / 100);
  motor(PWMB, BIN1, BIN2, der * VELOCIDAD_MAX / 100);
  moviendose = (izq != 0 || der != 0);
}

// ============================================================
// SONIDO (amplificador MAX98357A + parlante)
// ============================================================
I2SClass i2s;
bool haySonido = false;
volatile bool alarmaSonando = false;

// Toca una nota (frecuencia 0 = silencio). Onda "cuadrada": más áspera y molesta que una suave.
void tocarNota(int frecuencia, int duracion) {
  long cantidad = (long)MUESTRAS_POR_SEGUNDO * duracion / 1000;
  int16_t bloque[256];
  int enBloque = 0;
  for (long i = 0; i < cantidad; i++) {
    int16_t muestra = 0;
    if (frecuencia > 0) muestra = ((i * frecuencia * 2 / MUESTRAS_POR_SEGUNDO) % 2 == 0) ? VOLUMEN : -VOLUMEN;
    bloque[enBloque++] = muestra;
    if (enBloque == 256 || i == cantidad - 1) {
      i2s.write((uint8_t *)bloque, enBloque * 2);
      enBloque = 0;
    }
  }
}

// Corre aparte (en el otro núcleo): mientras suena, el robot sigue atendiendo al celular
void tareaSonido(void*) {
  bool sonaba = false;
  for (;;) {
    if (alarmaSonando) {
      tocarNota(ALARMA_AGUDA, ALARMA_NOTA_MS);
      tocarNota(ALARMA_GRAVE, ALARMA_NOTA_MS);
      sonaba = true;
    } else {
      if (sonaba) tocarNota(0, 50);   // un poquito de silencio, así no queda zumbando
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

void sonidoAlarma(bool prender) { alarmaSonando = prender && haySonido; }

// ============================================================
// PANTALLA (ST7789 de 240x240, sin librería)
// ============================================================
const uint16_t NEGRO    = 0x0000;
const uint16_t AMARILLO = 0xFE40;   // el amarillo del signo de peligro
const uint16_t NARANJA  = 0xF540;   // el borde de afuera del signo
const uint16_t AZUL     = 0x033F;   // mientras espera que le configuren el WiFi
const uint16_t FONDO    = NEGRO;

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
  pantallaOrden(0x36); pantallaDato(0x00);   // orientación normal
  pantallaOrden(0x21);                       // invertir colores (esta pantalla lo necesita)
  pantallaOrden(0x13);                       // modo normal
  pantallaOrden(0x29);                       // prender la imagen
  delay(50);
}

// Pinta un rectángulo: esquina de arriba a la izquierda (x, y), ancho y alto
void rectangulo(int x, int y, int ancho, int alto, uint16_t color) {
  if (ancho <= 0 || alto <= 0) return;
  int x2 = x + ancho - 1;
  int y2 = y + alto - 1;
  pantallaOrden(0x2A);
  pantallaDato(x >> 8);  pantallaDato(x & 0xFF);
  pantallaDato(x2 >> 8); pantallaDato(x2 & 0xFF);
  pantallaOrden(0x2B);
  pantallaDato(y >> 8);  pantallaDato(y & 0xFF);
  pantallaDato(y2 >> 8); pantallaDato(y2 & 0xFF);
  pantallaOrden(0x2C);
  digitalWrite(PANT_DC, HIGH);
  for (long i = 0; i < (long)ancho * alto; i++) SPI.transfer16(color);
}

void pintarTodo(uint16_t color) { rectangulo(0, 0, 240, 240, color); }

void triangulo(int centroX, int arriba, int alto, int ancho, uint16_t color) {
  for (int fila = 0; fila < alto; fila++) {
    int mitad = (long)(ancho / 2) * fila / (alto - 1);
    rectangulo(centroX - mitad, arriba + fila, 2 * mitad + 1, 1, color);
  }
}

void circulo(int centroX, int centroY, int radio, uint16_t color) {
  for (int dy = -radio; dy <= radio; dy++) {
    int dx = sqrt(radio * radio - dy * dy);
    rectangulo(centroX - dx, centroY + dy, 2 * dx + 1, 1, color);
  }
}

// El signo de PELIGRO: triángulo amarillo con borde negro y un "!" negro
void dibujarPeligro() {
  pintarTodo(FONDO);
  triangulo(120, 18, 190, 220, NARANJA);
  triangulo(120, 28, 175, 202, NEGRO);
  triangulo(120, 43, 152, 176, AMARILLO);
  rectangulo(111, 88, 19, 62, NEGRO);
  circulo(120, 88, 9, NEGRO);
  circulo(120, 150, 9, NEGRO);
  circulo(120, 176, 11, NEGRO);
}

// Mientras espera que le elijan el WiFi desde el celular, la pantalla queda azul
void avisoConfigurarWifi(bool esperando) { pintarTodo(esperando ? AZUL : FONDO); }

// ============================================================
// SERVOS (placa PCA9685, sin librería)
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
// ESTADO, MODO Y ZONA
// ============================================================
void cambiarEstado(const char* estado, bool marcha) {
  estadoRobot = estado;
  enMarcha = marcha;
  informarEstado = true;
  if (!marcha) frenar();
  Serial.println("Estado: " + String(estado));
}

bool enEmergencia() { return strcmp(estadoRobot, "emergencia") == 0; }

void cambiarModo(Modo nuevo) {
  if (modo == nuevo) return;
  frenar();
  modo = nuevo;
  Serial.println(nuevo == RUTA ? "Modo: recorrer la ruta" : "Modo: control remoto");
}

int zonaActual() {
  int cantidad = paradas;
  return cantidad > 0 ? ruta[paradaActual % cantidad] : ZONA_DEL_ROBOT;
}

// Los sensores van uno a cada lado de la línea: los 2 en negro a la vez solo pasa sobre una
// cinta que la cruza (la marca de una zona). Tiene que durar MARCA_MS y no cuenta doble.
void revisarMarca(bool losDosEnNegro, unsigned long ahora) {
  if (losDosEnNegro) {
    if (!sobreMarca) inicioMarca = ahora;
    sobreMarca = true;
    ultimoNegro = ahora;
    if (!marcaContada && ahora - inicioMarca >= MARCA_MS) {
      marcaContada = true;
      marcasContadas++;
      if (paradas > 0) paradaActual = (paradaActual + 1) % paradas;
      Serial.println("Marca " + String(marcasContadas) + ": zona " + String(zonaActual()));
    }
  } else if (sobreMarca && ahora - ultimoNegro >= MARCA_MS) {
    sobreMarca = false;
    marcaContada = false;
  }
}

// Órdenes de la web. "iniciar" = recorrer la ruta.
void aplicarComando(const char* comando) {
  if (strcmp(comando, "iniciar") == 0) {
    if (!enEmergencia()) {
      if (strcmp(estadoRobot, "pausado") != 0) {   // si no estaba pausado, empieza la ruta de nuevo
        paradaActual = 0;
        pedirRuta = true;
      }
      cambiarModo(RUTA);
      cambiarEstado("recorriendo", true);
    }
  }
  else if (strcmp(comando, "pausar") == 0)     cambiarEstado("pausado", false);
  else if (strcmp(comando, "detener") == 0)    cambiarEstado("detenido", false);
  else if (strcmp(comando, "emergencia") == 0) cambiarEstado("emergencia", false);
}

// ============================================================
// LA PÁGINA DEL CELULAR: botones de modo y joystick
// ============================================================
// Cada 100 ms, mientras el dedo está apoyado, el celular manda /mover?x=..&y=..
// Al soltar manda x=0, y=0. Sin dedo, pregunta el estado una vez por segundo.
const char PAGINA_JOYSTICK[] PROGMEM = R"rawliteral(<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>DROID-E3D</title>
<style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;
       justify-content:center;gap:22px;background:#2b2b2b;color:#f4f1eb;
       font-family:system-ui,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;
       border-top:6px solid #f7931e}
  h1{margin:0;font-size:1.8rem;font-style:italic;font-weight:900;letter-spacing:-.02em}
  h1 span{color:#f7931e}
  h1 i{display:inline-block;width:26px;height:12px;margin-left:8px;
       background:repeating-linear-gradient(115deg,transparent 0 3px,#f7931e 3px 7px,transparent 7px 9.5px)}
  #modos{display:flex;gap:10px}
  #modos button{padding:12px 16px;font-size:1rem;border-radius:10px;border:2px solid #4a4744;
                background:#383533;color:#f4f1eb}
  #modos button.activo{background:#f7931e;color:#2b2b2b;border-color:#f7931e;font-weight:bold;
                       box-shadow:3px 3px 0 #f4f1eb}
  #estado{font-size:1.05rem;padding:8px 16px;border-radius:20px;background:#383533;text-align:center}
  #estado.alerta{background:#dc2626;color:#fff;font-weight:bold}
  #base{width:260px;height:260px;border-radius:50%;background:#383533;position:relative;
        box-shadow:inset 0 0 0 4px #4a4744}
  #base.apagado{opacity:.35}
  #palanca{width:100px;height:100px;border-radius:50%;background:#f7931e;position:absolute;
           left:80px;top:80px;box-shadow:0 4px 12px #0008}
  p{margin:0;color:#a8a29e;font-size:.9rem;text-align:center;padding:0 16px}
</style></head><body>
<h1>DROID-<span>E3D</span><i></i></h1>
<div id="modos">
  <button id="remoto" onclick="elegir('remoto')">Control remoto</button>
  <button id="ruta" onclick="elegir('ruta')">Recorrer la ruta</button>
</div>
<div id="estado">Conectando...</div>
<div id="base"><div id="palanca"></div></div>
<p id="ayuda">Arrastrá el círculo naranja para manejar. Al soltarlo, el robot frena.</p>
<script>
const base = document.getElementById('base'), palanca = document.getElementById('palanca');
const cartel = document.getElementById('estado');
const RADIO = 80;
let x = 0, y = 0, apretado = false, enviando = false, modo = 'remoto';

function mostrarModo(m) {
  modo = m;
  document.getElementById('remoto').className = m === 'remoto' ? 'activo' : '';
  document.getElementById('ruta').className = m === 'ruta' ? 'activo' : '';
  base.className = m === 'ruta' ? 'apagado' : '';
  document.getElementById('ayuda').textContent = m === 'ruta'
    ? 'El robot recorre la ruta solo. Tocá Control remoto para manejarlo.'
    : 'Arrastrá el círculo naranja para manejar. Al soltarlo, el robot frena.';
}
async function elegir(m) {
  try { await fetch('/modo?m=' + m, {cache: 'no-store'}); } catch (e) {}
  mostrarModo(m);
  enviar();
}
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
base.addEventListener('pointerdown', e => { if (modo !== 'remoto') return; apretado = true; base.setPointerCapture(e.pointerId); mover(e); });
base.addEventListener('pointermove', e => { if (apretado) mover(e); });
base.addEventListener('pointerup', soltar);
base.addEventListener('pointercancel', soltar);

async function enviar() {
  if (enviando) return;   // espera a que conteste el anterior
  enviando = true;
  try {
    const resp = await fetch('/mover?x=' + x + '&y=' + y, {cache: 'no-store'});
    const texto = await resp.text();
    const m = resp.headers.get('X-Modo');
    if (m && m !== modo) mostrarModo(m);
    cartel.textContent = texto;
    cartel.className = resp.ok ? '' : 'alerta';
  } catch (err) {
    cartel.textContent = 'Sin conexión con el robot';
    cartel.className = 'alerta';
  }
  enviando = false;
}
setInterval(() => { if (apretado) enviar(); }, 100);
setInterval(() => { if (!apretado) enviar(); }, 1000);
enviar();
</script></body></html>)rawliteral";

// ============================================================
// LOS PEDIDOS QUE LLEGAN POR WIFI (celular, IA, web, pruebas)
// ============================================================
// Cada pedido se atiende aparte y enseguida: si el celular deja una conexión abierta,
// la alerta de la IA igual pasa.

// Lee un dato: primero de la dirección (?x=10) y si no está, del cuerpo (la IA manda "nombre=..." por POST)
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
  httpd_resp_set_hdr(pedido, "X-Modo", modo == RUTA ? "ruta" : "remoto");   // para los botones de la página
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
  if (!enMarcha) {
    return contestar(pedido, "423 Locked", "Frenado (" + String(estadoRobot) + ")");
  }
  if (modo == RUTA) {
    String texto = hayObstaculo ? "Obstáculo adelante: esperando" : "Recorriendo la ruta · zona " + String(zonaActual());
    return contestar(pedido, "200 OK", texto);
  }
  joyX = x;
  joyY = y;
  ultimaOrden = millis();
  hayOrdenNueva = true;   // el loop mueve las ruedas
  return contestar(pedido, "200 OK", (x != 0 || y != 0) ? "Manejando" : "Listo para manejar");
}

// /modo?m=ruta  o  /modo?m=remoto
esp_err_t elegirModo(httpd_req_t* pedido) {
  String m = leerDato(pedido, "m");
  if (m != "ruta" && m != "remoto") return contestar(pedido, "400 Bad Request", "Usar ?m=ruta o ?m=remoto");
  pedirModo = (m == "ruta") ? RUTA : REMOTO;
  pedirMarcha = 1;   // elegir un modo también lo pone en marcha
  return contestar(pedido, "200 OK", m == "ruta" ? "Recorriendo la ruta" : "Control remoto");
}

// La IA avisa acá: /alerta_seguridad (POST con nombre=...)
esp_err_t recibirAlerta(httpd_req_t* pedido) {
  String nombre = leerDato(pedido, "nombre");
  Serial.println("ALERTA: " + (nombre.length() ? nombre : String("Desconocido")));
  pedirAlerta = true;   // el loop frena, dibuja el signo y prende la alarma
  return contestar(pedido, "200 OK", "OK");
}

esp_err_t probarPeligro(httpd_req_t* pedido) {
  pedirAlerta = true;
  return contestar(pedido, "200 OK", "Mostrando el signo de peligro 10 segundos");
}

esp_err_t parar(httpd_req_t* pedido) {
  pedirMarcha = 0;
  return contestar(pedido, "200 OK", "Detenido");
}

esp_err_t arrancar(httpd_req_t* pedido) {
  if (enEmergencia()) return contestar(pedido, "409 Conflict", "En emergencia: primero Detener desde la web");
  pedirModo = RUTA;
  pedirMarcha = 1;
  return contestar(pedido, "200 OK", "Recorriendo la ruta");
}

esp_err_t probarMotor(httpd_req_t* pedido) {
  String cual = leerDato(pedido, "motor");
  String sentido = leerDato(pedido, "sentido");
  int vel = (sentido == "atras") ? -VELOCIDAD_MAX : VELOCIDAD_MAX;
  if (cual != "izq" && cual != "der" && cual != "ambos") {
    return contestar(pedido, "400 Bad Request", "Usar ?motor=izq|der|ambos&sentido=adelante|atras");
  }
  pruebaIzq = (cual == "izq" || cual == "ambos") ? vel : 0;
  pruebaDer = (cual == "der" || cual == "ambos") ? vel : 0;
  pedirPrueba = true;
  return contestar(pedido, "200 OK", "Girando 1 segundo: " + cual + " " + sentido);
}

// Para calibrar los seguidores de línea y ver cómo está todo
esp_err_t verSensores(httpd_req_t* pedido) {
  String texto = "Modo: " + String(modo == RUTA ? "recorrer la ruta" : "control remoto") +
                 "\nEstado: " + String(estadoRobot) +
                 "\nLinea izq: " + String(analogRead(SENSOR_IZQ)) +
                 "\nLinea der: " + String(analogRead(SENSOR_DER)) +
                 "\nUmbral negro (menos que esto = negro): " + String(UMBRAL_NEGRO) +
                 "\nMarcas contadas: " + String(marcasContadas) +
                 "\nZona que informa: " + String(zonaActual()) +
                 "\nParadas de la ruta: " + String(paradas) +
                 "\nDistancia: " + (hayDistancia ? String(distanciaMm) + " mm" : String("sin sensor")) +
                 "\nWeb: " + (strlen(URL_BACKEND) == 0 ? String("sin configurar") : "ultima respuesta " + String(ultimoCodigoWeb));
  return contestar(pedido, "200 OK", texto);
}

esp_err_t olvidarWifi(httpd_req_t* pedido) {
  contestar(pedido, "200 OK", "Listo: el robot se reinicia y crea la red DROID-E3D-Robot para elegir otro WiFi");
  delay(500);
  ConfigWifi::olvidar();
  ESP.restart();
  return ESP_OK;
}

// Contesta "droid-robot": así la IA lo encuentra en la red aunque la PC no encuentre droid-robot.local
esp_err_t quienSos(httpd_req_t* pedido) { return contestar(pedido, "200 OK", "droid-robot"); }

void agregarDireccion(httpd_handle_t servidor, const char* direccion, httpd_method_t metodo,
                      esp_err_t (*funcion)(httpd_req_t*)) {
  httpd_uri_t r = {};
  r.uri = direccion;
  r.method = metodo;
  r.handler = funcion;
  httpd_register_uri_handler(servidor, &r);
}

void iniciarServidor() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.lru_purge_enable = true;   // si se llena de conexiones viejas del celular, cierra la más vieja
  config.max_uri_handlers = 16;
  httpd_handle_t servidor = NULL;
  if (httpd_start(&servidor, &config) != ESP_OK) {
    Serial.println("ERROR: no pude iniciar el servidor web.");
    return;
  }
  agregarDireccion(servidor, "/", HTTP_GET, paginaJoystick);
  agregarDireccion(servidor, "/mover", HTTP_GET, recibirMovimiento);
  agregarDireccion(servidor, "/modo", HTTP_GET, elegirModo);
  agregarDireccion(servidor, "/alerta_seguridad", HTTP_POST, recibirAlerta);
  agregarDireccion(servidor, "/alerta_seguridad", HTTP_GET, recibirAlerta);
  agregarDireccion(servidor, "/peligro", HTTP_GET, probarPeligro);
  agregarDireccion(servidor, "/parar", HTTP_GET, parar);
  agregarDireccion(servidor, "/arrancar", HTTP_GET, arrancar);
  agregarDireccion(servidor, "/prueba", HTTP_GET, probarMotor);
  agregarDireccion(servidor, "/sensores", HTTP_GET, verSensores);
  agregarDireccion(servidor, "/olvidar-wifi", HTTP_GET, olvidarWifi);
  agregarDireccion(servidor, "/quien-sos", HTTP_GET, quienSos);
}

// ============================================================
// CONEXIÓN CON LA WEB (contrato: src/SMAT/docs/API.md)
// ============================================================
// Las respuestas son textos cortos en JSON, por ejemplo {"comando": "iniciar"} o
// {"ruta": [{"zona_id": 1}, {"zona_id": 3}]}. Se buscan a mano, sin librería.
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

bool leerRuta() {
  HTTPClient http;
  http.setConnectTimeout(3000);
  http.setTimeout(3000);
  http.begin(String(URL_BACKEND) + "/robot/ruta");
  http.addHeader("X-API-KEY", ROBOT_API_KEY);
  int codigo = http.GET();
  bool pudo = false;
  if (codigo == 200) {
    String respuesta = http.getString();
    int cantidad = 0;
    int pos = respuesta.indexOf("\"zona_id\"");
    while (pos >= 0 && cantidad < MAX_PARADAS) {
      int dosPuntos = respuesta.indexOf(':', pos);
      ruta[cantidad++] = respuesta.substring(dosPuntos + 1).toInt();
      pos = respuesta.indexOf("\"zona_id\"", dosPuntos);
    }
    paradas = cantidad;
    pudo = true;
    Serial.println("Ruta leida: " + String(cantidad) + " paradas");
  } else {
    Serial.println("No pude leer la ruta: " + String(codigo));
  }
  http.end();
  return pudo;
}

// Corre en el otro núcleo: esperar a la web no traba al robot
void tareaWeb(void*) {
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(REPORTE_MS));
    if (WiFi.status() != WL_CONNECTED) continue;
    if (pedirRuta && leerRuta()) pedirRuta = false;

    const char* estadoEnviado = estadoRobot;
    bool mandaEstado = informarEstado;
    const char* ejecutado = comandoEjecutado;
    String cuerpo = "{\"zona_actual_id\": " + String(zonaActual());
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
      if (orden != nullptr) comandoPorAplicar = orden;
    } else {
      Serial.println("La web respondio " + String(codigo));
    }
    http.end();
  }
}

// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.setTxTimeoutMs(0);   // si nadie lee el Monitor Serie, no esperar (trababa la placa hasta 4 s)
  delay(1000);
  Serial.println("\n=== DROID-E3D arrancando ===");

  // Motores: primero frenados y recién ahí se prende el driver
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  pinMode(STBY, OUTPUT);
  ledcAttach(PWMA, 1000, 8);
  ledcAttach(PWMB, 1000, 8);
  frenar();
  digitalWrite(STBY, HIGH);

  iniciarPantalla();
  pintarTodo(FONDO);

  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);
  iniciarServos();
  iniciarSonido();

  sensorDistancia.setTimeout(100);   // corto: si no contesta, no traba el recorrido
  hayDistancia = sensorDistancia.init();
  if (hayDistancia) {
    sensorDistancia.startContinuous();
    Serial.println("Sensor de distancia listo");
  } else {
    Serial.println("Sin sensor de distancia: en la ruta no va a frenar ante obstáculos");
  }

  ConfigWifi::conectar("Robot", "droid-robot", avisoConfigurarWifi);
  Serial.println("Celular: http://droid-robot.local (o http://" + WiFi.localIP().toString() + ")");
  iniciarServidor();

  // Con la web, arranca DETENIDO y espera el "Iniciar". Sin la web, queda listo a control remoto.
  if (strlen(URL_BACKEND) > 0) {
    xTaskCreatePinnedToCore(tareaWeb, "web", 10000, NULL, 1, NULL, 0);
    cambiarEstado("detenido", false);
  } else {
    cambiarEstado("recorriendo", true);
  }
}

void loop() {
  unsigned long ahora = millis();

  if (WiFi.status() != WL_CONNECTED && ahora - ultimoChequeoWifi > 5000) {
    ultimoChequeoWifi = ahora;
    WiFi.reconnect();
  }

  // Orden de la web (va primero: tiene que frenar aunque haya una alerta)
  const char* orden = comandoPorAplicar;
  if (orden != nullptr) {
    comandoPorAplicar = nullptr;
    aplicarComando(orden);
    comandoEjecutado = orden;
  }

  // Cambio de modo o de marcha pedido desde el celular
  if (pedirModo >= 0) { cambiarModo((Modo)pedirModo); pedirModo = -1; }
  if (pedirMarcha >= 0) {
    if (pedirMarcha == 1 && !enEmergencia()) cambiarEstado("recorriendo", true);
    if (pedirMarcha == 0) cambiarEstado("detenido", false);
    pedirMarcha = -1;
  }

  // Alerta nueva: frena, signo de peligro y alarma (si llega otra, vuelve a contar desde ahora)
  if (pedirAlerta) {
    inicioAlerta = ahora;
    pedirAlerta = false;
    hayOrdenNueva = false;
    frenar();
    if (!enAlerta) dibujarPeligro();
    enAlerta = true;
    sonidoAlarma(true);
  }
  if (enAlerta) {
    if (ahora - inicioAlerta >= TIEMPO_ALERTA) {
      enAlerta = false;
      sonidoAlarma(false);
      pintarTodo(FONDO);
      Serial.println("Fin de la alerta");
    }
    return;   // mientras hay alerta, no se mueve
  }

  // Prueba de un motor desde /prueba
  if (pedirPrueba) {
    pedirPrueba = false;
    motor(PWMA, AIN1, AIN2, pruebaIzq);
    motor(PWMB, BIN1, BIN2, pruebaDer);
    delay(1000);
    frenar();
  }

  if (!enMarcha) return;

  // ---------- CONTROL REMOTO ----------
  if (modo == REMOTO) {
    if (hayOrdenNueva) {
      hayOrdenNueva = false;
      manejar(joyX, joyY);
      ultimaOrden = ahora;
    }
    if (moviendose && ahora - ultimaOrden > SIN_ORDEN_MS) {   // el celular dejó de mandar: frena
      frenar();
      Serial.println("Sin ordenes del celular: freno");
    }
    return;
  }

  // ---------- RECORRER LA RUTA ----------
  // Obstáculo adelante: frena hasta que se despeje
  if (hayDistancia) {
    distanciaMm = sensorDistancia.readRangeContinuousMillimeters();
    bool cerca = !sensorDistancia.timeoutOccurred() && distanciaMm < DISTANCIA_MINIMA;
    if (cerca && !hayObstaculo) { frenar(); Serial.println("Obstaculo!"); }
    hayObstaculo = cerca;
    if (hayObstaculo) return;
  }

  // Seguir la línea negra: los 2 sensores van uno a cada lado (la línea queda en el medio).
  bool negroIzq = analogRead(SENSOR_IZQ) < UMBRAL_NEGRO;
  bool negroDer = analogRead(SENSOR_DER) < UMBRAL_NEGRO;
  revisarMarca(negroIzq && negroDer, ahora);
  if (negroIzq && !negroDer)      girarIzq();   // se fue a la derecha: corrige a la izquierda
  else if (negroDer && !negroIzq) girarDer();   // se fue a la izquierda: corrige a la derecha
  else                            adelante();   // línea en el medio (o cruce): sigue derecho
}
