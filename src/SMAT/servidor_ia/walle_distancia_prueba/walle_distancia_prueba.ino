// =====================================================================
// PRUEBA DEL SENSOR DE DISTANCIA (VL53L0X, laser) · WALL-E con ESP32-S3
// =====================================================================
// Conexiones (todo DESENCHUFADO mientras conectas):
//   Sensor VIN -> 3V3 del S3
//   Sensor GND -> GND del S3
//   Sensor SDA -> GPIO 8   (el mismo cable de datos que usa la placa de los servos PCA9685)
//   Sensor SCL -> GPIO 9   (el mismo cable de reloj que usa la PCA9685)
//   XSHUT y GPIO1 del sensor: sin conectar.
//
// Que hace:
//   1. Busca todo lo que hay conectado en SDA/SCL y muestra su "direccion":
//        0x29 = sensor de distancia VL53L0X · 0x40 = placa de servos PCA9685
//   2. Si encuentra el sensor, muestra la distancia en milimetros 5 veces por segundo.
// Se ve en el Monitor Serie (115200).
// Libreria: VL53L0X de Pololu (ya instalada, la usaba el robot viejo).
// =====================================================================
#include <Wire.h>
#include <VL53L0X.h>

const int PIN_SDA = 8;
const int PIN_SCL = 9;

VL53L0X sensor;
bool hayLaser = false;

// Recorre todas las direcciones posibles y avisa cuales contestan
void buscarDispositivos() {
  Serial.println("Buscando dispositivos en SDA=8 / SCL=9...");
  int encontrados = 0;
  for (byte direccion = 1; direccion < 127; direccion++) {
    Wire.beginTransmission(direccion);
    if (Wire.endTransmission() == 0) {   // 0 = alguien contesto
      Serial.print("  Encontrado en 0x");
      Serial.print(direccion, HEX);
      if (direccion == 0x29) Serial.print("  -> sensor de distancia VL53L0X");
      if (direccion == 0x40) Serial.print("  -> placa de servos PCA9685");
      if (direccion == 0x70) Serial.print("  -> PCA9685 (direccion para todas)");
      Serial.println();
      if (direccion == 0x29) hayLaser = true;
      encontrados++;
    }
  }
  if (encontrados == 0) {
    Serial.println("  No hay nada conectado. Revisa SDA->8, SCL->9, VIN->3V3 y GND.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);   // tiempo para abrir el Monitor Serie
  Serial.println("\n=== Prueba del sensor de distancia ===");

  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);   // velocidad "normal" (100 kHz): mas segura con cables dupont largos
  buscarDispositivos();

  if (!hayLaser) {
    Serial.println("No encontre el VL53L0X (0x29). Si aparecio otra direccion, pasamela.");
    return;
  }

  // Arrancar el sensor: a veces falla la primera vez, asi que se prueba hasta 5 veces
  sensor.setTimeout(500);
  bool arranco = false;
  for (int intento = 1; intento <= 5 && !arranco; intento++) {
    delay(100);
    arranco = sensor.init();
    if (!arranco) {
      Serial.print("  Intento ");
      Serial.print(intento);
      Serial.println(": no arranco, pruebo de nuevo...");
    }
  }
  if (!arranco) {
    // Con este sensor falla el ultimo paso del arranque (la calibracion).
    // Igual seguimos: casi todo quedo configurado y asi vemos si mide.
    Serial.println("El arranque no termino bien (calibracion). Sigo igual para ver si mide.");
    // Hacemos a mano el ultimo paso que la libreria saltea cuando falla:
    // volver a dejar el sensor configurado para medir distancia.
    sensor.writeReg(VL53L0X::SYSTEM_SEQUENCE_CONFIG, 0xE8);
  }
  sensor.startContinuous();   // mide sin parar
  Serial.println("Sensor listo. Acerca y aleja la mano.");
}

void loop() {
  if (!hayLaser) {
    delay(1000);
    return;
  }
  int mm = sensor.readRangeContinuousMillimeters();
  if (sensor.timeoutOccurred()) {
    Serial.println("El sensor no respondio a tiempo.");
  } else if (mm > 2000) {
    // 8190 u 8191 = el laser no recibio ningun rebote
    Serial.print("Nada adelante (mas de 2 metros)   [numero crudo: ");
    Serial.print(mm);
    Serial.println("]");
  } else {
    Serial.print("Distancia: ");
    Serial.print(mm);
    Serial.print(" mm");
    if (mm < 200) Serial.print("   <- MUY CERCA: el robot frenaria");
    Serial.println();
  }
  delay(200);
}
