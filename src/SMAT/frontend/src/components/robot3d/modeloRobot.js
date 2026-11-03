// Modelo 3D del robot DROID-E3D: orugas, cuerpo, pantalla, brazos, cuello y cabeza con la cámara.
// Es el del render "Robot SMAT 3D", pieza por pieza: si se cambia allá, hay que cambiarlo acá.
// Está armado con piezas de Three.js (no hay un archivo de modelo).
// Uso: const robot = crearRobot(); escena.add(robot.grupo); robot.ponerPantalla('ok')
import * as THREE from 'three'

// Medidas del cuerpo: varias piezas se ubican a partir de estas
const CUERPO_Y = 1.13
const CUERPO_ALTO = 0.86
const CUERPO_ANCHO = 1.12
const CUERPO_FONDO = 0.98
const FRENTE_Z = CUERPO_FONDO / 2 + 0.03
const ESPALDA_Z = -CUERPO_FONDO / 2 - 0.03
const TECHO_Y = CUERPO_Y + CUERPO_ALTO / 2
const BANDA_Y = TECHO_Y - 0.17          // altura de la banda gris del pecho

const GRIS_APAGADO = new THREE.Color('#71757a')

// Textura dibujada en un canvas. Devuelve la textura y el contexto, por si hay que redibujarla.
export function texturaDeCanvas(ancho, alto, dibujar = () => {}) {
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  dibujar(ctx, ancho, alto)
  const textura = new THREE.CanvasTexture(canvas)
  textura.encoding = THREE.sRGBEncoding
  textura.anisotropy = 4
  return { textura, ctx }
}

function conSombra(objeto) {
  objeto.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true }
  })
  return objeto
}

// Agrega una pieza al robot en una posición
function pieza(padre, geometria, material, x, y, z, sombra = true) {
  const malla = new THREE.Mesh(geometria, material)
  malla.position.set(x, y, z)
  padre.add(sombra ? conSombra(malla) : malla)
  return malla
}

function cajaRedondeada(ancho, alto, fondo, radio, material) {
  const forma = new THREE.Shape()
  const x = -ancho / 2
  const y = -alto / 2
  forma.moveTo(x + radio, y)
  forma.lineTo(x + ancho - radio, y); forma.quadraticCurveTo(x + ancho, y, x + ancho, y + radio)
  forma.lineTo(x + ancho, y + alto - radio); forma.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto)
  forma.lineTo(x + radio, y + alto); forma.quadraticCurveTo(x, y + alto, x, y + alto - radio)
  forma.lineTo(x, y + radio); forma.quadraticCurveTo(x, y, x + radio, y)
  const bisel = Math.min(radio, fondo / 4)
  const geometria = new THREE.ExtrudeGeometry(forma, {
    depth: fondo - 2 * bisel, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel * 0.9, bevelSegments: 3, curveSegments: 6,
  })
  geometria.translate(0, 0, -(fondo - 2 * bisel) / 2)
  return new THREE.Mesh(geometria, material)
}

