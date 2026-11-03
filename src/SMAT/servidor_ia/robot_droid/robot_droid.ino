// ============================================================
//  SMAT - Codigo del robot (ESP32 + DRV8833 + LCD 16x2 I2C)
//  - Se conecta al WiFi y muestra su IP en la LCD.
//  - Sigue una linea negra en el piso con 2 sensores CNY70 (RobotGroup).
//  - Frena si hay un obstaculo adelante (sensor de distancia VL53L0X).
//  - Cuando la compu (motor_ia_robot.py) manda un POST a
//    http://<IP_DEL_ESP32>/alerta_seguridad con "nombre",
//    el robot FRENA, muestra el nombre en la LCD y suena el buzzer.
//  - A los TIEMPO_ALERTA ms vuelve a andar solo.
//  - Si secretos.h tiene URL_BACKEND, habla con la web: recibe las ordenes
//    (iniciar, pausar, detener, emergencia) y le cuenta su estado y su zona.
//    En ese caso arranca DETENIDO y espera el "Iniciar" de la web.
//  - Sabe en que zona esta contando marcas en el piso: una cinta negra que cruza
//    la linea en la entrada de cada zona, en el mismo orden que la ruta de la web.
//    Al tocar "Iniciar" el robot tiene que estar adentro de la primera zona de la ruta.
//
//  Librerias (Herramientas > Administrar bibliotecas):
//    - "LiquidCrystal I2C" (Frank de Brabander)
//    - "VL53L0X" (Pololu)
//    - "ArduinoJson" (Benoit Blanchon)
//  Placa: "ESP32 Dev Module".
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <VL53L0X.h>

// ---------- 1. CAMBIAR ESTO ----------
// El nombre y la clave del WiFi van en secretos.h (no se sube a GitHub).
// Para crearlo: copiar secretos.example.h como secretos.h y poner tus datos.
#include "secretos.h"

// Si secretos.h no tiene los datos de la web, el robot anda como siempre, sin la web.
#ifndef URL_BACKEND
  #define URL_BACKEND ""
  #define ROBOT_API_KEY ""
#endif
#ifndef ZONA_DEL_ROBOT
  #define ZONA_DEL_ROBOT 1
#endif

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
const int BUZZER = 4;   // buzzer activo (+ al pin, - a GND). Si no hay, no pasa nada.
// Si el buzzer suena TODO EL TIEMPO y se calla con la alerta, es de los que
// funcionan al reves (muchos modulos de 3 patas): cambiar HIGH por LOW aca.
const int BUZZER_SUENA = HIGH;
const int BUZZER_CALLA = (BUZZER_SUENA == HIGH) ? LOW : HIGH;

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
const int UMBRAL_NEGRO = 1000;        // 0 a 4095. Mas que esto = el sensor ve NEGRO (ver /sensores)
                                      // Medido a 3V3: blanco 0-450, cinta negra 1900-2700
const int DISTANCIA_MINIMA = 200;     // mm. Si hay algo mas cerca, frena (200 mm = 20 cm)
const unsigned long TIEMPO_ALERTA   = 10000; // ms que queda frenado con la alerta (10 s)
const unsigned long PITIDO_MS = 300;        // ms que dura cada pitido y cada silencio
const unsigned long REPORTE_MS = 1500;      // cada cuanto habla con la web
const unsigned long MARCA_MS = 60;          // ms que los 2 sensores tienen que ver negro para contar una marca.
                                            // Si no cuenta las marcas: bajarlo o usar una cinta mas ancha.
                                            // Si cuenta de mas en las curvas: subirlo.
const int MAX_PARADAS = 50;                 // el mismo limite que tiene la ruta en la web

// ---------- Variables internas ----------
WebServer servidor(80);
bool enAlerta = false;
bool sonando = false;    // si el buzzer esta sonando ahora
bool patrullando = true;
unsigned long inicioAlerta = 0;
bool hayDistancia = false;   // si el VL53L0X respondio al arrancar
bool hayObstaculo = false;
int distanciaMm = 0;

