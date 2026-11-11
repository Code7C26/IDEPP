-- Ejecutar en MySQL / MariaDB (XAMPP) ANTES de iniciar Flask.
-- Es seguro correrlo en una base nueva. NO borra datos existentes (usa IF NOT EXISTS),
-- pero los datos de ejemplo del final solo se deben cargar UNA vez, en una base vacía.
-- Para empezar de cero:  DROP DATABASE robot_db;  y volver a correr este script.

-- Este archivo está en UTF-8. Sin esta línea, la consola de Windows lo lee como cp850
-- y los acentos se guardan mal (ej. "María" queda como "Mar├¡a").
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS robot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE robot_db;

CREATE TABLE IF NOT EXISTS zonas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    maquina VARCHAR(100),
    epp_requerido VARCHAR(200) DEFAULT '',          -- "casco,guantes,lentes"
    maquina_activa BOOLEAN DEFAULT TRUE,            -- FALSE = la máquina debe estar parada
    grilla_x INT DEFAULT 0,                         -- posición en el mapa de la fábrica
    grilla_y INT DEFAULT 0,
    ancho INT DEFAULT 2,
    alto INT DEFAULT 2
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,               -- hash werkzeug (pbkdf2:sha256)
    nombre VARCHAR(100) NOT NULL,
    legajo VARCHAR(20) UNIQUE,
    rol ENUM('empleado', 'encargado') NOT NULL,
    zona_id INT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS incidencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    zona_id INT NOT NULL,
    empleado_id INT NULL,
    confianza FLOAT DEFAULT 0.0,
    estado VARCHAR(20) DEFAULT 'activa',
    imagen_url VARCHAR(255) NULL,
    resuelta_por INT NULL,
    resuelta_at DATETIME NULL,
    FOREIGN KEY (zona_id) REFERENCES zonas(id),
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (resuelta_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Fotos de la cara de cada empleado, para que la IA lo reconozca.
-- Solo se guardan con consentimiento (Ley 25.326 de datos personales).
CREATE TABLE IF NOT EXISTS fotos_rostro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,             -- "/uploads/rostros/3_a1b2c3d4.jpg"
    consentimiento_at DATETIME NOT NULL,            -- cuándo se registró el consentimiento
    cargada_por INT NULL,                           -- quién subió la foto
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cargada_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Comentarios sobre una alerta (los escriben el encargado o el empleado detectado)
CREATE TABLE IF NOT EXISTS comentarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incidencia_id INT NOT NULL,
    usuario_id INT NULL,
    texto VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Celulares y PCs donde cada usuario activó las notificaciones push (los datos los da el navegador)
CREATE TABLE IF NOT EXISTS suscripciones_push (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    endpoint VARCHAR(500) NOT NULL UNIQUE,          -- dirección del servicio de push de ese navegador
    p256dh VARCHAR(255) NOT NULL,                   -- claves para cifrar el mensaje
    auth VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,                            -- NULL = lo hizo una máquina (YOLO/ESP32)
    accion VARCHAR(50) NOT NULL,
    detalle VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS robot (
    id INT PRIMARY KEY,                             -- siempre hay una sola fila (id = 1)
    estado VARCHAR(20) DEFAULT 'detenido',          -- detenido / recorriendo / pausado / emergencia
    bateria INT DEFAULT 100,
    zona_actual_id INT NULL,
    comando_pendiente VARCHAR(20) NULL,             -- iniciar / pausar / detener / emergencia
    url_video VARCHAR(255) DEFAULT '',
    ultima_conexion DATETIME NULL,
    FOREIGN KEY (zona_actual_id) REFERENCES zonas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS puntos_ruta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orden INT NOT NULL,
    zona_id INT NOT NULL,
    tiempo_espera_seg INT DEFAULT 30,
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE CASCADE
);

-- ===== DATOS DE EJEMPLO (cargar una sola vez, en base vacía) =====
-- Salen de docs/FABRICA-CLIENTE.md (datos ficticios hasta tener los reales).

INSERT INTO zonas (id, nombre, maquina, epp_requerido, grilla_x, grilla_y, ancho, alto) VALUES
(1, 'Zona A', 'Sierra circular', 'casco,lentes,guantes', 0, 0, 3, 2),
(2, 'Zona B', 'Soldadora MIG', 'casco,lentes,guantes,chaleco', 3, 0, 3, 2),
(3, 'Zona C', 'Prensa hidráulica', 'casco,guantes', 0, 2, 3, 2),
(4, 'Zona D', 'Autoelevador', 'casco,chaleco', 3, 2, 3, 2);

-- Contraseña de TODOS los usuarios de prueba: pass123
INSERT INTO usuarios (id, usuario, contrasena, nombre, legajo, rol, zona_id) VALUES
(1, 'juan', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Juan Pérez', 'L-001', 'empleado', 1),
(2, 'maria', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'María Encargada', 'L-100', 'encargado', NULL),
(3, 'lucia', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Lucía Gómez', 'L-002', 'empleado', 1),
(4, 'carlos', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Carlos Díaz', 'L-003', 'empleado', 2),
(5, 'ana', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Ana Martínez', 'L-004', 'empleado', 2),
(6, 'pedro', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Pedro Sosa', 'L-005', 'empleado', 3),
(7, 'sofia', 'pbkdf2:sha256:1000000$YaLdboFMvYPcu2bv$54db8eaee970330dd3681438840bad9497da02ff8ba504f63d7d57c96a408d72', 'Sofía Romero', 'L-006', 'empleado', 4);

-- 40 incidencias de los últimos 30 días. Las viejas ya están resueltas por María (id 2).
INSERT INTO incidencias (tipo, timestamp, zona_id, empleado_id, confianza, estado, resuelta_por, resuelta_at) VALUES
('sin_guantes', DATE_SUB(NOW(), INTERVAL 59 MINUTE), 2, 4, 0.66, 'activa', NULL, NULL),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 164 MINUTE), 2, 4, 0.82, 'activa', NULL, NULL),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 341 MINUTE), 3, 6, 0.9, 'activa', NULL, NULL),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 414 MINUTE), 2, 4, 0.91, 'activa', NULL, NULL),
('sin_casco', DATE_SUB(NOW(), INTERVAL 3897 MINUTE), 3, 6, 0.81, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 3718 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 4492 MINUTE), 4, 7, 0.66, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 3977 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 4689 MINUTE), 2, 5, 0.77, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 4301 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 5241 MINUTE), 4, 7, 0.74, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 5052 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 5313 MINUTE), 2, 5, 0.64, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 4722 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 5494 MINUTE), 1, 1, 0.64, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 4903 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 6018 MINUTE), 3, 6, 0.94, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 5854 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 6187 MINUTE), 2, 4, 0.8, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 6136 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 7072 MINUTE), 2, 4, 0.76, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 7028 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 7384 MINUTE), 4, 7, 0.76, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 7249 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 7608 MINUTE), 2, 5, 0.87, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 7039 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 9553 MINUTE), 4, NULL, 0.67, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 9381 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 10167 MINUTE), 2, 4, 0.79, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 9693 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 10893 MINUTE), 3, 6, 0.77, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 10664 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 15510 MINUTE), 2, NULL, 0.87, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 15264 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 15928 MINUTE), 2, 5, 0.76, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 15870 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 16070 MINUTE), 2, 4, 0.69, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 15783 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 17212 MINUTE), 4, 7, 0.84, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 16965 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 20419 MINUTE), 1, 1, 0.96, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 20090 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 25405 MINUTE), 3, 6, 0.67, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 24862 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 27436 MINUTE), 2, 5, 0.66, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 27160 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 28845 MINUTE), 4, 7, 0.65, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 28482 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 28908 MINUTE), 1, 3, 0.92, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 28613 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 29261 MINUTE), 2, 5, 0.67, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 28674 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 29859 MINUTE), 2, 5, 0.97, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 29400 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 34695 MINUTE), 4, 7, 0.75, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 34531 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 36559 MINUTE), 2, 4, 0.91, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 36467 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 37553 MINUTE), 4, 7, 0.75, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 37161 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 37921 MINUTE), 1, 3, 0.71, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 37422 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 38497 MINUTE), 3, 6, 0.96, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 37938 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 39261 MINUTE), 2, 5, 0.69, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 38801 MINUTE)),
('sin_casco', DATE_SUB(NOW(), INTERVAL 39633 MINUTE), 2, 5, 0.91, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 39090 MINUTE)),
('sin_guantes', DATE_SUB(NOW(), INTERVAL 39647 MINUTE), 1, 3, 0.9, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 39484 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 39814 MINUTE), 4, 7, 0.9, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 39240 MINUTE)),
('sin_chaleco', DATE_SUB(NOW(), INTERVAL 42559 MINUTE), 2, 4, 0.88, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 42374 MINUTE)),
('sin_lentes', DATE_SUB(NOW(), INTERVAL 42768 MINUTE), 2, 5, 0.91, 'resuelta', 2, DATE_SUB(NOW(), INTERVAL 42202 MINUTE));

-- Robot y su ruta: pasa por las 4 zonas y espera 30 s en cada una
INSERT INTO robot (id, estado, bateria) VALUES (1, 'detenido', 100);
INSERT INTO puntos_ruta (orden, zona_id, tiempo_espera_seg) VALUES (1, 1, 30), (2, 2, 30), (3, 3, 30), (4, 4, 30);
