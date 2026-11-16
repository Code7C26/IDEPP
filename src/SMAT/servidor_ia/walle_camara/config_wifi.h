// ============================================================
//  DROID-E3D · Configurar el WiFi desde el celular
//
//  Para qué sirve: así no hay que volver a cargar el programa en cada fábrica.
//
//  Cómo funciona:
//  1. Al prender, el equipo intenta conectarse al WiFi que tiene guardado.
//  2. Si no tiene ninguno guardado, o no lo encuentra (por ejemplo, porque está en
//     otra fábrica), crea su PROPIA red WiFi: "DROID-E3D-<equipo>", con la clave
//     "droid-e3d".
//  3. Te conectás a esa red con el celular y se abre sola una página (si no se
//     abre, entrá a http://192.168.4.1). Elegís el WiFi de la fábrica, escribís la
//     clave y tocás Guardar.
//  4. El equipo guarda los datos (no se borran al apagarlo), se reinicia y se conecta.
//
//  Además, ya conectado, el equipo se puede encontrar por un nombre fijo en vez de
//  por su IP (que cambia en cada WiFi): http://<nombre>.local
//
//  Este mismo archivo está copiado en robot_droid (robot) y walle_camara (cámara):
//  si se cambia uno, copiar el otro.
// ============================================================
#pragma once

#include <WiFi.h>
#include <Preferences.h>
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <esp_http_server.h>

namespace ConfigWifi {

const char* CLAVE_RED_PROPIA = "droid-e3d";        // clave de la red que crea el equipo
const unsigned long ESPERA_CONEXION_MS = 20000;    // cuánto intenta conectarse antes de crear su red

// Lo que avisa el equipo mientras espera que lo configuren (el robot pinta la
// pantalla, la cámara prende su lucecita). true = esperando, false = ya está.
typedef void (*AvisoEspera)(bool esperando);

Preferences memoria;   // guarda datos que no se borran al apagar
DNSServer dns;         // hace que el celular abra la página sola
volatile bool listo = false;
String nombreEquipo;
String redesEncontradas;   // las opciones de la lista de redes, ya armadas en HTML

String leer(const char* dato) {
  memoria.begin("wifi", true);
  String valor = memoria.getString(dato, "");
  memoria.end();
  return valor;
}

void guardar(const String& red, const String& clave) {
  memoria.begin("wifi", false);
  memoria.putString("red", red);
  memoria.putString("clave", clave);
  memoria.end();
}

// Borra el WiFi guardado: al reiniciar, el equipo vuelve a crear su red
void olvidar() {
  memoria.begin("wifi", false);
  memoria.clear();
  memoria.end();
}

bool intentarConectar(const String& red, const String& clave) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(red.c_str(), clave.c_str());
  Serial.print("Conectando a " + red);
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < ESPERA_CONEXION_MS) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

// Para mostrar en la página nombres de redes con símbolos raros sin romperla
String sinSimbolos(const String& texto) {
  String r;
  for (char c : texto) {
    if (c == '&') r += "&amp;";
    else if (c == '<') r += "&lt;";
    else if (c == '>') r += "&gt;";
    else if (c == '"') r += "&quot;";
    else r += c;
  }
  return r;
}

// Los formularios mandan los espacios como "+" y los símbolos como "%XX"
String decodificar(const String& texto) {
  String r;
  for (size_t i = 0; i < texto.length(); i++) {
    char c = texto[i];
    if (c == '+') r += ' ';
    else if (c == '%' && i + 2 < texto.length()) {
      r += (char)strtol(texto.substring(i + 1, i + 3).c_str(), nullptr, 16);
      i += 2;
    } else r += c;
  }
  return r;
}

String datoDelFormulario(const String& cuerpo, const String& nombre) {
  int inicio = cuerpo.indexOf(nombre + "=");
  if (inicio < 0) return "";
  inicio += nombre.length() + 1;
  int fin = cuerpo.indexOf('&', inicio);
  return decodificar(cuerpo.substring(inicio, fin < 0 ? cuerpo.length() : fin));
}

String pagina(const String& contenido) {
  return "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
         "<meta name='viewport' content='width=device-width,initial-scale=1'><title>DROID-E3D</title>"
         "<style>body{font-family:system-ui,sans-serif;background:#2b2b2b;color:#f4f1eb;margin:0;padding:24px;border-top:6px solid #f7931e}"
         "h1{font-size:1.4rem;margin:0 0 4px;font-style:italic;font-weight:900}h1 span{color:#f7931e}p{color:#a8a29e}label{display:block;margin:16px 0 6px}"
         "select,input{width:100%;box-sizing:border-box;padding:12px;font-size:1rem;border-radius:8px;border:1px solid #4a4744;background:#383533;color:#f4f1eb}"
         "button{margin-top:20px;width:100%;padding:14px;font-size:1.1rem;font-weight:bold;border:0;border-radius:8px;background:#f7931e;color:#2b2b2b;box-shadow:3px 3px 0 #f4f1eb}"
         "</style></head><body><h1>DROID-<span>E3D</span> · " + nombreEquipo + "</h1>" + contenido + "</body></html>";
}