// Lo que comparten el loop (mueve el robot) y tareaWeb (habla con la web).
// "volatile": las dos partes corren a la vez y cada una tiene que ver lo ultimo que puso la otra.
const char* volatile estadoRobot = "recorriendo";   // lo que se le cuenta a la web
const char* textoEstado = "Patrullando";            // lo que muestra la LCD
const char* volatile comandoPorAplicar = nullptr;   // orden que llego de la web y falta cumplir
const char* volatile comandoEjecutado = nullptr;    // orden cumplida que falta confirmarle a la web
volatile bool informarEstado = true;                // el estado cambio y la web todavia no lo sabe
volatile int ultimoCodigoWeb = 0;                   // ultima respuesta de la web (se ve en /sensores)
int ruta[MAX_PARADAS];                              // zona_id de cada parada, en orden (la lee tareaWeb)
volatile int paradas = 0;                           // cuantas paradas tiene la ruta (0 = todavia no la leyo)
volatile int paradaActual = 0;                      // en que parada de la ruta esta el robot
volatile bool pedirRuta = true;                     // hay que volver a leer la ruta de la web

// Para contar cada marca del piso una sola vez
bool sobreMarca = false;
bool marcaContada = false;
unsigned long inicioMarca = 0;
unsigned long ultimoNegro = 0;
unsigned long marcasContadas = 0;

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

// ---------- Estado del robot ----------
void cambiarEstado(const char* estado, bool anda, const char* texto) {
  estadoRobot = estado;
  textoEstado = texto;
  patrullando = anda;
  informarEstado = true;
  if (!anda) frenar();
  if (!enAlerta) mostrar("SMAT", texto);   // durante una alerta la LCD sigue mostrando el nombre
}

bool enEmergencia() { return strcmp(estadoRobot, "emergencia") == 0; }

// ---------- Zona: marcas en el piso ----------
// La zona que se le informa a la web. Hasta leer la ruta (o si esta vacia), la de secretos.h.
int zonaActual() {
  int cantidad = paradas;
  return cantidad > 0 ? ruta[paradaActual % cantidad] : ZONA_DEL_ROBOT;
}

// Los sensores van uno a cada lado de la linea: los 2 en negro a la vez solo pasa sobre una cinta que
// la cruza. Tiene que durar MARCA_MS para contar, y un salto del sensor sobre la cinta no cuenta doble.
void revisarMarca(bool losDosEnNegro, unsigned long ahora) {
  if (losDosEnNegro) {
    if (!sobreMarca) inicioMarca = ahora;   // recien llega a la cinta
    sobreMarca = true;
    ultimoNegro = ahora;
    if (!marcaContada && ahora - inicioMarca >= MARCA_MS) {
      marcaContada = true;
      marcasContadas++;
      if (paradas > 0) paradaActual = (paradaActual + 1) % paradas;
      Serial.println("Marca " + String(marcasContadas) + ": zona " + String(zonaActual()));
      mostrar("SMAT", "Zona " + String(zonaActual()));
    }
  } else if (sobreMarca && ahora - ultimoNegro >= MARCA_MS) {
    sobreMarca = false;                     // ya salio de la cinta
    marcaContada = false;
  }
}

void aplicarComando(const char* comando) {
  if (strcmp(comando, "iniciar") == 0) {
    if (!enEmergencia()) {
      // Igual que el simulador: si estaba pausado sigue donde estaba; si no, empieza la ruta de nuevo
      if (strcmp(estadoRobot, "pausado") != 0) {
        paradaActual = 0;
        pedirRuta = true;
      }
      cambiarEstado("recorriendo", true, "Patrullando");
    }
  }
  else if (strcmp(comando, "pausar") == 0)     cambiarEstado("pausado", false, "Pausado");
  else if (strcmp(comando, "detener") == 0)    cambiarEstado("detenido", false, "Detenido");
  else if (strcmp(comando, "emergencia") == 0) cambiarEstado("emergencia", false, "EMERGENCIA");
}

