// Recorrido de ejemplo para las páginas públicas: no llama al backend ni muestra nada del robot real.
// Cada SEGUNDOS pasa algo: el robot avanza a la zona siguiente y, cada 3 paradas, detecta una falta (la
// zona se pone en rojo y su máquina se detiene). Devuelve lo que necesita VistaRobot3D.
import { useEffect, useState } from 'react'

const SEGUNDOS = 5

const ZONAS = [
  { id: 1, nombre: 'Zona A', maquina: 'Sierra circular', maquina_activa: true, grilla_x: 0, grilla_y: 0, ancho: 3, alto: 2 },
  { id: 2, nombre: 'Zona B', maquina: 'Soldadora MIG', maquina_activa: true, grilla_x: 3, grilla_y: 0, ancho: 3, alto: 2 },
  { id: 3, nombre: 'Zona C', maquina: 'Prensa hidráulica', maquina_activa: true, grilla_x: 0, grilla_y: 2, ancho: 3, alto: 2 },
  { id: 4, nombre: 'Zona D', maquina: 'Autoelevador', maquina_activa: true, grilla_x: 3, grilla_y: 2, ancho: 3, alto: 2 },
]
const RUTA = [1, 2, 4, 3]     // da la vuelta a la planta sin cruzarse

export default function useRobotSimulado() {
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPaso((p) => p + 1), SEGUNDOS * 1000)
    return () => clearInterval(id)
  }, [])

  // De cada 4 pasos, 3 son paradas y el último es la falta, en la misma zona de la parada anterior.
  // Pasos:   0  1  2  3      4  5  6  7
  // Paradas: 0  1  2  2+falta 3  4  5  5+falta
  const alerta = paso % 4 === 3
  const parada = paso - Math.floor((paso + 1) / 4)
  const zona = ZONAS.find((z) => z.id === RUTA[parada % RUTA.length])

  return {
    zonas: ZONAS.map((z) => (alerta && z.id === zona.id ? { ...z, maquina_activa: false } : z)),
    ruta: RUTA,
    alerta,
    alertasPorZona: alerta ? { [zona.id]: 1 } : {},
    robot: { conectado: true, estado: alerta ? 'detenido' : 'recorriendo', zona_actual_id: zona.id, zona_actual: zona.nombre },
    texto: alerta ? `Falta el equipo de protección en ${zona.nombre} · Máquina detenida` : `En ${zona.nombre} · Recorriendo`,
  }
}
