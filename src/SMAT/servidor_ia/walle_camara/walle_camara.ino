// =============================================================
// walle_camara.ino
// Hace que la ESP32-CAM transmita video por WiFi, igual que la app
// IP Webcam del celular. La IA de la compu lo lee desde:
//   http://IP_DE_LA_CAMARA/video
//
// Placa: AI Thinker ESP32-CAM   ·   Cámara: OV3660
// El nombre y la clave del WiFi van en secretos.h (no se sube a GitHub).
// Para crearlo: copiar secretos.example.h como secretos.h y poner tus datos.
// =============================================================

#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"
#include "secretos.h"

// ---------- Configuración ----------

// Tamaño de la imagen: FRAMESIZE_VGA (640x480) o FRAMESIZE_SVGA (800x600).
// Más grande ayuda a reconocer caras, pero el video va más lento.
const framesize_t TAMANO_IMAGEN = FRAMESIZE_VGA;

// Calidad de la imagen: de 10 (mejor) a 63 (peor)
const int CALIDAD_JPEG = 12;

// ---------- Pines de la cámara en la ESP32-CAM (no hace falta tocarlos) ----------

const int PIN_LED_FLASH = 4;

// ---------- Datos que manda el video (no hace falta tocarlos) ----------

const char* TIPO_VIDEO = "multipart/x-mixed-replace;boundary=cuadro";
const char* SEPARADOR = "\r\n--cuadro\r\n";

// Enciende la cámara. Devuelve true si anduvo.
bool iniciarCamara() {
  camera_config_t config = {};
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.pin_xclk = 0;
  config.pin_sccb_sda = 26;
  config.pin_sccb_scl = 27;
  config.pin_d7 = 35;
  config.pin_d6 = 34;
  config.pin_d5 = 39;
  config.pin_d4 = 36;
  config.pin_d3 = 21;
  config.pin_d2 = 19;
  config.pin_d1 = 18;
  config.pin_d0 = 5;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_pclk = 22;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;  // la cámara ya entrega fotos comprimidas
  config.frame_size = TAMANO_IMAGEN;
  config.jpeg_quality = CALIDAD_JPEG;
  config.fb_count = 2;                   // guardamos 2 fotos en la memoria extra
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.grab_mode = CAMERA_GRAB_LATEST; // siempre mandamos la foto más nueva

  return esp_camera_init(&config) == ESP_OK;
}

// Se ejecuta cuando alguien abre /video: manda fotos una atrás de la otra
esp_err_t mandarVideo(httpd_req_t* pedido) {
  httpd_resp_set_type(pedido, TIPO_VIDEO);

  while (true) {
    camera_fb_t* foto = esp_camera_fb_get();
    if (!foto) {
      Serial.println("ERROR: no pude sacar una foto.");
      return ESP_FAIL;
    }

    // Cada foto va con un encabezado que dice qué es y cuánto pesa
    char encabezado[64];
    int largo = snprintf(encabezado, sizeof(encabezado),
                         "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", foto->len);

    esp_err_t resultado = httpd_resp_send_chunk(pedido, SEPARADOR, strlen(SEPARADOR));
    if (resultado == ESP_OK) resultado = httpd_resp_send_chunk(pedido, encabezado, largo);
    if (resultado == ESP_OK) resultado = httpd_resp_send_chunk(pedido, (const char*)foto->buf, foto->len);

    esp_camera_fb_return(foto);  // devolvemos la memoria para la próxima foto

    // Si falla, es porque cerraron la conexión: dejamos de mandar
    if (resultado != ESP_OK) return resultado;
  }
}

// Arranca el servidor web y publica la dirección /video
void iniciarServidor() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  httpd_handle_t servidor = NULL;

  if (httpd_start(&servidor, &config) != ESP_OK) {
    Serial.println("ERROR: no pude iniciar el servidor web.");
    return;
  }

  httpd_uri_t rutaVideo = {};
  rutaVideo.uri = "/video";
  rutaVideo.method = HTTP_GET;
  rutaVideo.handler = mandarVideo;
  httpd_register_uri_handler(servidor, &rutaVideo);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("WALL-E: iniciando la camara...");

  // Dejamos apagado el flash de la placa
  pinMode(PIN_LED_FLASH, OUTPUT);
  digitalWrite(PIN_LED_FLASH, LOW);

  if (!iniciarCamara()) {
    Serial.println("ERROR: no encuentro la camara. Revisá que la cinta naranja esté bien puesta.");
    return;
  }
  Serial.println("Camara OK.");

  WiFi.begin(WIFI_NOMBRE, WIFI_CLAVE);
  WiFi.setSleep(false);  // sin esto, el video se traba
  Serial.print("Conectando al WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  iniciarServidor();

  Serial.print("Listo. Video en: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/video");
}

void loop() {
  // Repetimos la dirección cada 5 segundos, por si abrimos el monitor tarde
  Serial.print("Video en: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/video");
  delay(5000);
}