// ---------- Orugas (forma triangular) ----------
// Devuelve la función que hace avanzar los tacos y las ruedas.
function armarOrugas(robot, M) {
  const ANCHO = 0.34
  const SEPARACION = 0.8
  const RUEDAS = [{ z: 0.56, y: 0.22, r: 0.22 }, { z: -0.56, y: 0.22, r: 0.22 }, { z: 0.12, y: 0.74, r: 0.13 }]
  const materialTaco = new THREE.MeshStandardMaterial({ color: 0x2c323c, roughness: 0.85 })

  // Contorno de la oruga: la envolvente convexa de las tres ruedas
  const contorno = (() => {
    const puntos = []
    RUEDAS.forEach((w) => {
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2
        puntos.push([w.z + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r])
      }
    })
    puntos.sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    const abajo = []
    const arriba = []
    puntos.forEach((p) => {
      while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], p) <= 0) abajo.pop()
      abajo.push(p)
    })
    for (let i = puntos.length - 1; i >= 0; i--) {
      const p = puntos[i]
      while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], p) <= 0) arriba.pop()
      arriba.push(p)
    }
    return abajo.slice(0, -1).concat(arriba.slice(0, -1))
  })()

  const largos = []
  let perimetro = 0
  contorno.forEach((p, i) => {
    const q = contorno[(i + 1) % contorno.length]
    const largo = Math.hypot(q[0] - p[0], q[1] - p[1])
    largos.push(largo)
    perimetro += largo
  })

  // Punto del contorno a una distancia "s" del inicio, con la dirección de la oruga en ese lugar
  function puntoDeOruga(s) {
    let resto = ((s % perimetro) + perimetro) % perimetro
    let i = 0
    while (resto > largos[i]) { resto -= largos[i]; i++ }
    const p = contorno[i]
    const q = contorno[(i + 1) % contorno.length]
    const t = resto / largos[i]
    return {
      z: p[0] + (q[0] - p[0]) * t, y: p[1] + (q[1] - p[1]) * t,
      dz: (q[0] - p[0]) / largos[i], dy: (q[1] - p[1]) / largos[i],
    }
  }

  const TACOS = 38
  const geometriaTaco = new THREE.BoxGeometry(ANCHO + 0.02, 0.05, 0.075)
  const geometriaDibujo = new THREE.BoxGeometry(ANCHO * 0.7, 0.012, 0.02)
  const orugas = [-1, 1].map((lado) => {
    const grupo = new THREE.Group()
    grupo.position.set(lado * SEPARACION, 0.03, 0)

    const forma = new THREE.Shape()
    contorno.forEach((p, i) => (i ? forma.lineTo(-p[0], p[1]) : forma.moveTo(-p[0], p[1])))
    const banda = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: ANCHO - 0.04, bevelEnabled: false }), M.goma)
    banda.geometry.translate(0, 0, -(ANCHO - 0.04) / 2)
    banda.rotation.y = Math.PI / 2
    grupo.add(banda)

    // Chapa gris de la suspensión, en la cara de afuera
    const formaChapa = new THREE.Shape()
    formaChapa.moveTo(-0.5, 0.2); formaChapa.lineTo(0.5, 0.2); formaChapa.lineTo(-0.1, 0.7); formaChapa.closePath()
    const chapa = new THREE.Mesh(new THREE.ExtrudeGeometry(formaChapa, { depth: 0.03, bevelEnabled: false }), M.gris)
    chapa.rotation.y = (lado * Math.PI) / 2
    chapa.position.x = lado * (ANCHO / 2 - 0.02)
    grupo.add(chapa)

    // Ruedas con rayos
    const ruedas = RUEDAS.concat([{ z: 0, y: 0.17, r: 0.13 }, { z: -0.28, y: 0.17, r: 0.12 }, { z: 0.28, y: 0.17, r: 0.12 }]).map((datos) => {
      const r = datos.r * 0.85
      const rueda = new THREE.Group()
      const centro = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 28), M.gris)
      centro.rotation.z = Math.PI / 2
      rueda.add(centro)
      for (let k = 0; k < 6; k++) {
        const rayo = new THREE.Mesh(new THREE.BoxGeometry(0.06, r * 1.6, 0.025), M.acero)
        rayo.rotation.x = (k / 6) * Math.PI
        rayo.position.x = lado * 0.005
        rueda.add(rayo)
      }
      const tapa = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, 0.08, 16), M.negro)
      tapa.rotation.z = Math.PI / 2
      rueda.add(tapa)
      rueda.position.set(lado * (ANCHO / 2 + 0.005), datos.y, datos.z)
      grupo.add(rueda)
      return { objeto: rueda, r }
    })

    // Tacos con dibujo
    const tacos = Array.from({ length: TACOS }, () => {
      const taco = new THREE.Group()
      taco.add(new THREE.Mesh(geometriaTaco, materialTaco))
      const dibujo = new THREE.Mesh(geometriaDibujo, M.negro)
      dibujo.position.y = 0.027
      taco.add(dibujo)
      grupo.add(taco)
      return taco
    })

    robot.add(conSombra(grupo))
    return { tacos, ruedas }
  })

  let avance = 0
  function moverOrugas(cuanto) {
    avance += cuanto
    orugas.forEach(({ tacos, ruedas }) => {
      tacos.forEach((taco, i) => {
        const p = puntoDeOruga(avance + (i * perimetro) / TACOS)
        taco.position.set(0, p.y - p.dz * 0.02, p.z + p.dy * 0.02)
        taco.rotation.x = Math.atan2(-p.dy, p.dz) + Math.PI
      })
      ruedas.forEach((w) => { w.objeto.rotation.x = avance / w.r })
    })
  }
  moverOrugas(0)
  return moverOrugas
}