// ---------- Lo que recibe de la compu ----------
void recibirAlerta() {
  String nombre = servidor.hasArg("nombre") ? servidor.arg("nombre") : "Desconocido";
  Serial.println("ALERTA: " + nombre);

  enAlerta = true;
  inicioAlerta = millis();
  frenar();
  mostrar("ALERTA! S/CASCO", nombre);
  digitalWrite(BUZZER, BUZZER_SUENA);   // empieza a sonar la alarma
  sonando = true;

  servidor.send(200, "text/plain", "OK");
}

void paginaInicio() {
  servidor.send(200, "text/plain", enAlerta ? String("SMAT: EN ALERTA") : "SMAT: " + String(estadoRobot));
}

void parar() { cambiarEstado("detenido", false, "Detenido"); servidor.send(200, "text/plain", "Detenido"); }
void arrancar() {
  if (enEmergencia()) {   // despues de una emergencia solo se sale con "Detener" desde la web
    servidor.send(409, "text/plain", "En emergencia: primero Detener desde la web");
    return;
  }
  cambiarEstado("recorriendo", true, "Patrullando");
  servidor.send(200, "text/plain", "Patrullando");
}

// Para calibrar: abrir http://<IP_DEL_ESP32>/sensores en el navegador
// y ver cuanto marca cada sensor sobre el piso y sobre la linea negra.
void verSensores() {
  String texto = "Linea izq: " + String(analogRead(SENSOR_IZQ)) +
                 "\nLinea der: " + String(analogRead(SENSOR_DER)) +
                 "\nUmbral negro: " + String(UMBRAL_NEGRO) +
                 "\nMarcas contadas: " + String(marcasContadas) +
                 "\nZona que informa: " + String(zonaActual()) +
                 "\nParadas de la ruta: " + String(paradas) +
                 "\nDistancia: "+ (hayDistancia ? String(distanciaMm) + " mm" : String("sin sensor")) +
                 "\nEstado: " + String(estadoRobot) +
                 "\nWeb: " + (strlen(URL_BACKEND) == 0 ? String("sin configurar") : "ultima respuesta " + String(ultimoCodigoWeb));
  servidor.send(200, "text/plain", texto);
}

// ---------- Conexion con la web ----------
// Devuelve el texto fijo de una orden conocida (nullptr si no hay orden o no se conoce).
const char* ordenConocida(const char* comando) {
  if (comando == nullptr) return nullptr;
  for (const char* orden : {"iniciar", "pausar", "detener", "emergencia"}) {
    if (strcmp(comando, orden) == 0) return orden;
  }
  return nullptr;
}

// Lee de la web las zonas de la ruta, en orden. Devuelve true si pudo (si no, se reintenta).
bool leerRuta() {
  HTTPClient http;
  http.setConnectTimeout(3000);
  http.setTimeout(3000);
  http.begin(String(URL_BACKEND) + "/robot/ruta");
  http.addHeader("X-API-KEY", ROBOT_API_KEY);
  int codigo = http.GET();
  bool pudo = false;
  if (codigo == 200) {
    JsonDocument respuesta;
    if (!deserializeJson(respuesta, http.getString())) {
      int cantidad = 0;
      for (JsonObject parada : respuesta["ruta"].as<JsonArray>()) {
        if (cantidad < MAX_PARADAS) ruta[cantidad++] = parada["zona_id"];
      }
      paradas = cantidad;
      pudo = true;
      Serial.println("Ruta leida: " + String(cantidad) + " paradas");
    }
  } else {
    Serial.println("No pude leer la ruta: " + String(codigo));
  }
  http.end();
  return pudo;
}

