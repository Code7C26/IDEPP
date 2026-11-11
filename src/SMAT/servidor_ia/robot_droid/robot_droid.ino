// ============================================================
//  DROID-E3D · Programa del robot WALL-E (ESP32-S3)
//
//  Que hace:
//  - Se conecta al WiFi (la IP aparece en el Monitor Serie).
//  - Sigue una linea negra en el piso con 2 seguidores de linea.
//  - Cuando la IA de la compu (motor_ia_robot.py) detecta que a alguien le falta
//    el casco u otro elemento, manda un aviso a http://<IP_DEL_ROBOT>/alerta_seguridad.
//    Entonces el robot FRENA y la pantalla muestra el signo de PELIGRO (triangulo
//    amarillo con "!"). A los TIEMPO_ALERTA ms vuelve a andar solo.
//  - Si secretos.h tiene URL_BACKEND, habla con la web: recibe las ordenes
//    (iniciar, pausar, detener, emergencia) y le cuenta su estado y su zona.
//    En ese caso arranca DETENIDO y espera el "Iniciar" de la web.
//  - Sabe en que zona esta contando marcas en el piso: una cinta negra que cruza
//    la linea en la entrada de cada zona, en el mismo orden que la ruta de la web.
//
//  Placa: "ESP32S3 Dev Module" · Tools -> USB CDC On Boot -> Enabled
//  Librerias: VL53L0X (Pololu). Nada mas: la pantalla, los servos y la web
//  se manejan con codigo propio.
//
//  Piezas que todavia no estan (el robot anda igual sin ellas):
//  - Parlante (amplificador MAX98357A): falta soldarlo. Ver sonidoAlarma().
//  - Sensor de distancia VL53L0X: el actual no mide (probablemente fallado).
//    Si no arranca, el robot sigue sin frenar ante obstaculos.
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <VL53L0X.h>

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
//   Si el robot gira al reves, cambiar los cables de ese motor (AO1 <-> AO2).
const int PWMA = 18;   // velocidad motor A
const int AIN1 = 39;   // sentido motor A
const int AIN2 = 40;
const int PWMB = 10;   // velocidad motor B
const int BIN1 = 42;   // sentido motor B
const int BIN2 = 47;
const int STBY = 41;   // en HIGH el driver funciona

// Seguidores de linea "Tracker Sensor" (walle_linea_prueba)
//   V+ -> 3V3 (NO a 5V)   G -> GND   S -> pin de abajo
//   Probado: sobre NEGRO dan 0 y sobre BLANCO unos 3800.
const int SENSOR_IZQ = 4;
const int SENSOR_DER = 5;

// Pantalla ST7789 de 240x240, sin pin CS (walle_pantalla_prueba)
const int PANT_SCL = 12;
const int PANT_SDA = 11;
const int PANT_RES = 14;
const int PANT_DC  = 13;
const int PANT_BLK = 21;

// Cables I2C: los comparten la placa de servos PCA9685 y el sensor de distancia
const int PIN_SDA = 8;
const int PIN_SCL = 9;

// ---------- 3. AJUSTES ----------
const int VELOCIDAD = 200;            // 0 a 255
const int VELOCIDAD_GIRO = 170;       // velocidad al corregir para volver a la linea
const int UMBRAL_NEGRO = 2000;        // 0 a 4095. MENOS que esto = el sensor ve NEGRO (ver /sensores)
const int DISTANCIA_MINIMA = 200;     // mm. Si hay algo mas cerca, frena (200 mm = 20 cm)
const unsigned long TIEMPO_ALERTA = 10000;  // ms que queda frenado con la alerta (10 s)
const unsigned long REPORTE_MS = 1500;      // cada cuanto habla con la web
const unsigned long MARCA_MS = 60;          // ms que los 2 sensores tienen que ver negro para contar una marca
const int MAX_PARADAS = 50;                 // el mismo limite que tiene la ruta en la web

// ---------- Variables internas ----------
WebServer servidor(80);
VL53L0X sensorDistancia;
bool enAlerta = false;
bool patrullando = false;   // arranca QUIETO
unsigned long inicioAlerta = 0;
unsigned long ultimoChequeoWifi = 0;
bool hayDistancia = false;   // si el sensor de distancia arranco bien
bool hayObstaculo = false;
int distanciaMm = 0;

