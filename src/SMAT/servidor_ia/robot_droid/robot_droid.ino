// ============================================================
//  SMAT - Codigo del robot (ESP32 + DRV8833 + LCD 16x2 I2C)
//  - Se conecta al WiFi y muestra su IP en la LCD.
//  - Sigue una linea negra en el piso con 2 sensores CNY70 (RobotGroup).
//  - Frena si hay un obstaculo adelante (sensor de distancia VL53L0X).
//  - Cuando la compu (motor_ia_robot.py) manda un POST a
//    http://<IP_DEL_ESP32>/alerta_seguridad con "nombre",
//    el robot FRENA, muestra el nombre en la LCD y suena el buzzer.
//  - A los TIEMPO_ALERTA ms vuelve a andar solo.
//
//  Librerias (Herramientas > Administrar bibliotecas):
//    - "LiquidCrystal I2C" (Frank de Brabander)
//    - "VL53L0X" (Pololu)
//  Placa: "ESP32 Dev Module".
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <VL53L0X.h>

// ---------- 1. CAMBIAR ESTO ----------
// El nombre y la clave del WiFi van en secretos.h (no se sube a GitHub).
// Para crearlo: copiar secretos.example.h como secretos.h y poner tus datos.
#include "secretos.h"

// Si la LCD no muestra nada, probar con 0x3F en vez de 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ---------- 2. PINES ----------
// LCD:     SDA -> GPIO 21   SCL -> GPIO 22   VCC -> 5V (VIN)   GND -> GND
// DRV8833: motor izquierdo AIN1/AIN2, motor derecho BIN1/BIN2
// (P34, P35, P36 y P39 NO sirven para esto: solo leen, no mandan senal)
const int AIN1 = 32;   // IN1
const int AIN2 = 33;   // IN2
const int BIN1 = 25;   // IN3
const int BIN2 = 26;   // IN4
const int BUZZER = 4;   // buzzer activo (+ al pin, - a GND). Suena con HIGH. Si no hay, no pasa nada.

// Sensores de linea (placas verdes RobotGroup con CNY70): 3 cables
//   VCC -> 3V3 (NO a 5V: la senal subiria a 5V y el ESP32 aguanta 3.3V)
//   GND -> GND      SENAL (el pin del MEDIO del conector blanco) -> pin de abajo
//   Probado: sobre blanco da ~100, sobre cinta negra da 4095.
// Tienen que ser pines del ADC1 (32 a 39): los del ADC2 no leen con el WiFi prendido.
const int SENSOR_IZQ = 34;
const int SENSOR_DER = 35;

// Sensor de distancia VL53L0X (placa violeta): comparte los cables con la LCD
//   VIN -> 3V3   GND -> GND   SCL -> GPIO 22   SDA -> GPIO 21
VL53L0X sensorDistancia;

// ---------- 3. AJUSTES ----------
const int VELOCIDAD = 200;            // 0 a 255
const int VELOCIDAD_GIRO = 170;       // velocidad al corregir para volver a la linea
const int UMBRAL_NEGRO = 2000;        // 0 a 4095. Mas que esto = el sensor ve NEGRO (ver /sensores)
const int DISTANCIA_MINIMA = 200;     // mm. Si hay algo mas cerca, frena (200 mm = 20 cm)
const unsigned long TIEMPO_ALERTA   = 10000; // ms que queda frenado con la alerta (10 s)
const unsigned long PITIDO_MS = 300;        // ms que dura cada pitido y cada silencio

// ---------- Variables internas ----------
WebServer servidor(80);
bool enAlerta = false;
bool sonando = false;    // si el buzzer esta sonando ahora
bool patrullando = true;
unsigned long inicioAlerta = 0;
bool hayDistancia = false;   // si el VL53L0X respondio al arrancar
bool hayObstaculo = false;
int distanciaMm = 0;

// ---------- Motores ----------
void motor(int pin1, int pin2, int vel) {
  if (vel > 0)      { analogWrite(pin1, vel);  analogWrite(pin2, 0); }
  else if (vel < 0) { analogWrite(pin1, 0);    analogWrite(pin2, -vel); }
  else              { analogWrite(pin1, 0);    analogWrite(pin2, 0); }
}
void adelante() { motor(AIN1, AIN2, VELOCIDAD);  motor(BIN1, BIN2, VELOCIDAD); }
void girarIzq() { motor(AIN1, AIN2, -VELOCIDAD_GIRO); motor(BIN1, BIN2, VELOCIDAD_GIRO); }
void girarDer() { motor(AIN1, AIN2, VELOCIDAD_GIRO);  motor(BIN1, BIN2, -VELOCIDAD_GIRO); }
void frenar()   { motor(AIN1, AIN2, 0);          motor(BIN1, BIN2, 0); }

// ---------- LCD ----------
void mostrar(String linea1, String linea2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(linea1.substring(0, 16));
  lcd.setCursor(0, 1); lcd.print(linea2.substring(0, 16));
}

// ---------- Lo que recibe de la compu ----------
void recibirAlerta() {
  String nombre = servidor.hasArg("nombre") ? servidor.arg("nombre") : "Desconocido";
  Serial.println("ALERTA: " + nombre);

  enAlerta = true;
  inicioAlerta = millis();
  frenar();
  mostrar("ALERTA! S/CASCO", nombre);
  digitalWrite(BUZZER, HIGH);   // empieza a sonar la alarma
  sonando = true;

  servidor.send(200, "text/plain", "OK");
}