// ---------- Cuerpo: caja amarilla, falda, esquinas y techo ----------
function armarCuerpo(robot, M) {
  const cuerpo = cajaRedondeada(CUERPO_ANCHO, CUERPO_ALTO, CUERPO_FONDO, 0.03, M.amarillo)
  cuerpo.position.set(0, CUERPO_Y, 0)
  robot.add(conSombra(cuerpo))

  pieza(robot, new THREE.BoxGeometry(CUERPO_ANCHO + 0.04, 0.07, CUERPO_FONDO + 0.04), M.gris, 0, CUERPO_Y - CUERPO_ALTO / 2 - 0.01, 0)
  pieza(robot, new THREE.BoxGeometry(1.3, 0.1, 0.8), M.gris, 0, 0.62, 0)

  ;[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
    pieza(robot, new THREE.BoxGeometry(0.05, CUERPO_ALTO, 0.05), M.gris, sx * (CUERPO_ANCHO / 2 + 0.02), CUERPO_Y, sz * (CUERPO_FONDO / 2 + 0.02))
  }))

  // Marco negro alrededor del techo y tapa amarilla
  ;[
    [CUERPO_ANCHO + 0.1, 0.06, 0.06, 0, CUERPO_FONDO / 2 + 0.02],
    [CUERPO_ANCHO + 0.1, 0.06, 0.06, 0, -CUERPO_FONDO / 2 - 0.02],
    [0.06, 0.06, CUERPO_FONDO + 0.1, CUERPO_ANCHO / 2 + 0.02, 0],
    [0.06, 0.06, CUERPO_FONDO + 0.1, -CUERPO_ANCHO / 2 - 0.02, 0],
  ].forEach(([ancho, alto, fondo, x, z]) => pieza(robot, new THREE.BoxGeometry(ancho, alto, fondo), M.negro, x, TECHO_Y + 0.02, z))
  pieza(robot, new THREE.BoxGeometry(CUERPO_ANCHO - 0.04, 0.03, CUERPO_FONDO - 0.04), M.amarillo, 0, TECHO_Y + 0.02, 0)
  ;[-0.2, 0.2].forEach((z) => pieza(robot, new THREE.BoxGeometry(CUERPO_ANCHO - 0.1, 0.005, 0.012), M.negro, 0, TECHO_Y + 0.037, z, false))
}