// Lo que comparten el loop (mueve el robot) y tareaWeb (habla con la web).
// "volatile": las dos partes corren a la vez y cada una tiene que ver lo ultimo que puso la otra.
const char* volatile estadoRobot = "detenido";      // lo que se le cuenta a la web
const char* volatile comandoPorAplicar = nullptr;   // orden que llego de la web y falta cumplir
const char* volatile comandoEjecutado = nullptr;    // orden cumplida que falta confirmarle a la web
volatile bool informarEstado = true;                // el estado cambio y la web todavia no lo sabe
volatile int ultimoCodigoWeb = 0;                   // ultima respuesta de la web (se ve en /sensores)
int ruta[MAX_PARADAS];                              // zona_id de cada parada, en orden
volatile int paradas = 0;                           // cuantas paradas tiene la ruta (0 = no la leyo)
volatile int paradaActual = 0;                      // en que parada de la ruta esta el robot
volatile bool pedirRuta = true;                     // hay que volver a leer la ruta de la web

// Para contar cada marca del piso una sola vez
bool sobreMarca = false;
bool marcaContada = false;
unsigned long inicioMarca = 0;
unsigned long ultimoNegro = 0;
unsigned long marcasContadas = 0;

// ============================================================
// MOTORES
// ============================================================
// vel: positivo = adelante, negativo = atras, 0 = frenado
void motor(int pinPwm, int pin1, int pin2, int vel) {
  digitalWrite(pin1, vel > 0 ? HIGH : LOW);
  digitalWrite(pin2, vel < 0 ? HIGH : LOW);
  ledcWrite(pinPwm, abs(vel));
}
void adelante() { motor(PWMA, AIN1, AIN2, VELOCIDAD);       motor(PWMB, BIN1, BIN2, VELOCIDAD); }
void girarIzq() { motor(PWMA, AIN1, AIN2, -VELOCIDAD_GIRO); motor(PWMB, BIN1, BIN2, VELOCIDAD_GIRO); }
void girarDer() { motor(PWMA, AIN1, AIN2, VELOCIDAD_GIRO);  motor(PWMB, BIN1, BIN2, -VELOCIDAD_GIRO); }
void frenar()   { motor(PWMA, AIN1, AIN2, 0);               motor(PWMB, BIN1, BIN2, 0); }

