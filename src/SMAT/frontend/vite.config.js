import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// PWA: al compilar (npm run build) se generan el "manifest" (nombre, íconos y colores para instalar la
// web como app en el celular o la PC) y el "service worker" (guarda la app para que abra aunque se corte
// la conexión). En "npm run dev" no se activa, para que los cambios se vean al instante.
const pwa = VitePWA({
  registerType: 'autoUpdate',            // si hay una versión nueva, se actualiza sola
  includeAssets: ['favicon.svg', 'iconos/apple-touch-icon.png'],
  manifest: {
    name: 'DROID-E3D by SMAT',
    short_name: 'DROID-E3D',
    description: 'Control del equipo de protección en la fábrica: alertas, robot y máquinas.',
    lang: 'es-AR',
    start_url: '/app',                   // al abrir la app instalada va directo al sistema (pide login si hace falta)
    scope: '/',
    display: 'standalone',               // sin barra del navegador, como una app
    background_color: '#1f2328',
    theme_color: '#f5b800',
    icons: [
      { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
    globIgnores: ['**/three-*.js'],      // Three.js pesa mucho: solo lo descarga quien abre una vista 3D
    navigateFallback: '/index.html',     // sin conexión, cualquier página abre la app guardada
    navigateFallbackDenylist: [/^\/api\//],   // ...menos la API, que está en la misma dirección que la web
    importScripts: ['sw-push.js'],       // public/sw-push.js: recibe y muestra las notificaciones push
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), pwa], // tailwindcss() genera solo las clases que usamos
  server: { port: 5173 },
  build: {
    rollupOptions: {
      // Three.js va en su propio archivo (three-*.js) para poder dejarlo afuera de lo que guarda la PWA
      output: { manualChunks: (ruta) => (ruta.includes('node_modules/three/') ? 'three' : undefined) },
    },
  },
})
