// Prueba de la cámara ESP32-CAM. Este código se carga en el ESP32-S3, NO en la cámara.
// El S3 mide el voltaje del pin U0T de la cámara y le manda un "saludo".
// Si la cámara está en modo carga (IO0 unido a GND), tiene que contestar.

const int PIN_RX = 2;  // va al pin U0T de la cámara
const int PIN_TX = 1;  // va al pin U0R de la cámara
const int VELOCIDAD = 115200;

// El saludo que entiende el chip de la cámara cuando está en modo carga
byte saludo[46] = {0xC0, 0x00, 0x08, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x07, 0x12, 0x20};

int numeroPrueba = 0;

// Mide el voltaje que manda la cámara por su pin U0T
int medirVoltaje() {
  Serial1.end();
  pinMode(PIN_RX, INPUT_PULLDOWN);  // si nadie manda voltaje, el pin queda en 0
  delay(20);
  int milivoltios = analogReadMilliVolts(PIN_RX);
  Serial1.begin(VELOCIDAD, SERIAL_8N1, PIN_RX, PIN_TX);
  return milivoltios;
}

void setup() {
  Serial.begin(VELOCIDAD);

  // Completa el saludo: 32 veces el valor 0x55 y la marca de cierre 0xC0
  for (int i = 13; i < 45; i++) saludo[i] = 0x55;
  saludo[45] = 0xC0;

  Serial1.setRxBufferSize(4096);
  Serial1.begin(VELOCIDAD, SERIAL_8N1, PIN_RX, PIN_TX);
}

void loop() {
  numeroPrueba++;
  int milivoltios = medirVoltaje();

  // Tira lo que haya llegado antes y manda el saludo
  while (Serial1.available()) Serial1.read();
  Serial1.write(saludo, sizeof(saludo));
  delay(300);

  // Cuenta los bytes recibidos y busca la respuesta al saludo (C0 01 08)
  int bytesRecibidos = 0;
  int coincidencias = 0;
  bool contesto = false;
  while (Serial1.available()) {
    byte dato = Serial1.read();
    bytesRecibidos++;
    if (coincidencias == 0 && dato == 0xC0) coincidencias = 1;
    else if (coincidencias == 1 && dato == 0x01) coincidencias = 2;
    else if (coincidencias == 2 && dato == 0x08) contesto = true;
    else coincidencias = (dato == 0xC0) ? 1 : 0;
  }

  Serial.print("Prueba ");
  Serial.print(numeroPrueba);
  Serial.print(" | Voltaje U0T: ");
  Serial.print(milivoltios);
  Serial.print(" mV | Bytes recibidos: ");
  Serial.print(bytesRecibidos);
  Serial.print(" | Contesto: ");
  Serial.println(contesto ? "SI, LA CAMARA ANDA" : "no");

  delay(1700);
}