// ============================================================
// SONIDO (todavia no: falta soldar el amplificador MAX98357A)
// ============================================================
// Cuando el parlante funcione, aca va el sonido de alarma (ver walle_sonido_prueba).
// Pines reservados: BCLK 15, LRC 16, DIN 17.
void sonidoAlarma(bool prender) {
  (void)prender;   // por ahora no hace nada
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
  pantallaOrden(0x11); delay(150);      // despertar
  pantallaOrden(0x3A); pantallaDato(0x55);   // colores RGB565
  pantallaOrden(0x36); pantallaDato(0x00);   // orientacion normal
  pantallaOrden(0x21);                  // invertir colores (esta pantalla lo necesita)
  pantallaOrden(0x13);                  // modo normal
  pantallaOrden(0x29);                  // prender la imagen
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

// Triangulo con la punta para arriba, dibujado fila por fila:
// cada fila es un poco mas ancha que la anterior.
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
  // El palito del "!": un rectangulo con las puntas redondeadas
  rectangulo(111, 88, 19, 62, NEGRO);
  circulo(120, 88, 9, NEGRO);
  circulo(120, 150, 9, NEGRO);
  // El punto del "!"
  circulo(120, 176, 11, NEGRO);
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
// ESTADO DEL ROBOT
// ============================================================
void cambiarEstado(const char* estado, bool anda) {
  estadoRobot = estado;
  patrullando = anda;
  informarEstado = true;
  if (!anda) frenar();
  Serial.println("Estado: " + String(estado));
}

bool enEmergencia() { return strcmp(estadoRobot, "emergencia") == 0; }

// ---------- Zona: marcas en el piso ----------
int zonaActual() {
  int cantidad = paradas;
  return cantidad > 0 ? ruta[paradaActual % cantidad] : ZONA_DEL_ROBOT;
}

// Los sensores van uno a cada lado de la linea: los 2 en negro a la vez solo pasa sobre una
// cinta que la cruza. Tiene que durar MARCA_MS para contar, y no cuenta doble.
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

void aplicarComando(const char* comando) {
  if (strcmp(comando, "iniciar") == 0) {
    if (!enEmergencia()) {
      // Si estaba pausado sigue donde estaba; si no, empieza la ruta de nuevo
      if (strcmp(estadoRobot, "pausado") != 0) {
        paradaActual = 0;
        pedirRuta = true;
      }
      cambiarEstado("recorriendo", true);
    }
  }
  else if (strcmp(comando, "pausar") == 0)     cambiarEstado("pausado", false);
  else if (strcmp(comando, "detener") == 0)    cambiarEstado("detenido", false);
  else if (strcmp(comando, "emergencia") == 0) cambiarEstado("emergencia", false);
}

// ============================================================
// LO QUE RECIBE DE LA COMPU (la IA)
// ============================================================
void recibirAlerta() {
  String nombre = servidor.hasArg("nombre") ? servidor.arg("nombre") : "Desconocido";
  Serial.println("ALERTA: " + nombre);
  servidor.send(200, "text/plain", "OK");   // primero le contesta, asi la compu no espera

  enAlerta = true;
  inicioAlerta = millis();
  frenar();
  dibujarPeligro();     // la pantalla muestra el signo de peligro
  sonidoAlarma(true);
}

void paginaInicio() {
  servidor.send(200, "text/plain", enAlerta ? String("WALL-E: EN ALERTA") : "WALL-E: " + String(estadoRobot));
}

void parar() { cambiarEstado("detenido", false); servidor.send(200, "text/plain", "Detenido"); }
void arrancar() {
  if (enEmergencia()) {
    servidor.send(409, "text/plain", "En emergencia: primero Detener desde la web");
    return;
  }
  cambiarEstado("recorriendo", true);
  servidor.send(200, "text/plain", "Patrullando");
}

// Prueba de motores: http://<IP>/prueba?motor=izq&sentido=adelante
//   motor = izq | der | ambos      sentido = adelante | atras
void probarMotor() {
  patrullando = false;
  String cual = servidor.arg("motor");
  int vel = (servidor.arg("sentido") == "atras") ? -VELOCIDAD : VELOCIDAD;
  if (cual != "izq" && cual != "der" && cual != "ambos") {
    servidor.send(400, "text/plain", "Usar ?motor=izq|der|ambos&sentido=adelante|atras");
    return;
  }
  if (cual == "izq" || cual == "ambos") motor(PWMA, AIN1, AIN2, vel);
  if (cual == "der" || cual == "ambos") motor(PWMB, BIN1, BIN2, vel);
  delay(1000);
  frenar();
  servidor.send(200, "text/plain", "Listo: " + cual + " " + servidor.arg("sentido"));
}

// Para probar la pantalla sin la IA: http://<IP>/peligro
void probarPeligro() {
  servidor.send(200, "text/plain", "Mostrando el signo de peligro 10 segundos");
  enAlerta = true;
  inicioAlerta = millis();
  frenar();
  dibujarPeligro();
}

// Para calibrar: abrir http://<IP_DEL_ROBOT>/sensores en el navegador
void verSensores() {
  String texto = "Linea izq: " + String(analogRead(SENSOR_IZQ)) +
                 "\nLinea der: " + String(analogRead(SENSOR_DER)) +
                 "\nUmbral negro (menos que esto = negro): " + String(UMBRAL_NEGRO) +
                 "\nMarcas contadas: " + String(marcasContadas) +
                 "\nZona que informa: " + String(zonaActual()) +
                 "\nParadas de la ruta: " + String(paradas) +
                 "\nDistancia: " + (hayDistancia ? String(distanciaMm) + " mm" : String("sin sensor")) +
                 "\nEstado: " + String(estadoRobot) +
                 "\nWeb: " + (strlen(URL_BACKEND) == 0 ? String("sin configurar") : "ultima respuesta " + String(ultimoCodigoWeb));
  servidor.send(200, "text/plain", texto);
}

// ============================================================
// CONEXION CON LA WEB (contrato: src/SMAT/docs/API.md)
// ============================================================
// Las respuestas de la web son textos cortos en formato JSON, por ejemplo:
//   {"comando": "iniciar"}     o     {"ruta": [{"zona_id": 1}, {"zona_id": 3}]}
// En vez de usar una libreria, buscamos a mano lo que nos interesa.

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
  return nullptr;   // null o una orden que no conocemos
}

// Lee de la web las zonas de la ruta, en orden. Devuelve true si pudo.
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
      ruta[cantidad++] = respuesta.substring(dosPuntos + 1).toInt();   // toInt saltea los espacios
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

