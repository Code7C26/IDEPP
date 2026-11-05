// =============================================================
// walle_sonido_prueba.ino
// Prueba el parlantito de la placa "AIchat-Audio-Board":
// toca tres notas, hace una pausa y vuelve a empezar.
//
// Placa: ESP32-S3
// No necesita instalar nada: ESP_I2S viene incluida con el ESP32.
// =============================================================

#include <ESP_I2S.h>

// ---------- Pines del ESP32-S3 que van a la placa de audio ----------

const int PIN_BCLK = 15;   // reloj: marca el ritmo del sonido
const int PIN_LRCLK = 16;  // marca cada muestra de sonido
const int PIN_DIN = 17;    // datos: por acá viaja el sonido

// ---------- Datos del sonido ----------

const int MUESTRAS_POR_SEGUNDO = 16000;
const int VOLUMEN = 6000;  // de 0 a 32767: subilo si se escucha bajito

I2SClass i2s;

// Toca una nota: frecuencia en Hz (más alto = más agudo) y duración en milisegundos
void tocarNota(int frecuencia, int duracion) {
  long cantidad = (long)MUESTRAS_POR_SEGUNDO * duracion / 1000;
  int16_t bloque[256];  // juntamos varias muestras y las mandamos de una, así no se corta
  int enBloque = 0;

  for (long i = 0; i < cantidad; i++) {
    // Calculamos una onda: el sonido es aire que sube y baja muchas veces por segundo
    float tiempo = (float)i / MUESTRAS_POR_SEGUNDO;
    bloque[enBloque] = VOLUMEN * sin(2 * PI * frecuencia * tiempo);
    enBloque++;

    // Cuando el bloque se llena (o termina la nota), lo mandamos
    if (enBloque == 256 || i == cantidad - 1) {
      i2s.write((uint8_t *)bloque, enBloque * 2);  // cada muestra son 2 bytes
      enBloque = 0;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("WALL-E: probando el sonido...");

  i2s.setPins(PIN_BCLK, PIN_LRCLK, PIN_DIN);
  if (!i2s.begin(I2S_MODE_STD, MUESTRAS_POR_SEGUNDO, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO)) {
    Serial.println("ERROR: no pude iniciar el sonido (I2S).");
    return;
  }

  Serial.println("Listo: tiene que sonar.");
}

void loop() {
  tocarNota(523, 300);  // Do
  tocarNota(659, 300);  // Mi
  tocarNota(784, 300);  // Sol
  delay(1000);
}
