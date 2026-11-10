// Se carga antes de cada render y del juego. Abiertos solos, no hace nada: se ven igual que el original.
// Dentro de la web (en un iframe) los acomoda para convivir con una página larga, sin tocar su código:
//  - fuera de la pantalla se pausan, para no gastar batería
//  - la rueda sigue bajando por la página (zoom con Ctrl + rueda). En los renders, un dedo también
//    (dos dedos giran y hacen zoom); en el juego no, porque se maneja con botones en la pantalla
//  - con ?solo=escena se ve solo la escena y sus botones, sin el título ni los paneles de abajo
//  - le avisa a la página cuánto mide, para que el iframe no tenga barra de scroll propia
(function () {
  if (window.parent === window) return

  const esJuego = location.pathname.includes('patrulla')
  const soloEscena = new URLSearchParams(location.search).get('solo') === 'escena'

  // ---------- Pausa fuera de la pantalla ----------
  const pedirCuadro = window.requestAnimationFrame.bind(window)
  let enPantalla = true
  let esperando = []
  window.requestAnimationFrame = (cuadro) => {
    if (enPantalla) return pedirCuadro(cuadro)
    esperando.push(cuadro)
    return 0
  }
  new IntersectionObserver(([e]) => {
    enPantalla = e.isIntersecting
    if (enPantalla) {
      esperando.forEach((cuadro) => pedirCuadro(cuadro))
      esperando = []
    }
  }).observe(document.documentElement)

  // ---------- Rueda y dedos ----------
  // Se cortan antes de llegar a los controles de la cámara: así el navegador baja por la página
  window.addEventListener('wheel', (e) => { if (!e.ctrlKey) e.stopPropagation() }, { capture: true, passive: true })
  if (!esJuego) {
    const unDedo = (e) => { if (e.touches.length === 1) e.stopPropagation() }
    window.addEventListener('touchstart', unDedo, { capture: true, passive: true })
    window.addEventListener('touchmove', unDedo, { capture: true, passive: true })
  }

  const estilos = document.createElement('style')
  estilos.textContent = (esJuego ? '' : '.stage canvas { touch-action: pan-y !important; }')
    + (soloEscena ? 'header, .below { display: none !important; } body { padding: 0 !important; }' : '')
    + '.state { max-width: calc(100% - 120px); }'   // en el celular, para que no se pise con el reloj
  document.head.appendChild(estilos)

  document.addEventListener('DOMContentLoaded', () => {
    const ayuda = document.querySelector('.hint')
    if (ayuda && !esJuego) {
      ayuda.textContent = window.matchMedia('(pointer: coarse)').matches ? 'dos dedos = girar y zoom' : 'arrastrar = girar · ctrl + rueda = zoom'
    }
    const descripcion = document.querySelector('.sub')
    if (descripcion) descripcion.textContent = descripcion.textContent.replace('usá la rueda', 'usá Ctrl + rueda')

    // ---------- Alto ----------
    const contenido = document.querySelector('.wrap')
    const avisarAlto = () => {
      const estilo = getComputedStyle(document.body)
      const alto = contenido.getBoundingClientRect().height + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)
      window.parent.postMessage({ robot3dAlto: Math.ceil(alto) }, location.origin)
    }
    new ResizeObserver(avisarAlto).observe(contenido)
    avisarAlto()
  })
})()
