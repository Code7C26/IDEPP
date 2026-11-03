// El render del robot en las páginas públicas, con un recorrido de ejemplo y el cartel "Simulación".
import useRobotSimulado from '../../hooks/useRobotSimulado.js'
import VistaRobot3D from '../VistaRobot3D.jsx'

export default function RobotSimulado() {
  const simulacion = useRobotSimulado()
  return <VistaRobot3D {...simulacion} simulada />
}
