// Prueba del medidor: el ESP32-S3 lee el voltaje de su pin 2 de dos formas.
// Sirve para comprobar que la medición es correcta antes de usarla con la cámara.

const int PIN_MEDIR = 2;

void setup() {
  Serial.begin(115200);
}

void loop() {
  // Lectura digital: si nadie manda voltaje, el pin queda en BAJO
  pinMode(PIN_MEDIR, INPUT_PULLDOWN);
  delay(20);
  int nivel = digitalRead(PIN_MEDIR);

  // Lectura analógica: da el voltaje en milivoltios
  int milivoltios = analogReadMilliVolts(PIN_MEDIR);

  Serial.print("Pin 2 | Nivel: ");
  Serial.print(nivel == HIGH ? "ALTO" : "BAJO");
  Serial.print(" | Voltaje: ");
  Serial.print(milivoltios);
  Serial.println(" mV");

  delay(2000);
}
