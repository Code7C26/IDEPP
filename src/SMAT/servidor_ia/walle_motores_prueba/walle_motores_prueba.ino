// Prueba de los motores con el driver TB6612FNG.
// Mueve cada motor para un lado, frena y lo mueve para el otro.
// Levantá las ruedas del piso antes de probar.

// Motor A
const int PIN_PWMA = 18;  // velocidad
const int PIN_AIN1 = 39;  // sentido de giro
const int PIN_AIN2 = 40;  // sentido de giro

// Motor B
const int PIN_PWMB = 10;  // velocidad
const int PIN_BIN1 = 42;  // sentido de giro
const int PIN_BIN2 = 47;  // sentido de giro

const int PIN_STBY = 41;  // en HIGH el driver funciona, en LOW queda apagado

const int FRECUENCIA_PWM = 1000;  // veces por segundo que se prende y apaga la señal
const int RESOLUCION_PWM = 8;     // la velocidad va de 0 a 255
const int VELOCIDAD = 255;        // máxima, porque esta prueba usa solo 5V en VM

// Mueve un motor. sentido: 1 = adelante, -1 = atrás, 0 = frenado
void moverMotor(int pinPwm, int pinIn1, int pinIn2, int sentido) {
  digitalWrite(pinIn1, sentido == 1 ? HIGH : LOW);
  digitalWrite(pinIn2, sentido == -1 ? HIGH : LOW);
  ledcWrite(pinPwm, sentido == 0 ? 0 : VELOCIDAD);
}

// Prueba un motor completo y va avisando por el Monitor Serie
void probarMotor(const char* nombre, int pinPwm, int pinIn1, int pinIn2) {
  Serial.print(nombre);
  Serial.println(": adelante");
  moverMotor(pinPwm, pinIn1, pinIn2, 1);
  delay(2000);

  Serial.print(nombre);
  Serial.println(": frenado");
  moverMotor(pinPwm, pinIn1, pinIn2, 0);
  delay(1000);

  Serial.print(nombre);
  Serial.println(": atras");
  moverMotor(pinPwm, pinIn1, pinIn2, -1);
  delay(2000);

  Serial.print(nombre);
  Serial.println(": frenado");
  moverMotor(pinPwm, pinIn1, pinIn2, 0);
  delay(1000);
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_BIN1, OUTPUT);
  pinMode(PIN_BIN2, OUTPUT);
  pinMode(PIN_STBY, OUTPUT);

  ledcAttach(PIN_PWMA, FRECUENCIA_PWM, RESOLUCION_PWM);
  ledcAttach(PIN_PWMB, FRECUENCIA_PWM, RESOLUCION_PWM);

  // Arranca con los dos motores frenados y recién ahí prende el driver
  moverMotor(PIN_PWMA, PIN_AIN1, PIN_AIN2, 0);
  moverMotor(PIN_PWMB, PIN_BIN1, PIN_BIN2, 0);
  digitalWrite(PIN_STBY, HIGH);
}

void loop() {
  probarMotor("Motor A", PIN_PWMA, PIN_AIN1, PIN_AIN2);
  probarMotor("Motor B", PIN_PWMB, PIN_BIN1, PIN_BIN2);
}