// ---------- Pecho: banda gris, parlante (buzzer) y luz de alerta. Devuelve la luz. ----------
function armarPecho(robot, M) {
  pieza(robot, new THREE.BoxGeometry(CUERPO_ANCHO + 0.06, 0.32, 0.08), new THREE.MeshStandardMaterial({ color: 0xa3a8a0, roughness: 0.6 }), 0, BANDA_Y, FRENTE_Z - 0.02)
  ;[-0.08, 0.08].forEach((dy) => pieza(robot, new THREE.BoxGeometry(CUERPO_ANCHO + 0.07, 0.008, 0.01), M.gris, 0, BANDA_Y + dy, FRENTE_Z + 0.025, false))

  pieza(robot, new THREE.BoxGeometry(0.24, 0.3, 0.06), new THREE.MeshStandardMaterial({ color: 0xbfc3bb, roughness: 0.5 }), -0.3, BANDA_Y - 0.01, FRENTE_Z + 0.03)
  const rejilla = texturaDeCanvas(128, 128, (ctx, ancho, alto) => {
    ctx.fillStyle = '#9ea39a'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.fillStyle = '#222'
    for (let y = 14; y < alto; y += 20) {
      for (let x = 14; x < ancho; x += 20) {
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      }
    }
  })
  pieza(robot, new THREE.PlaneGeometry(0.14, 0.12), new THREE.MeshStandardMaterial({ map: rejilla.textura, roughness: 0.7 }), -0.3, BANDA_Y + 0.05, FRENTE_Z + 0.061, false)
  pieza(robot, new THREE.BoxGeometry(0.08, 0.07, 0.02), M.negro, -0.3, BANDA_Y - 0.08, FRENTE_Z + 0.065, false)
  const baliza = pieza(robot, new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), M.baliza, -0.3, BANDA_Y - 0.08, FRENTE_Z + 0.08, false)
  baliza.rotation.x = Math.PI / 2

  const luz = new THREE.PointLight(0xff2a1a, 0, 3)
  luz.position.set(-0.3, BANDA_Y, FRENTE_Z + 0.4)
  robot.add(luz)
  return luz
}

function dibujarCasco(ctx, x, y, tamano, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, tamano, Math.PI, 0); ctx.fill()
  ctx.fillRect(x - tamano * 1.3, y - tamano * 0.05, tamano * 2.6, tamano * 0.22)
  ctx.fillStyle = 'rgba(0,0,0,.18)'
  ctx.fillRect(x - tamano * 0.12, y - tamano, tamano * 0.24, tamano)
}

const LETRA = '"IBM Plex Sans", sans-serif'

// Lo que muestra la pantallita según el modo. ok, escaneando y sin_casco son las del render original;
// espera, emergencia y apagado se agregaron para mostrar el estado real del robot.
const PANTALLAS = {
  ok: (ctx) => {
    ctx.fillStyle = '#0f6b35'; ctx.fillRect(0, 0, 240, 240)
    dibujarCasco(ctx, 120, 110, 52, '#f2d000')
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(150, 128); ctx.lineTo(166, 146); ctx.lineTo(196, 112); ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 34px ${LETRA}`; ctx.fillText('CASCO OK', 120, 192)
  },
  escaneando: (ctx) => {
    ctx.fillStyle = '#123a8c'; ctx.fillRect(0, 0, 240, 240)
    ctx.strokeStyle = '#7fb0ff'; ctx.lineWidth = 6
    ;[30, 55, 80].forEach((r) => { ctx.beginPath(); ctx.arc(120, 105, r, 0, Math.PI * 2); ctx.stroke() })
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(120, 105, 12, 0, Math.PI * 2); ctx.fill()
    ctx.font = `700 28px ${LETRA}`; ctx.fillText('ESCANEANDO', 120, 208)
  },
  espera: (ctx) => {
    ctx.fillStyle = '#3f4650'; ctx.fillRect(0, 0, 240, 240)
    dibujarCasco(ctx, 120, 110, 52, '#c9ccc6')
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 34px ${LETRA}`; ctx.fillText('EN ESPERA', 120, 192)
  },
  sin_casco: (ctx) => {
    ctx.fillStyle = '#b3161c'; ctx.fillRect(0, 0, 240, 240)
    dibujarCasco(ctx, 120, 108, 52, '#f2d000')
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(120, 90, 78, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(65, 35); ctx.lineTo(175, 145); ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 32px ${LETRA}`; ctx.fillText('SIN CASCO!', 120, 196)
    ctx.font = `600 20px ${LETRA}`; ctx.fillText('MAQUINA PARADA', 120, 224)
  },
  emergencia: (ctx) => {
    ctx.fillStyle = '#b3161c'; ctx.fillRect(0, 0, 240, 240)
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 96px ${LETRA}`; ctx.fillText('!', 120, 96)
    ctx.font = `700 30px ${LETRA}`; ctx.fillText('EMERGENCIA', 120, 192)
  },
  apagado: (ctx) => {
    ctx.fillStyle = '#0b0c0d'; ctx.fillRect(0, 0, 240, 240)
  },
}

// ---------- Pantalla del frente. Devuelve la función que la redibuja. ----------
function armarPantalla(robot, M) {
  const X = 0.2
  const Y = BANDA_Y
  const Z = FRENTE_Z + 0.03
  pieza(robot, new THREE.BoxGeometry(0.27, 0.31, 0.025), M.placaAzul, X, Y, Z)
  ;[-0.11, 0.11].forEach((dx) => [-0.13, 0.13].forEach((dy) => {
    const tornillo = pieza(robot, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12), M.acero, X + dx, Y + dy, Z + 0.004, false)
    tornillo.rotation.x = Math.PI / 2
  }))
  for (let i = 0; i < 7; i++) pieza(robot, new THREE.BoxGeometry(0.012, 0.03, 0.012), M.acero, X - 0.07 + i * 0.024, Y + 0.16, Z, false)
  pieza(robot, new THREE.BoxGeometry(0.22, 0.21, 0.02), M.negro, X, Y + 0.005, Z + 0.02, false)

  const { textura, ctx } = texturaDeCanvas(240, 240)
  pieza(robot, new THREE.PlaneGeometry(0.19, 0.19), new THREE.MeshBasicMaterial({ map: textura }), X, Y + 0.005, Z + 0.031, false)

  return (modo) => {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    PANTALLAS[modo](ctx)
    textura.needsUpdate = true
  }
}

