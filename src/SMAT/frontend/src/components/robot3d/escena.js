// Escena 3D: la planta (una baldosa por zona, armada con su lugar en la grilla), la ruta y el robot.
// No sabe nada de React: PlantaRobot3D.jsx la crea y le pasa los datos con actualizar().
// Regla: el robot solo se mueve cuando cambia su zona. No se inventa movimiento: sin conexión queda
// gris y quieto, y entre dos zonas se desliza con una animación (la posición real se conoce por zona).
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { estadoVisible, medidasGrilla, resumenZona } from '../../utils/mapa.js'
import { crearRobot, texturaDeCanvas } from './modeloRobot.js'

const CELDA = 2                 // cada celda de la grilla mide 2 unidades
const ESCALA_ROBOT = 1.25
const PIXELES_POR_CELDA = 170   // resolución del dibujo de cada baldosa
const SEGUNDOS_ENTRE_ZONAS = 2
const PISO_RADIO = 60
const DIRECCION_CAMARA = new THREE.Vector3(0.16, 0.8, 1).normalize()

const COLORES = {
  claro: {
    piso: '#d4d6cf', lineaPiso: 'rgba(0,0,0,.07)', nombre: '#18181b', maquina: '#52525b', resaltada: '#c99400',
    ok: { fondo: '#d6ebdc', borde: '#16a34a', texto: '#15803d' },
    alerta: { fondo: '#f6d2d2', borde: '#dc2626', texto: '#b91c1c' },
    detenida: { fondo: '#fde3cb', borde: '#f97316', texto: '#c2410c' },
    neutro: { fondo: '#eeefeb', borde: '#9aa09a', texto: '#52525b' },
  },
  oscuro: {
    piso: '#2a2d30', lineaPiso: 'rgba(255,255,255,.05)', nombre: '#f4f4f5', maquina: '#d4d4d8', resaltada: '#f5b800',
    ok: { fondo: '#1c3a2a', borde: '#22c55e', texto: '#4ade80' },
    alerta: { fondo: '#4f2022', borde: '#ef4444', texto: '#fca5a5' },
    detenida: { fondo: '#4f2f17', borde: '#f97316', texto: '#fdba74' },
    neutro: { fondo: '#35383c', borde: '#71717a', texto: '#d4d4d8' },
  },
}

// En el celular: sin sombras y con menos resolución, para que no gaste batería
const esCelular = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700

