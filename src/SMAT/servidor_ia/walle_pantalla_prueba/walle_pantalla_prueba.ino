// =============================================================
// walle_pantalla_prueba.ino
// Prueba la pantalla cuadrada de 1,54" (controlador ST7789, 240x240):
// la pinta de rojo, verde, azul y blanco, una y otra vez.
//
// Placa: ESP32-S3
// No necesita librerías extra: le hablamos a la pantalla con SPI.
// =============================================================

#include <SPI.h>

// ---------- Pines del ESP32-S3 que van a la pantalla ----------

const int PIN_SCL = 12;  // reloj: marca el ritmo de los datos
const int PIN_SDA = 11;  // datos: por acá viajan los colores
const int PIN_RES = 14;  // reinicia la pantalla
const int PIN_DC = 13;   // avisa si mandamos una orden o un dato
const int PIN_BLK = 21;  // prende la luz de fondo

// ---------- Datos de la pantalla ----------

const int TAMANO = 240;  // cantidad de píxeles por lado

// Colores en formato RGB565 (el que usa esta pantalla)
const uint16_t ROJO = 0xF800;
const uint16_t VERDE = 0x07E0;
const uint16_t AZUL = 0x001F;
const uint16_t BLANCO = 0xFFFF;

// Manda una orden a la pantalla (DC en LOW = orden)
void enviarOrden(uint8_t orden) {
  digitalWrite(PIN_DC, LOW);
  SPI.transfer(orden);
}

// Manda un dato a la pantalla (DC en HIGH = dato)
void enviarDato(uint8_t dato) {
  digitalWrite(PIN_DC, HIGH);
  SPI.transfer(dato);
}

// Prepara la pantalla para empezar a dibujar
void iniciarPantalla() {
  // Reinicio: bajamos y subimos el pin RES
  digitalWrite(PIN_RES, LOW);
  delay(50);
  digitalWrite(PIN_RES, HIGH);
  delay(150);

  enviarOrden(0x11);  // la despertamos
  delay(150);
  enviarOrden(0x3A);  // formato de color...
  enviarDato(0x55);   // ...RGB565 (16 bits por píxel)
  enviarOrden(0x36);  // orientación...
  enviarDato(0x00);   // ...la normal
  enviarOrden(0x21);  // invierte los colores (estas pantallas lo necesitan)
  enviarOrden(0x13);  // modo normal
  enviarOrden(0x29);  // prende la imagen
  delay(50);
}

// Pinta toda la pantalla de un color
void pintar(uint16_t color) {
  // Elegimos la zona a pintar: columnas de 0 a 239...
  enviarOrden(0x2A);
  enviarDato(0);
  enviarDato(0);
  enviarDato(0);
  enviarDato(TAMANO - 1);
  // ...y filas de 0 a 239
  enviarOrden(0x2B);
  enviarDato(0);
  enviarDato(0);
  enviarDato(0);
  enviarDato(TAMANO - 1);

  // Mandamos el color de cada píxel
  enviarOrden(0x2C);
  digitalWrite(PIN_DC, HIGH);
  for (long i = 0; i < (long)TAMANO * TAMANO; i++) {
    SPI.transfer16(color);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("WALL-E: probando la pantalla...");

  pinMode(PIN_RES, OUTPUT);
  pinMode(PIN_DC, OUTPUT);
  pinMode(PIN_BLK, OUTPUT);
  digitalWrite(PIN_BLK, HIGH);  // prendemos la luz de fondo

  // Solo mandamos datos a la pantalla: no usamos el pin de lectura (-1)
  SPI.begin(PIN_SCL, -1, PIN_SDA, -1);
  // Las pantallas sin pin CS necesitan el modo 3 de SPI
  SPI.beginTransaction(SPISettings(20000000, MSBFIRST, SPI_MODE3));

  iniciarPantalla();
}

void loop() {
  Serial.println("Rojo");
  pintar(ROJO);
  delay(1000);

  Serial.println("Verde");
  pintar(VERDE);
  delay(1000);

  Serial.println("Azul");
  pintar(AZUL);
  delay(1000);

  Serial.println("Blanco");
  pintar(BLANCO);
  delay(1000);
}