esp_err_t mostrarFormulario(httpd_req_t* pedido) {
  String html = pagina(
      "<p>Elegí el WiFi de la fábrica y escribí su clave.</p>"
      "<form method='post' action='/guardar'>"
      "<label>Red WiFi</label><select name='red'>" + redesEncontradas + "</select>"
      "<label>¿No está en la lista? Escribí el nombre</label><input name='otra' placeholder='(opcional)'>"
      "<label>Clave del WiFi</label><input name='clave' type='password'>"
      "<button>Guardar</button></form>");
  httpd_resp_set_type(pedido, "text/html");
  return httpd_resp_send(pedido, html.c_str(), html.length());
}

esp_err_t guardarFormulario(httpd_req_t* pedido) {
  char cuerpo[512];
  int leidos = httpd_req_recv(pedido, cuerpo, min((int)pedido->content_len, (int)sizeof(cuerpo) - 1));
  cuerpo[leidos > 0 ? leidos : 0] = 0;
  String datos(cuerpo);
  String red = datoDelFormulario(datos, "otra");
  if (red.length() == 0) red = datoDelFormulario(datos, "red");
  String clave = datoDelFormulario(datos, "clave");
  if (red.length() == 0) return mostrarFormulario(pedido);

  guardar(red, clave);
  String html = pagina("<p>Listo. El equipo se reinicia y se conecta a <b>" + sinSimbolos(red) +
                       "</b>.</p><p>Ya podés volver a conectar el celular al WiFi de la fábrica.</p>");
  httpd_resp_set_type(pedido, "text/html");
  httpd_resp_send(pedido, html.c_str(), html.length());
  listo = true;
  return ESP_OK;
}

// Crea la red propia y espera a que alguien elija el WiFi. Al terminar, reinicia.
void esperarConfiguracion(AvisoEspera aviso) {
  // Primero busca las redes que hay alrededor, para mostrarlas en una lista
  WiFi.mode(WIFI_AP_STA);
  int cantidad = WiFi.scanNetworks();
  redesEncontradas = "";
  for (int i = 0; i < cantidad; i++) {
    String red = WiFi.SSID(i);
    if (red.length() == 0 || redesEncontradas.indexOf(">" + sinSimbolos(red) + "<") >= 0) continue;
    redesEncontradas += "<option>" + sinSimbolos(red) + "</option>";
  }

  String nombreRed = "DROID-E3D-" + nombreEquipo;
  WiFi.softAP(nombreRed.c_str(), CLAVE_RED_PROPIA);
  dns.start(53, "*", WiFi.softAPIP());   // cualquier página que pida el celular, viene acá
  Serial.println("Sin WiFi: conectate a la red \"" + nombreRed + "\" (clave " + CLAVE_RED_PROPIA +
                 ") y entrá a http://" + WiFi.softAPIP().toString());

  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.uri_match_fn = httpd_uri_match_wildcard;
  httpd_handle_t servidor = NULL;
  httpd_start(&servidor, &config);
  httpd_uri_t rutaGuardar = {};
  rutaGuardar.uri = "/guardar";
  rutaGuardar.method = HTTP_POST;
  rutaGuardar.handler = guardarFormulario;
  httpd_register_uri_handler(servidor, &rutaGuardar);
  httpd_uri_t rutaTodo = {};
  rutaTodo.uri = "/*";
  rutaTodo.method = HTTP_GET;
  rutaTodo.handler = mostrarFormulario;
  httpd_register_uri_handler(servidor, &rutaTodo);

  if (aviso) aviso(true);
  while (!listo) {
    dns.processNextRequest();
    delay(10);
  }
  delay(2000);   // le da tiempo a la página de "Listo" a llegar al celular
  ESP.restart();
}

// Conecta al WiFi guardado; si no puede, crea la red propia para configurarlo.
//   equipo:      nombre que se ve en la red propia ("Robot" → "DROID-E3D-Robot")
//   nombreEnRed: nombre fijo para encontrarlo ("droid-robot" → http://droid-robot.local)
void conectar(const char* equipo, const char* nombreEnRed, AvisoEspera aviso) {
  nombreEquipo = equipo;
  String red = leer("red");
  if (red.length() == 0 || !intentarConectar(red, leer("clave"))) {
    Serial.println(red.length() == 0 ? "No hay WiFi guardado." : "No encuentro el WiFi guardado.");
    esperarConfiguracion(aviso);   // no vuelve: termina reiniciando
  }
  WiFi.setSleep(false);   // así responde rápido (y el video de la cámara no se traba)
  if (MDNS.begin(nombreEnRed)) MDNS.addService("http", "tcp", 80);
  else Serial.println("No pude activar el nombre " + String(nombreEnRed) + ".local: usar la IP");
  Serial.println("Conectado a " + red + " · IP " + WiFi.localIP().toString() +
                 " · también: http://" + String(nombreEnRed) + ".local");
}

}  // namespace ConfigWifi
