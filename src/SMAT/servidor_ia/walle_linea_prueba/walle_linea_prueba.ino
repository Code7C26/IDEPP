// =====================================================================
// PRUEBA DE LOS SEGUIDORES DE LINEA ("Tracker Sensor") · WALL-E con ESP32-S3
// =====================================================================
// Cada sensor tira luz infrarroja al piso y mira cuanta vuelve:
//   - piso BLANCO: rebota mucha luz
//   - linea NEGRA: la absorbe y casi no vuelve nada
// Asi el robot sabe si esta arriba de la linea.
//
// Conexiones (todo DESENCHUFADO mientras conectas):
//   Sensor IZQUIERDO:  V+ (o VCC) -> 3V3 · G (o GND) -> GND · S (u OUT / DO) -> GPIO 4
//   Sensor DERECHO:    V+ (o VCC) -> 3V3 · G (o GND) -> GND · S (u OUT / DO) -> GPIO 5
//   IMPORTANTE: V+ al 3V3 (NO al 5V), asi la senal nunca pasa de 3,3 V y no dania el ESP32.
//
// Se ve en el Monitor Serie (115200). Recorda: Tools -> USB CDC On Boot -> Enabled.
// =====================================================================

const int SENSOR_IZQ = 4;
const int SENSOR_DER = 5;

// Lo que lee el ESP32 va de 0 (0 V) a 4095 (3,3 V). La mitad separa "bajo" de "alto".
const int MITAD = 2000;

// Traduce el numero a palabras. Probado el 10/11 con los "Tracker Sensor" del WALL-E:
//   NEGRO = 0 (senal BAJA)   ·   BLANCO = ~3800 (senal ALTA)
// Por eso va false. Si cambias de sensor y sale al reves, pone true.
const bool ALTO_ES_NEGRO = false;

String color(int valor) {
  bool alto = valor > MITAD;
  return (alto == ALTO_ES_NEGRO) ? "NEGRO " : "blanco";
}

void setup() {
  Serial.begin(115200);
  delay(2000);   // tiempo para abrir el Monitor Serie
  Serial.println("\n=== Prueba de los seguidores de linea ===");
  Serial.println("Pasa un papel blanco y una cinta aislante negra debajo de cada sensor (a 1 cm).");
}

void loop() {
  int izq = analogRead(SENSOR_IZQ);
  int der = analogRead(SENSOR_DER);

  Serial.print("Izquierdo: ");
  Serial.print(color(izq));
  Serial.print(" (");
  Serial.print(izq);
  Serial.print(")    Derecho: ");
  Serial.print(color(der));
  Serial.print(" (");
  Serial.print(der);
  Serial.println(")");

  delay(300);
}
