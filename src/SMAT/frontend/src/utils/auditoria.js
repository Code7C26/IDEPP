// Cómo se muestra cada acción de la auditoría: texto en castellano y tono de la etiqueta.
// Las acciones las escribe el backend con utils/auditoria.py -> registrar("accion", "detalle").
export const ACCIONES = {
  parada_maquina: { texto: 'Máquina detenida por una alerta', tono: 'alerta' },
  detener_maquina: { texto: 'Detuvo una máquina', tono: 'alerta' },
  reactivar_maquina: { texto: 'Reactivó una máquina', tono: 'ok' },
  resolver_incidencia: { texto: 'Resolvió una alerta', tono: 'ok' },
  comentar_incidencia: { texto: 'Comentó una alerta', tono: 'neutro' },
  comando_robot: { texto: 'Le dio una orden al robot', tono: 'marca' },
  editar_ruta: { texto: 'Cambió la ruta del robot', tono: 'marca' },
  editar_video_robot: { texto: 'Cambió el video del robot', tono: 'marca' },
  crear_usuario: { texto: 'Creó un usuario', tono: 'neutro' },
  editar_usuario: { texto: 'Editó un usuario', tono: 'neutro' },
  baja_usuario: { texto: 'Dio de baja un usuario', tono: 'naranja' },
  crear_zona: { texto: 'Creó una zona', tono: 'neutro' },
  editar_zona: { texto: 'Editó una zona', tono: 'neutro' },
  borrar_zona: { texto: 'Borró una zona', tono: 'naranja' },
  subir_rostro: { texto: 'Subió una foto de rostro', tono: 'neutro' },
  borrar_rostro: { texto: 'Borró una foto de rostro', tono: 'naranja' },
  exportar_csv: { texto: 'Descargó la planilla', tono: 'neutro' },
  exportar_pdf: { texto: 'Descargó el informe PDF', tono: 'neutro' },
}

// Si aparece una acción nueva que todavía no está en la lista, se muestra tal cual
export const accionLegible = (accion) => ACCIONES[accion] || { texto: accion, tono: 'neutro' }
