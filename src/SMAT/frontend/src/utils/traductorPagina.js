// Traductor de la página: con el idioma en inglés, pasa al inglés TODO el texto que se ve, no solo lo que usa t().
// Recorre los textos y los atributos que se leen (placeholder, aria-label, title, alt), los busca en el diccionario
// (utils/textos.js) y, si no están tal cual, prueba las reglas para textos que cambian («hace 3 días», «4 alertas»).
// Después queda vigilando: lo que aparece más tarde (avisos, ventanas, gráficos, respuestas del servidor) también
// se traduce. Al volver al español, deja cada texto como estaba.
// Lo que no se traduce: lo escrito por las personas (comentarios, campos de texto) y lo marcado con translate="no".
import { INGLES } from './textos.js'
import { PATRONES } from './textosPatrones.js'

const ATRIBUTOS = ['placeholder', 'aria-label', 'title', 'alt']
const SIN_TRADUCIR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'])

const textos = new WeakMap()       // nodo de texto -> { es, en }
const atributos = new WeakMap()    // elemento -> { atributo: { es, en } }
const vigilados = new Set()        // documentos que se están traduciendo (la página y los renders en iframes)

// La frase en inglés, o null si no hay traducción. Respeta los espacios de los bordes.
export function traducir(texto) {
  const [, antes, frase, despues] = texto.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (!frase) return null
  if (INGLES[frase]) return antes + INGLES[frase] + despues
  for (const [patron, reemplazo] of PATRONES) {
    const partes = frase.match(patron)
    if (partes) return antes + reemplazo(partes, traducirParte) + despues
  }
  return null
}

// Para las reglas: traduce un pedazo (ej. el tipo de falta dentro de «Ver detalle: Sin casco») o lo deja igual
function traducirParte(texto) {
  return traducir(texto) ?? texto
}

function sePuedeTraducir(elemento) {
  return elemento && !SIN_TRADUCIR.has(elemento.tagName) && !elemento.closest('[translate="no"],[contenteditable="true"]')
}

function traducirTexto(nodo) {
  if (!sePuedeTraducir(nodo.parentElement)) return
  const actual = nodo.nodeValue
  const guardado = textos.get(nodo)
  if (guardado && actual === guardado.en) return          // ya está en inglés (es nuestro propio cambio)
  const en = traducir(actual)
  if (en === null || en === actual) return
  textos.set(nodo, { es: actual, en })
  nodo.nodeValue = en
}

function traducirAtributo(elemento, nombre) {
  // En los campos no se toca lo escrito, pero sí la ayuda (placeholder) y el nombre para los lectores de pantalla
  const campo = elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA'
  if (campo ? elemento.closest('[translate="no"]') : !sePuedeTraducir(elemento)) return
  const actual = elemento.getAttribute(nombre)
  if (!actual) return
  const guardados = atributos.get(elemento) || {}
  if (guardados[nombre] && actual === guardados[nombre].en) return
  const en = traducir(actual)
  if (en === null || en === actual) return
  guardados[nombre] = { es: actual, en }
  atributos.set(elemento, guardados)
  elemento.setAttribute(nombre, en)
}

function traducirArbol(raiz) {
  const documento = raiz.ownerDocument || raiz
  const recorrido = documento.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) traducirTexto(nodo)
  const elementos = raiz.querySelectorAll ? [...raiz.querySelectorAll(ATRIBUTOS.map((a) => `[${a}]`).join(','))] : []
  if (raiz.getAttribute) elementos.push(raiz)
  for (const elemento of elementos) for (const nombre of ATRIBUTOS) if (elemento.hasAttribute(nombre)) traducirAtributo(elemento, nombre)
}

function restaurarArbol(raiz) {
  const documento = raiz.ownerDocument || raiz
  const recorrido = documento.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
    const guardado = textos.get(nodo)
    if (guardado && nodo.nodeValue === guardado.en) nodo.nodeValue = guardado.es
    textos.delete(nodo)
  }
  for (const elemento of raiz.querySelectorAll(ATRIBUTOS.map((a) => `[${a}]`).join(','))) {
    const guardados = atributos.get(elemento)
    if (!guardados) continue
    for (const [nombre, { es, en }] of Object.entries(guardados)) if (elemento.getAttribute(nombre) === en) elemento.setAttribute(nombre, es)
    atributos.delete(elemento)
  }
}

// Traduce un documento y lo vigila. Devuelve la función que deja de vigilar y vuelve todo al español.
export function traducirDocumento(documento = document) {
  if (vigilados.has(documento)) return () => {}
  vigilados.add(documento)
  const raiz = documento.documentElement
  traducirArbol(raiz)
  const vigia = new MutationObserver((cambios) => {
    for (const cambio of cambios) {
      if (cambio.type === 'characterData') traducirTexto(cambio.target)
      else if (cambio.type === 'attributes') traducirAtributo(cambio.target, cambio.attributeName)
      else for (const nodo of cambio.addedNodes) {
        if (nodo.nodeType === Node.TEXT_NODE) traducirTexto(nodo)
        else if (nodo.nodeType === Node.ELEMENT_NODE) traducirArbol(nodo)
      }
    }
  })
  vigia.observe(raiz, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS })
  return () => {
    vigia.disconnect()
    vigilados.delete(documento)
    restaurarArbol(raiz)
  }
}