void paginaInicio() {
  servidor.send(200, "text/plain", enAlerta ? "SMAT: EN ALERTA" : "SMAT: patrullando");
}

void parar()    { patrullando = false; frenar(); mostrar("SMAT", "Detenido");  servidor.send(200, "text/plain", "Detenido"); }
void arrancar() { patrullando = true;  mostrar("SMAT", "Patrullando"); servidor.send(200, "text/plain", "Patrullando"); }

// Para calibrar: abrir http://<IP_DEL_ESP32>/sensores en el navegador
// y ver cuanto marca cada sensor sobre el piso y sobre la linea negra.
void verSensores() {
  String texto = "Linea izq: " + String(analogRead(SENSOR_IZQ)) +
                 "\nLinea der: " + String(analogRead(SENSOR_DER)) +
                 "\nUmbral negro: " + String(UMBRAL_NEGRO) +
                 "\nDistancia: " + (hayDistancia ? String(distanciaMm) + " mm" : String("sin sensor"));
  servidor.send(200, "text/plain", texto);
}

// ============================================================
void setup() {
  Serial.begin(115200);

  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  frenar();

  lcd.init();
  lcd.backlight();

  // Sensor de distancia (si no esta conectado, el robot anda igual sin el)
  sensorDistancia.setTimeout(500);
  hayDistancia = sensorDistancia.init();
  if (hayDistancia) {
    sensorDistancia.startContinuous();   // mide todo el tiempo
  } else {
    Serial.println("No encuentro el VL53L0X: reviso cables SDA/SCL");
    mostrar("SMAT", "Sin sensor dist.");
    delay(2000);
  }
  mostrar("SMAT", "Conectando WiFi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_NOMBRE, WIFI_CLAVE);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    intentos++;
    Serial.print(".");
    // Cada 10 segundos muestra en la LCD por que no conecta y vuelve a probar
    if (intentos % 20 == 0) {
      int estado = WiFi.status();
      String motivo = "Error " + String(estado);
      if (estado == WL_NO_SSID_AVAIL) motivo = "No veo la red";     // nombre mal o red 5 GHz
      if (estado == WL_CONNECT_FAILED) motivo = "Clave incorrecta";
      Serial.println("\nNo conecta: " + motivo);
      mostrar("WiFi: " + String(WIFI_NOMBRE), motivo);
      WiFi.disconnect();
      WiFi.begin(WIFI_NOMBRE, WIFI_CLAVE);
    }
  }
  String ip = WiFi.localIP().toString();
  Serial.println("\nConectado! IP: " + ip);
  mostrar("SMAT listo", ip);   // ESTA IP va en servidor_ia/.env (URL_ESP32_ALERTA)

  servidor.on("/", paginaInicio);
  servidor.on("/alerta_seguridad", recibirAlerta);
  servidor.on("/parar", parar);
  servidor.on("/arrancar", arrancar);
  servidor.on("/sensores", verSensores);
  servidor.begin();

  delay(3000);
}

void loop() {
  servidor.handleClient();
  unsigned long ahora = millis();

  // Termina la alerta: apaga buzzer y vuelve a patrullar
  if (enAlerta) {
    if (ahora - inicioAlerta >= TIEMPO_ALERTA) {
      enAlerta = false;
      digitalWrite(BUZZER, LOW);   // apaga la alarma
      sonando = false;
      mostrar("SMAT", "Patrullando");
      return;
    }
    // Alarma intermitente: pi... pi... pi...
    // (solo prende o apaga cuando cambia, para no repetir la orden en cada vuelta)
    bool debeSonar = ((ahora - inicioAlerta) / PITIDO_MS) % 2 == 0;
    if (debeSonar != sonando) {
      digitalWrite(BUZZER, debeSonar ? HIGH : LOW);
      sonando = debeSonar;
    }
    return;   // mientras hay alerta, no se mueve
  }

  if (!patrullando) return;

  // ---- Obstaculo adelante: frena hasta que se despeje ----
  if (hayDistancia) {
    distanciaMm = sensorDistancia.readRangeContinuousMillimeters();
    // 8190 o mas = no ve nada. timeoutOccurred = el sensor no contesto
    bool cerca = !sensorDistancia.timeoutOccurred() && distanciaMm < DISTANCIA_MINIMA;
    if (cerca && !hayObstaculo) { frenar(); mostrar("SMAT", "Obstaculo!"); }
    if (!cerca && hayObstaculo) { mostrar("SMAT", "Patrullando"); }
    hayObstaculo = cerca;
    if (hayObstaculo) return;   // no se mueve mientras haya algo cerca
  }

  // ---- Seguir la linea negra ----
  // Los 2 sensores van uno a cada lado de la linea (la linea queda en el medio).
  // El CNY70 da un numero ALTO sobre negro y BAJO sobre blanco/claro.
  bool negroIzq = analogRead(SENSOR_IZQ) > UMBRAL_NEGRO;
  bool negroDer = analogRead(SENSOR_DER) > UMBRAL_NEGRO;

  if (negroIzq && !negroDer)      girarIzq();   // se fue a la derecha: corrige a la izquierda
  else if (negroDer && !negroIzq) girarDer();   // se fue a la izquierda: corrige a la derecha
  else                            adelante();   // linea en el medio (o cruce): sigue derecho
}
