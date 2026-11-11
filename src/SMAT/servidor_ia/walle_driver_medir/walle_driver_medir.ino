// Prueba del driver TB6612FNG: deja las señales del motor A fijas para poder medirlas.
// Con el tester se tiene que leer cerca de 3,3V en PWMA, AIN1 y STBY, y 0V en AIN2.

const int PIN_PWMA = 18;
const int PIN_AIN1 = 39;
const int PIN_AIN2 = 40;
const int PIN_STBY = 41;

void setup() {
  Serial.begin(115200);

  pinMode(PIN_PWMA, OUTPUT);
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_STBY, OUTPUT);

  // Motor A hacia adelante a toda velocidad, sin PWM
  digitalWrite(PIN_AIN1, HIGH);
  digitalWrite(PIN_AIN2, LOW);
  digitalWrite(PIN_PWMA, HIGH);
  digitalWrite(PIN_STBY, HIGH);
}

void loop() {
  Serial.println("Motor A encendido: PWMA, AIN1 y STBY en alto; AIN2 en bajo");
  delay(2000);
}