// ---------- Puerta delantera: ranuras y logo ----------
function armarPuerta(robot, M) {
  const arriba = BANDA_Y - 0.17
  const abajo = CUERPO_Y - CUERPO_ALTO / 2 + 0.03
  ;[
    [CUERPO_ANCHO - 0.06, 0.012, 0, arriba],
    [CUERPO_ANCHO - 0.06, 0.012, 0, abajo],
    [0.012, arriba - abajo, -(CUERPO_ANCHO / 2 - 0.03), (arriba + abajo) / 2],
    [0.012, arriba - abajo, CUERPO_ANCHO / 2 - 0.03, (arriba + abajo) / 2],
  ].forEach(([ancho, alto, x, y]) => pieza(robot, new THREE.BoxGeometry(ancho, alto, 0.01), M.negro, x, y, FRENTE_Z - 0.025, false))

  const materialRanura = new THREE.MeshStandardMaterial({ color: 0x8a6a00, roughness: 0.8 })
  ;[-0.3, 0, 0.3].forEach((x) => pieza(robot, new THREE.BoxGeometry(0.035, 0.2, 0.02), materialRanura, x, arriba - 0.17, FRENTE_Z - 0.025, false))

  const logo = texturaDeCanvas(512, 128, (ctx, ancho, alto) => {
    ctx.clearRect(0, 0, ancho, alto)
    ctx.fillStyle = '#1b1b1b'
    ctx.font = '400 96px "Archivo Black", "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SMAT', ancho / 2 - 30, alto / 2 + 4)
    ctx.fillStyle = '#d7262b'
    ctx.beginPath(); ctx.arc(ancho / 2 + 160, alto / 2, 16, 0, Math.PI * 2); ctx.fill()
  })
  pieza(robot, new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshStandardMaterial({ map: logo.textura, transparent: true, roughness: 0.6 }), 0.24, abajo + 0.08, FRENTE_Z - 0.018, false)
}