// Corre en una tarea aparte, en el otro nucleo del ESP32. Consultar la web tarda: si esto estuviera
// en el loop, mientras espera la respuesta el robot dejaria de mirar la linea y se saldria.
// Usa solo POST /robot/reporte: cuenta como "latido" (mas de 10 s sin reporte = "Sin conexion" en
// la web) y la respuesta trae la orden pendiente. La orden se repite hasta confirmarla con
// comando_ejecutado. Contrato completo: src/SMAT/docs/API.md
void tareaWeb(void*) {
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(REPORTE_MS));
    if (WiFi.status() != WL_CONNECTED) continue;

    if (pedirRuta && leerRuta()) pedirRuta = false;

    JsonDocument envio;
    envio["zona_actual_id"] = zonaActual();     // sin zona, la web rechaza las alertas de la camara
    // El estado se manda solo cuando cambia: asi un reporte nunca pisa la emergencia que acaba de
    // mandar el encargado desde la web.
    const char* estadoEnviado = estadoRobot;
    bool mandaEstado = informarEstado;
    if (mandaEstado) envio["estado"] = estadoEnviado;
    const char* ejecutado = comandoEjecutado;
    if (ejecutado != nullptr) envio["comando_ejecutado"] = ejecutado;
    String cuerpo;
    serializeJson(envio, cuerpo);

    HTTPClient http;
    http.setConnectTimeout(3000);
    http.setTimeout(3000);
    http.begin(String(URL_BACKEND) + "/robot/reporte");
    http.addHeader("X-API-KEY", ROBOT_API_KEY);
    http.addHeader("Content-Type", "application/json");
    int codigo = http.POST(cuerpo);
    ultimoCodigoWeb = codigo;

    if (codigo == 200) {
      // Si cambio algo mientras esperabamos la respuesta, se manda en el proximo reporte
      if (mandaEstado && estadoEnviado == estadoRobot) informarEstado = false;
      if (ejecutado != nullptr && comandoEjecutado == ejecutado) comandoEjecutado = nullptr;

      JsonDocument respuesta;
      if (!deserializeJson(respuesta, http.getString())) {
        const char* orden = ordenConocida(respuesta["comando"]);
        if (orden != nullptr) comandoPorAplicar = orden;   // lo cumple el loop
      }
    } else {
      Serial.println("La web respondio " + String(codigo) + ": " + (codigo > 0 ? http.getString() : http.errorToString(codigo)));
    }
    http.end();
  }
}

// ============================================================
void setup() {
  Serial.begin(115200);

  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, BUZZER_CALLA);   // arranca callado
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

  // Con la web, arranca detenido y espera el "Iniciar" (sin la web, patrulla solo como siempre)
  if (strlen(URL_BACKEND) > 0) {
    estadoRobot = "detenido";
    textoEstado = "Detenido";
    patrullando = false;
    xTaskCreatePinnedToCore(tareaWeb, "web", 10000, NULL, 1, NULL, 0);
  }

  delay(3000);
}

void loop() {
  servidor.handleClient();
  unsigned long ahora = millis();

  // Orden que llego de la web (va primero: tiene que frenar aunque haya una alerta u obstaculo)
  const char* orden = comandoPorAplicar;
  if (orden != nullptr) {
    comandoPorAplicar = nullptr;
    aplicarComando(orden);
    comandoEjecutado = orden;
  }

  // Termina la alerta: apaga buzzer y vuelve a patrullar
  if (enAlerta) {
    if (ahora - inicioAlerta >= TIEMPO_ALERTA) {
      enAlerta = false;
      digitalWrite(BUZZER, BUZZER_CALLA);   // apaga la alarma
      sonando = false;
      mostrar("SMAT", textoEstado);   // vuelve a lo que estaba haciendo (patrullando, detenido...)
      return;
    }
    // Alarma intermitente: pi... pi... pi...
    // (solo prende o apaga cuando cambia, para no repetir la orden en cada vuelta)
    bool debeSonar = ((ahora - inicioAlerta) / PITIDO_MS) % 2 == 0;
    if (debeSonar != sonando) {
      digitalWrite(BUZZER, debeSonar ? BUZZER_SUENA : BUZZER_CALLA);
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

  revisarMarca(negroIzq && negroDer, ahora);

  if (negroIzq && !negroDer)      girarIzq();   // se fue a la derecha: corrige a la izquierda
  else if (negroDer && !negroIzq) girarDer();   // se fue a la izquierda: corrige a la derecha
  else                            adelante();   // linea en el medio (o cruce): sigue derecho
}
