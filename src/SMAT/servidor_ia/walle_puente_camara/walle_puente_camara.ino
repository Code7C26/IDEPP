// =============================================================
// walle_puente_camara.ino
// Convierte el ESP32-S3 en un "puente": todo lo que llega desde la
// compu por USB se lo pasa a la ESP32-CAM por cable, y al revés.
// Sirve para subirle el código a la cámara, que no tiene USB.
//
// Placa: ESP32-S3
// =============================================================

// ---------- Pines del ESP32-S3 que van a la ESP32-CAM ----------

const int PIN_RX = 2;  // recibe: va al pin U0T de la cámara
const int PIN_TX = 1;  // envía: va al pin U0R de la cámara

const int VELOCIDAD = 115200;  // bits por segundo: la misma de los dos lados

void setup() {
  // Buffers grandes para no perder datos mientras viaja el código
  Serial.setRxBufferSize(4096);
  Serial1.setRxBufferSize(4096);

  Serial.begin(VELOCIDAD);
  Serial1.begin(VELOCIDAD, SERIAL_8N1, PIN_RX, PIN_TX);
}

void loop() {
  // De la compu a la cámara
  while (Serial.available()) {
    Serial1.write(Serial.read());
  }

  // De la cámara a la compu
  while (Serial1.available()) {
    Serial.write(Serial1.read());
  }
}
