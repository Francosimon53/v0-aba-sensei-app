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
      "rgba(59, 130, 246, OPACITY)", // Blue
      "rgba(96, 165, 250, OPACITY)", // Light blue
      "rgba(147, 197, 253, OPACITY)", // Lighter blue
      "rgba(156, 163, 175, OPACITY)", // Gray
      "rgba(209, 213, 219, OPACITY)", // Light gray
      "rgba(255, 255, 255, OPACITY)", // White
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
        const baseOpacity = layer === 0 ? 0.15 : layer === 1 ? 0.25 : 0.4
        const colorIndex = Math.floor(Math.random() * colors.length)
        
        particles.push({
          x: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          y: 0,
          size: Math.random() * 2.5 + 0.8 + layer * 0.5,
          speed: 0.3 + Math.random() * 0.4 + layer * 0.15,
          amplitude: 30 + Math.random() * 50 + layer * 20,
          frequency: 0.002 + Math.random() * 0.002,
          phase: Math.random() * Math.PI * 2,
          opacity: baseOpacity + Math.random() * 0.2,
          color: colors[colorIndex],
          layer,
        })
      }

      // Sort by layer so back particles render first
      particles.sort((a, b) => a.layer - b.layer)
    }

    const drawParticle = (particle: WaveParticle) => {
      const colorWithOpacity = particle.color.replace("OPACITY", particle.opacity.toString())
      
      // Draw glow for front layer particles
      if (particle.layer === 2 && particle.opacity > 0.4) {
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 6
        )
        gradient.addColorStop(0, colorWithOpacity)
        gradient.addColorStop(0.4, particle.color.replace("OPACITY", (particle.opacity * 0.3).toString()))
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw particle core
      ctx.fillStyle = colorWithOpacity
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
      ctx.fillStyle = "rgba(10, 15, 25, 0.15)"
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
    ctx.fillStyle = "#0a0015"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      resizeCanvas()
      createParticles()
      ctx.fillStyle = "#0a0015"
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
          background: "linear-gradient(180deg, #0a0f1a 0%, #0d1525 40%, #0a1020 70%, #060a12 100%)",
        }}
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
    </div>
  )
}
