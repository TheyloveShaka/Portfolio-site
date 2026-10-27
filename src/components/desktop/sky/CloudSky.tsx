import { useEffect, useRef } from 'react'
import { startCloudSky } from './controller'
import type { PaletteOverride } from './config'
import './cloud-sky.css'

export interface CloudSkyProps {
  density?: number
  speed?: number
  layers?: number
  interaction?: boolean | number
  palette?: PaletteOverride
  isNight?: boolean
}

const CloudSky = ({ density = 1, speed = 1, layers, interaction = true, palette, isNight = false }: CloudSkyProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paletteKey = palette ? JSON.stringify(palette) : ''
  const strength = interaction === true ? 1 : interaction === false ? 0 : Math.max(0, interaction)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    return startCloudSky(canvas, {
      density,
      speed,
      layers,
      interaction: strength,
      palette: paletteKey ? (JSON.parse(paletteKey) as PaletteOverride) : undefined,
      isNight,
    })
  }, [density, speed, layers, strength, paletteKey, isNight])

  return (
    <div className="cloud-sky" data-night={isNight ? '' : undefined} aria-hidden="true">
      <canvas ref={canvasRef} className="cloud-sky__canvas" />
    </div>
  )
}

export default CloudSky
