// Hace girar los dos motores sin parar, para adelante, con el driver TB6612FNG.

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
const int VELOCIDAD = 255;        // cambiá este número para que giren más lento

void setup() {
  Serial.begin(115200);

  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_BIN1, OUTPUT);
  pinMode(PIN_BIN2, OUTPUT);
  pinMode(PIN_STBY, OUTPUT);

  ledcAttach(PIN_PWMA, FRECUENCIA_PWM, RESOLUCION_PWM);
  ledcAttach(PIN_PWMB, FRECUENCIA_PWM, RESOLUCION_PWM);

  // Los dos motores hacia adelante
  digitalWrite(PIN_AIN1, HIGH);
  digitalWrite(PIN_AIN2, LOW);
  digitalWrite(PIN_BIN1, HIGH);
  digitalWrite(PIN_BIN2, LOW);

  ledcWrite(PIN_PWMA, VELOCIDAD);
  ledcWrite(PIN_PWMB, VELOCIDAD);

  digitalWrite(PIN_STBY, HIGH);  // recién acá se prende el driver
}

void loop() {
  Serial.println("Motores girando");
  delay(2000);
}