// ---------- Costados: franja de seguridad y disco ----------
function armarCostados(robot, M) {
  const franja = texturaDeCanvas(512, 64, (ctx, ancho, alto) => {
    ctx.fillStyle = '#f1f1ec'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.fillStyle = '#151515'
    for (let x = -alto; x < ancho + alto; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, alto); ctx.lineTo(x + 40, alto); ctx.lineTo(x + 40 + alto, 0); ctx.lineTo(x + alto, 0); ctx.closePath(); ctx.fill()
    }
  })
  const materialFranja = new THREE.MeshStandardMaterial({ map: franja.textura, roughness: 0.6 })
  const materialDisco = new THREE.MeshStandardMaterial({ color: 0xd9a400, roughness: 0.6 })
  ;[-1, 1].forEach((lado) => {
    const x = lado * (CUERPO_ANCHO / 2 + 0.035)
    pieza(robot, new THREE.BoxGeometry(0.03, 0.1, 0.56), M.gris, x, BANDA_Y + 0.03, 0.12)
    const tira = pieza(robot, new THREE.PlaneGeometry(0.52, 0.08), materialFranja, x + lado * 0.016, BANDA_Y + 0.03, 0.12, false)
    tira.rotation.y = (lado * Math.PI) / 2

    const discoX = lado * (CUERPO_ANCHO / 2 + 0.025)
    const disco = pieza(robot, new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), M.amarillo, discoX, CUERPO_Y - 0.12, -0.25)
    disco.rotation.z = Math.PI / 2
    const adentro = pieza(robot, new THREE.CylinderGeometry(0.07, 0.07, 0.035, 24), materialDisco, discoX, CUERPO_Y - 0.12, -0.25, false)
    adentro.rotation.z = Math.PI / 2
    pieza(robot, new THREE.BoxGeometry(0.01, 0.012, 0.5), M.negro, lado * (CUERPO_ANCHO / 2 + 0.03), CUERPO_Y - 0.33, 0.12, false)
  })
}

// ---------- Espalda: dos pistones amarillos ----------
function armarEspalda(robot, M) {
  pieza(robot, new THREE.BoxGeometry(0.7, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: 0xc99600, roughness: 0.7 }), 0, CUERPO_Y - 0.1, ESPALDA_Z + 0.02, false)
  ;[-0.22, 0.22].forEach((x) => {
    pieza(robot, new THREE.CylinderGeometry(0.05, 0.05, 0.36, 20), M.amarillo, x, CUERPO_Y - 0.1, ESPALDA_Z - 0.02)
    ;[-0.2, 0.2].forEach((dy) => pieza(robot, new THREE.BoxGeometry(0.12, 0.04, 0.06), M.amarillo, x, CUERPO_Y - 0.1 + dy, ESPALDA_Z - 0.01))
  })
  const ovalo = pieza(robot, new THREE.CylinderGeometry(0.06, 0.06, 0.01, 24), M.acero, 0, CUERPO_Y + 0.25, ESPALDA_Z - 0.005, false)
  ovalo.scale.set(1.5, 1, 1)
  ovalo.rotation.x = Math.PI / 2
}

// ---------- Brazos: hombro y brazo amarillos, antebrazo gris y pinza ----------
function armarBrazos(robot, M) {
  ;[-1, 1].forEach((lado) => {
    const brazo = new THREE.Group()
    const hombro = pieza(brazo, new THREE.CylinderGeometry(0.07, 0.07, 0.1, 20), M.amarillo, 0, 0, 0, false)
    hombro.rotation.z = Math.PI / 2
    pieza(brazo, new THREE.BoxGeometry(0.1, 0.36, 0.1), M.amarillo, 0, -0.18, 0, false)
    const codo = pieza(brazo, new THREE.CylinderGeometry(0.04, 0.04, 0.11, 16), M.gris, 0, 0, 0, false)
    codo.rotation.z = Math.PI / 2
    pieza(brazo, new THREE.CylinderGeometry(0.035, 0.035, 0.32, 16), M.gris, 0, -0.48, 0, false)

    const mano = new THREE.Group()
    pieza(mano, new THREE.BoxGeometry(0.14, 0.12, 0.12), M.gris, 0, 0, 0, false)
    ;[-0.045, 0, 0.045].forEach((x, i) => {
      const dedo = pieza(mano, new THREE.BoxGeometry(0.03, 0.16, 0.035), M.gris, x, -0.12, i === 1 ? -0.04 : 0.03, false)
      dedo.rotation.x = i === 1 ? 0.25 : -0.25
    })
    mano.position.set(0, -0.68, 0)
    brazo.add(mano)

    brazo.position.set(lado * (CUERPO_ANCHO / 2 + 0.13), BANDA_Y + 0.03, 0.34)
    brazo.rotation.set(-0.75, 0, lado * -0.08)
    robot.add(conSombra(brazo))
  })
}