export function crearEscena(contenedor, { oscuro: oscuroInicial = false, onContextoPerdido = () => {} } = {}) {
  const celular = esCelular()
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let oscuro = oscuroInicial

  // Si el equipo no tiene WebGL, esto da error: lo atrapa PlantaRobot3D y se muestra el mapa 2D
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, celular ? 1.75 : 2))
  renderer.shadowMap.enabled = !celular
  renderer.shadowMap.type = THREE.PCFShadowMap
  contenedor.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextoPerdido() })

  const escena = new THREE.Scene()
  const camara = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 300)
  const objetivo = new THREE.Vector3(0, 0.7, 0.4)

  // Solo se puede girar: la rueda del mouse sigue moviendo la página. En el celular se gira con dos
  // dedos, porque un dedo tiene que seguir sirviendo para bajar por la página.
  const controles = new OrbitControls(camara, renderer.domElement)
  controles.target.copy(objetivo)
  controles.enableDamping = true
  controles.enablePan = false
  controles.enableZoom = false
  controles.maxPolarAngle = Math.PI * 0.45
  controles.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }
  renderer.domElement.style.touchAction = 'pan-y'

  // Se dibuja solo cuando algo cambió: así la página no gasta de más mientras el robot está quieto
  let hayQueDibujar = true
  controles.addEventListener('change', () => { hayQueDibujar = true })

  // Luces (los valores están pensados para las luces físicas de Three.js)
  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f80, 1.25))
  const sol = new THREE.DirectionalLight(0xffffff, 1.7)
  sol.position.set(6, 16, 7)
  sol.castShadow = true
  sol.shadow.mapSize.set(2048, 2048)
  sol.shadow.bias = -0.0005
  escena.add(sol)
  const relleno = new THREE.DirectionalLight(0xdfe8ff, 0.5)
  relleno.position.set(-7, 5, -3)
  escena.add(relleno)

  // Piso de la fábrica, con baldosas
  const dibujoPiso = texturaDeCanvas(128, 128)
  dibujoPiso.textura.wrapS = THREE.RepeatWrapping
  dibujoPiso.textura.wrapT = THREE.RepeatWrapping
  dibujoPiso.textura.repeat.set(PISO_RADIO, PISO_RADIO)
  const materialPiso = new THREE.MeshStandardMaterial({ map: dibujoPiso.textura, roughness: 0.95 })
  const piso = new THREE.Mesh(new THREE.CircleGeometry(PISO_RADIO, 48), materialPiso)
  piso.rotation.x = -Math.PI / 2
  piso.receiveShadow = true
  escena.add(piso)

  function pintarPiso() {
    const c = COLORES[oscuro ? 'oscuro' : 'claro']
    const { ctx } = dibujoPiso
    ctx.fillStyle = c.piso
    ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = c.lineaPiso
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, 128, 128)
    dibujoPiso.textura.needsUpdate = true
  }
  pintarPiso()

  const robot = crearRobot()
  robot.grupo.scale.setScalar(ESCALA_ROBOT)
  escena.add(robot.grupo)

  // ---------- Planta ----------
  const grupoZonas = new THREE.Group()
  const grupoRuta = new THREE.Group()
  escena.add(grupoZonas, grupoRuta)
  const baldosas = new Map()      // id de zona -> { zona, ctx, textura, ancho, alto, clave }
  const materialRuta = new THREE.MeshStandardMaterial({ color: 0xf5b800, roughness: 0.6, transparent: true, opacity: 0.75 })
  let grilla = { columnas: 6, filas: 4 }
  let firmaPlanta = null
  let firmaRuta = null

  // Dónde se para el robot en una zona: corrido del centro, para no tapar el nombre de la zona
  function puntoDeZona(zona) {
    return new THREE.Vector3(
      (zona.grilla_x + zona.ancho * 0.78 - grilla.columnas / 2) * CELDA, 0,
      (zona.grilla_y + zona.alto * 0.72 - grilla.filas / 2) * CELDA,
    )
  }
  // Sin zona informada, el robot espera al borde de la planta
  const puntoDeEspera = () => new THREE.Vector3(0, 0, (grilla.filas / 2) * CELDA + 1.4)

  function vaciar(grupo) {
    grupo.children.forEach((o) => {
      o.geometry.dispose()
      if (o.material !== materialRuta) { o.material.map?.dispose(); o.material.dispose() }
    })
    grupo.clear()
  }

  function armarPlanta(zonas) {
    vaciar(grupoZonas)
    baldosas.clear()
    grilla = medidasGrilla(zonas)
    zonas.forEach((zona) => {
      const margen = 0.14   // calle entre zonas
      const ancho = zona.ancho * CELDA - margen
      const alto = zona.alto * CELDA - margen
      const { textura, ctx } = texturaDeCanvas(Math.min(zona.ancho * PIXELES_POR_CELDA, 1024), Math.min(zona.alto * PIXELES_POR_CELDA, 1024))
      const malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshStandardMaterial({ map: textura, roughness: 0.9 }))
      malla.rotation.x = -Math.PI / 2
      malla.position.set((zona.grilla_x + zona.ancho / 2 - grilla.columnas / 2) * CELDA, 0.01, (zona.grilla_y + zona.alto / 2 - grilla.filas / 2) * CELDA)
      malla.receiveShadow = true
      grupoZonas.add(malla)
      baldosas.set(zona.id, { ctx, textura, clave: null })
    })
    const limite = (Math.max(grilla.columnas, grilla.filas) * CELDA) / 2 + 4
    Object.assign(sol.shadow.camera, { left: -limite, right: limite, top: limite, bottom: -limite, far: 60 })
    sol.shadow.camera.updateProjectionMatrix()
    encuadrar()
  }

  function pintarBaldosa(zona, alertasPorZona, zonaResaltada) {
    const baldosa = baldosas.get(zona.id)
    const estado = estadoVisible(zona, alertasPorZona)
    const resumen = resumenZona(zona, estado, alertasPorZona?.[zona.id] || 0)
    const resaltada = zona.id === zonaResaltada
    const clave = [zona.nombre, zona.maquina, estado, resumen, resaltada, oscuro].join('|')
    if (baldosa.clave === clave) return
    baldosa.clave = clave

    const c = COLORES[oscuro ? 'oscuro' : 'claro']
    const { ctx, textura } = baldosa
    const { width: ancho, height: alto } = ctx.canvas
    const grosor = resaltada ? 16 : 7
    ctx.fillStyle = c[estado].fondo
    ctx.fillRect(0, 0, ancho, alto)
    ctx.strokeStyle = resaltada ? c.resaltada : c[estado].borde
    ctx.lineWidth = grosor
    ctx.strokeRect(grosor / 2, grosor / 2, ancho - grosor, alto - grosor)

    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    const letra = 'system-ui, "Segoe UI", Arial, sans-serif'
    ctx.fillStyle = c.nombre
    ctx.font = `700 60px ${letra}`
    ctx.fillText(zona.nombre, 26, 78, ancho - 52)
    if (zona.maquina) {
      ctx.fillStyle = c.maquina
      ctx.font = `500 36px ${letra}`
      ctx.fillText(zona.maquina, 26, 124, ancho - 52)
    }
    ctx.fillStyle = c[estado].texto
    ctx.font = `600 38px ${letra}`
    ctx.fillText(resaltada ? `Tu zona${resumen ? ` · ${resumen}` : ''}` : resumen, 26, alto - 28, ancho - 52)
    textura.needsUpdate = true
  }

  // La línea amarilla que sigue el robot: une sus paradas y vuelve a la primera
  function armarRuta(ruta, zonas) {
    vaciar(grupoRuta)
    const puntos = ruta.map((id) => zonas.find((z) => z.id === id)).filter(Boolean).map(puntoDeZona)
    if (puntos.length < 2) return
    puntos.forEach((a, i) => {
      const b = puntos[(i + 1) % puntos.length]
      const largo = a.distanceTo(b)
      if (!largo) return
      const tramo = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.02, 0.08), materialRuta)
      tramo.position.set((a.x + b.x) / 2, 0.025, (a.z + b.z) / 2)
      tramo.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
      tramo.receiveShadow = true
      grupoRuta.add(tramo)
    })
  }

  // ---------- Cámara ----------
  // La aleja lo justo para que entre toda la planta, sin cambiar el ángulo que eligió el usuario
  function encuadrar() {
    const ancho = grilla.columnas * CELDA + 1
    const fondo = grilla.filas * CELDA + 4     // incluye el lugar donde espera el robot, al borde de la planta
    const tangente = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2))
    const distancia = Math.max(ancho / (2 * tangente * camara.aspect), (fondo * 0.78) / (2 * tangente)) * 1.08
    const direccion = camara.position.lengthSq() ? camara.position.clone().sub(objetivo) : DIRECCION_CAMARA.clone()
    camara.position.copy(objetivo).add(direccion.setLength(distancia))
    controles.update()
    hayQueDibujar = true
  }

  function medir() {
    const { clientWidth: ancho, clientHeight: alto } = contenedor
    if (!ancho || !alto) return
    renderer.setSize(ancho, alto, false)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    camara.aspect = ancho / alto
    camara.updateProjectionMatrix()
    encuadrar()
  }
  const observaTamano = new ResizeObserver(medir)
  observaTamano.observe(contenedor)

  // Fuera de la pantalla no se dibuja nada
  let enPantalla = true
  const observaVista = new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; hayQueDibujar = true })
  observaVista.observe(contenedor)

  // ---------- Movimiento ----------
  let destino = null        // adónde va el robot
  let velocidad = 1
  let rumbo = 0             // hacia dónde mira
  let baliza = false
  let primeraVez = true

  function irHacia(punto) {
    if (destino && destino.equals(punto)) return
    destino = punto
    const distancia = robot.grupo.position.distanceTo(punto)
    if (primeraVez || movimientoReducido) {
      robot.grupo.position.copy(punto)
    } else if (distancia > 0.01) {
      velocidad = distancia / SEGUNDOS_ENTRE_ZONAS
      rumbo = Math.atan2(punto.x - robot.grupo.position.x, punto.z - robot.grupo.position.z)
    }
    primeraVez = false
    hayQueDibujar = true
  }

  let idCuadro = 0
  let ultimo = performance.now()
  function cuadro(ahora) {
    idCuadro = requestAnimationFrame(cuadro)
    const dt = Math.min(0.05, (ahora - ultimo) / 1000)
    ultimo = ahora
    if (!enPantalla) return

    if (destino) {
      const posicion = robot.grupo.position
      const falta = posicion.distanceTo(destino)
      if (falta > 0.001) {
        posicion.addScaledVector(destino.clone().sub(posicion).normalize(), Math.min(falta, velocidad * dt))
        robot.moverOrugas(dt * 0.9)
        hayQueDibujar = true
      } else {
        rumbo = 0     // al llegar mira hacia la cámara, para que se lea su pantalla
      }
      // Gira de a poco, por el camino más corto
      const giro = Math.atan2(Math.sin(rumbo - robot.grupo.rotation.y), Math.cos(rumbo - robot.grupo.rotation.y))
      if (Math.abs(giro) > 0.002) {
        robot.grupo.rotation.y += movimientoReducido ? giro : giro * Math.min(1, dt * 5)
        hayQueDibujar = true
      }
    }
    if (baliza) {
      robot.titilar(ahora)
      hayQueDibujar = true
    }
    controles.update()
    if (hayQueDibujar) {
      renderer.render(escena, camara)
      hayQueDibujar = false
    }
  }
  idCuadro = requestAnimationFrame(cuadro)

  // ---------- Lo que usa PlantaRobot3D ----------
  // datos: { zonas, ruta (ids en orden), robot, alertasPorZona (null = no se conocen),
  //          zonaResaltada (id de "tu zona"), alerta (el robot acaba de detectar una falta) }
  function actualizar({ zonas = [], ruta = [], robot: datosRobot, alertasPorZona = null, zonaResaltada = null, alerta = false }) {
    const planta = zonas.map((z) => [z.id, z.grilla_x, z.grilla_y, z.ancho, z.alto].join()).join(';')
    if (planta !== firmaPlanta) {
      firmaPlanta = planta
      armarPlanta(zonas)
      firmaRuta = null      // la ruta se dibuja sobre la planta: hay que volver a armarla
    }
    zonas.forEach((z) => pintarBaldosa(z, alertasPorZona, zonaResaltada))
    const rutaNueva = ruta.join()
    if (rutaNueva !== firmaRuta) {
      firmaRuta = rutaNueva
      armarRuta(ruta, zonas)
    }

    hayQueDibujar = true
    // Hasta tener los datos el robot no se muestra: si no, "viajaría" hasta su zona al abrir la página
    robot.grupo.visible = Boolean(zonas.length && datosRobot)
    if (!robot.grupo.visible) return

    const conectado = Boolean(datosRobot.conectado)
    const zona = zonas.find((z) => z.id === datosRobot.zona_actual_id)
    irHacia(zona ? puntoDeZona(zona) : puntoDeEspera())
    robot.ponerApagado(!conectado)

    const emergencia = conectado && datosRobot.estado === 'emergencia'
    const pantalla = !conectado ? 'apagado'
      : alerta ? 'falta_epp'
        : emergencia ? 'emergencia'
          : datosRobot.estado === 'recorriendo' ? 'escaneando' : 'espera'
    robot.ponerPantalla(pantalla)

    const balizaNueva = conectado && (alerta || emergencia)
    if (baliza && !balizaNueva) robot.apagarBaliza()
    baliza = balizaNueva
  }

  function ponerTema(valor) {
    if (valor === oscuro) return
    oscuro = valor
    pintarPiso()
    hayQueDibujar = true
  }

  function destruir() {
    cancelAnimationFrame(idCuadro)
    observaTamano.disconnect()
    observaVista.disconnect()
    controles.dispose()
    escena.traverse((o) => {
      if (!o.isMesh) return
      o.geometry.dispose()
      o.material.map?.dispose()
      o.material.dispose()
    })
    renderer.dispose()
    renderer.forceContextLoss()   // el navegador permite pocos contextos 3D a la vez: se libera enseguida
    renderer.domElement.remove()
  }

  medir()
  return { actualizar, ponerTema, destruir }
}
