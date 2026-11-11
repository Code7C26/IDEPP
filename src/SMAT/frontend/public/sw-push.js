// Notificaciones push (Fase 7.3). Lo carga el service worker de la PWA (ver importScripts en vite.config.js).
// El backend (backend/utils/push.py) manda { titulo, texto, url, etiqueta } y acá se muestra la notificación,
// aunque la web esté cerrada.

self.addEventListener('push', (evento) => {
  let datos = {}
  try {
    datos = evento.data ? evento.data.json() : {}
  } catch {
    datos = { texto: evento.data ? evento.data.text() : '' }
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'DROID-E3D', {
      body: datos.texto || 'Hay una alerta nueva',
      icon: '/iconos/icono-192.png',
      badge: '/iconos/icono-192.png',
      tag: datos.etiqueta || 'droid-e3d',   // la misma alerta no aparece dos veces
      renotify: true,                       // pero si llega otra, vuelve a sonar y vibrar
      vibrate: [300, 120, 300],
      data: { url: datos.url || '/app' },
    })
  )
})

// Al tocar la notificación: si la web ya está abierta la trae al frente en esa página; si no, la abre.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(evento.notification.data?.url || '/app', self.location.origin).href
  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const abierta = ventanas.find((ventana) => ventana.url.startsWith(self.location.origin))
    if (abierta) {
      await abierta.focus()
      return abierta.navigate(destino).catch(() => {})
    }
    return self.clients.openWindow(destino)
  })())
})