// ---------- Cuello amarillo y cables de la cámara ----------
function armarCuello(robot, M) {
  const Z = -0.05
  pieza(robot, new THREE.BoxGeometry(0.2, 0.08, 0.22), M.amarillo, 0, TECHO_Y + 0.07, Z)
  const union = pieza(robot, new THREE.CylinderGeometry(0.08, 0.08, 0.22, 20), M.amarillo, 0, TECHO_Y + 0.15, Z)
  union.rotation.z = Math.PI / 2
  const tramo = pieza(robot, new THREE.BoxGeometry(0.1, 0.34, 0.1), M.amarillo, 0, TECHO_Y + 0.3, Z + 0.04)
  tramo.rotation.x = 0.2
  const union2 = pieza(robot, new THREE.CylinderGeometry(0.06, 0.06, 0.16, 18), M.amarillo, 0, TECHO_Y + 0.47, Z + 0.07)
  union2.rotation.z = Math.PI / 2
  pieza(robot, new THREE.BoxGeometry(0.08, 0.22, 0.08), M.gris, 0, TECHO_Y + 0.58, Z + 0.05)
  ;[-1, 1].forEach((lado) => {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * 0.04, TECHO_Y + 0.1, Z - 0.08),
      new THREE.Vector3(lado * 0.09, TECHO_Y + 0.4, Z - 0.1),
      new THREE.Vector3(lado * 0.16, TECHO_Y + 0.66, Z - 0.12),
    ])
    robot.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 20, 0.012, 8), M.negro))
  })
}

// ---------- Cabeza: binoculares con la cámara. Devuelve los materiales que cambian con la alerta. ----------
function armarCabeza(robot, M) {
  const Y = TECHO_Y + 0.8
  const materialAro = new THREE.MeshStandardMaterial({ color: 0xc9ccc6, roughness: 0.4, metalness: 0.3, emissive: 0x000000 })
  const materialVidrio = new THREE.MeshStandardMaterial({ color: 0x2a3640, roughness: 0.05, metalness: 0.7 })
  const materialCabeza = new THREE.MeshStandardMaterial({ color: 0x8c918b, roughness: 0.55, metalness: 0.35 })
  pieza(robot, new THREE.CylinderGeometry(0.06, 0.06, 0.2, 18), materialCabeza, 0, Y, -0.05)

  ;[-1, 1].forEach((lado) => {
    const ojo = new THREE.Group()
    // Perfil de "D": plano arriba y redondeado abajo
    const forma = new THREE.Shape()
    const ancho = 0.34
    const alto = 0.28
    forma.moveTo(-ancho / 2, alto / 2); forma.lineTo(ancho / 2, alto / 2); forma.lineTo(ancho / 2, -alto / 2 + 0.1)
    forma.quadraticCurveTo(ancho / 2, -alto / 2, ancho / 2 - 0.1, -alto / 2); forma.lineTo(-ancho / 2 + 0.1, -alto / 2)
    forma.quadraticCurveTo(-ancho / 2, -alto / 2, -ancho / 2, -alto / 2 + 0.1); forma.closePath()
    const fondo = 0.5
    const carcasa = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: fondo, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }), materialCabeza)
    carcasa.geometry.translate(0, 0, -fondo / 2 - 0.06)
    ojo.add(carcasa)
    pieza(ojo, new THREE.BoxGeometry(ancho - 0.04, alto - 0.06, 0.06), M.gris, 0, 0, -fondo / 2 - 0.1, false)

    const lentes = [[0.125, 0.03, materialAro, 0.215, 36], [0.095, 0.03, materialVidrio, 0.225, 36], [0.05, 0.03, M.lente, 0.235, 24]]
    lentes.forEach(([radio, largo, material, z, lados]) => {
      const lente = pieza(ojo, new THREE.CylinderGeometry(radio, radio, largo, lados), material, 0, -0.01, z, false)
      lente.rotation.x = Math.PI / 2
    })
    pieza(ojo, new THREE.SphereGeometry(0.016, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), -0.04, 0.025, 0.245, false)
    ;[-0.13, 0.13].forEach((x) => {
      const tornillo = pieza(ojo, new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8), M.negro, x, -0.08, 0.22, false)
      tornillo.rotation.x = Math.PI / 2
    })

    ojo.position.set(lado * 0.2, Y, 0)
    ojo.rotation.set(-0.12, lado * -0.1, lado * -0.14)
    robot.add(conSombra(ojo))
  })

  // Lucecita roja de "grabando"
  const materialGrabando = new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 1 })
  pieza(robot, new THREE.SphereGeometry(0.016, 10, 8), materialGrabando, 0.33, Y + 0.1, 0.22, false)
  return { materialAro, materialGrabando }
}

