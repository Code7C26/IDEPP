// Copiá este archivo como secretos.h y poné tus datos del WiFi.
// secretos.h no se sube a GitHub. El WiFi tiene que ser de 2.4 GHz.
const char* WIFI_NOMBRE = "NOMBRE_DE_TU_WIFI";
const char* WIFI_CLAVE  = "CLAVE_DE_TU_WIFI";

// Conexion con la web. Sin estas 3 lineas, el robot anda igual pero sin la web.
// IP de la PC con el backend (la misma de la demo, con /api al final):
#define URL_BACKEND "http://192.168.0.10:5000/api"
// La ROBOT_API_KEY de src/SMAT/backend/.env (te la pasa Toro por fuera de GitHub):
#define ROBOT_API_KEY "PEGAR_ROBOT_API_KEY"
// Id de la zona que informa hasta leer la ruta de la web (Zona A = 1). Despues la zona
// sale de la ruta y de las marcas del piso. La web la necesita para saber donde paso
// cada alerta y que maquina detener:
#define ZONA_DEL_ROBOT 1
