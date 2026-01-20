"use client"

import { useEffect, useRef } from "react"

interface WaveParticle {
  x: number
  baseY: number
  y: number
  size: number
  speed: number
  amplitude: number
  frequency: number
  phase: number
  opacity: number
  color: string
  layer: number
}

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: WaveParticle[] = []
    let time = 0

    const colors = [
      "rgba(245, 158, 11, OPACITY)", // Amber/gold
      "rgba(251, 191, 36, OPACITY)", // Bright amber
      "rgba(168, 85, 247, OPACITY)", // Purple
      "rgba(192, 132, 252, OPACITY)", // Light purple
      "rgba(139, 92, 246, OPACITY)", // Violet
      "rgba(255, 255, 255, OPACITY)", // White accent
    ]

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      particles = []
      const particleCount = 150

      for (let i = 0; i < particleCount; i++) {
        const layer = Math.floor(Math.random() * 3) // 0, 1, or 2 for depth layers
        const baseOpacity = layer === 0 ? 0.4 : layer === 1 ? 0.6 : 0.85
        const colorIndex = Math.floor(Math.random() * colors.length)
        
        particles.push({
          x: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          y: 0,
          size: Math.random() * 3 + 2 + layer * 1.5,
          speed: 0.4 + Math.random() * 0.5 + layer * 0.2,
          amplitude: 40 + Math.random() * 60 + layer * 25,
          frequency: 0.002 + Math.random() * 0.002,
          phase: Math.random() * Math.PI * 2,
          opacity: baseOpacity + Math.random() * 0.15,
          color: colors[colorIndex],
          layer,
        })
      }

      // Sort by layer so back particles render first
      particles.sort((a, b) => a.layer - b.layer)
    }

    const drawParticle = (particle: WaveParticle) => {
      const colorWithOpacity = particle.color.replace("OPACITY", particle.opacity.toString())
      
      // Draw glow for all particles (stronger for front layer)
      const glowSize = particle.layer === 2 ? particle.size * 10 : particle.size * 6
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        glowSize
      )
      gradient.addColorStop(0, colorWithOpacity)
      gradient.addColorStop(0.3, particle.color.replace("OPACITY", (particle.opacity * 0.5).toString()))
      gradient.addColorStop(0.6, particle.color.replace("OPACITY", (particle.opacity * 0.2).toString()))
      gradient.addColorStop(1, "transparent")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2)
      ctx.fill()

      // Draw particle core (brighter)
      ctx.fillStyle = particle.color.replace("OPACITY", Math.min(particle.opacity * 1.5, 1).toString())
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    }

    const updateParticle = (particle: WaveParticle) => {
      // Move horizontally
      particle.x += particle.speed

      // Calculate wave Y position using multiple sine waves for complex motion
      const wave1 = Math.sin(particle.x * particle.frequency + particle.phase + time * 0.001)
      const wave2 = Math.sin(particle.x * particle.frequency * 0.5 + particle.phase * 1.3 + time * 0.0015) * 0.5
      const wave3 = Math.sin(particle.x * particle.frequency * 2 + particle.phase * 0.7 + time * 0.0008) * 0.3
      
      particle.y = particle.baseY + (wave1 + wave2 + wave3) * particle.amplitude

      // Wrap around edges
      if (particle.x > canvas.width + 20) {
        particle.x = -20
        particle.baseY = Math.random() * canvas.height
      }
    }

    const animate = () => {
      time++
      
      // Clear with slight fade for trail effect
      ctx.fillStyle = "rgba(15, 5, 32, 0.12)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        updateParticle(particle)
        drawParticle(particle)
      }

      animationId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    
    // Initial clear
    ctx.fillStyle = "#0f0520"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      resizeCanvas()
      createParticles()
      ctx.fillStyle = "#0f0520"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #0f0520 0%, #0a1628 50%, #0f0520 100%)",
        }}
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
    </div>
  )
}
