// Escena 3D del robot: la misma del render "Robot SMAT 3D" (cámara, luces, piso con la línea amarilla y
// el casco de referencia), con Three.js 0.128 como el original, para que se vea igual.
// No sabe nada de React: EscenaRobot.jsx la crea y le pasa el estado con ponerEstado().
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { crearRobot, texturaDeCanvas } from './modeloRobot.js'

export function crearEscena(contenedor) {
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const celular = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700

  // Si el equipo no tiene WebGL, esto da error: lo atrapa EscenaRobot y la página sigue andando
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputEncoding = THREE.sRGBEncoding
  const lienzo = renderer.domElement
  lienzo.style.display = 'block'
  lienzo.style.width = '100%'
  lienzo.style.height = '100%'
  lienzo.style.touchAction = 'pan-y'
  contenedor.appendChild(lienzo)

  const escena = new THREE.Scene()
  const camara = new THREE.PerspectiveCamera(35, 4 / 3, 0.1, 100)
  camara.position.set(4.4, 3.2, 5.2)

  const controles = new OrbitControls(camara, lienzo)
  controles.target.set(0, 1.4, 0)
  controles.enableDamping = true
  controles.minDistance = 3
  controles.maxDistance = 12
  controles.maxPolarAngle = Math.PI * 0.49
  controles.autoRotate = !reducirMovimiento
  controles.autoRotateSpeed = 1.2
  controles.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }

  // En una página larga el render no puede atrapar el scroll: la rueda hace zoom solo con Ctrl, y con
  // un dedo se sigue bajando por la página. Con dos dedos se gira y se hace zoom.
  const usarRueda = (e) => { controles.enableZoom = e.ctrlKey }
  const dejarPasarUnDedo = (e) => { if (e.touches.length === 1) e.stopPropagation() }
  contenedor.addEventListener('wheel', usarRueda, { capture: true, passive: true })
  contenedor.addEventListener('touchstart', dejarPasarUnDedo, { capture: true, passive: true })
  contenedor.addEventListener('touchmove', dejarPasarUnDedo, { capture: true, passive: true })

  // Luces
  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f80, 0.75))
  const sol = new THREE.DirectionalLight(0xffffff, 0.9)
  sol.position.set(4, 7, 3)
  sol.castShadow = true
  const lado = celular ? 1024 : 2048     // en el celular, sombras con menos detalle para que no se trabe
  sol.shadow.mapSize.set(lado, lado)
  sol.shadow.camera.left = -4
  sol.shadow.camera.right = 4
  sol.shadow.camera.top = 4
  sol.shadow.camera.bottom = -4
  sol.shadow.bias = -0.0005
  escena.add(sol)
  const relleno = new THREE.DirectionalLight(0xdfe8ff, 0.35)
  relleno.position.set(-5, 3, -2)
  escena.add(relleno)

  // Piso de fábrica con línea de seguridad
  const dibujoPiso = texturaDeCanvas(1024, 1024, (ctx, ancho, alto) => {
    ctx.fillStyle = '#9aa096'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.strokeStyle = 'rgba(0,0,0,.08)'
    ctx.lineWidth = 2
    for (let i = 0; i <= ancho; i += 128) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, alto); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(ancho, i); ctx.stroke()
    }
    ctx.fillStyle = '#f2b705'
    ctx.fillRect(ancho * 0.5 - 18, 0, 36, alto)
  })
  const piso = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ map: dibujoPiso.textura, roughness: 0.95 }))
  piso.rotation.x = -Math.PI / 2
  piso.receiveShadow = true
  escena.add(piso)

  const robot = crearRobot()
  escena.add(robot.grupo)

  // Casco de referencia: lo que busca la IA
  const amarillo = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.55 })
  const casco = new THREE.Group()
  casco.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), amarillo))
  casco.add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 32), amarillo))
  const cresta = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 32, Math.PI), amarillo)
  cresta.rotation.y = Math.PI / 2
  casco.add(cresta)
  casco.position.set(-1.9, 0.02, 1.6)
  casco.rotation.y = 0.6
  casco.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true }
  })
  escena.add(casco)

  function medir() {
    const { clientWidth: ancho, clientHeight: alto } = contenedor
    if (!ancho || !alto) return
    renderer.setSize(ancho, alto, false)
    camara.aspect = ancho / alto
    camara.updateProjectionMatrix()
  }
  const observaTamano = new ResizeObserver(medir)
  observaTamano.observe(contenedor)
  medir()

  // Fuera de la pantalla no se dibuja nada, para no gastar batería
  let enPantalla = true
  const observaVista = new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting })
  observaVista.observe(contenedor)

  let orugas = false      // si las orugas giran
  let alerta = false      // si la baliza y los ojos titilan
  let ultimo = performance.now()
  let idCuadro = 0
  function cuadro(ahora) {
    idCuadro = requestAnimationFrame(cuadro)
    const dt = Math.min(0.05, (ahora - ultimo) / 1000)
    ultimo = ahora
    if (!enPantalla) return
    if (orugas && !reducirMovimiento) robot.moverOrugas(dt * 0.35)
    if (alerta) robot.titilar(ahora)
    controles.update()
    renderer.render(escena, camara)
  }
  idCuadro = requestAnimationFrame(cuadro)

  return {
    // estado: { pantalla (ver PANTALLAS en modeloRobot.js), alerta, orugas, apagado }
    ponerEstado(estado) {
      robot.ponerPantalla(estado.pantalla)
      robot.ponerApagado(estado.apagado)
      if (alerta && !estado.alerta) robot.apagarBaliza()
      alerta = estado.alerta
      orugas = estado.orugas
    },
    girar(valor) {
      controles.autoRotate = valor && !reducirMovimiento
    },
    verDeFrente() {
      camara.position.set(0.6, 1.9, 5.8)
      controles.target.set(0, 1.5, 0)
      controles.update()
    },
    destruir() {
      cancelAnimationFrame(idCuadro)
      observaTamano.disconnect()
      observaVista.disconnect()
      contenedor.removeEventListener('wheel', usarRueda, { capture: true })
      contenedor.removeEventListener('touchstart', dejarPasarUnDedo, { capture: true })
      contenedor.removeEventListener('touchmove', dejarPasarUnDedo, { capture: true })
      controles.dispose()
      escena.traverse((o) => {
        if (!o.isMesh) return
        o.geometry.dispose()
        o.material.map?.dispose()
        o.material.dispose()
      })
      renderer.dispose()
      renderer.forceContextLoss()   // el navegador permite pocos contextos 3D a la vez: se libera enseguida
      lienzo.remove()
    },
  }
}
