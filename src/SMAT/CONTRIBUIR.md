# Cómo trabajamos · SMAT en el repo TOUCH-ID

SMAT es una división de TOUCH. Este repo es compartido: **no se tocan** las carpetas de TOUCH
(las subcarpetas `TOUCH-ID/` de `assets/`, `design/`, `docs/` y `src/`). SMAT trabaja en `src/SMAT/` (web y
servidor de IA), `docs/SMAT/` (empresa, costos y reportes) y en los archivos `smat-*` de `.github/`.

## Ramas
| Rama | Quién | Para qué |
|---|---|---|
| `SMAT-web` | Toro y Tizi (con Claude) | App web de DROID-E3D |
| `SMAT-hardware` | Morena | ESP32, relé, cámara, YOLO, reconocimiento facial (`servidor_ia/`) |
| `SMAT-empresa` | Toro y Morena | Documentos de `docs/SMAT/EMPRESA-SMAT/` |
| `main` | — | Siempre funciona. Solo se entra por Pull Request |

## Flujo
1. Trabajá en tu rama y hacé un commit por tarea: `Fase 2.3: Layout y NavBar` (+ `closes #N` si hay issue).
2. Al terminar una fase abrí un Pull Request a `main` (plantilla `smat.md`).
3. Lo revisa **el otro socio de SMAT** y lo mergea. TOUCH no interviene.
4. Nunca se hace push directo a `main`.

## Comandos del día a día (PowerShell)
```powershell
cd C:\...\TOUCH-ID
git switch SMAT-hardware            # (o SMAT-web) entrar a tu rama
git pull                            # 1. traer lo último antes de empezar
git merge origin/main               #    y lo que ya entró a main
# ... trabajar ...
git status                          # 2. ver qué cambió
git add src/SMAT/servidor_ia        # 3. agregar SOLO tu carpeta (nunca "git add .")
git commit -m "Fase X.Y: qué hice"
git push                            # 4. subir tu rama
```
Si `git status` muestra un `.env`, fotos de caras o modelos nuevos (`.pt`, `.onnx`), no los agregues.

## Issues y etiquetas
`smat:web` · `smat:hardware` · `smat:ia` · `smat:empresa` · `smat:profe` · `smat:decision` · `smat:bug` · `smat:urgente`.
Las tareas del profe (Classroom) se registran como Issue `smat:profe` con la fecha de entrega.

## Reglas de seguridad
- Nunca subir `.env`, contraseñas, claves (`YOLO_API_KEY`, `ROBOT_API_KEY`, `VAPID_*`) ni fotos reales de empleados.
- Nunca `git add .` desde la raíz del repo: agregá solo tu carpeta.

## Cambios en la API del hardware
Si cambia un endpoint que usa el robot o YOLO, se actualiza `docs/API.md` y se avisa a Morena en el PR.

## Registro
- `docs/BITACORA.md`: una entrada por semana.
- `docs/decisiones/`: un archivo corto por decisión técnica (para defenderla ante el jurado).