// Corre en una tarea aparte, en el otro nucleo del ESP32: consultar la web tarda, y si
// estuviera en el loop el robot dejaria de mirar la linea mientras espera.
void tareaWeb(void*) {
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(REPORTE_MS));
    if (WiFi.status() != WL_CONNECTED) continue;

    if (pedirRuta && leerRuta()) pedirRuta = false;

    // Armamos el mensaje a mano: {"zona_actual_id": 1, "estado": "...", "comando_ejecutado": "..."}
    const char* estadoEnviado = estadoRobot;
    bool mandaEstado = informarEstado;   // el estado se manda solo cuando cambia
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
      if (orden != nullptr) comandoPorAplicar = orden;   // la cumple el loop
    } else {
      Serial.println("La web respondio " + String(codigo) + ": " + (codigo > 0 ? http.getString() : http.errorToString(codigo)));
    }
    http.end();
  }
}

// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== WALL-E DROID-E3D arrancando ===");

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

  // Sensor de distancia (si no arranca, el robot anda igual sin el)
  sensorDistancia.setTimeout(500);
  hayDistancia = sensorDistancia.init();
  if (hayDistancia) {
    sensorDistancia.startContinuous();
    Serial.println("Sensor de distancia listo");
  } else {
    Serial.println("Sin sensor de distancia: el robot no va a frenar ante obstaculos");
  }

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
  String ip = WiFi.localIP().toString();
  Serial.println("\nConectado! IP del robot: " + ip);
  Serial.println("Esta IP va en servidor_ia/.env: URL_ESP32_ALERTA=http://" + ip + "/alerta_seguridad");

  servidor.on("/", paginaInicio);
  servidor.on("/alerta_seguridad", recibirAlerta);
  servidor.on("/parar", parar);
  servidor.on("/arrancar", arrancar);
  servidor.on("/sensores", verSensores);
  servidor.on("/prueba", probarMotor);
  servidor.on("/peligro", probarPeligro);
  servidor.begin();

  // Con la web, arranca detenido y espera el "Iniciar" de la web.
  // Sin la web, se pone en marcha entrando a http://<IP>/arrancar
  if (strlen(URL_BACKEND) > 0) {
    xTaskCreatePinnedToCore(tareaWeb, "web", 10000, NULL, 1, NULL, 0);
  }
  cambiarEstado("detenido", false);
}

void loop() {
  servidor.handleClient();
  unsigned long ahora = millis();

  // Si se corto el WiFi, cada 5 segundos intenta reconectar
  if (WiFi.status() != WL_CONNECTED && ahora - ultimoChequeoWifi > 5000) {
    ultimoChequeoWifi = ahora;
    WiFi.reconnect();
  }

  // Orden que llego de la web (va primero: tiene que frenar aunque haya una alerta)
  const char* orden = comandoPorAplicar;
  if (orden != nullptr) {
    comandoPorAplicar = nullptr;
    aplicarComando(orden);
    comandoEjecutado = orden;
  }

  // Alerta: queda frenado con el signo de peligro hasta que pase TIEMPO_ALERTA
  if (enAlerta) {
    if (ahora - inicioAlerta >= TIEMPO_ALERTA) {
      enAlerta = false;
      sonidoAlarma(false);
      pintarTodo(FONDO);   // se borra el signo
      Serial.println("Fin de la alerta");
    }
    return;   // mientras hay alerta, no se mueve
  }

  if (!patrullando) return;

  // ---- Obstaculo adelante: frena hasta que se despeje ----
  if (hayDistancia) {
    distanciaMm = sensorDistancia.readRangeContinuousMillimeters();
    bool cerca = !sensorDistancia.timeoutOccurred() && distanciaMm < DISTANCIA_MINIMA;
    if (cerca && !hayObstaculo) { frenar(); Serial.println("Obstaculo!"); }
    hayObstaculo = cerca;
    if (hayObstaculo) return;
  }

  // ---- Seguir la linea negra ----
  // Los 2 sensores van uno a cada lado de la linea (la linea queda en el medio).
  // Estos sensores dan un numero BAJO sobre negro (0) y ALTO sobre blanco (~3800).
  bool negroIzq = analogRead(SENSOR_IZQ) < UMBRAL_NEGRO;
  bool negroDer = analogRead(SENSOR_DER) < UMBRAL_NEGRO;

  revisarMarca(negroIzq && negroDer, ahora);

  if (negroIzq && !negroDer)      girarIzq();   // se fue a la derecha: corrige a la izquierda
  else if (negroDer && !negroIzq) girarDer();   // se fue a la izquierda: corrige a la derecha
  else                            adelante();   // linea en el medio (o cruce): sigue derecho
}
