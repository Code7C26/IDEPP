// =============================================================
// walle_camara.ino
// Hace que la ESP32-CAM transmita video por WiFi, igual que la app
// IP Webcam del celular. La IA de la compu lo lee desde:
//   http://droid-camara.local/video   (o http://IP_DE_LA_CAMARA/video)
//
// Placa: AI Thinker ESP32-CAM   ·   Cámara: OV3660
// El WiFi se elige desde el celular (ver config_wifi.h): si la cámara no tiene uno
// guardado, crea la red "DROID-E3D-Camara" (clave droid-e3d) y prende su lucecita roja.
// Para elegir otro WiFi: http://droid-camara.local/olvidar-wifi
// =============================================================

#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"
#include "config_wifi.h"

// ---------- Configuración ----------

// Tamaño de la imagen: FRAMESIZE_QVGA (320x240), FRAMESIZE_VGA (640x480) o FRAMESIZE_SVGA (800x600).
// Más grande ayuda a reconocer caras, pero el video va más lento y la cámara calienta más.
// 2026-11-15: con QVGA la IA ve muy poco (40 % y no reconoce el chaleco de cuerpo entero):
// se vuelve a VGA, pero con el límite de fotos por segundo de abajo para que caliente menos.
const framesize_t TAMANO_IMAGEN = FRAMESIZE_VGA;

// Fotos por segundo como máximo. Más no sirve: la IA de la compu analiza unas 2 o 3 por segundo,
// y mandar menos hace que la cámara caliente menos.
const int FOTOS_POR_SEGUNDO_MAX = 5;

// Calidad de la imagen: de 10 (mejor) a 63 (peor)
const int CALIDAD_JPEG = 12;

// ---------- Pines de la cámara en la ESP32-CAM (no hace falta tocarlos) ----------

const int PIN_LED_FLASH = 4;
const int PIN_LED_ROJO = 33;   // la lucecita roja de atrás: se prende con LOW

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

    delay(1000 / FOTOS_POR_SEGUNDO_MAX);  // una pausa para no recalentar la cámara
  }
}

// Mientras espera que le elijan el WiFi desde el celular, prende la lucecita roja
void avisoConfigurarWifi(bool esperando) {
  pinMode(PIN_LED_ROJO, OUTPUT);
  digitalWrite(PIN_LED_ROJO, esperando ? LOW : HIGH);
}

// /olvidar-wifi: borra el WiFi guardado y reinicia (vuelve a crear su red)
esp_err_t olvidarWifi(httpd_req_t* pedido) {
  const char* texto = "Listo: la camara se reinicia y crea la red DROID-E3D-Camara para elegir otro WiFi";
  httpd_resp_send(pedido, texto, HTTPD_RESP_USE_STRLEN);
  delay(500);
  ConfigWifi::olvidar();
  ESP.restart();
  return ESP_OK;
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

  httpd_uri_t rutaOlvidar = {};
  rutaOlvidar.uri = "/olvidar-wifi";
  rutaOlvidar.method = HTTP_GET;
  rutaOlvidar.handler = olvidarWifi;
  httpd_register_uri_handler(servidor, &rutaOlvidar);
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

  ConfigWifi::conectar("Camara", "droid-camara", avisoConfigurarWifi);

  iniciarServidor();

  Serial.println("Listo. Video en: http://droid-camara.local/video (o http://" + WiFi.localIP().toString() + "/video)");
}

void loop() {
  // Repetimos la dirección cada 5 segundos, por si abrimos el monitor tarde
  Serial.print("Video en: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/video");
  delay(5000);
}
