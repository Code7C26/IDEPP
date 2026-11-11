---
description: Abre el Pull Request de la fase actual (SMAT-web → main)
---
1. Verificá que estés en la rama `SMAT-web`, sin cambios sin commitear, y que backend (py_compile) y
   frontend (npm run build) compilen.
2. `git push -u origin SMAT-web`.
3. `gh pr create --base main --head SMAT-web` con título "Fase X: nombre" y descripción: qué cambia,
   cómo probar (PowerShell), issues que cierra (`closes #N`), y si cambia docs/API.md.
4. Mostrame el link. NO mergees: lo revisa y mergea el equipo de DROID-E3D.