export function crearRobot() {
  const grupo = new THREE.Group()
  const M = {
    amarillo: new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.55 }),
    goma: new THREE.MeshStandardMaterial({ color: 0x2a2d2a, roughness: 0.9 }),
    gris: new THREE.MeshStandardMaterial({ color: 0x6b7069, roughness: 0.5, metalness: 0.3 }),
    acero: new THREE.MeshStandardMaterial({ color: 0xb8bcb4, roughness: 0.3, metalness: 0.8 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x141514, roughness: 0.4 }),
    placaAzul: new THREE.MeshStandardMaterial({ color: 0x1b3a6b, roughness: 0.6 }),
    lente: new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.05, metalness: 0.9 }),
    baliza: new THREE.MeshStandardMaterial({ color: 0xb01818, emissive: 0x000000, roughness: 0.3 }),
  }

  const moverOrugas = armarOrugas(grupo, M)
  armarCuerpo(grupo, M)
  const luzAlerta = armarPecho(grupo, M)
  const dibujarPantalla = armarPantalla(grupo, M)
  armarPuerta(grupo, M)
  armarCostados(grupo, M)
  armarEspalda(grupo, M)
  armarBrazos(grupo, M)
  armarCuello(grupo, M)
  const { materialAro, materialGrabando } = armarCabeza(grupo, M)

  // Color original de cada material, para poder apagar el robot y volver a prenderlo
  const materiales = new Map()
  grupo.traverse((o) => {
    if (o.isMesh && o.material.isMeshStandardMaterial && !materiales.has(o.material)) materiales.set(o.material, o.material.color.clone())
  })

  let pantalla = null
  function ponerPantalla(modo) {
    if (modo === pantalla) return
    pantalla = modo
    dibujarPantalla(modo)
  }

  let apagado = false
  // Sin conexión: el robot se ve gris y sin la luz de "grabando"
  function ponerApagado(valor) {
    if (valor === apagado) return
    apagado = valor
    materiales.forEach((original, material) => {
      material.color.copy(original)
      if (valor) material.color.lerp(GRIS_APAGADO, 0.72)
    })
    materialGrabando.emissiveIntensity = valor ? 0 : 1
  }

  // La baliza y los ojos titilan en rojo. ahora = milisegundos, como los da requestAnimationFrame
  function titilar(ahora) {
    const prendida = Math.sin(ahora / 110) > 0
    M.baliza.color.setHex(0xff2a1a)
    M.baliza.emissive.setHex(prendida ? 0xff2a1a : 0x330000)
    materialAro.emissive.setHex(prendida ? 0x991010 : 0x220000)
    luzAlerta.intensity = prendida ? 2.2 : 0
  }
  function apagarBaliza() {
    M.baliza.color.setHex(0xb01818)
    M.baliza.emissive.setHex(0x000000)
    materialAro.emissive.setHex(0x000000)
    luzAlerta.intensity = 0
  }

  return { grupo, moverOrugas, ponerPantalla, ponerApagado, titilar, apagarBaliza }
}
