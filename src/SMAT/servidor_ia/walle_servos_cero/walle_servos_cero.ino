#include <Wire.h>

const int PIN_SDA = 8;
const int PIN_SCL = 9;

const int ANGULO_INICIAL = 90;

const int CANTIDAD_SERVOS = 16;


const int PULSO_MIN = 500;   // 0°
const int PULSO_MAX = 2500;  // 180°



const uint8_t DIRECCION_PCA = 0x40;  // dirección I2C de fábrica
const uint8_t REG_MODE1 = 0x00;      // registro de configuración
const uint8_t REG_PRESCALE = 0xFE;   // registro que fija la frecuencia
const uint8_t REG_CANAL0 = 0x06;     // primer registro del canal 0

// Escribe un byte en un registro del PCA9685
void escribirRegistro(uint8_t registro, uint8_t valor) {
  Wire.beginTransmission(DIRECCION_PCA);
  Wire.write(registro);
  Wire.write(valor);
  Wire.endTransmission();
}

// Prepara el PCA9685 para mandar pulsos a 50 Hz (lo que usan los servos)
void iniciarPCA9685() {
  escribirRegistro(REG_MODE1, 0x10);     // lo dormimos para poder cambiar la frecuencia
  escribirRegistro(REG_PRESCALE, 121);   // 25 MHz / (4096 * 50 Hz) - 1 = 121
  escribirRegistro(REG_MODE1, 0x20);     // lo despertamos (con auto-incremento)
  delay(5);
  escribirRegistro(REG_MODE1, 0xA0);     // reinicia las salidas
}

// Mueve un servo (canal 0 a 15) a un ángulo (0 a 180)
void moverServo(int canal, int angulo) {
  // Pasamos el ángulo a microsegundos de pulso
  long pulso = map(angulo, 0, 180, PULSO_MIN, PULSO_MAX);
  // Un ciclo de 50 Hz dura 20000 us y el PCA9685 lo divide en 4096 pasos
  int pasos = pulso * 4096 / 20000;

  // Cada canal tiene 4 registros: ON (cuándo prende) y OFF (cuándo apaga)
  Wire.beginTransmission(DIRECCION_PCA);
  Wire.write(REG_CANAL0 + 4 * canal);
  Wire.write(0);              // ON bajo: prende al principio del ciclo
  Wire.write(0);              // ON alto
  Wire.write(pasos & 0xFF);   // OFF bajo: apaga después de "pasos"
  Wire.write(pasos >> 8);     // OFF alto
  Wire.endTransmission();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("WALL-E: centrando servos...");

  Wire.begin(PIN_SDA, PIN_SCL);

  // Revisamos que el PCA9685 conteste antes de seguir
  Wire.beginTransmission(DIRECCION_PCA);
  if (Wire.endTransmission() != 0) {
    Serial.println("ERROR: no encuentro el PCA9685. Revisá SDA, SCL, VCC y GND.");
    return;
  }

  iniciarPCA9685();

  // Prueba de vida: los servos se mueven un poquito (80° <-> 100°) 3 veces,
  // así vemos que funcionan sin forzar las piezas ya montadas
  Serial.println("Prueba: moviendo un poquito los servos");
  for (int vez = 0; vez < 3; vez++) {
    for (int canal = 0; canal < CANTIDAD_SERVOS; canal++) moverServo(canal, ANGULO_INICIAL - 10);
    delay(500);
    for (int canal = 0; canal < CANTIDAD_SERVOS; canal++) moverServo(canal, ANGULO_INICIAL + 10);
    delay(500);
  }

  // Mandamos todos los servos al ángulo inicial, de a uno
  for (int canal = 0; canal < CANTIDAD_SERVOS; canal++) {
    moverServo(canal, ANGULO_INICIAL);
    Serial.print("Servo ");
    Serial.print(canal);
    Serial.print(" -> ");
    Serial.print(ANGULO_INICIAL);
    Serial.println(" grados");
    delay(200);  // de a uno, así no piden toda la corriente juntos
  }

  Serial.println("Listo: ya podés colocar los brazos de los servos.");
}

void loop() {
  // El PCA9685 sigue mandando el pulso solo y los servos se quedan firmes.
  // Cada 2 segundos avisamos si el PCA9685 contesta, para poder revisarlo
  // aunque abramos el Monitor Serie tarde.
  Wire.beginTransmission(DIRECCION_PCA);
  if (Wire.endTransmission() == 0) {
    Serial.println("OK: el PCA9685 contesta. Servos en " + String(ANGULO_INICIAL) + " grados.");
  } else {
    Serial.println("ERROR: no encuentro el PCA9685. Revisá SDA (GPIO 8), SCL (GPIO 9), VCC y GND.");
  }
  delay(2000);
}
